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

    // Get current categories to identify what needs to be removed
    const currentCategoriesResult = await getBusinessCategories()
    const currentCategories = currentCategoriesResult.success ? currentCategoriesResult.data || [] : []

    // Get current business data to check for category changes
    const oldPrimaryCategory = business.category
    const oldPrimarySubcategory = business.subcategory
    const oldAllCategories = business.allCategories || []

    console.log(`Previous primary category: ${oldPrimaryCategory}`)
    console.log(`New categories: ${categories.map((c) => c.category).join(", ")}`)

    // Extract all unique categories and subcategories
    const allCategories = [...new Set(categories.map((cat) => cat.category))]
    const allSubcategories = [...new Set(categories.map((cat) => cat.subcategory))]

    console.log(`Found ${allCategories.length} unique categories and ${allSubcategories.length} unique subcategories`)

    // Find categories that have been removed
    const removedCategories = currentCategories.filter(
      (oldCat) => !categories.some((newCat) => newCat.fullPath === oldCat.fullPath),
    )

    // Remove business from indexes for removed categories
    for (const removedCat of removedCategories as any) {
      const categoryKey = removedCat.category.toLowerCase().replace(/\s+/g, "-")

      // Remove from primary category index
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryKey}`, business.id)
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryKey}:businesses`, business.id)

      // Handle special case for Mortuary Services / Funeral Services
      if (removedCat.category === "Mortuary Services" || removedCat.category.includes("Funeral")) {
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
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, business.id)
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, business.id)
        }
      }

      // Handle special case for Automotive Services
      if (
        removedCat.category === "Automotive Services" ||
        removedCat.category.includes("Automotive") ||
        removedCat.category.includes("Auto")
      ) {
        const autoFormats = [
          "automotiveServices",
          "automotive-services",
          "automotive_services",
          "auto-services",
          "auto_services",
          "autoServices",
          "Automotive Services",
          "Auto Services",
          "automotive",
        ]

        for (const format of autoFormats) {
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, business.id)
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, business.id)
        }
      }

      // Remove from path index
      if (removedCat.fullPath) {
        await kv.srem(`${KEY_PREFIXES.CATEGORY}path:${removedCat.fullPath}`, business.id)
      }

      console.log(`Removed business ${business.id} from category ${removedCat.category}`)
    }

    // If primary category has changed, remove business from all old category variations
    if (oldPrimaryCategory && !allCategories.includes(oldPrimaryCategory)) {
      const oldCategoryKey = oldPrimaryCategory.toLowerCase().replace(/\s+/g, "-")

      // Remove from primary index
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategoryKey}`, business.id)
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategoryKey}:businesses`, business.id)

      // Remove from legacy index
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldPrimaryCategory}`, business.id)

      console.log(`Removed business ${business.id} from old primary category ${oldPrimaryCategory}`)
    }

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

    // Special handling for Art, Design and Entertainment category
    const hasArtsCategory = categories.some(
      (cat) =>
        cat.category === "Art, Design and Entertainment" ||
        cat.category === "Arts & Entertainment" ||
        (cat.category.toLowerCase().includes("art") && cat.category.toLowerCase().includes("entertainment")),
    )

    // Check for category conflicts - don't add to arts category if it's an automotive business
    const hasAutomotiveSubcategory = categories.some((cat) => {
      const subcategoryLower = cat.subcategory.toLowerCase()
      return (
        subcategoryLower.includes("auto") ||
        subcategoryLower.includes("car") ||
        subcategoryLower.includes("vehicle") ||
        subcategoryLower.includes("motorcycle") ||
        subcategoryLower.includes("rv") ||
        subcategoryLower.includes("repair") ||
        subcategoryLower.includes("mechanic") ||
        subcategoryLower.includes("body shop") ||
        subcategoryLower.includes("tire") ||
        subcategoryLower.includes("oil change")
      )
    })

    // If it has both arts and automotive subcategories, prioritize automotive
    if (hasArtsCategory && hasAutomotiveSubcategory) {
      console.log(`Business ${business.id} has both arts and automotive categories, prioritizing automotive`)

      // Remove from arts category
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
        await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, business.id)
        await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, business.id)
      }

      // Make sure it's in automotive category
      const autoFormats = [
        "automotive",
        "automotiveServices",
        "automotive-services",
        "Automotive Services",
        "Automotive/Motorcycle/RV",
        "auto-services",
        "autoServices",
      ]

      for (const format of autoFormats) {
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, business.id)
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, business.id)
      }
    }

    if (hasArtsCategory) {
      console.log(`Business ${business.id} has Arts & Entertainment category, adding to special indexes`)

      // Add to arts-entertainment category explicitly with multiple formats
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
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, business.id)
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, business.id)
      }
    } else {
      // Remove from arts category if it was previously there but isn't now
      if (
        oldAllCategories.some(
          (cat) =>
            cat === "Art, Design and Entertainment" ||
            cat === "Arts & Entertainment" ||
            (cat.toLowerCase().includes("art") && cat.toLowerCase().includes("entertainment")),
        )
      ) {
        console.log(`Business ${business.id} no longer has Arts category, removing from arts indexes`)

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
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, business.id)
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, business.id)
        }
      }
    }

    // Special handling for Automotive/Motorcycle/RV category
    const hasAutomotiveCategory = categories.some(
      (cat) =>
        cat.category === "Automotive Services" ||
        cat.category === "Automotive/Motorcycle/RV" ||
        cat.category.toLowerCase().includes("automotive") ||
        cat.category.toLowerCase().includes("auto services") ||
        cat.category.toLowerCase().includes("motorcycle") ||
        cat.category.toLowerCase().includes("rv"),
    )

    if (hasAutomotiveCategory) {
      console.log(`Business ${business.id} has Automotive category, adding to special indexes`)

      // Add to automotive-services category explicitly with multiple formats
      const autoFormats = [
        "automotive",
        "automotiveServices",
        "automotive-services",
        "Automotive Services",
        "Automotive/Motorcycle/RV",
        "auto-services",
        "autoServices",
      ]

      for (const format of autoFormats) {
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, business.id)
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, business.id)
      }
    } else {
      // Remove from automotive category if it was previously there but isn't now
      if (
        oldAllCategories.some(
          (cat) =>
            cat === "Automotive Services" ||
            cat === "Automotive/Motorcycle/RV" ||
            cat.toLowerCase().includes("automotive") ||
            cat.toLowerCase().includes("auto services"),
        )
      ) {
        console.log(`Business ${business.id} no longer has Automotive category, removing from automotive indexes`)

        const autoFormats = [
          "automotive",
          "automotiveServices",
          "automotive-services",
          "Automotive Services",
          "Automotive/Motorcycle/RV",
          "auto-services",
          "autoServices",
        ]

        for (const format of autoFormats) {
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, business.id)
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, business.id)
        }
      }
    }

    // Check for automotive subcategories even if the main category is different
    const hasAutomotiveSubcategory2 = categories.some((cat) => {
      const subcategoryLower = cat.subcategory.toLowerCase()
      return (
        subcategoryLower.includes("auto") ||
        subcategoryLower.includes("car") ||
        subcategoryLower.includes("vehicle") ||
        subcategoryLower.includes("motorcycle") ||
        subcategoryLower.includes("rv") ||
        subcategoryLower.includes("repair") ||
        subcategoryLower.includes("mechanic") ||
        subcategoryLower.includes("body shop") ||
        subcategoryLower.includes("tire") ||
        subcategoryLower.includes("oil change")
      )
    })

    if (hasAutomotiveSubcategory2 && !hasAutomotiveCategory) {
      console.log(`Business ${business.id} has automotive-related subcategory, adding to automotive category indexes`)

      // Add to automotive-services category explicitly
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}automotive-services`, business.id)
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}automotive-services:businesses`, business.id)
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}automotive`, business.id)
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}automotive:businesses`, business.id)
    }

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
      // Ensure the primary category and subcategory are updated
      const updatedBusiness = {
        ...business,
        // Always update the primary category/subcategory to the first selected category
        category: categories.length > 0 ? categories[0].category : "",
        subcategory: categories.length > 0 ? categories[0].subcategory : "",
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
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${categoryKey}`, business.id)
      }

      // Revalidate all potentially affected paths
      revalidatePath("/business-focus")
      revalidatePath("/statistics")
      revalidatePath("/workbench")
      revalidatePath("/admin/businesses")
      revalidatePath(`/admin/businesses/${business.id}`)
      revalidatePath("/arts-entertainment")
      revalidatePath("/funeral-services")
      revalidatePath("/automotive-services")

      // Revalidate all category paths
      if (oldAllCategories.length > 0 || allCategories.length > 0) {
        const allCategoryPaths = [...new Set([...oldAllCategories, ...allCategories])]
        for (const cat of allCategoryPaths) {
          const path = cat.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and").replace(/\//g, "-")
          revalidatePath(`/${path}`)
        }
      }

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
