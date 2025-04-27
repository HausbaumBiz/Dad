"use server"

import { kv } from "@vercel/kv"
import { getCurrentBusiness } from "./business-actions"
import type { CategorySelection } from "@/components/category-selector"

// Save category selections for a business
export async function saveBusinessCategories(categories: CategorySelection[]) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Store categories for this business
    await kv.set(`business:${business.id}:categories`, JSON.stringify(categories))

    return { success: true, message: "Categories saved successfully" }
  } catch (error) {
    console.error("Error saving business categories:", error)
    return { success: false, message: "Failed to save categories" }
  }
}

// Update the getBusinessCategories function to handle both object and string responses from Redis

// Replace the existing getBusinessCategories function with this updated version:
export async function getBusinessCategories(): Promise<{
  success: boolean
  data?: CategorySelection[]
  message?: string
}> {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Get categories for this business
    const categoriesData = await kv.get(`business:${business.id}:categories`)

    // If no data found, return empty array
    if (!categoriesData) {
      return { success: true, data: [] }
    }

    // Handle the case where Redis might return an object or a string
    let parsedCategories: CategorySelection[]

    if (typeof categoriesData === "string") {
      try {
        parsedCategories = JSON.parse(categoriesData)
      } catch (parseError) {
        console.error("Error parsing categories JSON:", parseError)
        return { success: false, message: "Invalid category data format" }
      }
    } else if (Array.isArray(categoriesData)) {
      // Data is already an array
      parsedCategories = categoriesData as CategorySelection[]
    } else {
      console.error("Unexpected data format:", typeof categoriesData)
      return { success: false, message: "Unexpected data format" }
    }

    return { success: true, data: parsedCategories }
  } catch (error) {
    console.error("Error getting business categories:", error)
    return { success: false, message: "Failed to retrieve categories" }
  }
}

// Add a single category selection
export async function addBusinessCategory(category: CategorySelection) {
  try {
    const result = await getBusinessCategories()
    if (!result.success) {
      return result
    }

    const categories = result.data || []

    // Check if category already exists
    const exists = categories.some((c) => c.fullPath === category.fullPath)
    if (exists) {
      return { success: true, message: "Category already exists" }
    }

    // Add the new category
    categories.push(category)
    return saveBusinessCategories(categories)
  } catch (error) {
    console.error("Error adding business category:", error)
    return { success: false, message: "Failed to add category" }
  }
}

// Remove a single category selection
export async function removeBusinessCategory(fullPath: string) {
  try {
    const result = await getBusinessCategories()
    if (!result.success) {
      return result
    }

    const categories = result.data || []

    // Filter out the category to remove
    const updatedCategories = categories.filter((c) => c.fullPath !== fullPath)

    // If nothing changed, the category wasn't found
    if (categories.length === updatedCategories.length) {
      return { success: false, message: "Category not found" }
    }

    return saveBusinessCategories(updatedCategories)
  } catch (error) {
    console.error("Error removing business category:", error)
    return { success: false, message: "Failed to remove category" }
  }
}
