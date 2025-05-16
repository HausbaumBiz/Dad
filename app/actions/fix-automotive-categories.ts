"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

export async function fixAutomotiveCategories() {
  try {
    console.log("Starting to fix automotive categories...")

    // Get all businesses
    const allBusinessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    console.log(`Found ${allBusinessIds.length} total businesses`)

    let fixed = 0
    let errors = 0

    // Process each business
    for (const businessId of allBusinessIds) {
      try {
        // Get business data
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

        if (!business) {
          console.log(`Business ${businessId} not found, skipping`)
          continue
        }

        // Check if business has automotive-related category or subcategory
        const hasAutomotiveCategory =
          business.category === "Automotive Services" ||
          business.category === "Automotive/Motorcycle/RV" ||
          (business.category && business.category.toLowerCase().includes("automotive")) ||
          (business.category && business.category.toLowerCase().includes("auto services"))

        const hasAutomotiveSubcategory =
          business.subcategory &&
          (business.subcategory.toLowerCase().includes("auto") ||
            business.subcategory.toLowerCase().includes("car") ||
            business.subcategory.toLowerCase().includes("vehicle") ||
            business.subcategory.toLowerCase().includes("motorcycle") ||
            business.subcategory.toLowerCase().includes("rv") ||
            business.subcategory.toLowerCase().includes("repair") ||
            business.subcategory.toLowerCase().includes("mechanic") ||
            business.subcategory.toLowerCase().includes("body shop") ||
            business.subcategory.toLowerCase().includes("tire") ||
            business.subcategory.toLowerCase().includes("oil change"))

        // Check allCategories array
        const allCategories = business.allCategories || []
        const hasAutomotiveCategoryInArray = allCategories.some(
          (cat) =>
            cat === "Automotive Services" ||
            cat === "Automotive/Motorcycle/RV" ||
            cat.toLowerCase().includes("automotive") ||
            cat.toLowerCase().includes("auto services"),
        )

        // Check allSubcategories array
        const allSubcategories = business.allSubcategories || []
        const hasAutomotiveSubcategoryInArray = allSubcategories.some(
          (subcat) =>
            subcat.toLowerCase().includes("auto") ||
            subcat.toLowerCase().includes("car") ||
            subcat.toLowerCase().includes("vehicle") ||
            subcat.toLowerCase().includes("motorcycle") ||
            subcat.toLowerCase().includes("rv") ||
            subcat.toLowerCase().includes("repair") ||
            subcat.toLowerCase().includes("mechanic") ||
            subcat.toLowerCase().includes("body shop") ||
            subcat.toLowerCase().includes("tire") ||
            subcat.toLowerCase().includes("oil change"),
        )

        if (
          hasAutomotiveCategory ||
          hasAutomotiveSubcategory ||
          hasAutomotiveCategoryInArray ||
          hasAutomotiveSubcategoryInArray
        ) {
          console.log(`Business ${businessId} has automotive category or subcategory, adding to automotive indexes`)

          // Add to automotive-services category explicitly with multiple formats
          const autoFormats = [
            "automotive",
            "automotiveServices",
            "automotive-services",
            "Automotive Services",
            "Automotive/Motorcycle/RV",
            "auto-services",
            "autoServices",
          ]

          for (const format of autoFormats) {
            await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
            await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
          }

          fixed++
        }
      } catch (error) {
        console.error(`Error processing business ${businessId}:`, error)
        errors++
      }
    }

    // Revalidate the automotive-services page
    revalidatePath("/automotive-services")

    return {
      success: true,
      message: `Fixed ${fixed} businesses with automotive categories. Encountered ${errors} errors.`,
      fixed,
      errors,
    }
  } catch (error) {
    console.error("Error fixing automotive categories:", error)
    return {
      success: false,
      message: "Failed to fix automotive categories",
      error: error.message,
    }
  }
}

export async function fixSpecificAutomotiveBusiness(businessId: string) {
  try {
    if (!businessId) {
      return {
        success: false,
        message: "Business ID is required",
      }
    }

    console.log(`Fixing automotive category for business ${businessId}...`)

    // Get business data
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!business) {
      return {
        success: false,
        message: `Business ${businessId} not found`,
      }
    }

    // Add to automotive-services category explicitly with multiple formats
    const autoFormats = [
      "automotive",
      "automotiveServices",
      "automotive-services",
      "Automotive Services",
      "Automotive/Motorcycle/RV",
      "auto-services",
      "autoServices",
    ]

    for (const format of autoFormats) {
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
    }

    // Revalidate the automotive-services page
    revalidatePath("/automotive-services")

    return {
      success: true,
      message: `Fixed automotive category for business ${businessId}`,
    }
  } catch (error) {
    console.error(`Error fixing automotive category for business ${businessId}:`, error)
    return {
      success: false,
      message: `Failed to fix automotive category for business ${businessId}`,
      error: error.message,
    }
  }
}
