"use server"

import { Redis } from "@upstash/redis"

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

// Helper function to safely ensure array
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
  if (typeof data === "object") {
    console.log(`Data is object, wrapping in array:`, [data])
    return [data]
  }
  console.log(`Data is primitive type, returning empty array`)
  return []
}

// Initialize Redis connection
function getRedisClient() {
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  })
}

// Try multiple Redis operations to get data regardless of type
async function tryMultipleRedisOperations(key: string): Promise<any> {
  const redis = getRedisClient()

  // Try different Redis operations in order of likelihood
  const operations = [
    { name: "GET", fn: () => redis.get(key) },
    { name: "LRANGE", fn: () => redis.lrange(key, 0, -1) },
    { name: "SMEMBERS", fn: () => redis.smembers(key) },
    { name: "HGETALL", fn: () => redis.hgetall(key) },
  ]

  for (const operation of operations) {
    try {
      console.log(`Trying ${operation.name} for key: ${key}`)
      const result = await operation.fn()

      if (result !== null && result !== undefined) {
        console.log(`✅ ${operation.name} succeeded for key ${key}`)
        return result
      }
    } catch (error) {
      const errorMsg = getErrorMessage(error)
      console.log(`❌ ${operation.name} failed for key ${key}: ${errorMsg}`)

      // If it's not a WRONGTYPE error, something else is wrong
      if (!errorMsg.includes("WRONGTYPE")) {
        console.error(`Non-type error for key ${key}:`, errorMsg)
      }
      continue
    }
  }

  console.log(`All operations failed for key ${key}`)
  return null
}

// Safe Redis get operation with multiple attempts
async function safeRedisGet(key: string): Promise<any> {
  try {
    console.log(`Attempting to get value for key: ${key}`)
    const value = await tryMultipleRedisOperations(key)

    if (value !== null && value !== undefined) {
      console.log(`Successfully retrieved value for key ${key}`)
      return value
    }

    console.log(`No value found for key ${key}`)
    return null
  } catch (error) {
    console.error(`Error getting value for key ${key}:`, getErrorMessage(error))
    return null
  }
}

// Safe Redis set members operation
async function safeRedisSmembers(key: string): Promise<string[]> {
  try {
    const redis = getRedisClient()
    console.log(`Attempting to get set members for key: ${key}`)

    const members = await redis.smembers(key)
    if (Array.isArray(members)) {
      console.log(`Successfully retrieved ${members.length} set members for key ${key}`)
      return members
    }
    return []
  } catch (error) {
    console.error(`Error getting set members for key ${key}:`, getErrorMessage(error))
    return []
  }
}

