"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

// Interface for simplified category data
export interface SimplifiedCategory {
  category: string
  subcategory: string
  fullPath: string
}

// Get simplified categories for a specific business
export async function getBusinessSimplifiedCategories(businessId: string) {
  try {
    if (!businessId) {
      return { success: false, message: "Business ID is required" }
    }

    // Try to get simplified categories
    const simplifiedCategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:simplifiedCategories`)

    // If simplified categories don't exist, try to get the regular categories
    if (!simplifiedCategoriesData) {
      // Try to get categories with subcategories
      const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categoriesWithSubcategories`)

      if (!categoriesData) {
        // Try to get the original categories format
        const originalCategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)

        if (!originalCategoriesData) {
          return { success: true, data: [] }
        }

        // Parse the original categories data
        let categories
        if (typeof originalCategoriesData === "string") {
          try {
            categories = JSON.parse(originalCategoriesData)
            // Convert to simplified format if possible
            if (Array.isArray(categories) && categories.length > 0) {
              const simplified = categories.map((cat) => ({
                category: cat.category || "",
                subcategory: cat.subcategory || "",
                fullPath: cat.fullPath || `${cat.category}/${cat.subcategory}`,
              }))
              return { success: true, data: simplified }
            }
          } catch (error) {
            console.error("Error parsing original categories:", error)
          }
        }

        return { success: true, data: [] }
      }

      // Parse the categories with subcategories data
      let categoriesWithSub
      if (typeof categoriesData === "string") {
        try {
          categoriesWithSub = JSON.parse(categoriesData)
          // Convert to simplified format
          if (Array.isArray(categoriesWithSub) && categoriesWithSub.length > 0) {
            const simplified = categoriesWithSub.map((cat) => ({
              category: cat.category || "",
              subcategory: cat.subcategory || "",
              fullPath: `${cat.category}/${cat.subcategory}`,
            }))
            return { success: true, data: simplified }
          }
        } catch (error) {
          console.error("Error parsing categories with subcategories:", error)
        }
      }

      return { success: true, data: [] }
    }

    // Parse the simplified categories data
    let simplifiedCategories: SimplifiedCategory[]
    if (typeof simplifiedCategoriesData === "string") {
      try {
        simplifiedCategories = JSON.parse(simplifiedCategoriesData)
      } catch (error) {
        console.error("Error parsing simplified categories:", error)
        return { success: false, message: "Invalid category data format" }
      }
    } else if (Array.isArray(simplifiedCategoriesData)) {
      simplifiedCategories = simplifiedCategoriesData as SimplifiedCategory[]
    } else {
      console.error("Unexpected data format:", typeof simplifiedCategoriesData)
      return { success: false, message: "Unexpected data format" }
    }

    return { success: true, data: simplifiedCategories }
  } catch (error) {
    console.error("Error getting business simplified categories:", error)
    return { success: false, message: "Failed to get categories" }
  }
}
