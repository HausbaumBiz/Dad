import { type NextRequest, NextResponse } from "next/server"
import { deleteCouponData } from "@/app/actions/coupon-image-actions"

export async function POST(request: NextRequest) {
  try {
    const { businessId, couponId } = await request.json()

    if (!businessId || !couponId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: businessId and couponId" },
        { status: 400 },
      )
    }

    // Delete all coupon data from Redis
    const result = await deleteCouponData(businessId, couponId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to delete coupon data" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
