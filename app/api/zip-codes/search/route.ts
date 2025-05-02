/**
 * API route for searching ZIP codes
 * GET /api/zip-codes/search
 */

import { type NextRequest, NextResponse } from "next/server"
import { getZipCode } from "@/lib/zip-code-memory" // Use in-memory storage

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zip = searchParams.get("zip")

    if (!zip) {
      return NextResponse.json({ error: "ZIP code is required" }, { status: 400 })
    }

    const zipCode = await getZipCode(zip)

    if (!zipCode) {
      return NextResponse.json({ error: `ZIP code ${zip} not found` }, { status: 404 })
    }

    return NextResponse.json({ zipCode })
  } catch (error) {
    console.error("Error searching ZIP code:", error)
    return NextResponse.json(
      {
        error: "Failed to search ZIP code",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
