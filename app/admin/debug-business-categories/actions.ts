"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { getCategoryIdsForRoute } from "@/lib/category-route-mapping"

export async function debugBusinessCategories(businessId: string) {
  try {
    console.log(`Debugging business categories for: ${businessId}`)

    // Get business basic data
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    // Get all category-related data
    const selectedCategoryIds = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategoryIds`)
    const selectedSubcategoryIds = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedSubcategoryIds`)
    const categories = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
    const allCategories = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:allCategories`)
    const categorySelections = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categorySelections`)

    // Check what route this should appear on
    const techCategoryIds = getCategoryIdsForRoute("/tech-it-services")
    const legalCategoryIds = getCategoryIdsForRoute("/legal-services")

    // Parse the data
    let parsedSelectedCategoryIds: string[] = []
    let parsedSelectedSubcategoryIds: string[] = []

    if (selectedCategoryIds) {
      if (typeof selectedCategoryIds === "string") {
        try {
          parsedSelectedCategoryIds = JSON.parse(selectedCategoryIds)
        } catch {
          parsedSelectedCategoryIds = [selectedCategoryIds]
        }
      } else if (Array.isArray(selectedCategoryIds)) {
        parsedSelectedCategoryIds = selectedCategoryIds
      }
    }

    if (selectedSubcategoryIds) {
      if (typeof selectedSubcategoryIds === "string") {
        try {
          parsedSelectedSubcategoryIds = JSON.parse(selectedSubcategoryIds)
        } catch {
          parsedSelectedSubcategoryIds = [selectedSubcategoryIds]
        }
      } else if (Array.isArray(selectedSubcategoryIds)) {
        parsedSelectedSubcategoryIds = selectedSubcategoryIds
      }
    }

    // Check if business should appear on tech page
    const allSelectedIds = [...parsedSelectedCategoryIds, ...parsedSelectedSubcategoryIds]
    const shouldAppearOnTech = techCategoryIds.some((targetId) =>
      allSelectedIds.some(
        (selectedId) =>
          selectedId === targetId ||
          selectedId.toLowerCase() === targetId.toLowerCase() ||
          selectedId.replace(/\s+/g, "").toLowerCase() === targetId.replace(/\s+/g, "").toLowerCase(),
      ),
    )

    const shouldAppearOnLegal = legalCategoryIds.some((targetId) =>
      allSelectedIds.some(
        (selectedId) =>
          selectedId === targetId ||
          selectedId.toLowerCase() === targetId.toLowerCase() ||
          selectedId.replace(/\s+/g, "").toLowerCase() === targetId.replace(/\s+/g, "").toLowerCase(),
      ),
    )

    return {
      businessId,
      businessName: business ? (business as any).businessName || (business as any).name : "Not found",
      businessExists: !!business,
      selectedCategoryIds: parsedSelectedCategoryIds,
      selectedSubcategoryIds: parsedSelectedSubcategoryIds,
      allSelectedIds,
      categories,
      allCategories,
      categorySelections,
      routeMapping: {
        techCategoryIds,
        legalCategoryIds,
        shouldAppearOnTech,
        shouldAppearOnLegal,
      },
      rawData: {
        selectedCategoryIds,
        selectedSubcategoryIds,
        categories,
        allCategories,
        categorySelections,
      },
    }
  } catch (error) {
    console.error("Error debugging business categories:", error)
    return {
      error: error instanceof Error ? error.message : "Unknown error",
      businessId,
    }
  }
}
