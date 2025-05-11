"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { getCurrentBusiness } from "./business-actions"
import type { CategorySelection } from "@/components/category-selector"
import { saveBusinessCategories as saveBusinessCategoriesToDb, KEY_PREFIXES, type CategoryData } from "@/lib/db-schema"

// Save business categories
export async function saveBusinessCategories(categories: CategorySelection[]) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    console.log(`Saving ${categories.length} categories for business ${business.id}`)

    // Extract all unique categories and subcategories
    const allCategories = [...new Set(categories.map((cat) => cat.category))]
    const allSubcategories = [...new Set(categories.map((cat) => cat.subcategory))]

    console.log(`Found ${allCategories.length} unique categories and ${allSubcategories.length} unique subcategories`)

    // Save all categories and subcategories as separate lists
    await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:allCategories`, JSON.stringify(allCategories))
    await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:allSubcategories`, JSON.stringify(allSubcategories))

    // Convert CategorySelection to CategoryData
    const categoryData: CategoryData[] = categories.map((cat) => ({
      id: cat.category.toLowerCase().replace(/\s+/g, "-"),
      name: cat.category,
      parentId: cat.category.toLowerCase().replace(/\s+/g, "-"),
      path: cat.fullPath,
    }))

    // Save using the new schema
    const success = await saveBusinessCategoriesToDb(business.id, categoryData)

    if (success) {
      // Also save as JSON string for backward compatibility
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:categories`, JSON.stringify(categories))

      // Save categories and subcategories explicitly
      // This creates a structure with "category" and "subcategory" fields
      const categoriesWithSubcategories = categories.map((cat) => ({
        category: cat.category,
        subcategory: cat.subcategory,
      }))

      // Save the explicit category/subcategory format
      await kv.set(
        `${KEY_PREFIXES.BUSINESS}${business.id}:categoriesWithSubcategories`,
        JSON.stringify(categoriesWithSubcategories),
      )

      // Update the business object with all categories and subcategories
      const updatedBusiness = {
        ...business,
        // Set primary category/subcategory if not already set
        category: business.category || (categories.length > 0 ? categories[0].category : ""),
        subcategory: business.subcategory || (categories.length > 0 ? categories[0].subcategory : ""),
        // Add all categories and subcategories to the business object
        allCategories,
        allSubcategories,
        categoriesCount: categories.length,
        updatedAt: new Date().toISOString(),
      }

      // Save the updated business
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}`, updatedBusiness)

      // Index the business by each category for easier lookup
      for (const category of allCategories) {
        const categoryKey = category.toLowerCase().replace(/\s+/g, "-")
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${categoryKey}:businesses`, business.id)
      }

      revalidatePath("/business-focus")
      revalidatePath("/statistics")
      revalidatePath("/workbench")
      revalidatePath("/admin/businesses")
      revalidatePath(`/admin/businesses/${business.id}`)

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
