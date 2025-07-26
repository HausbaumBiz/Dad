// Category mapping from page paths to category names
// This maps URL paths to the exact category names used in the category data

const categoryMappings: Record<string, string> = {
  // Home Improvement categories
  "/home-improvement": "Home, Lawn, and Manual Labor",
  "/home-improvement/lawn-garden": "Lawn, Garden and Snow Removal",
  "/home-improvement/outside-maintenance": "Outside Home Maintenance and Repair",
  "/home-improvement/outdoor-structures": "Outdoor Structure Assembly/Construction and Fencing",
  "/home-improvement/pool-services": "Pool Services",
  "/home-improvement/asphalt-concrete": "Asphalt, Concrete, Stone and Gravel",
  "/home-improvement/construction-design": "Home Construction and Design",
  "/home-improvement/inside-maintenance": "Inside Home Maintenance and Repair",
  "/home-improvement/windows-doors": "Windows and Doors",
  "/home-improvement/flooring": "Floor/Carpet Care and Installation",
  "/home-improvement/audio-visual-security": "Audio/Visual and Home Security",
  "/home-improvement/hazard-mitigation": "Home Hazard Mitigation",
  "/home-improvement/pest-control": "Pest Control/ Wildlife Removal",
  "/home-improvement/trash-cleanup": "Trash Cleanup and Removal",
  "/home-improvement/cleaning": "Home and Office Cleaning",
  "/home-improvement/fireplaces-chimneys": "Fireplaces and Chimneys",
  "/home-improvement/movers": "Movers/Moving Trucks",
  "/home-improvement/handymen": "Handymen",

  // Retail Stores
  "/retail-stores": "Retail Stores",

  // Travel and Vacation
  "/travel-vacation": "Travel and Vacation",

  // Tailoring and Clothing
  "/tailoring-clothing": "Tailors, Dressmakers, and Fabric and Clothes Cleaning and Repair",

  // Art, Design and Entertainment
  "/arts-entertainment": "Art, Design and Entertainment",

  // Physical Rehabilitation
  "/physical-rehabilitation": "Physical Rehabilitation",

  // Finance and Insurance
  "/financial-services": "Insurance, Finance, Debt and Sales",

  // Weddings and Events
  "/weddings-events": "Weddings and Special Events",

  // Pet Care
  "/pet-care": "Pet Care",

  // Language and Tutoring
  "/education-tutoring": "Language Lessons/School Subject Tutoring",

  // Real Estate
  "/real-estate": "Home Buying and Selling",

  // Athletics and Fitness
  "/fitness-athletics": "Athletics, Personal Trainers, Group Fitness Classes and Dance Instruction",

  // Music
  "/music-lessons": "Music",

  // Home Care
  "/care-services": "Home Care",

  // Automotive
  "/automotive-services": "Automotive/Motorcycle/RV, etc",

  // Beauty and Wellness
  "/beauty-wellness": "Hair care, Beauty, Tattoo and Piercing",

  // Medical Practitioners
  "/medical-practitioners": "Medical Practitioners - non MD/DO",

  // Mental Health
  "/mental-health": "Counselors, Psychologists, Addiction Specialists, Team Building",

  // Tech and IT
  "/tech-it-services": "Computers and the Web",

  // Food and Dining
  "/food-dining": "Restaurant, Food and Drink",

  // Personal Assistants
  "/personal-assistants": "Assistants",

  // Funeral Services
  "/funeral-services": "Mortuary Services",

  // Legal Services
  "/legal-services": "Lawyers",
}

export function getCategoryNameForPagePath(pagePath: string): string | null {
  const normalizedPath = pagePath.toLowerCase().trim()
  const categoryName = categoryMappings[normalizedPath]

  console.log(`[Category Mapping] Path: "${normalizedPath}" -> Category: "${categoryName}"`)

  if (!categoryName) {
    console.warn(`[Category Mapping] No mapping found for path: ${normalizedPath}`)
    console.log("[Category Mapping] Available mappings:", Object.keys(categoryMappings))
  }

  return categoryName || null
}

export function getPagePathForCategoryName(categoryName: string): string | null {
  const normalizedCategoryName = categoryName.trim()

  for (const [path, name] of Object.entries(categoryMappings)) {
    if (name === normalizedCategoryName) {
      return path
    }
  }

  console.warn(`[Category Mapping] No path found for category: ${normalizedCategoryName}`)
  return null
}

// Helper function to get all available category mappings
export function getAllCategoryMappings(): Record<string, string> {
  return { ...categoryMappings }
}

// Helper function to check if a path has a mapping
export function hasPathMapping(pagePath: string): boolean {
  const normalizedPath = pagePath.toLowerCase().trim()
  return normalizedPath in categoryMappings
}