// Get business ad design data
async function getBusinessAdDesignData(businessId: string) {
  try {
    const businessInfoKey = `business:${businessId}:adDesign:businessInfo`
    const businessInfo = await safeRedisGet(businessInfoKey)

    if (businessInfo) {
      const parsedBusinessInfo = safeJsonParse(businessInfo, {})
      console.log(`Found ad design data for business ${businessId}:`, parsedBusinessInfo)
      return {
        businessInfo: parsedBusinessInfo,
      }
    }

    const mainAdDesignKey = `business:${businessId}:adDesign`
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

// Get business service area data
async function getBusinessServiceArea(businessId: string) {
  try {
    console.log(`Getting service area for business ${businessId}`)

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

    let zipCodes: any[] = []
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

    const zipCodeStrings = zipCodes
      .map((z) => (typeof z === "string" ? z : z?.zip))
      .filter(Boolean)
      .map(String)

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

// Get ALL subcategories for a business
async function getAllBusinessSubcategories(businessId: string): Promise<any[]> {
  try {
    console.log(`Getting ALL subcategories for business ${businessId}`)

    const categoriesKey = `business:${businessId}:categories`
    const categoriesData = await safeRedisGet(categoriesKey)

    if (categoriesData) {
      const categories = safeJsonParse(categoriesData, [])
      const categoryArray = ensureArray(categories, `getAllBusinessSubcategories-categories-${businessId}`)

      console.log(`Found ${categoryArray.length} category selections for business ${businessId}:`, categoryArray)

      if (categoryArray.length > 0) {
        return categoryArray
      }
    }

    const allSubcategoriesKey = `business:${businessId}:allSubcategories`
    const allSubcategoriesData = await safeRedisGet(allSubcategoriesKey)

    if (allSubcategoriesData) {
      const subcategories = safeJsonParse(allSubcategoriesData, [])
      const subcategoryArray = ensureArray(subcategories, `getAllBusinessSubcategories-allSub-${businessId}`)

      console.log(`Found ${subcategoryArray.length} allSubcategories for business ${businessId}:`, subcategoryArray)

      if (subcategoryArray.length > 0) {
        return subcategoryArray
      }
    }

    console.log(`No subcategories found for business ${businessId}`)
    return []
  } catch (error) {
    console.error(`Error getting ALL subcategories for business ${businessId}:`, getErrorMessage(error))
    return []
  }
}

// Check if business has windows/doors services
function hasWindowsDoorsServices(subcategories: any[]): boolean {
  if (!Array.isArray(subcategories)) return false

  const windowsDoorsKeywords = [
    "window",
    "door",
    "glass",
    "glazing",
    "locksmith",
    "security film",
    "tinting",
    "curtain",
    "blind",
    "drapery",
    "replacement",
    "installation",
  ]

  return subcategories.some((subcat) => {
    const path = typeof subcat === "string" ? subcat : subcat?.fullPath || subcat?.name || ""
    return windowsDoorsKeywords.some((keyword) => path.toLowerCase().includes(keyword.toLowerCase()))
  })
}

// Main function to get businesses for windows and doors page
export async function getBusinessesForWindowsDoorsPage(): Promise<any[]> {
  try {
    console.log("Loading businesses for Windows and Doors category...")

    // Get businesses from the "Home, Lawn, and Manual Labor" category
    const categoryKey = "category:Home, Lawn, and Manual Labor:businesses"
    const businessIds = await safeRedisSmembers(categoryKey)

    if (!businessIds || businessIds.length === 0) {
      console.log("No businesses found in Home, Lawn, and Manual Labor category")
      return []
    }

    console.log(`Found ${businessIds.length} businesses in Home, Lawn, and Manual Labor category`)

    const businesses: any[] = []

    for (const businessId of businessIds) {
      try {
        const businessData = await safeRedisGet(`business:${businessId}`)
        if (businessData && typeof businessData === "object") {
          // Get ad design data for display name and location
          const adDesignData = await getBusinessAdDesignData(businessId)

          // Get ALL subcategories for this business
          const allSubcategories = await getAllBusinessSubcategories(businessId)

          // Check if this business offers windows/doors services
          if (!hasWindowsDoorsServices(allSubcategories)) {
            console.log(`Business ${businessId} does not offer windows/doors services, skipping`)
            continue
          }

          // Get service area data
          const serviceAreaData = await getBusinessServiceArea(businessId)

          const business = {
            ...businessData,
            id: businessId,
            displayName: adDesignData?.businessInfo?.businessName || businessData.businessName || "Unnamed Business",
            displayCity: adDesignData?.businessInfo?.city || businessData.city,
            displayState: adDesignData?.businessInfo?.state || businessData.state,
            displayPhone: adDesignData?.businessInfo?.phone || businessData.phone,
            zipCode: businessData.zipCode || adDesignData?.businessInfo?.zipCode || "",
            serviceArea: serviceAreaData.zipCodes || [],
            isNationwide: serviceAreaData.isNationwide || false,
            adDesignData: adDesignData,
            subcategories: allSubcategories,
            allSubcategories: allSubcategories,
          }

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

          console.log(`✅ Added windows/doors business: ${business.displayName}`)
          businesses.push(business)
        }
      } catch (error) {
        console.error(`Error fetching business ${businessId}:`, getErrorMessage(error))
        continue
      }
    }

    console.log(`Successfully retrieved ${businesses.length} windows/doors businesses`)
    return businesses
  } catch (error) {
    console.error(`Error getting businesses for windows/doors page:`, getErrorMessage(error))
    return []
  }
}

// Load business photos
export async function loadWindowsDoorsBusinessPhotos(businessId: string): Promise<any[]> {
  try {
    console.log(`Loading photos for business ${businessId}`)
    const photosData = await safeRedisGet(`business:${businessId}:photos`)

    if (!photosData) {
      console.log(`No photos found for business ${businessId}`)
      return []
    }

    // Handle different data types
    if (Array.isArray(photosData)) {
      console.log(`Found ${photosData.length} photos as array for business ${businessId}`)
      return photosData
    }

    if (typeof photosData === "string") {
      const photos = safeJsonParse(photosData, [])
      const photoArray = ensureArray(photos)
      console.log(`Found ${photoArray.length} photos as JSON string for business ${businessId}`)
      return photoArray
    }

    console.log(`Photos data is not in expected format for business ${businessId}`)
    return []
  } catch (error) {
    console.error(`Error loading photos for business ${businessId}:`, getErrorMessage(error))
    return []
  }
}

// Load business reviews with defensive Redis operations
export async function getWindowsDoorsBusinessReviews(businessId: string): Promise<any[]> {
  try {
    console.log(`Loading reviews for business ${businessId}`)
    const reviewsData = await safeRedisGet(`business:${businessId}:reviews`)

    if (!reviewsData) {
      console.log(`No reviews found for business ${businessId}`)
      return []
    }

    // Handle different data types
    if (Array.isArray(reviewsData)) {
      console.log(`Found ${reviewsData.length} reviews as array for business ${businessId}`)
      return reviewsData
    }

    if (typeof reviewsData === "string") {
      const reviews = safeJsonParse(reviewsData, [])
      const reviewArray = ensureArray(reviews)
      console.log(`Found ${reviewArray.length} reviews as JSON string for business ${businessId}`)
      return reviewArray
    }

    if (typeof reviewsData === "object" && reviewsData !== null) {
      // If it's a single review object, wrap it in an array
      console.log(`Found single review object for business ${businessId}`)
      return [reviewsData]
    }

    console.log(`Reviews data is not in expected format for business ${businessId}`)
    return []
  } catch (error) {
    console.error(`Error loading reviews for business ${businessId}:`, getErrorMessage(error))
    return []
  }
}

// Check if business is favorite
export async function checkWindowsDoorsBusinessIsFavorite(businessId: string): Promise<boolean> {
  try {
    // This would need user session logic, for now return false
    return false
  } catch (error) {
    console.error(`Error checking if business ${businessId} is favorite:`, getErrorMessage(error))
    return false
  }
}

// Add business to favorites
export async function addWindowsDoorsBusinessToFavorites(
  businessData: any,
): Promise<{ success: boolean; message: string }> {
  try {
    // This would need user session and favorites logic
    return { success: false, message: "Favorites functionality not implemented in isolated action" }
  } catch (error) {
    console.error(`Error adding business to favorites:`, getErrorMessage(error))
    return { success: false, message: "Failed to add to favorites" }
  }
}

// Get user session
export async function getWindowsDoorsUserSession(): Promise<any> {
  try {
    // This would need session logic
    return null
  } catch (error) {
    console.error(`Error getting user session:`, getErrorMessage(error))
    return null
  }
}
