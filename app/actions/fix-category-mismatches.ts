"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

export async function fixCategoryMismatches(businessId?: string) {
  try {
    console.log("Starting to fix category mismatches...")

    // Get all businesses or just the specified one
    const businessIds = businessId ? [businessId] : await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)

    console.log(`Processing ${businessIds.length} businesses`)

    let fixed = 0
    const details = []

    for (const id of businessIds) {
      try {
        // Get business data
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)

        if (!business) {
          console.log(`Business ${id} not found, skipping`)
          continue
        }

        const businessName = business.businessName || "Unknown Business"
        console.log(`Processing business: ${businessName} (${id})`)

        // Check if business has automotive-related categories or subcategories
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

        // Check allCategories and allSubcategories arrays
        const allCategories = business.allCategories || []
        const allSubcategories = business.allSubcategories || []

        const hasAutomotiveCategoryInArray = allCategories.some(
          (cat) =>
            cat === "Automotive Services" ||
            cat === "Automotive/Motorcycle/RV" ||
            (cat && cat.toLowerCase().includes("automotive")) ||
            (cat && cat.toLowerCase().includes("auto services")),
        )

        const hasAutomotiveSubcategoryInArray = allSubcategories.some(
          (subcat) =>
            subcat &&
            (subcat.toLowerCase().includes("auto") ||
              subcat.toLowerCase().includes("car") ||
              subcat.toLowerCase().includes("vehicle") ||
              subcat.toLowerCase().includes("motorcycle") ||
              subcat.toLowerCase().includes("rv") ||
              subcat.toLowerCase().includes("repair") ||
              subcat.toLowerCase().includes("mechanic") ||
              subcat.toLowerCase().includes("body shop") ||
              subcat.toLowerCase().includes("tire") ||
              subcat.toLowerCase().includes("oil change")),
        )

        // Check if business is incorrectly in arts-entertainment category
        const isInArtsCategory = await checkIfInCategory(id, [
          "artDesignEntertainment",
          "Art, Design and Entertainment",
          "arts-entertainment",
          "Arts & Entertainment",
          "art-design-entertainment",
          "art-design-and-entertainment",
          "arts-&-entertainment",
        ])

        // Check if business is in automotive category
        const isInAutomotiveCategory = await checkIfInCategory(id, [
          "automotive",
          "automotiveServices",
          "automotive-services",
          "Automotive Services",
          "Automotive/Motorcycle/RV",
          "auto-services",
          "autoServices",
        ])

        // Determine if this is an automotive business incorrectly in arts category
        const isAutomotiveBusiness =
          hasAutomotiveCategory ||
          hasAutomotiveSubcategory ||
          hasAutomotiveCategoryInArray ||
          hasAutomotiveSubcategoryInArray

        const needsFixing = isAutomotiveBusiness && isInArtsCategory

        if (needsFixing) {
          console.log(
            `Found mismatch: Business ${businessName} (${id}) is an automotive business incorrectly in arts category`,
          )

          // Remove from arts category
          await removeFromCategory(id, [
            "artDesignEntertainment",
            "Art, Design and Entertainment",
            "arts-entertainment",
            "Arts & Entertainment",
            "art-design-entertainment",
            "art-design-and-entertainment",
            "arts-&-entertainment",
          ])

          // Add to automotive category if not already there
          if (!isInAutomotiveCategory) {
            await addToCategory(id, [
              "automotive",
              "automotiveServices",
              "automotive-services",
              "Automotive Services",
              "Automotive/Motorcycle/RV",
              "auto-services",
              "autoServices",
            ])
          }

          fixed++
          details.push({
            id,
            name: businessName,
            action: "Moved from arts to automotive category",
            isAutomotiveBusiness,
            wasInArtsCategory: isInArtsCategory,
            wasInAutomotiveCategory: isInAutomotiveCategory,
          })
        } else if (isAutomotiveBusiness && !isInAutomotiveCategory) {
          // Just add to automotive if it's an automotive business not in that category
          console.log(`Business ${businessName} (${id}) is an automotive business not in automotive category`)

          await addToCategory(id, [
            "automotive",
            "automotiveServices",
            "automotive-services",
            "Automotive Services",
            "Automotive/Motorcycle/RV",
            "auto-services",
            "autoServices",
          ])

          fixed++
          details.push({
            id,
            name: businessName,
            action: "Added to automotive category",
            isAutomotiveBusiness,
            wasInArtsCategory: isInArtsCategory,
            wasInAutomotiveCategory: isInAutomotiveCategory,
          })
        }
      } catch (error) {
        console.error(`Error processing business ${id}:`, error)
        details.push({
          id,
          error: error.message,
        })
      }
    }

    // Revalidate affected pages
    revalidatePath("/automotive-services")
    revalidatePath("/arts-entertainment")

    return {
      success: true,
      message: `Fixed ${fixed} businesses with category mismatches`,
      fixed,
      details,
    }
  } catch (error) {
    console.error("Error fixing category mismatches:", error)
    return {
      success: false,
      message: "Failed to fix category mismatches",
      error: error.message,
    }
  }
}

// Helper function to check if a business is in any of the specified categories
async function checkIfInCategory(businessId: string, categoryFormats: string[]): Promise<boolean> {
  for (const format of categoryFormats) {
    try {
      const isMember = await kv.sismember(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
      if (isMember) return true

      const isMemberAlt = await kv.sismember(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
      if (isMemberAlt) return true
    } catch (error) {
      console.error(`Error checking if business ${businessId} is in category ${format}:`, error)
    }
  }
  return false
}

// Helper function to remove a business from categories
async function removeFromCategory(businessId: string, categoryFormats: string[]) {
  for (const format of categoryFormats) {
    try {
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
    } catch (error) {
      console.error(`Error removing business ${businessId} from category ${format}:`, error)
    }
  }
}

// Helper function to add a business to categories
async function addToCategory(businessId: string, categoryFormats: string[]) {
  for (const format of categoryFormats) {
    try {
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
    } catch (error) {
      console.error(`Error adding business ${businessId} to category ${format}:`, error)
    }
  }
}
