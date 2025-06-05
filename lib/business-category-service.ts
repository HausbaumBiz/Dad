"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { getCategoryNameForPagePath } from "@/lib/category-mapping"
import type { Business } from "@/lib/definitions"
import type { ZipCodeData } from "@/lib/zip-code-types"

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

// COMPLETELY REWRITTEN: Helper function to safely check if a key exists and get its type
async function safeKeyTypeCheck(key: string): Promise<string | null> {
  try {
    // Instead of using kv.exists (which is causing the error),
    // try to get the key type directly
    try {
      const keyType = await kv.type(key)
      console.log(`Key ${key} has type: ${keyType}`)

      // Redis returns "none" for non-existent keys
      if (keyType === "none" || !keyType) {
        console.log(`Key ${key} does not exist`)
        return null
      }

      return keyType
    } catch (typeError) {
      console.log(`Error getting type for key ${key}, trying alternative approach:`, getErrorMessage(typeError))

      // If type check fails, try a direct get to see if key exists
      try {
        const value = await kv.get(key)
        if (value === null || value === undefined) {
          console.log(`Key ${key} does not exist (null value)`)
          return null
        }
        // If we got a value, assume it's a string type
        console.log(`Key ${key} exists and returned a value, assuming string type`)
        return "string"
      } catch (getError) {
        console.log(`Direct get also failed for key ${key}:`, getErrorMessage(getError))
        return null
      }
    }
  } catch (error) {
    console.error(`Error in safeKeyTypeCheck for ${key}:`, getErrorMessage(error))
    return null
  }
}

// SIMPLIFIED: Helper function to safely get a value from Redis
async function safeRedisGet(key: string): Promise<any> {
  try {
    console.log(`Attempting to get value for key: ${key}`)

    // Try direct get first (most common case)
    try {
      const value = await kv.get(key)
      if (value !== null && value !== undefined) {
        console.log(`Successfully retrieved value for key ${key} using direct get`)
        return value
      }
    } catch (directError) {
      console.log(`Direct get failed for key ${key}, trying type-specific approach:`, getErrorMessage(directError))
    }

    // If direct get fails or returns null, try to determine the key type
    const keyType = await safeKeyTypeCheck(key)

    if (!keyType) {
      console.log(`Key ${key} does not exist or type check failed`)
      return null
    }

    // Handle different Redis data types appropriately
    try {
      switch (keyType) {
        case "string":
          return await kv.get(key)

        case "set":
          const setMembers = await kv.smembers(key)
          console.log(`Retrieved set with ${setMembers?.length || 0} members for key ${key}`)
          return setMembers

        case "hash":
          const hashData = await kv.hgetall(key)
          console.log(`Retrieved hash with keys: ${Object.keys(hashData || {}).join(", ")} for key ${key}`)
          return hashData

        case "list":
          const listData = await kv.lrange(key, 0, -1)
          console.log(`Retrieved list with ${listData?.length || 0} items for key ${key}`)
          return listData

        case "zset":
          const zsetData = await kv.zrange(key, 0, -1)
          console.log(`Retrieved sorted set with ${zsetData?.length || 0} items for key ${key}`)
          return zsetData

        default:
          console.warn(`Unsupported Redis data type: ${keyType} for key ${key}`)
          return null
      }
    } catch (typeSpecificError) {
      console.error(`Error retrieving ${keyType} value for key ${key}:`, getErrorMessage(typeSpecificError))
      return null
    }
  } catch (error) {
    console.error(`Error getting value for key ${key}:`, getErrorMessage(error))
    return null
  }
}

