"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"
import { categoryData } from "./category-data"

/**
 * Maps a category ID to its corresponding page route
 */
export async function getCategoryRoute(categoryId: string): Promise<string> {
  // Find the category in the category data
  for (const category of categoryData) {
    if (category.id === categoryId) {
      return category.route
    }

    // Check subcategories
    if (category.subcategories) {
      for (const subcategory of category.subcategories) {
        if (subcategory.id === categoryId) {
          return subcategory.route || category.route
        }
      }
    }
  }

  // Default fallback
  console.warn(`No route found for category ID: ${categoryId}`)
  return "/"
}

/**
 * Fixes the page mappings for a business based on its categories
 */
export async function fixCategoryPageMappings(businessId: string): Promise<{
  success: boolean
  message: string
  oldPages?: string[]
  newPages?: string[]
}> {
  try {
    // Get the business's categories
    const businessCategories = (await kv.smembers(`business:${businessId}:categories`)) as string[]

    if (!businessCategories || businessCategories.length === 0) {
      return {
        success: false,
        message: `Business ${businessId} has no categories`,
      }
    }

    // Get the current page mappings
    const currentPages = (await kv.smembers(`business:${businessId}:pages`)) as string[]

    // Calculate the new page mappings
    const newPages: string[] = []
    for (const categoryId of businessCategories) {
      const route = await getCategoryRoute(categoryId)
      if (route && route !== "/") {
        newPages.push(route)
      }
    }

    // Remove duplicates
    const uniqueNewPages = [...new Set(newPages)]

    // Remove the business from all current pages
    for (const page of currentPages) {
      await kv.srem(`page:${page}:businesses`, businessId)
      // Revalidate the path to update the page
      revalidatePath(`/${page}`)
    }

    // Clear the business's page mappings
    await kv.del(`business:${businessId}:pages`)

    // Add the business to the new pages
    if (uniqueNewPages.length > 0) {
      // Add the business to each new page
      for (const page of uniqueNewPages) {
        await kv.sadd(`page:${page}:businesses`, businessId)
        // Revalidate the path to update the page
        revalidatePath(`/${page}`)
      }

      // Update the business's page mappings
      await kv.sadd(`business:${businessId}:pages`, ...uniqueNewPages)
    }

    return {
      success: true,
      message: `Updated page mappings for business ${businessId}`,
      oldPages: currentPages,
      newPages: uniqueNewPages,
    }
  } catch (error) {
    console.error("Error fixing category page mappings:", error)
    return {
      success: false,
      message: `Error fixing category page mappings: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Rebuilds all page mappings for all businesses
 */
export async function rebuildAllPageMappings(): Promise<{
  success: boolean
  message: string
  businessesProcessed?: number
  errors?: string[]
}> {
  try {
    // Get all businesses
    const businessIds = (await kv.smembers("businesses")) as string[]

    if (!businessIds || businessIds.length === 0) {
      return {
        success: false,
        message: "No businesses found",
      }
    }

    const errors: string[] = []
    let successCount = 0

    // Process each business
    for (const businessId of businessIds) {
      try {
        const result = await fixCategoryPageMappings(businessId)
        if (result.success) {
          successCount++
        } else {
          errors.push(`Business ${businessId}: ${result.message}`)
        }
      } catch (error) {
        errors.push(`Business ${businessId}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return {
      success: true,
      message: `Processed ${successCount} businesses with ${errors.length} errors`,
      businessesProcessed: businessIds.length,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error) {
    console.error("Error rebuilding all page mappings:", error)
    return {
      success: false,
      message: `Error rebuilding all page mappings: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
