"use client"

import { categories } from "@/lib/category-data"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Check, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

// This function extracts the route path from a category ID - Updated with special mappings
function getCategoryRoute(categoryId: string): string {
  // Handle special mappings that don't follow the standard pattern
  const specialMappings: Record<string, string> = {
    homeLawnLabor: "home-improvement",
    artDesignEntertainment: "arts-entertainment",
    physicalRehabilitation: "physical-rehabilitation",
    financeInsurance: "financial-services",
    weddingsEvents: "weddings-events",
    languageTutoring: "education-tutoring",
    realestate: "real-estate",
    homecare: "care-services",
    personalAssistant: "personal-assistants",
    mortuaryServices: "funeral-services",
    tailors: "tailoring-clothing",
    restaurant: "food-dining",
    computers: "tech-it-services",
    counseling: "mental-health",
    beauty: "beauty-wellness",
    athletics: "fitness-athletics",
    // Home improvement subcategories
    lawn: "lawn-garden",
    outside: "outside-maintenance",
    outdoorStructures: "outdoor-structures",
    poolServices: "pool-services",
    asphaltConcrete: "asphalt-concrete",
    construction: "construction-design",
    insideHome: "inside-maintenance",
    windowsDoors: "windows-doors",
    floorCarpet: "flooring",
    audioVisualSecurity: "audio-visual-security",
    homeHazard: "hazard-mitigation",
    pestControl: "pest-control",
    trashCleanup: "trash-cleanup",
    homeCleaning: "cleaning",
    fireplacesChimneys: "fireplaces-chimneys",
    movers: "movers",
    handymen: "handymen",
  }

  // Check for special mappings first
  if (specialMappings[categoryId]) {
    return specialMappings[categoryId]
  }

  // Convert camelCase to kebab-case for standard cases
  return categoryId.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

// This function finds the best matching route for a category
function findBestMatch(categoryId: string, categoryTitle: string, mainPageRoutes: string[]): string | null {
  // Handle exact category ID mappings first (highest priority)
  const exactMappings: Record<string, string> = {
    // Main categories
    beauty: "/beauty-wellness",
    athletics: "/fitness-athletics",
    homeLawnLabor: "/home-improvement",
    artDesignEntertainment: "/arts-entertainment",
    physicalRehabilitation: "/physical-rehabilitation",
    financeInsurance: "/financial-services",
    weddingsEvents: "/weddings-events",
    languageTutoring: "/education-tutoring",
    realestate: "/real-estate",
    homecare: "/care-services",
    personalAssistant: "/personal-assistants",
    mortuaryServices: "/funeral-services",
    tailors: "/tailoring-clothing",
    restaurant: "/food-dining",
    computers: "/tech-it-services",
    counseling: "/mental-health",
    automotive: "/automotive-services",
    medical: "/medical-practitioners",
    music: "/music-lessons",
    petCare: "/pet-care",
    retailStores: "/retail-stores",
    travelVacation: "/travel-vacation",
    lawyers: "/legal-services",
    childcare: "/child-care",
    eldercare: "/elder-care",

    // Home improvement subcategories
    lawn: "/home-improvement/lawn-garden",
    outside: "/home-improvement/outside-maintenance",
    outdoorStructures: "/home-improvement/outdoor-structures",
    poolServices: "/home-improvement/pool-services",
    asphaltConcrete: "/home-improvement/asphalt-concrete",
    construction: "/home-improvement/construction-design",
    insideHome: "/home-improvement/inside-maintenance",
    windowsDoors: "/home-improvement/windows-doors",
    floorCarpet: "/home-improvement/flooring",
    audioVisualSecurity: "/home-improvement/audio-visual-security",
    homeHazard: "/home-improvement/hazard-mitigation",
    pestControl: "/home-improvement/pest-control",
    trashCleanup: "/home-improvement/trash-cleanup",
    homeCleaning: "/home-improvement/cleaning",
    fireplacesChimneys: "/home-improvement/fireplaces-chimneys",
    movers: "/home-improvement/movers",
    handymen: "/home-improvement/handymen",
  }

  // Check exact mappings first
  if (exactMappings[categoryId]) {
    return exactMappings[categoryId]
  }

  const expectedRoute = `/${getCategoryRoute(categoryId)}`

  // Then check if exact route exists
  if (mainPageRoutes.includes(expectedRoute)) {
    return expectedRoute
  }

  // Look for partial matches in route names
  const categoryWords = getCategoryRoute(categoryId).split("-")
  const titleWords = categoryTitle.toLowerCase().split(" ")

  for (const route of mainPageRoutes) {
    const routeWords = route.substring(1).split("-") // Remove leading slash and split

    // Check if any category words match route words
    const hasWordMatch = categoryWords.some((word) =>
      routeWords.some((routeWord) => word.includes(routeWord) || routeWord.includes(word)),
    )

    // Check if any title words match route words
    const hasTitleMatch = titleWords.some((word) =>
      routeWords.some((routeWord) => word.includes(routeWord) || routeWord.includes(word)),
    )

    if (hasWordMatch || hasTitleMatch) {
      return route
    }
  }

  // Special case mappings based on category content (lowest priority)
  const specialCaseMappings: Record<string, string> = {
    // Other categories (only if not already mapped above)
    childcare: "/child-care",
    eldercare: "/elder-care",
    elder: "/elder-care",
    child: "/child-care",
    lessons: "/music-lessons",
    tutoring: "/education-tutoring",
    education: "/education-tutoring",
    cars: "/automotive-services",
    vehicle: "/automotive-services",
    wellness: "/beauty-wellness",
    health: "/medical-practitioners",
    mental: "/mental-health",
    therapy: "/mental-health",
    tech: "/tech-it-services",
    it: "/tech-it-services",
    computer: "/tech-it-services",
    food: "/food-dining",
    dining: "/food-dining",
    legal: "/legal-services",
    lawyer: "/legal-services",
    law: "/legal-services",
    funeral: "/funeral-services",
    mortuary: "/funeral-services",
    real: "/real-estate",
    estate: "/real-estate",
    property: "/real-estate",
    travel: "/travel-vacation",
    vacation: "/travel-vacation",
    wedding: "/weddings-events",
    event: "/weddings-events",
    pet: "/pet-care",
    animal: "/pet-care",
    retail: "/retail-stores",
    store: "/retail-stores",
    shop: "/retail-stores",
    personal: "/personal-assistants",
    assistant: "/personal-assistants",
    tailor: "/tailoring-clothing",
    clothing: "/tailoring-clothing",
    art: "/arts-entertainment",
    entertainment: "/arts-entertainment",
    design: "/arts-entertainment",
    improvement: "/home-improvement",
    financial: "/financial-services",
    finance: "/financial-services",
    insurance: "/financial-services",
    physical: "/physical-rehabilitation",
    rehabilitation: "/physical-rehabilitation",
    care: "/care-services",
  }

  // Check special case mappings (only if not already handled by exact mappings)
  const lowerCategoryId = categoryId.toLowerCase()
  const lowerTitle = categoryTitle.toLowerCase()

  for (const [key, route] of Object.entries(specialCaseMappings)) {
    if (lowerCategoryId.includes(key) || lowerTitle.includes(key)) {
      return route
    }
  }

  return null
}

// Add this function after the findBestMatch function:
function getAllCategoriesWithSubcategories() {
  const allCategories: Array<{
    id: string
    title: string
    parentId?: string
    parentTitle?: string
  }> = []

  categories.forEach((category) => {
    // Add main category
    allCategories.push({
      id: category.id,
      title: category.title,
    })

    // Add subcategories if they exist and are nested objects
    if (Array.isArray(category.subcategories)) {
      category.subcategories.forEach((sub: any) => {
        if (typeof sub === "object" && sub.id && sub.title) {
          allCategories.push({
            id: sub.id,
            title: sub.title,
            parentId: category.id,
            parentTitle: category.title,
          })
        }
      })
    }
  })

  return allCategories
}

export default function CategoryMappingsClientPage() {
  // Extract routes from the main page categories - Updated to match actual routes
  const mainPageRoutes = [
    "/home-improvement",
    "/home-improvement/lawn-garden",
    "/home-improvement/outside-maintenance",
    "/home-improvement/outdoor-structures",
    "/home-improvement/pool-services",
    "/home-improvement/asphalt-concrete",
    "/home-improvement/construction-design",
    "/home-improvement/inside-maintenance",
    "/home-improvement/windows-doors",
    "/home-improvement/flooring",
    "/home-improvement/audio-visual-security",
    "/home-improvement/hazard-mitigation",
    "/home-improvement/pest-control",
    "/home-improvement/trash-cleanup",
    "/home-improvement/cleaning",
    "/home-improvement/fireplaces-chimneys",
    "/home-improvement/movers",
    "/home-improvement/handymen",
    "/automotive-services",
    "/care-services",
    "/pet-care",
    "/weddings-events",
    "/fitness-athletics",
    "/education-tutoring",
    "/music-lessons",
    "/real-estate",
    "/food-dining",
    "/retail-stores",
    "/legal-services",
    "/funeral-services",
    "/personal-assistants",
    "/travel-vacation",
    "/tailoring-clothing",
    "/arts-entertainment",
    "/tech-it-services",
    "/beauty-wellness",
    "/physical-rehabilitation",
    "/medical-practitioners",
    "/mental-health",
    "/financial-services",
    "/child-care",
    "/elder-care",
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Category Mappings</h1>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">About Category Mappings</h2>
        <p className="text-gray-600 mb-4">
          This page shows the mapping between business categories from the business-focus page and the linked category
          pages from the main page. The system automatically finds the best matching route for each category.
        </p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center">
            <Badge className="bg-green-500 mr-2">
              <Check size={14} />
            </Badge>
            <span className="text-sm">Mapped correctly</span>
          </div>
          <div className="flex items-center">
            <Badge className="bg-blue-500 mr-2">
              <ArrowRight size={14} />
            </Badge>
            <span className="text-sm">Alternative match found</span>
          </div>
          <div className="flex items-center">
            <Badge className="bg-red-500 mr-2">
              <AlertCircle size={14} />
            </Badge>
            <span className="text-sm">No match found</span>
          </div>
        </div>
      </Card>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 font-semibold">
          <div className="col-span-3">Category ID</div>
          <div className="col-span-3">Category Title</div>
          <div className="col-span-3">Matched Route</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Actions</div>
        </div>

        <div className="divide-y">
          {getAllCategoriesWithSubcategories().map((category) => {
            const expectedRoute = category.parentId
              ? `/home-improvement/${getCategoryRoute(category.id)}`
              : `/${getCategoryRoute(category.id)}`
            const bestMatch = findBestMatch(category.id, category.title, mainPageRoutes)
            const isExactMatch = bestMatch === expectedRoute
            const hasMatch = bestMatch !== null

            return (
              <div
                key={`${category.parentId || "main"}-${category.id}`}
                className="grid grid-cols-12 gap-4 p-4 items-center"
              >
                <div className="col-span-3 font-mono text-sm">
                  {category.parentId && category.parentId !== "homeLawnLabor" && (
                    <span className="text-gray-400 text-xs block">{category.parentId}/</span>
                  )}
                  {category.id}
                </div>
                <div className="col-span-3">
                  {category.parentTitle && (
                    <span className="text-gray-500 text-sm block">{category.parentTitle} → </span>
                  )}
                  {category.title}
                </div>
                <div className="col-span-3 font-mono text-sm">
                  {bestMatch || expectedRoute}
                  {bestMatch && !isExactMatch && (
                    <div className="text-xs text-gray-500 mt-1">Expected: {expectedRoute}</div>
                  )}
                </div>
                <div className="col-span-2">
                  {hasMatch ? (
                    isExactMatch ? (
                      <Badge className="bg-green-500">
                        <Check size={14} className="mr-1" /> Exact Match
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500">
                        <ArrowRight size={14} className="mr-1" /> Alt Match
                      </Badge>
                    )
                  ) : (
                    <Badge className="bg-red-500">
                      <AlertCircle size={14} className="mr-1" /> No Match
                    </Badge>
                  )}
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    title="Copy route"
                    onClick={() => navigator.clipboard.writeText(bestMatch || expectedRoute)}
                  >
                    <Copy size={16} />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Available Routes ({mainPageRoutes.length})</h2>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainPageRoutes.map((route) => (
              <div key={route} className="flex items-center">
                <span className="font-mono text-sm">{route}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
