/**
 * API route for getting ZIP code database statistics
 * GET /api/zip-codes/stats
 */

import { type NextRequest, NextResponse } from "next/server"
import { getZipCodeMetadata } from "@/lib/zip-code-file" // Use file-based storage

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const metadata = await getZipCodeMetadata()
    return NextResponse.json(metadata)
  } catch (error) {
    console.error("Error getting ZIP code metadata:", error)
    // Return a default response with error information
    return NextResponse.json(
      {
        error: "Failed to get ZIP code database statistics",
        count: 0,
        lastUpdated: "",
        errorMessage: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
