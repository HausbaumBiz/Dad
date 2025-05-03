import { type NextRequest, NextResponse } from "next/server"
import type { ZipCodeData } from "@/lib/zip-code-types"
import { list } from "@vercel/blob"
import { haversineDistance } from "@/lib/zip-code-utils"
import { findZipCodesInRadius } from "@/lib/zip-code-file" // Fallback to file-based storage

export const dynamic = "force-dynamic" // Fixed: Changed from force_dynamic to force-dynamic

// Cache for ZIP code data to avoid fetching from Blob storage on every request
let zipCodeCache: Record<string, ZipCodeData> | null = null
let cacheLastUpdated = 0
const CACHE_TTL = 3600000 // 1 hour in milliseconds
const CSV_BLOB_URL =
  "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/uszips11-0iYnSKUBgC7Dm6DtxL3bXwFzHgh6Qe.csv"

async function getZipCodeData(): Promise<Record<string, ZipCodeData> | null> {
  // Return cached data if it's still valid
  if (zipCodeCache && Date.now() - cacheLastUpdated < CACHE_TTL) {
    return zipCodeCache
  }

  try {
    // First try to find the JSON file in Blob storage
    const { blobs } = await list({ prefix: "data/zip-codes/" })
    const zipDataBlob = blobs.find((blob) => blob.pathname === "data/zip-codes/zip-data.json")

    if (zipDataBlob) {
      // Fetch the ZIP code data from the blob URL
      const response = await fetch(zipDataBlob.url)

      if (response.ok) {
        const zipCodes = await response.json()

        // Update the cache
        zipCodeCache = zipCodes
        cacheLastUpdated = Date.now()

        return zipCodes
      }
    }

    // If JSON file not found or couldn't be fetched, try the CSV file
    console.log("JSON file not found in Blob storage, trying CSV file...")

    // Fetch the CSV file
    const csvResponse = await fetch(CSV_BLOB_URL)

    if (!csvResponse.ok) {
      console.error(`Failed to fetch CSV file: ${csvResponse.statusText}`)
      return null
    }

    const csvText = await csvResponse.text()
    const zipCodes = parseCSVToZipCodeMap(csvText)

    // Update the cache
    zipCodeCache = zipCodes
    cacheLastUpdated = Date.now()

    return zipCodes
  } catch (error) {
    console.error("Error fetching ZIP code data from Blob storage:", error)
    return null
  }
}

// Parse CSV to a map of ZIP codes
function parseCSVToZipCodeMap(csv: string): Record<string, ZipCodeData> {
  const zipCodes: Record<string, ZipCodeData> = {}

  // Trim the input to remove any leading/trailing whitespace
  const trimmedCsv = csv.trim()

  if (!trimmedCsv) {
    return zipCodes
  }

  // Split by newlines, handling different line endings
  const lines = trimmedCsv.split(/\r?\n/)

  if (lines.length < 2) {
    return zipCodes
  }

  // Parse header row, trimming each header
  const headers = lines[0].split(",").map((h) => h.trim())

  // Find the indices of required columns
  const zipIndex = headers.findIndex(
    (h) =>
      h.toLowerCase() === "zip" ||
      h.toLowerCase() === "zipcode" ||
      h.toLowerCase() === "postal_code" ||
      h.toLowerCase() === "zip_code",
  )

  const latIndex = headers.findIndex((h) => h.toLowerCase() === "lat" || h.toLowerCase() === "latitude")

  const lngIndex = headers.findIndex(
    (h) => h.toLowerCase() === "lng" || h.toLowerCase() === "long" || h.toLowerCase() === "longitude",
  )

  const cityIndex = headers.findIndex((h) => h.toLowerCase() === "city")
  const stateIndex = headers.findIndex(
    (h) => h.toLowerCase() === "state" || h.toLowerCase() === "state_id" || h.toLowerCase() === "state_name",
  )
  const countyIndex = headers.findIndex((h) => h.toLowerCase() === "county")

  // Skip if we can't find the required columns
  if (zipIndex === -1 || latIndex === -1 || lngIndex === -1 || cityIndex === -1 || stateIndex === -1) {
    console.error("CSV is missing required columns")
    return zipCodes
  }

  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    // Split the line by comma
    const values = line.split(",").map((v) => v.trim())

    // Skip if we don't have enough values
    if (values.length <= Math.max(zipIndex, latIndex, lngIndex, cityIndex, stateIndex)) {
      continue
    }

    const zip = values[zipIndex]
    const latitude = Number.parseFloat(values[latIndex])
    const longitude = Number.parseFloat(values[lngIndex])
    const city = values[cityIndex]
    const state = values[stateIndex]

    // Skip if any required field is missing or invalid
    if (!zip || isNaN(latitude) || isNaN(longitude) || !city || !state) {
      continue
    }

    // Create the ZIP code object
    const zipCode: ZipCodeData = {
      zip,
      latitude,
      longitude,
      city,
      state,
      country: "US", // Default to US
    }

    // Add county if available
    if (countyIndex !== -1 && values[countyIndex]) {
      zipCode.county = values[countyIndex]
    }

    // Add to the map
    zipCodes[zip] = zipCode
  }

  return zipCodes
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zip = searchParams.get("zip")
    const radiusStr = searchParams.get("radius")
    const limitStr = searchParams.get("limit")

    if (!zip) {
      return NextResponse.json({ error: "ZIP code is required" }, { status: 400 })
    }

    if (!radiusStr) {
      return NextResponse.json({ error: "Radius is required" }, { status: 400 })
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "Invalid ZIP code format. Must be 5 digits." }, { status: 400 })
    }

    const radius = Number.parseFloat(radiusStr)
    const limit = limitStr ? Number.parseInt(limitStr, 10) : 100

    if (isNaN(radius) || radius <= 0) {
      return NextResponse.json({ error: "Radius must be a positive number" }, { status: 400 })
    }

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: "Limit must be a positive number" }, { status: 400 })
    }

    // Try to get ZIP code data from Blob storage first
    const zipCodes = await getZipCodeData()

    if (zipCodes) {
      // If we have data from Blob storage, use it
      const centralZipData = zipCodes[zip]

      if (!centralZipData) {
        return NextResponse.json({ error: `ZIP code ${zip} not found in Blob storage` }, { status: 404 })
      }

      // Calculate distances and filter
      const zipCodesWithDistance = Object.values(zipCodes).map((zipData) => {
        const distance = haversineDistance(
          centralZipData.latitude,
          centralZipData.longitude,
          zipData.latitude,
          zipData.longitude,
        )
        return { zipData, distance }
      })

      // Sort by distance and take the closest ones within the radius
      const results = zipCodesWithDistance
        .filter(({ distance }) => distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map(({ zipData, distance }) => {
          // Add the distance to the ZIP code data
          return { ...zipData, distance }
        })

      return NextResponse.json({ zipCodes: results, source: "blob" })
    }

    // Fallback to file-based storage if Blob storage doesn't have the data
    const results = await findZipCodesInRadius(zip, radius, limit)

    if (!results || results.length === 0) {
      return NextResponse.json({ error: `No ZIP codes found within ${radius} miles of ${zip}` }, { status: 404 })
    }

    return NextResponse.json({ zipCodes: results, source: "file" })
  } catch (error) {
    console.error("Error searching ZIP codes in radius:", error)
    return NextResponse.json(
      {
        error: "Failed to search ZIP codes in radius",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
