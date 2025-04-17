import { NextResponse } from "next/server"
import redis from "@/lib/redis"

export async function GET() {
  try {
    // Set a test value
    const testKey = "test-connection"
    const testValue = "Connection successful at " + new Date().toISOString()

    await redis.set(testKey, testValue)

    // Get the value back
    const retrievedValue = await redis.get(testKey)

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Redis connection test successful",
      testValue: retrievedValue,
    })
  } catch (error) {
    console.error("Redis connection test failed:", error)

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: "Redis connection test failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
