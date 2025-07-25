"use server"

import { redis } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/user"
import { v4 as uuidv4 } from "uuid"

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

    // Store review in database
    // 1. Add to business's reviews set
    await redis.sadd(`business:${data.businessId}:reviews`, review.id)

    // 2. Store the review object as a JSON string
    await redis.set(`review:${review.id}`, JSON.stringify(review))

    // 3. Add to user's reviews set (for user profile)
    await redis.sadd(`user:${userId}:reviews`, review.id)

    // 4. Update business rating
    await updateBusinessRating(data.businessId)

    // Revalidate relevant paths
    revalidatePath(`/business/${data.businessId}`)
    revalidatePath(`/${data.businessId}`)

    return { success: true }
  } catch (error) {
    console.error("Error submitting review:", error)
    return { success: false, message: "An error occurred while submitting your review" }
  }
}

export async function getBusinessReviews(businessId: string): Promise<Review[]> {
  try {
    console.log(`[getBusinessReviews] Fetching reviews for business ${businessId}`)

    // Get review IDs for the business
    const reviewIds = await redis.smembers(`business:${businessId}:reviews`)
    console.log(`[getBusinessReviews] Found review IDs:`, reviewIds)

    if (!reviewIds || reviewIds.length === 0) {
      console.log(`[getBusinessReviews] No review IDs found for business ${businessId}`)
      return []
    }

    // Get each review with proper error handling
    const reviews: Review[] = []

    for (const id of reviewIds) {
      try {
        console.log(`[getBusinessReviews] Fetching review data for ID: ${id}`)
        const reviewData = await redis.get(`review:${id}`)
        console.log(`[getBusinessReviews] Raw review data for ${id}:`, reviewData)

        // Skip if no data found
        if (!reviewData) {
          console.log(`[getBusinessReviews] No data found for review ${id}`)
          continue
        }

        let review: Review

        // Handle different data types
        if (typeof reviewData === "string") {
          // Data is already a JSON string
          try {
            review = JSON.parse(reviewData)
          } catch (parseError) {
            console.error(`[getBusinessReviews] Error parsing JSON string for review ${id}:`, parseError)
            continue
          }
        } else if (typeof reviewData === "object" && reviewData !== null) {
          // Data is already an object
          review = reviewData as Review
        } else {
          console.error(`[getBusinessReviews] Unexpected data type for review ${id}:`, typeof reviewData)
          continue
        }

        console.log(`[getBusinessReviews] Parsed review for ${id}:`, review)

        // Validate that we have a proper review object
        if (!review || typeof review !== "object") {
          console.error(`[getBusinessReviews] Invalid review object for ${id}:`, review)
          continue
        }

        // Handle legacy reviews that might not have the new structure
        if (!review.ratings) {
          console.log(`[getBusinessReviews] Converting legacy review ${id}`)
          // Convert old single rating to new structure
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
            const ratingsArray = Object.values(review.ratings).filter((r) => typeof r === "number")
            if (ratingsArray.length > 0) {
              review.overallRating = ratingsArray.reduce((sum, rating) => sum + rating, 0) / ratingsArray.length
            } else {
              review.overallRating = 0
            }
          } else {
            review.overallRating = 0
          }
        }

        reviews.push(review)
        console.log(`[getBusinessReviews] Successfully processed review ${id}`)
      } catch (err) {
        console.error(`[getBusinessReviews] Error processing review ${id}:`, err)
        // Continue with other reviews even if one fails
      }
    }

    console.log(`[getBusinessReviews] Final reviews array for business ${businessId}:`, reviews)

    // Sort by date (newest first)
    const sortedReviews = reviews.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime()
      const dateB = new Date(b.date || 0).getTime()
      return dateB - dateA
    })

    console.log(`[getBusinessReviews] Returning ${sortedReviews.length} reviews for business ${businessId}`)
    return sortedReviews
  } catch (error) {
    console.error(`[getBusinessReviews] Error fetching business reviews for ${businessId}:`, error)
    return []
  }
}

