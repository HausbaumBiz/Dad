"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { getCurrentBusiness } from "./business-actions"
import type { CategorySelection } from "@/components/category-selector"
import { saveBusinessCategories as saveBusinessCategoriesToDb, KEY_PREFIXES, type CategoryData } from "@/lib/db-schema"

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object") return JSON.stringify(error)
  return "Unknown error occurred"
}

// Save business categories
export async function saveBusinessCategories(categories: CategorySelection[]) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      console.error("[DEBUG] saveBusinessCategories: No authenticated business")
      return { success: false, message: "Not authenticated" }
    }

    console.log("[DEBUG] Saving categories for business:", {
      businessId: business.id,
      businessName: business.businessName,
      categories: categories.map(c => ({
        category: c.category,
        subcategory: c.subcategory,
        fullPath: c.fullPath
      }))
    })

    // Get current categories to identify what needs to be removed
    const currentCategoriesResult = await getBusinessCategories()
    const currentCategories = currentCategoriesResult.success ? currentCategoriesResult.data || [] : []

    // Get current business data to check for category changes
    const oldPrimaryCategory = business.category
    const oldPrimarySubcategory = business.subcategory
    const oldAllCategories = business.allCategories || []

    console.log("[DEBUG] Current business data:", {
      businessId: business.id,
      oldPrimaryCategory,
      oldPrimarySubcategory,
      oldAllCategories
    })

    // Extract all unique categories and subcategories
    const allCategories = [...new Set(categories.map((cat) => cat.category))]
    const allSubcategories = [...new Set(categories.map((cat) => cat.subcategory).filter(Boolean))]

    console.log("[DEBUG] Processed categories:", {
      businessId: business.id,
      allCategories,
      allSubcategories
    })

    // Find categories that have been removed
    const removedCategories = currentCategories.filter(
      (oldCat) => !categories.some((newCat) => newCat.fullPath === oldCat.fullPath),
    )

    // Remove business from indexes for removed categories
    for (const removedCat of removedCategories as any) {
      const categoryKey = removedCat.category.toLowerCase().replace(/\s+/g, "-")
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryKey}`, business.id)
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${categoryKey}:businesses`, business.id)
      console.log("[DEBUG] Removed business from category index:", {
        businessId: business.id,
        categoryKey
      })

      // Remove from path index
      if (removedCat.fullPath) {
        await kv.srem(`${KEY_PREFIXES.CATEGORY}path:${removedCat.fullPath}`, business.id)
        console.log("[DEBUG] Removed business from path index:", {
          businessId: business.id,
          fullPath: removedCat.fullPath
        })
      }

      // Handle special cases (Mortuary, Automotive, etc.)
      // [Existing special case logic unchanged, but add logging]
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
          console.log("[DEBUG] Removed business from mortuary format:", {
            businessId: business.id,
            format
          })
        }
      }

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
          console.log("[DEBUG] Removed business from automotive format:", {
            businessId: business.id,
            format
          })
        }
      }
    }

    // If primary category has changed, remove business from old category variations
    if (oldPrimaryCategory && !allCategories.includes(oldPrimaryCategory)) {
      const oldCategoryKey = oldPrimaryCategory.toLowerCase().replace(/\s+/g, "-")
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategoryKey}`, business.id)
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldCategoryKey}:businesses`, business.id)
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${oldPrimaryCategory}`, business.id)
      console.log("[DEBUG] Removed business from old primary category:", {
        businessId: business.id,
        oldCategoryKey
      })
    }

    // Save all categories and subcategories
    await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:allCategories`, JSON.stringify(allCategories))
    await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:allSubcategories`, JSON.stringify(allSubcategories))
    console.log("[DEBUG] Stored all categories and subcategories:", {
      businessId: business.id,
      allCategories,
      allSubcategories
    })

    // Convert CategorySelection to CategoryData
    const categoryData: CategoryData[] = categories.map((cat) => ({
      id: cat.category.toLowerCase().replace(/\s+/g, "-"),
      name: cat.category,
      parentId: cat.category.toLowerCase().replace(/\s+/g, "-"),
      path: cat.fullPath,
    }))

    // Special handling for Pet Care
    const hasPetCareCategory = categories.some(cat => 
      cat.category.toLowerCase() === "pet care" || 
      cat.category.toLowerCase() === "petcare" ||
      cat.category.toLowerCase().includes("pet care")
    )
    if (hasPetCareCategory) {
      console.log("[DEBUG] Business has Pet Care category, adding to special indexes:", {
        businessId: business.id
      })
      const petCareFormats = [
        "petCare",
        "pet-care",
        "pet_care",
        "Pet Care"
      ]
      for (const format of petCareFormats) {
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, business.id)
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, business.id)
        console.log("[DEBUG] Added business to pet care format:", {
          businessId: business.id,
          format
        })
      }
    } else if (oldAllCategories.some(cat => cat.toLowerCase().includes("pet care"))) {
      console.log("[DEBUG] Business no longer has Pet Care category, removing from indexes:", {
        businessId: business.id
      })
      const petCareFormats = [
        "petCare",
        "pet-care",
        "pet_care",
        "Pet Care"
      ]
      for (const format of petCareFormats) {
        await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}`, business.id)
        await kv.srem(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, business.id)
        console.log("[DEBUG] Removed business from pet care format:", {
          businessId: business.id,
          format
        })
      }
    }

    // Special handling for Art, Design and Entertainment
    const hasArtsCategory = categories.some(
      (cat) =>
        cat.category === "Art, Design and Entertainment" ||
        cat.category === "Arts & Entertainment" ||
        (cat.category.toLowerCase().includes("art") && cat.category.toLowerCase().includes("entertainment")),
    )
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

    if (hasArtsCategory && hasAutomotiveSubcategory) {
      console.log("[DEBUG] Business has both arts and automotive categories, prioritizing automotive:", {
        businessId: business.id
      })
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
      console.log("[DEBUG] Business has Arts & Entertainment category, adding to special indexes:", {
        businessId: business.id
      })
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
    } else if (
      oldAllCategories.some(
        (cat) =>
          cat === "Art, Design and Entertainment" ||
          cat === "Arts & Entertainment" ||
          (cat.toLowerCase().includes("art") && cat.toLowerCase().includes("entertainment")),
      )
    ) {
      console.log("[DEBUG] Business no longer has Arts category, removing from arts indexes:", {
        businessId: business.id
      })
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

    // Special handling for Automotive/Motorcycle/RV
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
      console.log("[DEBUG] Business has Automotive category, adding to special indexes:", {
        businessId: business.id
      })
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
    } else if (
      oldAllCategories.some(
        (cat) =>
          cat === "Automotive Services" ||
          cat === "Automotive/Motorcycle/RV" ||
          cat.toLowerCase().includes("automotive") ||
          cat.toLowerCase().includes("auto services"),
      )
    ) {
      console.log("[DEBUG] Business no longer has Automotive category, removing from automotive indexes:", {
        businessId: business.id
      })
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

    // Check for automotive subcategories
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
      console.log("[DEBUG] Business has automotive-related subcategory, adding to automotive indexes:", {
        businessId: business.id
      })
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}automotive-services`, business.id)
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}automotive-services:businesses`, business.id)
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}automotive`, business.id)
      await kv.sadd(`${KEY_PREFIXES.CATEGORY}automotive:businesses`, business.id)
    }

    // Save using the new schema
    const success = await saveBusinessCategoriesToDb(business.id, categoryData)
    console.log("[DEBUG] saveBusinessCategoriesToDb result:", {
      businessId: business.id,
      success
    })

    if (success) {
      // Save as JSON string for backward compatibility
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:categories`, JSON.stringify(categories))

      // Store category IDs for admin viewing
      const categoryIds = categories.map((cat) => cat.category.toLowerCase().replace(/\s+/g, ""))
      const subcategoryIds = categories.map((cat) => cat.subcategory).filter(Boolean)
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:selectedCategoryIds`, categoryIds)
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:selectedSubcategoryIds`, subcategoryIds)
      console.log("[DEBUG] Stored selected IDs:", {
        businessId: business.id,
        selectedCategoryIds: categoryIds,
        selectedSubcategoryIds: subcategoryIds
      })

      // Store full category selection data
      const categorySelectionData = categories.map((cat) => ({
        categoryId: cat.category,
        subcategoryId: cat.subcategory,
        fullPath: cat.fullPath,
        timestamp: new Date().toISOString(),
      }))
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:categorySelections`, JSON.stringify(categorySelectionData))

      // Save categories and subcategories explicitly
      const categoriesWithSubcategories = categories.map((cat) => ({
        category: cat.category,
        subcategory: cat.subcategory,
      }))
      await kv.set(
        `${KEY_PREFIXES.BUSINESS}${business.id}:categoriesWithSubcategories`,
        JSON.stringify(categoriesWithSubcategories),
      )

      // Save simplified format
      const simplifiedCategories = categories.map((cat) => ({
        category: cat.category,
        subcategory: cat.subcategory,
        fullPath: cat.fullPath,
      }))
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:simplifiedCategories`, JSON.stringify(simplifiedCategories))

      // Update business object
      const updatedBusiness = {
        ...business,
        category: categories.length > 0 ? categories[0].category : "",
        subcategory: categories.length > 0 ? categories[0].subcategory : "",
        allCategories,
        allSubcategories,
        services: allSubcategories, // Ensure services match subcategories
        categoriesCount: categories.length,
        updatedAt: new Date().toISOString(),
      }
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}`, updatedBusiness)
      console.log("[DEBUG] Updated business object:", {
        businessId: business.id,
        businessName: updatedBusiness.businessName,
        category: updatedBusiness.category,
        subcategory: updatedBusiness.subcategory,
        services: updatedBusiness.services
      })

      // Index by category
      for (const category of allCategories) {
        const categoryKey = category.toLowerCase().replace(/\s+/g, "-")
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${categoryKey}:businesses`, business.id)
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${categoryKey}`, business.id)
        console.log("[DEBUG] Indexed business in category:", {
          businessId: business.id,
          categoryKey
        })
      }

      // Ensure business is in BUSINESSES_SET
      await kv.sadd(KEY_PREFIXES.BUSINESSES_SET, business.id)
      console.log("[DEBUG] Added business to BUSINESSES_SET:", {
        businessId: business.id
      })

      // Revalidate paths
      revalidatePath("/business-focus")
      revalidatePath("/statistics")
      revalidatePath("/workbench")
      revalidatePath("/admin/businesses")
      revalidatePath(`/admin/businesses/${business.id}`)
      revalidatePath("/arts-entertainment")
      revalidatePath("/funeral-services")
      revalidatePath("/automotive-services")
      revalidatePath("/pet-care")
      if (oldAllCategories.length > 0 || allCategories.length > 0) {
        const allCategoryPaths = [...new Set([...oldAllCategories, ...allCategories])]
        for (const cat of allCategoryPaths) {
          const path = cat.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and").replace(/\//g, "-")
          revalidatePath(`/${path}`)
        }
      }

      console.log("[DEBUG] Categories saved successfully:", {
        businessId: business.id,
        categoryCount: categories.length
      })
      return { success: true, message: `Saved ${categories.length} categories` }
    } else {
      throw new Error("Failed to save categories")
    }
  } catch (error) {
    console.error("[DEBUG] Error saving business categories:", {
      businessId: business?.id || "unknown",
      error: getErrorMessage(error)
    })
    return { success: false, message: "Failed to save categories" }
  }
}

// Get business categories
export async function getBusinessCategories() {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      console.error("[DEBUG] getBusinessCategories: No authenticated business")
      return { success: false, message: "Not authenticated" }
    }

    console.log("[DEBUG] Fetching categories for business:", {
      businessId: business.id
    })

    const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${business.id}:categories`)
    if (!categoriesData) {
      console.log("[DEBUG] No categories found for business:", {
        businessId: business.id
      })
      return { success: true, data: [] }
    }

    let categories: CategorySelection[]
    if (typeof categoriesData === "string") {
      try {
        categories = JSON.parse(categoriesData)
        console.log("[DEBUG] Parsed categories:", {
          businessId: business.id,
          categories: categories.map(c => c.category)
        })
      } catch (error) {
        console.error("[DEBUG] Error parsing categories:", {
          businessId: business.id,
          error: getErrorMessage(error)
        })
        return { success: false, message: "Invalid category data format" }
      }
    } else if (Array.isArray(categoriesData)) {
      categories = categoriesData as CategorySelection[]
      console.log("[DEBUG] Retrieved categories array:", {
        businessId: business.id,
        categories: categories.map(c => c.category)
      })
    } else {
      console.error("[DEBUG] Unexpected categories data format:", {
        businessId: business.id,
        type: typeof categoriesData
      })
      return { success: false, message: "Unexpected data format" }
    }

    return { success: true, data: categories }
  } catch (error) {
    console.error("[DEBUG] Error getting business categories:", {
      businessId: business?.id || "unknown",
      error: getErrorMessage(error)
    })
    return { success: false, message: "Failed to get categories" }
  }
}

