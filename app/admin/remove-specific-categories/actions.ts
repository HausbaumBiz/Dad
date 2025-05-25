"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function removeSpecificCategoriesFromBusiness(businessId: string, categoriesToRemove: string[]) {
  try {
    console.log(`Removing specific categories from business ${businessId}`)
    console.log("Categories to remove:", categoriesToRemove)

    // Get current categories
    const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)

    if (!categoriesData) {
      return {
        success: false,
        message: "No categories found for this business",
      }
    }

    let currentCategories: any[] = []

    if (typeof categoriesData === "string") {
      try {
        currentCategories = JSON.parse(categoriesData)
      } catch (error) {
        return {
          success: false,
          message: "Error parsing current categories",
        }
      }
    } else if (Array.isArray(categoriesData)) {
      currentCategories = categoriesData
    }

    console.log("Current categories:", currentCategories)

    // Filter out the categories to remove
    const remainingCategories = currentCategories.filter((cat) => {
      const fullPath = cat.fullPath || `${cat.category} > ${cat.subcategory}`
      const shouldRemove = categoriesToRemove.includes(fullPath)

      if (shouldRemove) {
        console.log(`Removing category: ${fullPath}`)
      }

      return !shouldRemove
    })

    console.log("Remaining categories:", remainingCategories)

    // Remove business from category indexes for removed categories
    const removedCategories = currentCategories.filter((cat) => {
      const fullPath = cat.fullPath || `${cat.category} > ${cat.subcategory}`
      return categoriesToRemove.includes(fullPath)
    })

    for (const removedCat of removedCategories) {
      const categoryKey = removedCat.category.toLowerCase().replace(/\s+/g, "-")

      // Remove from primary category index
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryKey}`, businessId)
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryKey}:businesses`, businessId)

      // Handle special cases for Personal Assistant
      if (removedCat.category === "Personal Assistant") {
        const personalAssistantFormats = [
          "personalAssistant",
          "personal-assistant",
          "personal_assistant",
          "Personal Assistant",
        ]

        for (const format of personalAssistantFormats) {
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
        }
      }

      // Handle special cases for Home and Lawn Labor
      if (removedCat.category === "Home and Lawn Labor") {
        const homeFormats = [
          "homeAndLawnLabor",
          "home-and-lawn-labor",
          "home_and_lawn_labor",
          "Home and Lawn Labor",
          "home-improvement",
          "homeImprovement",
        ]

        for (const format of homeFormats) {
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
        }
      }

      // Handle special cases for Automotive
      if (removedCat.category === "Automotive/Motorcycle/RV" || removedCat.category.includes("Automotive")) {
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
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
          await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
        }
      }

      // Remove from path index
      if (removedCat.fullPath) {
        await kv.srem(`${KEY_PREFIXES.CATEGORY}path:${removedCat.fullPath}`, businessId)
      }

      console.log(`Removed business ${businessId} from category ${removedCat.category}`)
    }

    // Update the categories data
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`, JSON.stringify(remainingCategories))

    // Update all categories and subcategories lists
    const allCategories = [...new Set(remainingCategories.map((cat: any) => cat.category))]
    const allSubcategories = [...new Set(remainingCategories.map((cat: any) => cat.subcategory))]

    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:allCategories`, JSON.stringify(allCategories))
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`, JSON.stringify(allSubcategories))

    // Update other category formats
    const categoryIds = remainingCategories.map((cat: any) => cat.category)
    const subcategoryIds = remainingCategories.map((cat: any) => cat.subcategory)
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategoryIds`, JSON.stringify(categoryIds))
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedSubcategoryIds`, JSON.stringify(subcategoryIds))

    // Update simplified categories
    const simplifiedCategories = remainingCategories.map((cat: any) => ({
      category: cat.category,
      subcategory: cat.subcategory,
      fullPath: cat.fullPath,
    }))
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:simplifiedCategories`, JSON.stringify(simplifiedCategories))

    // Update business object
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)
    if (business) {
      const updatedBusiness = {
        ...business,
        category: remainingCategories.length > 0 ? remainingCategories[0].category : "",
        subcategory: remainingCategories.length > 0 ? remainingCategories[0].subcategory : "",
        allCategories,
        allSubcategories,
        categoriesCount: remainingCategories.length,
        updatedAt: new Date().toISOString(),
      }

      await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}`, updatedBusiness)
    }

    // Revalidate paths
    revalidatePath("/admin/businesses")
    revalidatePath(`/admin/businesses/${businessId}`)
    revalidatePath("/personal-assistants")
    revalidatePath("/home-improvement/lawn-garden")
    revalidatePath("/automotive-services")
    revalidatePath("/business-focus")

    return {
      success: true,
      message: `Successfully removed ${removedCategories.length} categories from business ${businessId}`,
      data: {
        removedCount: removedCategories.length,
        remainingCount: remainingCategories.length,
        remainingCategories: remainingCategories,
        removedCategories: removedCategories,
      },
    }
  } catch (error) {
    console.error("Error removing specific categories:", error)
    return {
      success: false,
      message: "Failed to remove categories",
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
