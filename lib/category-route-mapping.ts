// Category ID to page mapping from the CSV file
export const categoryIdToPageMapping: Record<string, { name: string; page: string }> = {
  lawyers: { name: "Lawyers", page: "/legal-services" },
  automotive: { name: "Automotive Services", page: "/automotive-services" },
  beauty: { name: "Beauty and Wellness", page: "/beauty-wellness" },
  athletics: { name: "Fitness and Athletics", page: "/fitness-athletics" },
  homeLawnLabor: { name: "Home Improvement", page: "/home-improvement" },
  artDesignEntertainment: { name: "Art, Design and Entertainment", page: "/arts-entertainment" },
  physicalRehabilitation: { name: "Physical Rehabilitation", page: "/physical-rehabilitation" },
  financeInsurance: { name: "Financial Services", page: "/financial-services" },
  weddingsEvents: { name: "Weddings and Events", page: "/weddings-events" },
  languageTutoring: { name: "Education and Tutoring", page: "/education-tutoring" },
  realestate: { name: "Real Estate", page: "/real-estate" },
  homecare: { name: "Care Services", page: "/care-services" },
  personalAssistant: { name: "Personal Assistants", page: "/personal-assistants" },
  mortuaryServices: { name: "Funeral Services", page: "/funeral-services" },
  tailors: { name: "Tailoring and Clothing", page: "/tailoring-clothing" },
  restaurant: { name: "Food and Dining", page: "/food-dining" },
  computers: { name: "Tech and IT Services", page: "/tech-it-services" },
  counseling: { name: "Mental Health", page: "/mental-health" },
  medical: { name: "Medical Practitioners", page: "/medical-practitioners" },
  music: { name: "Music Lessons", page: "/music-lessons" },
  petCare: { name: "Pet Care", page: "/pet-care" },
  retailStores: { name: "Retail Stores", page: "/retail-stores" },
  travelVacation: { name: "Travel and Vacation", page: "/travel-vacation" },
  childcare: { name: "Child Care", page: "/child-care" },
  eldercare: { name: "Elder Care", page: "/elder-care" },
  lawn: { name: "Lawn and Garden", page: "/home-improvement/lawn-garden" },
  outside: { name: "Outside Maintenance", page: "/home-improvement/outside-maintenance" },
  outdoorStructures: { name: "Outdoor Structures", page: "/home-improvement/outdoor-structures" },
  poolServices: { name: "Pool Services", page: "/home-improvement/pool-services" },
  asphaltConcrete: { name: "Asphalt and Concrete", page: "/home-improvement/asphalt-concrete" },
  construction: { name: "Construction and Design", page: "/home-improvement/construction-design" },
  insideHome: { name: "Inside Maintenance", page: "/home-improvement/inside-maintenance" },
  windowsDoors: { name: "Windows and Doors", page: "/home-improvement/windows-doors" },
  floorCarpet: { name: "Flooring", page: "/home-improvement/flooring" },
  audioVisualSecurity: { name: "Audio Visual and Security", page: "/home-improvement/audio-visual-security" },
  homeHazard: { name: "Hazard Mitigation", page: "/home-improvement/hazard-mitigation" },
  pestControl: { name: "Pest Control", page: "/home-improvement/pest-control" },
  trashCleanup: { name: "Trash and Cleanup", page: "/home-improvement/trash-cleanup" },
  homeCleaning: { name: "Cleaning", page: "/home-improvement/cleaning" },
  fireplacesChimneys: { name: "Fireplaces and Chimneys", page: "/home-improvement/fireplaces-chimneys" },
  movers: { name: "Movers", page: "/home-improvement/movers" },
  handymen: { name: "Handymen", page: "/home-improvement/handymen" },
}

