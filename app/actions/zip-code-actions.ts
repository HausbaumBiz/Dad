"use server"

import { kv } from "@/lib/redis"
import { getCurrentBusiness } from "./business-actions"
import type { ZipCodeData } from "@/lib/zip-code-types"

// Save ZIP codes for a business
export async function saveBusinessZipCodes(zipCodes: ZipCodeData[] | null | undefined, isNationwide: boolean) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Ensure zipCodes is an array
    const zipCodesArray = Array.isArray(zipCodes) ? zipCodes : []

    // Extract just the ZIP code strings for set storage
    const zipCodeStrings = zipCodesArray.map((z) => z.zip)

    // Store the full ZIP code data as JSON for detailed information
    await kv.set(`business:${business.id}:zipcodes`, JSON.stringify(zipCodesArray))

    // Also store as a set for efficient lookups
    if (zipCodeStrings.length > 0) {
      // First delete any existing set to avoid duplicates
      await kv.del(`business:${business.id}:zipcodes:set`)
      // Then add all zip codes to the set
      await kv.sadd(`business:${business.id}:zipcodes:set`, ...zipCodeStrings)
    }

    // Store nationwide flag
    await kv.set(`business:${business.id}:nationwide`, isNationwide)

    // For each zip code, add this business to the zip code's business set
    if (!isNationwide && zipCodeStrings.length > 0) {
      for (const zip of zipCodeStrings) {
        await kv.sadd(`zipcode:${zip}:businesses`, business.id)
      }
    }

    // If nationwide, add to the nationwide businesses set
    if (isNationwide) {
      await kv.sadd("businesses:nationwide", business.id)
    } else {
      // Remove from nationwide set if not nationwide
      await kv.srem("businesses:nationwide", business.id)
    }

    return { success: true, message: "ZIP codes saved successfully" }
  } catch (error) {
    console.error("Error saving business ZIP codes:", error)
    return { success: false, message: `Failed to save ZIP codes: ${error}` }
  }
}

// Get ZIP codes for a business
export async function getBusinessZipCodes(): Promise<{
  success: boolean
  data?: { zipCodes: ZipCodeData[]; isNationwide: boolean }
  message?: string
}> {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Get nationwide flag
    const isNationwide = (await kv.get(`business:${business.id}:nationwide`)) || false

    // Try to get ZIP codes from JSON storage first (has full details)
    let zipCodesData = await kv.get(`business:${business.id}:zipcodes`)
    let parsedZipCodes: ZipCodeData[] = []

    if (zipCodesData) {
      // Parse JSON data if it exists
      if (typeof zipCodesData === "string") {
        try {
          parsedZipCodes = JSON.parse(zipCodesData)
        } catch (parseError) {
          console.error("Error parsing ZIP codes JSON:", parseError)
          // If JSON parsing fails, we'll try the set approach below
          zipCodesData = null
        }
      } else if (Array.isArray(zipCodesData)) {
        parsedZipCodes = zipCodesData as ZipCodeData[]
      }
    }

    // If we couldn't get ZIP codes from JSON, try the set approach
    if (!zipCodesData || parsedZipCodes.length === 0) {
      try {
        const zipCodeStrings = await kv.smembers(`business:${business.id}:zipcodes:set`)
        if (zipCodeStrings && zipCodeStrings.length > 0) {
          // Convert simple strings to ZipCodeData objects
          parsedZipCodes = zipCodeStrings.map((zip) => ({
            zip,
            // These fields will be empty but that's OK for now
            city: "",
            state: "",
            latitude: 0,
            longitude: 0,
          }))
        }
      } catch (setError) {
        console.error("Error getting ZIP codes from set:", setError)
      }
    }

    return {
      success: true,
      data: {
        zipCodes: parsedZipCodes,
        isNationwide: Boolean(isNationwide),
      },
    }
  } catch (error) {
    console.error("Error getting business ZIP codes:", error)
    return { success: false, message: "Failed to retrieve ZIP codes" }
  }
}

// Get ZIP codes for a specific business (admin function)
export async function getBusinessZipCodesById(businessId: string): Promise<{
  success: boolean
  data?: { zipCodes: ZipCodeData[]; isNationwide: boolean }
  message?: string
}> {
  try {
    if (!businessId) {
      return { success: false, message: "Business ID is required" }
    }

    // Get nationwide flag
    const isNationwide = (await kv.get(`business:${businessId}:nationwide`)) || false

    // Try to get ZIP codes from JSON storage first (has full details)
    let zipCodesData = await kv.get(`business:${businessId}:zipcodes`)
    let parsedZipCodes: ZipCodeData[] = []

    if (zipCodesData) {
      // Parse JSON data if it exists
      if (typeof zipCodesData === "string") {
        try {
          parsedZipCodes = JSON.parse(zipCodesData)
        } catch (parseError) {
          console.error("Error parsing ZIP codes JSON:", parseError)
          // If JSON parsing fails, we'll try the set approach below
          zipCodesData = null
        }
      } else if (Array.isArray(zipCodesData)) {
        parsedZipCodes = zipCodesData as ZipCodeData[]
      }
    }

    // If we couldn't get ZIP codes from JSON, try the set approach
    if (!zipCodesData || parsedZipCodes.length === 0) {
      try {
        const zipCodeStrings = await kv.smembers(`business:${businessId}:zipcodes:set`)
        if (zipCodeStrings && zipCodeStrings.length > 0) {
          // Convert simple strings to ZipCodeData objects
          parsedZipCodes = zipCodeStrings.map((zip) => ({
            zip,
            // These fields will be empty but that's OK for now
            city: "",
            state: "",
            latitude: 0,
            longitude: 0,
          }))
        }
      } catch (setError) {
        console.error("Error getting ZIP codes from set:", setError)
      }
    }

    return {
      success: true,
      data: {
        zipCodes: parsedZipCodes,
        isNationwide: Boolean(isNationwide),
      },
    }
  } catch (error) {
    console.error(`Error getting ZIP codes for business ${businessId}:`, error)
    return { success: false, message: "Failed to retrieve ZIP codes" }
  }
}
