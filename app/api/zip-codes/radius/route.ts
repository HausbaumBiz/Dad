import { type NextRequest, NextResponse } from "next/server"
import type { ZipCodeData } from "@/lib/zip-code-types"

export const dynamic = "force-dynamic"

// CSV URL from your blob storage
const CSV_URL = "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/uszips11-0iYnSKUBgC7Dm6DtxL3bXwFzHgh6Qe.csv"

/**
 * Parse CSV data into ZipCodeData objects
 */
function parseCSV(csvText: string): ZipCodeData[] {
  const lines = csvText.trim().split("\n")
  const zipCodes: ZipCodeData[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV line (handle potential commas in quoted fields)
    const columns = parseCSVLine(line)

    if (columns.length >= 5) {
      const [zipCode, latitude, longitude, city, state] = columns

      // Validate required fields
      if (zipCode && latitude && longitude && city && state) {
        const lat = Number.parseFloat(latitude)
        const lng = Number.parseFloat(longitude)

        // Only include valid coordinates
        if (!isNaN(lat) && !isNaN(lng)) {
          zipCodes.push({
            zip: zipCode.toString().padStart(5, "0"), // Ensure 5-digit format
            city: city.trim(),
            state: state.trim(),
            latitude: lat,
            longitude: lng,
            country: "US",
          })
        }
      }
    }
  }

  return zipCodes
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += char
    }
  }

  // Add the last field
  result.push(current.trim())

  return result
}

/**
 * Calculate distance between two points using Haversine formula
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export async function GET(request: NextRequest) {
  try {
    console.log("=== ZIP Code Radius Search (Real CSV Data) ===")

    const searchParams = request.nextUrl.searchParams
    const zip = searchParams.get("zip")
    const radiusStr = searchParams.get("radius")
    const limitStr = searchParams.get("limit")

    console.log(`Request params: zip=${zip}, radius=${radiusStr}, limit=${limitStr}`)

    // Validate required parameters
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
    const limit = limitStr ? Math.min(Number.parseInt(limitStr, 10), 500) : 500

    if (isNaN(radius) || radius <= 0) {
      return NextResponse.json({ error: "Radius must be a positive number" }, { status: 400 })
    }

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: "Limit must be a positive number" }, { status: 400 })
    }

    if (limit > 500) {
      return NextResponse.json({ error: "Maximum limit is 500 ZIP codes" }, { status: 400 })
    }

    console.log(`Searching for ZIP codes within ${radius} miles of ${zip} (max ${limit} results)`)
    console.log(`Fetching CSV data from: ${CSV_URL}`)

    // Fetch the CSV data
    const csvResponse = await fetch(CSV_URL)
    if (!csvResponse.ok) {
      throw new Error(`Failed to fetch CSV: ${csvResponse.status} ${csvResponse.statusText}`)
    }

    const csvText = await csvResponse.text()
    console.log(`CSV data fetched successfully. Size: ${csvText.length} characters`)

    // Parse the CSV data
    const allZipCodes = parseCSV(csvText)
    console.log(`Parsed ${allZipCodes.length} ZIP codes from CSV`)

    // Find the center ZIP code
    const centralZipData = allZipCodes.find((zipData) => zipData.zip === zip.padStart(5, "0"))
    if (!centralZipData) {
      console.log(`Central ZIP code ${zip} not found in CSV data`)
      return NextResponse.json(
        {
          error: `ZIP code ${zip} not found in database`,
          totalZipCodes: allZipCodes.length,
          suggestion: "Make sure the ZIP code is valid and exists in the US",
        },
        { status: 404 },
      )
    }

    console.log(`Found central ZIP: ${zip} - ${centralZipData.city}, ${centralZipData.state}`)

    // Calculate distances and filter
    const results: (ZipCodeData & { distance: number })[] = []
    let processed = 0

    for (const zipData of allZipCodes) {
      processed++

      // Log progress for large datasets
      if (processed % 5000 === 0) {
        console.log(`Processed ${processed}/${allZipCodes.length} ZIP codes`)
      }

      const distance = haversineDistance(
        centralZipData.latitude,
        centralZipData.longitude,
        zipData.latitude,
        zipData.longitude,
      )

      if (distance <= radius) {
        results.push({
          ...zipData,
          distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        })
      }
    }

    console.log(`Distance calculation completed. Found ${results.length} ZIP codes within ${radius} miles`)

    // Sort by distance and limit results
    results.sort((a, b) => a.distance - b.distance)
    const limitedResults = results.slice(0, limit)

    console.log(`Returning ${limitedResults.length} results (limited by ${limit})`)

    return NextResponse.json({
      zipCodes: limitedResults,
      source: "csv",
      capped: results.length > limit,
      debug: {
        centralZip: centralZipData,
        totalZipCodesInDatabase: allZipCodes.length,
        searchRadius: radius,
        requestedLimit: limit,
        resultsFound: results.length,
        resultsReturned: limitedResults.length,
        csvUrl: CSV_URL,
      },
    })
  } catch (error) {
    console.error("Error in ZIP code radius search:", error)

    // Return a proper JSON error response
    return NextResponse.json(
      {
        error: "Internal server error in ZIP code search",
        message: error instanceof Error ? error.message : String(error),
        debug: {
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString(),
          csvUrl: CSV_URL,
        },
      },
      { status: 500 },
    )
  }
}
