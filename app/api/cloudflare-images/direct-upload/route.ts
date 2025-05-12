import { NextResponse } from "next/server"
import { FormData as NodeFormData } from "formdata-node"

export async function POST(request: Request) {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    if (!accountId || !apiToken) {
      return NextResponse.json({ success: false, error: "Missing Cloudflare credentials" }, { status: 500 })
    }

    // Get metadata from request
    const data = await request.json()
    const metadata = data.metadata || {}

    // Create a FormData object for the request to Cloudflare
    const formData = new NodeFormData()
    formData.append("requireSignedURLs", "false")

    // Add metadata as JSON string if it exists
    if (Object.keys(metadata).length > 0) {
      formData.append("metadata", JSON.stringify(metadata))
    }

    // Request a direct upload URL from Cloudflare using FormData
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        // Don't set Content-Type here, it will be set automatically with the boundary
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Cloudflare direct upload URL error:", errorData)
      return NextResponse.json(
        {
          success: false,
          error: `Failed to get upload URL: ${errorData.errors?.[0]?.message || response.statusText}`,
        },
        { status: response.status },
      )
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      uploadURL: result.result.uploadURL,
      id: result.result.id,
    })
  } catch (error) {
    console.error("Error getting direct upload URL:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
