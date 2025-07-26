"use server"

import { getRedisPool } from "@/lib/redis-pool"
import { getRedisCache } from "@/lib/redis-cache"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/user"
import { v4 as uuidv4 } from "uuid"
import { ReviewErrorHandler, ReviewSystemError } from "@/lib/review-error-handler"

export interface Review {
  id: string
  businessId: string
  userId: string
  userName: string
  ratings: {
    serviceQuality: number
    costTransparency: number
    communication: number
    expertise: number
    dependability: number
    professionalism: number
  }
  overallRating: number
  comment: string
  date: string
  verified: boolean
}

interface ReviewSubmission {
  businessId: string
  ratings: {
    serviceQuality: number
    costTransparency: number
    communication: number
    expertise: number
    dependability: number
    professionalism: number
  }
  comment: string
}

// Helper function to safely test Redis connection with pooling
async function testRedisConnection(): Promise<boolean> {
  try {
    const pool = getRedisPool()
    const result = await Promise.race([
      pool.withConnection(async (redis) => await redis.ping()),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Redis ping timeout")), 2000)),
    ])
    return result === "PONG"
  } catch (error) {
    console.warn("[Redis] Connection test failed:", error)
    return false
  }
}

export async function submitReview(data: ReviewSubmission) {
  try {
    // Check if user is logged in
    const cookieStore = cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) {
      return { success: false, message: "You must be logged in to submit a review" }
    }

    // Get user info to include in review
    const user = await getUserById(userId)
    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Calculate overall rating as average of all ratings
    const ratingsArray = Object.values(data.ratings)
    const overallRating = ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length

    // Create review object
    const review: Review = {
      id: uuidv4(),
      businessId: data.businessId,
      userId: userId,
      userName: `${user.firstName} ${user.lastName.charAt(0)}.`, // Show first name and last initial for privacy
      ratings: data.ratings,
      overallRating: Math.round(overallRating * 10) / 10, // Round to 1 decimal place
      comment: data.comment,
      date: new Date().toISOString(),
      verified: true, // User is logged in, so we mark as verified
    }

    // Store review in database with retry logic
    const context = {
      businessId: data.businessId,
      operation: "submitReview",
      timestamp: new Date().toISOString(),
      userAgent: "server",
      sessionId: userId,
    }

    await ReviewErrorHandler.withRetry(async () => {
      // Test Redis connection first
      const isConnected = await testRedisConnection()
      if (!isConnected) {
        throw new Error("Redis connection unavailable")
      }

      const pool = getRedisPool()
      await pool.withConnection(async (redis) => {
        // 1. Add to business's reviews set
        await redis.sadd(`business:${data.businessId}:reviews`, review.id)

        // 2. Store the review object as a JSON string
        await redis.set(`review:${review.id}`, JSON.stringify(review))

        // 3. Add to user's reviews set (for user profile)
        await redis.sadd(`user:${userId}:reviews`, review.id)
      })

      // 4. Update business rating
      await updateBusinessRating(data.businessId)
    }, context)

    // Invalidate cache for this business
    const cache = getRedisCache()
    await cache.invalidate(`business:${data.businessId}:reviews`)
    await cache.invalidate(`business:${data.businessId}:rating`)

    // Revalidate relevant paths
    revalidatePath(`/business/${data.businessId}`)
    revalidatePath(`/${data.businessId}`)

    return { success: true }
  } catch (error) {
    console.error("Error submitting review:", error)

    if (error instanceof ReviewSystemError) {
      return {
        success: false,
        message: "Database error. Please try again later.",
        troubleshootingData: error.troubleshootingData,
      }
    }

    return { success: false, message: "An error occurred while submitting your review" }
  }
}

