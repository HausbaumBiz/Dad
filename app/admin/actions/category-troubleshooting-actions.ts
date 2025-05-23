"use server"

import { kv } from "@vercel/kv"
import { getCategoryPageMapping } from "@/lib/category-data"

export interface BusinessCategoryMapping {
  businessId: string
  businessName: string
  categories: string[]
  primaryCategory: string | null
  mappedPages: string[]
}

export async function getBusinessCategoryMappings(): Promise<BusinessCategoryMapping[]> {
  try {
    console.log("Fetching business category mappings...")

    // Get all business keys from Redis
    const allBusinessKeys = await kv.keys("business:*")
    // Filter out keys that have more than one colon (these are sub-keys like business:id:adDesign)
    const businessKeys = allBusinessKeys.filter((key) => {
      // Count the number of colons in the key
      const colonCount = (key.match(/:/g) || []).length
      // Only include keys with exactly one colon (business:id)
      return colonCount === 1
    })
    console.log(`Filtered ${allBusinessKeys.length} keys down to ${businessKeys.length} main business keys`)

    const categoryPageMapping = getCategoryPageMapping()
    const mappings: BusinessCategoryMapping[] = []

    for (const key of businessKeys) {
      try {
        // First try to get as a regular key-value pair
        let businessData: any = await kv.get(key)

        // If that doesn't work, try as a hash
        if (!businessData) {
          try {
            businessData = await kv.hgetall(key)
          } catch (hashError) {
            console.warn(`Could not retrieve data for ${key} as hash:`, hashError)
            continue
          }
        }

        if (!businessData) {
          console.warn(`No data found for ${key}`)
          continue
        }

        // Handle different data formats
        let processedData: any = businessData

        // If it's a string, try to parse it as JSON
        if (typeof businessData === "string") {
          try {
            processedData = JSON.parse(businessData)
          } catch (parseError) {
            console.warn(`Could not parse JSON for ${key}:`, parseError)
            continue
          }
        }

        // Skip demo businesses
        if (processedData.is_demo === true || processedData.is_demo === "true") {
          continue
        }

        // Skip businesses with demo in their name or email
        const businessNameCheck = (processedData.business_name as string) || (processedData.name as string) || ""
        const businessEmail = (processedData.email as string) || ""
        if (
          businessNameCheck.toLowerCase().includes("demo") ||
          businessEmail.toLowerCase().includes("demo") ||
          businessNameCheck.toLowerCase().includes("sample") ||
          businessEmail.toLowerCase().includes("sample")
        ) {
          continue
        }

        const businessId = key.replace("business:", "")
        const businessName =
          (processedData.business_name as string) || (processedData.name as string) || "Unknown Business"

        // Get categories from the data
        const categoriesData = processedData.categories
        let categories: string[] = []

        if (categoriesData) {
          if (typeof categoriesData === "string") {
            try {
              categories = JSON.parse(categoriesData)
            } catch (e) {
              console.error(`Error parsing categories for business ${businessId}:`, e)
              categories = []
            }
          } else if (Array.isArray(categoriesData)) {
            categories = categoriesData
          }
        }

        const primaryCategory = (processedData.primary_category as string) || (processedData.category as string) || null

        // Map categories to pages
        const mappedPages = Array.from(
          new Set(categories.map((category) => categoryPageMapping[category]).filter((page) => page !== undefined)),
        )

        mappings.push({
          businessId,
          businessName,
          categories,
          primaryCategory,
          mappedPages,
        })
      } catch (error) {
        console.error(`Error processing business ${key}:`, error)
        // Continue to next business instead of failing completely
        continue
      }
    }

    console.log(`Successfully processed ${mappings.length} business mappings (excluding demo businesses)`)
    return mappings.sort((a, b) => a.businessName.localeCompare(b.businessName))
  } catch (error) {
    console.error("Error fetching business category mappings:", error)
    return []
  }
}

export async function refreshBusinessCategoryMapping(businessId: string): Promise<BusinessCategoryMapping | null> {
  try {
    console.log(`Refreshing mapping for business ${businessId}...`)

    // Extract the clean business ID without any suffixes
    const cleanBusinessId = businessId.split(":")[0]
    console.log(`Using clean business ID: ${cleanBusinessId}`)

    // First try to get as a regular key-value pair
    let businessData: any = await kv.get(`business:${cleanBusinessId}`)

    // If that doesn't work, try as a hash
    if (!businessData) {
      try {
        businessData = await kv.hgetall(`business:${cleanBusinessId}`)
      } catch (hashError) {
        console.warn(`Could not retrieve data for business:${cleanBusinessId} as hash:`, hashError)
        return null
      }
    }

    if (!businessData) {
      console.log(`Business ${businessId} not found`)
      return null
    }

    // Handle different data formats
    let processedData: any = businessData

    // If it's a string, try to parse it as JSON
    if (typeof businessData === "string") {
      try {
        processedData = JSON.parse(businessData)
      } catch (parseError) {
        console.warn(`Could not parse JSON for business ${businessId}:`, parseError)
        return null
      }
    }

    const categoryPageMapping = getCategoryPageMapping()
    const businessName = (processedData.business_name as string) || (processedData.name as string) || "Unknown Business"

    // Get categories from the data
    const categoriesData = processedData.categories
    let categories: string[] = []

    if (categoriesData) {
      if (typeof categoriesData === "string") {
        try {
          categories = JSON.parse(categoriesData)
        } catch (e) {
          console.error(`Error parsing categories for business ${businessId}:`, e)
          categories = []
        }
      } else if (Array.isArray(categoriesData)) {
        categories = categoriesData
      }
    }

    const primaryCategory = (processedData.primary_category as string) || (processedData.category as string) || null

    // Map categories to pages
    const mappedPages = Array.from(
      new Set(categories.map((category) => categoryPageMapping[category]).filter((page) => page !== undefined)),
    )

    console.log(`Refreshed mapping for ${businessName}: ${mappedPages.join(", ")}`)

    return {
      businessId,
      businessName,
      categories,
      primaryCategory,
      mappedPages,
    }
  } catch (error) {
    console.error(`Error refreshing mapping for business ${businessId}:`, error)
    return null
  }
}
