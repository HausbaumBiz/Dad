"use server"

import { kv } from "@/lib/redis"
import { getCategoryIdsForRoute } from "@/lib/category-route-mapping"
import type { Business } from "@/lib/definitions"
import { KEY_PREFIXES } from "@/lib/db-schema"

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (error && typeof error === "object") {
    return JSON.stringify(error)
  }
  return "Unknown error occurred"
}

// Function to get businesses by their selected category IDs
export async function getBusinessesBySelectedCategories(route: string, zipCode: string | null = null): Promise<Business[]> {
  try {
    console.log(`[DEBUG] Fetching businesses for route: ${route}, zipCode: ${zipCode}`)
    const categoryIds = getCategoryIdsForRoute(route)
    console.log(`[DEBUG] Category IDs for route ${route}:`, categoryIds)
    if (categoryIds.length === 0) {
      console.log(`[DEBUG] No category IDs found for route: ${route}`)
      return []
    }
    const allBusinessIds = (await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)) as string[]
    console.log(`[DEBUG] Total businesses in system: ${allBusinessIds.length}`)
    const matchingBusinesses: Business[] = []
    const nonMatchingBusinesses: { id: string, reason: string }[] = []
    for (const businessId of allBusinessIds) {
      try {
        const selectedCategoryIds = (await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedCategoryIds`)) as string[] | null
        const selectedSubcategoryIds = (await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:selectedSubcategoryIds`)) as string[] | null
        console.log(`[DEBUG] Checking business ${businessId}:`, {
          selectedCategoryIds: selectedCategoryIds || 'none',
          selectedSubcategoryIds: selectedSubcategoryIds || 'none'
        })
        if (!selectedCategoryIds && !selectedSubcategoryIds) {
          nonMatchingBusinesses.push({ id: businessId, reason: 'No category or subcategory IDs' })
          continue
        }
        const allSelectedIds = [...(selectedCategoryIds || []), ...(selectedSubcategoryIds || [])]
        let matchDetails: { selectedId: string, targetId: string, matchType: string } | null = null
        const hasMatchingCategory = categoryIds.some((targetId) =>
          allSelectedIds.some((selectedId) => {
            if (selectedId === targetId) {
              matchDetails = { selectedId, targetId, matchType: 'exact' }
              return true
            }
            if (selectedId.toLowerCase() === targetId.toLowerCase()) {
              matchDetails = { selectedId, targetId, matchType: 'case-insensitive' }
              return true
            }
            if (selectedId.replace(/\s+/g, "").toLowerCase() === targetId.replace(/\s+/g, "").toLowerCase()) {
              matchDetails = { selectedId, targetId, matchType: 'space-removed' }
              return true
            }
            return false
          })
        )
        const business = (await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)) as Business | null
        if (hasMatchingCategory && business) {
          console.log(`[DEBUG] Matching business: ${business.businessName} (${businessId})`, {
            selectedCategoryIds: selectedCategoryIds || 'none',
            selectedSubcategoryIds: selectedSubcategoryIds || 'none',
            services: business.services || 'none',
            zipCode: business.zipCode || 'none',
            matchDetails
          })
          if (zipCode && business.zipCode !== zipCode) {
            console.log(`[DEBUG] Excluding business ${businessId} due to zipCode mismatch: ${business.zipCode} !== ${zipCode}`)
            nonMatchingBusinesses.push({ id: businessId, reason: `ZipCode mismatch: ${business.zipCode} !== ${zipCode}` })
            continue
          }
          matchingBusinesses.push({ ...business, id: businessId })
        } else {
          nonMatchingBusinesses.push({
            id: businessId,
            reason: !business ? 'No business data' : 'No matching category'
          })
        }
      } catch (error) {
        console.error(`[DEBUG] Error checking business ${businessId}:`, getErrorMessage(error))
        nonMatchingBusinesses.push({ id: businessId, reason: `Error: ${getErrorMessage(error)}` })
        continue
      }
    }
    console.log(`[DEBUG] Found ${matchingBusinesses.length} matching businesses for route ${route}`)
    console.log(`[DEBUG] Non-matching businesses:`, nonMatchingBusinesses.map(b => ({ id: b.id, reason: b.reason })))
    return matchingBusinesses
  } catch (error) {
    console.error(`[DEBUG] Error fetching businesses for route ${route}:`, getErrorMessage(error))
    return []
  }
}

// Function to get business ad design data
export async function getBusinessAdDesignData(businessId: string) {
  try {
    const adDesign = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`)
    if (!adDesign) return null
    let parsedDesign
    if (typeof adDesign === "string") {
      parsedDesign = JSON.parse(adDesign)
    } else {
      parsedDesign = adDesign
    }
    console.log(`[DEBUG] Ad design for business ${businessId}:`, parsedDesign)
    return parsedDesign
  } catch (error) {
    console.error(`[DEBUG] Error getting ad design for business ${businessId}:`, getErrorMessage(error))
    return null
  }
}