export async function getBusinessReviews(businessId: string): Promise<Review[]> {
  const context = {
    businessId,
    operation: "getBusinessReviews",
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "server",
    sessionId: typeof window !== "undefined" ? sessionStorage.getItem("sessionId") || "unknown" : "server",
  }

  try {
    const cache = getRedisCache()

    // Try to get from cache first
    const cached = await cache.get<Review[]>(`business:${businessId}:reviews:list`)
    if (cached) {
      console.log(`[getBusinessReviews] Cache hit for business ${businessId}`)
      return cached
    }

    return await ReviewErrorHandler.withRetry(
      async () => {
        console.log(`[getBusinessReviews] Fetching reviews for business ${businessId}`)

        // Test Redis connection first with timeout
        const isConnected = await testRedisConnection()
        if (!isConnected) {
          console.warn(`[getBusinessReviews] Redis not available, returning empty reviews`)
          return []
        }

        const pool = getRedisPool()

        // Get review IDs for the business with timeout protection
        let reviewIds: string[] = []
        try {
          reviewIds = await pool.withConnection(async (redis) => {
            const rawReviewIds = await Promise.race([
              redis.smembers(`business:${businessId}:reviews`),
              new Promise((_, reject) => setTimeout(() => reject(new Error("smembers timeout")), 3000)),
            ])

            if (Array.isArray(rawReviewIds)) {
              return rawReviewIds
            } else if (rawReviewIds === null || rawReviewIds === undefined) {
              return []
            } else {
              console.warn(`[getBusinessReviews] Unexpected smembers result:`, typeof rawReviewIds, rawReviewIds)
              return []
            }
          })
        } catch (error) {
          console.error(`[getBusinessReviews] Error getting review IDs:`, error)
          const errorMessage =
            error instanceof Error
              ? error.message
              : typeof error === "string"
                ? error
                : error && typeof error === "object"
                  ? JSON.stringify(error)
                  : "Unknown error"
          throw new Error(`Failed to get review IDs: ${errorMessage}`)
        }

        console.log(`[getBusinessReviews] Found ${reviewIds.length} review IDs:`, reviewIds)

        if (reviewIds.length === 0) {
          console.log(`[getBusinessReviews] No review IDs found for business ${businessId}`)
          // Cache empty result for 1 minute to prevent repeated queries
          await cache.set(`business:${businessId}:reviews:list`, [], 60000)
          return []
        }

        // Fetch reviews in parallel for better performance
        const reviews: Review[] = []
        const batchSize = 5 // Process reviews in batches

        for (let i = 0; i < reviewIds.length; i += batchSize) {
          const batch = reviewIds.slice(i, i + batchSize)

          const batchPromises = batch.map(async (id) => {
            try {
              console.log(`[getBusinessReviews] Fetching review data for ID: ${id}`)

              return await pool.withConnection(async (redis) => {
                const reviewData = await Promise.race([
                  redis.get(`review:${id}`),
                  new Promise((_, reject) => setTimeout(() => reject(new Error("get timeout")), 2000)),
                ])

                console.log(`[getBusinessReviews] Raw review data for ${id}:`, reviewData)

                // Skip if no data found
                if (!reviewData) {
                  console.log(`[getBusinessReviews] No data found for review ${id}`)
                  return null
                }

                let review: Review

                // Handle different data types
                if (typeof reviewData === "string") {
                  try {
                    review = JSON.parse(reviewData)
                  } catch (parseError) {
                    console.error(`[getBusinessReviews] Error parsing JSON string for review ${id}:`, parseError)
                    return null
                  }
                } else if (typeof reviewData === "object" && reviewData !== null) {
                  review = reviewData as Review
                } else {
                  console.error(`[getBusinessReviews] Unexpected data type for review ${id}:`, typeof reviewData)
                  return null
                }

                // Validate that we have a proper review object
                if (!review || typeof review !== "object") {
                  console.error(`[getBusinessReviews] Invalid review object for ${id}:`, review)
                  return null
                }

                // Handle legacy reviews that might not have the new structure
                if (!review.ratings) {
                  console.log(`[getBusinessReviews] Converting legacy review ${id}`)
                  const oldRating = (review as any).rating || 5
                  review.ratings = {
                    serviceQuality: oldRating,
                    costTransparency: oldRating,
                    communication: oldRating,
                    expertise: oldRating,
                    dependability: oldRating,
                    professionalism: oldRating,
                  }
                  review.overallRating = oldRating
                }

                // Ensure overallRating exists
                if (typeof review.overallRating !== "number") {
                  if (review.ratings && typeof review.ratings === "object") {
                    const ratingsValues = Object.values(review.ratings)
                    const validRatings = ratingsValues.filter((r) => typeof r === "number" && !isNaN(r))
                    if (validRatings.length > 0) {
                      review.overallRating = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
                    } else {
                      review.overallRating = 0
                    }
                  } else {
                    review.overallRating = 0
                  }
                }

                console.log(`[getBusinessReviews] Successfully processed review ${id}`)
                return review
              })
            } catch (err) {
              console.error(`[getBusinessReviews] Error processing review ${id}:`, err)
              return null
            }
          })

          const batchResults = await Promise.all(batchPromises)
          reviews.push(...batchResults.filter((review): review is Review => review !== null))
        }

        // Sort by date (newest first)
        const sortedReviews = reviews.sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime()
          const dateB = new Date(b.date || 0).getTime()
          return dateB - dateA
        })

        console.log(`[getBusinessReviews] Returning ${sortedReviews.length} reviews for business ${businessId}`)

        // Cache the results for 5 minutes
        await cache.set(`business:${businessId}:reviews:list`, sortedReviews, 300000)

        return sortedReviews
      },
      context,
      {
        maxAttempts: 2, // Fewer attempts for read operations
        baseDelay: 1000, // Shorter delay
        maxDelay: 3000, // Shorter max delay
        skipRetryOnTypes: ["DATA_ERROR", "TYPE_ERROR", "PARSE_ERROR"],
      },
    )
  } catch (error) {
    console.error(`[getBusinessReviews] Error fetching business reviews for ${businessId}:`, error)

    // If it's our custom error with troubleshooting data, re-throw it
    if (error instanceof ReviewSystemError) {
      throw error
    }

    // For other errors, create troubleshooting data
    const troubleshootingData = {
      timestamp: new Date().toISOString(),
      businessId,
      errorType: "UNKNOWN_ERROR",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      retryAttempts: 0,
      lastAttemptTime: new Date().toISOString(),
      redisStatus: "unknown",
      cacheHit: false,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      errorFrequency: 0,
      networkLatency: 0,
      systemInfo: {
        timestamp: context.timestamp,
        operation: context.operation,
        memoryUsage: null,
      },
    }

    throw new ReviewSystemError(error instanceof Error ? error.message : "Unknown error", troubleshootingData)
  }
}

