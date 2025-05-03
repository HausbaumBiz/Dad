/**
 * API route for importing sample ZIP code data
 * GET /api/zip-codes/import-sample
 */

import { type NextRequest, NextResponse } from "next/server"
import { importZipCodes } from "@/lib/zip-code-file" // Use file-based storage
import type { ZipCodeData } from "@/lib/zip-code-types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Sample ZIP codes (a small set for testing)
    const sampleZipCodes: ZipCodeData[] = [
      {
        zip: "10001",
        city: "New York",
        state: "NY",
        latitude: 40.7501,
        longitude: -73.9972,
        county: "New York County",
        timezone: "America/New_York",
        country: "US",
      },
      {
        zip: "90210",
        city: "Beverly Hills",
        state: "CA",
        latitude: 34.0901,
        longitude: -118.4065,
        county: "Los Angeles County",
        timezone: "America/Los_Angeles",
        country: "US",
      },
      {
        zip: "60601",
        city: "Chicago",
        state: "IL",
        latitude: 41.8855,
        longitude: -87.6217,
        county: "Cook County",
        timezone: "America/Chicago",
        country: "US",
      },
      {
        zip: "33139",
        city: "Miami Beach",
        state: "FL",
        latitude: 25.7796,
        longitude: -80.1342,
        county: "Miami-Dade County",
        timezone: "America/New_York",
        country: "US",
      },
      {
        zip: "02108",
        city: "Boston",
        state: "MA",
        latitude: 42.3583,
        longitude: -71.0603,
        county: "Suffolk County",
        timezone: "America/New_York",
        country: "US",
      },
      {
        zip: "75201",
        city: "Dallas",
        state: "TX",
        latitude: 32.7887,
        longitude: -96.7676,
        county: "Dallas County",
        timezone: "America/Chicago",
        country: "US",
      },
      {
        zip: "98101",
        city: "Seattle",
        state: "WA",
        latitude: 47.6101,
        longitude: -122.3421,
        county: "King County",
        timezone: "America/Los_Angeles",
        country: "US",
      },
      {
        zip: "80202",
        city: "Denver",
        state: "CO",
        latitude: 39.7526,
        longitude: -104.9994,
        county: "Denver County",
        timezone: "America/Denver",
        country: "US",
      },
      {
        zip: "94102",
        city: "San Francisco",
        state: "CA",
        latitude: 37.7794,
        longitude: -122.4184,
        county: "San Francisco County",
        timezone: "America/Los_Angeles",
        country: "US",
      },
      {
        zip: "20001",
        city: "Washington",
        state: "DC",
        latitude: 38.9123,
        longitude: -77.0185,
        county: "District of Columbia",
        timezone: "America/New_York",
        country: "US",
      },
    ]

    // Import the sample ZIP codes
    const stats = await importZipCodes(sampleZipCodes)

    return NextResponse.json({
      success: true,
      stats,
      message: `Successfully imported ${stats.imported} sample ZIP codes`,
    })
  } catch (error) {
    console.error("Error importing sample ZIP codes:", error)
    return NextResponse.json(
      {
        error: "Failed to import sample ZIP codes",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
