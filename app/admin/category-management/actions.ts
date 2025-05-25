"use server"

import { kv } from "@vercel/kv"

interface CategoryInfo {
  categoryKey: string
  displayName: string
  businessCount: number
  type: "main" | "subcategory" | "path"
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return String(error)
}

export async function getAllCategories(): Promise<CategoryInfo[]> {
  try {
    const categories: CategoryInfo[] = []

    // Get all category keys
    const categoryKeys = await kv.keys("category:*")

    for (const key of categoryKeys) {
      try {
        // Get business count for this category
        const businesses = await kv.smembers(key)
        const businessCount = Array.isArray(businesses) ? businesses.length : 0

        // Determine category type and display name
        let type: "main" | "subcategory" | "path" = "main"
        let displayName = key.replace("category:", "")

        if (key.includes(":") && key.split(":").length > 2) {
          type = "subcategory"
          displayName = key.replace("category:", "").replace(":", " > ")
        } else if (key.includes("path:")) {
          type = "path"
          displayName = key.replace("category:path:", "").replace(/:/g, " > ")
        }

        // Format display name
        displayName = displayName
          .split(/[-_]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")

        categories.push({
          categoryKey: key,
          displayName,
          businessCount,
          type,
        })
      } catch (err) {
        console.error(`Error processing category ${key}:`, getErrorMessage(err))
        // Add category with error info
        categories.push({
          categoryKey: key,
          displayName: `Error: ${key}`,
          businessCount: 0,
          type: "main",
        })
      }
    }

    // Sort categories by type and then by name
    return categories.sort((a, b) => {
      if (a.type !== b.type) {
        const typeOrder = { main: 0, subcategory: 1, path: 2 }
        return typeOrder[a.type] - typeOrder[b.type]
      }
      return a.displayName.localeCompare(b.displayName)
    })
  } catch (error) {
    throw new Error(`Failed to get categories: ${getErrorMessage(error)}`)
  }
}

export async function getCategoryBusinessCount(categoryKey: string): Promise<number> {
  try {
    const businesses = await kv.smembers(categoryKey)
    return Array.isArray(businesses) ? businesses.length : 0
  } catch (error) {
    console.error(`Error getting business count for ${categoryKey}:`, getErrorMessage(error))
    return 0
  }
}

export async function removeCategoryFromRedis(categoryKey: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get all businesses in this category first
    const businesses = await kv.smembers(categoryKey)
    const businessList = Array.isArray(businesses) ? businesses : []

    let removedFromBusinesses = 0
    let businessErrors = 0

    // Remove this category from each business's data
    for (const businessId of businessList) {
      try {
        const businessKey = `business:${businessId}`
        const businessData = await kv.get(businessKey)

        if (businessData && typeof businessData === "string") {
          const business = JSON.parse(businessData)

          // Extract category name from the key for comparison
          const categoryName = categoryKey.replace("category:", "").replace(/:/g, "-")

          // Remove from various category fields
          let modified = false

          if (business.category === categoryName) {
            business.category = null
            modified = true
          }

          if (business.subcategory === categoryName) {
            business.subcategory = null
            modified = true
          }

          if (business.allCategories && Array.isArray(business.allCategories)) {
            const originalLength = business.allCategories.length
            business.allCategories = business.allCategories.filter(
              (cat: string) => cat !== categoryName && !cat.includes(categoryName),
            )
            if (business.allCategories.length !== originalLength) {
              modified = true
            }
          }

          if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
            const originalLength = business.allSubcategories.length
            business.allSubcategories = business.allSubcategories.filter(
              (cat: string) => cat !== categoryName && !cat.includes(categoryName),
            )
            if (business.allSubcategories.length !== originalLength) {
              modified = true
            }
          }

          // Update categories count
          if (modified) {
            const totalCategories = (business.allCategories?.length || 0) + (business.allSubcategories?.length || 0)
            business.categoriesCount = totalCategories
            business.updatedAt = new Date().toISOString()

            await kv.set(businessKey, JSON.stringify(business))
            removedFromBusinesses++
          }
        }
      } catch (err) {
        console.error(`Error updating business ${businessId}:`, getErrorMessage(err))
        businessErrors++
      }
    }

    // Delete the category index
    await kv.del(categoryKey)

    // Also try to delete related category keys
    const relatedKeys = await kv.keys(`${categoryKey}:*`)
    for (const relatedKey of relatedKeys) {
      try {
        await kv.del(relatedKey)
      } catch (err) {
        console.error(`Error deleting related key ${relatedKey}:`, getErrorMessage(err))
      }
    }

    let message = `Successfully removed category "${categoryKey}"`
    if (businessList.length > 0) {
      message += `. Updated ${removedFromBusinesses} businesses`
      if (businessErrors > 0) {
        message += ` (${businessErrors} errors)`
      }
    }

    return {
      success: true,
      message,
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to remove category: ${getErrorMessage(error)}`,
    }
  }
}
