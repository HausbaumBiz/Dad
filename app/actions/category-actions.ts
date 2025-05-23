"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { getCurrentBusiness } from "./business-actions"
import type { CategorySelection } from "@/components/category-selector"
import { saveBusinessCategories as saveBusinessCategoriesToDb, KEY_PREFIXES, type CategoryData } from "@/lib/db-schema"

// Enhanced category to page mapping function
function getCategoryPageMapping(): Record<string, string> {
  return {
    // Main categories
    "Home, Lawn, and Manual Labor": "home-improvement",
    "Retail Stores": "retail-stores",
    "Travel and Vacation": "travel-vacation",
    "Tailors, Dressmakers, and Fabric and Clothes Cleaning and Repair": "tailoring-clothing",
    "Art, Design and Entertainment": "arts-entertainment",
    "Physical Rehabilitation": "physical-rehabilitation",
    "Insurance, Finance, Debt and Sales": "financial-services",
    "Weddings and Special Events": "weddings-events",
    "Pet Care": "pet-care",
    "Language Lessons/School Subject Tutoring": "education-tutoring",
    "Home Buying and Selling": "real-estate",
    "Athletics, Personal Trainers, Group Fitness Classes and Dance Instruction": "fitness-athletics",
    Music: "music-lessons",
    "Home Care": "care-services",
    "Automotive/Motorcycle/RV, etc": "automotive-services",
    "Hair care, Beauty, Tattoo and Piercing": "beauty-wellness",
    "Medical Practitioners - non MD/DO": "medical-practitioners",
    "Counselors, Psychologists, Addiction Specialists, Team Building": "mental-health",
    "Computers and the Web": "tech-it-services",
    "Restaurant, Food and Drink": "food-dining",
    Assistants: "personal-assistants",
    "Mortuary Services": "funeral-services",
    Lawyers: "legal-services",

    // Home improvement subcategories
    "Lawn, Garden and Snow Removal": "home-improvement/lawn-garden",
    "Outside Home Maintenance and Repair": "home-improvement/outside-maintenance",
    "Outdoor Structure Assembly/Construction and Fencing": "home-improvement/outdoor-structures",
    "Pool Services": "home-improvement/pool-services",
    "Asphalt, Concrete, Stone and Gravel": "home-improvement/asphalt-concrete",
    "Home Construction and Design": "home-improvement/construction-design",
    "Inside Home Maintenance and Repair": "home-improvement/inside-maintenance",
    "Windows and Doors": "home-improvement/windows-doors",
    "Floor/Carpet Care and Installation": "home-improvement/flooring",
    "Audio/Visual and Home Security": "home-improvement/audio-visual-security",
    "Home Hazard Mitigation": "home-improvement/hazard-mitigation",
    "Pest Control/ Wildlife Removal": "home-improvement/pest-control",
    "Trash Cleanup and Removal": "home-improvement/trash-cleanup",
    "Home and Office Cleaning": "home-improvement/cleaning",
    "Fireplaces and Chimneys": "home-improvement/fireplaces-chimneys",
    "Movers/Moving Trucks": "home-improvement/movers",
    Handymen: "home-improvement/handymen",

    // Care services subcategories
    "Non-Medical Elder Care": "elder-care",
    "Non-Medical Special Needs Adult Care": "care-services",
    "Babysitting (18+ Sitters only)": "child-care",
    "Childcare Centers": "child-care",
    "Adult Day Services": "elder-care",
    "Rehab/Nursing/Respite and Memory Care": "elder-care",
  }
}

// Function to get all pages a business should be mapped to based on their categories
function getBusinessPageMappings(categories: CategorySelection[]): string[] {
  const categoryPageMapping = getCategoryPageMapping()
  const pages = new Set<string>()

  for (const category of categories) {
    // Check if the full category name maps to a page
    if (categoryPageMapping[category.category]) {
      pages.add(categoryPageMapping[category.category])
    }

    // Check if the subcategory maps to a specific page
    if (categoryPageMapping[category.subcategory]) {
      pages.add(categoryPageMapping[category.subcategory])
    }

    // For home improvement, also add the main page
    if (category.category === "Home, Lawn, and Manual Labor") {
      pages.add("home-improvement")
    }

    // For care services, also add the main page
    if (category.category === "Home Care") {
      pages.add("care-services")
    }
  }

  return Array.from(pages)
}

