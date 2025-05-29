/**
 * Database schema definitions and utility functions
 * This file defines the structure of our Redis database and provides
 * helper functions for consistent data access
 */

import { kv } from "@/lib/redis"
import type { Business } from "@/lib/definitions"

// Key prefixes for Redis
export const KEY_PREFIXES = {
  BUSINESS: "business:",
  BUSINESS_EMAIL: "business:email:",
  BUSINESSES_SET: "businesses",
  CATEGORY: "category:",
  ZIPCODE: "zipcode:",
  SERVICE: "service:",
}

// Category name mappings for consistent lookup
export const CATEGORY_MAPPINGS = {
  // Map various formats to standardized keys
  mortuaryServices: "Mortuary Services",
  "mortuary-services": "Mortuary Services",
  mortuary_services: "Mortuary Services",
  "funeral-services": "Mortuary Services",
  funeral_services: "Mortuary Services",
  funeralServices: "Mortuary Services",

  // Arts & Entertainment mappings
  artDesignEntertainment: "Arts & Entertainment",
  "art-design-entertainment": "Arts & Entertainment",
  "arts-entertainment": "Arts & Entertainment",
  "arts-&-entertainment": "Arts & Entertainment",
  "art-design-and-entertainment": "Arts & Entertainment",

  // Automotive mappings
  automotive: "Automotive Services",
  "automotive-services": "Automotive Services",
  automotiveServices: "Automotive Services",
  "auto-services": "Automotive Services",
  autoServices: "Automotive Services",
  "automotive/motorcycle/rv": "Automotive Services",
  "automotive-motorcycle-rv": "Automotive Services",
  "Automotive/Motorcycle/RV, etc": "Automotive Services", // Added this exact format
  "automotive/motorcycle/rv, etc": "Automotive Services", // Added lowercase version
  "Automotive/Motorcycle/RV etc": "Automotive Services", // Added without comma
  "automotive/motorcycle/rv etc": "Automotive Services", // Added lowercase without comma
}

// Standardized category object structure
export interface CategoryData {
  id: string // Unique identifier (e.g., "home-improvement")
  name: string // Display name (e.g., "Home Improvement")
  parentId?: string // Parent category ID for subcategories
  path: string // Full path (e.g., "home-improvement/plumbing")
}

// Business service area data
export interface ServiceAreaData {
  zipCodes: string[]
  isNationwide: boolean
  radius?: number
  centralZip?: string
}

/**
 * Save a business to the database with proper indexing
 */
