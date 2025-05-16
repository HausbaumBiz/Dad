import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET() {
  try {
    const result = {
      success: true,
      processed: 0,
      fixed: 0,
      details: [] as any[],
    }

    // Get all business IDs
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)

    for (const id of businessIds) {
      try {
        // Get business data
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)

        if (!business) {
          console.warn(`Business ${id} not found`)
          continue
        }

        result.processed++

        // Skip if no category information
        if (!business.category && (!business.allCategories || business.allCategories.length === 0)) {
          continue
        }

        // Handle specific business ID
        if (id === "1744c078-461b-45bc-903e-e0999ac2aa87") {
          // Remove from Mortuary Services
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
            await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, id)
            await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, id)
          }

          // If has Arts category in allCategories, update primary
          if (business.allCategories && business.allCategories.includes("Art, Design and Entertainment")) {
            business.category = "Art, Design and Entertainment"

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
              await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, id)
              await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, id)
            }

            await kv.set(`${KEY_PREFIXES.BUSINESS}${id}`, business)

            result.fixed++
            result.details.push({
              id,
              name: business.businessName,
              action: "Fixed specific business",
              from: "Mortuary Services",
              to: "Art, Design and Entertainment",
            })
          }

          continue
        }

        // Get primary category and allCategories
        const primaryCategory = business.category
        const allCategories = business.allCategories || []

        // Check for inconsistency
        if (allCategories.length > 0 && primaryCategory !== allCategories[0]) {
          // Get old category and new category
          const oldCategory = primaryCategory
          const newCategory = allCategories[0]

          // Remove from old category indexes
          if (oldCategory) {
            const oldCategoryKey = oldCategory.toLowerCase().replace(/\s+/g, "-")
            await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategoryKey}`, id)
            await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategoryKey}:businesses`, id)
          }

          // Add to new category indexes
          if (newCategory) {
            const newCategoryKey = newCategory.toLowerCase().replace(/\s+/g, "-")
            await kv.sadd(`${KEY_PREFIXES.CATEGORY}${newCategoryKey}`, id)
            await kv.sadd(`${KEY_PREFIXES.CATEGORY}${newCategoryKey}:businesses`, id)
          }

          // Update business record
          business.category = newCategory
          await kv.set(`${KEY_PREFIXES.BUSINESS}${id}`, business)

          result.fixed++
          result.details.push({
            id,
            name: business.businessName,
            action: "Fixed category inconsistency",
            from: oldCategory,
            to: newCategory,
          })
        }
      } catch (error) {
        console.error(`Error processing business ${id}:`, error)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error rebuilding category indexes:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