// Get all categories and subcategories
export async function getBusinessAllCategoriesAndSubcategories() {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      console.error("[DEBUG] getBusinessAllCategoriesAndSubcategories: No authenticated business")
      return { success: false, message: "Not authenticated" }
    }

    console.log("[DEBUG] Fetching all categories and subcategories for business:", {
      businessId: business.id
    })

    const allCategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${business.id}:allCategories`)
    const allSubcategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${business.id}:allSubcategories`)

    let allCategories: string[] = []
    let allSubcategories: string[] = []

    if (allCategoriesData) {
      if (typeof allCategoriesData === "string") {
        try {
          allCategories = JSON.parse(allCategoriesData)
        } catch (error) {
          console.error("[DEBUG] Error parsing all categories:", {
            businessId: business.id,
            error: getErrorMessage(error)
          })
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
          console.error("[DEBUG] Error parsing all subcategories:", {
            businessId: business.id,
            error: getErrorMessage(error)
          })
        }
      } else if (Array.isArray(allSubcategoriesData)) {
        allSubcategories = allSubcategoriesData
      }
    }

    console.log("[DEBUG] Retrieved all categories and subcategories:", {
      businessId: business.id,
      allCategories,
      allSubcategories
    })

    return {
      success: true,
      data: {
        categories: allCategories,
        subcategories: allSubcategories,
      },
    }
  } catch (error) {
    console.error("[DEBUG] Error getting all categories and subcategories:", {
      businessId: business?.id || "unknown",
      error: getErrorMessage(error)
    })
    return { success: false, message: "Failed to get categories and subcategories" }
  }
}

