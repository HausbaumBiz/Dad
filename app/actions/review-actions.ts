"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { getUserById } from "@/lib/user"
import { v4 as uuidv4 } from "uuid"

export interface Review {
  id: string
  businessId: string
  userId: string
  userName: string
  rating: number
  comment: string
  date: string
  verified: boolean
}

interface ReviewSubmission {
  businessId: string
  rating: number
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

    // Create review object
    const review: Review = {
      id: uuidv4(),
      businessId: data.businessId,
      userId: userId,
      userName: `${user.firstName} ${user.lastName.charAt(0)}.`, // Show first name and last initial for privacy
      rating: data.rating,
      comment: data.comment,
      date: new Date().toISOString(),
      verified: true, // User is logged in, so we mark as verified
    }

    // Store review in database
    // 1. Add to business's reviews set
    await kv.sadd(`business:${data.businessId}:reviews`, review.id)

    // 2. Store the review object as a JSON string
    await kv.set(`review:${review.id}`, JSON.stringify(review))

    // 3. Add to user's reviews set (for user profile)
    await kv.sadd(`user:${userId}:reviews`, review.id)

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
    // Get review IDs for the business
    const reviewIds = await kv.smembers(`business:${businessId}:reviews`)

    if (!reviewIds || reviewIds.length === 0) {
      return []
    }

    // Get each review with proper error handling
    const reviews: Review[] = []

    for (const id of reviewIds) {
      try {
        const reviewData = await kv.get(`review:${id}`)

        // Skip if no data found
        if (!reviewData) continue

        // Make sure we're dealing with a string
        const reviewString = typeof reviewData === "string" ? reviewData : JSON.stringify(reviewData)

        // Parse the review data
        const review = JSON.parse(reviewString) as Review
        reviews.push(review)
      } catch (err) {
        console.error(`Error parsing review ${id}:`, err)
        // Continue with other reviews even if one fails
      }
    }

    // Sort by date (newest first)
    return reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error("Error fetching business reviews:", error)
    return []
  }
}

async function updateBusinessRating(businessId: string) {
  try {
    // Get all reviews for the business
    const reviews = await getBusinessReviews(businessId)

    if (reviews.length === 0) {
      return
    }

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = totalRating / reviews.length

    // Check if the business exists and what type it is
    const keyType = await kv.type(`business:${businessId}`)

    // Store the rating in a separate key to avoid type conflicts
    await kv.set(`business:${businessId}:rating`, averageRating.toFixed(1))
    await kv.set(`business:${businessId}:reviewCount`, reviews.length.toString())

    // If the business is a hash, we can also update those fields
    if (keyType === "hash") {
      try {
        await kv.hset(`business:${businessId}`, {
          rating: averageRating.toFixed(1),
          reviewCount: reviews.length.toString(),
        })
      } catch (err) {
        console.error(`Error updating business hash for ${businessId}:`, err)
        // We already stored the rating in separate keys, so we can continue
      }
    }

    return averageRating
  } catch (error) {
    console.error("Error updating business rating:", error)
  }
}
