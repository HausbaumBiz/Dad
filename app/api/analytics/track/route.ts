import { type NextRequest, NextResponse } from "next/server"
import { trackAnalyticsEvent, type AnalyticsEvent } from "@/app/actions/analytics-actions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, eventType } = body

    if (!businessId || !eventType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user agent and IP for tracking
    const userAgent = request.headers.get("user-agent") || undefined
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.ip || undefined

    const event: AnalyticsEvent = {
      businessId,
      eventType,
      timestamp: Date.now(),
      userAgent,
      ipAddress,
    }

    await trackAnalyticsEvent(event)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error tracking analytics event:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
