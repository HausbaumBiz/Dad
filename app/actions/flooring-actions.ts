"use server"

import { kv } from "@vercel/kv"

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
  console.log(`ensureArray called with data type: ${typeof data}, context: ${context}`)

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

// Helper function to safely check if a key exists and get its type
async function safeKeyTypeCheck(key: string): Promise<string | null> {
  try {
    try {
      const keyType = await kv.type(key)
      console.log(`Key ${key} has type: ${keyType}`)

      if (keyType === "none" || !keyType) {
        console.log(`Key ${key} does not exist`)
        return null
      }

      return keyType
    } catch (typeError) {
      console.log(`Error getting type for key ${key}, trying alternative approach:`, getErrorMessage(typeError))

      try {
        const value = await kv.get(key)
        if (value === null || value === undefined) {
          console.log(`Key ${key} does not exist (null value)`)
          return null
        }
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

// Helper function to safely get a value from Redis
async function safeRedisGet(key: string): Promise<any> {
  try {
    console.log(`Attempting to get value for key: ${key}`)

    try {
      const value = await kv.get(key)
      if (value !== null && value !== undefined) {
        console.log(`Successfully retrieved value for key ${key} using direct get`)
        return value
      }
    } catch (directError) {
      console.log(`Direct get failed for key ${key}, trying type-specific approach:`, getErrorMessage(directError))
    }

    const keyType = await safeKeyTypeCheck(key)

    if (!keyType) {
      console.log(`Key ${key} does not exist or type check failed`)
      return null
    }

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

// Helper function to safely get set members from Redis
async function safeRedisSmembers(key: string): Promise<string[]> {
  try {
    console.log(`Attempting to get set members for key: ${key}`)

    try {
      const members = await kv.smembers(key)
      if (Array.isArray(members)) {
        console.log(`Successfully retrieved ${members.length} set members for key ${key}`)
        return members
      }
    } catch (directError) {
      console.log(`Direct smembers failed for ${key}:`, getErrorMessage(directError))
    }

    const keyType = await safeKeyTypeCheck(key)
    if (!keyType) {
      console.log(`Key ${key} does not exist`)
      return []
    }

    if (keyType !== "set") {
      console.warn(`Key ${key} has type ${keyType}, expected set. Returning empty array.`)
      return []
    }

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

// Helper function to check if a business has flooring services
function hasFlooringServices(subcategories: any[]): boolean {
  const flooringKeywords = [
    "flooring",
    "hardwood",
    "laminate",
    "tile",
    "carpet",
    "vinyl",
    "floor refinishing",
    "floor installation",
  ]

  return subcategories.some((subcat) => {
    const path = typeof subcat === "string" ? subcat : subcat?.fullPath || subcat?.name || ""
    return flooringKeywords.some((keyword) => path.toLowerCase().includes(keyword.toLowerCase()))
  })
}

// Main function to get businesses for flooring category
export async function getBusinessesForFlooringPage(): Promise<any[]> {
  try {
    console.log(`Getting businesses for flooring category at ${new Date().toISOString()}`)

    // Get businesses from the "Home, Lawn, and Manual Labor" category
    const categoryKey = `category:Home, Lawn, and Manual Labor:businesses`
    console.log(`Checking Redis key: ${categoryKey}`)

    const businessIds = await safeRedisSmembers(categoryKey)

    if (!businessIds || businessIds.length === 0) {
      console.log(`No businesses found for Home, Lawn, and Manual Labor category`)
      return []
    }

    console.log(`Found ${businessIds.length} businesses in Home, Lawn, and Manual Labor category`)

    const businesses: any[] = []

    for (const businessId of businessIds) {
      try {
        const businessData = await safeRedisGet(`business:${businessId}`)
        if (businessData && typeof businessData === "object") {
          // Get subcategories to check if this business offers flooring services
          const allSubcategories = await getAllBusinessSubcategories(businessId)

          // Only include businesses that have flooring-related services
          if (!hasFlooringServices(allSubcategories)) {
            console.log(`❌ Business ${businessId} does not offer flooring services, skipping`)
            continue
          }

          console.log(`✅ Business ${businessId} offers flooring services`)

          const adDesignData = await getBusinessAdDesignData(businessId)
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

          if (business.displayCity && business.displayState) {
            business.displayLocation = `${business.displayCity}, ${business.displayState}`
          } else if (business.displayCity) {
            business.displayLocation = business.displayCity
          } else if (business.displayState) {
            business.displayLocation = business.displayState
          } else {
            business.displayLocation = `Zip: ${business.zipCode}`
          }

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

    console.log(`Successfully retrieved ${businesses.length} flooring businesses`)
    return businesses
  } catch (error) {
    console.error(`Error getting businesses for flooring page:`, getErrorMessage(error))
    return []
  }
}
