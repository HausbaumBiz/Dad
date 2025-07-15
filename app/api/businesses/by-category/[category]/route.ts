import { type NextRequest, NextResponse } from "next/server"
import { getBusinessesByCategoryWithAdDesign } from "@/app/actions/business-actions"

export async function GET(request: NextRequest, { params }: { params: { category: string } }) {
  try {
    const category = params.category
    console.log(`API: Getting businesses for category: ${category}`)

    const businesses = await getBusinessesByCategoryWithAdDesign(category)

    return NextResponse.json({
      success: true,
      businesses,
      count: businesses.length,
    })
  } catch (error) {
    console.error("API Error fetching businesses:", error)
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
