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

export async function GET(request: NextRequest) {
  try {
    console.log("=== ZIP Code Search (Real CSV Data) ===")

    const searchParams = request.nextUrl.searchParams
    const zip = searchParams.get("zip")

    console.log(`Request params: zip=${zip}`)

    if (!zip) {
      return NextResponse.json({ error: "ZIP code is required" }, { status: 400 })
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "Invalid ZIP code format. Must be 5 digits." }, { status: 400 })
    }

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

    // Find the specific ZIP code
    const zipData = allZipCodes.find((zipCode) => zipCode.zip === zip.padStart(5, "0"))
    if (!zipData) {
      console.log(`ZIP code ${zip} not found in CSV data`)
      return NextResponse.json(
        {
          error: `ZIP code ${zip} not found in database`,
          totalZipCodes: allZipCodes.length,
          suggestion: "Make sure the ZIP code is valid and exists in the US",
        },
        { status: 404 },
      )
    }

    console.log(`Found ZIP: ${zip} - ${zipData.city}, ${zipData.state}`)

    return NextResponse.json({
      zipCode: zipData,
      source: "csv",
      debug: {
        totalZipCodesInDatabase: allZipCodes.length,
        csvUrl: CSV_URL,
      },
    })
  } catch (error) {
    console.error("Error in ZIP code search:", error)

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
