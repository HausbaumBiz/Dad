"use server"

import { redis, kv } from "@/lib/redis"
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
  businessId?: string
  category?: string
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

// Function to check if a coupon is expired
export async function isCouponExpired(expirationDate: string): Promise<boolean> {
  if (!expirationDate) return false

  // Get current date and time
  const now = new Date()

  // Parse the expiration date (format: YYYY-MM-DD) and set to end of day in LOCAL time
  const [year, month, day] = expirationDate.split("-").map(Number)
  const expDate = new Date(year, month - 1, day, 23, 59, 59, 999) // month is 0-indexed

  // Debug logging (remove in production)
  console.log("Checking expiration:", {
    expirationDate,
    now: now.toLocaleString(),
    expDate: expDate.toLocaleString(),
    isExpired: now > expDate,
  })

  // Only expired if current time is after the end of expiration day
  return now > expDate
}

// Function to get days until expiration (negative if expired)
export async function getDaysUntilExpiration(expirationDate: string): Promise<number> {
  if (!expirationDate) return 0

  // Get today's date at start of day in local time
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Parse expiration date and set to start of day in local time
  const [year, month, day] = expirationDate.split("-").map(Number)
  const expDate = new Date(year, month - 1, day, 0, 0, 0, 0) // month is 0-indexed

  // Calculate difference in days
  const diffTime = expDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Function to reinstate an expired coupon with new expiration date
export async function reinstateCoupon(couponId: string, newExpirationDate: string) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, error: "No business found in session" }
    }

    // Get current coupons
    const result = await getBusinessCoupons(business.id)
    if (!result.success || !result.coupons) {
      return { success: false, error: "Failed to retrieve current coupons" }
    }

    // Find and update the specific coupon
    const updatedCoupons = result.coupons.map((coupon) => {
      if (coupon.id === couponId) {
        return {
          ...coupon,
          expirationDate: newExpirationDate,
          reinstated: true,
          reinstatedAt: new Date().toISOString(),
        }
      }
      return coupon
    })

    // Save updated coupons
    const saveResult = await saveBusinessCoupons(business.id, updatedCoupons)

    if (saveResult.success) {
      return { success: true, message: "Coupon reinstated successfully" }
    } else {
      return { success: false, error: saveResult.error || "Failed to reinstate coupon" }
    }
  } catch (error) {
    console.error("Error reinstating coupon:", error)
    return { success: false, error: "Failed to reinstate coupon" }
  }
}

