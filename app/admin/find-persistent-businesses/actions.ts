"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

export interface BusinessLocationAnalysis {
  businessesFound: Array<{
    id: string
    name: string
    locations: string[]
    businessData: any
  }>
  allLocationsChecked: string[]
  totalLocations: number
  error?: string
}

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
  return String(error)
}

async function scanAllKeys(pattern: string): Promise<string[]> {
  try {
    // Use a more targeted approach instead of scanning all keys
    const keys: string[] = []

    // Check specific patterns that might contain business data
    const patterns = [
      "business:*",
      "category:*",
      "businesses",
      "zipcode:*",
      "*automotive*",
      "*health*",
      "*rat*",
      "*stark*",
    ]

    for (const pat of patterns) {
      try {
        // For specific known keys, check directly
        if (pat === "businesses") {
          const exists = await kv.exists("businesses")
          if (exists) {
            keys.push("businesses")
          }
          continue
        }

        // For patterns, we'll check common variations
        if (pat.includes("*")) {
          const basePattern = pat.replace("*", "")

          // Check some common variations
          const variations = [
            basePattern,
            basePattern + "services",
            basePattern + "-services",
            basePattern + "_services",
            basePattern + "Services",
          ]

          for (const variation of variations) {
            try {
              const exists = await kv.exists(variation)
              if (exists) {
                keys.push(variation)
              }
            } catch (error) {
              // Ignore individual key errors
            }
          }
        }
      } catch (error) {
        console.error(`Error checking pattern ${pat}:`, getErrorMessage(error))
      }
    }

    return keys
  } catch (error) {
    console.error("Error scanning keys:", getErrorMessage(error))
    return []
  }
}

