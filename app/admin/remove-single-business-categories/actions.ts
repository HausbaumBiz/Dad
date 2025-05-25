"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { KEY_PREFIXES } from "@/lib/db-schema"
import type { Business } from "@/lib/definitions"

export async function getBusinessInfo(businessId: string) {
  try {
    console.log(`Getting business info for ${businessId}`)

    // Get business data
    const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
    if (!businessData) {
      return {
        found: false,
        error: "Business not found",
      }
    }

    const business = businessData as Business

    // Check for category data
    const hasCategories =
      business.category ||
      business.subcategory ||
      (business.allCategories && business.allCategories.length > 0) ||
      (business.allSubcategories && business.allSubcategories.length > 0) ||
      (business.categoriesCount && business.categoriesCount > 0)

    return {
      found: true,
      businessName: business.businessName,
      email: business.email,
      city: business.city,
      state: business.state,
      category: business.category,
      subcategory: business.subcategory,
      allCategories: business.allCategories || [],
      allSubcategories: business.allSubcategories || [],
      categoriesCount: business.categoriesCount || 0,
      hasCategories: Boolean(hasCategories),
    }
  } catch (error) {
    console.error(`Error getting business info for ${businessId}:`, error)
    return {
      found: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function removeCategoriesFromBusiness(businessId: string): Promise<{
  success: boolean
  message: string
  details: string[]
}> {
  const details: string[] = []

  try {
    console.log(`Starting category removal for business ${businessId}`)

    // Get current business data
    const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
    if (!businessData) {
      return {
        success: false,
        message: "Business not found",
        details: [`Business ${businessId} does not exist`],
      }
    }

    const business = businessData as Business
    details.push(`Found business: ${business.businessName || "Unnamed"}`)

    // Get current categories to remove from indexes
    let currentCategories: string[] = []
    try {
      const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
      if (categoriesData) {
        if (typeof categoriesData === "string") {
          try {
            const parsed = JSON.parse(categoriesData)
            if (Array.isArray(parsed)) {
              currentCategories = parsed.map((cat: any) => cat.category || cat.name || cat).filter(Boolean)
            }
          } catch (e) {
            console.error(`Error parsing categories for business ${businessId}:`, e)
          }
        }
      }
    } catch (e) {
      console.error(`Error getting categories for business ${businessId}:`, e)
    }

    // Collect all possible category formats to clean up
    const allCategoryFormats = [
      // From current categories data
      ...currentCategories.map((cat) => cat.toLowerCase().replace(/\s+/g, "-")),
      ...currentCategories.map((cat) => cat.toLowerCase().replace(/\s+/g, "_")),
      ...currentCategories.map((cat) => cat.toLowerCase().replace(/\s+/g, "")),
      ...currentCategories,

      // From business object
      business.category,
      business.subcategory,
      ...(business.allCategories || []),
      ...(business.allSubcategories || []),

      // Common category formats
      "automotive",
      "automotiveServices",
      "automotive-services",
      "Automotive Services",
      "Automotive/Motorcycle/RV",
      "auto-services",
      "autoServices",
      "artDesignEntertainment",
      "Art, Design and Entertainment",
      "arts-entertainment",
      "Arts & Entertainment",
      "art-design-entertainment",
      "art-design-and-entertainment",
      "arts-&-entertainment",
      "mortuaryServices",
      "mortuary-services",
      "mortuary_services",
      "funeral-services",
      "funeral_services",
      "funeralServices",
      "Mortuary Services",
      "Funeral Services",
    ]

    // Remove duplicates and filter out empty values
    const uniqueCategoryFormats = [...new Set(allCategoryFormats)].filter(Boolean)
    details.push(`Found ${uniqueCategoryFormats.length} category formats to clean up`)

    // Remove business from all category indexes
    let removedFromIndexes = 0
    for (const categoryFormat of uniqueCategoryFormats) {
      try {
        const removed1 = await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryFormat}`, businessId)
        const removed2 = await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryFormat}:businesses`, businessId)
        if (removed1 > 0 || removed2 > 0) {
          removedFromIndexes++
          details.push(`Removed from category index: ${categoryFormat}`)
        }
      } catch (e) {
        console.error(`Error removing business ${businessId} from category ${categoryFormat}:`, e)
        details.push(`Error removing from category index ${categoryFormat}: ${e}`)
      }
    }

    // Delete category-specific keys
    const categoryKeys = [
      `${KEY_PREFIXES.BUSINESS}${businessId}:categories`,
      `${KEY_PREFIXES.BUSINESS}${businessId}:allCategories`,
      `${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`,
      `${KEY_PREFIXES.BUSINESS}${businessId}:categoriesWithSubcategories`,
      `${KEY_PREFIXES.BUSINESS}${businessId}:simplifiedCategories`,
    ]

    let deletedKeys = 0
    for (const key of categoryKeys) {
      try {
        const deleted = await kv.del(key)
        if (deleted > 0) {
          deletedKeys++
          details.push(`Deleted Redis key: ${key}`)
        }
      } catch (e) {
        console.error(`Error deleting key ${key}:`, e)
        details.push(`Error deleting key ${key}: ${e}`)
      }
    }

    // Update business object to remove category fields
    const updatedBusiness = {
      ...business,
      // Remove category fields
      category: undefined,
      subcategory: undefined,
      allCategories: undefined,
      allSubcategories: undefined,
      categoriesCount: 0,
      // Update timestamp
      updatedAt: new Date().toISOString(),
    }

    // Remove undefined fields
    Object.keys(updatedBusiness).forEach((key) => {
      if (updatedBusiness[key as keyof typeof updatedBusiness] === undefined) {
        delete updatedBusiness[key as keyof typeof updatedBusiness]
      }
    })

    // Save updated business
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}`, updatedBusiness)
    details.push("Updated business record with category fields removed")

    // Revalidate relevant paths
    try {
      revalidatePath("/admin/businesses")
      revalidatePath("/business-focus")
      revalidatePath("/statistics")
      revalidatePath("/workbench")
      details.push("Revalidated application paths")
    } catch (e) {
      console.error("Error revalidating paths:", e)
      details.push(`Warning: Error revalidating paths: ${e}`)
    }

    details.push(`Summary: Removed from ${removedFromIndexes} category indexes, deleted ${deletedKeys} Redis keys`)

    return {
      success: true,
      message: `Successfully removed all category data from business ${business.businessName || businessId}`,
      details,
    }
  } catch (error) {
    console.error(`Error removing categories from business ${businessId}:`, error)
    return {
      success: false,
      message: "Failed to remove categories",
      details: [...details, `Error: ${error instanceof Error ? error.message : "Unknown error"}`],
    }
  }
}
