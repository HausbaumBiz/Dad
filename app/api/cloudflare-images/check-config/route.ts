import { NextResponse } from "next/server"

export async function GET() {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const apiToken = process.env.CLOUDFLARE_API_TOKEN

    if (!accountId || !apiToken) {
      return NextResponse.json({
        configured: false,
        error:
          "Missing Cloudflare credentials. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN environment variables.",
      })
    }

    // Test the Cloudflare Images API
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/stats`, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        configured: false,
        error: `Cloudflare API error: ${errorData.errors?.[0]?.message || response.statusText}`,
        status: response.status,
      })
    }

    const data = await response.json()

    return NextResponse.json({
      configured: true,
      stats: data.result,
    })
  } catch (error) {
    console.error("Error checking Cloudflare Images configuration:", error)
    return NextResponse.json({
      configured: false,
      error: error instanceof Error ? error.message : "Unknown error checking Cloudflare configuration",
    })
  }
}
