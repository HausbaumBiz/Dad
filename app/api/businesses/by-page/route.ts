import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET(request: NextRequest) {
  try {
    const page = request.nextUrl.searchParams.get("page")
    const debug = request.nextUrl.searchParams.get("debug") === "true"

    if (!page) {
      return NextResponse.json({ error: "Page parameter is required" }, { status: 400 })
    }

    console.log(`API: Fetching businesses for page: ${page}`)

    // Get business IDs directly from the page:businesses set
    let businessIds: string[] = []

    try {
      businessIds = await kv.smembers(`page:${page}:businesses`)
      console.log(`API: Found ${businessIds.length} businesses in page:${page}:businesses set`)
    } catch (error) {
      console.error(`API: Error fetching businesses for page ${page}:`, error)
      return NextResponse.json(
        {
          businesses: [],
          error: "Failed to fetch businesses",
          errorDetails: error instanceof Error ? error.message : String(error),
        },
        { status: 500 },
      )
    }

    if (!businessIds || businessIds.length === 0) {
      console.log(`API: No businesses found for page ${page}`)
      return NextResponse.json({
        businesses: [],
        message: `No businesses found for page ${page}`,
        timestamp: new Date().toISOString(),
      })
    }

    // Fetch each business's data
    const businessesPromises = businessIds.map(async (id) => {
      try {
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)
        if (business) {
          return { ...business, id }
        }
        return null
      } catch (err) {
        console.error(`API: Error fetching business ${id}:`, err)
        return null
      }
    })

    const businesses = (await Promise.all(businessesPromises)).filter(Boolean)

    // Filter out demo/test businesses
    const realBusinesses = businesses.filter((business: any) => {
      // Check if it's a demo business
      if (business.is_demo) return false

      // Check business name for demo indicators
      const name = business.businessName || business.business_name || ""
      if (
        name.toLowerCase().includes("demo") ||
        name.toLowerCase().includes("sample") ||
        name.toLowerCase().includes("test")
      ) {
        return false
      }

      // Check email for demo indicators
      const email = business.email || ""
      if (
        email.toLowerCase().includes("demo") ||
        email.toLowerCase().includes("sample") ||
        email.toLowerCase().includes("test") ||
        email.toLowerCase().includes("example.com")
      ) {
        return false
      }

      return true
    })

    console.log(`API: Successfully fetched ${realBusinesses.length} real businesses for page ${page}`)

    const response: any = {
      businesses: realBusinesses,
      totalFound: businessIds.length,
      realBusinesses: realBusinesses.length,
      page: page,
      timestamp: new Date().toISOString(),
    }

    // Add debug info if requested
    if (debug) {
      response.debug = {
        businessIds,
        rawBusinessCount: businesses.length,
        filteredBusinessCount: realBusinesses.length,
        requestTime: new Date().toISOString(),
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("API: Error fetching businesses by page:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch businesses",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
