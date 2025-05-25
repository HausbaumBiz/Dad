"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

export interface BusinessDeepCleanupAnalysis {
  businessId: string
  businessFound: boolean
  businessData: any
  businessRecordCategories: string[]
  redisIndexCategories: string[]
  allCategoryKeys: string[]
  problematicCategories: string[]
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

export async function analyzeBusinessDeepCleanup(businessId: string): Promise<BusinessDeepCleanupAnalysis> {
  try {
    console.log(`Performing deep analysis for business ${businessId}`)

    // Get business data
    const businessData = await kv.get(`business:${businessId}`)
    if (!businessData) {
      return {
        businessId,
        businessFound: false,
        businessData: null,
        businessRecordCategories: [],
        redisIndexCategories: [],
        allCategoryKeys: [],
        problematicCategories: [],
        error: "Business not found",
      }
    }

    const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData

    // Extract ALL categories from business record
    const businessRecordCategories: string[] = []
    if (business.category) businessRecordCategories.push(business.category)
    if (business.subcategory) businessRecordCategories.push(business.subcategory)
    if (business.allCategories && Array.isArray(business.allCategories)) {
      businessRecordCategories.push(...business.allCategories)
    }
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      businessRecordCategories.push(...business.allSubcategories)
    }

    // Remove duplicates
    const uniqueBusinessCategories = [...new Set(businessRecordCategories)].filter(Boolean)

    // Find Redis category indexes that contain this business
    const redisIndexCategories: string[] = []
    const allCategoryKeys: string[] = []

    // Check comprehensive list of possible category keys
    const possibleCategories = [
      "automotive-services",
      "automotive",
      "automotiveServices",
      "automotive_services",
      "auto-services",
      "autoServices",
      "Automotive Services",
      "Automotive/Motorcycle/RV",
      "automotive/motorcycle/rv",
      "home-improvement",
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
      "mortuary-services",
      "homecare",
      "insurance,-finance,-debt-and-sales",
    ]

    for (const category of possibleCategories) {
      const categoryKey = `category:${category}`
      try {
        const exists = await kv.exists(categoryKey)
        if (exists) {
          allCategoryKeys.push(categoryKey)
          const members = await kv.smembers(categoryKey)
          if (Array.isArray(members) && members.includes(businessId)) {
            redisIndexCategories.push(category)
          }
        }
      } catch (error) {
        console.error(`Error checking category ${category}:`, error)
        // Still add it to the list to be cleaned
        allCategoryKeys.push(categoryKey)
      }
    }

    // Check for business-specific category keys
    const businessSpecificKeys = [
      `business:${businessId}:categories`,
      `business:${businessId}:allCategories`,
      `business:${businessId}:allSubcategories`,
      `business:${businessId}:categoriesWithSubcategories`,
      `business:${businessId}:simplifiedCategories`,
    ]

    for (const key of businessSpecificKeys) {
      try {
        const exists = await kv.exists(key)
        if (exists) {
          allCategoryKeys.push(key)
        }
      } catch (error) {
        console.error(`Error checking business key ${key}:`, error)
      }
    }

    // Identify problematic categories (automotive-related)
    const problematicCategories = [
      ...uniqueBusinessCategories.filter(
        (cat) => cat.toLowerCase().includes("automotive") || cat.toLowerCase().includes("auto"),
      ),
      ...redisIndexCategories.filter(
        (cat) => cat.toLowerCase().includes("automotive") || cat.toLowerCase().includes("auto"),
      ),
    ]

    const uniqueProblematicCategories = [...new Set(problematicCategories)]

    return {
      businessId,
      businessFound: true,
      businessData: business,
      businessRecordCategories: uniqueBusinessCategories,
      redisIndexCategories,
      allCategoryKeys,
      problematicCategories: uniqueProblematicCategories,
    }
  } catch (error) {
    return {
      businessId,
      businessFound: false,
      businessData: null,
      businessRecordCategories: [],
      redisIndexCategories: [],
      allCategoryKeys: [],
      problematicCategories: [],
      error: getErrorMessage(error),
    }
  }
}

