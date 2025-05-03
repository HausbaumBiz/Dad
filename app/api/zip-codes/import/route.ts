/**
 * API route for importing ZIP code data
 * POST /api/zip-codes/import
 */

import { type NextRequest, NextResponse } from "next/server"
import { importZipCodes } from "@/lib/zip-code-file" // Use file-based storage
import type { ZipCodeData } from "@/lib/zip-code-types"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    // This is a simple example - you should implement proper authentication
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized - Missing authorization header" }, { status: 401 })
    }

    // Accept both "Bearer TOKEN" and just "TOKEN" formats
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7) // Remove "Bearer " prefix
      : authHeader

    // Check if the token is valid (in a real app, you would validate against a database or auth service)
    const validToken = "ULMAAIjcDFkMmZlZTE2NjU1MTM0ODA2YjVkOTAzZDQyYjQ2NWMyY3AxMA"
    if (token !== validToken) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()

    // Validate the data
    if (!Array.isArray(body.zipCodes)) {
      return NextResponse.json({ error: "Invalid data format. Expected an array of ZIP codes." }, { status: 400 })
    }

    // Pre-validate ZIP codes
    const validZipCodes = body.zipCodes.filter((zipCode: any) => {
      // Map zipCode to zip if needed
      if (zipCode.zipCode !== undefined && zipCode.zip === undefined) {
        zipCode.zip = zipCode.zipCode
      }

      // Must have a ZIP code
      if (!zipCode.zip) return false

      // Convert coordinates to numbers if they're strings
      if (zipCode.latitude !== undefined && typeof zipCode.latitude === "string") {
        zipCode.latitude = Number.parseFloat(zipCode.latitude)
      }

      if (zipCode.longitude !== undefined && typeof zipCode.longitude === "string") {
        zipCode.longitude = Number.parseFloat(zipCode.longitude)
      }

      return true
    })

    // Import the ZIP codes
    const stats = await importZipCodes(validZipCodes as ZipCodeData[])

    return NextResponse.json({
      success: true,
      stats,
      originalCount: body.zipCodes.length,
      validCount: validZipCodes.length,
    })
  } catch (error) {
    console.error("Error importing ZIP codes:", error)
    return NextResponse.json(
      {
        error: "Failed to import ZIP codes",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
