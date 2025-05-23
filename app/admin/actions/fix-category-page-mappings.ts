"use server"

import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

// This function maps category IDs to their actual routes in the application
export async function getCategoryRoute(categoryId: string): Promise<string> {
  // Custom mapping for known categories
  const categoryRouteMap: Record<string, string> = {
    // Main categories
    homeLawnLabor: "home-improvement",
    retailStores: "retail-stores",
    travelVacation: "travel-vacation",
    tailors: "tailoring-clothing",
    artDesignEntertainment: "arts-entertainment",
    physicalRehabilitation: "physical-rehabilitation",
    financeInsurance: "financial-services",
    weddingsEvents: "weddings-events",
    petCare: "pet-care",
    languageTutoring: "education-tutoring",
    realestate: "real-estate",
    athletics: "fitness-athletics",
    music: "music-lessons",
    homecare: "care-services",
    automotive: "automotive-services",
    beauty: "beauty-wellness",
    medical: "medical-practitioners",
    counseling: "mental-health",
    computers: "tech-it-services",
    restaurant: "food-dining",
    personalAssistant: "personal-assistants",
    mortuaryServices: "funeral-services",
    lawyers: "legal-services",

    // Home improvement subcategories
    lawn: "home-improvement/lawn-garden",
    outside: "home-improvement/outside-maintenance",
    outdoorStructures: "home-improvement/outdoor-structures",
    poolServices: "home-improvement/pool-services",
    asphaltConcrete: "home-improvement/asphalt-concrete",
    construction: "home-improvement/construction-design",
    insideHome: "home-improvement/inside-maintenance",
    windowsDoors: "home-improvement/windows-doors",
    floorCarpet: "home-improvement/flooring",
    audioVisualSecurity: "home-improvement/audio-visual-security",
    homeHazard: "home-improvement/hazard-mitigation",
    pestControl: "home-improvement/pest-control",
    trashCleanup: "home-improvement/trash-cleanup",
    homeCleaning: "home-improvement/cleaning",
    fireplacesChimneys: "home-improvement/fireplaces-chimneys",
    movers: "home-improvement/movers",
    handymen: "home-improvement/handymen",
  }

  // Additional mappings for category names (not IDs)
  const categoryNameMap: Record<string, string> = {
    Music: "music-lessons",
    "Music Lessons": "music-lessons",
    "Arts & Entertainment": "arts-entertainment",
    "Art, Design and Entertainment": "arts-entertainment",
    "Automotive Services": "automotive-services",
    "Automotive/Motorcycle/RV": "automotive-services",
    "Home Improvement": "home-improvement",
    "Home, Lawn, and Manual Labor": "home-improvement",
    "Retail Stores": "retail-stores",
    "Travel & Vacation": "travel-vacation",
    "Tailoring & Clothing": "tailoring-clothing",
    "Physical Rehabilitation": "physical-rehabilitation",
    "Financial Services": "financial-services",
    "Weddings & Events": "weddings-events",
    "Pet Care": "pet-care",
    "Education & Tutoring": "education-tutoring",
    "Real Estate": "real-estate",
    "Fitness & Athletics": "fitness-athletics",
    "Care Services": "care-services",
    "Beauty & Wellness": "beauty-wellness",
    "Medical Practitioners": "medical-practitioners",
    "Mental Health": "mental-health",
    "Tech & IT Services": "tech-it-services",
    "Food & Dining": "food-dining",
    "Personal Assistants": "personal-assistants",
    "Funeral Services": "funeral-services",
    "Mortuary Services": "funeral-services",
    "Legal Services": "legal-services",
  }

  // Return the custom mapping if it exists
  if (categoryId in categoryRouteMap) {
    return categoryRouteMap[categoryId]
  }

  // Check if it's a category name
  if (categoryId in categoryNameMap) {
    return categoryNameMap[categoryId]
  }

  // Fallback to the default conversion (camelCase to kebab-case)
  return categoryId.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

// Fix category to page mappings for all businesses
export async function fixCategoryPageMappings() {
  try {
    console.log("Starting category-to-page mapping fix...")

    // Get all business IDs
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    console.log(`Found ${businessIds.length} businesses to process`)

    let successCount = 0
    let errorCount = 0
    let noChangeCount = 0

    // Process each business
    for (const businessId of businessIds) {
      try {
        // Get business data
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

        if (!business) {
          console.log(`Business ${businessId} not found, skipping`)
          continue
        }

        // Get all categories for this business
        const allCategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:allCategories`)
        let allCategories: string[] = []

        if (allCategoriesData) {
          if (typeof allCategoriesData === "string") {
            try {
              allCategories = JSON.parse(allCategoriesData)
            } catch (error) {
              console.error(`Error parsing categories for business ${businessId}:`, error)
            }
          } else if (Array.isArray(allCategoriesData)) {
            allCategories = allCategoriesData
          }
        } else {
          // If allCategories is not available, try to use the primary category
          if (business.category) {
            allCategories = [business.category]
          }
        }

        // If no categories found, skip this business
        if (allCategories.length === 0) {
          console.log(`No categories found for business ${businessId}, skipping`)
          continue
        }

        console.log(`Processing business ${businessId} with categories: ${allCategories.join(", ")}`)

        // Map businesses to their frontend pages based on categories
        const pageMappings: Record<string, boolean> = {}
        let changesDetected = false

        // Process each category to determine which pages the business should appear on
        for (const category of allCategories) {
          // Map the category to a route
          const routePath = await getCategoryRoute(category)

          if (routePath) {
            pageMappings[routePath] = true

            // Check if the business is already in this page's set
            const isMember = await kv.sismember(`page:${routePath}:businesses`, businessId)

            if (!isMember) {
              // Add to page:businesses set for efficient lookup
              await kv.sadd(`page:${routePath}:businesses`, businessId)
              changesDetected = true
              console.log(`Added business ${businessId} to page:${routePath}:businesses`)
            }
          }
        }

        // Get subcategories if available
        const allSubcategoriesData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:allSubcategories`)
        let allSubcategories: string[] = []

        if (allSubcategoriesData) {
          if (typeof allSubcategoriesData === "string") {
            try {
              allSubcategories = JSON.parse(allSubcategoriesData)
            } catch (error) {
              console.error(`Error parsing subcategories for business ${businessId}:`, error)
            }
          } else if (Array.isArray(allSubcategoriesData)) {
            allSubcategories = allSubcategoriesData
          }
        } else {
          // If allSubcategories is not available, try to use the primary subcategory
          if (business.subcategory) {
            allSubcategories = [business.subcategory]
          }
        }

        // Process subcategories for home improvement
        if (
          allCategories.includes("Home Improvement") ||
          allCategories.includes("Home, Lawn, and Manual Labor") ||
          allCategories.some((cat) => cat.toLowerCase().includes("home") && cat.toLowerCase().includes("improvement"))
        ) {
          for (const subcategory of allSubcategories) {
            const subcategoryRoute = await getCategoryRoute(subcategory)

            if (subcategoryRoute && subcategoryRoute.startsWith("home-improvement/")) {
              pageMappings[subcategoryRoute] = true

              // Check if the business is already in this page's set
              const isMember = await kv.sismember(`page:${subcategoryRoute}:businesses`, businessId)

              if (!isMember) {
                // Add to page:businesses set for efficient lookup
                await kv.sadd(`page:${subcategoryRoute}:businesses`, businessId)
                changesDetected = true
                console.log(`Added business ${businessId} to page:${subcategoryRoute}:businesses`)
              }
            }
          }
        }

        // Store the page mappings with the business
        await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`, JSON.stringify(pageMappings))

        // Check for specific business ID
        if (businessId === "1744c078-461b-45bc-903e-e0999ac2aa87") {
          console.log(`Special business found: ${businessId}`)
          console.log(`Categories: ${allCategories.join(", ")}`)
          console.log(`Page mappings: ${JSON.stringify(pageMappings)}`)

          // Ensure it's added to music-lessons page
          if (allCategories.includes("Music") || allCategories.includes("Music Lessons")) {
            await kv.sadd(`page:music-lessons:businesses`, businessId)
            console.log(`Explicitly added business ${businessId} to page:music-lessons:businesses`)
            changesDetected = true
          }
        }

        if (changesDetected) {
          successCount++
        } else {
          noChangeCount++
        }
      } catch (error) {
        console.error(`Error processing business ${businessId}:`, error)
        errorCount++
      }
    }

    // Revalidate all category pages
    const pagesToRevalidate = [
      "arts-entertainment",
      "automotive-services",
      "beauty-wellness",
      "care-services",
      "education-tutoring",
      "financial-services",
      "fitness-athletics",
      "food-dining",
      "funeral-services",
      "home-improvement",
      "legal-services",
      "medical-practitioners",
      "mental-health",
      "music-lessons",
      "personal-assistants",
      "pet-care",
      "physical-rehabilitation",
      "real-estate",
      "retail-stores",
      "tailoring-clothing",
      "tech-it-services",
      "travel-vacation",
      "weddings-events",
    ]

    for (const page of pagesToRevalidate) {
      revalidatePath(`/${page}`)
    }

    // Also revalidate home improvement subcategory pages
    const homeImprovementSubpages = [
      "lawn-garden",
      "outside-maintenance",
      "outdoor-structures",
      "pool-services",
      "asphalt-concrete",
      "construction-design",
      "inside-maintenance",
      "windows-doors",
      "flooring",
      "audio-visual-security",
      "hazard-mitigation",
      "pest-control",
      "trash-cleanup",
      "cleaning",
      "fireplaces-chimneys",
      "movers",
      "handymen",
    ]

    for (const subpage of homeImprovementSubpages) {
      revalidatePath(`/home-improvement/${subpage}`)
    }

    return {
      success: true,
      processed: businessIds.length,
      updated: successCount,
      noChange: noChangeCount,
      errors: errorCount,
      message: `Processed ${businessIds.length} businesses: ${successCount} updated, ${noChangeCount} unchanged, ${errorCount} errors`,
    }
  } catch (error) {
    console.error("Error fixing category-to-page mappings:", error)
    return {
      success: false,
      message: `Error fixing category-to-page mappings: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
