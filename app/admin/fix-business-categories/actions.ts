"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

export interface CorruptedKey {
  key: string
  error: string
}

export interface BusinessCategoryAnalysis {
  businessId: string
  businessFound: boolean
  businessData: any
  corruptedKeys: CorruptedKey[]
  validKeys: string[]
  totalErrors: number
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

export async function analyzeBusinessCategories(businessId: string): Promise<BusinessCategoryAnalysis> {
  try {
    console.log(`Analyzing category data for business ${businessId}`)

    // Get business data first
    const businessData = await kv.get(`business:${businessId}`)
    if (!businessData) {
      return {
        businessId,
        businessFound: false,
        businessData: null,
        corruptedKeys: [],
        validKeys: [],
        totalErrors: 0,
        error: "Business not found",
      }
    }

    const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData

    // Instead of using SCAN (which might not work with Upstash),
    // let's check specific keys that we know should exist for this business
    const businessRelatedKeys: string[] = []

    // Check specific business keys directly
    const directKeys = [
      `business:${businessId}`,
      `business:${businessId}:categories`,
      `business:${businessId}:media`,
      `business:${businessId}:zipcodes`,
      `business:${businessId}:nationwide`,
    ]

    for (const key of directKeys) {
      try {
        const exists = await kv.exists(key)
        if (exists) {
          businessRelatedKeys.push(key)
        }
      } catch (error) {
        // Key might be corrupted, add it to check
        businessRelatedKeys.push(key)
      }
    }

    // Check for category keys that might contain this business
    // We'll check common category patterns instead of scanning all keys
    const commonCategories = [
      "home-improvement",
      "automotive-services",
      "beauty-wellness",
      "care-services",
      "child-care",
      "education-tutoring",
      "elder-care",
      "financial-services",
      "fitness-athletics",
      "food-dining",
      "funeral-services",
      "legal-services",
      "medical-practitioners",
      "mental-health",
      "music-lessons",
      "personal-assistants",
      "pet-care",
      "physical-rehabilitation",
      "real-estate",
      "retail-stores",
      "tailoring-clothing",
      "tech-it-services",
      "travel-vacation",
      "weddings-events",
      "arts-entertainment",
      "automotive",
      "homecare",
      "mortuary-services",
    ]

    // Also check categories from the business data itself
    const businessCategories: string[] = []
    if (business.category) businessCategories.push(business.category)
    if (business.subcategory) businessCategories.push(business.subcategory)
    if (business.allCategories && Array.isArray(business.allCategories)) {
      businessCategories.push(...business.allCategories)
    }
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      businessCategories.push(...business.allSubcategories)
    }

    // Convert business categories to Redis key format
    const categoryKeys = [...new Set([...commonCategories, ...businessCategories])]
      .filter(Boolean)
      .map((cat) => `category:${cat.toLowerCase().replace(/\s+/g, "-")}`)

    console.log(`Checking ${businessRelatedKeys.length} business keys and ${categoryKeys.length} category keys`)

    const corruptedKeys: CorruptedKey[] = []
    const validKeys: string[] = []
    let totalErrors = 0

    // Test each business-related key
    for (const key of businessRelatedKeys) {
      try {
        const type = await kv.type(key)

        if (type === "set") {
          const members = await kv.smembers(key)
          if (Array.isArray(members)) {
            validKeys.push(key)
          } else {
            corruptedKeys.push({
              key,
              error: `Set key returned non-array: ${typeof members}`,
            })
            totalErrors++
          }
        } else if (type === "string") {
          const value = await kv.get(key)
          if (value !== null) {
            validKeys.push(key)
          } else {
            corruptedKeys.push({
              key,
              error: "String key returned null",
            })
            totalErrors++
          }
        } else if (type === "hash") {
          const hash = await kv.hgetall(key)
          if (hash && typeof hash === "object") {
            validKeys.push(key)
          } else {
            corruptedKeys.push({
              key,
              error: `Hash key returned invalid data: ${typeof hash}`,
            })
            totalErrors++
          }
        } else if (type === "list") {
          const list = await kv.lrange(key, 0, -1)
          if (Array.isArray(list)) {
            validKeys.push(key)
          } else {
            corruptedKeys.push({
              key,
              error: `List key returned non-array: ${typeof list}`,
            })
            totalErrors++
          }
        } else if (type === "none") {
          corruptedKeys.push({
            key,
            error: "Key exists but type is 'none'",
          })
          totalErrors++
        } else {
          corruptedKeys.push({
            key,
            error: `Unknown Redis type: ${type}`,
          })
          totalErrors++
        }
      } catch (error) {
        corruptedKeys.push({
          key,
          error: getErrorMessage(error),
        })
        totalErrors++
      }
    }

    // Test category keys that might reference this business
    for (const categoryKey of categoryKeys) {
      try {
        const exists = await kv.exists(categoryKey)
        if (exists) {
          try {
            const members = await kv.smembers(categoryKey)
            if (!Array.isArray(members)) {
              corruptedKeys.push({
                key: categoryKey,
                error: `Category key returned non-array: ${typeof members}`,
              })
              totalErrors++
            } else if (members.includes(businessId)) {
              validKeys.push(categoryKey)
            }
          } catch (error) {
            corruptedKeys.push({
              key: categoryKey,
              error: `Error accessing category key: ${getErrorMessage(error)}`,
            })
            totalErrors++
          }
        }
      } catch (error) {
        corruptedKeys.push({
          key: categoryKey,
          error: `Error checking category key existence: ${getErrorMessage(error)}`,
        })
        totalErrors++
      }
    }

    return {
      businessId,
      businessFound: true,
      businessData: business,
      corruptedKeys,
      validKeys,
      totalErrors,
    }
  } catch (error) {
    return {
      businessId,
      businessFound: false,
      businessData: null,
      corruptedKeys: [],
      validKeys: [],
      totalErrors: 0,
      error: getErrorMessage(error),
    }
  }
}