export async function findPersistentBusinesses(): Promise<BusinessLocationAnalysis> {
  try {
    console.log("Starting comprehensive search for persistent businesses")

    const targetBusinesses = ["stark family health center", "rat"]
    const businessesFound: Array<{
      id: string
      name: string
      locations: string[]
      businessData: any
    }> = []

    const allLocationsChecked: string[] = []

    // 1. Check the main businesses set
    console.log("Checking main businesses set...")
    try {
      const businessIds = await kv.smembers("businesses")
      if (Array.isArray(businessIds)) {
        allLocationsChecked.push("businesses (set)")

        for (const businessId of businessIds) {
          try {
            const businessData = await kv.get(`business:${businessId}`)
            if (businessData) {
              const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData
              const businessName = (business.businessName || business.name || "").toLowerCase()

              // Check if this is one of our target businesses
              for (const target of targetBusinesses) {
                if (businessName.includes(target)) {
                  const existing = businessesFound.find((b) => b.id === businessId)
                  if (existing) {
                    existing.locations.push("businesses set")
                  } else {
                    businessesFound.push({
                      id: businessId,
                      name: business.businessName || business.name || "Unknown",
                      locations: ["businesses set"],
                      businessData: business,
                    })
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error checking business ${businessId}:`, getErrorMessage(error))
          }
        }
      }
    } catch (error) {
      console.error("Error checking businesses set:", getErrorMessage(error))
    }

    // 2. Check all possible category keys
    console.log("Checking category keys...")
    const categoryKeys = [
      "category:automotive-services",
      "category:automotive",
      "category:automotiveServices",
      "category:automotive_services",
      "category:auto-services",
      "category:autoServices",
      "category:Automotive Services",
      "category:Automotive/Motorcycle/RV",
      "category:automotive/motorcycle/rv",
      "category:Automotive/Motorcycle/RV, etc",
      "category:automotive/motorcycle/rv, etc",
      "category:auto",
      "category:Auto",
      "category:health",
      "category:healthcare",
      "category:medical",
      "category:pest-control",
      "category:exterminator",
    ]

    for (const categoryKey of categoryKeys) {
      try {
        allLocationsChecked.push(categoryKey)
        const exists = await kv.exists(categoryKey)
        if (exists) {
          try {
            const members = await kv.smembers(categoryKey)
            if (Array.isArray(members)) {
              for (const businessId of members) {
                try {
                  const businessData = await kv.get(`business:${businessId}`)
                  if (businessData) {
                    const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData
                    const businessName = (business.businessName || business.name || "").toLowerCase()

                    for (const target of targetBusinesses) {
                      if (businessName.includes(target)) {
                        const existing = businessesFound.find((b) => b.id === businessId)
                        if (existing) {
                          existing.locations.push(categoryKey)
                        } else {
                          businessesFound.push({
                            id: businessId,
                            name: business.businessName || business.name || "Unknown",
                            locations: [categoryKey],
                            businessData: business,
                          })
                        }
                      }
                    }
                  }
                } catch (error) {
                  console.error(`Error checking business ${businessId} in ${categoryKey}:`, getErrorMessage(error))
                }
              }
            }
          } catch (error) {
            // Key might be corrupted, try to get its value directly
            try {
              const value = await kv.get(categoryKey)
              console.log(`Category ${categoryKey} has corrupted data:`, value)
            } catch (getError) {
              console.error(`Category ${categoryKey} is completely corrupted:`, getErrorMessage(getError))
            }
          }
        }
      } catch (error) {
        console.error(`Error checking category ${categoryKey}:`, getErrorMessage(error))
      }
    }

    // 3. Check if businesses are stored in other formats
    console.log("Checking alternative storage formats...")

    // Check for hardcoded or cached data
    const alternativeKeys = [
      "automotive-businesses",
      "automotive_businesses",
      "automotiveBusinesses",
      "cached:automotive",
      "demo:automotive",
      "sample:automotive",
      "mock:automotive",
    ]

    for (const altKey of alternativeKeys) {
      try {
        allLocationsChecked.push(altKey)
        const exists = await kv.exists(altKey)
        if (exists) {
          const data = await kv.get(altKey)
          console.log(`Found data in ${altKey}:`, data)
          // Add logic to parse this data if it contains our target businesses
        }
      } catch (error) {
        console.error(`Error checking alternative key ${altKey}:`, getErrorMessage(error))
      }
    }

    // 4. Check the automotive services page data source
    console.log("Checking automotive services page data source...")

    // The page might be using a different function to get businesses
    // Let's check what the getBusinessesByCategory function returns
    try {
      // Import and call the function that the automotive page uses
      const { getBusinessesByCategory } = await import("@/app/actions/business-actions")
      const automotiveBusinesses = await getBusinessesByCategory("automotive-services")

      allLocationsChecked.push("getBusinessesByCategory('automotive-services')")

      for (const business of automotiveBusinesses) {
        const businessName = (business.businessName || business.name || "").toLowerCase()
        for (const target of targetBusinesses) {
          if (businessName.includes(target)) {
            const existing = businessesFound.find((b) => b.id === business.id)
            if (existing) {
              existing.locations.push("getBusinessesByCategory result")
            } else {
              businessesFound.push({
                id: business.id,
                name: business.businessName || business.name || "Unknown",
                locations: ["getBusinessesByCategory result"],
                businessData: business,
              })
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking getBusinessesByCategory:", getErrorMessage(error))
    }

    // 5. Check for businesses stored with different ID formats
    console.log("Checking for businesses with different ID patterns...")

    // Try to find businesses by searching for name patterns in keys
    const namePatterns = ["stark", "family", "health", "rat"]
    for (const pattern of namePatterns) {
      try {
        // Check if there are any keys containing these patterns
        const keyPattern = `*${pattern}*`
        allLocationsChecked.push(`Pattern: ${keyPattern}`)

        // Since we can't use KEYS *, we'll check some common variations
        const variations = [
          `business:${pattern}`,
          `${pattern}:business`,
          `demo:${pattern}`,
          `sample:${pattern}`,
          `cached:${pattern}`,
        ]

        for (const variation of variations) {
          try {
            const exists = await kv.exists(variation)
            if (exists) {
              const data = await kv.get(variation)
              console.log(`Found data in ${variation}:`, data)
            }
          } catch (error) {
            // Ignore individual errors
          }
        }
      } catch (error) {
        console.error(`Error checking pattern ${pattern}:`, getErrorMessage(error))
      }
    }

    console.log(
      `Search complete. Found ${businessesFound.length} target businesses in ${allLocationsChecked.length} locations`,
    )

    return {
      businessesFound,
      allLocationsChecked,
      totalLocations: allLocationsChecked.length,
    }
  } catch (error) {
    return {
      businessesFound: [],
      allLocationsChecked: [],
      totalLocations: 0,
      error: getErrorMessage(error),
    }
  }
}

export async function removeBusinessFromAllLocations(businessId: string): Promise<{
  success: boolean
  message: string
  details: string[]
}> {
  const details: string[] = []

  try {
    console.log(`Starting complete removal of business ${businessId}`)

    // Get business data first
    const businessData = await kv.get(`business:${businessId}`)
    const businessName = businessData
      ? (typeof businessData === "string" ? JSON.parse(businessData) : businessData).businessName || "Unknown"
      : "Unknown"

    details.push(`Removing business: ${businessName} (${businessId})`)

    // 1. Remove from main businesses set
    try {
      await kv.srem("businesses", businessId)
      details.push("Removed from main businesses set")
    } catch (error) {
      details.push(`Error removing from businesses set: ${getErrorMessage(error)}`)
    }

    // 2. Remove from ALL possible category keys
    const allCategoryKeys = [
      "category:automotive-services",
      "category:automotive",
      "category:automotiveServices",
      "category:automotive_services",
      "category:auto-services",
      "category:autoServices",
      "category:Automotive Services",
      "category:Automotive/Motorcycle/RV",
      "category:automotive/motorcycle/rv",
      "category:Automotive/Motorcycle/RV, etc",
      "category:automotive/motorcycle/rv, etc",
      "category:auto",
      "category:Auto",
      "category:health",
      "category:healthcare",
      "category:medical",
      "category:pest-control",
      "category:exterminator",
    ]

    for (const categoryKey of allCategoryKeys) {
      try {
        const removed = await kv.srem(categoryKey, businessId)
        if (removed > 0) {
          details.push(`Removed from ${categoryKey}`)
        }
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }

    // 3. Delete the business record entirely
    try {
      await kv.del(`business:${businessId}`)
      details.push("Deleted business record")
    } catch (error) {
      details.push(`Error deleting business record: ${getErrorMessage(error)}`)
    }

    // 4. Remove from email index if it exists
    if (businessData) {
      try {
        const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData
        if (business.email) {
          await kv.del(`business:email:${business.email.toLowerCase()}`)
          details.push("Removed from email index")
        }
      } catch (error) {
        details.push(`Error removing from email index: ${getErrorMessage(error)}`)
      }
    }

    // 5. Remove from any zip code indexes
    try {
      const zipCodes = await kv.smembers(`business:${businessId}:zipcodes`)
      if (Array.isArray(zipCodes)) {
        for (const zipCode of zipCodes) {
          await kv.srem(`zipcode:${zipCode}:businesses`, businessId)
        }
        details.push(`Removed from ${zipCodes.length} zip code indexes`)
      }
    } catch (error) {
      // Ignore errors
    }

    // 6. Delete all associated data
    const associatedKeys = [
      `business:${businessId}:categories`,
      `business:${businessId}:zipcodes`,
      `business:${businessId}:serviceArea`,
      `business:${businessId}:nationwide`,
      `business:${businessId}:adDesign`,
      `business:${businessId}:media`,
    ]

    for (const key of associatedKeys) {
      try {
        await kv.del(key)
        details.push(`Deleted ${key}`)
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }

    // Revalidate paths
    revalidatePath("/automotive-services")
    revalidatePath("/admin/businesses")
    details.push("Revalidated application paths")

    return {
      success: true,
      message: `Successfully removed ${businessName} from all locations`,
      details,
    }
  } catch (error) {
    return {
      success: false,
      message: "Failed to remove business from all locations",
      details: [...details, `Error: ${getErrorMessage(error)}`],
    }
  }
}