export async function getBusinessRating(businessId: string): Promise<{ rating: number; reviewCount: number }> {
  const context = {
    businessId,
    operation: "getBusinessRating",
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== "undefined" ? navigator.userAgent : "server",
    sessionId: typeof window !== "undefined" ? sessionStorage.getItem("sessionId") || "unknown" : "server",
  }

  try {
    const cache = getRedisCache()

    // Try to get from cache first
    const cached = await cache.get<{ rating: number; reviewCount: number }>(`business:${businessId}:rating:summary`)
    if (cached) {
      console.log(`[getBusinessRating] Cache hit for business ${businessId}`)
      return cached
    }

    return await ReviewErrorHandler.withRetry(
      async () => {
        console.log(`[getBusinessRating] Getting rating for business ${businessId}`)

        // Test Redis connection first
        const isConnected = await testRedisConnection()
        if (!isConnected) {
          console.warn(`[getBusinessRating] Redis not available, returning default rating`)
          return { rating: 0, reviewCount: 0 }
        }

        const pool = getRedisPool()

        // Try to get cached rating from Redis first
        const [cachedRating, cachedReviewCount] = await pool.withConnection(async (redis) => {
          return await Promise.all([
            redis.get(`business:${businessId}:rating`).catch(() => null),
            redis.get(`business:${businessId}:reviewCount`).catch(() => null),
          ])
        })

        if (cachedRating !== null && cachedReviewCount !== null) {
          const rating = Number.parseFloat(cachedRating as string) || 0
          const reviewCount = Number.parseInt(cachedReviewCount as string, 10) || 0
          console.log(`[getBusinessRating] Using cached rating for ${businessId}: ${rating} (${reviewCount} reviews)`)

          const result = { rating, reviewCount }
          // Cache in memory for faster access
          await cache.set(`business:${businessId}:rating:summary`, result, 300000)
          return result
        }

        // Fall back to calculating from reviews
        console.log(`[getBusinessRating] No cached data, calculating from reviews for ${businessId}`)
        const reviews = await getBusinessReviews(businessId)

        if (!Array.isArray(reviews) || reviews.length === 0) {
          const result = { rating: 0, reviewCount: 0 }
          await cache.set(`business:${businessId}:rating:summary`, result, 60000) // Cache for 1 minute
          return result
        }

        const validRatings = reviews
          .map((review) => review.overallRating || (review as any).rating || 0)
          .filter((rating) => typeof rating === "number" && !isNaN(rating) && rating > 0)

        if (validRatings.length === 0) {
          const result = { rating: 0, reviewCount: 0 }
          await cache.set(`business:${businessId}:rating:summary`, result, 60000)
          return result
        }

        const totalRating = validRatings.reduce((sum, rating) => sum + rating, 0)
        const calculatedAverage = totalRating / validRatings.length

        // Cache the calculated values (with error handling)
        try {
          await pool.withConnection(async (redis) => {
            await Promise.all([
              redis.set(`business:${businessId}:rating`, calculatedAverage.toString()),
              redis.set(`business:${businessId}:reviewCount`, reviews.length.toString()),
            ])
          })
        } catch (cacheError) {
          console.warn(`[getBusinessRating] Failed to cache rating for ${businessId}:`, cacheError)
        }

        const result = {
          rating: Math.round(calculatedAverage * 10) / 10,
          reviewCount: reviews.length,
        }

        // Cache in memory for faster access
        await cache.set(`business:${businessId}:rating:summary`, result, 300000)

        return result
      },
      context,
      {
        maxAttempts: 2,
        baseDelay: 500,
        maxDelay: 2000,
        skipRetryOnTypes: ["DATA_ERROR", "TYPE_ERROR"],
      },
    )
  } catch (error) {
    console.error(`[getBusinessRating] Error getting rating for business ${businessId}:`, error)
    return { rating: 0, reviewCount: 0 }
  }
}

