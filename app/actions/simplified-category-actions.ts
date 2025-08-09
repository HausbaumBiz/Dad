"use server"

import { getBusinessesForCategoryPage as getFromService } from "@/lib/business-category-service"

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return JSON.stringify(error, Object.getOwnPropertyNames(error))
}

// Normalizes and forwards to the canonical service so all pages use one source of truth
export async function getBusinessesForCategoryPage(pagePath: string) {
  const normalized = pagePath.startsWith("/") ? pagePath : `/${pagePath}`
  try {
    console.log(`[${new Date().toISOString()}] Fetching businesses for ${normalized}`)

    const businesses = await getFromService(normalized)

    // Log the business names being returned
    console.log(`[${new Date().toISOString()}] Returning ${businesses.length} businesses:`)
    businesses.forEach((business) => {
      console.log(
        `  - ${business.id}: "${business.displayName}" (from ${business.adDesignData?.businessInfo?.businessName ? "ad-design" : "registration"})`,
      )
    })

    return businesses
  } catch (error) {
    console.error(`Error getting businesses for page ${normalized}:`, getErrorMessage(error))
    return []
  }
}

// Simple action to get businesses for a specific subcategory
export async function getBusinessesForSubcategory(subcategoryName: string) {
  try {
    console.log(`[${new Date().toISOString()}] Fetching businesses for subcategory: ${subcategoryName}`)

    const { getBusinessesForSubcategory: getBusinessesFromService } = await import("@/lib/business-category-service")

    try {
      const businesses = await getBusinessesFromService(subcategoryName)

      // Log the business names being returned
      console.log(`[${new Date().toISOString()}] Returning ${businesses.length} businesses for subcategory:`)
      businesses.forEach((business) => {
        console.log(
          `  - ${business.id}: "${business.displayName}" (from ${business.adDesignData?.businessInfo?.businessName ? "ad-design" : "registration"})`,
        )
      })

      return businesses
    } catch (serviceError) {
      console.error(
        `Service error getting businesses for subcategory ${subcategoryName}:`,
        getErrorMessage(serviceError),
      )
      return []
    }
  } catch (error) {
    console.error(`Error getting businesses for subcategory ${subcategoryName}:`, getErrorMessage(error))
    return []
  }
}
