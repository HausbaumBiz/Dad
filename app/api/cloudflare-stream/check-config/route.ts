import { checkCloudflareConfig } from "@/lib/cloudflare-stream"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await checkCloudflareConfig()

    return NextResponse.json({
      configured: result.configured,
      success: result.success,
      error: result.error,
    })
  } catch (error) {
    console.error("Error checking Cloudflare config:", error)
    return NextResponse.json(
      {
        configured: false,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
