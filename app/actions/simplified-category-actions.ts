"use server"

import { getBusinessesForCategoryPage as getBusinessesFromService } from "@/lib/business-category-service"

// Simple action to get businesses for a category page
export async function getBusinessesForCategoryPage(pagePath: string) {
  try {
    return await getBusinessesFromService(pagePath)
  } catch (error) {
    console.error(`Error getting businesses for page ${pagePath}:`, error)
    return []
  }
}