// Function to completely remove a business from all page mappings
async function removeBusinessFromAllPages(businessId: string): Promise<string[]> {
  const removedPages: string[] = []

  try {
    // Get current page mappings for this business
    const currentPageMappings = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`)
    let currentPages: string[] = []

    if (currentPageMappings) {
      if (typeof currentPageMappings === "string") {
        try {
          const parsed = JSON.parse(currentPageMappings)
          currentPages = Object.keys(parsed)
        } catch (error) {
          console.error(`Error parsing current page mappings for business ${businessId}:`, error)
        }
      } else if (typeof currentPageMappings === "object" && currentPageMappings !== null) {
        currentPages = Object.keys(currentPageMappings as Record<string, boolean>)
      }
    }

    // Also check all possible page keys to ensure complete cleanup
    const allPossiblePages = [
      "home-improvement",
      "retail-stores",
      "travel-vacation",
      "tailoring-clothing",
      "arts-entertainment",
      "physical-rehabilitation",
      "financial-services",
      "weddings-events",
      "pet-care",
      "education-tutoring",
      "real-estate",
      "fitness-athletics",
      "music-lessons",
      "care-services",
      "automotive-services",
      "beauty-wellness",
      "medical-practitioners",
      "mental-health",
      "tech-it-services",
      "food-dining",
      "personal-assistants",
      "funeral-services",
      "legal-services",
      "elder-care",
      "child-care",
      // Home improvement subcategories
      "home-improvement/lawn-garden",
      "home-improvement/outside-maintenance",
      "home-improvement/outdoor-structures",
      "home-improvement/pool-services",
      "home-improvement/asphalt-concrete",
      "home-improvement/construction-design",
      "home-improvement/inside-maintenance",
      "home-improvement/windows-doors",
      "home-improvement/flooring",
      "home-improvement/audio-visual-security",
      "home-improvement/hazard-mitigation",
      "home-improvement/pest-control",
      "home-improvement/trash-cleanup",
      "home-improvement/cleaning",
      "home-improvement/fireplaces-chimneys",
      "home-improvement/movers",
      "home-improvement/handymen",
    ]

    // Combine current pages with all possible pages to ensure complete cleanup
    const pagesToCheck = [...new Set([...currentPages, ...allPossiblePages])]

    // Remove business from all page sets
    for (const page of pagesToCheck) {
      try {
        // Check if business is actually in this page set before removing
        const isMember = await kv.sismember(`page:${page}:businesses`, businessId)

        if (isMember === 1) {
          const removed = await kv.srem(`page:${page}:businesses`, businessId)
          if (removed > 0) {
            removedPages.push(page)
            console.log(`Removed business ${businessId} from page:${page}:businesses`)
          }
        }
      } catch (error) {
        console.error(`Error removing business ${businessId} from page:${page}:businesses:`, error)
      }
    }

    // Clear the business's page mappings
    await kv.del(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`)

    console.log(`Removed business ${businessId} from ${removedPages.length} pages: ${removedPages.join(", ")}`)
  } catch (error) {
    console.error(`Error removing business ${businessId} from all pages:`, error)
  }

  return removedPages
}

