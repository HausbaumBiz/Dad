"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export interface SearchResult {
  id: string
  businessName: string
  category: string
  zipCode: string
  keywords?: string[]
  description?: string
  phone?: string
  email?: string
}

// Helper function to safely get zip codes from different storage formats
async function getBusinessServiceAreaZipCodes(businessId: string): Promise<string[]> {
  try {
    // Try the main zipcodes key first (could be JSON string or other format)
    try {
      const zipCodesData = await kv.get(`business:${businessId}:zipcodes`)
      if (zipCodesData) {
        if (typeof zipCodesData === "string") {
          try {
            const parsed = JSON.parse(zipCodesData)
            if (Array.isArray(parsed)) {
              // Handle array of zip code objects or strings
              return parsed
                .map((item) => {
                  if (typeof item === "string") return item
                  if (item && item.zip) return item.zip
                  return String(item)
                })
                .filter(Boolean)
            }
          } catch (parseError) {
            console.warn(`Failed to parse zip codes JSON for ${businessId}:`, parseError)
          }
        } else if (Array.isArray(zipCodesData)) {
          // Handle case where it's already an array
          return zipCodesData
            .map((item) => {
              if (typeof item === "string") return item
              if (item && item.zip) return item.zip
              return String(item)
            })
            .filter(Boolean)
        }
      }
    } catch (mainKeyError) {
      console.warn(`Main zipcodes key failed for ${businessId}:`, mainKeyError)
    }

    // Try the set key as fallback
    try {
      const zipCodeStrings = await kv.smembers(`business:${businessId}:zipcodes:set`)
      if (zipCodeStrings && Array.isArray(zipCodeStrings) && zipCodeStrings.length > 0) {
        return zipCodeStrings.filter(Boolean)
      }
    } catch (setKeyError) {
      console.warn(`Set zipcodes key failed for ${businessId}:`, setKeyError)
    }

    return []
  } catch (error) {
    console.error(`Error getting service area zip codes for ${businessId}:`, error)
    return []
  }
}

