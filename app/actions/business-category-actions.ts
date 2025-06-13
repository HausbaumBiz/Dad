"use server"

import { kv } from "@/lib/redis"

/**
 * Fetches all unique business categories from Redis
 * @returns Array of unique category names
 */
export async function getAllBusinessCategories(): Promise<string[]> {
  try {
    // Get all business IDs
    const businessIds = await kv.smembers("businesses")

    // Set to store unique categories
    const uniqueCategories = new Set<string>()

    // Process each business
    for (const businessId of businessIds) {
      try {
        // Get business data
        const businessData = await kv.get(`business:${businessId}`)

        if (businessData) {
          let businessObj: any

          // Parse business data if it's a string
          if (typeof businessData === "string") {
            try {
              businessObj = JSON.parse(businessData)
            } catch (e) {
              console.error(`Error parsing business data for ${businessId}:`, e)
              continue
            }
          } else {
            businessObj = businessData
          }

          // Extract categories
          if (businessObj.categories && Array.isArray(businessObj.categories)) {
            businessObj.categories.forEach((category: string) => {
              if (category) uniqueCategories.add(category)
            })
          }

          // Also check primaryCategory if it exists
          if (businessObj.primaryCategory) {
            uniqueCategories.add(businessObj.primaryCategory)
          }
        }
      } catch (businessError) {
        console.error(`Error processing business ${businessId}:`, businessError)
        // Continue with next business
      }
    }

    // Convert Set to Array and sort alphabetically
    return Array.from(uniqueCategories).sort()
  } catch (error) {
    console.error("Error fetching business categories:", error)
    return []
  }
}
