/**
 * In-memory ZIP code database (temporary solution)
 */

import type { ZipCodeData, ZipCodeSearchParams, ZipCodeImportStats } from "./zip-code-types"
import { haversineDistance } from "./zip-code-utils"

// In-memory storage
const zipCodeStore: Map<string, ZipCodeData> = new Map()
let lastUpdated = ""

/**
 * Save a single ZIP code to the in-memory store
 */
export async function saveZipCode(zipData: ZipCodeData): Promise<boolean> {
  try {
    // Ensure zipData has all required fields and proper types
    const sanitizedZipData = sanitizeZipData(zipData)

    // Store the ZIP code data
    zipCodeStore.set(sanitizedZipData.zip, sanitizedZipData)
    lastUpdated = new Date().toISOString()

    return true
  } catch (error) {
    console.error(`Error saving ZIP code ${zipData.zip}:`, error)
    return false
  }
}

/**
 * Sanitize ZIP code data to ensure it has the correct format and types
 */
function sanitizeZipData(zipData: any): ZipCodeData {
  // Create a new object with default values
  const sanitized: ZipCodeData = {
    zip: String(zipData.zip || zipData.zipCode || ""),
    city: String(zipData.city || ""),
    state: String(zipData.state || zipData.state_name || ""),
    latitude: 0,
    longitude: 0,
  }

  // Try to parse latitude and longitude as numbers
  if (zipData.latitude !== undefined) {
    const lat = Number(zipData.latitude)
    sanitized.latitude = !isNaN(lat) ? lat : 0
  } else if (zipData.lat !== undefined) {
    const lat = Number(zipData.lat)
    sanitized.latitude = !isNaN(lat) ? lat : 0
  }

  if (zipData.longitude !== undefined) {
    const lng = Number(zipData.longitude)
    sanitized.longitude = !isNaN(lng) ? lng : 0
  } else if (zipData.lng !== undefined) {
    const lng = Number(zipData.lng)
    sanitized.longitude = !isNaN(lng) ? lng : 0
  }

  // Add optional fields if they exist
  if (zipData.county) sanitized.county = String(zipData.county)
  if (zipData.timezone) sanitized.timezone = String(zipData.timezone)
  if (zipData.population !== undefined) {
    const pop = Number(zipData.population)
    if (!isNaN(pop)) sanitized.population = pop
  }
  if (zipData.country) sanitized.country = String(zipData.country)

  return sanitized
}

/**
 * Bulk import ZIP codes
 */
export async function importZipCodes(zipCodes: ZipCodeData[]): Promise<ZipCodeImportStats> {
  const stats: ZipCodeImportStats = {
    total: zipCodes.length,
    imported: 0,
    skipped: 0,
    errors: 0,
  }

  // Process in batches
  const BATCH_SIZE = 100

  for (let i = 0; i < zipCodes.length; i += BATCH_SIZE) {
    const batch = zipCodes.slice(i, i + BATCH_SIZE)
    const promises = batch.map(async (zipData) => {
      try {
        // Skip entries without a valid ZIP code
        if (!zipData.zip || (typeof zipData.zip !== "string" && typeof zipData.zip !== "number")) {
          stats.skipped++
          return
        }

        const success = await saveZipCode(zipData)
        if (success) {
          stats.imported++
        } else {
          stats.skipped++
        }
      } catch (error) {
        stats.errors++
        console.error(`Error importing ZIP code ${zipData?.zip || "unknown"}:`, error)
      }
    })

    await Promise.all(promises)
  }

  return stats
}

/**
 * Get a ZIP code by its code
 */
export async function getZipCode(zip: string): Promise<ZipCodeData | null> {
  try {
    return zipCodeStore.get(zip) || null
  } catch (error) {
    console.error(`Error getting ZIP code ${zip}:`, error)
    return null
  }
}

/**
 * Find ZIP codes within a radius
 */
export async function findZipCodesInRadius(
  centralZip: string,
  radiusMiles: number,
  limit = 100,
): Promise<ZipCodeData[]> {
  try {
    // Get the central ZIP code data
    const centralZipData = await getZipCode(centralZip)
    if (!centralZipData) {
      throw new Error(`ZIP code ${centralZip} not found`)
    }

    // Get all ZIP codes
    const allZipCodes = Array.from(zipCodeStore.values())

    // Calculate distances and filter
    const zipCodesWithDistance = allZipCodes.map((zipData) => {
      const distance = haversineDistance(
        centralZipData.latitude,
        centralZipData.longitude,
        zipData.latitude,
        zipData.longitude,
      )
      return { zipData, distance }
    })

    // Sort by distance and take the closest ones within the radius
    return zipCodesWithDistance
      .filter(({ distance }) => distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(({ zipData, distance }) => {
        // Add the distance to the ZIP code data
        return { ...zipData, distance }
      })
  } catch (error) {
    console.error(`Error finding ZIP codes in radius of ${centralZip}:`, error)
    return []
  }
}

/**
 * Search ZIP codes by various criteria
 */
export async function searchZipCodes(params: ZipCodeSearchParams): Promise<ZipCodeData[]> {
  try {
    // If searching by radius
    if (params.radius) {
      return findZipCodesInRadius(params.radius.zip, params.radius.miles, params.limit || 100)
    }

    // Get all ZIP codes and filter them
    const allZipCodes = Array.from(zipCodeStore.values())

    let filteredZipCodes = allZipCodes

    // Filter by state if provided
    if (params.state) {
      filteredZipCodes = filteredZipCodes.filter(
        (zipCode) => zipCode.state.toLowerCase() === params.state?.toLowerCase(),
      )

      // Further filter by city if provided
      if (params.city) {
        filteredZipCodes = filteredZipCodes.filter(
          (zipCode) => zipCode.city.toLowerCase() === params.city?.toLowerCase(),
        )
      }
    }
    // If only searching by city (not recommended without state)
    else if (params.city) {
      filteredZipCodes = filteredZipCodes.filter((zipCode) => zipCode.city.toLowerCase() === params.city?.toLowerCase())
    }

    // Apply limit
    if (params.limit && filteredZipCodes.length > params.limit) {
      filteredZipCodes = filteredZipCodes.slice(0, params.limit)
    }

    return filteredZipCodes
  } catch (error) {
    console.error("Error searching ZIP codes:", error)
    return []
  }
}

/**
 * Get metadata about the ZIP code database
 */
export async function getZipCodeMetadata(): Promise<{ count: number; lastUpdated: string }> {
  return {
    count: zipCodeStore.size,
    lastUpdated: lastUpdated,
  }
}
