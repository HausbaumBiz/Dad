/**
 * API route for getting ZIP code database statistics
 * GET /api/zip-codes/stats
 */

import { type NextRequest, NextResponse } from "next/server"
import { getZipCodeMetadata } from "@/lib/zip-code-memory" // Use in-memory storage

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const stats = await getZipCodeMetadata()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error getting ZIP code database stats:", error)
    return NextResponse.json(
      {
        error: "Failed to get ZIP code database stats",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
