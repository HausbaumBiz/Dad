import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    const key = `${KEY_PREFIXES.BUSINESS}${id}:adDesign`
    let adDesignData = null

    // First try to get the ad design data as a string (JSON)
    try {
      const jsonData = await kv.get(key)
      if (jsonData) {
        // If it's a string, parse it as JSON
        try {
          adDesignData = typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData
        } catch (parseError) {
          console.error("Error parsing ad design JSON:", parseError)
          adDesignData = { rawData: jsonData }
        }
      }
    } catch (getError) {
      console.error("Error getting ad design as string:", getError)
      // If getting as string fails, try as hash
      try {
        adDesignData = await kv.hgetall(key)
      } catch (hashError) {
        console.error("Error getting ad design as hash:", hashError)
      }
    }

    if (!adDesignData) {
      return NextResponse.json(null)
    }

    return NextResponse.json(adDesignData)
  } catch (error) {
    console.error("Error fetching business ad design:", error)
    return NextResponse.json({ error: "Failed to fetch business ad design" }, { status: 500 })
  }
}
