"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

export async function fixAutomotiveEtcCategories() {
  try {
    console.log("Starting to fix automotive etc categories...")

    // Get all businesses
    const allBusinessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    console.log(`Found ${allBusinessIds.length} total businesses`)

    let fixed = 0
    const details = []

    // Process each business
    for (const businessId of allBusinessIds) {
      try {
        // Get business data
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

        if (!business) {
          console.log(`Business ${businessId} not found, skipping`)
          continue
        }

        const businessName = business.businessName || "Unknown Business"

        // Check if business has the specific "Automotive/Motorcycle/RV, etc" category
        const hasAutomotiveEtcCategory =
          business.category === "Automotive/Motorcycle/RV, etc" ||
          (business.allCategories && business.allCategories.includes("Automotive/Motorcycle/RV, etc"))

        // Check if business has automotive-related subcategories
        const automotiveSubcategories = [
          "Tire and Brakes",
          "Mufflers",
          "Oil Change",
          "Windshield Repair",
          "General Auto Repair",
          "Engine and Transmission",
          "Body Shop",
          "Custom Paint",
          "Detailing Services",
          "Car Wash",
          "Auto Parts",
          "ATV/Motorcycle Repair",
          "Utility Vehicle Repair",
          "RV Maintenance and Repair",
        ]

        const hasAutomotiveSubcategory =
          automotiveSubcategories.includes(business.subcategory) ||
          (business.allSubcategories && business.allSubcategories.some((sub) => automotiveSubcategories.includes(sub)))

        if (hasAutomotiveEtcCategory || hasAutomotiveSubcategory) {
          console.log(`Found automotive business: ${businessName} (${businessId})`)

          // Add to all automotive category formats
          const autoFormats = [
            "automotive",
            "automotiveServices",
            "automotive-services",
            "Automotive Services",
            "Automotive/Motorcycle/RV",
            "Automotive/Motorcycle/RV, etc",
            "automotive/motorcycle/rv",
            "automotive/motorcycle/rv, etc",
            "auto-services",
            "autoServices",
          ]

          for (const format of autoFormats) {
            await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
            await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
          }

          // Also add to the standardized "Automotive Services" format
          await kv.sadd(`${KEY_PREFIXES.CATEGORY}Automotive Services`, businessId)
          await kv.sadd(`${KEY_PREFIXES.CATEGORY}Automotive Services:businesses`, businessId)

          fixed++
          details.push({
            id: businessId,
            name: businessName,
            category: business.category,
            subcategory: business.subcategory,
            allCategories: business.allCategories,
            allSubcategories: business.allSubcategories,
          })
        }
      } catch (error) {
        console.error(`Error processing business ${businessId}:`, error)
      }
    }

    // Revalidate the automotive-services page
    revalidatePath("/automotive-services")

    return {
      success: true,
      message: `Fixed ${fixed} businesses with automotive etc categories.`,
      fixed,
      details,
    }
  } catch (error) {
    console.error("Error fixing automotive etc categories:", error)
    return {
      success: false,
      message: "Failed to fix automotive etc categories",
      error: error.message,
    }
  }
}

export async function fixSpecificAutomotiveEtcBusiness(businessId: string) {
  try {
    if (!businessId) {
      return {
        success: false,
        message: "Business ID is required",
      }
    }

    console.log(`Fixing automotive etc category for business ${businessId}...`)

    // Get business data
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!business) {
      return {
        success: false,
        message: `Business ${businessId} not found`,
      }
    }

    // Add to all automotive category formats
    const autoFormats = [
      "automotive",
      "automotiveServices",
      "automotive-services",
      "Automotive Services",
      "Automotive/Motorcycle/RV",
      "Automotive/Motorcycle/RV, etc",
      "automotive/motorcycle/rv",
      "automotive/motorcycle/rv, etc",
      "auto-services",
      "autoServices",
    ]

    for (const format of autoFormats) {
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
    }

    // Also add to the standardized "Automotive Services" format
    await kv.sadd(`${KEY_PREFIXES.CATEGORY}Automotive Services`, businessId)
    await kv.sadd(`${KEY_PREFIXES.CATEGORY}Automotive Services:businesses`, businessId)

    // Revalidate the automotive-services page
    revalidatePath("/automotive-services")

    return {
      success: true,
      message: `Fixed automotive etc category for business ${businessId}`,
      details: {
        id: businessId,
        name: business.businessName || "Unknown Business",
        category: business.category,
        subcategory: business.subcategory,
        allCategories: business.allCategories,
        allSubcategories: business.allSubcategories,
      },
    }
  } catch (error) {
    console.error(`Error fixing automotive etc category for business ${businessId}:`, error)
    return {
      success: false,
      message: `Failed to fix automotive etc category for business ${businessId}`,
      error: error.message,
    }
  }
}
