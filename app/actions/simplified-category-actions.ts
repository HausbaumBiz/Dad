// app/actions/simplified-category-actions.ts
"use server"

import {
  getBusinessesForCategoryPage as getBusinessesForCategoryPageService,
  getBusinessesForCategoryPageByZipCode,
} from "@/lib/business-category-service"

export type Business = {
  id: string
  businessName: string
  city: string
  state: string
  zipCode: string
  phone: string
  website: string
  email: string
  description: string
  category: string
  subcategories: string[]
  createdAt: string
  updatedAt: string
  userId: string
  displayName?: string
  displayCity?: string
  displayState?: string
  displayPhone?: string
  displayLocation?: string
  adDesignData?: any
}

// Server action wrapper for the business category service
export async function getBusinessesForCategoryPage(pagePath: string, zipCode?: string) {
  console.log(
    `[MAIN] Getting businesses for page: ${pagePath}${zipCode ? ` filtered by zip code: ${zipCode}` : " (no zip code filter)"} at ${new Date().toISOString()}`,
  )

  try {
    if (zipCode) {
      console.log(`[MAIN] Using filtered function for zip code: ${zipCode}`)
      const businesses = await getBusinessesForCategoryPageByZipCode(pagePath, zipCode)
      console.log(`[MAIN] Filtered function returned ${businesses.length} businesses`)
      return businesses
    } else {
      console.log(`[MAIN] Using unfiltered function (no zip code provided)`)
      const businesses = await getBusinessesForCategoryPageService(pagePath)
      console.log(`[MAIN] Unfiltered function returned ${businesses.length} businesses`)
      return businesses
    }
  } catch (error) {
    console.error(`[MAIN] Error getting businesses for page ${pagePath}:`, error)
    return []
  }
}

// Export the individual functions for direct use if needed
export async function getBusinessesForCategoryPageUnfiltered(pagePath: string): Promise<Business[]> {
  console.log(`[UNFILTERED] Called for page: ${pagePath}`)
  return await getBusinessesForCategoryPageService(pagePath)
}

// Function to get businesses for a specific subcategory
export async function getBusinessesForSubcategory(subcategory: string, zipCode?: string): Promise<Business[]> {
  try {
    console.log(
      `Getting businesses for subcategory: ${subcategory}${zipCode ? ` filtered by zip code: ${zipCode}` : ""}`,
    )

    // This would need to be implemented based on your subcategory data structure
    // For now, return empty array as placeholder
    console.log(`Subcategory filtering not yet implemented for: ${subcategory}`)
    return []
  } catch (error) {
    console.error(`Error getting businesses for subcategory ${subcategory}:`, error)
    return []
  }
}
