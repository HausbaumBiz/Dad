import { type NextRequest, NextResponse } from "next/server"
import { checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"

export async function POST(request: NextRequest) {
  try {
    const { businessId } = await request.json()

    if (!businessId) {
      return NextResponse.json({ success: false, error: "Business ID is required" }, { status: 400 })
    }

    const isFavorite = await checkIfBusinessIsFavorite(businessId)

    return NextResponse.json({
      success: true,
      isFavorite: Boolean(isFavorite),
    })
  } catch (error) {
    console.error("Error checking favorite status:", error)
    return NextResponse.json({ success: false, error: "Failed to check favorite status" }, { status: 500 })
  }
}
