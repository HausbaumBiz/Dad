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

            // Get ad design data to get the preferred business name and location info
            try {
              const adDesignData = await getBusinessAdDesignData(businessId)
              console.log(`Ad design data for ${businessId}:`, adDesignData)

              // If ad design has a business name, use that instead
              if (adDesignData?.businessInfo?.businessName) {
                business.displayName = adDesignData.businessInfo.businessName
                console.log(`Using ad design name: ${business.displayName}`)
              } else {
                business.displayName = business.businessName
                console.log(`Using registration name: ${business.displayName}`)
              }

              // Get city and state from ad design if available, otherwise use registration data
              if (adDesignData?.businessInfo?.city) {
                business.displayCity = adDesignData.businessInfo.city
                console.log(`Using ad design city: ${business.displayCity}`)
              } else {
                business.displayCity = business.city
                console.log(`Using registration city: ${business.displayCity}`)
              }

              if (adDesignData?.businessInfo?.state) {
                business.displayState = adDesignData.businessInfo.state
                console.log(`Using ad design state: ${business.displayState}`)
              } else {
                business.displayState = business.state
                console.log(`Using registration state: ${business.displayState}`)
              }

              // Get phone number from ad design if available
              if (adDesignData?.businessInfo?.phone) {
                business.displayPhone = adDesignData.businessInfo.phone
                console.log(`Using ad design phone: ${business.displayPhone}`)
              } else {
                business.displayPhone = business.phone
              }

              // Create a combined display location
              if (business.displayCity && business.displayState) {
                business.displayLocation = `${business.displayCity}, ${business.displayState}`
              } else if (business.displayCity) {
                business.displayLocation = business.displayCity
              } else if (business.displayState) {
                business.displayLocation = business.displayState
              } else {
                business.displayLocation = `Zip: ${business.zipCode}`
              }

              console.log(`Display location for ${business.displayName}: ${business.displayLocation}`)

              // Also attach the full ad design data
              business.adDesignData = adDesignData
            } catch (adError) {
              console.error(`Error getting ad design for business ${businessId}:`, getErrorMessage(adError))
              // Fallback to registration data
              business.displayName = business.businessName
              business.displayCity = business.city
              business.displayState = business.state
              business.displayPhone = business.phone

              // Create fallback location
              if (business.city && business.state) {
                business.displayLocation = `${business.city}, ${business.state}`
              } else if (business.city) {
                business.displayLocation = business.city
              } else if (business.state) {
                business.displayLocation = business.state
              } else {
                business.displayLocation = `Zip: ${business.zipCode}`
              }
            }

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
                console.log(`Fetched subcategories for ${business.displayName}:`, subcategories)
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
    // Check if we're in a server environment
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("KV environment variables not available for ad design data")
      return null
    }

    // Get the main ad design data
    const mainKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`
    const businessInfoKey = `${KEY_PREFIXES.BUSINESS}${businessId}:adDesign:businessInfo`

    const adDesign = await kv.get(mainKey)
    const businessInfo = await kv.get(businessInfoKey)

    // Parse the data safely
    let parsedDesign = null
    let parsedBusinessInfo = null

    if (typeof adDesign === "string") {
      try {
        parsedDesign = JSON.parse(adDesign)
      } catch (e) {
        console.error("Error parsing ad design:", e)
      }
    } else if (adDesign && typeof adDesign === "object") {
      parsedDesign = adDesign
    }

    if (typeof businessInfo === "string") {
      try {
        parsedBusinessInfo = JSON.parse(businessInfo)
      } catch (e) {
        console.error("Error parsing business info:", e)
      }
    } else if (businessInfo && typeof businessInfo === "object") {
      parsedBusinessInfo = businessInfo
    }

    // If we have business info, return it with the design data
    if (parsedBusinessInfo || parsedDesign) {
      return {
        ...parsedDesign,
        businessInfo: parsedBusinessInfo || {},
      }
    }

    return null
  } catch (error) {
    console.error(`Error getting ad design for business ${businessId}:`, getErrorMessage(error))
    return null
  }
}
