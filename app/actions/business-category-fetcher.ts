"use server"

import { kv } from "@/lib/redis"
import { getCategoryIdsForRoute } from "@/lib/category-route-mapping"
import type { Business } from "@/lib/definitions"
import { KEY_PREFIXES } from "@/lib/db-schema"

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (error && typeof error === "object") {
    return JSON.stringify(error)
  }
  return "Unknown error occurred"
}

// Function to get businesses by their selected category IDs
export async function getBusinessesBySelectedCategories(route: string): Promise<Business[]> {
  try {
    console.log(`Fetching businesses for route: ${route}`)

    // Get the category IDs that correspond to this route
    const categoryIds = getCategoryIdsForRoute(route)
    console.log(`Category IDs for route ${route}:`, categoryIds)

    if (categoryIds.length === 0) {
      console.log(`No category IDs found for route: ${route}`)
      return []
    }

    // Get all businesses that have selected these categories
    const allBusinessIds = (await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)) as string[]
    console.log(`Total businesses in system: ${allBusinessIds.length}`)

    const matchingBusinesses: Business[] = []

    for (const businessId of allBusinessIds) {
      try {
        // Get the business's selected category IDs
        const selectedCategoryIds = (await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategoryIds`)) as
          | string[]
          | null
        const selectedSubcategoryIds = (await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedSubcategoryIds`)) as
          | string[]
          | null

        if (!selectedCategoryIds && !selectedSubcategoryIds) {
          continue
        }

        // Combine all selected IDs
        const allSelectedIds = [...(selectedCategoryIds || []), ...(selectedSubcategoryIds || [])]

        // Check if any of the business's selected categories match our target categories
        const hasMatchingCategory = categoryIds.some((targetId) =>
          allSelectedIds.some(
            (selectedId) =>
              selectedId === targetId ||
              selectedId.toLowerCase() === targetId.toLowerCase() ||
              selectedId.replace(/\s+/g, "").toLowerCase() === targetId.replace(/\s+/g, "").toLowerCase(),
          ),
        )

        if (hasMatchingCategory) {
          // Get the full business data
          const business = (await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)) as Business | null
          if (business) {
            console.log(`Found matching business: ${business.businessName} (${businessId})`)

            // Fetch subcategory names if available
            let subcategories = []
            if (selectedSubcategoryIds && selectedSubcategoryIds.length > 0) {
              try {
                // Try to get subcategory names for each ID
                const subcategoryPromises = selectedSubcategoryIds.map(async (subcatId) => {
                  const subcatName = await kv.get(`${KEY_PREFIXES.SUBCATEGORY}${subcatId}:name`)
                  return subcatName || subcatId // Fall back to ID if name not found
                })

                subcategories = await Promise.all(subcategoryPromises)
                console.log(`Fetched subcategories for ${business.businessName}:`, subcategories)
              } catch (subcatError) {
                console.error(`Error fetching subcategory names for ${businessId}:`, getErrorMessage(subcatError))
                // If there's an error, just use the IDs
                subcategories = selectedSubcategoryIds
              }
            }

            // Add the business with its ID and subcategories
            matchingBusinesses.push({
              ...business,
              id: businessId,
              subcategories: subcategories,
            })
          }
        }
      } catch (error) {
        console.error(`Error checking business ${businessId}:`, getErrorMessage(error))
        continue
      }
    }

    console.log(`Found ${matchingBusinesses.length} matching businesses for route ${route}`)
    return matchingBusinesses
  } catch (error) {
    console.error(`Error fetching businesses for route ${route}:`, getErrorMessage(error))
    return []
  }
}

// Function to get business ad design data
export async function getBusinessAdDesignData(businessId: string) {
  try {
    const adDesign = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`)
    if (!adDesign) return null

    let parsedDesign
    if (typeof adDesign === "string") {
      parsedDesign = JSON.parse(adDesign)
    } else {
      parsedDesign = adDesign
    }

    return parsedDesign
  } catch (error) {
    console.error(`Error getting ad design for business ${businessId}:`, getErrorMessage(error))
    return null
  }
}
