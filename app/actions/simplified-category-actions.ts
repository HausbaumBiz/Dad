"use server"

import { getBusinessesForCategoryPage as getBusinessesFromService } from "@/lib/business-category-service"

// Simple action to get businesses for a category page
export async function getBusinessesForCategoryPage(pagePath: string) {
  try {
    console.log(`[${new Date().toISOString()}] Fetching businesses for ${pagePath}`)

    const businesses = await getBusinessesFromService(pagePath)

    // Log the business names being returned
    console.log(`[${new Date().toISOString()}] Returning ${businesses.length} businesses:`)
    businesses.forEach((business) => {
      console.log(
        `  - ${business.id}: "${business.displayName}" (from ${business.adDesignData?.businessInfo?.businessName ? "ad-design" : "registration"})`,
      )
    })

    return businesses
  } catch (error) {
    console.error(`Error getting businesses for page ${pagePath}:`, error)
    return []
  }
}
