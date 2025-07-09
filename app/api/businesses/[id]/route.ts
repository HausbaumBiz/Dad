import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

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
    console.log(`Attempting to get value for key: ${key}`)

    // Try direct get first (most common case)
    try {
      const value = await kv.get(key)
      if (value !== null && value !== undefined) {
        console.log(`Successfully retrieved value for key ${key} using direct get`)
        return value
      }
    } catch (directError) {
      console.log(`Direct get failed for key ${key}, trying type-specific approach:`, getErrorMessage(directError))
    }

    // If direct get fails, try to determine the key type
    let keyType: string | null = null
    try {
      keyType = await kv.type(key)
      console.log(`Key ${key} has type: ${keyType}`)

      // Redis returns "none" for non-existent keys
      if (keyType === "none" || !keyType) {
        console.log(`Key ${key} does not exist`)
        return null
      }
    } catch (typeError) {
      console.log(`Error getting type for key ${key}:`, getErrorMessage(typeError))
      return null
    }

    // Handle different Redis data types appropriately
    try {
      switch (keyType) {
        case "string":
          return await kv.get(key)

        case "set":
          const setMembers = await kv.smembers(key)
          console.log(`Retrieved set with ${setMembers?.length || 0} members for key ${key}`)
          return setMembers

        case "hash":
          const hashData = await kv.hgetall(key)
          console.log(`Retrieved hash with keys: ${Object.keys(hashData || {}).join(", ")} for key ${key}`)
          return hashData

        case "list":
          const listData = await kv.lrange(key, 0, -1)
          console.log(`Retrieved list with ${listData?.length || 0} items for key ${key}`)
          return listData

        case "zset":
          const zsetData = await kv.zrange(key, 0, -1)
          console.log(`Retrieved sorted set with ${zsetData?.length || 0} items for key ${key}`)
          return zsetData

        default:
          console.warn(`Unsupported Redis data type: ${keyType} for key ${key}`)
          return null
      }
    } catch (typeSpecificError) {
      console.error(`Error retrieving ${keyType} value for key ${key}:`, getErrorMessage(typeSpecificError))
      return null
    }
  } catch (error) {
    console.error(`Error getting value for key ${key}:`, getErrorMessage(error))
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    if (!id) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    console.log(`Fetching business data for ID: ${id}`)

    // Get business data using safe method
    const business = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${id}`)

    if (!business) {
      console.log(`Business not found for ID: ${id}`)
      return NextResponse.json({ error: "Business not found" }, { status: 404 })
    }

    // Get additional business data that might be stored separately
    const additionalData: any = {}

    // Try to get photo album data
    try {
      const photoAlbumKey = `${KEY_PREFIXES.BUSINESS}${id}:photoAlbum`
      const photoAlbum = await safeRedisGet(photoAlbumKey)
      if (photoAlbum) {
        additionalData.photoAlbum = Array.isArray(photoAlbum) ? photoAlbum : JSON.parse(photoAlbum || "[]")
      }
    } catch (error) {
      console.warn(`Error getting photo album for business ${id}:`, getErrorMessage(error))
    }

    // Try to get media data
    try {
      const mediaKey = `${KEY_PREFIXES.BUSINESS}${id}:media`
      const media = await safeRedisGet(mediaKey)
      if (media) {
        additionalData.media = typeof media === "string" ? JSON.parse(media) : media
      }
    } catch (error) {
      console.warn(`Error getting media for business ${id}:`, getErrorMessage(error))
    }

    // Try to get ad design data
    try {
      const adDesignKey = `${KEY_PREFIXES.BUSINESS}${id}:adDesign`
      const adDesign = await safeRedisGet(adDesignKey)
      if (adDesign) {
        additionalData.adDesign = typeof adDesign === "string" ? JSON.parse(adDesign) : adDesign
      }
    } catch (error) {
      console.warn(`Error getting ad design for business ${id}:`, getErrorMessage(error))
    }

    // Combine all data
    const businessData = {
      ...business,
      ...additionalData,
      id,
    }

    console.log(`Successfully retrieved business data for ${id}`)
    return NextResponse.json(businessData)
  } catch (error) {
    console.error(`Error fetching business ${params.id}:`, getErrorMessage(error))
    return NextResponse.json({ error: "Failed to fetch business" }, { status: 500 })
  }
}
