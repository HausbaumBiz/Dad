"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

export interface BusinessCategorySyncAnalysis {
  businessId: string
  businessFound: boolean
  businessData: any
  currentCategories: string[]
  redisCategories: string[]
  categoriesToRemove: string[]
  categoriesToKeep: string[]
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

export async function analyzeBusinessCategorySync(businessId: string): Promise<BusinessCategorySyncAnalysis> {
  try {
    console.log(`Analyzing category sync for business ${businessId}`)

    // Get business data
    const businessData = await kv.get(`business:${businessId}`)
    if (!businessData) {
      return {
        businessId,
        businessFound: false,
        businessData: null,
        currentCategories: [],
        redisCategories: [],
        categoriesToRemove: [],
        categoriesToKeep: [],
        error: "Business not found",
      }
    }

    const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData

    // Get currently selected categories from business record
    const currentCategories: string[] = []
    if (business.category) currentCategories.push(business.category)
    if (business.subcategory) currentCategories.push(business.subcategory)
    if (business.allCategories && Array.isArray(business.allCategories)) {
      currentCategories.push(...business.allCategories)
    }
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      currentCategories.push(...business.allSubcategories)
    }

    // Remove duplicates and filter out empty values
    const uniqueCurrentCategories = [...new Set(currentCategories)].filter(Boolean)

    console.log(`Current categories from business record:`, uniqueCurrentCategories)

    // Find which Redis category indexes contain this business
    const redisCategories: string[] = []
    const commonCategories = [
      "automotive-services",
      "elder-care",
      "financial-services",
      "automotive",
      "homecare",
      "insurance,-finance,-debt-and-sales",
      "home-improvement",
      "beauty-wellness",
      "care-services",
      "child-care",
      "education-tutoring",
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
      "mortuary-services",
    ]

    for (const category of commonCategories) {
      const categoryKey = `category:${category}`
      try {
        const exists = await kv.exists(categoryKey)
        if (exists) {
          const members = await kv.smembers(categoryKey)
          if (Array.isArray(members) && members.includes(businessId)) {
            redisCategories.push(category)
          }
        }
      } catch (error) {
        console.error(`Error checking category ${category}:`, error)
      }
    }

    console.log(`Redis categories containing business:`, redisCategories)

    // Convert current categories to Redis key format for comparison
    const currentCategoriesRedisFormat = uniqueCurrentCategories.map((cat) =>
      cat.toLowerCase().replace(/\s+/g, "-").replace(/,/g, ",-"),
    )

    console.log(`Current categories in Redis format:`, currentCategoriesRedisFormat)

    // Determine which categories to remove and which to keep
    const categoriesToRemove = redisCategories.filter(
      (redisCategory) => !currentCategoriesRedisFormat.includes(redisCategory),
    )

    const categoriesToKeep = redisCategories.filter((redisCategory) =>
      currentCategoriesRedisFormat.includes(redisCategory),
    )

    return {
      businessId,
      businessFound: true,
      businessData: business,
      currentCategories: uniqueCurrentCategories,
      redisCategories,
      categoriesToRemove,
      categoriesToKeep,
    }
  } catch (error) {
    return {
      businessId,
      businessFound: false,
      businessData: null,
      currentCategories: [],
      redisCategories: [],
      categoriesToRemove: [],
      categoriesToKeep: [],
      error: getErrorMessage(error),
    }
  }
}

export async function syncBusinessCategories(businessId: string): Promise<{
  success: boolean
  message: string
  details: string[]
}> {
  const details: string[] = []

  try {
    console.log(`Starting category sync for business ${businessId}`)

    // Get current analysis
    const analysis = await analyzeBusinessCategorySync(businessId)
    if (!analysis.businessFound) {
      return {
        success: false,
        message: "Business not found",
        details: ["Cannot sync categories for non-existent business"],
      }
    }

    details.push(`Found ${analysis.categoriesToRemove.length} categories to remove`)
    details.push(`Found ${analysis.categoriesToKeep.length} categories to keep`)

    // Step 1: Remove business from categories that should not be there
    let removedFromCategories = 0
    for (const category of analysis.categoriesToRemove) {
      const categoryKey = `category:${category}`
      try {
        const removed = await kv.srem(categoryKey, businessId)
        if (removed > 0) {
          removedFromCategories++
          details.push(`Removed business from category: ${categoryKey}`)
        }
      } catch (error) {
        details.push(`Error removing from category ${categoryKey}: ${getErrorMessage(error)}`)
      }
    }

    // Step 2: Ensure business is in categories it should be in
    let addedToCategories = 0
    const currentCategoriesRedisFormat = analysis.currentCategories.map((cat) =>
      cat.toLowerCase().replace(/\s+/g, "-").replace(/,/g, ",-"),
    )

    for (const category of currentCategoriesRedisFormat) {
      const categoryKey = `category:${category}`
      try {
        const added = await kv.sadd(categoryKey, businessId)
        if (added > 0) {
          addedToCategories++
          details.push(`Added business to category: ${categoryKey}`)
        } else {
          details.push(`Business already in category: ${categoryKey}`)
        }
      } catch (error) {
        details.push(`Error adding to category ${categoryKey}: ${getErrorMessage(error)}`)
      }
    }

    // Step 3: Update business record to ensure it only contains current categories
    try {
      const cleanBusiness = {
        ...analysis.businessData,
        allCategories: analysis.currentCategories,
        allSubcategories: [], // Clear subcategories as they should be in allCategories
        categoriesCount: analysis.currentCategories.length,
        updatedAt: new Date().toISOString(),
      }

      await kv.set(`business:${businessId}`, cleanBusiness)
      details.push("Updated business record with clean category data")
    } catch (error) {
      details.push(`Error updating business record: ${getErrorMessage(error)}`)
    }

    // Step 4: Clean up any empty category indexes
    let cleanedEmptyCategories = 0
    for (const category of analysis.categoriesToRemove) {
      const categoryKey = `category:${category}`
      try {
        const members = await kv.smembers(categoryKey)
        if (Array.isArray(members) && members.length === 0) {
          await kv.del(categoryKey)
          cleanedEmptyCategories++
          details.push(`Deleted empty category index: ${categoryKey}`)
        }
      } catch (error) {
        details.push(`Error checking/cleaning category ${categoryKey}: ${getErrorMessage(error)}`)
      }
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

    const summary = `Successfully synced categories: removed from ${removedFromCategories} categories, ensured presence in ${analysis.categoriesToKeep.length} categories, cleaned ${cleanedEmptyCategories} empty indexes`

    return {
      success: true,
      message: summary,
      details,
    }
  } catch (error) {
    return {
      success: false,
      message: "Sync operation failed",
      details: [...details, `Error: ${getErrorMessage(error)}`],
    }
  }
}