export async function saveBusinessToDb(business: Business): Promise<boolean> {
  try {
    const { id } = business

    // Save core business data
    await kv.set(`${KEY_PREFIXES.BUSINESS}${id}`, business)

    // Add to email index if email exists
    if (business.email) {
      await kv.set(`${KEY_PREFIXES.BUSINESS_EMAIL}${business.email.toLowerCase()}`, id)
    }

    // Add to the set of all businesses
    await kv.sadd(KEY_PREFIXES.BUSINESSES_SET, id)

    // Add to primary category index if it exists
    if (business.category) {
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${business.category}`, id)
    }

    return true
  } catch (error) {
    console.error("Error saving business to database:", error)
    return false
  }
}

/**
 * Save business categories with proper indexing
 */
export async function saveBusinessCategories(businessId: string, categories: CategoryData[]): Promise<boolean> {
  try {
    // Store the standardized category data
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`, JSON.stringify(categories))

    // Add business to each category index
    for (const category of categories) {
      // Add to category index
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${category.id}`, businessId)

      // If it's a subcategory, add to the subcategory index too
      if (category.parentId) {
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${category.parentId}:${category.id}`, businessId)
      }

      // Add to the full path index
      if (category.path) {
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}path:${category.path}`, businessId)
      }
    }

    return true
  } catch (error) {
    console.error(`Error saving categories for business ${businessId}:`, error)
    return false
  }
}

/**
 * Save business categories to database (alias for saveBusinessCategories)
 * This function provides backward compatibility for existing code
 */
export async function saveBusinessCategoriesToDb(businessId: string, categories: CategoryData[]): Promise<boolean> {
  return await saveBusinessCategories(businessId, categories)
}

/**
 * Save business service area with proper indexing
 */
export async function saveBusinessServiceArea(businessId: string, serviceArea: ServiceAreaData): Promise<boolean> {
  try {
    // Store the service area data
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:serviceArea`, JSON.stringify(serviceArea))

    // Store nationwide flag
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:nationwide`, serviceArea.isNationwide)

    // If not nationwide, index by zip codes
    if (!serviceArea.isNationwide && serviceArea.zipCodes && serviceArea.zipCodes.length > 0) {
      // Store zip codes for this business
      await kv.sadd(`${KEY_PREFIXES.BUSINESS}${businessId}:zipcodes`, ...serviceArea.zipCodes)

      // Add business to each zip code's index
      for (const zipCode of serviceArea.zipCodes) {
        await kv.sadd(`${KEY_PREFIXES.ZIPCODE}${zipCode}:businesses`, businessId)
      }
    }

    return true
  } catch (error) {
    console.error(`Error saving service area for business ${businessId}:`, error)
    return false
  }
}

/**
 * Get businesses by category
 * This function handles different category name formats and mappings
 */
export async function getBusinessesByCategory(categoryId: string): Promise<Business[]> {
  try {
    console.log(`Getting businesses for category: ${categoryId}`)

    // Normalize the category name if needed
    const normalizedCategory = CATEGORY_MAPPINGS[categoryId.toLowerCase()] || categoryId

    // Try multiple category formats to ensure we find all relevant businesses
    const categoriesToCheck = [
      categoryId, // Original input
      normalizedCategory, // Normalized version
      categoryId.toLowerCase(), // Lowercase
      categoryId.replace(/\s+/g, ""), // No spaces
      categoryId.replace(/\s+/g, "-"), // Hyphenated
      categoryId.replace(/\s+/g, "_"), // Underscored
    ]

    // Remove duplicates
    const uniqueCategories = [...new Set(categoriesToCheck)]

    console.log(`Checking these category formats: ${uniqueCategories.join(", ")}`)

    // Get business IDs for all category formats
    const businessIdPromises = uniqueCategories.map(async (cat) => {
      try {
        return await kv.smembers(`${KEY_PREFIXES.CATEGORY}${cat}`)
      } catch (err) {
        console.error(`Error fetching businesses for category format ${cat}:`, err)
        return []
      }
    })

    const businessIdArrays = await Promise.all(businessIdPromises)

    // Combine all business IDs and remove duplicates
    const allBusinessIds = [...new Set(businessIdArrays.flat())]

    console.log(`Found ${allBusinessIds.length} unique business IDs across all category formats`)

    if (!allBusinessIds || allBusinessIds.length === 0) {
      return []
    }

    // Fetch each business's data
    const businessesPromises = allBusinessIds.map(async (id) => {
      try {
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)
        return business ? ({ ...business, id } as Business) : null
      } catch (err) {
        console.error(`Error fetching business ${id}:`, err)
        return null
      }
    })

    const businesses = (await Promise.all(businessesPromises)).filter(Boolean) as Business[]

    console.log(`Successfully retrieved ${businesses.length} businesses for category ${categoryId}`)

    return businesses
  } catch (error) {
    console.error(`Error getting businesses for category ${categoryId}:`, error)
    return []
  }
}

/**
 * Get businesses by zip code
 */
export async function getBusinessesByZipCode(zipCode: string): Promise<Business[]> {
  try {
    // Get business IDs from zip code index
    const businessIds = await kv.smembers(`${KEY_PREFIXES.ZIPCODE}${zipCode}:businesses`)

    // Also get nationwide businesses
    const allBusinesses = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    const nationwideBusinessIds: string[] = []

    // Check each business if it's nationwide
    for (const id of allBusinesses) {
      const isNationwide = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:nationwide`)
      if (isNationwide) {
        nationwideBusinessIds.push(id)
      }
    }

    // Combine local and nationwide businesses, removing duplicates
    const allBusinessIds = [...new Set([...businessIds, ...nationwideBusinessIds])]

    if (allBusinessIds.length === 0) {
      return []
    }

    // Fetch each business's data
    const businessesPromises = allBusinessIds.map(async (id) => {
      try {
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)
        return business ? ({ ...business, id } as Business) : null
      } catch (err) {
        console.error(`Error fetching business ${id}:`, err)
        return null
      }
    })

    const businesses = (await Promise.all(businessesPromises)).filter(Boolean) as Business[]

    return businesses
  } catch (error) {
    console.error(`Error getting businesses for zip code ${zipCode}:`, error)
    return []
  }
}

/**
 * Get businesses by category and zip code
 */
