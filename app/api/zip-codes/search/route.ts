/**
 * API route for searching ZIP codes
 * GET /api/zip-codes/search
 */

import { type NextRequest, NextResponse } from "next/server"
import { searchZipCodes, findZipCodesInRadius, getZipCode } from "@/lib/zip-code-db"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Get search parameters
    const zip = searchParams.get("zip")
    const radius = searchParams.get("radius")
    const state = searchParams.get("state")
    const city = searchParams.get("city")
    const limit = searchParams.get("limit")

    // Convert limit to number if provided
    const limitNum = limit ? Number.parseInt(limit, 10) : undefined

    // If searching by radius
    if (zip && radius) {
      const radiusMiles = Number.parseFloat(radius)
      if (isNaN(radiusMiles)) {
        return NextResponse.json({ error: "Invalid radius" }, { status: 400 })
      }

      const zipCodes = await findZipCodesInRadius(zip, radiusMiles, limitNum || 100)
      return NextResponse.json({ zipCodes })
    }

    // If looking up a single ZIP code
    if (zip && !radius && !state && !city) {
      const zipData = await getZipCode(zip)
      if (!zipData) {
        return NextResponse.json({ error: "ZIP code not found" }, { status: 404 })
      }
      return NextResponse.json({ zipCode: zipData })
    }

    // If searching by other criteria
    const zipCodes = await searchZipCodes({
      state,
      city,
      limit: limitNum,
    })

    return NextResponse.json({ zipCodes })
  } catch (error) {
    console.error("Error searching ZIP codes:", error)
    return NextResponse.json({ error: "Failed to search ZIP codes" }, { status: 500 })
  }
}
