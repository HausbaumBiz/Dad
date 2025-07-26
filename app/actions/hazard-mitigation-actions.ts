"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
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

// Helper function to safely get set members from Redis
async function safeRedisSmembers(key: string): Promise<string[]> {
  try {
    console.log(`Attempting to get set members for key: ${key}`)
    const members = await kv.smembers(key)
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

// Helper function to safely get a value from Redis
async function safeRedisGet(key: string): Promise<any> {
  try {
    console.log(`Attempting to get value for key: ${key}`)
    const value = await kv.get(key)
    if (value !== null && value !== undefined) {
      console.log(`Successfully retrieved value for key ${key}`)
      return value
    }
    return null
  } catch (error) {
    console.error(`Error getting value for key ${key}:`, getErrorMessage(error))
    return null
  }
}

// Get business ad design data
async function getBusinessAdDesignData(businessId: string) {
  try {
    const businessInfoKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:businessInfo`
    const businessInfo = await safeRedisGet(businessInfoKey)

    if (businessInfo) {
      const parsedBusinessInfo = safeJsonParse(businessInfo, {})
      console.log(`Found ad design data for business ${businessId}:`, parsedBusinessInfo)
      return {
        businessInfo: parsedBusinessInfo,
      }
    }

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

    const categoriesKey = `${KEY_PREFIXES.BUSINESS}${businessId}:categories`
    const categoriesData = await safeRedisGet(categoriesKey)

    if (categoriesData) {
      const categories = safeJsonParse(categoriesData, [])
      const categoryArray = ensureArray(categories, `getAllBusinessSubcategories-categories-${businessId}`)

      console.log(`Found ${categoryArray.length} category selections for business ${businessId}:`, categoryArray)

      if (categoryArray.length > 0) {
        return categoryArray
      }
    }

    const allSubcategoriesKey = `${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`
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

export async function getHazardMitigationBusinesses() {
  try {
    console.log("Server action: Fetching businesses for hazard mitigation subcategory")

    // Get businesses that are indexed under "Home, Lawn, and Manual Labor" category
    const categoryKey = `${KEY_PREFIXES.CATEGORY}Home, Lawn, and Manual Labor:businesses`
    console.log(`Checking Redis key: ${categoryKey}`)

    const businessIds = await safeRedisSmembers(categoryKey)

    if (!businessIds || businessIds.length === 0) {
      console.log(`No businesses found for category: Home, Lawn, and Manual Labor`)
      return {
        success: true,
        businesses: [],
        count: 0,
      }
    }

    console.log(`Found ${businessIds.length} businesses in Home, Lawn, and Manual Labor category`)

    const businesses: Business[] = []

    // Check each business to see if it has hazard mitigation subcategories
    for (const businessId of businessIds) {
      try {
        // Check if this business has hazard mitigation subcategories
        const hasHazardMitigation = await checkBusinessHasHazardMitigation(businessId)

        if (hasHazardMitigation) {
          const businessData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}`)

          if (businessData && typeof businessData === "object") {
            const adDesignData = await getBusinessAdDesignData(businessId)
            const serviceAreaData = await getBusinessServiceArea(businessId)
            const allSubcategories = await getAllBusinessSubcategories(businessId)

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
            } as Business

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
            console.log(`✅ Added hazard mitigation business ${businessId}: ${business.displayName}`)
          }
        }
      } catch (error) {
        console.error(`Error processing business ${businessId}:`, getErrorMessage(error))
        continue
      }
    }

    console.log(`Server action: Found ${businesses.length} hazard mitigation businesses`)

    return {
      success: true,
      businesses,
      count: businesses.length,
    }
  } catch (error) {
    console.error("Server action: Error fetching businesses for hazard mitigation:", getErrorMessage(error))
    return {
      success: false,
      error: "Failed to fetch businesses",
      businesses: [],
      count: 0,
    }
  }
}

// Helper function to check if a business has hazard mitigation services
async function checkBusinessHasHazardMitigation(businessId: string): Promise<boolean> {
  try {
    const hazardMitigationKeywords = [
      "hazard mitigation",
      "mold remediation",
      "asbestos removal",
      "lead paint removal",
      "water damage restoration",
      "fire damage restoration",
      "radon testing",
      "radon mitigation",
    ]

    // Check categories data
    const categoriesData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
    if (categoriesData) {
      const categories = ensureArray(
        safeJsonParse(categoriesData, []),
        `checkHazardMitigation-categories-${businessId}`,
      )

      for (const cat of categories) {
        const pathToCheck = cat?.fullPath || cat?.name || (typeof cat === "string" ? cat : "")
        if (pathToCheck) {
          const lowerPath = pathToCheck.toLowerCase()
          if (
            lowerPath.includes("hazard mitigation") ||
            hazardMitigationKeywords.some((keyword) => lowerPath.includes(keyword))
          ) {
            console.log(`✅ Business ${businessId} matches hazard mitigation via categories: ${pathToCheck}`)
            return true
          }
        }
      }
    }

    // Check allSubcategories as fallback
    const allSubcategoriesData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`)
    if (allSubcategoriesData) {
      const subcategories = ensureArray(
        safeJsonParse(allSubcategoriesData, []),
        `checkHazardMitigation-allSub-${businessId}`,
      )

      for (const subcat of subcategories) {
        const pathToCheck = typeof subcat === "string" ? subcat : subcat?.fullPath || subcat?.name || ""
        if (pathToCheck) {
          const lowerPath = pathToCheck.toLowerCase()
          if (
            lowerPath.includes("hazard mitigation") ||
            hazardMitigationKeywords.some((keyword) => lowerPath.includes(keyword))
          ) {
            console.log(`✅ Business ${businessId} matches hazard mitigation via allSubcategories: ${pathToCheck}`)
            return true
          }
        }
      }
    }

    return false
  } catch (error) {
    console.error(`Error checking hazard mitigation for business ${businessId}:`, getErrorMessage(error))
    return false
  }
}