// Enhanced getCouponsByZipCode function with better category logging
export async function getCouponsByZipCode(zipCode: string): Promise<{
  success: boolean
  coupons: (Coupon & { businessId: string; category?: string })[]
  error?: string
  categoryStats?: { [category: string]: number }
}> {
  try {
    console.log(`Fetching coupons for zip code: ${zipCode}`)

    if (!zipCode) {
      return { success: false, coupons: [], error: "No zip code provided" }
    }

    // Step 1: Find businesses that service this zip code
    const businessesInZip = await kv.smembers(`zipcode:${zipCode}:businesses`)
    const nationwideBusinesses = await kv.smembers("businesses:nationwide")
    const allBusinessIds = [...new Set([...businessesInZip, ...nationwideBusinesses])]

    console.log(
      `Found ${businessesInZip.length} local businesses and ${nationwideBusinesses.length} nationwide businesses for zip code ${zipCode}`,
    )

    // Step 2: Get coupons for each business
    const allCoupons: (Coupon & { businessId: string; category?: string })[] = []
    const categoryStats: { [category: string]: number } = {}

    for (const businessId of allBusinessIds) {
      try {
        // Get business details
        const businessData = await kv.get(`business:${businessId}`)
        let businessName = "Unknown Business"
        let businessCategory = undefined

        if (businessData) {
          if (typeof businessData === "string") {
            try {
              const parsedData = JSON.parse(businessData)
              businessName = parsedData.businessName || "Unknown Business"
              // Try to get category from the main business data first
              businessCategory =
                parsedData.primaryCategory ||
                parsedData.category ||
                (parsedData.categories && Array.isArray(parsedData.categories) && parsedData.categories.length > 0
                  ? parsedData.categories[0]
                  : undefined)
            } catch (e) {
              console.error(`Error parsing business data for ${businessId}:`, e)
            }
          } else if (typeof businessData === "object" && businessData !== null) {
            businessName = businessData.businessName || "Unknown Business"
            businessCategory =
              businessData.primaryCategory ||
              businessData.category ||
              (businessData.categories && Array.isArray(businessData.categories) && businessData.categories.length > 0
                ? businessData.categories[0]
                : undefined)
          }
        }

        // If no category found in main business data, check the dedicated category keys
        if (!businessCategory) {
          try {
            // First try to get selected categories
            const selectedCategoriesData = await kv.get(`business:${businessId}:selectedCategories`)
            if (selectedCategoriesData) {
              let selectedCategories = []
              if (typeof selectedCategoriesData === "string") {
                try {
                  selectedCategories = JSON.parse(selectedCategoriesData)
                } catch (e) {
                  console.error(`Error parsing selected categories for ${businessId}:`, e)
                }
              } else if (Array.isArray(selectedCategoriesData)) {
                selectedCategories = selectedCategoriesData
              }

              if (selectedCategories.length > 0) {
                businessCategory = selectedCategories[0] // Use the first selected category
                console.log(`Found category from selectedCategories for business ${businessId}: ${businessCategory}`)
              }
            }

            // If still no category, try the full categories data
            if (!businessCategory) {
              const categoriesData = await kv.get(`business:${businessId}:categories`)
              if (categoriesData) {
                let categories = []
                if (typeof categoriesData === "string") {
                  try {
                    categories = JSON.parse(categoriesData)
                  } catch (e) {
                    console.error(`Error parsing categories for ${businessId}:`, e)
                  }
                } else if (Array.isArray(categoriesData)) {
                  categories = categoriesData
                }

                if (categories.length > 0) {
                  // Extract category name from the first category object
                  const firstCategory = categories[0]
                  if (typeof firstCategory === "string") {
                    businessCategory = firstCategory
                  } else if (firstCategory && typeof firstCategory === "object") {
                    businessCategory = firstCategory.category || firstCategory.name || firstCategory.fullPath
                  }
                  console.log(`Found category from categories data for business ${businessId}: ${businessCategory}`)
                }
              }
            }
          } catch (categoryError) {
            console.error(`Error fetching categories for business ${businessId}:`, categoryError)
          }
        }

        console.log(`Business ${businessId} (${businessName}) final category: ${businessCategory || "Uncategorized"}`)

        // Get coupons for this business
        const couponsResult = await getBusinessCoupons(businessId)

        if (couponsResult.success && couponsResult.coupons && couponsResult.coupons.length > 0) {
          // Add business ID, business name, and category to each coupon
          const businessCoupons = couponsResult.coupons.map((coupon) => {
            const finalCategory = coupon.category || businessCategory || "Uncategorized"

            // Track category statistics
            categoryStats[finalCategory] = (categoryStats[finalCategory] || 0) + 1

            return {
              ...coupon,
              businessId,
              businessName: coupon.businessName || businessName,
              category: finalCategory,
            }
          })

          allCoupons.push(...businessCoupons)
          console.log(
            `Business ${businessId} (${businessName}) contributed ${businessCoupons.length} coupons in category: ${businessCategory || "Uncategorized"}`,
          )
        }
      } catch (businessError) {
        console.error(`Error processing coupons for business ${businessId}:`, businessError)
        continue
      }
    }

    // Step 3: Filter out expired coupons
    const now = new Date()
    const validCoupons = allCoupons.filter((coupon) => {
      if (!coupon.expirationDate) return true

      const [year, month, day] = coupon.expirationDate.split("-").map(Number)
      const expDate = new Date(year, month - 1, day, 23, 59, 59, 999)
      return now <= expDate
    })

    console.log(`Found ${validCoupons.length} valid coupons for zip code ${zipCode}`)
    console.log(`Category distribution:`, categoryStats)

    return {
      success: true,
      coupons: validCoupons,
      categoryStats,
    }
  } catch (error) {
    console.error(`Error getting coupons for zip code ${zipCode}:`, error)
    return {
      success: false,
      coupons: [],
      error: `Failed to retrieve coupons: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
