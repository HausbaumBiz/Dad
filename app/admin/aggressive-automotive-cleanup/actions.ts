"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

export interface AutomotiveCleanupAnalysis {
  totalAutomotiveKeys: number
  totalBusinessesFound: number
  businessesInAutomotive: Array<{
    id: string
    name: string
    categories: string[]
  }>
  suspiciousBusinesses: Array<{
    id: string
    name: string
    reason: string
    categories: string[]
  }>
  automotiveKeys: string[]
  corruptedKeys: string[]
  error?: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (error && typeof error === "object") {
    return JSON.stringify(error)
  }
  return String(error)
}

// Keywords that indicate a business is NOT automotive
const NON_AUTOMOTIVE_KEYWORDS = [
  "health",
  "medical",
  "doctor",
  "clinic",
  "hospital",
  "care",
  "family",
  "pest",
  "rat",
  "exterminator",
  "bug",
  "termite",
  "rodent",
  "food",
  "restaurant",
  "cafe",
  "deli",
  "pizza",
  "burger",
  "beauty",
  "salon",
  "spa",
  "nail",
  "hair",
  "legal",
  "law",
  "attorney",
  "lawyer",
  "real estate",
  "realtor",
  "property",
  "insurance",
  "finance",
  "bank",
  "loan",
  "education",
  "school",
  "tutor",
  "learning",
  "cleaning",
  "maid",
  "janitorial",
  "plumbing",
  "electric",
  "hvac",
  "roofing",
  "construction",
  "veterinary",
  "vet",
  "animal",
  "pet",
  "dental",
  "dentist",
  "orthodontic",
  "therapy",
  "counseling",
  "mental",
  "funeral",
  "mortuary",
  "cemetery",
]

// Keywords that indicate a business IS automotive
const AUTOMOTIVE_KEYWORDS = [
  "auto",
  "car",
  "vehicle",
  "motor",
  "tire",
  "brake",
  "engine",
  "transmission",
  "oil change",
  "lube",
  "mechanic",
  "repair",
  "garage",
  "service station",
  "gas station",
  "automotive",
  "collision",
  "body shop",
  "paint",
  "detailing",
  "wash",
  "parts",
  "battery",
  "muffler",
  "exhaust",
  "alignment",
  "towing",
  "roadside",
  "smog",
  "inspection",
  "registration",
]

function isBusinessAutomotive(businessName: string): { isAutomotive: boolean; reason: string } {
  const name = businessName.toLowerCase()

  // Check for non-automotive keywords first
  for (const keyword of NON_AUTOMOTIVE_KEYWORDS) {
    if (name.includes(keyword)) {
      return { isAutomotive: false, reason: `Contains non-automotive keyword: ${keyword}` }
    }
  }

  // Check for automotive keywords
  for (const keyword of AUTOMOTIVE_KEYWORDS) {
    if (name.includes(keyword)) {
      return { isAutomotive: true, reason: `Contains automotive keyword: ${keyword}` }
    }
  }

  // If no clear indicators, assume it might be automotive (to be safe)
  return { isAutomotive: true, reason: "No clear non-automotive indicators" }
}

async function safeGetSetMembers(key: string): Promise<{ members: string[]; isCorrupted: boolean }> {
  try {
    // First check if the key exists
    const exists = await kv.exists(key)
    if (!exists) {
      return { members: [], isCorrupted: false }
    }

    // Try to get the type
    let keyType: string
    try {
      keyType = await kv.type(key)
    } catch (error) {
      console.log(`Key ${key} is corrupted (type check failed):`, getErrorMessage(error))
      return { members: [], isCorrupted: true }
    }

    // If it's not a set, it's corrupted
    if (keyType !== "set") {
      console.log(`Key ${key} is corrupted (wrong type: ${keyType})`)
      return { members: [], isCorrupted: true }
    }

    // Try to get the members
    try {
      const result = await kv.smembers(key)
      if (!Array.isArray(result)) {
        console.log(`Key ${key} is corrupted (smembers didn't return array)`)
        return { members: [], isCorrupted: true }
      }
      return { members: result, isCorrupted: false }
    } catch (error) {
      console.log(`Key ${key} is corrupted (smembers failed):`, getErrorMessage(error))
      return { members: [], isCorrupted: true }
    }
  } catch (error) {
    console.log(`Key ${key} is corrupted (general error):`, getErrorMessage(error))
    return { members: [], isCorrupted: true }
  }
}