// Function to add a business to specific pages
async function addBusinessToPages(businessId: string, pages: string[]): Promise<string[]> {
  const addedPages: string[] = []

  try {
    // Create page mappings object
    const pageMappings: Record<string, boolean> = {}

    for (const page of pages) {
      try {
        // Add business to the page set
        const added = await kv.sadd(`page:${page}:businesses`, businessId)

        // Verify the business was actually added
        const isMember = await kv.sismember(`page:${page}:businesses`, businessId)

        if (isMember === 1) {
          addedPages.push(page)
          pageMappings[page] = true
          console.log(`Added business ${businessId} to page:${page}:businesses`)
        } else {
          console.error(`Failed to add business ${businessId} to page:${page}:businesses`)
        }
      } catch (error) {
        console.error(`Error adding business ${businessId} to page:${page}:businesses:`, error)
      }
    }

    // Save the page mappings to the business
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`, JSON.stringify(pageMappings))

    console.log(`Added business ${businessId} to ${addedPages.length} pages: ${addedPages.join(", ")}`)
  } catch (error) {
    console.error(`Error adding business ${businessId} to pages:`, error)
  }

  return addedPages
}

// Save business categories with complete page mapping cleanup and reassignment
export async function saveBusinessCategories(categories: CategorySelection[]) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    console.log(`Saving ${categories.length} categories for business ${business.id}`)

    // Step 1: Completely remove business from all existing page mappings
    console.log("Step 1: Removing business from all existing page mappings...")
    const removedPages = await removeBusinessFromAllPages(business.id)

    // Step 2: Determine which pages the business should be on based on new categories
    console.log("Step 2: Determining new page mappings...")
    const newPages = getBusinessPageMappings(categories)
    console.log(`Business should be mapped to pages: ${newPages.join(", ")}`)

    // Step 3: Add business to the new pages
    console.log("Step 3: Adding business to new page mappings...")
    const addedPages = await addBusinessToPages(business.id, newPages)

    // Step 4: Update business data with categories
    console.log("Step 4: Updating business data...")

    // Extract all unique categories and subcategories
    const allCategories = [...new Set(categories.map((cat) => cat.category))]
    const allSubcategories = [...new Set(categories.map((cat) => cat.subcategory))]

    // Save all categories and subcategories as separate lists
    await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:allCategories`, JSON.stringify(allCategories))
    await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:allSubcategories`, JSON.stringify(allSubcategories))

    // Convert CategorySelection to CategoryData
    const categoryData: CategoryData[] = categories.map((cat) => ({
      id: cat.category.toLowerCase().replace(/\s+/g, "-"),
      name: cat.category,
      parentId: cat.category.toLowerCase().replace(/\s+/g, "-"),
      path: cat.fullPath,
    }))

    // Save using the new schema
    const success = await saveBusinessCategoriesToDb(business.id, categoryData)

    if (success) {
      // Save categories in multiple formats for backward compatibility
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}:categories`, JSON.stringify(categories))

      // Save categories with subcategories
      const categoriesWithSubcategories = categories.map((cat) => ({
        category: cat.category,
        subcategory: cat.subcategory,
      }))
      await kv.set(
        `${KEY_PREFIXES.BUSINESS}${business.id}:categoriesWithSubcategories`,
        JSON.stringify(categoriesWithSubcategories),
      )

      // Update the business object
      const updatedBusiness = {
        ...business,
        category: categories.length > 0 ? categories[0].category : "",
        subcategory: categories.length > 0 ? categories[0].subcategory : "",
        allCategories,
        allSubcategories,
        categoriesCount: categories.length,
        updatedAt: new Date().toISOString(),
      }

      // Save the updated business
      await kv.set(`${KEY_PREFIXES.BUSINESS}${business.id}`, updatedBusiness)

      // Step 5: Update category indexes
      console.log("Step 5: Updating category indexes...")
      for (const category of allCategories) {
        const categoryKey = category.toLowerCase().replace(/\s+/g, "-")
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${categoryKey}:businesses`, business.id)
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${categoryKey}`, business.id)

        // Also add with original category name
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${category}`, business.id)
        await kv.sadd(`${KEY_PREFIXES.CATEGORY}${category}:businesses`, business.id)
      }

      // Step 6: Verify page mappings
      console.log("Step 6: Verifying page mappings...")
      const verificationResults: Record<string, boolean> = {}

      for (const page of addedPages) {
        const isMember = await kv.sismember(`page:${page}:businesses`, business.id)
        verificationResults[page] = isMember === 1

        if (isMember !== 1) {
          console.error(`Verification failed: Business ${business.id} is not in page:${page}:businesses`)
          // Try to add again
          await kv.sadd(`page:${page}:businesses`, business.id)
        }
      }

      // Step 7: Revalidate all affected paths
      console.log("Step 7: Revalidating paths...")
      const allAffectedPages = [...new Set([...removedPages, ...addedPages])]

      // Revalidate core paths
      revalidatePath("/business-focus")
      revalidatePath("/statistics")
      revalidatePath("/workbench")
      revalidatePath("/admin/businesses")
      revalidatePath(`/admin/businesses/${business.id}`)

      // Revalidate all affected category pages with cache busting
      for (const page of allAffectedPages) {
        console.log(`Revalidating path: /${page}`)
        revalidatePath(`/${page}`)
        revalidatePath(`/${page}?t=${Date.now()}`) // Cache busting
      }

      console.log(
        `Successfully saved categories for business ${business.id}. Removed from ${removedPages.length} pages, added to ${addedPages.length} pages.`,
      )

      return {
        success: true,
        message: `Saved ${categories.length} categories. Business moved from ${removedPages.length} pages to ${addedPages.length} pages.`,
        details: {
          removedPages,
          addedPages,
          categoriesCount: categories.length,
          verificationResults,
        },
      }
    } else {
      throw new Error("Failed to save categories to database")
    }
  } catch (error) {
    console.error("Error saving business categories:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save categories",
    }
  }
}

// Get business categories
export async function getBusinessCategories() {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Try to get categories as JSON string
    const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${business.id}:categories`)

    if (!categoriesData) {
      return { success: true, data: [] }
    }

    // Parse the categories data
    let categories: CategorySelection[]

    if (typeof categoriesData === "string") {
      try {
        categories = JSON.parse(categoriesData)
      } catch (error) {
        console.error("Error parsing categories:", error)
        return { success: false, message: "Invalid category data format" }
      }
    } else if (Array.isArray(categoriesData)) {
      categories = categoriesData as CategorySelection[]
    } else {
      console.error("Unexpected data format:", typeof categoriesData)
      return { success: false, message: "Unexpected data format" }
    }

    return { success: true, data: categories }
  } catch (error) {
    console.error("Error getting business categories:", error)
    return { success: false, message: "Failed to get categories" }
  }
}

