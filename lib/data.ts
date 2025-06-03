import { getBusinessesForCategoryPage as getBusinessesFromActions } from "@/app/actions/simplified-category-actions"

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

// Re-export the function from simplified-category-actions
export async function getBusinessesForCategoryPage(pagePath: string, zipCode?: string): Promise<Business[]> {
  return await getBusinessesFromActions(pagePath, zipCode)
}

// Additional utility functions that might be needed
export async function getBusinessById(businessId: string): Promise<Business | null> {
  // This would typically fetch from your data source
  // For now, return null as a placeholder
  return null
}

export async function getBusinessesByCategory(category: string): Promise<Business[]> {
  // This would typically fetch businesses by category
  // For now, return empty array as a placeholder
  return []
}
