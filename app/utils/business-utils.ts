// app/utils/business-utils.ts
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

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

// Helper function to ensure array
function ensureArray(data: any): any[] {
  if (Array.isArray(data)) {
    return data
  }
  if (data === null || data === undefined) {
    return []
  }
  if (typeof data === "object") {
    return [data]
  }
  return []
}

// Get business ad design data
export async function getBusinessAdDesignData(businessId: string) {
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
    console.error(`Error getting ad design for business ${businessId}:`, error)
    return null
  }
}

// Get subcategories for a business
export async function getBusinessSubcategories(businessId: string): Promise<string[]> {
  try {
    // Try to get subcategories from the business-focus page data
    const subcategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`)

    if (subcategoriesData) {
      const subcategories = safeJsonParse(subcategoriesData, [])
      return ensureArray(subcategories)
    }

    return []
  } catch (error) {
    console.error(`Error getting subcategories for business ${businessId}:`, error)
    return []
  }
}
