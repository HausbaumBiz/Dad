import { type NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

// Helper function to safely test Redis with timeout
async function safeRedisOperation<T>(operation: () => Promise<T>, timeoutMs = 3000): Promise<T | null> {
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs),
      ),
    ])
  } catch (error) {
    console.error("[DEBUG] Redis operation failed:", error)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { businessId: string } }) {
  const { businessId } = params

  console.log(`[DEBUG] Starting diagnostics for business ${businessId}`)

  try {
    let redisConnected = false
    let redisStatus = "unknown"
    let reviewCount = 0
    let reviewIds: string[] = []
    let sampleReview = null
    let errorDetails = null
    let connectionTime = 0

    // Test Redis connection with timing
    const connectionStart = Date.now()
    try {
      console.log("[DEBUG] Testing Redis connection with timeout...")
      const pingResult = await safeRedisOperation(() => redis.ping(), 2000)
      connectionTime = Date.now() - connectionStart

      console.log(`[DEBUG] Redis ping result:`, pingResult, `(${connectionTime}ms)`)

      if (pingResult === "PONG") {
        redisConnected = true
        redisStatus = "connected"
        console.log(`[DEBUG] Redis connection successful in ${connectionTime}ms`)
      } else {
        redisConnected = false
        redisStatus = "ping_failed"
        errorDetails = {
          operation: "redis_ping",
          message: `Unexpected ping result: ${pingResult}`,
          type: "ping_error",
          connectionTime,
        }
      }
    } catch (redisError: any) {
      connectionTime = Date.now() - connectionStart
      console.error(`[DEBUG] Redis connection error after ${connectionTime}ms:`, redisError)
      redisConnected = false

      // Categorize the error more precisely
      const errorMessage = redisError?.message || String(redisError)

      if (errorMessage.includes("timeout") || errorMessage.includes("Operation timeout")) {
        redisStatus = "timeout"
      } else if (errorMessage.includes("429") || redisError?.status === 429) {
        redisStatus = "rate_limited"
      } else if (errorMessage.includes("connection") || errorMessage.includes("ECONNREFUSED")) {
        redisStatus = "disconnected"
      } else if (errorMessage.includes("map is not a function")) {
        redisStatus = "data_error"
      } else {
        redisStatus = "error"
      }

      errorDetails = {
        operation: "redis_connection",
        message: errorMessage,
        code: redisError?.code,
        status: redisError?.status,
        type: typeof redisError,
        connectionTime,
        stack: redisError?.stack?.split("\n").slice(0, 3).join("\n"), // Truncated stack
      }
    }

    // If Redis is connected, try to get review data
    if (redisConnected) {
      try {
        console.log(`[DEBUG] Fetching review IDs for business ${businessId}`)
        const reviewIdsResult = await safeRedisOperation(() => redis.smembers(`business:${businessId}:reviews`), 3000)

        console.log("[DEBUG] Raw smembers result:", reviewIdsResult, "Type:", typeof reviewIdsResult)

        // Handle different return types from Redis
        if (Array.isArray(reviewIdsResult)) {
          reviewIds = reviewIdsResult
          reviewCount = reviewIds.length
        } else if (reviewIdsResult === null || reviewIdsResult === undefined) {
          reviewIds = []
          reviewCount = 0
        } else {
          // If it's not an array, try to handle it gracefully
          console.warn("[DEBUG] Unexpected smembers result type:", typeof reviewIdsResult, reviewIdsResult)
          reviewIds = []
          reviewCount = 0
          errorDetails = {
            operation: "smembers",
            message: `Unexpected result type: ${typeof reviewIdsResult}`,
            type: "data_type_error",
            result: reviewIdsResult,
          }
        }

        console.log(`[DEBUG] Found ${reviewCount} review IDs for business ${businessId}`)

        // Try to get a sample review if any exist
        if (reviewIds.length > 0) {
          try {
            const sampleReviewId = reviewIds[0]
            console.log(`[DEBUG] Fetching sample review: ${sampleReviewId}`)

            const reviewData = await safeRedisOperation(() => redis.get(`review:${sampleReviewId}`), 2000)

            console.log("[DEBUG] Sample review data:", reviewData, typeof reviewData)

            if (reviewData) {
              if (typeof reviewData === "string") {
                try {
                  sampleReview = JSON.parse(reviewData)
                  console.log(`[DEBUG] Successfully parsed sample review`)
                } catch (parseError: any) {
                  console.error(`[DEBUG] Failed to parse sample review:`, parseError)
                  sampleReview = {
                    raw: reviewData.substring(0, 200) + (reviewData.length > 200 ? "..." : ""),
                    parseError: parseError.message,
                    type: typeof reviewData,
                  }
                }
              } else {
                sampleReview = reviewData
                console.log(`[DEBUG] Sample review is object type`)
              }
            } else {
              console.log(`[DEBUG] No data found for sample review ${sampleReviewId}`)
            }
          } catch (sampleError: any) {
            console.error("[DEBUG] Error fetching sample review:", sampleError)
            if (!errorDetails) {
              // Don't overwrite existing errors
              errorDetails = {
                operation: "get_sample_review",
                message: sampleError?.message || String(sampleError),
                type: "sample_fetch_error",
              }
            }
          }
        }
      } catch (dataError: any) {
        console.error("[DEBUG] Error fetching review data:", dataError)
        redisStatus = "data_error"
        errorDetails = {
          operation: "fetch_reviews",
          message: dataError?.message || String(dataError),
          type: "data_fetch_error",
          stack: dataError?.stack?.split("\n").slice(0, 3).join("\n"),
        }
      }
    }

    // Environment info
    const debugInfo = {
      redisUrl: process.env.REDIS_URL ? "configured" : "missing",
      kvUrl: process.env.KV_URL ? "configured" : "missing",
      kvRestApiUrl: process.env.KV_REST_API_URL ? "configured" : "missing",
      kvRestApiToken: process.env.KV_REST_API_TOKEN ? "configured" : "missing",
      environment: process.env.NODE_ENV || "unknown",
      nodeVersion: typeof process !== "undefined" && process.version ? process.version : "unknown",
      uptime: typeof process !== "undefined" && typeof process.uptime === "function" ? process.uptime() : "unavailable",
    }

    const result = {
      success: redisConnected && !errorDetails,
      businessId,
      redisConnected,
      redisStatus,
      connectionTime,
      reviewCount,
      reviewIds: reviewIds.slice(0, 5), // Only return first 5 IDs for debugging
      sampleReview,
      errorDetails,
      debugInfo,
      timestamp: new Date().toISOString(),
    }

    console.log("[DEBUG] Diagnostic results:", {
      ...result,
      sampleReview: result.sampleReview ? "present" : "null",
      errorDetails: result.errorDetails ? "present" : "null",
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("[DEBUG] Diagnostic error:", error)

    return NextResponse.json(
      {
        success: false,
        businessId,
        redisConnected: false,
        redisStatus: "diagnostic_error",
        reviewCount: 0,
        errorDetails: {
          operation: "diagnostics",
          message: error?.message || String(error),
          type: "diagnostic_error",
          stack: error?.stack?.split("\n").slice(0, 3).join("\n"),
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