export async function searchBusinesses(
  query: string,
  zipCode: string,
): Promise<{ success: boolean; results?: SearchResult[]; message?: string }> {
  try {
    if (!query || !zipCode) {
      return { success: false, message: "Query and ZIP code are required" }
    }

    // Check if KV environment variables are available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("KV environment variables are missing. Using mock data for development.")
      // Return mock search results for development
      return {
        success: true,
        results: [
          {
            id: "demo-business-1",
            businessName: "Demo Plumbing Service",
            category: "Home Improvement",
            zipCode: zipCode,
            keywords: ["plumbing", "repair", "installation"],
            description: "Professional plumbing services for residential and commercial properties",
            phone: "(555) 123-4567",
            email: "info@demoplumbing.com",
          },
          {
            id: "demo-business-2",
            businessName: "Sample Auto Repair",
            category: "Automotive Services",
            zipCode: zipCode,
            keywords: ["auto", "repair", "maintenance"],
            description: "Complete automotive repair and maintenance services",
            phone: "(555) 987-6543",
            email: "contact@sampleauto.com",
          },
        ],
        message: `Found 2 demo businesses for "${query}" in ${zipCode}`,
      }
    }

    const normalizedQuery = query.toLowerCase().trim()
    const searchTerms = normalizedQuery.split(/\s+/).filter((term) => term.length > 0)

    console.log(`[SEARCH] Searching for terms: [${searchTerms.join(", ")}] in zip code ${zipCode}`)

    // Get all business IDs from the businesses set
    let businessIds: string[] = []
    try {
      businessIds = (await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)) as string[]
      console.log(`[SEARCH] Found ${businessIds.length} total businesses`)
    } catch (error) {
      console.error("Error fetching business IDs:", error)
      return { success: false, message: "Error accessing business database" }
    }

    if (!businessIds || businessIds.length === 0) {
      return { success: true, results: [], message: "No businesses found in database" }
    }

    const results: SearchResult[] = []

    // Search through each business
    for (const businessId of businessIds) {
      try {
        console.log(`[SEARCH] Processing business ${businessId}`)

        // First check if business serves the requested zip code
        let servesZipCode = false
        let serviceMethod = ""

        // Check if business is nationwide
        try {
          const isNationwide = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:nationwide`)
          if (isNationwide === "true" || isNationwide === true) {
            servesZipCode = true
            serviceMethod = "nationwide"
            console.log(`[SEARCH] Business ${businessId} serves nationwide`)
          }
        } catch (nationwideError) {
          console.warn(`Nationwide check failed for ${businessId}:`, nationwideError)
        }

        // If not nationwide, check service area zip codes using the safe helper function
        if (!servesZipCode) {
          try {
            const serviceAreaZipCodes = await getBusinessServiceAreaZipCodes(businessId)
            console.log(`[SEARCH] Business ${businessId} service area zip codes:`, serviceAreaZipCodes)

            if (serviceAreaZipCodes && serviceAreaZipCodes.length > 0 && serviceAreaZipCodes.includes(zipCode)) {
              servesZipCode = true
              serviceMethod = "service area"
              console.log(`[SEARCH] Business ${businessId} serves zip code ${zipCode} via service area`)
            }
          } catch (serviceAreaError) {
            console.warn(`Service area check failed for ${businessId}:`, serviceAreaError)
          }
        }

        // If still not found, check business's primary zip code as fallback
        if (!servesZipCode) {
          try {
            const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
            if (businessData) {
              let business: any = null
              if (typeof businessData === "string") {
                try {
                  business = JSON.parse(businessData)
                } catch (parseError) {
                  business = null
                }
              } else if (typeof businessData === "object" && businessData !== null) {
                business = businessData
              }

              if (business && business.zipCode === zipCode) {
                servesZipCode = true
                serviceMethod = "primary zip"
                console.log(`[SEARCH] Business ${businessId} primary zip matches ${zipCode}`)
              }
            }
          } catch (primaryZipError) {
            console.warn(`Primary zip check failed for ${businessId}:`, primaryZipError)
          }
        }

        // Skip if business doesn't serve this zip code
        if (!servesZipCode) {
          console.log(`[SEARCH] Business ${businessId} does not serve zip code ${zipCode}`)
          continue
        }

        console.log(`[SEARCH] Business ${businessId} serves zip code ${zipCode} via ${serviceMethod}`)

        // Now check if business has matching keywords or business data
        let hasMatchingKeywords = false
        let businessKeywords: string[] = []

        try {
          const keywordsData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:keywords`)

          if (keywordsData) {
            if (typeof keywordsData === "string") {
              try {
                businessKeywords = JSON.parse(keywordsData)
              } catch (parseError) {
                console.warn(`Failed to parse keywords for ${businessId}:`, parseError)
                businessKeywords = []
              }
            } else if (Array.isArray(keywordsData)) {
              businessKeywords = keywordsData as string[]
            }

            // Check if any search term matches any keyword
            if (businessKeywords.length > 0) {
              const keywordString = businessKeywords.join(" ").toLowerCase()
              hasMatchingKeywords = searchTerms.some((term) => keywordString.includes(term))

              if (hasMatchingKeywords) {
                console.log(`[SEARCH] Business ${businessId} has matching keywords: ${businessKeywords.join(", ")}`)
              }
            }
          }
        } catch (keywordError) {
          console.warn(`Failed to get keywords for ${businessId}:`, keywordError)
        }

        // Get business data for additional matching and result building
        const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
        if (!businessData) {
          console.log(`[SEARCH] No business data found for ${businessId}`)
          continue
        }

        let business: any = null
        if (typeof businessData === "string") {
          try {
            business = JSON.parse(businessData)
          } catch (parseError) {
            console.warn(`Failed to parse business data for ${businessId}:`, parseError)
            continue
          }
        } else if (typeof businessData === "object" && businessData !== null) {
          business = businessData
        } else {
          continue
        }

        // Also check business name, category, and description for matches
        const businessName = (business.businessName || "").toLowerCase()
        const category = (business.category || "").toLowerCase()
        const description = (business.description || "").toLowerCase()

        const matchesBusinessData = searchTerms.some(
          (term) => businessName.includes(term) || category.includes(term) || description.includes(term),
        )

        // Business must serve the zip code AND have matching keywords OR business data
        if (servesZipCode && (hasMatchingKeywords || matchesBusinessData)) {
          results.push({
            id: businessId,
            businessName: business.businessName || "Unknown Business",
            category: business.category || "Uncategorized",
            zipCode: business.zipCode || zipCode,
            keywords: businessKeywords,
            description: business.description || "",
            phone: business.phone || "",
            email: business.email || "",
          })

          console.log(`[SEARCH] Added business ${businessId} to results (${serviceMethod})`)
        } else {
          console.log(`[SEARCH] Business ${businessId} serves zip but no keyword/data match`)
        }
      } catch (businessError) {
        console.warn(`Error processing business ${businessId}:`, businessError)
        continue
      }
    }

    console.log(`[SEARCH] Found ${results.length} results for "${query}" in zip code ${zipCode}`)

    const message =
      results.length > 0
        ? `Found ${results.length} business${results.length !== 1 ? "es" : ""} matching your search in ${zipCode}`
        : `No businesses found matching "${query}" in zip code ${zipCode}`

    return {
      success: true,
      results,
      message,
    }
  } catch (error) {
    console.error("Error during search:", error)
    return {
      success: false,
      message: "Search failed. Please try again.",
    }
  }
}
