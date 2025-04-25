/**
 * API route for getting ZIP code database statistics
 * GET /api/zip-codes/stats
 */

import { NextResponse } from "next/server"
import { getZipCodeMetadata } from "@/lib/zip-code-db"

export async function GET() {
  try {
    const metadata = await getZipCodeMetadata()
    return NextResponse.json(metadata)
  } catch (error) {
    console.error("Error getting ZIP code metadata:", error)
    return NextResponse.json({ error: "Failed to get ZIP code database statistics" }, { status: 500 })
  }
}
