"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { KEY_PREFIXES } from "@/lib/db-schema"
import type { Business } from "@/lib/definitions"

export async function removeAllCategoriesFromAllBusinesses(): Promise<{
  success: boolean
  message: string
  processed: number
  errors: number
  details: string[]
}> {
  const details: string[] = []
  let processed = 0
  let errors = 0

  try {
    console.log("Starting category removal process...")

    // Get all business IDs
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    console.log(`Found ${businessIds.length} businesses to process`)

    if (!businessIds || businessIds.length === 0) {
      return {
        success: true,
        message: "No businesses found to process",
        processed: 0,
        errors: 0,
        details: ["No businesses found in the database"],
      }
    }

    // Process each business
    for (const businessId of businessIds) {
      try {
        console.log(`Processing business ${businessId}`)

        // Get current business data
        const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
        if (!businessData) {
          console.log(`Business ${businessId} not found, skipping`)
          details.push(`Business ${businessId}: Not found, skipped`)
          continue
        }

        const business = businessData as Business

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

        // Remove business from all category indexes
        const allCategoryFormats = [
          // Standard formats
          ...currentCategories.map((cat) => cat.toLowerCase().replace(/\s+/g, "-")),
          ...currentCategories.map((cat) => cat.toLowerCase().replace(/\s+/g, "_")),
          ...currentCategories.map((cat) => cat.toLowerCase().replace(/\s+/g, "")),
          ...currentCategories,

          // Special category formats
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

          // Legacy formats from business object
          business.category,
          business.subcategory,
        ]

        // Remove duplicates and filter out empty values
        const uniqueCategoryFormats = [...new Set(allCategoryFormats)].filter(Boolean)

        // Remove business from all category indexes
        for (const categoryFormat of uniqueCategoryFormats) {
          try {
            await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryFormat}`, businessId)
            await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryFormat}:businesses`, businessId)
          } catch (e) {
            console.error(`Error removing business ${businessId} from category ${categoryFormat}:`, e)
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

        for (const key of categoryKeys) {
          try {
            await kv.del(key)
          } catch (e) {
            console.error(`Error deleting key ${key}:`, e)
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

        processed++
        details.push(`Business ${businessId} (${business.businessName || "Unnamed"}): Categories removed successfully`)
        console.log(`Successfully processed business ${businessId}`)
      } catch (error) {
        errors++
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        details.push(`Business ${businessId}: Error - ${errorMessage}`)
        console.error(`Error processing business ${businessId}:`, error)
      }
    }

    // Revalidate relevant paths
    try {
      revalidatePath("/admin/businesses")
      revalidatePath("/business-focus")
      revalidatePath("/statistics")
      revalidatePath("/workbench")
    } catch (e) {
      console.error("Error revalidating paths:", e)
    }

    const message =
      errors === 0
        ? `Successfully removed categories from ${processed} businesses`
        : `Processed ${processed} businesses with ${errors} errors`

    return {
      success: errors === 0,
      message,
      processed,
      errors,
      details,
    }
  } catch (error) {
    console.error("Error in removeAllCategoriesFromAllBusinesses:", error)
    return {
      success: false,
      message: "Failed to remove categories",
      processed,
      errors: errors + 1,
      details: [...details, `Global error: ${error instanceof Error ? error.message : "Unknown error"}`],
    }
  }
}
