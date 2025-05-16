import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET() {
  try {
    // Try multiple category formats to ensure we find all relevant businesses
    const categoryFormats = [
      "artDesignEntertainment",
      "Art, Design and Entertainment",
      "arts-entertainment",
      "Arts & Entertainment",
      "art-design-entertainment",
      "art-design-and-entertainment",
      "arts-&-entertainment",
    ]

    const results: Record<string, any> = {}
    let allBusinessIds: string[] = []

    // Try to get businesses from each category format
    for (const format of categoryFormats) {
      try {
        const key = `${KEY_PREFIXES.CATEGORY}${format}`
        const keyWithBusinesses = `${KEY_PREFIXES.CATEGORY}${format}:businesses`

        // Try both formats of keys
        const businessIds1 = await kv.smembers(key)
        const businessIds2 = await kv.smembers(keyWithBusinesses)

        results[format] = {
          key,
          keyWithBusinesses,
          businessIds1: businessIds1 || [],
          businessIds2: businessIds2 || [],
        }

        if (businessIds1 && businessIds1.length > 0) {
          allBusinessIds = [...allBusinessIds, ...businessIds1]
        }

        if (businessIds2 && businessIds2.length > 0) {
          allBusinessIds = [...allBusinessIds, ...businessIds2]
        }
      } catch (error) {
        results[format] = { error: error.message }
      }
    }

    // Remove duplicates
    const uniqueBusinessIds = [...new Set(allBusinessIds)]

    // Fetch business details
    const businesses = []
    for (const id of uniqueBusinessIds) {
      try {
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)
        if (business) {
          businesses.push({ ...business, id })
        }
      } catch (error) {
        console.error(`Error fetching business ${id}:`, error)
      }
    }

    return NextResponse.json({
      categoryFormats,
      results,
      uniqueBusinessIds,
      businessCount: uniqueBusinessIds.length,
      businesses,
    })
  } catch (error) {
    console.error("Error in arts-businesses API:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