async function updateBusinessRating(businessId: string) {
  const context = {
    businessId,
    operation: "updateBusinessRating",
    timestamp: new Date().toISOString(),
    userAgent: "server",
    sessionId: "system",
  }

  try {
    await ReviewErrorHandler.withRetry(
      async () => {
        console.log(`[updateBusinessRating] Updating rating for business ${businessId}`)

        // Test Redis connection first
        const isConnected = await testRedisConnection()
        if (!isConnected) {
          console.warn(`[updateBusinessRating] Redis not available, skipping rating update`)
          return
        }

        const reviews = await getBusinessReviews(businessId)
        const pool = getRedisPool()

        if (reviews.length === 0) {
          await pool.withConnection(async (redis) => {
            await Promise.all([
              redis.set(`business:${businessId}:rating`, "0").catch(() => {}),
              redis.set(`business:${businessId}:reviewCount`, "0").catch(() => {}),
            ])
          })
          return
        }

        const validRatings = reviews
          .map((review) => review.overallRating)
          .filter((rating) => typeof rating === "number" && !isNaN(rating) && rating > 0)

        if (validRatings.length === 0) {
          await pool.withConnection(async (redis) => {
            await Promise.all([
              redis.set(`business:${businessId}:rating`, "0").catch(() => {}),
              redis.set(`business:${businessId}:reviewCount`, "0").catch(() => {}),
            ])
          })
          return
        }

        const totalRating = validRatings.reduce((sum, rating) => sum + rating, 0)
        const averageRating = totalRating / validRatings.length

        await pool.withConnection(async (redis) => {
          await Promise.all([
            redis.set(`business:${businessId}:rating`, averageRating.toFixed(1)).catch(() => {}),
            redis.set(`business:${businessId}:reviewCount`, reviews.length.toString()).catch(() => {}),
          ])

          // Update business hash if it exists (with error handling)
          try {
            const keyType = await redis.type(`business:${businessId}`)
            if (keyType === "hash") {
              await redis.hset(`business:${businessId}`, {
                rating: averageRating.toFixed(1),
                reviewCount: reviews.length.toString(),
              })
            }
          } catch (err) {
            console.warn(`[updateBusinessRating] Could not update business hash for ${businessId}:`, err)
          }
        })

        return averageRating
      },
      context,
      {
        maxAttempts: 1, // Don't retry rating updates
        skipRetryOnTypes: ["DATA_ERROR", "TYPE_ERROR", "REDIS_ERROR"],
      },
    )
  } catch (error) {
    console.error(`[updateBusinessRating] Error updating business rating for ${businessId}:`, error)
  }
}

// Preload reviews for multiple businesses (for category pages)
export async function preloadBusinessReviews(businessIds: string[]): Promise<void> {
  console.log(`[preloadBusinessReviews] Preloading reviews for ${businessIds.length} businesses`)

  const cache = getRedisCache()

  // Process in batches to avoid overwhelming Redis
  const batchSize = 3
  for (let i = 0; i < businessIds.length; i += batchSize) {
    const batch = businessIds.slice(i, i + batchSize)

    const promises = batch.map(async (businessId) => {
      try {
        // Check if already cached
        const cached = await cache.get<Review[]>(`business:${businessId}:reviews:list`)
        if (cached) {
          return // Already cached
        }

        // Load reviews in background
        await getBusinessReviews(businessId)
      } catch (error) {
        console.warn(`[preloadBusinessReviews] Failed to preload reviews for ${businessId}:`, error)
      }
    })

    await Promise.all(promises)

    // Small delay between batches
    if (i + batchSize < businessIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  console.log(`[preloadBusinessReviews] Completed preloading for ${businessIds.length} businesses`)
}
