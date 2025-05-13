"use server"

import { redis } from "@/lib/redis"
import type { Coupon } from "./coupon-actions"

/**
 * Save global coupon terms to Redis
 */
export async function saveGlobalCouponTerms(
  businessId: string,
  terms: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const key = `business:${businessId}:global:terms`
    await redis.set(key, terms)
    return { success: true }
  } catch (error) {
    console.error("Error saving global coupon terms:", error)
    return { success: false, error: "Failed to save global terms" }
  }
}

/**
 * Get global coupon terms from Redis
 */
export async function getGlobalCouponTerms(
  businessId: string,
): Promise<{ success: boolean; terms?: string; error?: string }> {
  try {
    const key = `business:${businessId}:global:terms`
    const terms = await redis.get(key)

    if (!terms) {
      return { success: false, error: "Global terms not found" }
    }

    return { success: true, terms: terms as string }
  } catch (error) {
    console.error("Error getting global coupon terms:", error)
    return { success: false, error: "Failed to retrieve global terms" }
  }
}

/**
 * Save a list of all coupon IDs for a business
 */
export async function saveCouponIds(
  businessId: string,
  couponIds: string[],
): Promise<{ success: boolean; error?: string }> {
  try {
    // Ensure couponIds is an array
    const idsToSave = Array.isArray(couponIds) ? couponIds : [couponIds].filter(Boolean)
    const key = `business:${businessId}:couponIds`

    // Ensure we're saving a clean JSON array
    await redis.set(key, JSON.stringify(idsToSave))
    return { success: true }
  } catch (error) {
    console.error("Error saving coupon IDs:", error)
    return { success: false, error: "Failed to save coupon IDs" }
  }
}

/**
 * Get coupon IDs from Redis with improved error handling for malformed JSON
 */
export async function getCouponIds(
  businessId: string,
): Promise<{ success: boolean; couponIds?: string[]; error?: string }> {
  try {
    const key = `business:${businessId}:couponIds`
    const idsData = await redis.get(key)

    // If no data exists, return an empty array
    if (!idsData) {
      return { success: true, couponIds: [] }
    }

    // Handle string data
    if (typeof idsData === "string") {
      try {
        // Try to parse the JSON string directly
        const parsedIds = JSON.parse(idsData)

        // If parsedIds is an array, return it
        if (Array.isArray(parsedIds)) {
          return {
            success: true,
            couponIds: parsedIds.map((id) => String(id)),
          }
        }

        // If parsedIds is not an array but a valid value, convert to array
        if (parsedIds !== null && parsedIds !== undefined) {
          return {
            success: true,
            couponIds: [String(parsedIds)],
          }
        }

        // If parsedIds is null or undefined, return empty array
        return { success: true, couponIds: [] }
      } catch (parseError) {
        console.warn("Initial JSON parse failed, attempting cleanup:", parseError)

        // Try to extract a valid JSON array using regex
        const arrayMatch = idsData.match(/\[.*?\]/)
        if (arrayMatch) {
          try {
            const extractedArray = JSON.parse(arrayMatch[0])
            if (Array.isArray(extractedArray)) {
              console.log("Successfully extracted array using regex:", extractedArray)
              return {
                success: true,
                couponIds: extractedArray.map((id) => String(id)),
              }
            }
          } catch (regexParseError) {
            console.warn("Regex extraction failed:", regexParseError)
          }
        }

        // If all parsing attempts fail, extract IDs using a more aggressive approach
        const idRegex = /"([^"]+)"|(\d+)/g
        const matches = [...idsData.matchAll(idRegex)]
        if (matches.length > 0) {
          const extractedIds = matches.map((match) => match[1] || match[2]).filter(Boolean)

          console.log("Extracted IDs using regex:", extractedIds)
          return { success: true, couponIds: extractedIds }
        }

        // If all else fails, return an empty array
        console.warn("All parsing attempts failed, returning empty array")
        return { success: true, couponIds: [] }
      }
    }

    // Handle non-string data (like if Redis returns an object or array directly)
    if (Array.isArray(idsData)) {
      return {
        success: true,
        couponIds: idsData.map((id) => String(id)),
      }
    }

    // For any other type, convert to string and return as single item array
    return {
      success: true,
      couponIds: [String(idsData)],
    }
  } catch (error) {
    console.error("Error getting coupon IDs:", error)
    return { success: false, error: "Failed to retrieve coupon IDs", couponIds: [] }
  }
}

