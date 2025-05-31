"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function inspectCategoryStorage() {
  try {
    const result = {
      businessCount: 0,
      sampleBusinesses: [] as any[],
      categoryIndexes: [] as any[],
      categoryFormats: {} as any,
      allCategoryNames: new Set<string>(),
    }

    // Get all business IDs
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    result.businessCount = businessIds.length

    console.log(`Inspecting ${businessIds.length} businesses for category storage`)

    // Sample first 5 businesses to see how categories are stored
    const sampleIds = businessIds.slice(0, 5)

    for (const businessId of sampleIds) {
      const businessData: any = {
        id: businessId,
        categoryStorageFormats: {},
      }

      // Get main business data
      const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
      if (business) {
        businessData.businessName = (business as any).businessName
        businessData.mainCategory = (business as any).category
        businessData.mainSubcategory = (business as any).subcategory
      }

      // Check different category storage formats
      const categoryKeys = [
        `:categories`,
        `:allCategories`,
        `:allSubcategories`,
        `:selectedCategoryIds`,
        `:selectedSubcategoryIds`,
        `:categorySelections`,
        `:categoriesWithSubcategories`,
        `:simplifiedCategories`,
      ]

      for (const suffix of categoryKeys) {
        const key = `${KEY_PREFIXES.BUSINESS}${businessId}${suffix}`
        try {
          const data = await kv.get(key)
          if (data) {
            businessData.categoryStorageFormats[suffix] = {
              type: typeof data,
              value: data,
              parsed:
                typeof data === "string"
                  ? (() => {
                      try {
                        return JSON.parse(data)
                      } catch {
                        return data
                      }
                    })()
                  : data,
            }

            // Collect category names
            if (typeof data === "string") {
              try {
                const parsed = JSON.parse(data)
                if (Array.isArray(parsed)) {
                  parsed.forEach((item: any) => {
                    if (typeof item === "string") {
                      result.allCategoryNames.add(item)
                    } else if (item && typeof item === "object") {
                      if (item.category) result.allCategoryNames.add(item.category)
                      if (item.subcategory) result.allCategoryNames.add(item.subcategory)
                      if (item.name) result.allCategoryNames.add(item.name)
                    }
                  })
                }
              } catch (e) {
                result.allCategoryNames.add(data)
              }
            }
          }
        } catch (error) {
          console.error(`Error checking ${key}:`, error)
        }
      }

      result.sampleBusinesses.push(businessData)
    }

    // Check category indexes
    const categoryPatterns = [
      "category:*",
      "category:tailors*",
      "category:*tailor*",
      "category:*dressmaker*",
      "category:*fabric*",
      "category:*clothing*",
    ]

    for (const pattern of categoryPatterns) {
      try {
        const keys = await kv.keys(pattern)
        for (const key of keys.slice(0, 10)) {
          // Limit to first 10 results
          const members = await kv.smembers(key)
          if (members && members.length > 0) {
            result.categoryIndexes.push({
              key,
              memberCount: members.length,
              sampleMembers: members.slice(0, 3),
            })
          }
        }
      } catch (error) {
        console.error(`Error checking pattern ${pattern}:`, error)
      }
    }

    // Convert Set to Array for JSON serialization
    result.categoryFormats.allUniqueNames = Array.from(result.allCategoryNames).sort()

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error inspecting category storage:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function searchCategoryKeys(pattern = "*tailor*") {
  try {
    const keys = await kv.keys(`category:${pattern}`)
    const results = []

    for (const key of keys.slice(0, 20)) {
      // Limit results
      try {
        const members = await kv.smembers(key)
        results.push({
          key,
          memberCount: members ? members.length : 0,
          members: members || [],
        })
      } catch (error) {
        console.error(`Error getting members for ${key}:`, error)
      }
    }

    return {
      success: true,
      data: results,
    }
  } catch (error) {
    console.error("Error searching category keys:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
