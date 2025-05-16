import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = params.id

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    // Fetch reviews from Redis
    const reviewsKey = `business:${businessId}:reviews`
    const reviews = (await kv.lrange(reviewsKey, 0, -1)) || []

    // If no reviews exist yet, return an empty array
    if (!reviews || reviews.length === 0) {
      return NextResponse.json({ reviews: [] })
    }

    return NextResponse.json({ reviews })
  } catch (error) {
    console.error("Error fetching business reviews:", error)
    return NextResponse.json({ error: "Failed to fetch business reviews" }, { status: 500 })
  }
}
