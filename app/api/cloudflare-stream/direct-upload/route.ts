import { NextResponse } from "next/server"
import { getDirectUploadUrl } from "@/lib/cloudflare-stream"

export async function GET() {
  try {
    const result = await getDirectUploadUrl()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in direct-upload API route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
