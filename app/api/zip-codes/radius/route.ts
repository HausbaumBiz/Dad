import { type NextRequest, NextResponse } from "next/server"
import type { ZipCodeData } from "@/lib/zip-code-types"
import { haversineDistance } from "@/lib/zip-code-utils"

export const dynamic = "force-dynamic"

// Cache for ZIP code data to avoid fetching from Blob storage on every request
let zipCodeCache: Record<string, ZipCodeData> | null = null
let cacheLastUpdated = 0
const CACHE_TTL = 3600000 // 1 hour in milliseconds
const CSV_BLOB_URL =
  "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/uszips11-0iYnSKUBgC7Dm6DtxL3bXwFzHgh6Qe.csv"

async function getZipCodeData(): Promise<Record<string, ZipCodeData> | null> {
  // Return cached data if it's still valid
  if (zipCodeCache && Date.now() - cacheLastUpdated < CACHE_TTL) {
    console.log("Using cached ZIP code data")
    return zipCodeCache
  }

  try {
    console.log("Fetching ZIP code data from CSV blob...")

    // Fetch the CSV file directly
    const csvResponse = await fetch(CSV_BLOB_URL)

    if (!csvResponse.ok) {
      console.error(`Failed to fetch CSV file: ${csvResponse.status} ${csvResponse.statusText}`)
      const errorText = await csvResponse.text()
      console.error("Error response:", errorText)
      return null
    }

    const csvText = await csvResponse.text()
    console.log(`CSV file fetched successfully, size: ${csvText.length} characters`)

    if (!csvText || csvText.trim().length === 0) {
      console.error("CSV file is empty")
      return null
    }

    const zipCodes = parseCSVToZipCodeMap(csvText)
    console.log(`Parsed ${Object.keys(zipCodes).length} ZIP codes from CSV`)

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

  try {
    // Trim the input to remove any leading/trailing whitespace
    const trimmedCsv = csv.trim()

    if (!trimmedCsv) {
      console.error("CSV content is empty after trimming")
      return zipCodes
    }

    // Split by newlines, handling different line endings
    const lines = trimmedCsv.split(/\r?\n/)
    console.log(`Processing ${lines.length} lines from CSV`)

    if (lines.length < 2) {
      console.error("CSV file has insufficient data (less than 2 lines)")
      return zipCodes
    }

    // Parse header row, trimming each header
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    console.log("CSV Headers:", headers)

    // Find the indices of required columns (case insensitive)
    const zipIndex = headers.findIndex((h) => {
      const lower = h.toLowerCase()
      return lower === "zip" || lower === "zipcode" || lower === "postal_code" || lower === "zip_code"
    })

    const latIndex = headers.findIndex((h) => {
      const lower = h.toLowerCase()
      return lower === "lat" || lower === "latitude"
    })

    const lngIndex = headers.findIndex((h) => {
      const lower = h.toLowerCase()
      return lower === "lng" || lower === "long" || lower === "longitude"
    })

    const cityIndex = headers.findIndex((h) => {
      const lower = h.toLowerCase()
      return lower === "city"
    })

    const stateIndex = headers.findIndex((h) => {
      const lower = h.toLowerCase()
      return lower === "state" || lower === "state_id" || lower === "state_name"
    })

    const countyIndex = headers.findIndex((h) => {
      const lower = h.toLowerCase()
      return lower === "county"
    })

    console.log("Column indices:", {
      zip: zipIndex,
      lat: latIndex,
      lng: lngIndex,
      city: cityIndex,
      state: stateIndex,
      county: countyIndex,
    })

    // Skip if we can't find the required columns
    if (zipIndex === -1 || latIndex === -1 || lngIndex === -1 || cityIndex === -1 || stateIndex === -1) {
      console.error("CSV is missing required columns")
      console.error("Required: zip, lat/latitude, lng/longitude, city, state")
      return zipCodes
    }

    let processedCount = 0
    let skippedCount = 0

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) {
        skippedCount++
        continue // Skip empty lines
      }

      // Split the line by comma and handle quoted values
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))

      // Skip if we don't have enough values
      if (values.length <= Math.max(zipIndex, latIndex, lngIndex, cityIndex, stateIndex)) {
        skippedCount++
        continue
      }

      const zip = values[zipIndex]
      const latStr = values[latIndex]
      const lngStr = values[lngIndex]
      const city = values[cityIndex]
      const state = values[stateIndex]

      // Parse coordinates
      const latitude = Number.parseFloat(latStr)
      const longitude = Number.parseFloat(lngStr)

      // Skip if any required field is missing or invalid
      if (!zip || isNaN(latitude) || isNaN(longitude) || !city || !state) {
        skippedCount++
        continue
      }

      // Validate ZIP code format (5 digits)
      if (!/^\d{5}$/.test(zip)) {
        skippedCount++
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
      processedCount++
    }

    console.log(`Successfully processed ${processedCount} ZIP codes, skipped ${skippedCount} invalid entries`)
    return zipCodes
  } catch (error) {
    console.error("Error parsing CSV:", error)
    return zipCodes
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zip = searchParams.get("zip")
    const radiusStr = searchParams.get("radius")
    const limitStr = searchParams.get("limit")

    console.log(`ZIP code radius search request: zip=${zip}, radius=${radiusStr}, limit=${limitStr}`)

    if (!zip) {
      return NextResponse.json(
        {
          success: false,
          error: "ZIP code is required",
        },
        { status: 400 },
      )
    }

    if (!radiusStr) {
      return NextResponse.json(
        {
          success: false,
          error: "Radius is required",
        },
        { status: 400 },
      )
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid ZIP code format. Must be 5 digits.",
        },
        { status: 400 },
      )
    }

    const radius = Number.parseFloat(radiusStr)
    const limit = limitStr ? Number.parseInt(limitStr, 10) : 100

    if (isNaN(radius) || radius <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Radius must be a positive number",
        },
        { status: 400 },
      )
    }

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Limit must be a positive number",
        },
        { status: 400 },
      )
    }

    // Get ZIP code data from CSV
    const zipCodes = await getZipCodeData()

    if (!zipCodes) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to load ZIP code data. Please try again later.",
        },
        { status: 500 },
      )
    }

    const centralZipData = zipCodes[zip]

    if (!centralZipData) {
      return NextResponse.json(
        {
          success: false,
          error: `ZIP code ${zip} not found in database`,
        },
        { status: 404 },
      )
    }

    console.log(`Found central ZIP code: ${zip} - ${centralZipData.city}, ${centralZipData.state}`)

    // Calculate distances and filter
    const zipCodesWithDistance: Array<{ zipData: ZipCodeData; distance: number }> = []

    for (const zipData of Object.values(zipCodes)) {
      const distance = haversineDistance(
        centralZipData.latitude,
        centralZipData.longitude,
        zipData.latitude,
        zipData.longitude,
      )

      if (distance <= radius) {
        zipCodesWithDistance.push({ zipData, distance })
      }
    }

    console.log(`Found ${zipCodesWithDistance.length} ZIP codes within ${radius} miles`)

    // Sort by distance and take the closest ones
    const results = zipCodesWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map(({ zipData, distance }) => ({
        ...zipData,
        distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
      }))

    console.log(`Returning ${results.length} ZIP codes (limited to ${limit})`)

    return NextResponse.json({
      success: true,
      zipCodes: results,
      source: "csv_blob",
      centralZip: {
        zip: centralZipData.zip,
        city: centralZipData.city,
        state: centralZipData.state,
      },
      searchParams: {
        radius,
        limit,
        totalFound: zipCodesWithDistance.length,
      },
    })
  } catch (error) {
    console.error("Error in ZIP code radius search:", error)

    // Return a proper JSON error response
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error occurred while searching ZIP codes",
        message: error instanceof Error ? error.message : "Unknown error",
        details: "Please try again later or contact support if the problem persists",
      },
      { status: 500 },
    )
  }
}
