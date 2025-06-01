// Centralized category mapping system
// This maps the exact category names from business-focus to their corresponding pages

export interface CategoryPageMapping {
  categoryName: string // Exact name from category-data.ts
  pagePath: string // URL path for the category page
  pageTitle: string // Display title for the page
}

// Central mapping of categories to their pages
export const CATEGORY_PAGE_MAPPINGS: CategoryPageMapping[] = [
  // Home, Lawn, and Manual Labor subcategories
  {
    categoryName: "Home, Lawn, and Manual Labor",
    pagePath: "/home-improvement",
    pageTitle: "Home Improvement Services",
  },

  // Retail Stores
  {
    categoryName: "Retail Stores",
    pagePath: "/retail-stores",
    pageTitle: "Retail Stores",
  },

  // Travel and Vacation
  {
    categoryName: "Travel and Vacation",
    pagePath: "/travel-vacation",
    pageTitle: "Travel and Vacation Services",
  },

  // Tailors, Dressmakers, etc.
  {
    categoryName: "Tailors, Dressmakers, and Fabric and Clothes Cleaning and Repair",
    pagePath: "/tailoring-clothing",
    pageTitle: "Tailoring and Clothing Services",
  },

  // Art, Design and Entertainment
  {
    categoryName: "Art, Design and Entertainment",
    pagePath: "/arts-entertainment",
    pageTitle: "Arts and Entertainment",
  },

  // Physical Rehabilitation
  {
    categoryName: "Physical Rehabilitation",
    pagePath: "/physical-rehabilitation",
    pageTitle: "Physical Rehabilitation Services",
  },

  // Insurance, Finance, Debt and Sales
  {
    categoryName: "Insurance, Finance, Debt and Sales",
    pagePath: "/financial-services",
    pageTitle: "Financial Services",
  },

  // Weddings and Special Events
  {
    categoryName: "Weddings and Special Events",
    pagePath: "/weddings-events",
    pageTitle: "Weddings and Events",
  },

  // Pet Care
  {
    categoryName: "Pet Care",
    pagePath: "/pet-care",
    pageTitle: "Pet Care Services",
  },

  // Language Lessons/School Subject Tutoring
  {
    categoryName: "Language Lessons/School Subject Tutoring",
    pagePath: "/education-tutoring",
    pageTitle: "Education and Tutoring",
  },

  // Home Buying and Selling
  {
    categoryName: "Home Buying and Selling",
    pagePath: "/real-estate",
    pageTitle: "Real Estate Services",
  },

  // Athletics, Personal Trainers, etc.
  {
    categoryName: "Athletics, Personal Trainers, Group Fitness Classes and Dance Instruction",
    pagePath: "/fitness-athletics",
    pageTitle: "Fitness and Athletics",
  },

  // Music
  {
    categoryName: "Music",
    pagePath: "/music-lessons",
    pageTitle: "Music Lessons and Services",
  },

  // Home Care
  {
    categoryName: "Home Care",
    pagePath: "/care-services",
    pageTitle: "Home Care Services",
  },

  // Automotive/Motorcycle/RV
  {
    categoryName: "Automotive/Motorcycle/RV, etc",
    pagePath: "/automotive-services",
    pageTitle: "Automotive Services",
  },

  // Hair care, Beauty, Tattoo and Piercing
  {
    categoryName: "Hair care, Beauty, Tattoo and Piercing",
    pagePath: "/beauty-wellness",
    pageTitle: "Beauty and Wellness",
  },

  // Medical Practitioners - non MD/DO
  {
    categoryName: "Medical Practitioners - non MD/DO",
    pagePath: "/medical-practitioners",
    pageTitle: "Medical Practitioners",
  },

  // Counselors, Psychologists, etc.
  {
    categoryName: "Counselors, Psychologists, Addiction Specialists, Team Building",
    pagePath: "/mental-health",
    pageTitle: "Mental Health Services",
  },

  // Computers and the Web
  {
    categoryName: "Computers and the Web",
    pagePath: "/tech-it-services",
    pageTitle: "Technology and IT Services",
  },

  // Restaurant, Food and Drink
  {
    categoryName: "Restaurant, Food and Drink",
    pagePath: "/food-dining",
    pageTitle: "Food and Dining",
  },

  // Assistants
  {
    categoryName: "Assistants",
    pagePath: "/personal-assistants",
    pageTitle: "Personal Assistants",
  },

  // Mortuary Services
  {
    categoryName: "Mortuary Services",
    pagePath: "/funeral-services",
    pageTitle: "Funeral Services",
  },

  // Lawyers
  {
    categoryName: "Lawyers",
    pagePath: "/legal-services",
    pageTitle: "Legal Services",
  },
]

// Helper functions for easy lookup
export function getPagePathForCategory(categoryName: string): string | null {
  const mapping = CATEGORY_PAGE_MAPPINGS.find((m) => m.categoryName === categoryName)
  return mapping ? mapping.pagePath : null
}

export function getPageTitleForCategory(categoryName: string): string | null {
  const mapping = CATEGORY_PAGE_MAPPINGS.find((m) => m.categoryName === categoryName)
  return mapping ? mapping.pageTitle : null
}

export function getCategoryForPagePath(pagePath: string): CategoryPageMapping | null {
  return CATEGORY_PAGE_MAPPINGS.find((m) => m.pagePath === pagePath) || null
}

// Get all businesses for a specific page path
export function getCategoryNameForPagePath(pagePath: string): string | null {
  const mapping = CATEGORY_PAGE_MAPPINGS.find((m) => m.pagePath === pagePath)
  return mapping ? mapping.categoryName : null
}
