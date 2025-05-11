import Papa from "papaparse"

// Define the structure of a zip code record from the CSV
interface ZipCodeRecord {
  zip: string
  city: string
  state_id: string
  state_name: string
  county_fips: string
  county_name: string
  lat: string
  lng: string
  timezone: string
  radius_in_miles: string
  area_code: string
  population: string
  density: string
  county_weights: string
  county_names_all: string
  county_fips_all: string
  imprecise: string
  military: string
  timezone_offset: string
}

// Cache the parsed CSV data to avoid repeated fetching
let csvDataCache: Map<string, ZipCodeRecord> | null = null
let lastFetchTime = 0
const CACHE_TTL = 3600000 // 1 hour in milliseconds

/**
 * Fetches and parses the ZIP code CSV file from blob storage
 */
async function fetchAndParseCsv(): Promise<Map<string, ZipCodeRecord>> {
  const now = Date.now()

  // Return cached data if it's still valid
  if (csvDataCache && now - lastFetchTime < CACHE_TTL) {
    console.log("Using cached ZIP code data")
    return csvDataCache
  }

  console.log("Fetching ZIP code CSV from blob storage...")

  try {
    const response = await fetch(
      "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/uszips11-0iYnSKUBgC7Dm6DtxL3bXwFzHgh6Qe.csv",
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`)
    }

    const csvText = await response.text()

    // Parse the CSV
    const results = Papa.parse<ZipCodeRecord>(csvText, {
      header: true,
      skipEmptyLines: true,
    })

    if (results.errors && results.errors.length > 0) {
      console.warn("CSV parsing had errors:", results.errors)
    }

    // Create a map for fast lookups
    const zipCodeMap = new Map<string, ZipCodeRecord>()

    results.data.forEach((record) => {
      if (record.zip) {
        zipCodeMap.set(record.zip, record)
      }
    })

    console.log(`Parsed ${zipCodeMap.size} ZIP codes from CSV`)

    // Update the cache
    csvDataCache = zipCodeMap
    lastFetchTime = now

    return zipCodeMap
  } catch (error) {
    console.error("Error fetching or parsing ZIP code CSV:", error)
    throw error
  }
}

/**
 * Looks up a ZIP code in the CSV data and returns city and state information
 */
export async function lookupZipCodeFromCsv(zipCode: string): Promise<{ city: string; state: string } | null> {
  try {
    if (!zipCode) return null

    // Normalize the ZIP code (remove spaces, ensure 5 digits)
    const normalizedZip = zipCode.trim().slice(0, 5)

    if (normalizedZip.length !== 5 || !/^\d+$/.test(normalizedZip)) {
      console.warn(`Invalid ZIP code format: ${zipCode}`)
      return null
    }

    const zipCodeMap = await fetchAndParseCsv()
    const record = zipCodeMap.get(normalizedZip)

    if (!record) {
      console.warn(`ZIP code not found in CSV: ${normalizedZip}`)
      return null
    }

    return {
      city: record.city,
      state: record.state_id,
    }
  } catch (error) {
    console.error(`Error looking up ZIP code ${zipCode}:`, error)
    return null
  }
}
