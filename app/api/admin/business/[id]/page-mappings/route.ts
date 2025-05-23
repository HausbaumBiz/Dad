import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = params.id

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    // Get business data
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    // Get page mappings
    const pageMappingsData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`)
    let pageMappings: string[] = []

    if (pageMappingsData) {
      if (typeof pageMappingsData === "string") {
        try {
          const parsed = JSON.parse(pageMappingsData)
          pageMappings = Object.keys(parsed)
        } catch (error) {
          console.error(`Error parsing page mappings for business ${businessId}:`, error)
        }
      } else if (typeof pageMappingsData === "object" && pageMappingsData !== null) {
        pageMappings = Object.keys(pageMappingsData as Record<string, boolean>)
      }
    }

    // Check actual page memberships
    const verifiedMappings: Record<string, boolean> = {}

    for (const page of pageMappings) {
      try {
        const isMember = await kv.sismember(`page:${page}:businesses`, businessId)
        verifiedMappings[page] = isMember === 1
      } catch (error) {
        console.error(`Error checking if business ${businessId} is in page ${page}:`, error)
        verifiedMappings[page] = false
      }
    }

    // Check if business is in any other pages it shouldn't be in
    const allPages = [
      "home-improvement",
      "retail-stores",
      "travel-vacation",
      "tailoring-clothing",
      "arts-entertainment",
      "physical-rehabilitation",
      "financial-services",
      "weddings-events",
      "pet-care",
      "education-tutoring",
      "real-estate",
      "fitness-athletics",
      "music-lessons",
      "care-services",
      "automotive-services",
      "beauty-wellness",
      "medical-practitioners",
      "mental-health",
      "tech-it-services",
      "food-dining",
      "personal-assistants",
      "funeral-services",
      "legal-services",
      "elder-care",
      "child-care",
    ]

    const unexpectedMappings: string[] = []

    for (const page of allPages) {
      if (!pageMappings.includes(page)) {
        try {
          const isMember = await kv.sismember(`page:${page}:businesses`, businessId)
          if (isMember === 1) {
            unexpectedMappings.push(page)
          }
        } catch (error) {
          console.error(`Error checking if business ${businessId} is in page ${page}:`, error)
        }
      }
    }

    return NextResponse.json({
      business: { ...business, id: businessId },
      pageMappings,
      verifiedMappings,
      unexpectedMappings,
      hasUnexpectedMappings: unexpectedMappings.length > 0,
    })
  } catch (error) {
    console.error("Error getting business page mappings:", error)
    return NextResponse.json(
      {
        error: "Failed to get business page mappings",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
