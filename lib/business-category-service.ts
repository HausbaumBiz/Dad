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

// Get businesses for a specific subcategory (updated to handle category selection objects)
export async function getBusinessesForSubcategory(subcategoryPath: string): Promise<Business[]> {
  try {
    console.log(`Getting businesses for subcategory: ${subcategoryPath} at ${new Date().toISOString()}`)

    // Get all business IDs from Redis - check both allSubcategories and categories keys
    const allSubcategoriesKeys = await kv.keys(`${KEY_PREFIXES.BUSINESS}*:allSubcategories`)
    const categoriesKeys = await kv.keys(`${KEY_PREFIXES.BUSINESS}*:categories`)

    console.log(
      `Found ${allSubcategoriesKeys.length} allSubcategories keys and ${categoriesKeys.length} categories keys`,
    )

    const businesses: Business[] = []

    // Check allSubcategories first (this might contain string arrays)
    for (const key of allSubcategoriesKeys) {
      try {
        const businessId = key.replace(`${KEY_PREFIXES.BUSINESS}`, "").replace(":allSubcategories", "")
        const subcategoriesData = await kv.get(key)

        const parsedSubcategories = safeJsonParse(subcategoriesData, [])
        const subcategories = ensureArray(parsedSubcategories, `allSubcategories-${businessId}`)

        console.log(`Business ${businessId} subcategories after ensureArray:`, subcategories)

        // Check each subcategory for matches
        let hasMatchingSubcategory = false
        for (const subcat of subcategories) {
          let pathToCheck = ""

          if (typeof subcat === "string") {
            pathToCheck = subcat
          } else if (typeof subcat === "object" && subcat?.fullPath) {
            pathToCheck = subcat.fullPath
          } else if (typeof subcat === "object" && subcat?.name) {
            pathToCheck = subcat.name
          }

          console.log(`Checking path: "${pathToCheck}" against target: "${subcategoryPath}"`)

          if (pathToCheck && (pathToCheck.includes(subcategoryPath) || pathToCheck.includes("Pest Control"))) {
            console.log(`✅ MATCH FOUND for business ${businessId}: "${pathToCheck}"`)
            hasMatchingSubcategory = true
            break
          }
        }

        if (hasMatchingSubcategory) {
          const business = await buildBusinessObject(businessId, subcategories)
          if (business) {
            businesses.push(business)
            console.log(`✅ Added matching business ${businessId} from allSubcategories`)
          }
        }
      } catch (error) {
        console.error(`Error processing allSubcategories from key ${key}:`, getErrorMessage(error))
      }
    }

    // Check categories keys (this contains CategorySelection objects)
    for (const key of categoriesKeys) {
      try {
        const businessId = key.replace(`${KEY_PREFIXES.BUSINESS}`, "").replace(":categories", "")

        // Skip if we already found this business
        if (businesses.some((b) => b.id === businessId)) {
          continue
        }

        const categoriesData = await kv.get(key)
        const parsedCategories = safeJsonParse(categoriesData, [])
        const categories = ensureArray(parsedCategories, `categories-${businessId}`)

        console.log(`Business ${businessId} categories after ensureArray:`, categories)

        // Add extra safety check before using array methods
        if (!Array.isArray(categories)) {
          console.error(`Categories is not an array for ${businessId}:`, typeof categories, categories)
          continue
        }

        // Check each category for matches
        let hasMatchingCategory = false
        for (const cat of categories) {
          let pathToCheck = ""

          if (typeof cat === "object" && cat?.fullPath) {
            pathToCheck = cat.fullPath
          } else if (typeof cat === "object" && cat?.name) {
            pathToCheck = cat.name
          } else if (typeof cat === "string") {
            pathToCheck = cat
          }

          console.log(`Checking category path: "${pathToCheck}" against target: "${subcategoryPath}"`)

          if (pathToCheck && (pathToCheck.includes(subcategoryPath) || pathToCheck.includes("Pest Control"))) {
            console.log(`✅ CATEGORY MATCH FOUND for business ${businessId}: "${pathToCheck}"`)
            hasMatchingCategory = true
            break
          }
        }

        if (hasMatchingCategory) {
          // Extract fullPaths for subcategories - with extra safety
          let fullPaths: string[] = []
          try {
            fullPaths = categories
              .filter((cat) => {
                const path = cat?.fullPath || cat?.name || cat
                return path && (path.includes(subcategoryPath) || path.includes("Pest Control"))
              })
              .map((cat) => cat?.fullPath || cat?.name || cat)
              .filter((path) => path) // Remove any undefined/null values
          } catch (mapError) {
            console.error(`Error in map operation for ${businessId}:`, getErrorMessage(mapError))
            continue
          }

          const business = await buildBusinessObject(businessId, fullPaths)
          if (business) {
            businesses.push(business)
            console.log(`✅ Added matching business ${businessId} from categories`)
          }
        }
      } catch (error) {
        console.error(`Error processing categories from key ${key}:`, getErrorMessage(error))
      }
    }

    console.log(`Successfully retrieved ${businesses.length} businesses for subcategory: ${subcategoryPath}`)
    return businesses
  } catch (error) {
    console.error(`Error getting businesses for subcategory ${subcategoryPath}:`, getErrorMessage(error))
    throw new Error(`Error getting businesses for subcategory ${subcategoryPath}: ${getErrorMessage(error)}`)
  }
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
