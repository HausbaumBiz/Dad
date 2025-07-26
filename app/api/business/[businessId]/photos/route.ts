import { type NextRequest, NextResponse } from "next/server"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

export async function GET(request: NextRequest, { params }: { params: { businessId: string } }) {
  try {
    const { businessId } = params

    if (!businessId) {
      return NextResponse.json({ success: false, error: "Business ID is required" }, { status: 400 })
    }

    const photos = await loadBusinessPhotos(businessId)

    return NextResponse.json({
      success: true,
      photos: photos || [],
    })
  } catch (error) {
    console.error("Error loading business photos:", error)
    return NextResponse.json({ success: false, error: "Failed to load photos" }, { status: 500 })
  }
}
