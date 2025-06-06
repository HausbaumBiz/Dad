"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { getCurrentBusiness } from "./business-actions"
import type { CategorySelection } from "@/components/category-selector"
import { KEY_PREFIXES } from "@/lib/db-schema"
import {
  saveBusinessCategories as saveBusinessCategoriesSimple,
  getBusinessSelectedCategories,
} from "@/lib/business-category-service"

// Save business categories (simplified)
export async function saveBusinessCategories(categories: CategorySelection[]) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Add input validation
    if (!categories) {
      console.log("Categories parameter is null or undefined")
      return { success: false, message: "No categories provided" }
    }

    if (!Array.isArray(categories)) {
      console.error("Categories parameter is not an array:", typeof categories, categories)
      return { success: false, message: "Invalid categories format" }
    }

    if (categories.length === 0) {
      console.log("Empty categories array provided")
      return { success: false, message: "No categories selected" }
    }

    console.log(`Saving ${categories.length} categories for business ${business.id}`)

    // Validate that each category has the expected structure
    const validCategories = categories.filter(
      (cat) => cat && typeof cat === "object" && typeof cat.category === "string" && cat.category.trim() !== "",
    )

    if (validCategories.length === 0) {
      console.error("No valid categories found in input:", categories)
      return { success: false, message: "No valid categories found" }
    }

    // Extract just the category names (the main categories, not subcategories)
    const selectedCategoryNames = [...new Set(validCategories.map((cat) => cat.category))]

    console.log(`Selected category names:`, selectedCategoryNames)

    // Remove business from old category indexes
    const oldCategories = await getBusinessSelectedCategories(business.id)
    for (const oldCategory of oldCategories) {
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategory}:businesses`, business.id)
    }

    // Save the new category selections using the simplified service
    const success = await saveBusinessCategoriesSimple(business.id, selectedCategoryNames)

    if (success) {
      // Also save the full category selection data for backward compatibility
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:categories`, JSON.stringify(categories))

      // Update the business object with the primary category
      const updatedBusiness = {
        ...business,
        category: selectedCategoryNames.length > 0 ? selectedCategoryNames[0] : "",
        allCategories: selectedCategoryNames,
        categoriesCount: categories.length,
        updatedAt: new Date().toISOString(),
      }

      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}`, updatedBusiness)

      // Revalidate paths
      revalidatePath("/business-focus")
      revalidatePath("/workbench")

      return { success: true, message: `Saved ${categories.length} categories` }
    } else {
      throw new Error("Failed to save categories")
    }
  } catch (error) {
    console.error("Error saving business categories:", error)
    return { success: false, message: "Failed to save categories" }
  }
}

// Get business categories
export async function getBusinessCategories() {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Try to get categories as JSON string (for backward compatibility)
    const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${business.id}:categories`)

    if (!categoriesData) {
      return { success: true, data: [] }
    }

    // Parse the categories data
    let categories: CategorySelection[]

    if (typeof categoriesData === "string") {
      try {
        categories = JSON.parse(categoriesData)
      } catch (error) {
        console.error("Error parsing categories:", error)
        return { success: false, message: "Invalid category data format" }
      }
    } else if (Array.isArray(categoriesData)) {
      categories = categoriesData as CategorySelection[]
    } else {
      console.error("Unexpected data format:", typeof categoriesData)
      return { success: false, message: "Unexpected data format" }
    }

    return { success: true, data: categories }
  } catch (error) {
    console.error("Error getting business categories:", error)
    return { success: false, message: "Failed to get categories" }
  }
}

// Get all categories and subcategories for a business
export async function getBusinessAllCategoriesAndSubcategories() {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Get all categories
    const allCategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${business.id}:allCategories`)
    const allSubcategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${business.id}:allSubcategories`)

    let allCategories: string[] = []
    let allSubcategories: string[] = []

    if (allCategoriesData) {
      if (typeof allCategoriesData === "string") {
        try {
          allCategories = JSON.parse(allCategoriesData)
        } catch (error) {
          console.error("Error parsing all categories:", error)
        }
      } else if (Array.isArray(allCategoriesData)) {
        allCategories = allCategoriesData
      }
    }

    if (allSubcategoriesData) {
      if (typeof allSubcategoriesData === "string") {
        try {
          allSubcategories = JSON.parse(allSubcategoriesData)
        } catch (error) {
          console.error("Error parsing all subcategories:", error)
        }
      } else if (Array.isArray(allSubcategoriesData)) {
        allSubcategories = allSubcategoriesData
      }
    }

    return {
      success: true,
      data: {
        categories: allCategories,
        subcategories: allSubcategories,
      },
    }
  } catch (error) {
    console.error("Error getting all categories and subcategories:", error)
    return { success: false, message: "Failed to get categories and subcategories" }
  }
}

// Remove a business category
export async function removeBusinessCategory(fullPath: string) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Get current categories
    const result = await getBusinessCategories()

    if (!result.success || !result.data) {
      return { success: false, message: "Failed to get current categories" }
    }

    // Filter out the category to remove
    const updatedCategories = result.data.filter((cat) => cat.fullPath !== fullPath)

    // Save the updated categories
    const saveResult = await saveBusinessCategories(updatedCategories)

    if (!saveResult.success) {
      return { success: false, message: saveResult.message }
    }

    revalidatePath("/business-focus")
    revalidatePath("/statistics")

    return { success: true, message: "Category removed successfully" }
  } catch (error) {
    console.error("Error removing business category:", error)
    return { success: false, message: "Failed to remove category" }
  }
}

// Suggest a new category
export async function suggestCategory(formData: FormData) {
  try {
    const business = await getCurrentBusiness()
    const businessId = business?.id || "anonymous"

    const category = formData.get("category") as string
    const subcategory = formData.get("subcategory") as string
    const reason = formData.get("reason") as string

    if (!category || !subcategory) {
      return { success: false, message: "Category and subcategory are required" }
    }

    // Create a unique ID for the suggestion
    const suggestionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Store the suggestion
    await kv.hset(`category:suggestions:${suggestionId}`, {
      category,
      subcategory,
      reason,
      businessId,
      createdAt: new Date().toISOString(),
      status: "pending",
    })

    // Add to the set of all suggestions
    await kv.sadd("category:suggestions", suggestionId)

    return { success: true, message: "Thank you for your suggestion! We'll review it soon." }
  } catch (error) {
    console.error("Error suggesting category:", error)
    return { success: false, message: "Failed to submit suggestion" }
  }
}
