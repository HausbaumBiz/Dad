/**
 * API route for searching ZIP codes
 * GET /api/zip-codes/search?zip=12345
 */

import { type NextRequest, NextResponse } from "next/server"
import { getZipCode } from "@/lib/zip-code-file" // Use file-based storage

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zip = searchParams.get("zip")

    if (!zip) {
      return NextResponse.json({ error: "ZIP code is required" }, { status: 400 })
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "Invalid ZIP code format. Must be 5 digits." }, { status: 400 })
    }

    // Get ZIP code data
    const zipCode = await getZipCode(zip)

    if (!zipCode) {
      return NextResponse.json({ error: "ZIP code not found in database" }, { status: 404 })
    }

    return NextResponse.json({ zipCode })
  } catch (error) {
    console.error("Error searching ZIP code:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to search ZIP code" },
      { status: 500 },
    )
  }
}
