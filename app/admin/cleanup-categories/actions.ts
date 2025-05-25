"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

export interface CorruptedKey {
  key: string
  error: string
}

export interface AnalysisResult {
  totalCategoryKeys: number
  corruptedKeys: CorruptedKey[]
  validKeys: string[]
  businessCategories: string[]
  orphanedKeys: string[]
  recommendations: string[]
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return String(error)
}

export async function analyzeCategoryData(): Promise<AnalysisResult> {
  try {
    console.log("Starting category data analysis...")

    // Get all category keys
    const categoryKeys = await kv.keys("category:*")
    console.log(`Found ${categoryKeys.length} category keys`)

    const corruptedKeys: CorruptedKey[] = []
    const validKeys: string[] = []
    const orphanedKeys: string[] = []

    // Test each category key
    for (const key of categoryKeys) {
      try {
        // Try to access the key as a set (which is what category indexes should be)
        const members = await kv.smembers(key)

        // Check if the result is an array (valid set)
        if (Array.isArray(members)) {
          validKeys.push(key)

          // Check if it's orphaned (no businesses in the set)
          if (members.length === 0) {
            orphanedKeys.push(key)
          }
        } else {
          // Not an array - this is likely corrupted
          corruptedKeys.push({
            key,
            error: `Expected array but got ${typeof members}: ${String(members).substring(0, 100)}`,
          })
        }
      } catch (error) {
        // Error accessing the key - definitely corrupted
        corruptedKeys.push({
          key,
          error: getErrorMessage(error),
        })
      }
    }

    // Get categories from business data (the source of truth)
    const businessCategories = new Set<string>()

    try {
      const businessIds = await kv.smembers("businesses")
      const allBusinessIds = Array.isArray(businessIds) ? businessIds.map((id) => String(id)) : []

      console.log(`Checking ${allBusinessIds.length} businesses for categories`)

      for (const businessId of allBusinessIds) {
        try {
          const businessData = await kv.get(`business:${businessId}`)
          if (!businessData) continue

          const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData

          // Collect all categories from this business
          if (business.category) businessCategories.add(business.category)
          if (business.subcategory) businessCategories.add(business.subcategory)
          if (business.allCategories && Array.isArray(business.allCategories)) {
            business.allCategories.forEach((cat: string) => businessCategories.add(cat))
          }
          if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
            business.allSubcategories.forEach((cat: string) => businessCategories.add(cat))
          }
        } catch (error) {
          console.error(`Error processing business ${businessId}:`, error)
        }
      }
    } catch (error) {
      console.error("Error getting business data:", error)
    }

    // Generate recommendations
    const recommendations: string[] = []

    if (corruptedKeys.length > 0) {
      recommendations.push(
        `Remove ${corruptedKeys.length} corrupted category keys that are causing "t.map is not a function" errors`,
      )
    }

    if (orphanedKeys.length > 0) {
      recommendations.push(`Remove ${orphanedKeys.length} orphaned category keys with no associated businesses`)
    }

    if (businessCategories.size > 0) {
      recommendations.push(
        `Rebuild category indexes for ${businessCategories.size} valid categories found in business data`,
      )
    }

    if (corruptedKeys.length === 0 && orphanedKeys.length === 0) {
      recommendations.push("Category data appears to be clean - no corrupted keys found")
    } else {
      recommendations.push("Run the cleanup process to fix all identified issues")
    }

    return {
      totalCategoryKeys: categoryKeys.length,
      corruptedKeys,
      validKeys,
      businessCategories: Array.from(businessCategories).sort(),
      orphanedKeys,
      recommendations,
    }
  } catch (error) {
    throw new Error(`Analysis failed: ${getErrorMessage(error)}`)
  }
}