// Get all categories and subcategories for a business
export async function getBusinessAllCategoriesAndSubcategories() {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Get all categories
    const allCategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${business.id}:allCategories`)
    const allSubcategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${business.id}:allSubcategories`)

    let allCategories: string[] = []
    let allSubcategories: string[] = []

    if (allCategoriesData) {
      if (typeof allCategoriesData === "string") {
        try {
          allCategories = JSON.parse(allCategoriesData)
        } catch (error) {
          console.error("Error parsing all categories:", error)
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
          console.error("Error parsing all subcategories:", error)
        }
      } else if (Array.isArray(allSubcategoriesData)) {
        allSubcategories = allSubcategoriesData
      }
    }

    return {
      success: true,
      data: {
        categories: allCategories,
        subcategories: allSubcategories,
      },
    }
  } catch (error) {
    console.error("Error getting all categories and subcategories:", error)
    return { success: false, message: "Failed to get categories and subcategories" }
  }
}

// Remove a business category
export async function removeBusinessCategory(fullPath: string) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Get current categories
    const result = await getBusinessCategories()

    if (!result.success || !result.data) {
      return { success: false, message: "Failed to get current categories" }
    }

    // Filter out the category to remove
    const updatedCategories = result.data.filter((cat) => cat.fullPath !== fullPath)

    // Save the updated categories (this will trigger the complete remapping)
    const saveResult = await saveBusinessCategories(updatedCategories)

    if (!saveResult.success) {
      return { success: false, message: saveResult.message }
    }

    return { success: true, message: "Category removed and page mappings updated successfully" }
  } catch (error) {
    console.error("Error removing business category:", error)
    return { success: false, message: "Failed to remove category" }
  }
}