// Remove a business category
export async function removeBusinessCategory(fullPath: string) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      console.error("[DEBUG] removeBusinessCategory: No authenticated business")
      return { success: false, message: "Not authenticated" }
    }

    console.log("[DEBUG] Removing category for business:", {
      businessId: business.id,
      fullPath
    })

    const result = await getBusinessCategories()
    if (!result.success || !result.data) {
      console.error("[DEBUG] Failed to get current categories:", {
        businessId: business.id
      })
      return { success: false, message: "Failed to get current categories" }
    }

    const updatedCategories = result.data.filter((cat) => cat.fullPath !== fullPath)
    const saveResult = await saveBusinessCategories(updatedCategories)

    if (!saveResult.success) {
      console.error("[DEBUG] Failed to save updated categories:", {
        businessId: business.id,
        message: saveResult.message
      })
      return { success: false, message: saveResult.message }
    }

    revalidatePath("/business-focus")
    revalidatePath("/statistics")
    console.log("[DEBUG] Category removed successfully:", {
      businessId: business.id,
      fullPath
    })

    return { success: true, message: "Category removed successfully" }
  } catch (error) {
    console.error("[DEBUG] Error removing business category:", {
      businessId: business?.id || "unknown",
      error: getErrorMessage(error)
    })
    return { success: false, message: "Failed to remove category" }
  }
}

