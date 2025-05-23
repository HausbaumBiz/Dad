import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = params.id

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    // Get business data to verify it exists
    const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    // Get the pages to keep from the request body
    const { pagesToKeep } = await request.json()

    if (!Array.isArray(pagesToKeep)) {
      return NextResponse.json({ error: "pagesToKeep must be an array" }, { status: 400 })
    }

    // Get all possible pages
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

    // Remove business from all pages
    const removedPages: string[] = []

    for (const page of allPages) {
      try {
        const isMember = await kv.sismember(`page:${page}:businesses`, businessId)

        if (isMember === 1) {
          await kv.srem(`page:${page}:businesses`, businessId)
          removedPages.push(page)
        }
      } catch (error) {
        console.error(`Error removing business ${businessId} from page ${page}:`, error)
      }
    }

    // Add business to selected pages
    const addedPages: string[] = []
    const pageMappings: Record<string, boolean> = {}

    for (const page of pagesToKeep) {
      if (allPages.includes(page)) {
        try {
          await kv.sadd(`page:${page}:businesses`, businessId)
          addedPages.push(page)
          pageMappings[page] = true
        } catch (error) {
          console.error(`Error adding business ${businessId} to page ${page}:`, error)
        }
      }
    }

    // Update the business's page mappings
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}:pages`, JSON.stringify(pageMappings))

    // Revalidate all affected pages
    const allAffectedPages = [...new Set([...removedPages, ...addedPages])]

    for (const page of allAffectedPages) {
      revalidatePath(`/${page}`)
      revalidatePath(`/${page}?t=${Date.now()}`) // Cache busting
    }

    return NextResponse.json({
      success: true,
      message: `Business page mappings updated. Removed from ${removedPages.length} pages, added to ${addedPages.length} pages.`,
      details: {
        removedPages,
        addedPages,
      },
    })
  } catch (error) {
    console.error("Error fixing business page mappings:", error)
    return NextResponse.json(
      {
        error: "Failed to fix business page mappings",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