// Suggest a new category
export async function suggestCategory(formData: FormData) {
  try {
    const business = await getCurrentBusiness()
    const businessId = business?.id || "anonymous"

    const category = formData.get("category") as string
    const subcategory = formData.get("subcategory") as string
    const reason = formData.get("reason") as string

    if (!category || !subcategory) {
      return { success: false, message: "Category and subcategory are required" }
    }

    // Create a unique ID for the suggestion
    const suggestionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Store the suggestion
    await kv.hset(`category:suggestions:${suggestionId}`, {
      category,
      subcategory,
      reason,
      businessId,
      createdAt: new Date().toISOString(),
      status: "pending",
    })

    // Add to the set of all suggestions
    await kv.sadd("category:suggestions", suggestionId)

    return { success: true, message: "Thank you for your suggestion! We'll review it soon." }
  } catch (error) {
    console.error("Error suggesting category:", error)
    return { success: false, message: "Failed to submit suggestion" }
  }
}

// Force rebuild page mappings for all businesses using the new system
export async function rebuildPageMappings() {
  try {
    console.log("Starting complete page mappings rebuild...")

    // Get all business IDs
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    console.log(`Found ${businessIds.length} businesses to process`)

    let processed = 0
    let errors = 0
    let successfullyMapped = 0

    for (const businessId of businessIds) {
      try {
        // Get business categories
        const categoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)

        if (!categoriesData) {
          console.log(`No categories found for business ${businessId}`)
          continue
        }

        let categories: CategorySelection[] = []

        if (typeof categoriesData === "string") {
          try {
            categories = JSON.parse(categoriesData)
          } catch (error) {
            console.error(`Error parsing categories for business ${businessId}:`, error)
            continue
          }
        } else if (Array.isArray(categoriesData)) {
          categories = categoriesData
        }

        if (categories.length === 0) {
          console.log(`No valid categories for business ${businessId}`)
          continue
        }

        // Remove from all existing pages
        await removeBusinessFromAllPages(businessId)

        // Determine new page mappings
        const newPages = getBusinessPageMappings(categories)

        // Add to new pages
        const addedPages = await addBusinessToPages(businessId, newPages)

        if (addedPages.length > 0) {
          successfullyMapped++
        }

        processed++
        console.log(`Processed business ${businessId} (${processed}/${businessIds.length})`)
      } catch (error) {
        console.error(`Error processing business ${businessId}:`, error)
        errors++
      }
    }

    console.log(
      `Page mappings rebuild complete. Processed: ${processed}, Successfully mapped: ${successfullyMapped}, Errors: ${errors}`,
    )

    // Revalidate all category pages
    const allPages = [
      "home-improvement",
      "retail-stores",
      "travel-vacation",
      "tailoring-clothing",
      "arts-entertainment",
      "physical-rehabilitation",
      "financial-services",
      "weddings-events",
      "pet-care",
      "education-tutoring",
      "real-estate",
      "fitness-athletics",
      "music-lessons",
      "care-services",
      "automotive-services",
      "beauty-wellness",
      "medical-practitioners",
      "mental-health",
      "tech-it-services",
      "food-dining",
      "personal-assistants",
      "funeral-services",
      "legal-services",
      "elder-care",
      "child-care",
      // Home improvement subcategories
      "home-improvement/lawn-garden",
      "home-improvement/outside-maintenance",
      "home-improvement/outdoor-structures",
      "home-improvement/pool-services",
      "home-improvement/asphalt-concrete",
      "home-improvement/construction-design",
      "home-improvement/inside-maintenance",
      "home-improvement/windows-doors",
      "home-improvement/flooring",
      "home-improvement/audio-visual-security",
      "home-improvement/hazard-mitigation",
      "home-improvement/pest-control",
      "home-improvement/trash-cleanup",
      "home-improvement/cleaning",
      "home-improvement/fireplaces-chimneys",
      "home-improvement/movers",
      "home-improvement/handymen",
    ]

    for (const page of allPages) {
      revalidatePath(`/${page}`)
      revalidatePath(`/${page}?t=${Date.now()}`) // Cache busting
    }

    return {
      success: true,
      message: `Rebuilt page mappings for ${processed} businesses (${successfullyMapped} successfully mapped) with ${errors} errors`,
      processed,
      successfullyMapped,
      errors,
    }
  } catch (error) {
    console.error("Error rebuilding page mappings:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
