import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("Simple test API called")

    return NextResponse.json({
      success: true,
      message: "Simple test API is working",
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasKvUrl: !!process.env.KV_URL,
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      },
    })
  } catch (error) {
    console.error("Error in simple test:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
