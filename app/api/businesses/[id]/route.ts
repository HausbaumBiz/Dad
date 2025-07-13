import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return JSON.stringify(error, Object.getOwnPropertyNames(error))
}

// Helper function to safely get a value from Redis
async function safeRedisGet(key: string): Promise<any> {
  try {
    console.log(`[API] Attempting to get value for key: ${key}`)

    // Try direct get first (most common case for string values)
    try {
      const value = await kv.get(key)
      if (value !== null && value !== undefined) {
        console.log(`[API] Successfully retrieved value for key ${key} using direct get`)
        return value
      }
    } catch (directError) {
      console.log(`[API] Direct get failed for key ${key}, trying other methods:`, getErrorMessage(directError))
    }

    // If direct get fails or returns null, try hash operations
    try {
      const hashData = await kv.hgetall(key)
      if (hashData && Object.keys(hashData).length > 0) {
        console.log(`[API] Retrieved hash data for key ${key}`)
        return hashData
      }
    } catch (hashError) {
      console.log(`[API] Hash get failed for key ${key}:`, getErrorMessage(hashError))
    }

    // Try set operations
    try {
      const setData = await kv.smembers(key)
      if (setData && Array.isArray(setData) && setData.length > 0) {
        console.log(`[API] Retrieved set data for key ${key}`)
        return setData
      }
    } catch (setError) {
      console.log(`[API] Set get failed for key ${key}:`, getErrorMessage(setError))
    }

    // Try list operations
    try {
      const listData = await kv.lrange(key, 0, -1)
      if (listData && Array.isArray(listData) && listData.length > 0) {
        console.log(`[API] Retrieved list data for key ${key}`)
        return listData
      }
    } catch (listError) {
      console.log(`[API] List get failed for key ${key}:`, getErrorMessage(listError))
    }

    console.log(`[API] No data found for key ${key}`)
    return null
  } catch (error) {
    console.error(`[API] Error getting value for key ${key}:`, getErrorMessage(error))
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = params.id
    console.log(`[API] Fetching business data for ID: ${businessId}`)

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    // Try to get business data from multiple possible keys
    const businessKeys = [`business:${businessId}`, `business:${businessId}:adDesign`, `business:${businessId}:media`]

    let businessData: any = {}

    for (const key of businessKeys) {
      try {
        const data = await safeRedisGet(key)
        if (data) {
          console.log(`[API] Found data in key ${key}`)
          if (key.includes(":adDesign")) {
            businessData.adDesign = data
          } else if (key.includes(":media")) {
            businessData.media = data
          } else {
            // Main business data
            businessData = { ...businessData, ...data }
          }
        }
      } catch (error) {
        console.log(`[API] Error fetching from key ${key}:`, getErrorMessage(error))
        continue
      }
    }

    if (!businessData || Object.keys(businessData).length === 0) {
      console.log(`[API] No business data found for ID: ${businessId}`)
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    console.log(`[API] Successfully retrieved business data for ${businessId}`)
    return NextResponse.json(businessData)
  } catch (error) {
    console.error("[API] Error in GET /api/businesses/[id]:", getErrorMessage(error))
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
