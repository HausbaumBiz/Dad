"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

/**
 * Function to diagnose and fix a business that's indexed in incorrect categories
 */
export async function fixBusinessCategories(businessId: string) {
  try {
    console.log(`Diagnosing business ${businessId}...`)

    // Get the business data
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
    if (!business) {
      return {
        success: false,
        message: `Business ${businessId} not found`,
      }
    }

    console.log(`Business ${businessId} found:`, {
      name: business.businessName || business.name,
      category: business.category,
      subcategory: business.subcategory,
      allCategories: business.allCategories,
      allSubcategories: business.allSubcategories,
    })

    // Check which category indexes the business is in
    const categoryIndexes = {}
    const categoryFormats = [
      // Legal categories
      "lawyers",
      "legal-services",
      "legal_services",
      "legalServices",
      "Lawyers",
      "Legal Services",

      // Home care categories
      "homecare",
      "home-care",
      "home_care",
      "eldercare",
      "elder-care",
      "elder_care",
      "Homecare",
      "Home Care",
      "Elder Care",
      "Elder Care Services",
    ]

    // Check each category format
    for (const format of categoryFormats) {
      try {
        const isMember = await kv.sismember(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
        categoryIndexes[format] = isMember

        const isMemberAlt = await kv.sismember(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
        categoryIndexes[`${format}:businesses`] = isMemberAlt
      } catch (error) {
        console.error(`Error checking if business ${businessId} is in category ${format}:`, error)
      }
    }

    console.log(`Category indexes for business ${businessId}:`, categoryIndexes)

    // If this is a legal business, it should be removed from home care categories
    const isLegalBusiness =
      business.category === "Lawyers" ||
      business.category === "Legal Services" ||
      (business.allCategories &&
        business.allCategories.some(
          (cat) =>
            cat === "Lawyers" ||
            cat === "Legal Services" ||
            cat.toLowerCase().includes("lawyer") ||
            cat.toLowerCase().includes("legal"),
        ))

    if (isLegalBusiness) {
      console.log(`Business ${businessId} is a legal business, removing from home care categories`)

      // Remove from home care categories
      const homeCareFormats = [
        "homecare",
        "home-care",
        "home_care",
        "eldercare",
        "elder-care",
        "elder_care",
        "Homecare",
        "Home Care",
        "Elder Care",
        "Elder Care Services",
      ]

      for (const format of homeCareFormats) {
        try {
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
        } catch (error) {
          console.error(`Error removing business ${businessId} from category ${format}:`, error)
        }
      }

      // Ensure business is in legal categories
      const legalFormats = ["lawyers", "legal-services", "legal_services", "legalServices", "Lawyers", "Legal Services"]

      for (const format of legalFormats) {
        try {
          await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
          await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
        } catch (error) {
          console.error(`Error adding business ${businessId} to category ${format}:`, error)
        }
      }

      // Revalidate affected paths
      revalidatePath("/elder-care")
      revalidatePath("/legal-services")

      return {
        success: true,
        message: `Fixed business ${businessId}: removed from home care categories and ensured it's in legal categories`,
        businessInfo: {
          name: business.businessName || business.name,
          category: business.category,
          subcategory: business.subcategory,
          allCategories: business.allCategories,
          allSubcategories: business.allSubcategories,
        },
        categoryIndexesBefore: categoryIndexes,
      }
    }

    return {
      success: true,
      message: `Business ${businessId} is not a legal business, no action needed`,
      businessInfo: {
        name: business.businessName || business.name,
        category: business.category,
        subcategory: business.subcategory,
        allCategories: business.allCategories,
        allSubcategories: business.allSubcategories,
      },
      categoryIndexes,
    }
  } catch (error) {
    console.error(`Error fixing business categories for ${businessId}:`, error)
    return {
      success: false,
      message: `Error fixing business categories for ${businessId}: ${error.message}`,
      error: error.message,
    }
  }
}
