"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

interface FixResultItem {
  businessId: string
  businessName: string
  oldCategory: string
  newCategory: string
  corrected: boolean
  error?: string
}

export async function fixCategoryInconsistencies() {
  const result: {
    success: boolean
    scannedBusinesses: number
    fixedBusinesses: number
    details: FixResultItem[]
  } = {
    success: true,
    scannedBusinesses: 0,
    fixedBusinesses: 0,
    details: [],
  }

  try {
    // Get all business IDs
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    result.scannedBusinesses = businessIds.length

    for (const businessId of businessIds) {
      try {
        // Get business data
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

        if (!business) {
          console.warn(`Business ${businessId} not found`)
          continue
        }

        // Check for inconsistencies
        const primaryCategory = business.category
        const allCategories = business.allCategories || []

        // Skip if no inconsistency
        if (!primaryCategory || !allCategories.length) {
          continue
        }

        // Check if primary category is not in allCategories
        const needsFix = !allCategories.includes(primaryCategory)

        if (needsFix) {
          console.log(
            `Found inconsistency in business ${businessId}: Primary category "${primaryCategory}" not in allCategories "${allCategories.join(", ")}"`,
          )

          // Update the primary category to match the first in allCategories
          const newPrimaryCategory = allCategories[0]
          const oldPrimaryCategory = primaryCategory

          // Remove from old category indexes
          if (oldPrimaryCategory) {
            const oldCategoryKey = oldPrimaryCategory.toLowerCase().replace(/\s+/g, "-")
            await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategoryKey}`, businessId)
            await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategoryKey}:businesses`, businessId)

            // Handle special cases
            if (oldPrimaryCategory === "Mortuary Services" || oldPrimaryCategory.includes("Funeral")) {
              const mortuaryFormats = [
                "mortuaryServices",
                "mortuary-services",
                "mortuary_services",
                "funeral-services",
                "funeral_services",
                "funeralServices",
                "Mortuary Services",
                "Funeral Services",
              ]

              for (const format of mortuaryFormats) {
                await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
                await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
              }
            }
          }

          // Add to new category indexes
          const newCategoryKey = newPrimaryCategory.toLowerCase().replace(/\s+/g, "-")
          await kv.sadd(`${KEY_PREFIXES.CATEGORY}${newCategoryKey}`, businessId)
          await kv.sadd(`${KEY_PREFIXES.CATEGORY}${newCategoryKey}:businesses`, businessId)

          // Update business record
          business.category = newPrimaryCategory
          await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}`, business)

          // Add to results
          result.details.push({
            businessId,
            businessName: business.businessName || "Unknown",
            oldCategory: oldPrimaryCategory,
            newCategory: newPrimaryCategory,
            corrected: true,
          })

          result.fixedBusinesses++
        }
      } catch (error) {
        console.error(`Error processing business ${businessId}:`, error)
        result.details.push({
          businessId,
          businessName: "Error",
          oldCategory: "Unknown",
          newCategory: "Unknown",
          corrected: false,
          error: error.message,
        })
      }
    }

    // Add special handling for specific business ID
    try {
      const specificId = "1744c078-461b-45bc-903e-e0999ac2aa87"
      const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${specificId}`)

      if (business) {
        // Remove from Mortuary Services category
        const mortuaryFormats = [
          "mortuaryServices",
          "mortuary-services",
          "mortuary_services",
          "funeral-services",
          "funeral_services",
          "funeralServices",
          "Mortuary Services",
          "Funeral Services",
        ]

        for (const format of mortuaryFormats) {
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, specificId)
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, specificId)
        }

        // Update primary category
        if (business.allCategories && business.allCategories.includes("Art, Design and Entertainment")) {
          business.category = "Art, Design and Entertainment"
          business.subcategory =
            business.allSubcategories && business.allSubcategories.length > 0
              ? business.allSubcategories[0]
              : "Fine Artists, Including Painters, Sculptors, and Illustrators"

          await kv.set(`${KEY_PREFIXES.BUSINESS}${specificId}`, business)

          // Add to Arts category
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
            await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, specificId)
            await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, specificId)
          }

          result.details.push({
            businessId: specificId,
            businessName: business.businessName || "Unknown",
            oldCategory: "Mortuary Services",
            newCategory: "Art, Design and Entertainment",
            corrected: true,
          })

          result.fixedBusinesses++
        }
      }
    } catch (error) {
      console.error("Error fixing specific business:", error)
    }

    // Revalidate paths
    revalidatePath("/arts-entertainment")
    revalidatePath("/funeral-services")

    return result
  } catch (error) {
    console.error("Error fixing category inconsistencies:", error)
    return {
      success: false,
      scannedBusinesses: result.scannedBusinesses,
      fixedBusinesses: result.fixedBusinesses,
      details: result.details,
      error: error.message,
    }
  }
}

// Function to fix a specific business
export async function fixSpecificBusinessCategory(businessId: string) {
  try {
    // Get business data
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!business) {
      return { success: false, message: `Business ${businessId} not found` }
    }

    const primaryCategory = business.category
    const allCategories = business.allCategories || []

    // If primary category doesn't match first allCategory, update it
    if (allCategories.length > 0 && primaryCategory !== allCategories[0]) {
      const oldCategory = primaryCategory
      const newCategory = allCategories[0]

      // Remove from old category
      if (oldCategory) {
        const oldCategoryKey = oldCategory.toLowerCase().replace(/\s+/g, "-")
        await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategoryKey}`, businessId)
        await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategoryKey}:businesses`, businessId)
      }

      // Add to new category
      const newCategoryKeyVal = newCategory.toLowerCase().replace(/\s+/g, "-")
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${newCategoryKeyVal}`, businessId)
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${newCategoryKeyVal}:businesses`, businessId)

      // Update business
      business.category = newCategory
      await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}`, business)

      // Revalidate paths
      const oldCategoryKey = oldCategory.toLowerCase().replace(/\s+/g, "-")
      const newCategoryKey = newCategory.toLowerCase().replace(/\s+/g, "-")
      revalidatePath(`/${oldCategoryKey}`)
      revalidatePath(`/${newCategoryKey}`)

      return {
        success: true,
        message: `Updated business category from ${oldCategory} to ${newCategory}`,
        oldCategory,
        newCategory,
      }
    }

    return { success: true, message: "No change needed, categories are consistent" }
  } catch (error) {
    console.error(`Error fixing business ${businessId}:`, error)
    return { success: false, message: error.message }
  }
}
