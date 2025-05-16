import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    // Get business data
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    return NextResponse.json({ ...business, id })
  } catch (error) {
    console.error(`Error fetching business ${params.id}:`, error)
    return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 })
  }
}
