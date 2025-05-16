"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

export async function fixArtsCategories() {
  try {
    // Get all businesses
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    console.log(`Found ${businessIds.length} businesses to check`)

    let fixedCount = 0

    for (const businessId of businessIds) {
      try {
        // Get business data
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
        if (!business) continue

        // Check if business has arts-related categories or subcategories
        let hasArtsCategory = false

        // Check main category
        if (business.category) {
          const categoryLower = business.category.toLowerCase()
          if (
            categoryLower.includes("art") ||
            categoryLower.includes("design") ||
            categoryLower.includes("entertainment") ||
            categoryLower.includes("creative")
          ) {
            hasArtsCategory = true
          }
        }

        // Check subcategory
        if (business.subcategory) {
          const subcategoryLower = business.subcategory.toLowerCase()
          if (
            subcategoryLower.includes("art") ||
            subcategoryLower.includes("design") ||
            subcategoryLower.includes("music") ||
            subcategoryLower.includes("photo") ||
            subcategoryLower.includes("entertainment") ||
            subcategoryLower.includes("creative") ||
            subcategoryLower.includes("gallery") ||
            subcategoryLower.includes("studio")
          ) {
            hasArtsCategory = true
          }
        }

        // Check allCategories array
        if (business.allCategories && Array.isArray(business.allCategories)) {
          for (const category of business.allCategories) {
            const categoryLower = category.toLowerCase()
            if (
              categoryLower.includes("art") ||
              categoryLower.includes("design") ||
              categoryLower.includes("entertainment") ||
              categoryLower.includes("creative")
            ) {
              hasArtsCategory = true
              break
            }
          }
        }

        // Check allSubcategories array
        if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
          for (const subcategory of business.allSubcategories) {
            const subcategoryLower = subcategory.toLowerCase()
            if (
              subcategoryLower.includes("art") ||
              subcategoryLower.includes("design") ||
              subcategoryLower.includes("music") ||
              subcategoryLower.includes("photo") ||
              subcategoryLower.includes("entertainment") ||
              subcategoryLower.includes("creative") ||
              subcategoryLower.includes("gallery") ||
              subcategoryLower.includes("studio")
            ) {
              hasArtsCategory = true
              break
            }
          }
        }

        // If business has arts-related category, add to arts category indexes
        if (hasArtsCategory) {
          console.log(`Business ${businessId} has arts-related category, adding to arts category indexes`)

          // Add to arts-entertainment category explicitly with multiple formats
          const artsFormats = [
            "artDesignEntertainment",
            "Art, Design and Entertainment",
            "arts-entertainment",
            "Arts & Entertainment",
            "art-design-entertainment",
            "art-design-and-entertainment",
            "arts-&-entertainment",
          ]

          for (const format of artsFormats) {
            await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
            await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
          }

          fixedCount++
        }
      } catch (error) {
        console.error(`Error processing business ${businessId}:`, error)
      }
    }

    // Revalidate paths
    revalidatePath("/arts-entertainment")

    return {
      success: true,
      message: `Fixed ${fixedCount} businesses with arts-related categories`,
    }
  } catch (error) {
    console.error("Error fixing arts categories:", error)
    return {
      success: false,
      message: "Failed to fix arts categories",
    }
  }
}