// Additional name variations for better matching
const categoryNameVariations: Record<string, string> = {
  Lawyers: "/legal-services",
  "Legal Services": "/legal-services",
  Attorney: "/legal-services",
  Attorneys: "/legal-services",
  "Law Firm": "/legal-services",
  "Law Office": "/legal-services",
  "Legal Advice": "/legal-services",
  "Legal Counsel": "/legal-services",
  "Automotive Services": "/automotive-services",
  "Auto Repair": "/automotive-services",
  "Car Repair": "/automotive-services",
  "Auto Service": "/automotive-services",
  Mechanic: "/automotive-services",
  "Auto Mechanic": "/automotive-services",
  "Car Service": "/automotive-services",
  "Vehicle Repair": "/automotive-services",
  "Auto Body": "/automotive-services",
  "Beauty and Wellness": "/beauty-wellness",
  "Beauty Salon": "/beauty-wellness",
  Spa: "/beauty-wellness",
  "Hair Salon": "/beauty-wellness",
  "Nail Salon": "/beauty-wellness",
  Massage: "/beauty-wellness",
  "Wellness Center": "/beauty-wellness",
  "Beauty Services": "/beauty-wellness",
  "Fitness and Athletics": "/fitness-athletics",
  Gym: "/fitness-athletics",
  "Fitness Center": "/fitness-athletics",
  "Personal Trainer": "/fitness-athletics",
  Sports: "/fitness-athletics",
  "Athletic Training": "/fitness-athletics",
  "Fitness Classes": "/fitness-athletics",
  "Home Improvement": "/home-improvement",
  "Home Repair": "/home-improvement",
  "Home Services": "/home-improvement",
  Contractor: "/home-improvement",
  Remodeling: "/home-improvement",
  Renovation: "/home-improvement",
  "Art, Design and Entertainment": "/arts-entertainment",
  "Arts and Entertainment": "/arts-entertainment",
  "Art Gallery": "/arts-entertainment",
  Entertainment: "/arts-entertainment",
  "Design Services": "/arts-entertainment",
  "Graphic Design": "/arts-entertainment",
  Artist: "/arts-entertainment",
  "Physical Rehabilitation": "/physical-rehabilitation",
  "Physical Therapy": "/physical-rehabilitation",
  "Rehabilitation Services": "/physical-rehabilitation",
  "Physical Therapist": "/physical-rehabilitation",
  "Rehab Center": "/physical-rehabilitation",
  "Financial Services": "/financial-services",
  "Financial Advisor": "/financial-services",
  "Financial Planning": "/financial-services",
  Accounting: "/financial-services",
  "Tax Services": "/financial-services",
  Bookkeeping: "/financial-services",
  Investment: "/financial-services",
  Insurance: "/financial-services",
  "Weddings and Events": "/weddings-events",
  "Wedding Planner": "/weddings-events",
  "Event Planner": "/weddings-events",
  "Wedding Services": "/weddings-events",
  "Event Planning": "/weddings-events",
  "Wedding Venue": "/weddings-events",
  "Event Venue": "/weddings-events",
  "Education and Tutoring": "/education-tutoring",
  Tutor: "/education-tutoring",
  "Tutoring Services": "/education-tutoring",
  "Education Services": "/education-tutoring",
  "Academic Help": "/education-tutoring",
  "Learning Center": "/education-tutoring",
  "Real Estate": "/real-estate",
  Realtor: "/real-estate",
  "Real Estate Agent": "/real-estate",
  "Property Management": "/real-estate",
  "Real Estate Services": "/real-estate",
  "Home Sales": "/real-estate",
  "Care Services": "/care-services",
  Caregiver: "/care-services",
  "Home Care": "/care-services",
  "Care Provider": "/care-services",
  "Personal Assistants": "/personal-assistants",
  "Personal Assistant": "/personal-assistants",
  "Virtual Assistant": "/personal-assistants",
  "Assistant Services": "/personal-assistants",
  "Funeral Services": "/funeral-services",
  "Funeral Home": "/funeral-services",
  "Mortuary Services": "/funeral-services",
  Mortuary: "/funeral-services",
  "Funeral Director": "/funeral-services",
  "Tailoring and Clothing": "/tailoring-clothing",
  Tailor: "/tailoring-clothing",
  Alterations: "/tailoring-clothing",
  "Clothing Repair": "/tailoring-clothing",
  Seamstress: "/tailoring-clothing",
  "Food and Dining": "/food-dining",
  Restaurant: "/food-dining",
  Catering: "/food-dining",
  "Food Service": "/food-dining",
  Dining: "/food-dining",
  Cafe: "/food-dining",
  "Tech and IT Services": "/tech-it-services",
  "IT Support": "/tech-it-services",
  "Computer Repair": "/tech-it-services",
  "Tech Support": "/tech-it-services",
  "IT Services": "/tech-it-services",
  "Computer Services": "/tech-it-services",
  "Mental Health": "/mental-health",
  Therapist: "/mental-health",
  Counseling: "/mental-health",
  Psychologist: "/mental-health",
  Psychiatrist: "/mental-health",
  "Mental Health Services": "/mental-health",
  Therapy: "/mental-health",
  "Medical Practitioners": "/medical-practitioners",
  Doctor: "/medical-practitioners",
  Physician: "/medical-practitioners",
  "Medical Services": "/medical-practitioners",
  "Healthcare Provider": "/medical-practitioners",
  "Medical Practice": "/medical-practitioners",
  "Music Lessons": "/music-lessons",
  "Music Teacher": "/music-lessons",
  "Music Instructor": "/music-lessons",
  "Music Education": "/music-lessons",
  "Piano Lessons": "/music-lessons",
  "Guitar Lessons": "/music-lessons",
  "Pet Care": "/pet-care",
  "Pet Sitter": "/pet-care",
  "Dog Walker": "/pet-care",
  "Pet Grooming": "/pet-care",
  Veterinarian: "/pet-care",
  "Animal Care": "/pet-care",
  "Retail Stores": "/retail-stores",
  Shop: "/retail-stores",
  Store: "/retail-stores",
  Retail: "/retail-stores",
  Boutique: "/retail-stores",
  "Travel and Vacation": "/travel-vacation",
  "Travel Agent": "/travel-vacation",
  "Travel Planning": "/travel-vacation",
  "Vacation Services": "/travel-vacation",
  "Tour Guide": "/travel-vacation",
  "Child Care": "/child-care",
  Childcare: "/child-care",
  Babysitter: "/child-care",
  Daycare: "/child-care",
  Nanny: "/child-care",
  "Child Care Services": "/child-care",
  "Elder Care": "/elder-care",
  Eldercare: "/elder-care",
  "Senior Care": "/elder-care",
  "Elder Services": "/elder-care",
  "Senior Services": "/elder-care",
  "Lawn and Garden": "/home-improvement/lawn-garden",
  Landscaping: "/home-improvement/lawn-garden",
  "Lawn Care": "/home-improvement/lawn-garden",
  Gardening: "/home-improvement/lawn-garden",
  "Lawn Service": "/home-improvement/lawn-garden",
  "Outside Maintenance": "/home-improvement/outside-maintenance",
  "Exterior Maintenance": "/home-improvement/outside-maintenance",
  "Outdoor Maintenance": "/home-improvement/outside-maintenance",
  "Outdoor Structures": "/home-improvement/outdoor-structures",
  Deck: "/home-improvement/outdoor-structures",
  Patio: "/home-improvement/outdoor-structures",
  Fence: "/home-improvement/outdoor-structures",
  "Pool Services": "/home-improvement/pool-services",
  "Pool Maintenance": "/home-improvement/pool-services",
  "Pool Cleaning": "/home-improvement/pool-services",
  "Swimming Pool": "/home-improvement/pool-services",
  "Asphalt and Concrete": "/home-improvement/asphalt-concrete",
  Driveway: "/home-improvement/asphalt-concrete",
  Paving: "/home-improvement/asphalt-concrete",
  "Concrete Work": "/home-improvement/asphalt-concrete",
  "Construction and Design": "/home-improvement/construction-design",
  Builder: "/home-improvement/construction-design",
  "Home Design": "/home-improvement/construction-design",
  "Construction Services": "/home-improvement/construction-design",
  "Inside Maintenance": "/home-improvement/inside-maintenance",
  "Interior Maintenance": "/home-improvement/inside-maintenance",
  "Home Maintenance": "/home-improvement/inside-maintenance",
  "Windows and Doors": "/home-improvement/windows-doors",
  "Window Installation": "/home-improvement/windows-doors",
  "Door Installation": "/home-improvement/windows-doors",
  "Window Repair": "/home-improvement/windows-doors",
  Flooring: "/home-improvement/flooring",
  Carpet: "/home-improvement/flooring",
  "Hardwood Floors": "/home-improvement/flooring",
  Tile: "/home-improvement/flooring",
  "Floor Installation": "/home-improvement/flooring",
  "Audio Visual and Security": "/home-improvement/audio-visual-security",
  "Home Security": "/home-improvement/audio-visual-security",
  "Security System": "/home-improvement/audio-visual-security",
  "Home Theater": "/home-improvement/audio-visual-security",
  "Hazard Mitigation": "/home-improvement/hazard-mitigation",
  "Mold Removal": "/home-improvement/hazard-mitigation",
  Asbestos: "/home-improvement/hazard-mitigation",
  "Lead Removal": "/home-improvement/hazard-mitigation",
  "Pest Control": "/home-improvement/pest-control",
  Exterminator: "/home-improvement/pest-control",
  "Pest Management": "/home-improvement/pest-control",
  "Bug Control": "/home-improvement/pest-control",
  "Trash and Cleanup": "/home-improvement/trash-cleanup",
  "Junk Removal": "/home-improvement/trash-cleanup",
  "Waste Management": "/home-improvement/trash-cleanup",
  "Garbage Removal": "/home-improvement/trash-cleanup",
  Cleaning: "/home-improvement/cleaning",
  "House Cleaning": "/home-improvement/cleaning",
  "Cleaning Service": "/home-improvement/cleaning",
  "Maid Service": "/home-improvement/cleaning",
  "Fireplaces and Chimneys": "/home-improvement/fireplaces-chimneys",
  "Chimney Sweep": "/home-improvement/fireplaces-chimneys",
  "Fireplace Installation": "/home-improvement/fireplaces-chimneys",
  "Chimney Repair": "/home-improvement/fireplaces-chimneys",
  Movers: "/home-improvement/movers",
  "Moving Company": "/home-improvement/movers",
  "Moving Service": "/home-improvement/movers",
  Relocation: "/home-improvement/movers",
  Handymen: "/home-improvement/handymen",
  Handyman: "/home-improvement/handymen",
  "Odd Jobs": "/home-improvement/handymen",
  "Home Repairs": "/home-improvement/handymen",
}

