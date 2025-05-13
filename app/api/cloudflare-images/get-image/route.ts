import { type NextRequest, NextResponse } from "next/server"
import { CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } from "@/lib/cloudflare-images"

export async function GET(request: NextRequest) {
  try {
    // Get the image ID from the query parameters
    const imageId = request.nextUrl.searchParams.get("id")

    if (!imageId) {
      return NextResponse.json({ error: "Image ID is required" }, { status: 400 })
    }

    // Check if we have the required Cloudflare credentials
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      console.error("Cloudflare credentials not configured")
      return NextResponse.json({ error: "Cloudflare credentials not configured" }, { status: 500 })
    }

    // Make a direct API call to Cloudflare to get the image details
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1/${imageId}`,
      {
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
        cache: "no-store", // Ensure we're not caching the API response
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Cloudflare API error (${response.status}):`, errorText)
      return NextResponse.json(
        { error: `Failed to retrieve image: ${response.statusText}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    if (!data.success) {
      console.error("Cloudflare API error:", data.errors)
      return NextResponse.json({ error: data.errors?.[0]?.message || "Failed to retrieve image" }, { status: 500 })
    }

    // Return the image details including the direct download URL
    return NextResponse.json({
      success: true,
      image: data.result,
      // Include a direct download URL that doesn't require authentication
      downloadUrl: `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_ID}/${imageId}/public`,
    })
  } catch (error) {
    console.error("Error retrieving image from Cloudflare:", error)
    return NextResponse.json({ error: "Failed to retrieve image" }, { status: 500 })
  }
}
