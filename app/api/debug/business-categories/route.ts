import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET() {
  try {
    console.log("Fetching all businesses for category debug...")

    // Get all business IDs
    const businessIds = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
    console.log(`Found ${businessIds.length} business IDs`)

    if (!businessIds || businessIds.length === 0) {
      return NextResponse.json({
        success: true,
        businesses: [],
        message: "No businesses found in the system",
      })
    }

    // Fetch each business with their categories and page mappings
    const businessesPromises = businessIds.slice(0, 20).map(async (id) => {
      try {
        const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)
        const categories = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:categories`)
        const pageMappings = await kv.get(`${KEY_PREFIXES.BUSINESS}${id}:pages`)

        let parsedCategories = []
        let parsedPageMappings = {}

        if (categories) {
          if (typeof categories === "string") {
            try {
              parsedCategories = JSON.parse(categories)
            } catch (error) {
              console.error(`Error parsing categories for business ${id}:`, error)
            }
          } else if (Array.isArray(categories)) {
            parsedCategories = categories
          }
        }

        if (pageMappings) {
          if (typeof pageMappings === "string") {
            try {
              parsedPageMappings = JSON.parse(pageMappings)
            } catch (error) {
              console.error(`Error parsing page mappings for business ${id}:`, error)
            }
          } else if (typeof pageMappings === "object" && pageMappings !== null) {
            parsedPageMappings = pageMappings
          }
        }

        return {
          id,
          businessName: business?.businessName || business?.business_name || "Unknown",
          email: business?.email || "",
          categories: parsedCategories,
          pageMappings: parsedPageMappings,
          hasCategories: parsedCategories.length > 0,
          hasPageMappings: Object.keys(parsedPageMappings).length > 0,
          is_demo: business?.is_demo || false,
        }
      } catch (error) {
        console.error(`Error fetching business ${id}:`, error)
        return null
      }
    })

    const businesses = (await Promise.all(businessesPromises)).filter(Boolean)

    // Filter out demo businesses
    const realBusinesses = businesses.filter((business: any) => {
      if (business.is_demo) return false

      const name = business.businessName || ""
      const email = business.email || ""

      if (
        name.toLowerCase().includes("demo") ||
        name.toLowerCase().includes("sample") ||
        name.toLowerCase().includes("test") ||
        email.toLowerCase().includes("demo") ||
        email.toLowerCase().includes("sample") ||
        email.toLowerCase().includes("test") ||
        email.toLowerCase().includes("example.com")
      ) {
        return false
      }

      return true
    })

    console.log(`Returning ${realBusinesses.length} real businesses out of ${businesses.length} total`)

    return NextResponse.json({
      success: true,
      businesses: realBusinesses,
      totalBusinesses: businessIds.length,
      sampledBusinesses: businesses.length,
      realBusinesses: realBusinesses.length,
      summary: {
        withCategories: realBusinesses.filter((b) => b.hasCategories).length,
        withoutCategories: realBusinesses.filter((b) => !b.hasCategories).length,
        withPageMappings: realBusinesses.filter((b) => b.hasPageMappings).length,
        withoutPageMappings: realBusinesses.filter((b) => !b.hasPageMappings).length,
      },
    })
  } catch (error) {
    console.error("Error in business categories debug:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch business categories",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
