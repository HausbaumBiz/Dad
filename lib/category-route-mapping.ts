export const getCategoryIdsForRoute = (route: string): string[] => {
  switch (route) {
    case "/accountants":
      return ["Accountants and Tax Preparers"]
    case "/carpet-cleaning":
      return ["Carpet and Upholstery Cleaning Services"]
    case "/catering":
      return ["Caterers"]
    case "/computer-repair":
      return ["Computer Repair"]
    case "/electricians":
      return ["Electricians"]
    case "/financial-advisor":
      return ["Financial Advisors"]
    case "/handyman":
      return ["Handyman Services"]
    case "/hvac":
      return ["Heating and Air Conditioning"]
    case "/junk-removal":
      return ["Junk Removal and Hauling"]
    case "/landscaping":
      return ["Landscaping Services"]
    case "/locksmith":
      return ["Locksmiths"]
    case "/movers":
      return ["Moving Services"]
    case "/painters":
      return ["Painting Services"]
    case "/pest-control":
      return ["Pest Control Services"]
    case "/photographers":
      return ["Photographers"]
    case "/plumbers":
      return ["Plumbers"]
    case "/roofing":
      return ["Roofing Contractors"]
    case "/security-systems":
      return ["Security System Companies"]
    case "/tailoring-clothing":
      return ["Tailors, Dressmakers, and Fabric and Clothes Cleaning and Repair"]
    case "/physical-rehabilitation":
      return [
        "Physical Rehabilitation",
        "Physical Therapists",
        "Occupational Therapists",
        "Massage Therapists",
        "Speech-Language Pathologists",
      ]
    case "/financial-services":
      return ["financeInsurance", "Insurance, Finance, Debt and Sales"]
    case "/mental-health":
      return [
        "counseling",
        "Counselors, Psychologists, Addiction Specialists, Team Building",
        "Mental Health",
        "Counselors",
        "Psychologists",
        "Addiction Specialists",
        "Team Building",
      ]
    case "/medical-practitioners":
      return [
        "Medical Practitioners (non MD/DO)",
        "medical-practitioners---non-md/do",
        "Chiropractors",
        "Dentists",
        "Orthodontists",
        "Optometrists",
        "Podiatrists",
        "Audiologists",
        "Dietitians and Nutritionists",
        "Naturopaths",
        "Herbalists",
        "Acupuncturist",
        "Orthotists and Prosthetists",
        "Midwives and Doulas",
      ]
    default:
      return []
  }
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

const categoryNameVariations: { [key: string]: string } = {
  Accountant: "/accountants",
  Accounting: "/accountants",
  "Tax Preparer": "/accountants",
  "Tax Preparation": "/accountants",
  "Carpet Cleaner": "/carpet-cleaning",
  "Upholstery Cleaner": "/carpet-cleaning",
  Caterer: "/catering",
  "Computer Repair Technician": "/computer-repair",
  Electrician: "/electricians",
  "Financial Advisor": "/financial-advisor",
  Handyman: "/handyman",
  "HVAC Technician": "/hvac",
  "Junk Removal Specialist": "/junk-removal",
  Landscaper: "/landscaping",
  Locksmith: "/locksmith",
  Mover: "/movers",
  Painter: "/painters",
  "Pest Control Technician": "/pest-control",
  Photographer: "/photographers",
  Plumber: "/plumbers",
  "Roofing Contractor": "/roofing",
  "Security System Installer": "/security-systems",
  Tailor: "/tailoring-clothing",
  Dressmaker: "/tailoring-clothing",
  financialServices: "/financial-services",
  "Financial Services": "/financial-services",
  "Financial Advisor": "/financial-services",
  "Financial Planning": "/financial-services",
  Accounting: "/financial-services",
  "Tax Services": "/financial-services",
  Bookkeeping: "/financial-services",
  Investment: "/financial-services",
  Insurance: "/financial-services",
  financeInsurance: "/financial-services",
  "Insurance, Finance, Debt and Sales": "/financial-services",
  Finance: "/financial-services",
  Insurance: "/financial-services",
  "Mental Health": "/mental-health",
  Counselors: "/mental-health",
  Psychologists: "/mental-health",
  "Addiction Specialists": "/mental-health",
  "Team Building": "/mental-health",
  counseling: "/mental-health",
  "Counselors, Psychologists, Addiction Specialists, Team Building": "/mental-health",
  "Clinical and Counseling Psychologists": "/mental-health",
  "Suboxone/Methadone Clinics": "/mental-health",
  "Industrial-Organizational Psychologists": "/mental-health",
  "Motivational Speakers": "/mental-health",
}

export const categoryIdToPageMapping: { [key: string]: { name: string; page: string } } = {
  "Accountants and Tax Preparers": { name: "Accountants and Tax Preparers", page: "/accountants" },
  "Carpet and Upholstery Cleaning Services": {
    name: "Carpet and Upholstery Cleaning Services",
    page: "/carpet-cleaning",
  },
  Caterers: { name: "Caterers", page: "/catering" },
  "Computer Repair": { name: "Computer Repair", page: "/computer-repair" },
  Electricians: { name: "Electricians", page: "/electricians" },
  "Financial Advisors": { name: "Financial Advisors", page: "/financial-advisor" },
  "Handyman Services": { name: "Handyman Services", page: "/handyman" },
  "Heating and Air Conditioning": { name: "Heating and Air Conditioning", page: "/hvac" },
  "Junk Removal and Hauling": { name: "Junk Removal and Hauling", page: "/junk-removal" },
  "Landscaping Services": { name: "Landscaping Services", page: "/landscaping" },
  Locksmiths: { name: "Locksmiths", page: "/locksmith" },
  "Moving Services": { name: "Moving Services", page: "/movers" },
  "Painting Services": { name: "Painting Services", page: "/painters" },
  "Pest Control Services": { name: "Pest Control Services", page: "/pest-control" },
  Photographers: { name: "Photographers", page: "/photographers" },
  Plumbers: { name: "Plumbers", page: "/plumbers" },
  "Roofing Contractors": { name: "Roofing Contractors", page: "/roofing" },
  "Security System Companies": { name: "Security System Companies", page: "/security-systems" },
  "Tailors, Dressmakers, and Fabric and Clothes Cleaning and Repair": {
    name: "Tailors, Dressmakers, and Fabric and Clothes Cleaning and Repair",
    page: "/tailoring-clothing",
  },
  "Physical Rehabilitation": { name: "Physical Rehabilitation", page: "/physical-rehabilitation" },
  "Physical Therapists": { name: "Physical Therapists", page: "/physical-rehabilitation" },
  "Occupational Therapists": { name: "Occupational Therapists", page: "/physical-rehabilitation" },
  "Massage Therapists": { name: "Massage Therapists", page: "/physical-rehabilitation" },
  "Speech-Language Pathologists": { name: "Speech-Language Pathologists", page: "/physical-rehabilitation" },
  financeInsurance: { name: "Insurance, Finance, Debt and Sales", page: "/financial-services" },
  "Insurance, Finance, Debt and Sales": { name: "Insurance, Finance, Debt and Sales", page: "/financial-services" },
  financialServices: { name: "Financial Services", page: "/financial-services" },
  counseling: { name: "Counselors, Psychologists, Addiction Specialists, Team Building", page: "/mental-health" },
  "Counselors, Psychologists, Addiction Specialists, Team Building": {
    name: "Counselors, Psychologists, Addiction Specialists, Team Building",
    page: "/mental-health",
  },
  "Mental Health": { name: "Mental Health", page: "/mental-health" },
  Counselors: { name: "Counselors", page: "/mental-health" },
  Psychologists: { name: "Psychologists", page: "/mental-health" },
  "Addiction Specialists": { name: "Addiction Specialists", page: "/mental-health" },
  "Team Building": { name: "Team Building", page: "/mental-health" },
  "medical-practitioners---non-md/do": {
    name: "Medical Practitioners (non MD/DO)",
    page: "/medical-practitioners",
  },
  "Medical Practitioners (non MD/DO)": {
    name: "Medical Practitioners (non MD/DO)",
    page: "/medical-practitioners",
  },
}