export async function fixBusinessCategories(businessId: string): Promise<{
  success: boolean
  message: string
  details: string[]
}> {
  const details: string[] = []

  try {
    console.log(`Starting fix for business ${businessId}`)

    // Get current analysis
    const analysis = await analyzeBusinessCategories(businessId)
    if (!analysis.businessFound) {
      return {
        success: false,
        message: "Business not found",
        details: ["Cannot fix categories for non-existent business"],
      }
    }

    details.push(`Found ${analysis.corruptedKeys.length} corrupted keys to fix`)

    // Step 1: Delete all corrupted keys
    let deletedKeys = 0
    for (const corruptedKey of analysis.corruptedKeys) {
      try {
        await kv.del(corruptedKey.key)
        deletedKeys++
        details.push(`Deleted corrupted key: ${corruptedKey.key}`)
      } catch (error) {
        details.push(`Error deleting ${corruptedKey.key}: ${getErrorMessage(error)}`)
      }
    }

    // Step 2: Clean up category references to this business
    const commonCategories = [
      "home-improvement",
      "automotive-services",
      "beauty-wellness",
      "care-services",
      "child-care",
      "education-tutoring",
      "elder-care",
      "financial-services",
      "fitness-athletics",
      "food-dining",
      "funeral-services",
      "legal-services",
      "medical-practitioners",
      "mental-health",
      "music-lessons",
      "personal-assistants",
      "pet-care",
      "physical-rehabilitation",
      "real-estate",
      "retail-stores",
      "tailoring-clothing",
      "tech-it-services",
      "travel-vacation",
      "weddings-events",
      "arts-entertainment",
      "automotive",
      "homecare",
      "mortuary-services",
    ]

    let cleanedCategoryRefs = 0
    for (const category of commonCategories) {
      const categoryKey = `category:${category}`
      try {
        const removed = await kv.srem(categoryKey, businessId)
        if (removed > 0) {
          cleanedCategoryRefs++
          details.push(`Removed business from category: ${categoryKey}`)
        }
      } catch (error) {
        // Try to delete the entire key if it's corrupted
        try {
          const members = await kv.smembers(categoryKey)
          if (!Array.isArray(members)) {
            await kv.del(categoryKey)
            details.push(`Deleted corrupted category key: ${categoryKey}`)
          }
        } catch (deleteError) {
          details.push(`Error handling category ${categoryKey}: ${getErrorMessage(error)}`)
        }
      }
    }

    // Step 3: Rebuild clean category references from business data
    const business = analysis.businessData
    const categories: string[] = []

    // Collect valid categories from business data
    if (business.category) categories.push(business.category)
    if (business.subcategory) categories.push(business.subcategory)
    if (business.allCategories && Array.isArray(business.allCategories)) {
      categories.push(...business.allCategories)
    }
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      categories.push(...business.allSubcategories)
    }

    // Remove duplicates
    const uniqueCategories = [...new Set(categories)].filter(Boolean)

    // Rebuild category indexes
    let rebuiltCategories = 0
    for (const category of uniqueCategories) {
      try {
        const categoryKey = `category:${category.toLowerCase().replace(/\s+/g, "-")}`
        await kv.sadd(categoryKey, businessId)
        rebuiltCategories++
        details.push(`Rebuilt category index: ${categoryKey}`)
      } catch (error) {
        details.push(`Error rebuilding category ${category}: ${getErrorMessage(error)}`)
      }
    }

    // Step 4: Clean up the business record itself
    try {
      const cleanBusiness = {
        ...business,
        allCategories: business.allCategories && Array.isArray(business.allCategories) ? business.allCategories : [],
        allSubcategories:
          business.allSubcategories && Array.isArray(business.allSubcategories) ? business.allSubcategories : [],
        categoriesCount: uniqueCategories.length,
        updatedAt: new Date().toISOString(),
      }

      await kv.set(`business:${businessId}`, cleanBusiness)
      details.push("Cleaned and updated business record")
    } catch (error) {
      details.push(`Error updating business record: ${getErrorMessage(error)}`)
    }

    // Step 5: Revalidate paths
    try {
      revalidatePath("/admin/redis-structure")
      revalidatePath("/business-focus")
      revalidatePath("/admin/businesses")
      details.push("Revalidated application paths")
    } catch (error) {
      details.push(`Warning: Error revalidating paths: ${getErrorMessage(error)}`)
    }

    const summary = `Successfully fixed business categories: deleted ${deletedKeys} corrupted keys, cleaned ${cleanedCategoryRefs} category references, rebuilt ${rebuiltCategories} clean category indexes`

    return {
      success: true,
      message: summary,
      details,
    }
  } catch (error) {
    return {
      success: false,
      message: "Fix operation failed",
      details: [...details, `Error: ${getErrorMessage(error)}`],
    }
  }
}