// SIMPLIFIED: Helper function to safely get set members from Redis
async function safeRedisSmembers(key: string): Promise<string[]> {
  try {
    console.log(`Attempting to get set members for key: ${key}`)

    // Try direct smembers first
    try {
      const members = await kv.smembers(key)
      if (Array.isArray(members)) {
        console.log(`Successfully retrieved ${members.length} set members for key ${key}`)
        return members
      }
    } catch (directError) {
      console.log(`Direct smembers failed for ${key}:`, getErrorMessage(directError))
    }

    // If direct approach fails, check if it's actually a set
    const keyType = await safeKeyTypeCheck(key)
    if (!keyType) {
      console.log(`Key ${key} does not exist`)
      return []
    }

    if (keyType !== "set") {
      console.warn(`Key ${key} has type ${keyType}, expected set. Returning empty array.`)
      return []
    }

    // Try smembers again
    try {
      const members = await kv.smembers(key)
      return Array.isArray(members) ? members : []
    } catch (retryError) {
      console.error(`Retry smembers failed for key ${key}:`, getErrorMessage(retryError))
      return []
    }
  } catch (error) {
    console.error(`Error getting set members for key ${key}:`, getErrorMessage(error))
    return []
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
    console.log(`Getting businesses for page: ${pagePath} at ${new Date().toISOString()}`)

    // Get the exact category name for this page
    const categoryName = getCategoryNameForPagePath(pagePath)
    if (!categoryName) {
      console.log(`No category mapping found for page: ${pagePath}`)
      return []
    }

    console.log(`Looking for businesses in category: ${categoryName}`)

    // Get all business IDs that selected this category
    const businessIds = await safeRedisSmembers(`${KEY_PREFIXES.CATEGORY}${categoryName}:businesses`)

    if (!businessIds || businessIds.length === 0) {
      console.log(`No businesses found for category: ${categoryName}`)
      return []
    }

    console.log(`Found ${businessIds.length} businesses for category: ${categoryName}`)

    // Fetch each business's full data
    const businesses: Business[] = []

    for (const businessId of businessIds) {
      try {
        const businessData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}`)
        if (businessData && typeof businessData === "object") {
          // Get ad design data for display name and location
          const adDesignData = await getBusinessAdDesignData(businessId)

          // Get subcategories for this business
          const subcategories = await getBusinessSubcategories(businessId)

          // Get service area data (zip codes and nationwide flag)
          const serviceAreaData = await getBusinessServiceArea(businessId)

          const business = {
            ...businessData,
            id: businessId,
            // PRIORITIZE ad design business name over registration name
            displayName: adDesignData?.businessInfo?.businessName || businessData.businessName || "Unnamed Business",
            // Use ad design location if available
            displayCity: adDesignData?.businessInfo?.city || businessData.city,
            displayState: adDesignData?.businessInfo?.state || businessData.state,
            displayPhone: adDesignData?.businessInfo?.phone || businessData.phone,
            // Ensure zipCode is available for filtering - prioritize registration zipCode
            zipCode: businessData.zipCode || adDesignData?.businessInfo?.zipCode || "",
            // Add service area data for zip code filtering - THIS IS THE KEY FIX
            serviceArea: serviceAreaData.zipCodes || [], // Pass the actual zip codes array
            isNationwide: serviceAreaData.isNationwide || false,
            adDesignData: adDesignData,
            // Map subcategories to both properties for compatibility
            subcategories: subcategories,
            allSubcategories: subcategories, // Add this line to ensure frontend compatibility
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

          // Safe logging with null checks
          const serviceAreaZips = business.serviceArea || []
          const isNationwide = business.isNationwide || false

          console.log(
            `Business ${businessId}: Registration name: "${businessData.businessName}", Ad design name: "${adDesignData?.businessInfo?.businessName}", Using: "${business.displayName}"`,
          )
          console.log(
            `Business ${businessId} service area: nationwide=${isNationwide}, zipCodes=[${serviceAreaZips.join(", ")}]`,
          )

          businesses.push(business)
        }
      } catch (error) {
        console.error(`Error fetching business ${businessId}:`, getErrorMessage(error))
        continue
      }
    }

    console.log(`Successfully retrieved ${businesses.length} businesses for page ${pagePath}`)
    console.log(
      `[${new Date().toISOString()}] Returning ${businesses.length} businesses:`,
      businesses.map((b) => `  - ${b.id}: "${b.displayName}" (from ${b.adDesignData ? "ad-design" : "registration"})`),
    )
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
    const businessInfo = await safeRedisGet(businessInfoKey)

    if (businessInfo) {
      const parsedBusinessInfo = safeJsonParse(businessInfo, {})
      console.log(`Found ad design data for business ${businessId}:`, parsedBusinessInfo)

      return {
        businessInfo: parsedBusinessInfo,
      }
    }

    // If no ad design business info, try to get from the main ad design data
    const mainAdDesignKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`
    const mainAdDesignData = await safeRedisGet(mainAdDesignKey)

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

// Get business service area data (zip codes and nationwide flag)
async function getBusinessServiceArea(businessId: string) {
  try {
    console.log(`Getting service area for business ${businessId}`)

    // Check if business is nationwide - simplified approach
    let isNationwide = false
    try {
      const nationwideKey = `business:${businessId}:nationwide`
      const nationwideValue = await safeRedisGet(nationwideKey)
      isNationwide = Boolean(nationwideValue)
      console.log(`Business ${businessId} nationwide flag: ${isNationwide}`)
    } catch (error) {
      console.warn(`Error getting nationwide flag for business ${businessId}:`, getErrorMessage(error))
      isNationwide = false
    }

    // Get zip codes - simplified approach
    let zipCodes: ZipCodeData[] = []

    try {
      const zipCodesKey = `business:${businessId}:zipcodes`
      console.log(`Checking zip codes at key: ${zipCodesKey}`)

      const zipCodesData = await safeRedisGet(zipCodesKey)

      if (zipCodesData) {
        if (typeof zipCodesData === "string") {
          try {
            zipCodes = JSON.parse(zipCodesData)
            console.log(`Parsed ${zipCodes.length} zip codes from JSON string for business ${businessId}`)
          } catch (parseError) {
            console.error(`Error parsing ZIP codes JSON for business ${businessId}:`, getErrorMessage(parseError))
          }
        } else if (Array.isArray(zipCodesData)) {
          // Handle case where zipCodesData is already an array
          zipCodes = zipCodesData.map((item) => {
            if (typeof item === "string") {
              return { zip: item, city: "", state: "", latitude: 0, longitude: 0 }
            }
            return item
          })
          console.log(`Got ${zipCodes.length} zip codes from array for business ${businessId}`)
        }
      }
    } catch (error) {
      console.warn(`Error getting ZIP codes for business ${businessId}:`, getErrorMessage(error))
    }

    // If no zip codes yet, try the set key as fallback
    if (zipCodes.length === 0) {
      try {
        const setKey = `business:${businessId}:zipcodes:set`
        console.log(`Trying fallback zip codes set at key: ${setKey}`)

        const zipCodeStrings = await safeRedisSmembers(setKey)
        if (zipCodeStrings && zipCodeStrings.length > 0) {
          zipCodes = zipCodeStrings.map((zip) => ({
            zip,
            city: "",
            state: "",
            latitude: 0,
            longitude: 0,
          }))
          console.log(`Got ${zipCodes.length} zip codes from fallback set for business ${businessId}`)
        }
      } catch (error) {
        console.warn(`Error getting ZIP codes from fallback set for business ${businessId}:`, getErrorMessage(error))
      }
    }

    // Extract just the zip code strings for easier filtering
    const zipCodeStrings = zipCodes
      .map((z) => (typeof z === "string" ? z : z?.zip))
      .filter(Boolean)
      .map(String) // Ensure all values are strings

    console.log(
      `Business ${businessId} service area: nationwide=${isNationwide}, zipCodes=${zipCodeStrings.join(", ")}`,
    )

    return {
      isNationwide,
      zipCodes: zipCodeStrings,
    }
  } catch (error) {
    console.error(`Error getting service area for business ${businessId}:`, getErrorMessage(error))
    return {
      isNationwide: false,
      zipCodes: [],
    }
  }
}

// Get subcategories for a business (enhanced to get from multiple sources)
async function getBusinessSubcategories(businessId: string): Promise<string[]> {
  try {
    const allSubcategories: string[] = []

    // Try to get subcategories from the business-focus page data (most comprehensive)
    const businessFocusData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`)
    if (businessFocusData) {
      const subcategories = safeJsonParse(businessFocusData, [])
      const subcategoryArray = ensureArray(subcategories, `getBusinessSubcategories-businessFocus-${businessId}`)

      // Extract subcategory names from objects or use strings directly
      subcategoryArray.forEach((item: any) => {
        if (typeof item === "string") {
          allSubcategories.push(item)
        } else if (item && typeof item === "object") {
          // Handle different object structures
          const name = item.name || item.subcategory || item.label || item.title
          if (name && typeof name === "string") {
            allSubcategories.push(name)
          }
        }
      })
    }

    // Also try to get from categories data as fallback
    if (allSubcategories.length === 0) {
      const categoriesData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
      if (categoriesData) {
        const categories = safeJsonParse(categoriesData, [])
        const categoryArray = ensureArray(categories, `getBusinessSubcategories-categories-${businessId}`)

        categoryArray.forEach((item: any) => {
          if (typeof item === "string") {
            allSubcategories.push(item)
          } else if (item && typeof item === "object") {
            const name = item.name || item.subcategory || item.label || item.title
            if (name && typeof name === "string") {
              allSubcategories.push(name)
            }
          }
        })
      }
    }

    // Remove duplicates and filter out empty strings
    const uniqueSubcategories = [...new Set(allSubcategories)]
      .filter((sub) => sub && sub.trim().length > 0)
      .map((sub) => sub.trim())

    console.log(
      `Retrieved ${uniqueSubcategories.length} subcategories for business ${businessId}:`,
      uniqueSubcategories,
    )

    return uniqueSubcategories
  } catch (error) {
    console.error(`Error getting subcategories for business ${businessId}:`, getErrorMessage(error))
    return []
  }
}

// Get selected categories for a business
export async function getBusinessSelectedCategories(businessId: string): Promise<string[]> {
  try {
    const categoriesData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategories`)

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
    const categoryBusinessIds = await safeRedisSmembers(`${KEY_PREFIXES.CATEGORY}${mainCategory}:businesses`)

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
    const allSubcategoriesData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`)
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
    const categoriesData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
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
    const businessData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (businessData && typeof businessData === "object") {
      const adDesignData = await getBusinessAdDesignData(businessId)

      // Get service area data (zip codes and nationwide flag)
      const serviceAreaData = await getBusinessServiceArea(businessId)

      const business = {
        ...businessData,
        id: businessId,
        displayName: adDesignData?.businessInfo?.businessName || businessData.businessName || "Unnamed Business",
        displayCity: adDesignData?.businessInfo?.city || businessData.city,
        displayState: adDesignData?.businessInfo?.state || businessData.state,
        displayPhone: adDesignData?.businessInfo?.phone || businessData.phone,
        // Ensure zipCode is available for filtering - prioritize registration zipCode
        zipCode: businessData.zipCode || adDesignData?.businessInfo?.zipCode || "",
        // Add service area data for zip code filtering
        serviceArea: serviceAreaData.zipCodes || [], // Pass the actual zip codes array
        isNationwide: serviceAreaData.isNationwide || false,
        adDesignData: adDesignData,
        subcategories: ensureArray(subcategories, `buildBusinessObject-${businessId}`),
      } as Business

      // Create display location
      if (business.displayCity && business.displayState) {
        business.displayLocation = `${business.displayCity}, ${business.displayState}`
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