export async function scanAutomotiveCategories(): Promise<AutomotiveCleanupAnalysis> {
  try {
    console.log("Starting aggressive automotive category scan")

    // Comprehensive list of ALL possible automotive category keys
    const automotiveKeys = [
      "category:automotive-services",
      "category:automotive",
      "category:automotiveServices",
      "category:automotive_services",
      "category:auto-services",
      "category:autoServices",
      "category:Automotive Services",
      "category:Automotive/Motorcycle/RV",
      "category:automotive/motorcycle/rv",
      "category:Automotive/Motorcycle/RV, etc",
      "category:automotive/motorcycle/rv, etc",
      "category:Automotive/Motorcycle/RV etc",
      "category:automotive/motorcycle/rv etc",
      "category:auto",
      "category:Auto",
      "category:AUTO",
      "category:car-services",
      "category:carServices",
      "category:vehicle-services",
      "category:vehicleServices",
      "category:motor-services",
      "category:motorServices",
    ]

    const businessesInAutomotive: Array<{
      id: string
      name: string
      categories: string[]
    }> = []

    const suspiciousBusinesses: Array<{
      id: string
      name: string
      reason: string
      categories: string[]
    }> = []

    const existingKeys: string[] = []
    const corruptedKeys: string[] = []

    // Check each automotive key
    for (const key of automotiveKeys) {
      console.log(`Checking key: ${key}`)

      const { members, isCorrupted } = await safeGetSetMembers(key)

      if (isCorrupted) {
        corruptedKeys.push(key)
        console.log(`Key ${key} is corrupted and will be marked for deletion`)
        continue
      }

      if (members.length > 0) {
        existingKeys.push(key)
        console.log(`Key ${key} has ${members.length} members`)

        // Get business details for each member
        for (const businessId of members) {
          try {
            const businessData = await kv.get(`business:${businessId}`)
            if (businessData) {
              const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData
              const businessName = business.businessName || business.name || "Unknown Business"

              // Check if this business is already in our list
              const existingBusiness = businessesInAutomotive.find((b) => b.id === businessId)
              if (existingBusiness) {
                // Add this category to the existing business
                if (!existingBusiness.categories.includes(key)) {
                  existingBusiness.categories.push(key)
                }
              } else {
                // Add new business
                businessesInAutomotive.push({
                  id: businessId,
                  name: businessName,
                  categories: [key],
                })
              }

              // Check if this business should be in automotive
              const automotiveCheck = isBusinessAutomotive(businessName)
              if (!automotiveCheck.isAutomotive) {
                const existingSuspicious = suspiciousBusinesses.find((b) => b.id === businessId)
                if (existingSuspicious) {
                  if (!existingSuspicious.categories.includes(key)) {
                    existingSuspicious.categories.push(key)
                  }
                } else {
                  suspiciousBusinesses.push({
                    id: businessId,
                    name: businessName,
                    reason: automotiveCheck.reason,
                    categories: [key],
                  })
                }
              }
            }
          } catch (error) {
            console.error(`Error getting business ${businessId}:`, getErrorMessage(error))
          }
        }
      }
    }

    console.log(
      `Scan complete: ${existingKeys.length} valid keys, ${corruptedKeys.length} corrupted keys, ${businessesInAutomotive.length} businesses found`,
    )

    return {
      totalAutomotiveKeys: existingKeys.length,
      totalBusinessesFound: businessesInAutomotive.length,
      businessesInAutomotive,
      suspiciousBusinesses,
      automotiveKeys: existingKeys,
      corruptedKeys,
    }
  } catch (error) {
    return {
      totalAutomotiveKeys: 0,
      totalBusinessesFound: 0,
      businessesInAutomotive: [],
      suspiciousBusinesses: [],
      automotiveKeys: [],
      corruptedKeys: [],
      error: getErrorMessage(error),
    }
  }
}

