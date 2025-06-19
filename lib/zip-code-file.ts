/**
 * File-based ZIP code database
 * Stores ZIP codes in JSON files for persistence
 */

import fs from "fs/promises"
import path from "path"
import type { ZipCodeData, ZipCodeSearchParams, ZipCodeImportStats } from "./zip-code-types"

// Define the directory where ZIP code data will be stored
const DATA_DIR = path.join(process.cwd(), "data", "zip-codes")
const INDEX_FILE = path.join(DATA_DIR, "index.json")
const ZIP_DATA_FILE = path.join(DATA_DIR, "zip-data.json")
const STATE_INDEX_DIR = path.join(DATA_DIR, "states")

// Type definitions for our index files
interface ZipCodeIndex {
  count: number
  lastUpdated: string
  states: Record<string, number> // state -> count
}

/**
 * Initialize the data directory structure
 */
async function initializeDataDir(): Promise<void> {
  try {
    console.log(`Creating directory: ${DATA_DIR}`)
    // Create the main data directory if it doesn't exist
    await fs.mkdir(DATA_DIR, { recursive: true })
    console.log(`Directory created or already exists: ${DATA_DIR}`)

    console.log(`Creating directory: ${STATE_INDEX_DIR}`)
    // Create the state index directory if it doesn't exist
    await fs.mkdir(STATE_INDEX_DIR, { recursive: true })
    console.log(`Directory created or already exists: ${STATE_INDEX_DIR}`)

    // Check if the index file exists, create it if not
    try {
      await fs.access(INDEX_FILE)
      console.log(`Index file exists: ${INDEX_FILE}`)
    } catch (error) {
      // Create an empty index file
      console.log(`Creating index file: ${INDEX_FILE}`)
      const emptyIndex: ZipCodeIndex = {
        count: 0,
        lastUpdated: new Date().toISOString(),
        states: {},
      }
      await fs.writeFile(INDEX_FILE, JSON.stringify(emptyIndex, null, 2))
      console.log(`Index file created: ${INDEX_FILE}`)
    }

    // Check if the ZIP data file exists, create it if not
    try {
      await fs.access(ZIP_DATA_FILE)
      console.log(`ZIP data file exists: ${ZIP_DATA_FILE}`)
    } catch (error) {
      // Create an empty ZIP data file
      console.log(`Creating ZIP data file: ${ZIP_DATA_FILE}`)
      await fs.writeFile(ZIP_DATA_FILE, JSON.stringify({}, null, 2))
      console.log(`ZIP data file created: ${ZIP_DATA_FILE}`)
    }
  } catch (error) {
    console.error("Error initializing ZIP code data directory:", error)
    throw error
  }
}

/**
 * Get the index file data
 */
async function getIndex(): Promise<ZipCodeIndex> {
  try {
    await initializeDataDir()
    const data = await fs.readFile(INDEX_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading ZIP code index:", error)
    return { count: 0, lastUpdated: new Date().toISOString(), states: {} }
  }
}

/**
 * Update the index file
 */
async function updateIndex(index: ZipCodeIndex): Promise<void> {
  try {
    await initializeDataDir()
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2))
  } catch (error) {
    console.error("Error updating ZIP code index:", error)
    throw error
  }
}

/**
 * Get all ZIP codes
 */
