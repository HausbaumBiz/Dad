import { type NextRequest, NextResponse } from "next/server"
import { trackAnalyticsEvent } from "@/app/actions/analytics-actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { businessId, eventType, zipCode, metadata } = body

    if (!businessId || !eventType) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: businessId, eventType" },
        { status: 400 },
      )
    }

    const result = await trackAnalyticsEvent({
      businessId,
      eventType,
      zipCode,
      timestamp: Date.now(),
      metadata,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in analytics track route:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    )
  }
}
