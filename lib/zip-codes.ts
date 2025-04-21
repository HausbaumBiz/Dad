import { kv } from "@/lib/redis"

export interface ZipCodeData {
  zipCode: string
  city: string
  state: string
  latitude: number
  longitude: number
  county?: string
  timezone?: string
  stateCode?: string
}

// Key prefixes for Redis
const ZIP_DATA_PREFIX = "zip:data:"
const ZIP_GEO_SET = "zip:geo"

/**
 * Save a ZIP code to the database
 */
export async function saveZipCode(zipData: ZipCodeData): Promise<boolean> {
  try {
    // Store the ZIP code data as a hash
    await kv.hset(`${ZIP_DATA_PREFIX}${zipData.zipCode}`, {
      city: zipData.city,
      state: zipData.state,
      county: zipData.county || "",
      timezone: zipData.timezone || "",
      stateCode: zipData.stateCode || "",
    })

    // Add the ZIP code to the geospatial index
    await kv.geoadd(ZIP_GEO_SET, {
      longitude: zipData.longitude,
      latitude: zipData.latitude,
      member: zipData.zipCode,
    })

    return true
  } catch (error) {
    console.error("Error saving ZIP code:", error)
    return false
  }
}

/**
 * Get ZIP code data by ZIP code
 */
export async function getZipCodeData(zipCode: string): Promise<ZipCodeData | null> {
  try {
    // Get the ZIP code data
    const zipData = await kv.hgetall(`${ZIP_DATA_PREFIX}${zipCode}`)
    if (!zipData || Object.keys(zipData).length === 0) {
      return null
    }

    // Get the coordinates
    const geoPos = await kv.geopos(ZIP_GEO_SET, zipCode)
    if (!geoPos || geoPos.length === 0 || !geoPos[0]) {
      return null
    }

    return {
      zipCode,
      city: zipData.city as string,
      state: zipData.state as string,
      county: zipData.county as string,
      timezone: zipData.timezone as string,
      stateCode: zipData.stateCode as string,
      longitude: geoPos[0][0],
      latitude: geoPos[0][1],
    }
  } catch (error) {
    console.error("Error getting ZIP code data:", error)
    return null
  }
}

/**
 * Find ZIP codes within a radius of a given ZIP code
 */
export async function findZipCodesInRadius(zipCode: string, radiusMiles: number, limit = 100): Promise<ZipCodeData[]> {
  try {
    // Get the ZIP codes within the radius
    const results = await kv.georadius(ZIP_GEO_SET, zipCode, radiusMiles, "mi", { withCoord: true, count: limit })

    if (!results || results.length === 0) {
      return []
    }

    // Get the data for each ZIP code
    const zipCodes: ZipCodeData[] = []
    for (const result of results) {
      const zipData = await getZipCodeData(result[0])
      if (zipData) {
        zipCodes.push(zipData)
      }
    }

    return zipCodes
  } catch (error) {
    console.error("Error finding ZIP codes in radius:", error)
    return []
  }
}

/**
 * Check if the ZIP code database is initialized
 */
export async function isZipDatabaseInitialized(): Promise<boolean> {
  try {
    const count = await kv.zcard(ZIP_GEO_SET)
    return count > 0
  } catch (error) {
    console.error("Error checking ZIP database:", error)
    return false
  }
}

/**
 * Get the count of ZIP codes in the database
 */
export async function getZipCodeCount(): Promise<number> {
  try {
    return await kv.zcard(ZIP_GEO_SET)
  } catch (error) {
    console.error("Error getting ZIP code count:", error)
    return 0
  }
}
