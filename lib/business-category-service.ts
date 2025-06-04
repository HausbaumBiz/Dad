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
  return JSON.stringify(error, Object.getOwnPropertyNames(error))
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
    console.error("Error parsing JSON:", getErrorMessage(error))
    return fallback
  }
}

// Helper function to safely ensure array with detailed logging
function ensureArray(data: any, context = ""): any[] {
  console.log(`ensureArray called with data type: ${typeof data}, context: ${context}`, data)

  if (Array.isArray(data)) {
    console.log(`Data is already an array with length: ${data.length}`)
    return data
  }
  if (data === null || data === undefined) {
    console.log(`Data is null/undefined, returning empty array`)
    return []
  }
  // If it's a single object, wrap it in an array
  if (typeof data === "object") {
    console.log(`Data is object, wrapping in array:`, [data])
    return [data]
  }
  console.log(`Data is primitive type, returning empty array`)
  return []
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
    console.log(`Getting businesses for page: ${pagePath} at ${new Date().toISOString()}`)

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

          // Get subcategories for this business
          const subcategories = await getBusinessSubcategories(businessId)

          const business = {
            ...businessData,
            id: businessId,
            // PRIORITIZE ad design business name over registration name
            displayName: adDesignData?.businessInfo?.businessName || businessData.businessName || "Unnamed Business",
            // Use ad design location if available
            displayCity: adDesignData?.businessInfo?.city || businessData.city,
            displayState: adDesignData?.businessInfo?.state || businessData.state,
            displayPhone: adDesignData?.businessInfo?.phone || businessData.phone,
            adDesignData: adDesignData,
            subcategories: subcategories,
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

          // Log what we're using for the business name
          console.log(
            `Business ${businessId}: Registration name: "${businessData.businessName}", Ad design name: "${adDesignData?.businessInfo?.businessName}", Using: "${business.displayName}"`,
          )

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
    // Try to get the business info from ad design first
    const businessInfoKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:businessInfo`
    const businessInfo = await kv.get(businessInfoKey)

    if (businessInfo) {
      const parsedBusinessInfo = safeJsonParse(businessInfo, {})
      console.log(`Found ad design data for business ${businessId}:`, parsedBusinessInfo)

      return {
        businessInfo: parsedBusinessInfo,
      }
    }

    // If no ad design business info, try to get from the main ad design data
    const mainAdDesignKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`
    const mainAdDesignData = await kv.get(mainAdDesignKey)

    if (mainAdDesignData) {
      const parsedData = safeJsonParse(mainAdDesignData, {})
      if (parsedData && parsedData.businessInfo) {
        console.log(`Found business info in main ad design data for ${businessId}:`, parsedData.businessInfo)
        return {
          businessInfo: parsedData.businessInfo,
        }
      }
    }

    console.log(`No ad design data found for business ${businessId}`)
    return null
  } catch (error) {
    console.error(`Error getting ad design for business ${businessId}:`, getErrorMessage(error))
    return null
  }
}