// Server action to get business rating data
export async function getBusinessRating(businessId: string): Promise<{ rating: number; reviewCount: number }> {
  try {
    console.log(`[getBusinessRating] Getting rating for business ${businessId}`)

    // Try to get cached rating from Redis first
    const [cachedRating, cachedReviewCount] = await Promise.all([
      redis.get(`business:${businessId}:rating`).catch(() => null),
      redis.get(`business:${businessId}:reviewCount`).catch(() => null),
    ])

    console.log(`[getBusinessRating] Cached data for ${businessId}:`, { cachedRating, cachedReviewCount })

    if (cachedRating !== null && cachedReviewCount !== null) {
      const rating = Number.parseFloat(cachedRating as string) || 0
      const reviewCount = Number.parseInt(cachedReviewCount as string, 10) || 0
      console.log(`[getBusinessRating] Using cached rating for ${businessId}: ${rating} (${reviewCount} reviews)`)
      return { rating, reviewCount }
    }

    // Fall back to calculating from reviews
    console.log(`[getBusinessRating] No cached data, calculating from reviews for ${businessId}`)
    const reviews = await getBusinessReviews(businessId)
    console.log(`[getBusinessRating] Got ${reviews.length} reviews for business ${businessId}`)

    if (!Array.isArray(reviews) || reviews.length === 0) {
      console.log(`[getBusinessRating] No valid reviews found for business ${businessId}`)
      return { rating: 0, reviewCount: 0 }
    }

    // Calculate average from individual reviews
    const validRatings = reviews
      .map((review) => {
        // Try to get rating from different possible fields
        const rating = review.overallRating || review.rating || 0
        return typeof rating === "number" && !isNaN(rating) ? rating : 0
      })
      .filter((rating) => rating > 0)

    console.log(`[getBusinessRating] Valid ratings for ${businessId}:`, validRatings)

    if (validRatings.length === 0) {
      console.log(`[getBusinessRating] No valid ratings found for business ${businessId}`)
      return { rating: 0, reviewCount: 0 }
    }

    const totalRating = validRatings.reduce((sum, rating) => sum + rating, 0)
    const calculatedAverage = totalRating / validRatings.length

    console.log(`[getBusinessRating] Calculated average for ${businessId}: ${calculatedAverage}`)

    // Cache the calculated values
    try {
      await Promise.all([
        redis.set(`business:${businessId}:rating`, calculatedAverage.toString()),
        redis.set(`business:${businessId}:reviewCount`, reviews.length.toString()),
      ])
      console.log(`[getBusinessRating] Cached rating for ${businessId}`)
    } catch (cacheError) {
      console.warn(`[getBusinessRating] Failed to cache rating for business ${businessId}:`, cacheError)
    }

    return {
      rating: Math.round(calculatedAverage * 10) / 10,
      reviewCount: reviews.length,
    }
  } catch (error) {
    console.error(`[getBusinessRating] Error getting rating for business ${businessId}:`, error)
    return { rating: 0, reviewCount: 0 }
  }
}

async function updateBusinessRating(businessId: string) {
  try {
    console.log(`[updateBusinessRating] Updating rating for business ${businessId}`)

    // Get all reviews for the business
    const reviews = await getBusinessReviews(businessId)
    console.log(`[updateBusinessRating] Got ${reviews.length} reviews for business ${businessId}`)

    if (reviews.length === 0) {
      console.log(`[updateBusinessRating] No reviews found, setting rating to 0`)
      // Set rating to 0 if no reviews
      await redis.set(`business:${businessId}:rating`, "0")
      await redis.set(`business:${businessId}:reviewCount`, "0")
      return
    }

    // Calculate average rating using overall ratings
    const validRatings = reviews
      .map((review) => review.overallRating)
      .filter((rating) => typeof rating === "number" && !isNaN(rating) && rating > 0)

    if (validRatings.length === 0) {
      console.log(`[updateBusinessRating] No valid ratings found`)
      await redis.set(`business:${businessId}:rating`, "0")
      await redis.set(`business:${businessId}:reviewCount`, "0")
      return
    }

    const totalRating = validRatings.reduce((sum, rating) => sum + rating, 0)
    const averageRating = totalRating / validRatings.length

    console.log(
      `[updateBusinessRating] Calculated average rating: ${averageRating} from ${validRatings.length} valid ratings`,
    )

    // Store the rating in separate keys
    await redis.set(`business:${businessId}:rating`, averageRating.toFixed(1))
    await redis.set(`business:${businessId}:reviewCount`, reviews.length.toString())

    // Check if the business exists as a hash and update if possible
    try {
      const keyType = await redis.type(`business:${businessId}`)
      if (keyType === "hash") {
        await redis.hset(`business:${businessId}`, {
          rating: averageRating.toFixed(1),
          reviewCount: reviews.length.toString(),
        })
        console.log(`[updateBusinessRating] Updated business hash for ${businessId}`)
      }
    } catch (err) {
      console.warn(`[updateBusinessRating] Could not update business hash for ${businessId}:`, err)
      // We already stored the rating in separate keys, so we can continue
    }

    console.log(
      `[updateBusinessRating] Successfully updated rating for business ${businessId}: ${averageRating.toFixed(1)} (${reviews.length} reviews)`,
    )
    return averageRating
  } catch (error) {
    console.error(`[updateBusinessRating] Error updating business rating for ${businessId}:`, error)
  }
}
