/**
 * ZIP code database utilities using Vercel KV (Redis)
 */

import { kv } from "@/lib/redis"
import type { ZipCodeData, ZipCodeSearchParams, ZipCodeImportStats } from "./zip-code-types"
import { haversineDistance } from "./zip-code-utils"

// Key prefixes for Redis
const ZIP_KEY_PREFIX = "zip:"
const ZIP_GEO_KEY = "zip:geo"
const ZIP_INDEX_STATE = "zip:index:state:"
const ZIP_INDEX_CITY = "zip:index:city:"
const ZIP_META_KEY = "zip:meta"

/**
 * Save a single ZIP code to the database
 */
export async function saveZipCode(zipData: ZipCodeData): Promise<boolean> {
  try {
    // Store the ZIP code data
    await kv.set(`${ZIP_KEY_PREFIX}${zipData.zip}`, JSON.stringify(zipData))

    // Add to geospatial index if coordinates are valid
    if (isValidCoordinate(zipData.latitude, zipData.longitude)) {
      await kv.geoadd(ZIP_GEO_KEY, zipData.longitude, zipData.latitude, zipData.zip)
    }

    // Add to state index
    if (zipData.state) {
      await kv.sadd(`${ZIP_INDEX_STATE}${zipData.state}`, zipData.zip)
    }

    // Add to city index
    if (zipData.city) {
      const cityKey = `${zipData.city.toLowerCase()}_${zipData.state?.toLowerCase() || ""}`
      await kv.sadd(`${ZIP_INDEX_CITY}${cityKey}`, zipData.zip)
    }

    return true
  } catch (error) {
    console.error(`Error saving ZIP code ${zipData.zip}:`, error)
    return false
  }
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

  // Process in batches to avoid overwhelming Redis
  const BATCH_SIZE = 100

  for (let i = 0; i < zipCodes.length; i += BATCH_SIZE) {
    const batch = zipCodes.slice(i, i + BATCH_SIZE)
    const promises = batch.map(async (zipData) => {
      try {
        const success = await saveZipCode(zipData)
        if (success) {
          stats.imported++
        } else {
          stats.skipped++
        }
      } catch (error) {
        stats.errors++
        console.error(`Error importing ZIP code ${zipData.zip}:`, error)
      }
    })

    await Promise.all(promises)
  }

  // Update metadata
  await updateZipCodeMetadata()

  return stats
}

/**
 * Get a ZIP code by its code
 */
export async function getZipCode(zip: string): Promise<ZipCodeData | null> {
  try {
    const data = await kv.get(`${ZIP_KEY_PREFIX}${zip}`)
    return data ? JSON.parse(data as string) : null
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

    // Convert miles to kilometers for Redis GEORADIUS (Redis uses km)
    const radiusKm = radiusMiles * 1.60934

    // Use Redis GEORADIUS to find ZIP codes within the radius
    const zipCodesInRadius = await kv.georadius(
      ZIP_GEO_KEY,
      centralZipData.longitude,
      centralZipData.latitude,
      radiusKm,
      "km",
      "COUNT",
      limit,
    )

    // Get the full data for each ZIP code
    const zipDataPromises = (zipCodesInRadius as string[]).map((zip) => getZipCode(zip))
    const zipData = await Promise.all(zipDataPromises)

    // Filter out any null results
    return zipData.filter(Boolean) as ZipCodeData[]
  } catch (error) {
    console.error(`Error finding ZIP codes in radius of ${centralZip}:`, error)

    // Fallback to manual calculation if geospatial commands fail
    return findZipCodesInRadiusManual(centralZip, radiusMiles, limit)
  }
}

/**
 * Manual fallback for finding ZIP codes within a radius
 * This is slower but works if Redis geospatial commands are unavailable
 */
async function findZipCodesInRadiusManual(
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

    // Get all ZIP codes (this could be optimized to get only those in a bounding box)
    const allZipCodes = await getAllZipCodes()

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
      .map(({ zipData }) => zipData)
  } catch (error) {
    console.error(`Error in manual radius search for ${centralZip}:`, error)
    return []
  }
}

/**
 * Get all ZIP codes (use with caution - this could be a large dataset)
 */
async function getAllZipCodes(): Promise<ZipCodeData[]> {
  try {
    // Get all keys matching the ZIP code pattern
    const keys = await kv.keys(`${ZIP_KEY_PREFIX}*`)

    // Get data for each key
    const zipDataPromises = keys.map(async (key) => {
      const data = await kv.get(key)
      return data ? JSON.parse(data as string) : null
    })

    const zipData = await Promise.all(zipDataPromises)

    // Filter out any null results
    return zipData.filter(Boolean) as ZipCodeData[]
  } catch (error) {
    console.error("Error getting all ZIP codes:", error)
    return []
  }
}

/**
 * Search ZIP codes by various criteria
 */
export async function searchZipCodes(params: ZipCodeSearchParams): Promise<ZipCodeData[]> {
  try {
    let zipCodes: string[] = []

    // If searching by radius
    if (params.radius) {
      const zipCodesInRadius = await findZipCodesInRadius(params.radius.zip, params.radius.miles, params.limit || 100)
      return zipCodesInRadius
    }

    // If searching by state
    if (params.state) {
      const stateZips = await kv.smembers(`${ZIP_INDEX_STATE}${params.state}`)
      zipCodes = stateZips as string[]

      // Further filter by city if provided
      if (params.city && zipCodes.length > 0) {
        const cityKey = `${params.city.toLowerCase()}_${params.state.toLowerCase()}`
        const cityZips = await kv.smembers(`${ZIP_INDEX_CITY}${cityKey}`)
        zipCodes = zipCodes.filter((zip) => (cityZips as string[]).includes(zip))
      }
    }
    // If only searching by city (not recommended without state)
    else if (params.city) {
      // This would need to search across all state+city combinations
      // Not implemented for efficiency reasons
      return []
    }

    // Apply limit
    if (params.limit && zipCodes.length > params.limit) {
      zipCodes = zipCodes.slice(0, params.limit)
    }

    // Get full data for each ZIP code
    const zipDataPromises = zipCodes.map((zip) => getZipCode(zip))
    const zipData = await Promise.all(zipDataPromises)

    // Filter out any null results
    return zipData.filter(Boolean) as ZipCodeData[]
  } catch (error) {
    console.error("Error searching ZIP codes:", error)
    return []
  }
}

/**
 * Update metadata about the ZIP code database
 */
async function updateZipCodeMetadata(): Promise<void> {
  try {
    const keys = await kv.keys(`${ZIP_KEY_PREFIX}*`)
    const zipCount = keys.length

    const metadata = {
      count: zipCount,
      lastUpdated: new Date().toISOString(),
    }

    await kv.set(ZIP_META_KEY, JSON.stringify(metadata))
  } catch (error) {
    console.error("Error updating ZIP code metadata:", error)
  }
}

/**
 * Get metadata about the ZIP code database
 */
export async function getZipCodeMetadata(): Promise<{ count: number; lastUpdated: string }> {
  try {
    const data = await kv.get(ZIP_META_KEY)
    return data ? JSON.parse(data as string) : { count: 0, lastUpdated: "" }
  } catch (error) {
    console.error("Error getting ZIP code metadata:", error)
    return { count: 0, lastUpdated: "" }
  }
}

/**
 * Check if coordinates are valid
 */
function isValidCoordinate(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}
