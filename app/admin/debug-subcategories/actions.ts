"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

// Helper function to safely parse JSON
function safeJsonParse(data: any, fallback: any = null) {
  try {
    if (typeof data === "string") {
      return JSON.parse(data)
    }
    if (typeof data === "object" && data !== null) {
      return data
    }
    return fallback
  } catch (error) {
    console.error("Error parsing JSON:", error)
    return fallback
  }
}

// Debug function to get all subcategory paths from Redis
export async function getAllSubcategoryPaths() {
  try {
    // Get all business IDs with subcategories
    const businessKeys = await kv.keys(`${KEY_PREFIXES.BUSINESS}*:allSubcategories`)

    if (!businessKeys || businessKeys.length === 0) {
      return { success: false, message: "No businesses with subcategories found" }
    }

    const results: Record<string, string[]> = {}

    // Get subcategories for each business
    for (const key of businessKeys) {
      try {
        // Extract business ID from the key
        const businessId = key.replace(`${KEY_PREFIXES.BUSINESS}`, "").replace(":allSubcategories", "")

        // Get the subcategories
        const subcategoriesData = await kv.get(key)
        const subcategories = safeJsonParse(subcategoriesData, [])

        if (Array.isArray(subcategories) && subcategories.length > 0) {
          // Get business name for better identification
          const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
          const businessName =
            businessData && typeof businessData === "object" ? businessData.businessName || businessId : businessId

          results[`${businessName} (${businessId})`] = subcategories
        }
      } catch (error) {
        console.error(`Error processing business subcategories from key ${key}:`, error)
      }
    }

    return {
      success: true,
      data: results,
      count: Object.keys(results).length,
    }
  } catch (error) {
    console.error("Error getting subcategory paths:", error)
    return { success: false, message: "Error retrieving subcategory paths" }
  }
}

// Get all category selections (full paths) from Redis
export async function getAllCategorySelections() {
  try {
    // Get all business IDs with category selections
    const businessKeys = await kv.keys(`${KEY_PREFIXES.BUSINESS}*:categories`)

    if (!businessKeys || businessKeys.length === 0) {
      return { success: false, message: "No businesses with category selections found" }
    }

    const results: Record<string, any[]> = {}

    // Get category selections for each business
    for (const key of businessKeys) {
      try {
        // Extract business ID from the key
        const businessId = key.replace(`${KEY_PREFIXES.BUSINESS}`, "").replace(":categories", "")

        // Get the category selections
        const selectionsData = await kv.get(key)
        const selections = safeJsonParse(selectionsData, [])

        if (Array.isArray(selections) && selections.length > 0) {
          // Get business name for better identification
          const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
          const businessName =
            businessData && typeof businessData === "object" ? businessData.businessName || businessId : businessId

          results[`${businessName} (${businessId})`] = selections
        }
      } catch (error) {
        console.error(`Error processing business category selections from key ${key}:`, error)
      }
    }

    return {
      success: true,
      data: results,
      count: Object.keys(results).length,
    }
  } catch (error) {
    console.error("Error getting category selections:", error)
    return { success: false, message: "Error retrieving category selections" }
  }
}

// Get all selected categories (main categories only)
export async function getAllSelectedCategories() {
  try {
    // Get all business IDs with selected categories
    const businessKeys = await kv.keys(`${KEY_PREFIXES.BUSINESS}*:selectedCategories`)

    if (!businessKeys || businessKeys.length === 0) {
      return { success: false, message: "No businesses with selected categories found" }
    }

    const results: Record<string, string[]> = {}

    // Get selected categories for each business
    for (const key of businessKeys) {
      try {
        // Extract business ID from the key
        const businessId = key.replace(`${KEY_PREFIXES.BUSINESS}`, "").replace(":selectedCategories", "")

        // Get the selected categories
        const categoriesData = await kv.get(key)
        const categories = safeJsonParse(categoriesData, [])

        if (Array.isArray(categories) && categories.length > 0) {
          // Get business name for better identification
          const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
          const businessName =
            businessData && typeof businessData === "object" ? businessData.businessName || businessId : businessId

          results[`${businessName} (${businessId})`] = categories
        }
      } catch (error) {
        console.error(`Error processing business selected categories from key ${key}:`, error)
      }
    }

    return {
      success: true,
      data: results,
      count: Object.keys(results).length,
    }
  } catch (error) {
    console.error("Error getting selected categories:", error)
    return { success: false, message: "Error retrieving selected categories" }
  }
}

// Search for businesses with a specific subcategory path
export async function searchBusinessesBySubcategory(subcategoryPath: string) {
  try {
    // Get all business IDs with subcategories
    const businessKeys = await kv.keys(`${KEY_PREFIXES.BUSINESS}*:allSubcategories`)

    if (!businessKeys || businessKeys.length === 0) {
      return { success: false, message: "No businesses with subcategories found" }
    }

    const results: Record<string, string[]> = {}

    // Check each business for the subcategory
    for (const key of businessKeys) {
      try {
        // Extract business ID from the key
        const businessId = key.replace(`${KEY_PREFIXES.BUSINESS}`, "").replace(":allSubcategories", "")

        // Get the subcategories
        const subcategoriesData = await kv.get(key)
        const subcategories = safeJsonParse(subcategoriesData, [])

        if (Array.isArray(subcategories) && subcategories.includes(subcategoryPath)) {
          // Get business name for better identification
          const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
          const businessName =
            businessData && typeof businessData === "object" ? businessData.businessName || businessId : businessId

          results[`${businessName} (${businessId})`] = subcategories
        }
      } catch (error) {
        console.error(`Error processing business subcategories from key ${key}:`, error)
      }
    }

    return {
      success: true,
      data: results,
      count: Object.keys(results).length,
      searchTerm: subcategoryPath,
    }
  } catch (error) {
    console.error("Error searching businesses by subcategory:", error)
    return { success: false, message: "Error searching businesses" }
  }
}
