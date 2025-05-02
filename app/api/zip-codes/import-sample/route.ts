/**
 * API route for importing sample ZIP code data
 * GET /api/zip-codes/import-sample
 */

import { type NextRequest, NextResponse } from "next/server"
import { importZipCodes } from "@/lib/zip-code-memory" // Use in-memory storage
import type { ZipCodeData } from "@/lib/zip-code-types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    // Sample ZIP codes
    const sampleZipCodes: ZipCodeData[] = [
      {
        zip: "10001",
        city: "New York",
        state: "NY",
        latitude: 40.7501,
        longitude: -73.9972,
      },
      {
        zip: "90210",
        city: "Beverly Hills",
        state: "CA",
        latitude: 34.0901,
        longitude: -118.4065,
      },
      {
        zip: "60601",
        city: "Chicago",
        state: "IL",
        latitude: 41.8855,
        longitude: -87.6217,
      },
      {
        zip: "33139",
        city: "Miami Beach",
        state: "FL",
        latitude: 25.7826,
        longitude: -80.1341,
      },
      {
        zip: "02108",
        city: "Boston",
        state: "MA",
        latitude: 42.3583,
        longitude: -71.0603,
      },
    ]

    // Import the sample ZIP codes
    const stats = await importZipCodes(sampleZipCodes)

    return NextResponse.json({
      success: true,
      stats,
      message: "Sample ZIP codes imported successfully",
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
