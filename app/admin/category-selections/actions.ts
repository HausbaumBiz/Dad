"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

interface CategorySelection {
  categoryId: string
  subcategoryId: string
  fullPath: string
  timestamp: string
}

interface BusinessCategoryData {
  businessId: string
  businessName: string
  email: string
  categorySelections: CategorySelection[]
  selectedCategoryIds: string[]
  selectedSubcategoryIds: string[]
  lastUpdated: string
}

export async function getAllBusinessCategorySelections(): Promise<BusinessCategoryData[]> {
  try {
    // Get all business IDs
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)

    if (!businessIds || businessIds.length === 0) {
      return []
    }

    const businessData: BusinessCategoryData[] = []

    for (const businessId of businessIds) {
      try {
        // Get business basic info
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

        if (!business || typeof business !== "object") {
          continue
        }

        const businessInfo = business as any

        // Get category selections data
        const categorySelectionsData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categorySelections`)
        const selectedCategoryIdsData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategoryIds`)
        const selectedSubcategoryIdsData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedSubcategoryIds`)

        let categorySelections: CategorySelection[] = []
        let selectedCategoryIds: string[] = []
        let selectedSubcategoryIds: string[] = []

        // Parse category selections
        if (categorySelectionsData) {
          try {
            if (typeof categorySelectionsData === "string") {
              categorySelections = JSON.parse(categorySelectionsData)
            } else if (Array.isArray(categorySelectionsData)) {
              categorySelections = categorySelectionsData
            }
          } catch (error) {
            console.error(`Error parsing category selections for business ${businessId}:`, error)
          }
        }

        // Parse selected category IDs
        if (selectedCategoryIdsData) {
          try {
            if (typeof selectedCategoryIdsData === "string") {
              selectedCategoryIds = JSON.parse(selectedCategoryIdsData)
            } else if (Array.isArray(selectedCategoryIdsData)) {
              selectedCategoryIds = selectedCategoryIdsData
            }
          } catch (error) {
            console.error(`Error parsing selected category IDs for business ${businessId}:`, error)
          }
        }

        // Parse selected subcategory IDs
        if (selectedSubcategoryIdsData) {
          try {
            if (typeof selectedSubcategoryIdsData === "string") {
              selectedSubcategoryIds = JSON.parse(selectedSubcategoryIdsData)
            } else if (Array.isArray(selectedSubcategoryIdsData)) {
              selectedSubcategoryIds = selectedSubcategoryIdsData
            }
          } catch (error) {
            console.error(`Error parsing selected subcategory IDs for business ${businessId}:`, error)
          }
        }

        // Only include businesses that have category selections
        if (categorySelections.length > 0 || selectedCategoryIds.length > 0) {
          businessData.push({
            businessId: String(businessId),
            businessName: businessInfo.businessName || businessInfo.name || "Unknown Business",
            email: businessInfo.email || "No email",
            categorySelections,
            selectedCategoryIds,
            selectedSubcategoryIds,
            lastUpdated: businessInfo.updatedAt || businessInfo.createdAt || new Date().toISOString(),
          })
        }
      } catch (error) {
        console.error(`Error processing business ${businessId}:`, error)
        continue
      }
    }

    // Sort by last updated (most recent first)
    businessData.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())

    return businessData
  } catch (error) {
    console.error("Error getting all business category selections:", error)
    throw new Error("Failed to load business category selections")
  }
}
