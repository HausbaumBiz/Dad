"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

/**
 * Fix the category indexing for a specific business
 */
export async function fixBusinessCategory(businessId: string, category: string) {
  try {
    console.log(`Fixing category indexing for business ${businessId} with category ${category}`)

    // 1. Check if the business exists
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
    if (!business) {
      console.error(`Business ${businessId} not found`)
      return {
        success: false,
        message: `Business ${businessId} not found`,
      }
    }

    console.log(`Found business: ${JSON.stringify(business)}`)

    // 2. Update the business's category field
    const updatedBusiness = {
      ...business,
      category: category,
      updatedAt: new Date().toISOString(),
    }

    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}`, updatedBusiness)
    console.log(`Updated business category to ${category}`)

    // 3. Add the business to the category index
    await kv.sadd(`${KEY_PREFIXES.CATEGORY}${category}`, businessId)
    console.log(`Added business to category index ${KEY_PREFIXES.CATEGORY}${category}`)

    // 4. Check if the business is now in the category index
    const businessesInCategory = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${category}`)
    console.log(`Businesses in category ${category}: ${JSON.stringify(businessesInCategory)}`)

    const isBusinessInCategory = businessesInCategory.includes(businessId)
    console.log(`Is business in category index? ${isBusinessInCategory}`)

    // 5. Revalidate relevant paths
    revalidatePath("/funeral-services")
    revalidatePath("/admin/businesses")
    revalidatePath(`/admin/businesses/${businessId}`)

    return {
      success: true,
      message: `Successfully fixed category indexing for business ${businessId}`,
      isInCategoryIndex: isBusinessInCategory,
    }
  } catch (error) {
    console.error(`Error fixing category for business ${businessId}:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Check if a business is properly indexed under a category
 */
export async function checkBusinessCategory(businessId: string, category: string) {
  try {
    console.log(`Checking category indexing for business ${businessId} with category ${category}`)

    // 1. Check if the business exists
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
    if (!business) {
      console.error(`Business ${businessId} not found`)
      return {
        success: false,
        message: `Business ${businessId} not found`,
        business: null,
        isInCategoryIndex: false,
      }
    }

    // 2. Check if the business has the correct category
    const hasCorrectCategory = business.category === category
    console.log(`Business has correct category? ${hasCorrectCategory}`)

    // 3. Check if the business is in the category index
    const businessesInCategory = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${category}`)
    const isInCategoryIndex = businessesInCategory.includes(businessId)
    console.log(`Business is in category index? ${isInCategoryIndex}`)

    return {
      success: true,
      message: `Category check completed for business ${businessId}`,
      business,
      hasCorrectCategory,
      isInCategoryIndex,
    }
  } catch (error) {
    console.error(`Error checking category for business ${businessId}:`, error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      business: null,
      isInCategoryIndex: false,
    }
  }
}

/**
 * List all categories in the database
 */
export async function listAllCategories() {
  try {
    console.log("Listing all categories in the database")

    // Get all business IDs
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    console.log(`Found ${businessIds.length} businesses`)

    // Get all categories from businesses
    const categoriesFromBusinesses = new Set<string>()
    const businessCategories: Record<string, string[]> = {}

    for (const id of businessIds) {
      try {
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)
        if (business && business.category) {
          categoriesFromBusinesses.add(business.category)

          // Group businesses by category
          if (!businessCategories[business.category]) {
            businessCategories[business.category] = []
          }
          businessCategories[business.category].push(business.businessName || `Business ${id}`)
        }
      } catch (error) {
        console.error(`Error getting category for business ${id}:`, error)
      }
    }

    console.log(`Found ${categoriesFromBusinesses.size} unique categories from businesses`)

    // Get all category keys directly (without using scan)
    // Since we can't use scan, we'll use the categories we found from businesses
    // and check if they exist as category indexes
    const categoryKeys = []
    const categoryIndexes: Record<string, string[]> = {}

    for (const category of categoriesFromBusinesses) {
      try {
        const key = `${KEY_PREFIXES.CATEGORY}${category}`
        const businessesInCategory = await kv.smembers(key)

        if (businessesInCategory && businessesInCategory.length > 0) {
          categoryKeys.push(category)
          categoryIndexes[category] = businessesInCategory
        }
      } catch (error) {
        console.error(`Error checking category index for ${category}:`, error)
      }
    }

    console.log(`Found ${categoryKeys.length} category indexes in Redis`)

    return {
      success: true,
      categoriesFromBusinesses: Array.from(categoriesFromBusinesses),
      categoryKeys: categoryKeys,
      businessCategories,
      categoryIndexes,
    }
  } catch (error) {
    console.error("Error listing categories:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      categoriesFromBusinesses: [],
      categoryKeys: [],
      businessCategories: {},
      categoryIndexes: {},
    }
  }
}
