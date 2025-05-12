import { type NextRequest, NextResponse } from "next/server"
import { deleteFromCloudflareImages } from "@/lib/cloudflare-images"
import { getCouponImageId } from "@/app/actions/coupon-image-actions"

export async function POST(request: NextRequest) {
  try {
    const { businessId, couponId } = await request.json()

    if (!businessId || !couponId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Get the image ID from Redis
    const imageIdResult = await getCouponImageId(businessId, couponId)

    if (!imageIdResult.success || !imageIdResult.imageId) {
      return NextResponse.json({ success: false, error: imageIdResult.error || "Image ID not found" }, { status: 404 })
    }

    // Delete the image from Cloudflare
    const deleteResult = await deleteFromCloudflareImages(imageIdResult.imageId)

    if (!deleteResult.success) {
      return NextResponse.json(
        { success: false, error: deleteResult.error || "Failed to delete image" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Coupon image deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting coupon image:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
