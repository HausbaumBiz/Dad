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

// Helper function to safely parse JSON
function safeJsonParse(data: any, fallback: any = null) {
  try {
    if (typeof data === "string") {
      return JSON.parse(data)
    }
    if (typeof data === "object" && data !== null) {
      return data
    }
    return fallback
  } catch (error) {
    console.error("Error parsing JSON:", getErrorMessage(error))
    return fallback
  }
}

// Helper function to safely get a value from Redis (handles both strings and hashes)
async function safeRedisGet(key: string): Promise<any> {
  try {
    console.log(`Getting value for key: ${key}`)

    // First try to get the key type
    const keyType = await kv.type(key)
    console.log(`Key ${key} type: ${keyType}`)

    if (keyType === "none") {
      console.log(`Key ${key} does not exist`)
      return null
    }

    let value
    if (keyType === "hash") {
      // If it's a hash, get all fields
      value = await kv.hgetall(key)
      console.log(`Got hash value for key ${key}:`, value)
    } else if (keyType === "string") {
      // If it's a string, use regular get
      value = await kv.get(key)
      console.log(`Got string value for key ${key}:`, value)
    } else {
      console.log(`Unsupported key type ${keyType} for key ${key}`)
      return null
    }

    return value
  } catch (error) {
    console.error(`Error getting value for key ${key}:`, getErrorMessage(error))
    return null
  }
}

// Helper function to extract photos from various data structures
function extractPhotosFromData(data: any, source: string): any[] {
  if (!data) return []

  const photos = []

  try {
    // Handle different data structures
    if (Array.isArray(data)) {
      photos.push(...data)
    } else if (typeof data === "object") {
      // Check for photoAlbum property
      if (data.photoAlbum && Array.isArray(data.photoAlbum)) {
        photos.push(...data.photoAlbum)
      }

      // Check for photos property
      if (data.photos && Array.isArray(data.photos)) {
        photos.push(...data.photos)
      }

      // If it's a hash, check each field for photo data
      for (const [key, value] of Object.entries(data)) {
        if (key.includes("photo") || key.includes("image")) {
          try {
            const parsedValue = safeJsonParse(value, value)
            if (Array.isArray(parsedValue)) {
              photos.push(...parsedValue)
            } else if (parsedValue) {
              photos.push(parsedValue)
            }
          } catch (error) {
            console.error(`Error processing photo field ${key}:`, error)
          }
        }
      }
    }

    console.log(`[Photos API] Extracted ${photos.length} photos from ${source}`)
    return photos
  } catch (error) {
    console.error(`[Photos API] Error extracting photos from ${source}:`, getErrorMessage(error))
    return []
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const businessId = params.id

    if (!businessId) {
      return NextResponse.json({ error: "Business ID is required" }, { status: 400 })
    }

    console.log(`[Photos API] Getting photos for business: ${businessId}`)

    const allPhotos = []

    // 1. Try main business data
    try {
      const businessData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}`)
      if (businessData) {
        const business = safeJsonParse(businessData, businessData)
        const photos = extractPhotosFromData(business, "main business data")
        allPhotos.push(...photos)
      }
    } catch (error) {
      console.error(`[Photos API] Error getting main business data:`, getErrorMessage(error))
    }

    // 2. Try dedicated photo album key
    try {
      const photoAlbumData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:photoAlbum`)
      if (photoAlbumData) {
        const photos = extractPhotosFromData(photoAlbumData, "dedicated photoAlbum")
        allPhotos.push(...photos)
      }
    } catch (error) {
      console.error(`[Photos API] Error getting photo album:`, getErrorMessage(error))
    }

    // 3. Try media data
    try {
      const mediaData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:media`)
      if (mediaData) {
        const photos = extractPhotosFromData(mediaData, "media data")
        allPhotos.push(...photos)
      }
    } catch (error) {
      console.error(`[Photos API] Error getting media data:`, getErrorMessage(error))
    }

    // 4. Try adDesign data
    try {
      const adDesignData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`)
      if (adDesignData) {
        const photos = extractPhotosFromData(adDesignData, "adDesign data")
        allPhotos.push(...photos)
      }
    } catch (error) {
      console.error(`[Photos API] Error getting ad design data:`, getErrorMessage(error))
    }

    // 5. Try adDesignData (different key pattern)
    try {
      const adDesignData = await safeRedisGet(`${KEY_PREFIXES.BUSINESS}${businessId}:adDesignData`)
      if (adDesignData) {
        const photos = extractPhotosFromData(adDesignData, "adDesignData")
        allPhotos.push(...photos)
      }
    } catch (error) {
      console.error(`[Photos API] Error getting adDesignData:`, getErrorMessage(error))
    }

    console.log(`[Photos API] Total photos found: ${allPhotos.length}`)
    console.log(`[Photos API] Raw photos:`, allPhotos)

    // Process and deduplicate photos
    const processedPhotos = []
    const seenIds = new Set()

    for (const photo of allPhotos) {
      try {
        let photoId = null

        if (typeof photo === "string") {
          photoId = photo
        } else if (photo && typeof photo === "object") {
          photoId = photo.id || photo.imageId || photo.url || photo.cloudflareId || photo.photoId
        }

        if (photoId && !seenIds.has(photoId)) {
          seenIds.add(photoId)
          processedPhotos.push(photoId)
        }
      } catch (error) {
        console.error(`[Photos API] Error processing photo:`, photo, getErrorMessage(error))
      }
    }

    console.log(`[Photos API] Processed unique photos: ${processedPhotos.length}`)
    console.log(`[Photos API] Final photo IDs:`, processedPhotos)

    return NextResponse.json({
      success: true,
      photos: processedPhotos,
      count: processedPhotos.length,
      debug: {
        totalFound: allPhotos.length,
        uniqueProcessed: processedPhotos.length,
      },
    })
  } catch (error) {
    console.error(`[Photos API] Error getting photos for business ${params.id}:`, getErrorMessage(error))
    return NextResponse.json(
      {
        error: "Failed to get photos",
        details: getErrorMessage(error),
        businessId: params.id,
      },
      { status: 500 },
    )
  }
}
