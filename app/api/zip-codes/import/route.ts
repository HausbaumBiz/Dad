/**
 * API route for importing ZIP code data
 * POST /api/zip-codes/import
 */

import { type NextRequest, NextResponse } from "next/server"
import { importZipCodes } from "@/lib/zip-code-db"
import type { ZipCodeData } from "@/lib/zip-code-types"

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    // This is a simple example - you should implement proper authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()

    // Validate the data
    if (!Array.isArray(body.zipCodes)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array of ZIP codes." }, { status: 400 })
    }

    // Import the ZIP codes
    const stats = await importZipCodes(body.zipCodes as ZipCodeData[])

    return NextResponse.json({ success: true, stats })
  } catch (error) {
    console.error("Error importing ZIP codes:", error)
    return NextResponse.json({ error: "Failed to import ZIP codes" }, { status: 500 })
  }
}