// Mapping from routes to category IDs (reverse mapping)
export const routeToCategoryMapping: Record<string, string[]> = {
  "/arts-entertainment": ["artDesignEntertainment"],
  "/fitness-athletics": ["athletics"],
  "/automotive-services": ["automotive"],
  "/beauty-wellness": ["beauty"],
  "/child-care": ["childcare"],
  "/tech-it-services": ["computers"],
  "/mental-health": ["counseling"],
  "/elder-care": ["eldercare"],
  "/financial-services": ["financeInsurance"],
  "/home-improvement": ["homeLawnLabor"],
  "/care-services": ["homecare"],
  "/education-tutoring": ["languageTutoring"],
  "/legal-services": ["lawyers"],
  "/medical-practitioners": ["medical"],
  "/funeral-services": ["mortuaryServices"],
  "/music-lessons": ["music"],
  "/personal-assistants": ["personalAssistant"],
  "/pet-care": ["petCare"],
  "/physical-rehabilitation": ["physicalRehabilitation"],
  "/real-estate": ["realestate"],
  "/food-dining": ["restaurant"],
  "/retail-stores": ["retailStores"],
  "/tailoring-clothing": ["tailors"],
  "/travel-vacation": ["travelVacation"],
  "/weddings-events": ["weddingsEvents"],
  // Home improvement subcategory mappings
  "/home-improvement/asphalt-concrete": ["asphaltConcrete"],
  "/home-improvement/audio-visual-security": ["audioVisualSecurity"],
  "/home-improvement/construction-design": ["construction"],
  "/home-improvement/fireplaces-chimneys": ["fireplacesChimneys"],
  "/home-improvement/flooring": ["floorCarpet"],
  "/home-improvement/handymen": ["handymen"],
  "/home-improvement/hazard-mitigation": ["homeHazard"],
  "/home-improvement/cleaning": ["homeCleaning"],
  "/home-improvement/inside-maintenance": ["insideHome"],
  "/home-improvement/lawn-garden": ["lawn"],
  "/home-improvement/movers": ["movers"],
  "/home-improvement/outdoor-structures": ["outdoorStructures"],
  "/home-improvement/outside-maintenance": ["outside"],
  "/home-improvement/pest-control": ["pestControl"],
  "/home-improvement/pool-services": ["poolServices"],
  "/home-improvement/trash-cleanup": ["trashCleanup"],
  "/home-improvement/windows-doors": ["windowsDoors"],
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

// Enhanced function to get route for given category name (matches business-focus selections)
export function getRouteForCategoryName(categoryName: string): string | null {
  if (!categoryName) return null

  // First try direct lookup in variations
  if (categoryNameVariations[categoryName]) {
    return categoryNameVariations[categoryName]
  }

  // Try case-insensitive lookup in variations
  const lowerCategoryName = categoryName.toLowerCase()
  for (const [name, route] of Object.entries(categoryNameVariations)) {
    if (name.toLowerCase() === lowerCategoryName) {
      return route
    }
  }

  // Try exact match in categoryIdToPageMapping
  for (const [categoryId, data] of Object.entries(categoryIdToPageMapping)) {
    if (data.name.toLowerCase() === lowerCategoryName) {
      return data.page
    }
  }

  // Try partial match
  for (const [name, route] of Object.entries(categoryNameVariations)) {
    if (name.toLowerCase().includes(lowerCategoryName) || lowerCategoryName.includes(name.toLowerCase())) {
      return route
    }
  }

  // Try partial match with categoryIdToPageMapping
  for (const [categoryId, data] of Object.entries(categoryIdToPageMapping)) {
    if (data.name.toLowerCase().includes(lowerCategoryName) || lowerCategoryName.includes(data.name.toLowerCase())) {
      return data.page
    }
  }

  // Try matching by category ID directly
  if (categoryIdToPageMapping[categoryName]) {
    return categoryIdToPageMapping[categoryName].page
  }

  return null
}

// Function to get route for given category IDs (reverse mapping)
export function getRouteForCategoryIds(categoryIds: string[]): string | null {
  for (const categoryId of categoryIds) {
    if (categoryIdToPageMapping[categoryId]) {
      return categoryIdToPageMapping[categoryId].page
    }
  }
  return null
}

// Function to get category page info by category name
export function getCategoryPageInfo(categoryName: string): { name: string; page: string } | null {
  if (!categoryName) return null

  // Try exact match
  for (const [categoryId, data] of Object.entries(categoryIdToPageMapping)) {
    if (data.name.toLowerCase() === categoryName.toLowerCase()) {
      return data
    }
  }

  // Try partial match
  for (const [categoryId, data] of Object.entries(categoryIdToPageMapping)) {
    if (
      data.name.toLowerCase().includes(categoryName.toLowerCase()) ||
      categoryName.toLowerCase().includes(data.name.toLowerCase())
    ) {
      return data
    }
  }

  // If we have a direct mapping in variations, create a synthetic result
  for (const [name, page] of Object.entries(categoryNameVariations)) {
    if (name.toLowerCase() === categoryName.toLowerCase()) {
      return { name, page }
    }
  }

  return null
}
