/**
 * API route for finding ZIP codes within a radius
 * GET /api/zip-codes/radius
 */

import { type NextRequest, NextResponse } from "next/server"
import { findZipCodesInRadius } from "@/lib/zip-code-memory" // Use in-memory storage

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

    if (!radiusStr) {
      return NextResponse.json({ error: "Radius is required" }, { status: 400 })
    }

    const radius = Number.parseFloat(radiusStr)
    if (isNaN(radius) || radius <= 0) {
      return NextResponse.json({ error: "Radius must be a positive number" }, { status: 400 })
    }

    const limit = limitStr ? Number.parseInt(limitStr, 10) : 100
    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: "Limit must be a positive number" }, { status: 400 })
    }

    const zipCodes = await findZipCodesInRadius(zip, radius, limit)

    return NextResponse.json({ zipCodes })
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