// Suggest a new category
export async function suggestCategory(formData: FormData) {
  try {
    const business = await getCurrentBusiness()
    const businessId = business?.id || "anonymous"

    console.log("[DEBUG] Suggesting new category:", {
      businessId
    })

    const category = formData.get("category") as string
    const subcategory = formData.get("subcategory") as string
    const reason = formData.get("reason") as string

    if (!category || !subcategory) {
      console.error("[DEBUG] Missing category or subcategory:", {
        businessId,
        category,
        subcategory
      })
      return { success: false, message: "Category and subcategory are required" }
    }

    const suggestionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    await kv.hset(`category:suggestions:${suggestionId}`, {
      category,
      subcategory,
      reason,
      businessId,
      createdAt: new Date().toISOString(),
      status: "pending",
    })
    await kv.sadd("category:suggestions", suggestionId)

    console.log("[DEBUG] Category suggestion submitted:", {
      businessId,
      suggestionId,
      category,
      subcategory
    })

    return { success: true, message: "Thank you for your suggestion! We'll review it soon." }
  } catch (error) {
    console.error("[DEBUG] Error suggesting category:", {
      businessId: business?.id || "unknown",
      error: getErrorMessage(error)
    })
    return { success: false, message: "Failed to submit suggestion" }
  }
}
