"use server"

import { kv } from "@/lib/redis"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"

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

// Helper function to safely check if a key exists and get its type
async function safeKeyTypeCheck(key: string): Promise<string | null> {
  try {
    try {
      const keyType = await kv.type(key)
      console.log(`Key ${key} has type: ${keyType}`)

      if (keyType === "none" || !keyType) {
        console.log(`Key ${key} does not exist`)
        return null
      }

      return keyType
    } catch (typeError) {
      console.log(`Error getting type for key ${key}, trying alternative approach:`, getErrorMessage(typeError))

      try {
        const value = await kv.get(key)
        if (value === null || value === undefined) {
          console.log(`Key ${key} does not exist (null value)`)
          return null
        }
        console.log(`Key ${key} exists and returned a value, assuming string type`)
        return "string"
      } catch (getError) {
        console.log(`Direct get also failed for key ${key}:`, getErrorMessage(getError))
        return null
      }
    }
  } catch (error) {
    console.error(`Error in safeKeyTypeCheck for ${key}:`, getErrorMessage(error))
    return null
  }
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

    // If direct get fails or returns null, try to determine the key type
    const keyType = await safeKeyTypeCheck(key)

    if (!keyType) {
      console.log(`Key ${key} does not exist or type check failed`)
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

// Helper function to process photo data and generate URLs
function processPhotoData(photoData: any): string[] {
  const photos: string[] = []

  if (!photoData) return photos

  // Handle array of photos
  if (Array.isArray(photoData)) {
    photoData.forEach((photo: any) => {
      if (typeof photo === "string") {
        // If it's already a URL, use it; otherwise generate Cloudflare URL
        if (photo.startsWith("http")) {
          photos.push(photo)
        } else {
          photos.push(getCloudflareImageUrl(photo, "public"))
        }
      } else if (photo && typeof photo === "object") {
        // Handle object format
        const imageId = photo.id || photo.imageId || photo.url
        if (imageId) {
          if (imageId.startsWith("http")) {
            photos.push(imageId)
          } else {
            photos.push(getCloudflareImageUrl(imageId, "public"))
          }
        }
      }
    })
  }
  // Handle single photo object
  else if (typeof photoData === "object") {
    const imageId = photoData.id || photoData.imageId || photoData.url
    if (imageId) {
      if (imageId.startsWith("http")) {
        photos.push(imageId)
      } else {
        photos.push(getCloudflareImageUrl(imageId, "public"))
      }
    }
  }
  // Handle single photo string
  else if (typeof photoData === "string") {
    if (photoData.startsWith("http")) {
      photos.push(photoData)
    } else {
      photos.push(getCloudflareImageUrl(photoData, "public"))
    }
  }

  return photos
}

// Function to load business photos from Redis and generate Cloudflare URLs
export async function loadBusinessPhotos(businessId: string): Promise<string[]> {
  try {
    console.log(`Loading photos for business: ${businessId}`)

    const allPhotos: string[] = []

    // List of potential photo keys to check
    const photoKeys = [
      `business:${businessId}`,
      `business:${businessId}:media`,
      `business:${businessId}:adDesign`,
      `business:${businessId}:photos`,
      `business:${businessId}:photoAlbum`,
      `business:${businessId}:images`,
      `business:${businessId}:adDesign:businessInfo`,
    ]

    for (const key of photoKeys) {
      try {
        const data = await safeRedisGet(key)

        if (data && typeof data === "object") {
          // Check for photoAlbum field in the data
          if (data.photoAlbum) {
            console.log(`Found photoAlbum in ${key}:`, data.photoAlbum)
            const photos = processPhotoData(data.photoAlbum)
            allPhotos.push(...photos)
          }

          // Check for media.photoAlbum field
          if (data.media && data.media.photoAlbum) {
            console.log(`Found media.photoAlbum in ${key}:`, data.media.photoAlbum)
            const photos = processPhotoData(data.media.photoAlbum)
            allPhotos.push(...photos)
          }

          // Check for adDesign.photoAlbum field
          if (data.adDesign && data.adDesign.photoAlbum) {
            console.log(`Found adDesign.photoAlbum in ${key}:`, data.adDesign.photoAlbum)
            const photos = processPhotoData(data.adDesign.photoAlbum)
            allPhotos.push(...photos)
          }

          // Check for photos field
          if (data.photos) {
            console.log(`Found photos in ${key}:`, data.photos)
            const photos = processPhotoData(data.photos)
            allPhotos.push(...photos)
          }

          // Check for images field
          if (data.images) {
            console.log(`Found images in ${key}:`, data.images)
            const photos = processPhotoData(data.images)
            allPhotos.push(...photos)
          }
        }
        // Handle direct photo data (for keys like business:id:photos)
        else if (data) {
          console.log(`Found direct photo data in ${key}:`, data)
          const photos = processPhotoData(data)
          allPhotos.push(...photos)
        }
      } catch (error) {
        console.log(`No data or error for key ${key}:`, getErrorMessage(error))
        continue
      }
    }

    // Remove duplicates
    const uniquePhotos = [...new Set(allPhotos)]

    console.log(`Total unique photos found for business ${businessId}:`, uniquePhotos.length)
    return uniquePhotos
  } catch (error) {
    console.error("Error loading business photos:", getErrorMessage(error))
    return []
  }
}
