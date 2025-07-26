import { type NextRequest, NextResponse } from "next/server"
import { getBusinessRating } from "@/app/actions/review-actions"

export async function GET(request: NextRequest, { params }: { params: { businessId: string } }) {
  try {
    const { businessId } = params

    if (!businessId) {
      return NextResponse.json({ success: false, error: "Business ID is required" }, { status: 400 })
    }

    const ratingData = await getBusinessRating(businessId)

    return NextResponse.json({
      success: true,
      rating: ratingData.rating || 0,
      reviewCount: ratingData.reviewCount || 0,
    })
  } catch (error) {
    console.error("Error getting business rating:", error)
    return NextResponse.json({
      success: true, // Return success with default values instead of error
      rating: 0,
      reviewCount: 0,
    })
  }
}