export async function cleanupCategories(): Promise<{
  success: boolean
  message: string
  details: string[]
}> {
  const details: string[] = []

  try {
    console.log("Starting category cleanup...")

    // Step 1: Get current analysis
    const analysis = await analyzeCategoryData()
    details.push(
      `Found ${analysis.corruptedKeys.length} corrupted keys and ${analysis.orphanedKeys.length} orphaned keys`,
    )

    // Step 2: Remove all corrupted category keys
    let deletedCorrupted = 0
    for (const corruptedKey of analysis.corruptedKeys) {
      try {
        await kv.del(corruptedKey.key)
        deletedCorrupted++
        details.push(`Deleted corrupted key: ${corruptedKey.key}`)
      } catch (error) {
        details.push(`Error deleting ${corruptedKey.key}: ${getErrorMessage(error)}`)
      }
    }

    // Step 3: Remove orphaned category keys
    let deletedOrphaned = 0
    for (const orphanedKey of analysis.orphanedKeys) {
      try {
        await kv.del(orphanedKey)
        deletedOrphaned++
        details.push(`Deleted orphaned key: ${orphanedKey}`)
      } catch (error) {
        details.push(`Error deleting ${orphanedKey}: ${getErrorMessage(error)}`)
      }
    }

    // Step 4: Remove ALL remaining category keys to start fresh
    const allCategoryKeys = await kv.keys("category:*")
    let deletedAll = 0
    for (const key of allCategoryKeys) {
      try {
        await kv.del(key)
        deletedAll++
      } catch (error) {
        details.push(`Error deleting ${key}: ${getErrorMessage(error)}`)
      }
    }
    details.push(`Deleted ${deletedAll} remaining category keys for fresh rebuild`)

    // Step 5: Rebuild category indexes from business data
    const businessIds = await kv.smembers("businesses")
    const allBusinessIds = Array.isArray(businessIds) ? businessIds.map((id) => String(id)) : []

    const categoryBusinessMap = new Map<string, Set<string>>()
    let processedBusinesses = 0

    for (const businessId of allBusinessIds) {
      try {
        const businessData = await kv.get(`business:${businessId}`)
        if (!businessData) continue

        const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData
        const categories: string[] = []

        // Collect all categories from this business
        if (business.category) categories.push(business.category)
        if (business.subcategory) categories.push(business.subcategory)
        if (business.allCategories && Array.isArray(business.allCategories)) {
          categories.push(...business.allCategories)
        }
        if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
          categories.push(...business.allSubcategories)
        }

        // Add business to each category's set
        for (const category of categories) {
          if (!categoryBusinessMap.has(category)) {
            categoryBusinessMap.set(category, new Set())
          }
          categoryBusinessMap.get(category)!.add(businessId)
        }

        processedBusinesses++
      } catch (error) {
        details.push(`Error processing business ${businessId}: ${getErrorMessage(error)}`)
      }
    }

    details.push(`Processed ${processedBusinesses} businesses and found ${categoryBusinessMap.size} unique categories`)

    // Step 6: Create new category indexes
    let createdIndexes = 0
    for (const [category, businessIds] of categoryBusinessMap) {
      try {
        // Create normalized category key
        const categoryKey = `category:${category.toLowerCase().replace(/\s+/g, "-")}`

        // Add all businesses to this category set
        if (businessIds.size > 0) {
          await kv.sadd(categoryKey, ...Array.from(businessIds))
          createdIndexes++
          details.push(`Created index ${categoryKey} with ${businessIds.size} businesses`)
        }
      } catch (error) {
        details.push(`Error creating index for ${category}: ${getErrorMessage(error)}`)
      }
    }

    // Step 7: Revalidate relevant paths
    try {
      revalidatePath("/admin/redis-structure")
      revalidatePath("/business-focus")
      revalidatePath("/statistics")
      details.push("Revalidated application paths")
    } catch (error) {
      details.push(`Warning: Error revalidating paths: ${getErrorMessage(error)}`)
    }

    const summary = `Successfully cleaned up categories: deleted ${deletedCorrupted} corrupted keys, ${deletedOrphaned} orphaned keys, and ${deletedAll} total keys, then rebuilt ${createdIndexes} clean category indexes`

    return {
      success: true,
      message: summary,
      details,
    }
  } catch (error) {
    return {
      success: false,
      message: "Category cleanup failed",
      details: [...details, `Error: ${getErrorMessage(error)}`],
    }
  }
}
