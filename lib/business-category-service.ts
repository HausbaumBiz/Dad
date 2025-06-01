"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { getCategoryNameForPagePath } from "@/lib/category-mapping"
import type { Business } from "@/lib/definitions"

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "Unknown error occurred"
}

// Helper function to safely parse JSON
function safeJsonParse(data: any, fallback: any = null) {
  try {
    if (typeof data === "string") {
      return JSON.parse(data)
    }
    if (typeof data === "object" && data !== null) {
      return data
    }
    return fallback
  } catch (error) {
    console.error("Error parsing JSON:", error)
    return fallback
  }
}

// Save business categories (simplified - only saves the exact category names)
export async function saveBusinessCategories(businessId: string, selectedCategories: string[]): Promise<boolean> {
  try {
    console.log(`Saving categories for business ${businessId}:`, selectedCategories)

    // Store the exact category names as selected by the business
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategories`, JSON.stringify(selectedCategories))

    // Index the business under each selected category for fast lookup
    for (const categoryName of selectedCategories) {
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${categoryName}:businesses`, businessId)
    }

    console.log(`Successfully saved ${selectedCategories.length} categories for business ${businessId}`)
    return true
  } catch (error) {
    console.error(`Error saving categories for business ${businessId}:`, getErrorMessage(error))
    return false
  }
}

// Get businesses for a specific category page
export async function getBusinessesForCategoryPage(pagePath: string): Promise<Business[]> {
  try {
    console.log(`Getting businesses for page: ${pagePath}`)

    // Get the exact category name for this page
    const categoryName = getCategoryNameForPagePath(pagePath)
    if (!categoryName) {
      console.log(`No category mapping found for page: ${pagePath}`)
      return []
    }

    console.log(`Looking for businesses in category: ${categoryName}`)

    // Get all business IDs that selected this category
    const businessIds = (await kv.smembers(`${KEY_PREFIXES.CATEGORY}${categoryName}:businesses`)) as string[]

    if (!businessIds || businessIds.length === 0) {
      console.log(`No businesses found for category: ${categoryName}`)
      return []
    }

    console.log(`Found ${businessIds.length} businesses for category: ${categoryName}`)

    // Fetch each business's full data
    const businesses: Business[] = []

    for (const businessId of businessIds) {
      try {
        const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
        if (businessData && typeof businessData === "object") {
          // Get ad design data for display name and location
          const adDesignData = await getBusinessAdDesignData(businessId)

          const business = {
            ...businessData,
            id: businessId,
            // Use ad design business name if available, otherwise use registration name
            displayName: adDesignData?.businessInfo?.businessName || businessData.businessName,
            // Use ad design location if available
            displayCity: adDesignData?.businessInfo?.city || businessData.city,
            displayState: adDesignData?.businessInfo?.state || businessData.state,
            displayPhone: adDesignData?.businessInfo?.phone || businessData.phone,
            adDesignData: adDesignData,
          } as Business

          // Create display location
          if (business.displayCity && business.displayState) {
            business.displayLocation = `${business.displayCity}, ${business.displayState}`
          } else if (business.displayCity) {
            business.displayLocation = business.displayCity
          } else if (business.displayState) {
            business.displayLocation = business.displayState
          } else {
            business.displayLocation = `Zip: ${business.zipCode}`
          }

          businesses.push(business)
        }
      } catch (error) {
        console.error(`Error fetching business ${businessId}:`, getErrorMessage(error))
        continue
      }
    }

    console.log(`Successfully retrieved ${businesses.length} businesses for page ${pagePath}`)
    return businesses
  } catch (error) {
    console.error(`Error getting businesses for page ${pagePath}:`, getErrorMessage(error))
    return []
  }
}

// Get business ad design data
async function getBusinessAdDesignData(businessId: string) {
  try {
    const businessInfoKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:businessInfo`
    const businessInfo = await kv.get(businessInfoKey)

    if (businessInfo) {
      return {
        businessInfo: safeJsonParse(businessInfo, {}),
      }
    }

    return null
  } catch (error) {
    console.error(`Error getting ad design for business ${businessId}:`, getErrorMessage(error))
    return null
  }
}

// Get selected categories for a business
export async function getBusinessSelectedCategories(businessId: string): Promise<string[]> {
  try {
    const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategories`)

    if (categoriesData) {
      const categories = safeJsonParse(categoriesData, [])
      return Array.isArray(categories) ? categories : []
    }

    return []
  } catch (error) {
    console.error(`Error getting selected categories for business ${businessId}:`, getErrorMessage(error))
    return []
  }
}

// Remove business from category indexes (for cleanup)
export async function removeBusinessFromCategoryIndexes(businessId: string): Promise<void> {
  try {
    // Get the business's selected categories
    const selectedCategories = await getBusinessSelectedCategories(businessId)

    // Remove business from each category index
    for (const categoryName of selectedCategories) {
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryName}:businesses`, businessId)
    }

    // Remove the business's category selection
    await kv.del(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategories`)

    console.log(`Removed business ${businessId} from all category indexes`)
  } catch (error) {
    console.error(`Error removing business ${businessId} from category indexes:`, getErrorMessage(error))
  }
}