// Get subcategories for a business
async function getBusinessSubcategories(businessId: string): Promise<string[]> {
  try {
    // Try to get subcategories from the business-focus page data
    const subcategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`)

    if (subcategoriesData) {
      const subcategories = safeJsonParse(subcategoriesData, [])
      return ensureArray(subcategories, `getBusinessSubcategories-${businessId}`)
    }

    return []
  } catch (error) {
    console.error(`Error getting subcategories for business ${businessId}:`, getErrorMessage(error))
    return []
  }
}

// Get selected categories for a business
export async function getBusinessSelectedCategories(businessId: string): Promise<string[]> {
  try {
    const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategories`)

    if (categoriesData) {
      const categories = safeJsonParse(categoriesData, [])
      return ensureArray(categories, `getBusinessSelectedCategories-${businessId}`)
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

// Get businesses for a specific subcategory (optimized to only check relevant businesses)
export async function getBusinessesForSubcategory(subcategoryPath: string): Promise<Business[]> {
  try {
    console.log(`Getting businesses for subcategory: ${subcategoryPath} at ${new Date().toISOString()}`)

    // Extract the main category from the subcategory path
    const mainCategory = subcategoryPath.split(" > ")[0]
    console.log(`Main category extracted: ${mainCategory}`)

    // First, get businesses that are indexed under the main category
    const categoryBusinessIds = (await kv.smembers(`${KEY_PREFIXES.CATEGORY}${mainCategory}:businesses`)) as string[]

    if (!categoryBusinessIds || categoryBusinessIds.length === 0) {
      console.log(`No businesses found for main category: ${mainCategory}`)
      return []
    }

    console.log(`Found ${categoryBusinessIds.length} businesses in main category: ${mainCategory}`)

    const businesses: Business[] = []

    // Only check businesses that are already in the main category
    for (const businessId of categoryBusinessIds) {
      try {
        // Check if this business has the specific subcategory we're looking for
        const hasMatchingSubcategory = await checkBusinessHasSubcategory(businessId, subcategoryPath)

        if (hasMatchingSubcategory) {
          const business = await buildBusinessObject(businessId, [subcategoryPath])
          if (business) {
            businesses.push(business)
            console.log(`✅ Added matching business ${businessId}: ${business.displayName}`)
          }
        }
      } catch (error) {
        console.error(`Error processing business ${businessId}:`, getErrorMessage(error))
        continue
      }
    }

    console.log(`Successfully retrieved ${businesses.length} businesses for subcategory: ${subcategoryPath}`)
    return businesses
  } catch (error) {
    console.error(`Error getting businesses for subcategory ${subcategoryPath}:`, getErrorMessage(error))
    throw new Error(`Error getting businesses for subcategory ${subcategoryPath}: ${getErrorMessage(error)}`)
  }
}

// Helper function to check if a business has a specific subcategory
async function checkBusinessHasSubcategory(businessId: string, targetSubcategoryPath: string): Promise<boolean> {
  try {
    // Check allSubcategories first
    const allSubcategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`)
    if (allSubcategoriesData) {
      const subcategories = ensureArray(
        safeJsonParse(allSubcategoriesData, []),
        `checkSubcategory-allSub-${businessId}`,
      )

      for (const subcat of subcategories) {
        const pathToCheck = typeof subcat === "string" ? subcat : subcat?.fullPath || subcat?.name || ""
        if (pathToCheck && isSubcategoryMatch(pathToCheck, targetSubcategoryPath)) {
          return true
        }
      }
    }

    // Check categories data
    const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
    if (categoriesData) {
      const categories = ensureArray(safeJsonParse(categoriesData, []), `checkSubcategory-categories-${businessId}`)

      for (const cat of categories) {
        const pathToCheck = cat?.fullPath || cat?.name || (typeof cat === "string" ? cat : "")
        if (pathToCheck && isSubcategoryMatch(pathToCheck, targetSubcategoryPath)) {
          return true
        }
      }
    }

    return false
  } catch (error) {
    console.error(`Error checking subcategory for business ${businessId}:`, getErrorMessage(error))
    return false
  }
}

// Helper function to determine if a path matches the target subcategory
function isSubcategoryMatch(pathToCheck: string, targetSubcategoryPath: string): boolean {
  if (!pathToCheck) return false

  // Normalize both paths by removing extra spaces around separators
  const normalizeSpacing = (path: string) => {
    return path
      .replace(/\s*>\s*/g, " > ") // Normalize spacing around >
      .replace(/\s*\/\s*/g, "/") // Normalize spacing around /
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .trim()
  }

  const normalizedPathToCheck = normalizeSpacing(pathToCheck)
  const normalizedTarget = normalizeSpacing(targetSubcategoryPath)

  // Exact match after normalization
  if (normalizedPathToCheck === normalizedTarget) {
    return true
  }

  // Path starts with target (for subcategories under the main category)
  if (normalizedPathToCheck.startsWith(normalizedTarget + " >")) {
    return true
  }

  // Check if the path contains the target as a substring (more flexible matching)
  if (normalizedPathToCheck.includes(normalizedTarget)) {
    return true
  }

  // Special case for Pest Control variations
  if (normalizedTarget.includes("Pest Control") && normalizedPathToCheck.includes("Pest Control")) {
    return true
  }

  // Special case for Lawn, Garden and Snow Removal
  if (
    normalizedTarget.includes("Lawn, Garden and Snow Removal") &&
    normalizedPathToCheck.includes("Lawn, Garden and Snow Removal")
  ) {
    return true
  }

  return false
}

// Helper function to build business object
async function buildBusinessObject(businessId: string, subcategories: any[]): Promise<Business | null> {
  try {
    const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (businessData && typeof businessData === "object") {
      const adDesignData = await getBusinessAdDesignData(businessId)

      const business = {
        ...businessData,
        id: businessId,
        displayName: adDesignData?.businessInfo?.businessName || businessData.businessName || "Unnamed Business",
        displayCity: adDesignData?.businessInfo?.city || businessData.city,
        displayState: adDesignData?.businessInfo?.state || businessData.state,
        displayPhone: adDesignData?.businessInfo?.phone || businessData.phone,
        adDesignData: adDesignData,
        subcategories: ensureArray(subcategories, `buildBusinessObject-${businessId}`),
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

      return business
    }

    return null
  } catch (error) {
    console.error(`Error building business object for ${businessId}:`, getErrorMessage(error))
    return null
  }
}