export async function performDeepCategoryCleanup(businessId: string): Promise<{
  success: boolean
  message: string
  details: string[]
}> {
  const details: string[] = []

  try {
    console.log(`Starting deep category cleanup for business ${businessId}`)

    // Get current analysis
    const analysis = await analyzeBusinessDeepCleanup(businessId)
    if (!analysis.businessFound) {
      return {
        success: false,
        message: "Business not found",
        details: ["Cannot perform cleanup for non-existent business"],
      }
    }

    details.push(`Starting cleanup for business: ${analysis.businessData.businessName || businessId}`)

    // Step 1: Remove business from ALL possible Redis category indexes
    const allPossibleCategories = [
      "automotive-services",
      "automotive",
      "automotiveServices",
      "automotive_services",
      "auto-services",
      "autoServices",
      "Automotive Services",
      "Automotive/Motorcycle/RV",
      "automotive/motorcycle/rv",
      "home-improvement",
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
      "mortuary-services",
      "homecare",
      "insurance,-finance,-debt-and-sales",
      // Add variations
      "artDesignEntertainment",
      "art-design-entertainment",
      "arts-&-entertainment",
      "mortuaryServices",
      "mortuary-services",
      "funeral-services",
      "funeralServices",
    ]

    let removedFromCategories = 0
    for (const category of allPossibleCategories) {
      const categoryKey = `category:${category}`
      try {
        const removed = await kv.srem(categoryKey, businessId)
        if (removed > 0) {
          removedFromCategories++
          details.push(`Removed business from: ${categoryKey}`)
        }
      } catch (error) {
        details.push(`Error removing from ${categoryKey}: ${getErrorMessage(error)}`)
      }
    }

    // Step 2: Delete ALL business-specific category keys
    const businessCategoryKeys = [
      `business:${businessId}:categories`,
      `business:${businessId}:allCategories`,
      `business:${businessId}:allSubcategories`,
      `business:${businessId}:categoriesWithSubcategories`,
      `business:${businessId}:simplifiedCategories`,
    ]

    let deletedKeys = 0
    for (const key of businessCategoryKeys) {
      try {
        const deleted = await kv.del(key)
        if (deleted > 0) {
          deletedKeys++
          details.push(`Deleted key: ${key}`)
        }
      } catch (error) {
        details.push(`Error deleting ${key}: ${getErrorMessage(error)}`)
      }
    }

    // Step 3: Completely clean the business record of ALL category data
    try {
      const cleanBusiness = {
        ...analysis.businessData,
        // Remove ALL category-related fields
        category: "",
        subcategory: "",
        allCategories: [],
        allSubcategories: [],
        categoriesCount: 0,
        // Keep other fields intact
        updatedAt: new Date().toISOString(),
      }

      await kv.set(`business:${businessId}`, cleanBusiness)
      details.push("Completely cleaned business record of all category data")
    } catch (error) {
      details.push(`Error updating business record: ${getErrorMessage(error)}`)
    }

    // Step 4: Clean up any empty category indexes
    let cleanedEmptyCategories = 0
    for (const category of allPossibleCategories) {
      const categoryKey = `category:${category}`
      try {
        const members = await kv.smembers(categoryKey)
        if (Array.isArray(members) && members.length === 0) {
          await kv.del(categoryKey)
          cleanedEmptyCategories++
          details.push(`Deleted empty category index: ${categoryKey}`)
        }
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }

    // Step 5: Revalidate paths
    try {
      revalidatePath("/admin/redis-structure")
      revalidatePath("/business-focus")
      revalidatePath("/admin/businesses")
      revalidatePath("/automotive-services")
      details.push("Revalidated application paths")
    } catch (error) {
      details.push(`Warning: Error revalidating paths: ${getErrorMessage(error)}`)
    }

    const summary = `Deep cleanup completed: removed from ${removedFromCategories} category indexes, deleted ${deletedKeys} business keys, cleaned ${cleanedEmptyCategories} empty indexes`

    return {
      success: true,
      message: summary,
      details,
    }
  } catch (error) {
    return {
      success: false,
      message: "Deep cleanup operation failed",
      details: [...details, `Error: ${getErrorMessage(error)}`],
    }
  }
}
