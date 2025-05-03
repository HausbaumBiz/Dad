/**
 * API route for finding ZIP codes within a radius
 * GET /api/zip-codes/radius?zip=12345&radius=25&limit=50
 */

import { type NextRequest, NextResponse } from "next/server"
import { findZipCodesInRadius } from "@/lib/zip-code-file" // Use file-based storage

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zip = searchParams.get("zip")
    const radiusStr = searchParams.get("radius")
    const limitStr = searchParams.get("limit")

    if (!zip) {
      return NextResponse.json({ error: "ZIP code is required" }, { status: 400 })
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "Invalid ZIP code format. Must be 5 digits." }, { status: 400 })
    }

    // Parse radius and limit
    const radius = radiusStr ? Number.parseInt(radiusStr) : 25
    const limit = limitStr ? Number.parseInt(limitStr) : 100

    if (isNaN(radius) || radius < 0 || radius > 500) {
      return NextResponse.json({ error: "Radius must be between 0 and 500 miles" }, { status: 400 })
    }

    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json({ error: "Limit must be between 1 and 1000" }, { status: 400 })
    }

    // Find ZIP codes within the radius
    const zipCodes = await findZipCodesInRadius(zip, radius, limit)

    return NextResponse.json({
      success: true,
      zipCodes,
      count: zipCodes.length,
      radius,
      centralZip: zip,
    })
  } catch (error) {
    console.error("Error finding ZIP codes in radius:", error)
    return NextResponse.json(
      {
        error: "Failed to find ZIP codes in radius",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