async function getAllZipCodes(): Promise<Record<string, ZipCodeData>> {
  try {
    await initializeDataDir()
    const data = await fs.readFile(ZIP_DATA_FILE, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    console.error("Error reading ZIP code data:", error)
    return {}
  }
}

/**
 * Save all ZIP codes
 */
async function saveAllZipCodes(zipCodes: Record<string, ZipCodeData>): Promise<void> {
  try {
    await initializeDataDir()
    console.log(`Saving ZIP codes to file: ${ZIP_DATA_FILE}`)
    console.log(`Total ZIP codes to save: ${Object.keys(zipCodes).length}`)

    // Convert to JSON with pretty formatting
    const jsonData = JSON.stringify(zipCodes, null, 2)
    console.log(`JSON data size: ${jsonData.length} bytes`)

    // Write to file
    await fs.writeFile(ZIP_DATA_FILE, jsonData)
    console.log(`ZIP codes saved successfully to: ${ZIP_DATA_FILE}`)
  } catch (error) {
    console.error("Error saving ZIP code data:", error)
    throw error
  }
}

/**
 * Get state index file
 */
async function getStateIndex(state: string): Promise<string[]> {
  try {
    const stateFile = path.join(STATE_INDEX_DIR, `${state.toLowerCase()}.json`)

    try {
      await fs.access(stateFile)
      const data = await fs.readFile(stateFile, "utf-8")
      return JSON.parse(data)
    } catch (error) {
      // State file doesn't exist yet
      return []
    }
  } catch (error) {
    console.error(`Error reading state index for ${state}:`, error)
    return []
  }
}

/**
 * Save state index file
 */
async function saveStateIndex(state: string, zipCodes: string[]): Promise<void> {
  try {
    await initializeDataDir()
    const stateFile = path.join(STATE_INDEX_DIR, `${state.toLowerCase()}.json`)
    await fs.writeFile(stateFile, JSON.stringify(zipCodes, null, 2))
  } catch (error) {
    console.error(`Error saving state index for ${state}:`, error)
    throw error
  }
}

/**
 * Save a single ZIP code
 */
export async function saveZipCode(zipData: ZipCodeData): Promise<boolean> {
  try {
    // Ensure zipData has all required fields and proper types
    const sanitizedZipData = sanitizeZipData(zipData)

    // Get current ZIP codes
    const zipCodes = await getAllZipCodes()

    // Check if this ZIP code already exists
    const isUpdate = zipCodes[sanitizedZipData.zip] !== undefined

    // Add or update the ZIP code
    zipCodes[sanitizedZipData.zip] = sanitizedZipData

    // Save the updated ZIP codes
    await saveAllZipCodes(zipCodes)

    // Update the state index
    const state = sanitizedZipData.state
    const stateZips = await getStateIndex(state)

    if (!stateZips.includes(sanitizedZipData.zip)) {
      stateZips.push(sanitizedZipData.zip)
      await saveStateIndex(state, stateZips)
    }

    // Update the main index
    const index = await getIndex()

    if (!isUpdate) {
      index.count++

      // Update state count
      if (!index.states[state]) {
        index.states[state] = 1
      } else {
        index.states[state]++
      }
    }

    index.lastUpdated = new Date().toISOString()
    await updateIndex(index)

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

  console.log(`Starting import of ${zipCodes.length} ZIP codes`)

  // Get current ZIP codes
  const currentZipCodes = await getAllZipCodes()
  console.log(`Current ZIP codes in database: ${Object.keys(currentZipCodes).length}`)

  // Process all ZIP codes
  for (const zipData of zipCodes) {
    try {
      // Skip entries without a valid ZIP code
      if (!zipData.zip || (typeof zipData.zip !== "string" && typeof zipData.zip !== "number")) {
        stats.skipped++
        continue
      }

      // Sanitize the ZIP code data
      const sanitizedZipData = sanitizeZipData(zipData)

      // Add to the current ZIP codes
      currentZipCodes[sanitizedZipData.zip] = sanitizedZipData

      stats.imported++
    } catch (error) {
      stats.errors++
      console.error(`Error importing ZIP code ${zipData?.zip || "unknown"}:`, error)
    }
  }

  // Save all ZIP codes at once
  try {
    console.log(`Saving ${Object.keys(currentZipCodes).length} ZIP codes to database`)
    await saveAllZipCodes(currentZipCodes)
    console.log(`ZIP codes saved successfully`)

    // Update state indexes and main index
    const index = await getIndex()
    const stateMap: Record<string, string[]> = {}

    // Group ZIP codes by state
    Object.values(currentZipCodes).forEach((zipData) => {
      const state = zipData.state
      if (!stateMap[state]) {
        stateMap[state] = []
      }
      stateMap[state].push(zipData.zip)
    })

    // Save state indexes
    console.log(`Updating state indexes for ${Object.keys(stateMap).length} states`)
    for (const [state, zips] of Object.entries(stateMap)) {
      await saveStateIndex(state, zips)
      index.states[state] = zips.length
    }

    // Update main index
    index.count = Object.keys(currentZipCodes).length
    index.lastUpdated = new Date().toISOString()
    await updateIndex(index)
    console.log(`Index updated: ${index.count} ZIP codes`)
  } catch (error) {
    console.error("Error saving ZIP codes:", error)
    stats.errors += stats.imported
    stats.imported = 0
  }

  return stats
}

/**
 * Get a ZIP code by its code
 */
// export async function getZipCode(zip: string): Promise<ZipCodeData | null> {
//   try {
//     const zipCodes = await getAllZipCodes()
//     return zipCodes[zip] || null
//   } catch (error) {
//     console.error(`Error getting ZIP code ${zip}:`, error)
//     return null
//   }
// }

/**
 * Find ZIP codes within a radius
 */
// export async function findZipCodesInRadius(
//   centralZip: string,
//   radiusMiles: number,
//   limit = 100,
// ): Promise<ZipCodeData[]> {
//   try {
//     // Get the central ZIP code data
//     const centralZipData = await getZipCode(centralZip)
//     if (!centralZipData) {
//       throw new Error(`ZIP code ${centralZip} not found`)
//     }

//     // Get all ZIP codes
//     const zipCodes = await getAllZipCodes()
//     const allZipCodes = Object.values(zipCodes)

//     // Calculate distances and filter
//     const zipCodesWithDistance = allZipCodes.map((zipData) => {
//       const distance = haversineDistance(
//         centralZipData.latitude,
//         centralZipData.longitude,
//         zipData.latitude,
//         zipData.longitude,
//       )
//       return { zipData, distance }
//     })

//     // Sort by distance and take the closest ones within the radius
//     return zipCodesWithDistance
//       .filter(({ distance }) => distance <= radiusMiles)
//       .sort((a, b) => a.distance - b.distance)
//       .slice(0, limit)
//       .map(({ zipData, distance }) => {
//         // Add the distance to the ZIP code data
//         return { ...zipData, distance }
//       })
//   } catch (error) {
//     console.error(`Error finding ZIP codes in radius of ${centralZip}:`, error)
//     return []
//   }
// }

import type { ZipCodeData } from "@/lib/zip-code-types"
import { haversineDistance } from "@/lib/zip-code-utils"

// This is a fallback implementation when Blob storage is not available
// In a real implementation, this would read from a local file or database

const sampleZipCodes: Record<string, ZipCodeData> = {
  "90210": {
    zip: "90210",
    city: "Beverly Hills",
    state: "CA",
    latitude: 34.0901,
    longitude: -118.4065,
    country: "US",
  },
  "10001": {
    zip: "10001",
    city: "New York",
    state: "NY",
    latitude: 40.7505,
    longitude: -73.9934,
    country: "US",
  },
  "60601": {
    zip: "60601",
    city: "Chicago",
    state: "IL",
    latitude: 41.8825,
    longitude: -87.6441,
    country: "US",
  },
  "77001": {
    zip: "77001",
    city: "Houston",
    state: "TX",
    latitude: 29.7749,
    longitude: -95.389,
    country: "US",
  },
  "85001": {
    zip: "85001",
    city: "Phoenix",
    state: "AZ",
    latitude: 33.4484,
    longitude: -112.074,
    country: "US",
  },
}

/**
 * Find ZIP codes within a radius of a center ZIP code
 * This is a fallback implementation with sample data
 */
export async function findZipCodesInRadius(
  centerZip: string,
  radiusMiles: number,
  limit = 100,
): Promise<(ZipCodeData & { distance: number })[]> {
  console.log(`Fallback: Finding ZIP codes within ${radiusMiles} miles of ${centerZip}`)

  const centerZipData = sampleZipCodes[centerZip]
  if (!centerZipData) {
    console.log(`Fallback: Center ZIP ${centerZip} not found in sample data`)
    return []
  }

  const results: (ZipCodeData & { distance: number })[] = []

  // Calculate distances for all sample ZIP codes
  for (const zipData of Object.values(sampleZipCodes)) {
    const distance = haversineDistance(
      centerZipData.latitude,
      centerZipData.longitude,
      zipData.latitude,
      zipData.longitude,
    )

    if (distance <= radiusMiles) {
      results.push({ ...zipData, distance })
    }
  }

  // Sort by distance and limit results
  results.sort((a, b) => a.distance - b.distance)
  return results.slice(0, limit)
}

/**
 * Find a single ZIP code by ZIP code
 */
export async function findZipCode(zip: string): Promise<ZipCodeData | null> {
  console.log(`Fallback: Looking up ZIP code ${zip}`)
  return sampleZipCodes[zip] || null
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

    let filteredZipCodes: ZipCodeData[] = []

    // If searching by state, use the state index for efficiency
    if (params.state) {
      const stateZips = await getStateIndex(params.state)
      const zipCodes = await getAllZipCodes()

      filteredZipCodes = stateZips.map((zip) => zipCodes[zip]).filter((zipCode) => zipCode !== undefined)

      // Further filter by city if provided
      if (params.city) {
        filteredZipCodes = filteredZipCodes.filter(
          (zipCode) => zipCode.city.toLowerCase() === params.city?.toLowerCase(),
        )
      }
    }
    // If only searching by city (not recommended without state)
    else if (params.city) {
      const zipCodes = await getAllZipCodes()
      filteredZipCodes = Object.values(zipCodes).filter(
        (zipCode) => zipCode.city.toLowerCase() === params.city?.toLowerCase(),
      )
    }
    // If no filters, return all (up to limit)
    else {
      const zipCodes = await getAllZipCodes()
      filteredZipCodes = Object.values(zipCodes)
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
  try {
    const index = await getIndex()
    return {
      count: index.count,
      lastUpdated: index.lastUpdated,
    }
  } catch (error) {
    console.error("Error getting ZIP code metadata:", error)
    return { count: 0, lastUpdated: "" }
  }
}

/**
 * Get a list of all states with ZIP code counts
 */
export async function getStatesList(): Promise<{ state: string; count: number }[]> {
  try {
    const index = await getIndex()
    return Object.entries(index.states).map(([state, count]) => ({
      state,
      count,
    }))
  } catch (error) {
    console.error("Error getting states list:", error)
    return []
  }
}
