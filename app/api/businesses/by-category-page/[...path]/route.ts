import { type NextRequest, NextResponse } from "next/server"
import { getBusinessesForCategoryPage } from "@/lib/business-category-service"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    console.log("[API] Fetching businesses for category page:", params.path)

    // Reconstruct the full path from the segments
    const categoryPath = "/" + params.path.join("/")
    console.log("[API] Full category path:", categoryPath)

    // Fetch businesses using the server-side function
    const businesses = await getBusinessesForCategoryPage(categoryPath)

    console.log(`[API] Found ${businesses.length} businesses for path: ${categoryPath}`)

    return NextResponse.json({
      success: true,
      businesses,
      count: businesses.length,
    })
  } catch (error) {
    console.error("[API] Error fetching businesses by category page:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch businesses",
        businesses: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}