export async function getBusinessesByCategoryAndZipCode(categoryId: string, zipCode: string): Promise<Business[]> {
  try {
    // Get businesses by category using our enhanced function
    const categoryBusinesses = await getBusinessesByCategory(categoryId)

    // Get businesses by zip code
    const zipCodeBusinessIds = await kv.smembers(`${KEY_PREFIXES.ZIPCODE}${zipCode}:businesses`)

    // Get nationwide businesses
    const allBusinesses = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    const nationwideBusinessIds: string[] = []

    for (const id of allBusinesses) {
      const isNationwide = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:nationwide`)
      if (isNationwide) {
        nationwideBusinessIds.push(id)
      }
    }

    // Find businesses that match both category and zip code (or are nationwide)
    const matchingBusinesses = categoryBusinesses.filter(
      (business) => zipCodeBusinessIds.includes(business.id) || nationwideBusinessIds.includes(business.id),
    )

    return matchingBusinesses
  } catch (error) {
    console.error(`Error getting businesses for category ${categoryId} and zip code ${zipCode}:`, error)
    return []
  }
}

/**
 * Data migration helper to standardize existing data
 */
export async function migrateBusinessData(): Promise<{
  success: boolean
  processed: number
  errors: number
}> {
  try {
    const result = {
      success: true,
      processed: 0,
      errors: 0,
    }

    // Get all business IDs
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)

    for (const id of businessIds) {
      try {
        // Get business data
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)

        if (!business) {
          console.warn(`Business ${id} not found during migration`)
          continue
        }

        // Standardize and save business data
        await saveBusinessToDb(business as Business)

        // Migrate categories
        try {
          // Try different ways to get categories
          let categories: any[] = []

          // Try as a set
          try {
            categories = await kv.smembers(`${KEY_PREFIXES.BUSINESS}${id}:categories`)
          } catch (e) {
            // Try as a string
            const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:categories`)
            if (categoriesData) {
              if (typeof categoriesData === "string") {
                try {
                  categories = JSON.parse(categoriesData)
                } catch (parseError) {
                  console.error(`Error parsing categories for business ${id}:`, parseError)
                }
              } else if (Array.isArray(categoriesData)) {
                categories = categoriesData
              }
            }
          }

          // Standardize categories
          if (categories && categories.length > 0) {
            const standardizedCategories: CategoryData[] = categories
              .map((cat: any) => {
                // Handle different formats
                if (typeof cat === "string") {
                  return {
                    id: cat,
                    name: cat,
                    path: cat,
                  }
                } else if (typeof cat === "object" && cat !== null) {
                  return {
                    id: cat.id || cat.fullPath || cat.category || "",
                    name: cat.name || cat.category || cat.subcategory || "",
                    parentId: cat.parentId || cat.category || "",
                    path: cat.path || cat.fullPath || cat.category + "/" + cat.subcategory || "",
                  }
                }

                return {
                  id: "unknown",
                  name: "Unknown",
                  path: "unknown",
                }
              })
              .filter((cat) => cat.id !== "unknown")

            // Save standardized categories
            if (standardizedCategories.length > 0) {
              await saveBusinessCategories(id, standardizedCategories)
            }
          }
        } catch (catError) {
          console.error(`Error migrating categories for business ${id}:`, catError)
        }

        // Migrate service area
        try {
          let zipCodes: string[] = []
          let isNationwide = false

          // Try to get nationwide flag
          const nationwideFlag = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:nationwide`)
          isNationwide = !!nationwideFlag

          // Try to get zip codes
          try {
            zipCodes = await kv.smembers(`${KEY_PREFIXES.BUSINESS}${id}:zipcodes`)
          } catch (e) {
            // Try as a string
            const zipCodesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:zipcodes`)
            if (zipCodesData) {
              if (typeof zipCodesData === "string") {
                try {
                  zipCodes = JSON.parse(zipCodesData)
                } catch (parseError) {
                  console.error(`Error parsing zip codes for business ${id}:`, parseError)
                }
              } else if (Array.isArray(zipCodesData)) {
                zipCodes = zipCodesData
              }
            }
          }

          // Save service area
          await saveBusinessServiceArea(id, {
            zipCodes: zipCodes.filter((zip) => typeof zip === "string"),
            isNationwide,
          })
        } catch (zipError) {
          console.error(`Error migrating service area for business ${id}:`, zipError)
        }

        result.processed++
      } catch (error) {
        console.error(`Error migrating business ${id}:`, error)
        result.errors++
      }
    }

    return result
  } catch (error) {
    console.error("Error during data migration:", error)
    return {
      success: false,
      processed: 0,
      errors: 0,
    }
  }
}
