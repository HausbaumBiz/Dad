/**
 * API route for getting a list of states with ZIP code counts
 * GET /api/zip-codes/states
 */

import { type NextRequest, NextResponse } from "next/server"
import { getStatesList } from "@/lib/zip-code-file" // Use file-based storage

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const states = await getStatesList()
    return NextResponse.json({ states })
  } catch (error) {
    console.error("Error getting states list:", error)
    return NextResponse.json(
      {
        error: "Failed to get states list",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