export async function performAggressiveAutomotiveCleanup(): Promise<{
  success: boolean
  message: string
  details: string[]
  removedBusinesses: Array<{ id: string; name: string; reason: string }>
  deletedCorruptedKeys: string[]
}> {
  const details: string[] = []
  const removedBusinesses: Array<{ id: string; name: string; reason: string }> = []
  const deletedCorruptedKeys: string[] = []

  try {
    console.log("Starting aggressive automotive cleanup")

    // First, get the current analysis
    const analysis = await scanAutomotiveCategories()
    if (analysis.error) {
      return {
        success: false,
        message: "Failed to analyze automotive categories",
        details: [analysis.error],
        removedBusinesses: [],
        deletedCorruptedKeys: [],
      }
    }

    details.push(`Found ${analysis.suspiciousBusinesses.length} suspicious businesses to remove`)
    details.push(`Found ${analysis.corruptedKeys.length} corrupted keys to delete`)

    // Delete all corrupted keys first
    for (const corruptedKey of analysis.corruptedKeys) {
      try {
        await kv.del(corruptedKey)
        deletedCorruptedKeys.push(corruptedKey)
        details.push(`Deleted corrupted key: ${corruptedKey}`)
      } catch (error) {
        details.push(`Error deleting corrupted key ${corruptedKey}: ${getErrorMessage(error)}`)
      }
    }

    // Comprehensive list of ALL possible automotive category keys
    const allAutomotiveKeys = [
      "category:automotive-services",
      "category:automotive",
      "category:automotiveServices",
      "category:automotive_services",
      "category:auto-services",
      "category:autoServices",
      "category:Automotive Services",
      "category:Automotive/Motorcycle/RV",
      "category:automotive/motorcycle/rv",
      "category:Automotive/Motorcycle/RV, etc",
      "category:automotive/motorcycle/rv, etc",
      "category:Automotive/Motorcycle/RV etc",
      "category:automotive/motorcycle/rv etc",
      "category:auto",
      "category:Auto",
      "category:AUTO",
      "category:car-services",
      "category:carServices",
      "category:vehicle-services",
      "category:vehicleServices",
      "category:motor-services",
      "category:motorServices",
    ]

    // Remove each suspicious business from ALL automotive categories
    for (const suspiciousBusiness of analysis.suspiciousBusinesses) {
      let removedFromCategories = 0

      // Remove from ALL possible automotive category keys
      for (const categoryKey of allAutomotiveKeys) {
        try {
          const removed = await kv.srem(categoryKey, suspiciousBusiness.id)
          if (removed > 0) {
            removedFromCategories++
            details.push(`Removed ${suspiciousBusiness.name} from ${categoryKey}`)
          }
        } catch (error) {
          // Ignore errors for non-existent or corrupted keys
          console.log(`Error removing ${suspiciousBusiness.name} from ${categoryKey}:`, getErrorMessage(error))
        }
      }

      // Update the business record to remove automotive categories
      try {
        const businessData = await kv.get(`business:${suspiciousBusiness.id}`)
        if (businessData) {
          const business = typeof businessData === "string" ? JSON.parse(businessData) : businessData

          // Remove automotive-related categories from business record
          let updated = false

          if (business.category && business.category.toLowerCase().includes("automotive")) {
            business.category = ""
            updated = true
          }

          if (business.subcategory && business.subcategory.toLowerCase().includes("automotive")) {
            business.subcategory = ""
            updated = true
          }

          if (business.allCategories && Array.isArray(business.allCategories)) {
            const originalLength = business.allCategories.length
            business.allCategories = business.allCategories.filter(
              (cat) => !cat.toLowerCase().includes("automotive") && !cat.toLowerCase().includes("auto"),
            )
            if (business.allCategories.length !== originalLength) {
              updated = true
            }
          }

          if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
            const originalLength = business.allSubcategories.length
            business.allSubcategories = business.allSubcategories.filter(
              (cat) => !cat.toLowerCase().includes("automotive") && !cat.toLowerCase().includes("auto"),
            )
            if (business.allSubcategories.length !== originalLength) {
              updated = true
            }
          }

          if (updated) {
            business.updatedAt = new Date().toISOString()
            await kv.set(`business:${suspiciousBusiness.id}`, business)
            details.push(`Updated business record for ${suspiciousBusiness.name}`)
          }
        }
      } catch (error) {
        details.push(`Error updating business record for ${suspiciousBusiness.name}: ${getErrorMessage(error)}`)
      }

      if (removedFromCategories > 0) {
        removedBusinesses.push({
          id: suspiciousBusiness.id,
          name: suspiciousBusiness.name,
          reason: suspiciousBusiness.reason,
        })
      }
    }

    // Clean up any empty automotive category indexes
    let cleanedEmptyCategories = 0
    for (const categoryKey of allAutomotiveKeys) {
      try {
        const { members, isCorrupted } = await safeGetSetMembers(categoryKey)
        if (isCorrupted) {
          await kv.del(categoryKey)
          cleanedEmptyCategories++
          details.push(`Deleted corrupted category: ${categoryKey}`)
        } else if (members.length === 0) {
          await kv.del(categoryKey)
          cleanedEmptyCategories++
          details.push(`Deleted empty category: ${categoryKey}`)
        }
      } catch (error) {
        // Ignore errors for non-existent keys
      }
    }

    // Revalidate paths
    try {
      revalidatePath("/automotive-services")
      revalidatePath("/admin/businesses")
      revalidatePath("/admin/redis-structure")
      details.push("Revalidated application paths")
    } catch (error) {
      details.push(`Warning: Error revalidating paths: ${getErrorMessage(error)}`)
    }

    const summary = `Aggressive cleanup completed: removed ${removedBusinesses.length} businesses, deleted ${deletedCorruptedKeys.length} corrupted keys, cleaned ${cleanedEmptyCategories} empty indexes`

    return {
      success: true,
      message: summary,
      details,
      removedBusinesses,
      deletedCorruptedKeys,
    }
  } catch (error) {
    return {
      success: false,
      message: "Aggressive cleanup operation failed",
      details: [...details, `Error: ${getErrorMessage(error)}`],
      removedBusinesses,
      deletedCorruptedKeys,
    }
  }
}
