"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

// Helper function to get the expected page route for a category
function getCategoryRoute(categoryName: string): string | null {
  if (!categoryName) return null

  // Map of category names to their page routes
  const categoryRouteMap: Record<string, string> = {
    "Insurance, Finance, Debt and Sales": "financial-services",
    "Financial Services": "financial-services",
    "Finance & Insurance": "financial-services",
    financeInsurance: "financial-services",
    "Automotive Services": "automotive-services",
    "Automotive/Motorcycle/RV": "automotive-services",
    automotive: "automotive-services",
    "Art, Design and Entertainment": "arts-entertainment",
    "Arts & Entertainment": "arts-entertainment",
    artDesignEntertainment: "arts-entertainment",
    "Home, Lawn, and Manual Labor": "home-improvement",
    homeLawnLabor: "home-improvement",
    "Real Estate": "real-estate",
    "Care Services": "care-services",
    "Pet Care": "pet-care",
    "Weddings & Events": "weddings-events",
    "Education & Tutoring": "education-tutoring",
    "Tailoring & Clothing": "tailoring-clothing",
    "Travel & Vacation": "travel-vacation",
    "Tech & IT Services": "tech-it-services",
    "Beauty & Wellness": "beauty-wellness",
    "Physical Rehabilitation": "physical-rehabilitation",
    "Medical Practitioners": "medical-practitioners",
    "Mental Health": "mental-health",
    "Food & Dining": "food-dining",
    "Fitness & Athletics": "fitness-athletics",
    "Child Care": "child-care",
    "Personal Assistants": "personal-assistants",
    "Legal Services": "legal-services",
    "Retail Stores": "retail-stores",
    "Funeral Services": "funeral-services",
    "Elder Care": "elder-care",
    "Music Lessons": "music-lessons",
  }

  // Check for direct match
  if (categoryName in categoryRouteMap) {
    return categoryRouteMap[categoryName]
  }

  // Check for partial matches (case insensitive)
  const lowerCategoryName = categoryName.toLowerCase()
  for (const [key, value] of Object.entries(categoryRouteMap)) {
    if (lowerCategoryName.includes(key.toLowerCase())) {
      return value
    }
  }

  // Special case for finance/insurance
  if (
    lowerCategoryName.includes("finance") ||
    lowerCategoryName.includes("insurance") ||
    lowerCategoryName.includes("financial") ||
    lowerCategoryName.includes("debt") ||
    lowerCategoryName.includes("investment")
  ) {
    return "financial-services"
  }

  // Special case for home improvement
  if (
    lowerCategoryName.includes("home") ||
    lowerCategoryName.includes("lawn") ||
    lowerCategoryName.includes("garden") ||
    lowerCategoryName.includes("construction") ||
    lowerCategoryName.includes("repair") ||
    lowerCategoryName.includes("maintenance")
  ) {
    return "home-improvement"
  }

  return null
}

