"use server"

import { redis } from "@/lib/redis"
import { getCurrentBusiness } from "./business-actions"

export interface Coupon {
  id: string
  title: string
  description: string
  code: string
  discount: string
  startDate: string
  expirationDate: string
  size: "small" | "large"
  businessName: string
  terms: string
}

export async function saveBusinessCoupons(businessId: string, coupons: Coupon[]) {
  try {
    // If no businessId is provided, get it from the session
    if (!businessId) {
      const business = await getCurrentBusiness()
      if (!business) {
        return { success: false, error: "No business found in session" }
      }
      businessId = business.id
    }

    // First, delete any existing key to avoid type conflicts
    await redis.del(`business:${businessId}:coupons`)

    // Then set the new value
    await redis.set(`business:${businessId}:coupons`, JSON.stringify(coupons))
    return { success: true }
  } catch (error) {
    console.error("Error saving business coupons:", error)
    return { success: false, error: "Failed to save coupons" }
  }
}

export async function getBusinessCoupons(
  businessId?: string,
): Promise<{ success: boolean; coupons?: Coupon[]; error?: string }> {
  try {
    // If no businessId is provided, get it from the session
    if (!businessId) {
      const business = await getCurrentBusiness()
      if (!business) {
        return { success: true, coupons: [] }
      }
      businessId = business.id
    }

    const key = `business:${businessId}:coupons`

    // Check if the key exists
    const keyExists = await redis.exists(key)
    if (!keyExists) {
      return { success: true, coupons: [] }
    }

    // Use a try-catch approach to handle potential WRONGTYPE errors
    try {
      // Attempt to get the value
      const couponsData = await redis.get(key)

      // If no data found, return empty array
      if (!couponsData) {
        return { success: true, coupons: [] }
      }

      // Parse the JSON string
      try {
        // Make sure we're working with a string
        const dataString = typeof couponsData === "string" ? couponsData : JSON.stringify(couponsData)

        const coupons = JSON.parse(dataString)

        // Validate that it's an array
        if (!Array.isArray(coupons)) {
          console.error("Parsed coupons is not an array")
          await redis.del(key)
          return { success: true, coupons: [] }
        }

        return { success: true, coupons }
      } catch (e) {
        console.error("Error parsing coupons JSON:", e)
        await redis.del(key)
        return { success: true, coupons: [] }
      }
    } catch (error) {
      // If we get here, there was an error with the Redis operation
      console.error("Redis operation error:", error)

      // Check if it's a WRONGTYPE error
      if (error instanceof Error && error.message.includes("WRONGTYPE")) {
        console.log("Detected WRONGTYPE error, deleting key")

        // Delete the problematic key
        try {
          await redis.del(key)
        } catch (delError) {
          console.error("Error deleting key:", delError)
        }
      }

      // Return empty array to allow the application to continue
      return { success: true, coupons: [] }
    }
  } catch (error) {
    console.error("Error getting business coupons:", error)
    return { success: false, error: "Failed to retrieve coupons" }
  }
}

// Add the missing export for getCouponsByBusinessId
export async function getCouponsByBusinessId(businessId: string): Promise<Coupon[]> {
  try {
    const result = await getBusinessCoupons(businessId)

    if (result.success && result.coupons) {
      return result.coupons
    }

    return []
  } catch (error) {
    console.error("Error in getCouponsByBusinessId:", error)
    return []
  }
}
