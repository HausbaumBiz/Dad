// Mapping from routes to category IDs from business-focus page
export const routeToCategoryMapping: Record<string, string[]> = {
  // Main category mappings
  "/legal-services": ["lawyers"],
  "/automotive-services": ["automotive"],
  "/beauty-wellness": ["beauty"],
  "/fitness-athletics": ["athletics"],
  "/home-improvement": ["homeLawnLabor"],
  "/arts-entertainment": ["artDesignEntertainment"],
  "/physical-rehabilitation": ["physicalRehabilitation"],
  "/financial-services": ["financeInsurance"],
  "/weddings-events": ["weddingsEvents"],
  "/education-tutoring": ["languageTutoring"],
  "/real-estate": ["realestate"],
  "/care-services": ["homecare"],
  "/personal-assistants": ["personalAssistant"],
  "/funeral-services": ["mortuaryServices"],
  "/tailoring-clothing": ["tailors"],
  "/food-dining": ["restaurant"],
  "/tech-it-services": ["computers"],
  "/mental-health": ["counseling"],
  "/medical-practitioners": ["medical"],
  "/music-lessons": ["music"],
  "/pet-care": ["petCare"],
  "/retail-stores": ["retailStores"],
  "/travel-vacation": ["travelVacation"],
  "/child-care": ["childcare"],
  "/elder-care": ["eldercare"],

  // Home improvement subcategory mappings
  "/home-improvement/lawn-garden": ["lawn"],
  "/home-improvement/outside-maintenance": ["outside"],
  "/home-improvement/outdoor-structures": ["outdoorStructures"],
  "/home-improvement/pool-services": ["poolServices"],
  "/home-improvement/asphalt-concrete": ["asphaltConcrete"],
  "/home-improvement/construction-design": ["construction"],
  "/home-improvement/inside-maintenance": ["insideHome"],
  "/home-improvement/windows-doors": ["windowsDoors"],
  "/home-improvement/flooring": ["floorCarpet"],
  "/home-improvement/audio-visual-security": ["audioVisualSecurity"],
  "/home-improvement/hazard-mitigation": ["homeHazard"],
  "/home-improvement/pest-control": ["pestControl"],
  "/home-improvement/trash-cleanup": ["trashCleanup"],
  "/home-improvement/cleaning": ["homeCleaning"],
  "/home-improvement/fireplaces-chimneys": ["fireplacesChimneys"],
  "/home-improvement/movers": ["movers"],
  "/home-improvement/handymen": ["handymen"],
}

// Function to get category IDs for a given route
export function getCategoryIdsForRoute(route: string): string[] {
  return routeToCategoryMapping[route] || []
}

// Function to get all possible category ID variants for better matching
export function getAllCategoryVariants(categoryIds: string[]): string[] {
  const variants: string[] = []

  categoryIds.forEach((id) => {
    variants.push(id)
    // Add common variations
    variants.push(id.toLowerCase())
    variants.push(id.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase())
    variants.push(id.replace(/([a-z])([A-Z])/g, "$1 $2"))
  })

  return [...new Set(variants)] // Remove duplicates
}
