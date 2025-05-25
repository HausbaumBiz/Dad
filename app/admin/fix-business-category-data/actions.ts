"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function fixBusinessCategoryData(businessId: string) {
  try {
    console.log(`Fixing category data for business: ${businessId}`)

    // Get the current categories data
    const categories = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)

    if (!categories) {
      return { success: false, message: "No categories found for this business" }
    }

    let parsedCategories: any[] = []

    if (typeof categories === "string") {
      try {
        parsedCategories = JSON.parse(categories)
      } catch (error) {
        return { success: false, message: "Failed to parse categories data" }
      }
    } else if (Array.isArray(categories)) {
      parsedCategories = categories
    } else {
      return { success: false, message: "Invalid categories data format" }
    }

    // Extract category IDs and subcategory IDs
    const categoryIds = parsedCategories.map((cat) => cat.category).filter(Boolean)
    const subcategoryIds = parsedCategories.map((cat) => cat.subcategory).filter(Boolean)

    // Save the extracted IDs
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategoryIds`, JSON.stringify(categoryIds))
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedSubcategoryIds`, JSON.stringify(subcategoryIds))

    // Create category selections data
    const categorySelections = parsedCategories.map((cat) => ({
      categoryId: cat.category,
      subcategoryId: cat.subcategory,
      fullPath: cat.fullPath,
      timestamp: new Date().toISOString(),
    }))

    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:categorySelections`, JSON.stringify(categorySelections))

    console.log(`Fixed category data for business ${businessId}:`)
    console.log(`- Category IDs: ${categoryIds.join(", ")}`)
    console.log(`- Subcategory IDs: ${subcategoryIds.join(", ")}`)

    return {
      success: true,
      message: "Category data fixed successfully",
      data: {
        categoryIds,
        subcategoryIds,
        categorySelections,
      },
    }
  } catch (error) {
    console.error("Error fixing business category data:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
