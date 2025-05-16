import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES, CATEGORY_MAPPINGS } from "@/lib/db-schema"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")

    if (!category) {
      return NextResponse.json({ error: "Category parameter is required" }, { status: 400 })
    }

    console.log(`API: Fetching businesses for category: ${category}`)

    // Try to normalize the category using mappings
    const normalizedCategory = CATEGORY_MAPPINGS[category.toLowerCase()] || category
    console.log(`API: Normalized category: ${normalizedCategory}`)

    // Get business IDs for the original category
    let businessIds = []
    try {
      businessIds = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${category}`)
      console.log(`API: Found ${businessIds.length} businesses for exact category: ${category}`)
    } catch (error) {
      console.error(`API: Error fetching businesses for exact category ${category}:`, error)
    }

    // Also try with the normalized category
    if (normalizedCategory !== category) {
      try {
        const normalizedBusinessIds = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${normalizedCategory}`)
        console.log(
          `API: Found ${normalizedBusinessIds.length} businesses for normalized category: ${normalizedCategory}`,
        )
        businessIds = [...businessIds, ...normalizedBusinessIds]
      } catch (error) {
        console.error(`API: Error fetching businesses for normalized category ${normalizedCategory}:`, error)
      }
    }

    // Also try with :businesses suffix for both formats
    try {
      const businessIdsWithSuffix = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${category}:businesses`)
      console.log(
        `API: Found ${businessIdsWithSuffix.length} businesses for category with suffix: ${category}:businesses`,
      )
      businessIds = [...businessIds, ...businessIdsWithSuffix]
    } catch (error) {
      console.error(`API: Error fetching businesses for category with suffix ${category}:businesses:`, error)
    }

    if (normalizedCategory !== category) {
      try {
        const normalizedBusinessIdsWithSuffix = await kv.smembers(
          `${KEY_PREFIXES.CATEGORY}${normalizedCategory}:businesses`,
        )
        console.log(
          `API: Found ${normalizedBusinessIdsWithSuffix.length} businesses for normalized category with suffix: ${normalizedCategory}:businesses`,
        )
        businessIds = [...businessIds, ...normalizedBusinessIdsWithSuffix]
      } catch (error) {
        console.error(
          `API: Error fetching businesses for normalized category with suffix ${normalizedCategory}:businesses:`,
          error,
        )
      }
    }

    // Special handling for "Automotive/Motorcycle/RV, etc" format
    if (
      category.includes("automotive") ||
      category.includes("Automotive") ||
      normalizedCategory === "Automotive Services"
    ) {
      try {
        // Try the exact format with ", etc"
        const etcFormat = "Automotive/Motorcycle/RV, etc"
        const etcBusinessIds = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${etcFormat}`)
        console.log(`API: Found ${etcBusinessIds.length} businesses for etc format: ${etcFormat}`)
        businessIds = [...businessIds, ...etcBusinessIds]

        // Also try with :businesses suffix
        const etcBusinessIdsWithSuffix = await kv.smembers(`${KEY_PREFIXES.CATEGORY}${etcFormat}:businesses`)
        console.log(
          `API: Found ${etcBusinessIdsWithSuffix.length} businesses for etc format with suffix: ${etcFormat}:businesses`,
        )
        businessIds = [...businessIds, ...etcBusinessIdsWithSuffix]
      } catch (error) {
        console.error(`API: Error fetching businesses for etc format:`, error)
      }
    }

    // Remove duplicates
    const uniqueBusinessIds = [...new Set(businessIds)]
    console.log(`API: Total unique business IDs: ${uniqueBusinessIds.length}`)

    if (!uniqueBusinessIds || uniqueBusinessIds.length === 0) {
      return NextResponse.json({ businesses: [] })
    }

    // Fetch each business's data
    const businessesPromises = uniqueBusinessIds.map(async (id) => {
      try {
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)
        return business ? { ...business, id } : null
      } catch (err) {
        console.error(`API: Error fetching business ${id}:`, err)
        return null
      }
    })

    const businesses = (await Promise.all(businessesPromises)).filter(Boolean)
    console.log(`API: Successfully fetched ${businesses.length} businesses for category ${category}`)

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error("API: Error fetching businesses by category:", error)
    return NextResponse.json({ error: "Failed to fetch businesses" }, { status: 500 })
  }
}
