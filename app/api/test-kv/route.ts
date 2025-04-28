import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function GET() {
  try {
    // Try to set a test value
    await kv.set("test:connection", "working")

    // Try to get the test value
    const testValue = await kv.get("test:connection")

    // Return success response
    return NextResponse.json({
      status: "success",
      message: "KV connection is working",
      testValue,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("KV connection test failed:", error)

    // Return error response
    return NextResponse.json(
      {
        status: "error",
        message: "KV connection test failed",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
