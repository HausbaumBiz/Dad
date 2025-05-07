import { getDirectUploadUrl } from "@/lib/cloudflare-stream"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const result = await getDirectUploadUrl()

    if (result.success) {
      return NextResponse.json({
        success: true,
        uploadUrl: result.uploadUrl,
        id: result.id,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to get direct upload URL",
        },
        { status: 400 },
      )
    }
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