export async function diagnoseBusinessPageMapping(businessId: string) {
  try {
    // Check if business exists
    const businessKey = `${KEY_PREFIXES.BUSINESS}${businessId}`
    const business = await kv.get(businessKey)

    if (!business) {
      return {
        success: false,
        message: `Business with ID ${businessId} not found`,
      }
    }

    // Get business categories
    const categoriesKey = `${KEY_PREFIXES.BUSINESS}${businessId}:categories`
    const categoriesData = await kv.get(categoriesKey)

    let categories: any[] = []
    if (categoriesData) {
      if (typeof categoriesData === "string") {
        try {
          categories = JSON.parse(categoriesData)
        } catch (error) {
          console.error(`Error parsing categories for business ${businessId}:`, error)
        }
      } else if (Array.isArray(categoriesData)) {
        categories = categoriesData
      }
    }

    // Get all categories
    const allCategoriesKey = `${KEY_PREFIXES.BUSINESS}${businessId}:allCategories`
    const allCategoriesData = await kv.get(allCategoriesKey)

    let allCategories: string[] = []
    if (allCategoriesData) {
      if (typeof allCategoriesData === "string") {
        try {
          allCategories = JSON.parse(allCategoriesData)
        } catch (error) {
          console.error(`Error parsing all categories for business ${businessId}:`, error)
        }
      } else if (Array.isArray(allCategoriesData)) {
        allCategories = allCategoriesData
      }
    }

    // Get business page mappings
    const pagesKey = `${KEY_PREFIXES.BUSINESS}${businessId}:pages`
    const pagesData = await kv.get(pagesKey)

    let businessPages: Record<string, boolean> = {}
    if (pagesData) {
      if (typeof pagesData === "string") {
        try {
          businessPages = JSON.parse(pagesData)
        } catch (error) {
          console.error(`Error parsing pages for business ${businessId}:`, error)
        }
      } else if (typeof pagesData === "object" && pagesData !== null) {
        businessPages = pagesData as Record<string, boolean>
      }
    }

    // Determine expected page based on primary category
    const primaryCategory = business.category
    const expectedPage = getCategoryRoute(primaryCategory)

    // Check if business is correctly mapped to the expected page
    const isCorrectlyMapped = expectedPage ? businessPages[expectedPage] === true : false

    // Check if business is in the page:businesses set
    let isInPageSet = false
    let pageBusinesses = 0
    if (expectedPage) {
      const pageBusinessesKey = `page:${expectedPage}:businesses`
      isInPageSet = await kv.sismember(pageBusinessesKey, businessId)
      pageBusinesses = await kv.scard(pageBusinessesKey)
    }

    // Identify issues
    const issues: string[] = []
    const recommendations: string[] = []

    if (!expectedPage) {
      issues.push(`Could not determine expected page for category "${primaryCategory}"`)
      recommendations.push("Map this category to a specific page route")
    }

    if (expectedPage && !isCorrectlyMapped) {
      issues.push(`Business is not mapped to the expected page "${expectedPage}" in its page mappings`)
      recommendations.push(`Add "${expectedPage}" to the business's page mappings`)
    }

    if (expectedPage && !isInPageSet) {
      issues.push(`Business is not in the page:${expectedPage}:businesses set`)
      recommendations.push(`Add business to the page:${expectedPage}:businesses set`)
    }

    if (Object.keys(businessPages).length === 0) {
      issues.push("Business has no page mappings")
      recommendations.push("Rebuild page mappings for this business")
    }

    if (allCategories.length === 0) {
      issues.push("Business has no categories in allCategories")
      recommendations.push("Update business categories")
    }

    // Return diagnostic information
    return {
      success: true,
      business,
      categories,
      allCategories,
      businessPages,
      expectedPage,
      isCorrectlyMapped,
      isInPageSet,
      pageBusinesses,
      issues,
      recommendations,
      redisKeys: {
        businessKey,
        categoriesKey,
        pagesKey,
        pageBusinessesKey: expectedPage ? `page:${expectedPage}:businesses` : null,
      },
    }
  } catch (error) {
    console.error("Error diagnosing business page mapping:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function fixBusinessPageMapping(businessId: string) {
  try {
    // Get business data
    const businessKey = `${KEY_PREFIXES.BUSINESS}${businessId}`
    const business = await kv.get(businessKey)

    if (!business) {
      return {
        success: false,
        message: `Business with ID ${businessId} not found`,
      }
    }

    const actions: string[] = []

    // Determine expected page based on primary category
    const primaryCategory = business.category
    const expectedPage = getCategoryRoute(primaryCategory)

    if (!expectedPage) {
      return {
        success: false,
        message: `Could not determine expected page for category "${primaryCategory}"`,
      }
    }

    // Update business page mappings
    const pagesKey = `${KEY_PREFIXES.BUSINESS}${businessId}:pages`
    const pagesData = await kv.get(pagesKey)

    let businessPages: Record<string, boolean> = {}
    if (pagesData) {
      if (typeof pagesData === "string") {
        try {
          businessPages = JSON.parse(pagesData)
        } catch (error) {
          console.error(`Error parsing pages for business ${businessId}:`, error)
        }
      } else if (typeof pagesData === "object" && pagesData !== null) {
        businessPages = pagesData as Record<string, boolean>
      }
    }

    // Add expected page to business page mappings
    businessPages[expectedPage] = true
    await kv.set(pagesKey, JSON.stringify(businessPages))
    actions.push(`Added "${expectedPage}" to business page mappings`)

    // Add business to page:businesses set
    const pageBusinessesKey = `page:${expectedPage}:businesses`
    const addResult = await kv.sadd(pageBusinessesKey, businessId)
    if (addResult === 1) {
      actions.push(`Added business to page:${expectedPage}:businesses set`)
    } else {
      actions.push(`Business was already in page:${expectedPage}:businesses set`)
    }

    // Special handling for financial-services
    if (expectedPage === "financial-services") {
      // Add to all possible financial services category keys
      const financeFormats = [
        "financeInsurance",
        "finance-insurance",
        "finance_insurance",
        "financial-services",
        "financial_services",
        "financialServices",
        "Insurance, Finance, Debt and Sales",
        "Financial Services",
        "Finance & Insurance",
      ]

      for (const format of financeFormats) {
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}`, businessId)
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${format}:businesses`, businessId)
        actions.push(`Added business to ${KEY_PREFIXES.CATEGORY}${format} category`)
      }
    }

    // Revalidate paths
    revalidatePath(`/${expectedPage}`)
    revalidatePath(`/${expectedPage}?timestamp=${Date.now()}`)
    actions.push(`Revalidated path /${expectedPage}`)

    return {
      success: true,
      message: "Successfully fixed business page mapping",
      actions,
    }
  } catch (error) {
    console.error("Error fixing business page mapping:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function searchBusinesses(searchTerm: string, categoryTerm: string) {
  try {
    // Get all business IDs
    const businessIds = await kv.keys(`${KEY_PREFIXES.BUSINESS}*`)

    // Filter out non-business keys (those with colons)
    const filteredBusinessIds = businessIds.filter((id) => !id.includes(":") && id.startsWith(KEY_PREFIXES.BUSINESS))

    // Limit to 100 businesses for performance
    const limitedBusinessIds = filteredBusinessIds.slice(0, 100)

    // Get business data for each ID
    const businesses = []
    for (const id of limitedBusinessIds) {
      const businessData = await kv.get(id)
      if (businessData) {
        // Extract just the ID part from the key
        const businessId = id.replace(KEY_PREFIXES.BUSINESS, "")
        businesses.push({
          id: businessId,
          ...businessData,
        })
      }
    }

    // Filter businesses based on search criteria
    let filteredBusinesses = businesses

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filteredBusinesses = filteredBusinesses.filter((business) => {
        const name = (business.businessName || business.name || "").toLowerCase()
        return name.includes(term)
      })
    }

    if (categoryTerm) {
      const term = categoryTerm.toLowerCase()
      filteredBusinesses = filteredBusinesses.filter((business) => {
        const category = (business.category || "").toLowerCase()
        const subcategory = (business.subcategory || "").toLowerCase()
        return category.includes(term) || subcategory.includes(term)
      })
    }

    return filteredBusinesses
  } catch (error) {
    console.error("Error searching businesses:", error)
    return []
  }
}

export async function batchDiagnoseBusinesses(progressCallback: (progress: number) => void) {
  try {
    // Get all business IDs
    const businessIds = await kv.keys(`${KEY_PREFIXES.BUSINESS}*`)

    // Filter out non-business keys (those with colons)
    const filteredBusinessIds = businessIds.filter((id) => !id.includes(":") && id.startsWith(KEY_PREFIXES.BUSINESS))

    // Limit to 100 businesses for performance
    const limitedBusinessIds = filteredBusinessIds.slice(0, 100)

    const results = []
    let processedCount = 0

    for (const id of limitedBusinessIds) {
      // Extract just the ID part from the key
      const businessId = id.replace(KEY_PREFIXES.BUSINESS, "")

      // Diagnose this business
      const diagnosis = await diagnoseBusinessPageMapping(businessId)

      if (diagnosis.success) {
        results.push({
          businessId,
          businessName: diagnosis.business?.businessName || diagnosis.business?.name || "Unnamed Business",
          category: diagnosis.business?.category || "No Category",
          expectedPage: diagnosis.expectedPage,
          hasIssues: diagnosis.issues && diagnosis.issues.length > 0,
          issues: diagnosis.issues || [],
        })
      }

      // Update progress
      processedCount++
      const progress = Math.floor((processedCount / limitedBusinessIds.length) * 100)
      progressCallback(progress)
    }

    return results
  } catch (error) {
    console.error("Error in batch diagnosis:", error)
    return []
  }
}

export async function batchFixBusinesses(businessIds: string[], progressCallback: (progress: number) => void) {
  try {
    let successCount = 0
    let failedCount = 0
    let processedCount = 0

    for (const id of businessIds) {
      try {
        const result = await fixBusinessPageMapping(id)
        if (result.success) {
          successCount++
        } else {
          failedCount++
        }
      } catch (error) {
        console.error(`Error fixing business ${id}:`, error)
        failedCount++
      }

      // Update progress
      processedCount++
      const progress = Math.floor((processedCount / businessIds.length) * 100)
      progressCallback(progress)
    }

    return {
      success: true,
      message: `Fixed ${successCount} out of ${businessIds.length} businesses`,
      successCount,
      failedCount,
    }
  } catch (error) {
    console.error("Error in batch fix:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
