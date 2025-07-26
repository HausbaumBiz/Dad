import { type NextRequest, NextResponse } from "next/server"
import { addFavoriteBusiness } from "@/app/actions/favorite-actions"

export async function POST(request: NextRequest) {
  try {
    const providerData = await request.json()

    if (!providerData.id) {
      return NextResponse.json({ success: false, error: "Business ID is required" }, { status: 400 })
    }

    const result = await addFavoriteBusiness(providerData)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error adding favorite business:", error)
    return NextResponse.json({ success: false, error: "Failed to add favorite business" }, { status: 500 })
  }
}