/**
 * Save coupon metadata to Redis
 */
export async function saveCouponMetadata(
  businessId: string,
  couponId: string,
  metadata: Omit<Coupon, "id" | "terms">,
): Promise<{ success: boolean; error?: string }> {
  try {
    const key = `business:${businessId}:coupon:${couponId}:metadata`
    await redis.set(key, JSON.stringify(metadata))
    return { success: true }
  } catch (error) {
    console.error("Error saving coupon metadata:", error)
    return { success: false, error: "Failed to save coupon metadata" }
  }
}

/**
 * Get coupon metadata from Redis
 */
export async function getCouponMetadata(
  businessId: string,
  couponId: string,
): Promise<{ success: boolean; metadata?: Omit<Coupon, "id" | "terms">; error?: string }> {
  try {
    const key = `business:${businessId}:coupon:${couponId}:metadata`
    const metadataData = await redis.get(key)

    if (!metadataData) {
      return { success: false, error: "Metadata not found" }
    }

    if (typeof metadataData === "string") {
      try {
        return { success: true, metadata: JSON.parse(metadataData) }
      } catch (parseError) {
        console.error("Error parsing coupon metadata:", parseError)
        return { success: false, error: "Invalid metadata format" }
      }
    } else {
      // If Redis returns an object directly
      return { success: true, metadata: metadataData as Omit<Coupon, "id" | "terms"> }
    }
  } catch (error) {
    console.error("Error getting coupon metadata:", error)
    return { success: false, error: "Failed to retrieve coupon metadata" }
  }
}

/**
 * Save coupon image ID to Redis
 */
export async function saveCouponImageId(
  businessId: string,
  couponId: string,
  cloudflareImageId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const key = `business:${businessId}:coupon:${couponId}:imageId`
    await redis.set(key, cloudflareImageId)
    return { success: true }
  } catch (error) {
    console.error("Error saving coupon image ID:", error)
    return { success: false, error: "Failed to save coupon image ID" }
  }
}

/**
 * Get coupon image ID from Redis
 */
export async function getCouponImageId(
  businessId: string,
  couponId: string,
): Promise<{ success: boolean; imageId?: string; error?: string }> {
  try {
    const key = `business:${businessId}:coupon:${couponId}:imageId`
    const imageId = await redis.get(key)

    if (!imageId) {
      return { success: false, error: "Image ID not found" }
    }

    return { success: true, imageId: imageId as string }
  } catch (error) {
    console.error("Error getting coupon image ID:", error)
    return { success: false, error: "Failed to retrieve coupon image ID" }
  }
}

/**
 * Delete all coupon data from Redis
 */
export async function deleteCouponData(
  businessId: string,
  couponId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete all keys related to this coupon
    const keys = [
      `business:${businessId}:coupon:${couponId}:metadata`,
      `business:${businessId}:coupon:${couponId}:imageId`,
    ]

    // Delete each key
    for (const key of keys) {
      await redis.del(key)
    }

    // Update the coupon IDs list
    const couponIdsResult = await getCouponIds(businessId)
    if (couponIdsResult.success && couponIdsResult.couponIds) {
      const updatedIds = couponIdsResult.couponIds.filter((id) => id !== couponId)
      await saveCouponIds(businessId, updatedIds)
    }

    return { success: true }
  } catch (error) {
    console.error("Error deleting coupon data:", error)
    return { success: false, error: "Failed to delete coupon data" }
  }
}
