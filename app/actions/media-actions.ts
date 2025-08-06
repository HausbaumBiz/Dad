"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { v4 as uuidv4 } from "uuid"
import {
  uploadToCloudflareImages,
  deleteFromCloudflareImages,
  getCloudflareImageUrl,
  listCloudflareImages,
  cloudflareImageToMediaItem,
} from "@/lib/cloudflare-images"
import { deleteVideo } from "@/lib/cloudflare-stream"
import { createVideoDisplayData, type VideoDisplayData, type VideoRetrievalResult } from "@/lib/video-display-utils"
import type { Business } from "@/lib/definitions"
import { KEY_PREFIXES } from "@/lib/db-schema"

export type MediaItem = {
  id: string
  url: string
  filename: string
  contentType: string
  size: number
  originalSize?: number
  compressionSavings?: number
  width?: number
  height?: number
  createdAt: string
  folderId?: string
  tags?: string[]
  label?: string
  sortOrder?: number
}

export type MediaFolder = {
  id: string
  name: string
  createdAt: string
  parentId?: string
}

export type BusinessMedia = {
  videoUrl?: string
  videoContentType?: string
  videoId?: string
  thumbnailUrl?: string
  thumbnailId?: string
  photoAlbum: MediaItem[]
  folders?: MediaFolder[]
  tags?: string[]
}

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  if (error && typeof error === "object") {
    try {
      // Try to get a meaningful error message from common error object structures
      if ("message" in error && typeof error.message === "string") {
        return error.message
      }
      if ("error" in error && typeof error.error === "string") {
        return error.error
      }
      if ("details" in error && typeof error.details === "string") {
        return error.details
      }
      // If it's a response-like object, try to extract useful info
      if ("status" in error && "statusText" in error) {
        return `HTTP ${error.status}: ${error.statusText}`
      }
      // Last resort: stringify but with better formatting
      const stringified = JSON.stringify(error, null, 2)
      if (stringified && stringified !== "{}" && stringified !== "[object Object]") {
        return stringified
      }
      return `Error object: ${Object.prototype.toString.call(error)}`
    } catch (stringifyError) {
      return `Error occurred (could not stringify): ${Object.prototype.toString.call(error)}`
    }
  }
  return "Unknown error occurred"
}

// Helper function to safely parse JSON data
function safeJsonParse(data: any, fallback: any = null) {
  try {
    if (typeof data === "string") {
      const parsed = JSON.parse(data)
      return parsed
    }
    if (typeof data === "object" && data !== null) {
      return data
    }
    return fallback
  } catch (error) {
    console.error("Error parsing JSON:", error, "Data:", data)
    return fallback
  }
}

// Extract video status from Cloudflare's response format
function extractVideoStatus(video: any): string {
  if (!video) return "unknown"

  // Handle Cloudflare's nested status format: status: {state: "ready"}
  if (video.status && typeof video.status === "object" && video.status.state) {
    return video.status.state
  }

  // Handle simple string status
  if (typeof video.status === "string") {
    return video.status
  }

  // Fallback
  return "unknown"
}

// Validate video data from Cloudflare Stream API
function validateVideoData(video: any): boolean {
  if (!video || typeof video !== "object") {
    console.error("Video data is not an object:", typeof video)
    return false
  }

  // Check for required fields - Cloudflare uses 'uid' instead of 'id'
  const hasId = video.uid || video.id
  if (!hasId) {
    console.error("Video missing ID/UID field:", Object.keys(video))
    return false
  }

  // Status validation - handle Cloudflare's nested format
  const status = extractVideoStatus(video)
  if (!status || status === "unknown") {
    console.warn("Video has unknown status:", video.status)
    // Don't reject - just warn, as the video might still be usable
  }

  return true
}

/**
 * Enhanced function to search for videos in multiple Redis locations
 */
async function searchBusinessVideos(businessId: string): Promise<VideoRetrievalResult> {
  try {
    console.log(`Starting comprehensive video search for business: ${businessId}`)

    const foundVideos: VideoDisplayData[] = []
    const searchedVideoIds = new Set<string>()

    // Helper function to safely get data from Redis key
    const safeGetRedisData = async (key: string) => {
      try {
        console.log(`Checking key: ${key}`)

        const exists = await kv.exists(key)
        if (!exists) {
          console.log(`Key ${key} does not exist`)
          return null
        }

        const keyType = await kv.type(key)
        console.log(`Key ${key} type: ${keyType}`)

        switch (keyType) {
          case "hash":
            return await kv.hgetall(key)
          case "string":
            const stringValue = await kv.get(key)
            if (typeof stringValue === "string" && (stringValue.startsWith("{") || stringValue.startsWith("["))) {
              try {
                return JSON.parse(stringValue)
              } catch {
                return { value: stringValue }
              }
            }
            return { value: stringValue }
          case "list":
            return { list: await kv.lrange(key, 0, -1) }
          case "set":
            return { set: await kv.smembers(key) }
          case "zset":
            return { zset: await kv.zrange(key, 0, -1, { withScores: true }) }
          default:
            console.log(`Unsupported key type: ${keyType}`)
            return null
        }
      } catch (error) {
        console.error(`Error getting data from key ${key}:`, error)
        return null
      }
    }

    // Helper function to process video ID and add to results
    const processVideoId = async (videoId: string, source: string) => {
      if (!videoId || searchedVideoIds.has(videoId)) {
        return
      }

      console.log(`Processing video ID: ${videoId} from ${source}`)
      searchedVideoIds.add(videoId)

      try {
        const videoData = await createVideoDisplayData(videoId, businessId, source)
        if (videoData) {
          foundVideos.push(videoData)
          console.log(`Successfully added video ${videoId} from ${source}`)
        } else {
          console.log(`Failed to create video data for ${videoId} from ${source}`)
        }
      } catch (error) {
        console.error(`Error processing video ${videoId} from ${source}:`, error)
      }
    }

    // Define search locations and possible video field names
    const searchLocations = [
      { key: `business:${businessId}:media`, name: "Media" },
      { key: `business:${businessId}:cloudflare-media`, name: "Cloudflare Media" },
      { key: `business:${businessId}:adDesign`, name: "Ad Design" },
      { key: `business:${businessId}:workbench`, name: "Workbench" },
      { key: `business:${businessId}`, name: "Business Data" },
    ]

    const possibleVideoFields = [
      "cloudflareVideoId",
      "videoId",
      "video_id",
      "streamId",
      "stream_id",
      "cfVideoId",
      "cf_video_id",
    ]

    // Search all locations for video IDs
    for (const location of searchLocations) {
      console.log(`Searching location: ${location.key}`)

      try {
        const data = await safeGetRedisData(location.key)

        if (data && typeof data === "object") {
          // Search for video IDs in direct fields
          for (const field of possibleVideoFields) {
            if (data[field]) {
              await processVideoId(data[field] as string, location.name)
            }
          }

          // Search for video IDs in nested objects
          for (const [key, value] of Object.entries(data)) {
            if (typeof value === "object" && value !== null) {
              for (const field of possibleVideoFields) {
                if ((value as any)[field]) {
                  await processVideoId((value as any)[field] as string, `${location.name} (${key})`)
                }
              }
            }
          }

          // Special handling for JSON strings
          for (const [key, value] of Object.entries(data)) {
            if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
              try {
                const parsed = JSON.parse(value)
                if (typeof parsed === "object" && parsed !== null) {
                  for (const field of possibleVideoFields) {
                    if (parsed[field]) {
                      await processVideoId(parsed[field] as string, `${location.name} (${key} JSON)`)
                    }
                  }
                }
              } catch (error) {
                // Ignore JSON parsing errors
              }
            }
          }
        }
      } catch (error) {
        console.error(`Error searching location ${location.key}:`, error)
      }
    }

    // Sort videos by upload date (newest first)
    foundVideos.sort((a, b) => {
      const dateA = new Date(a.uploadedAt || 0).getTime()
      const dateB = new Date(b.uploadedAt || 0).getTime()
      return dateB - dateA
    })

    console.log(`Video search completed. Found ${foundVideos.length} videos for business ${businessId}`)

    return {
      success: true,
      videos: foundVideos,
      totalCount: foundVideos.length,
    }
  } catch (error) {
    console.error("Error searching for business videos:", error)
    return {
      success: false,
      videos: [],
      totalCount: 0,
      error: error instanceof Error ? error.message : "Failed to search for videos",
    }
  }
}

// Get all businesses for media management
export async function getBusinessesForMedia(): Promise<Business[]> {
  try {
    console.log("Fetching businesses for media management")

    // Check if KV environment variables are available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("KV environment variables are missing. Using mock data for development.")
      return [
        {
          id: "demo-business-1",
          firstName: "Demo",
          lastName: "User",
          businessName: "Demo Business 1",
          zipCode: "12345",
          email: "demo1@example.com",
          isEmailVerified: true,
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]
    }

    // Get all business IDs from the set
    let businessIds: string[] = []

    try {
      const result = await kv.smembers(KEY_PREFIXES.BUSINESSES_SET)
      if (Array.isArray(result)) {
        businessIds = result.filter((id) => typeof id === "string" && id.trim().length > 0)
      }
      console.log(`Found ${businessIds.length} business IDs for media`)
    } catch (error) {
      console.error("Error fetching business IDs for media:", getErrorMessage(error))
      return []
    }

    if (!businessIds || businessIds.length === 0) {
      console.log("No business IDs found")
      return []
    }

    // Fetch each business's basic data
    const businessesPromises = businessIds.map(async (id) => {
      try {
        const business = (await kv.get(`${KEY_PREFIXES.BUSINESS}${id}`)) as Business | null
        if (business && typeof business === "object") {
          return {
            id,
            firstName: business.firstName || "",
            lastName: business.lastName || "",
            businessName: business.businessName || "",
            zipCode: business.zipCode || "",
            email: business.email || "",
            isEmailVerified: Boolean(business.isEmailVerified),
            status: business.status || "active",
            createdAt: business.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
        return null
      } catch (err) {
        console.error(`Error fetching business ${id} for media:`, getErrorMessage(err))
        return null
      }
    })

    const businesses = (await Promise.all(businessesPromises)).filter(Boolean) as Business[]
    console.log(`Successfully fetched ${businesses.length} businesses for media management`)

    return businesses.sort((a, b) => {
      const dateA = new Date(a.createdAt || "").getTime()
      const dateB = new Date(b.createdAt || "").getTime()
      return dateB - dateA
    })
  } catch (error) {
    console.error("Error fetching businesses for media:", getErrorMessage(error))
    return []
  }
}

/**
 * Upload a photo to the business's photo album using Cloudflare Images
 */
export async function uploadPhoto(formData: FormData) {
  try {
    const businessId = formData.get("businessId") as string
    const file = formData.get("photo") as File
    const folderId = formData.get("folderId") as string | null
    const tags = formData.get("tags") as string | null

    if (!file || !businessId) {
      return { success: false, error: "Missing required fields" }
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "File must be an image" }
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return { success: false, error: "File size must be less than 10MB" }
    }

    // Prepare metadata for Cloudflare Images
    const metadata = {
      businessId,
      originalSize: file.size,
      folderId: folderId || undefined,
      tags: tags ? JSON.parse(tags) : undefined,
    }

    // Upload to Cloudflare Images
    const result = await uploadToCloudflareImages(file, metadata, file.name)

    if (!result || !result.success) {
      return { success: false, error: "Failed to upload to Cloudflare Images" }
    }

    // Convert Cloudflare image to our MediaItem format
    const newPhoto = cloudflareImageToMediaItem(result.result)

    // Check if this is an award photo (has "award" tag)
    const isAwardPhoto = tags && JSON.parse(tags).includes("award")

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    // Add the new photo to the album - awards go first
    let updatedPhotoAlbum
    if (isAwardPhoto) {
      // Add award photos at the beginning
      updatedPhotoAlbum = [newPhoto, ...(existingMedia?.photoAlbum || [])]
    } else {
      // Add regular photos at the end
      updatedPhotoAlbum = [...(existingMedia?.photoAlbum || []), newPhoto]
    }

    // Store in Redis
    await kv.hset(`business:${businessId}:media`, {
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

    revalidatePath(`/photo-album`)
    revalidatePath(`/admin/media`)

    return {
      success: true,
      photo: newPhoto,
      photoAlbum: updatedPhotoAlbum,
    }
  } catch (error) {
    console.error("Error uploading photo:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload photo",
    }
  }
}

/**
 * Delete a photo from the business's photo album and Cloudflare Images
 */
export async function deletePhoto(businessId: string, photoId: string) {
  try {
    if (!photoId || !businessId) {
      return { success: false, error: "Missing required fields" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia || !existingMedia.photoAlbum) {
      return { success: false, error: "No photo album found" }
    }

    // Find the photo to delete
    const photoToDelete = existingMedia.photoAlbum.find((photo) => photo.id === photoId)

    if (!photoToDelete) {
      return { success: false, error: "Photo not found" }
    }

    // Delete from Cloudflare Images
    try {
      const deleteResult = await deleteFromCloudflareImages(photoId)
      if (!deleteResult) {
        console.warn(`Failed to delete photo ${photoId} from Cloudflare Images, but continuing with local deletion`)
      }
    } catch (error) {
      console.warn("Error deleting from Cloudflare Images:", error)
    }

    // Remove from the photo album
    const updatedPhotoAlbum = existingMedia.photoAlbum.filter((photo) => photo.id !== photoId)

    // Update the KV store
    await kv.hset(`business:${businessId}:media`, {
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

    revalidatePath(`/photo-album`)
    revalidatePath(`/admin/media`)

    return {
      success: true,
      photoAlbum: updatedPhotoAlbum,
    }
  } catch (error) {
    console.error("Error deleting photo:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete photo",
    }
  }
}

/**
 * Get all media for a business
 */
export async function getBusinessMedia(businessId: string): Promise<BusinessMedia | null> {
  try {
    if (!businessId) {
      console.log("No businessId provided to getBusinessMedia")
      return { photoAlbum: [], folders: [], tags: [] }
    }

    console.log(`Getting media for business: ${businessId}`)

    // Get the media data from KV
    const mediaData = await kv.hgetall(`business:${businessId}:media`)

    console.log("Raw media data from KV:", mediaData)

    if (!mediaData || Object.keys(mediaData).length === 0) {
      console.log("No media data found, returning default structure")
      return { photoAlbum: [], folders: [], tags: [] }
    }

    // Parse the photo album JSON
    let photoAlbum: MediaItem[] = []
    if (mediaData.photoAlbum) {
      try {
        if (typeof mediaData.photoAlbum === "string") {
          photoAlbum = JSON.parse(mediaData.photoAlbum)
        } else if (Array.isArray(mediaData.photoAlbum)) {
          photoAlbum = mediaData.photoAlbum
        }
      } catch (error) {
        console.error("Error parsing photo album:", error)
        photoAlbum = []
      }
    }

    // Parse folders if they exist
    let folders: MediaFolder[] = []
    if (mediaData.folders) {
      try {
        if (typeof mediaData.folders === "string") {
          folders = JSON.parse(mediaData.folders)
        } else if (Array.isArray(mediaData.folders)) {
          folders = mediaData.folders
        }
      } catch (error) {
        console.error("Error parsing folders:", error)
        folders = []
      }
    }

    // Parse tags if they exist
    let tags: string[] = []
    if (mediaData.tags) {
      try {
        if (typeof mediaData.tags === "string") {
          tags = JSON.parse(mediaData.tags)
        } else if (Array.isArray(mediaData.tags)) {
          tags = mediaData.tags
        }
      } catch (error) {
        console.error("Error parsing tags:", error)
        tags = []
      }
    }

    // Construct the business media object
    const businessMedia: BusinessMedia = {
      videoUrl: mediaData.videoUrl as string,
      videoContentType: mediaData.videoContentType as string,
      videoId: mediaData.videoId as string,
      thumbnailUrl: mediaData.thumbnailUrl as string,
      thumbnailId: mediaData.thumbnailId as string,
      photoAlbum,
      folders,
      tags,
    }

    return businessMedia
  } catch (error) {
    console.error("Error getting business media:", error instanceof Error ? error.message : JSON.stringify(error))
    console.error("Full error stack:", error instanceof Error ? error.stack : error)
    return { photoAlbum: [], folders: [], tags: [] }
  }
}

/**
 * Sync photos from Cloudflare Images to local storage
 */
export async function syncCloudflareImages(businessId: string) {
  try {
    // Get images from Cloudflare with the businessId metadata
    const result = await listCloudflareImages()

    if (!result || !result.success) {
      return { success: false, error: "Failed to list Cloudflare Images" }
    }

    // Filter images for this business
    const businessImages = result.result.images.filter((image) => image.meta?.businessId === businessId)

    // Convert to MediaItem format
    const photoAlbum = businessImages.map(cloudflareImageToMediaItem)

    // Update Redis
    await kv.hset(`business:${businessId}:media`, {
      photoAlbum: JSON.stringify(photoAlbum),
    })

    revalidatePath(`/photo-album`)
    revalidatePath(`/admin/media`)

    return {
      success: true,
      photoAlbum,
    }
  } catch (error) {
    console.error("Error syncing Cloudflare Images:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync Cloudflare Images",
    }
  }
}

/**
 * Move a photo to a folder
 */
export async function movePhotoToFolder(businessId: string, photoId: string, folderId: string | null) {
  try {
    if (!businessId || !photoId) {
      return { success: false, error: "Missing required fields" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia || !existingMedia.photoAlbum) {
      return { success: false, error: "No photo album found" }
    }

    // Find the photo to move
    const photoIndex = existingMedia.photoAlbum.findIndex((photo) => photo.id === photoId)

    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" }
    }

    // Update the photo's folder
    const updatedPhotoAlbum = [...existingMedia.photoAlbum]
    updatedPhotoAlbum[photoIndex] = {
      ...updatedPhotoAlbum[photoIndex],
      folderId: folderId || undefined,
    }

    // Store in KV
    await kv.hset(`business:${businessId}:media`, {
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

    revalidatePath(`/photo-album`)
    revalidatePath(`/admin/media`)

    return {
      success: true,
      photoAlbum: updatedPhotoAlbum,
    }
  } catch (error) {
    console.error("Error moving photo to folder:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to move photo",
    }
  }
}

/**
 * Add tags to a photo
 */
export async function addTagsToPhoto(businessId: string, photoId: string, tags: string[]) {
  try {
    if (!businessId || !photoId || !tags.length) {
      return { success: false, error: "Missing required fields" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia || !existingMedia.photoAlbum) {
      return { success: false, error: "No photo album found" }
    }

    // Find the photo to update
    const photoIndex = existingMedia.photoAlbum.findIndex((photo) => photo.id === photoId)

    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" }
    }

    // Update the photo's tags
    const updatedPhotoAlbum = [...existingMedia.photoAlbum]
    const existingTags = updatedPhotoAlbum[photoIndex].tags || []
    const newTags = [...new Set([...existingTags, ...tags])] // Remove duplicates

    updatedPhotoAlbum[photoIndex] = {
      ...updatedPhotoAlbum[photoIndex],
      tags: newTags,
    }

    // Update the business's tag list
    const updatedTags = existingMedia.tags || []

    // Add any new tags that don't already exist in the business's tag list
    tags.forEach((tag) => {
      if (!updatedTags.includes(tag)) {
        updatedTags.push(tag)
      }
    })

    // Store in KV
    await kv.hset(`business:${businessId}:media`, {
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
      tags: JSON.stringify(updatedTags),
    })

    revalidatePath(`/photo-album`)
    revalidatePath(`/admin/media`)

    return {
      success: true,
      photoAlbum: updatedPhotoAlbum,
      tags: updatedTags,
    }
  } catch (error) {
    console.error("Error adding tags to photo:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add tags",
    }
  }
}

/**
 * Remove a tag from a photo
 */
export async function removeTagFromPhoto(businessId: string, photoId: string, tag: string) {
  try {
    if (!businessId || !photoId || !tag) {
      return { success: false, error: "Missing required fields" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia || !existingMedia.photoAlbum) {
      return { success: false, error: "No photo album found" }
    }

    // Find the photo to update
    const photoIndex = existingMedia.photoAlbum.findIndex((photo) => photo.id === photoId)

    if (photoIndex === -1) {
      return { success: false, error: "Photo not found" }
    }

    // Update the photo's tags
    const updatedPhotoAlbum = [...existingMedia.photoAlbum]
    const existingTags = updatedPhotoAlbum[photoIndex].tags || []
    const newTags = existingTags.filter((t) => t !== tag)

    updatedPhotoAlbum[photoIndex] = {
      ...updatedPhotoAlbum[photoIndex],
      tags: newTags.length > 0 ? newTags : undefined,
    }

    // Store in KV
    await kv.hset(`business:${businessId}:media`, {
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

    revalidatePath(`/photo-album`)
    revalidatePath(`/admin/media`)

    return {
      success: true,
      photoAlbum: updatedPhotoAlbum,
    }
  } catch (error) {
    console.error("Error removing tag from photo:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove tag",
    }
  }
}

export async function createFolder(
  businessId: string,
  name: string,
  parentId: string | null,
): Promise<{ success: boolean; folders: MediaFolder[]; error?: string }> {
  try {
    const folderId = uuidv4()
    const newFolder: MediaFolder = {
      id: folderId,
      name,
      createdAt: new Date().toISOString(),
      parentId: parentId || undefined,
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)
    const existingFolders = existingMedia?.folders || []

    // Add the new folder
    const updatedFolders = [...existingFolders, newFolder]

    // Save to Redis
    await kv.hset(`business:${businessId}:media`, {
      folders: JSON.stringify(updatedFolders),
    })

    revalidatePath("/photo-album")
    revalidatePath("/admin/media")

    return { success: true, folders: updatedFolders }
  } catch (error) {
    console.error("Error creating folder:", error)
    return { success: false, folders: [], error: "Failed to create folder" }
  }
}

export async function renameFolder(
  businessId: string,
  folderId: string,
  name: string,
): Promise<{ success: boolean; folders: MediaFolder[]; error?: string }> {
  try {
    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)
    const existingFolders = existingMedia?.folders || []

    // Find the folder to rename
    const folderIndex = existingFolders.findIndex((folder) => folder.id === folderId)

    if (folderIndex === -1) {
      return { success: false, folders: [], error: "Folder not found" }
    }

    // Update the folder
    existingFolders[folderIndex] = { ...existingFolders[folderIndex], name }

    // Save to Redis
    await kv.hset(`business:${businessId}:media`, {
      folders: JSON.stringify(existingFolders),
    })

    revalidatePath("/photo-album")
    revalidatePath("/admin/media")

    return { success: true, folders: existingFolders }
  } catch (error) {
    console.error("Error renaming folder:", error)
    return { success: false, folders: [], error: "Failed to rename folder" }
  }
}

export async function deleteFolder(
  businessId: string,
  folderId: string,
): Promise<{ success: boolean; folders: MediaFolder[]; error?: string }> {
  try {
    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)
    const existingFolders = existingMedia?.folders || []

    // Filter out the folder to delete
    const updatedFolders = existingFolders.filter((folder) => folder.id !== folderId)

    // Save to Redis
    await kv.hset(`business:${businessId}:media`, {
      folders: JSON.stringify(updatedFolders),
    })

    revalidatePath("/photo-album")
    revalidatePath("/admin/media")

    return { success: true, folders: updatedFolders }
  } catch (error) {
    console.error("Error deleting folder:", error)
    return { success: false, folders: [], error: "Failed to delete folder" }
  }
}

export async function createTag(
  businessId: string,
  tag: string,
): Promise<{ success: boolean; tags: string[]; error?: string }> {
  try {
    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)
    const existingTags = existingMedia?.tags || []

    // Add the new tag
    const updatedTags = [...existingTags, tag]

    // Save to Redis
    await kv.hset(`business:${businessId}:media`, {
      tags: JSON.stringify(updatedTags),
    })

    revalidatePath("/photo-album")
    revalidatePath("/admin/media")

    return { success: true, tags: updatedTags }
  } catch (error) {
    console.error("Error creating tag:", error)
    return { success: false, tags: [], error: "Failed to create tag" }
  }
}

export async function deleteTag(
  businessId: string,
  tag: string,
): Promise<{ success: boolean; tags: string[]; error?: string }> {
  try {
    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)
    const existingTags = existingMedia?.tags || []

    // Filter out the tag to delete
    const updatedTags = existingTags.filter((t) => t !== tag)

    // Save to Redis
    await kv.hset(`business:${businessId}:media`, {
      tags: JSON.stringify(updatedTags),
    })

    revalidatePath("/photo-album")
    revalidatePath("/admin/media")

    return { success: true, tags: updatedTags }
  } catch (error) {
    console.error("Error deleting tag:", error)
    return { success: false, tags: [], error: "Failed to delete tag" }
  }
}

export async function saveMediaSettings(
  businessId: string,
  settings: any,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Save to Redis
    await kv.hset(`business:${businessId}:mediaSettings`, settings)

    revalidatePath("/photo-album")
    revalidatePath("/admin/media")

    return { success: true }
  } catch (error) {
    console.error("Error saving media settings:", error)
    return { success: false, error: "Failed to save media settings" }
  }
}

export async function listBusinessBlobs(
  businessId: string,
): Promise<{ success: boolean; blobs: any[]; error?: string }> {
  try {
    // List images from Cloudflare Images
    const result = await listCloudflareImages()

    if (!result || !result.success) {
      return { success: false, blobs: [], error: "Failed to list Cloudflare Images" }
    }

    // Filter images for this business
    const businessImages = result.result.images.filter((image) => image.meta?.businessId === businessId)

    return { success: true, blobs: businessImages }
  } catch (error) {
    console.error("Error listing Cloudflare Images:", error)
    return { success: false, blobs: [], error: "Failed to list Cloudflare Images" }
  }
}

export async function deleteAllBusinessMedia(businessId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia) {
      return { success: true }
    }

    // Delete all photos from Cloudflare Images
    if (existingMedia.photoAlbum && existingMedia.photoAlbum.length > 0) {
      for (const photo of existingMedia.photoAlbum) {
        try {
          await deleteFromCloudflareImages(photo.id)
        } catch (error) {
          console.warn(`Failed to delete photo ${photo.id} from Cloudflare Images`)
        }
      }
    }

    // Delete video from Cloudflare Stream if exists
    if (existingMedia.videoId) {
      try {
        await deleteVideo(existingMedia.videoId)
      } catch (error) {
        console.warn(`Failed to delete video ${existingMedia.videoId} from Cloudflare Stream`)
      }
    }

    // Delete thumbnail from Cloudflare Images if exists
    if (existingMedia.thumbnailId) {
      try {
        await deleteFromCloudflareImages(existingMedia.thumbnailId)
      } catch (error) {
        console.warn(`Failed to delete thumbnail ${existingMedia.thumbnailId} from Cloudflare Images`)
      }
    }

    // Also search for and delete any videos found through alternative methods
    const videoSearchResult = await searchBusinessVideos(businessId)
    if (videoSearchResult.success) {
      for (const video of videoSearchResult.videos) {
        try {
          await deleteVideo(video.id)
        } catch (error) {
          console.warn(`Failed to delete video ${video.id} from Cloudflare Stream`)
        }
      }
    }

    // Clear all media data from Redis
    await kv.del(`business:${businessId}:media`)

    revalidatePath(`/photo-album`)
    revalidatePath(`/admin/media`)

    return { success: true }
  } catch (error) {
    console.error("Error deleting all business media:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete all media",
    }
  }
}

// Add these functions for video and thumbnail uploads
export async function uploadVideo(formData: FormData) {
  try {
    const businessId = formData.get("businessId") as string
    const file = formData.get("video") as File
    const designId = formData.get("designId") as string | undefined

    if (!file || !businessId) {
      return { success: false, error: "Missing required fields" }
    }

    // For videos, we'll continue to use Cloudflare Stream instead of Cloudflare Images
    // This would be implemented based on your Cloudflare Stream integration
    console.log(`Uploading video for business ${businessId}`)

    return {
      success: false,
      error: "Video upload not implemented for Cloudflare Images",
    }
  } catch (error) {
    console.error("Error uploading video:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload video",
    }
  }
}

export async function uploadThumbnail(formData: FormData) {
  try {
    const businessId = formData.get("businessId") as string
    const file = formData.get("thumbnail") as File

    if (!file || !businessId) {
      return { success: false, error: "Missing required fields" }
    }

    // Prepare metadata for Cloudflare Images
    const metadata = {
      businessId,
      originalSize: file.size,
      type: "thumbnail",
    }

    // Upload to Cloudflare Images
    const result = await uploadToCloudflareImages(file, metadata, file.name)

    if (!result || !result.success) {
      return { success: false, error: "Failed to upload to Cloudflare Images" }
    }

    // Get the thumbnail URL
    const thumbnailUrl = getCloudflareImageUrl(result.result.id)

    // Update the media data
    await kv.hset(`business:${businessId}:media`, {
      thumbnailUrl: thumbnailUrl,
      thumbnailId: result.result.id,
    })

    revalidatePath(`/photo-album`)
    revalidatePath(`/admin/media`)

    return {
      success: true,
      thumbnailUrl: thumbnailUrl,
      thumbnailId: result.result.id,
    }
  } catch (error) {
    console.error("Error uploading thumbnail:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload thumbnail",
    }
  }
}

/**
 * Delete a specific media file by ID for admin purposes
 */
export async function deleteMediaFile(businessId: string, fileId: string, fileType = "image") {
  try {
    if (!fileId || !businessId) {
      return { success: false, error: "Missing required fields" }
    }

    // Handle video deletion
    if (fileType === "video") {
      const deleteResult = await deleteVideo(fileId)

      if (!deleteResult.success) {
        return { success: false, error: deleteResult.error || "Failed to delete video from Cloudflare Stream" }
      }

      // Update Redis to remove video reference
      const existingMedia = await getBusinessMedia(businessId)
      if (existingMedia?.videoId === fileId) {
        await kv.hset(`business:${businessId}:media`, {
          videoUrl: "",
          videoId: "",
          videoContentType: "",
        })
      }

      // Helper function to safely update Redis data
      const safeUpdateRedisData = async (key: string, updates: Record<string, string>) => {
        try {
          const exists = await kv.exists(key)
          if (!exists) return

          const keyType = await kv.type(key)
          if (keyType === "hash") {
            await kv.hset(key, updates)
          } else if (keyType === "string") {
            const stringValue = await kv.get(key)
            if (typeof stringValue === "string" && stringValue.startsWith("{")) {
              try {
                const data = JSON.parse(stringValue)
                Object.assign(data, updates)
                await kv.set(key, JSON.stringify(data))
              } catch (error) {
                console.warn(`Could not update JSON string in key ${key}:`, error)
              }
            }
          }
        } catch (error) {
          console.warn(`Error updating key ${key}:`, error)
        }
      }

      // Also remove from business data if stored there
      const possibleVideoFields = ["videoId", "video_id", "streamId", "stream_id", "cloudflareVideoId"]
      const updates: Record<string, string> = {}

      for (const field of possibleVideoFields) {
        updates[field] = ""
      }

      await safeUpdateRedisData(`business:${businessId}`, updates)
      await safeUpdateRedisData(`business:${businessId}:adDesign`, updates)
      await safeUpdateRedisData(`business:${businessId}:workbench`, updates)
      await safeUpdateRedisData(`business:${businessId}:cloudflare-media`, updates)
    } else {
      // Handle image deletion (photos, thumbnails)
      const deleteResult = await deleteFromCloudflareImages(fileId)

      if (!deleteResult) {
        return { success: false, error: "Failed to delete from Cloudflare Images" }
      }

      // Get existing media data
      const existingMedia = await getBusinessMedia(businessId)

      if (existingMedia && existingMedia.photoAlbum) {
        // Remove from the photo album
        const updatedPhotoAlbum = existingMedia.photoAlbum.filter((photo) => photo.id !== fileId)

        // Update the KV store
        await kv.hset(`business:${businessId}:media`, {
          photoAlbum: JSON.stringify(updatedPhotoAlbum),
        })
      }

      // Also check if it's a thumbnail
      if (existingMedia?.thumbnailId === fileId) {
        await kv.hset(`business:${businessId}:media`, {
          thumbnailUrl: "",
          thumbnailId: "",
        })
      }
    }

    revalidatePath(`/admin/media`)

    return { success: true }
  } catch (error) {
    console.error("Error deleting media file:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete media file",
    }
  }
}

/**
 * Get comprehensive media listing for admin purposes including videos
 */
export async function getComprehensiveMediaListing(businessId: string) {
  try {
    if (!businessId) {
      return { success: false, error: "Business ID is required" }
    }

    console.log(`Starting comprehensive media search for business: ${businessId}`)

    // Get business media from Redis
    const businessMedia = await getBusinessMedia(businessId)
    console.log("Business media from KV:", businessMedia)

    // Get all images from Cloudflare for this business
    const cloudflareResult = await listCloudflareImages()

    if (!cloudflareResult.success) {
      return { success: false, error: "Failed to fetch from Cloudflare Images" }
    }

    // Filter images for this business
    const businessImages =
      cloudflareResult.result.images?.filter((image: any) => image.meta?.businessId === businessId) || []

    console.log(`Found ${businessImages.length} images in Cloudflare Images`)

    // Search for videos using enhanced search function
    const videoSearchResult = await searchBusinessVideos(businessId)
    console.log(`Video search result:`, videoSearchResult)

    // Combine all media information
    const mediaFiles = []

    // Add photos from album
    if (businessMedia?.photoAlbum) {
      for (const photo of businessMedia.photoAlbum) {
        // Find corresponding Cloudflare data
        const cloudflareData = businessImages.find((img: any) => img.id === photo.id)

        mediaFiles.push({
          id: photo.id,
          url: photo.url,
          filename: photo.filename || cloudflareData?.filename || "Unknown",
          contentType: photo.contentType || cloudflareData?.contentType || "Unknown",
          size: photo.size || cloudflareData?.size || 0,
          uploadedAt: photo.createdAt || cloudflareData?.uploaded || "",
          type: "photo",
          tags: photo.tags || [],
          folderId: photo.folderId,
        })
      }
    }

    // Add videos from search results
    if (videoSearchResult.success && videoSearchResult.videos.length > 0) {
      for (const video of videoSearchResult.videos) {
        mediaFiles.push({
          id: video.id,
          url: video.embedUrl,
          streamUrl: video.streamUrl,
          thumbnailUrl: video.thumbnailUrl,
          filename: video.filename,
          contentType: video.contentType,
          size: video.size,
          uploadedAt: video.uploadedAt,
          type: "video",
          duration: video.duration,
          status: video.status,
          readyToStream: video.readyToStream,
          aspectRatio: video.aspectRatio,
          meta: video.meta,
        })
      }
    }

    // Add thumbnail if exists
    if (businessMedia?.thumbnailUrl && businessMedia?.thumbnailId) {
      const thumbnailCloudflareData = businessImages.find((img: any) => img.id === businessMedia.thumbnailId)

      mediaFiles.push({
        id: businessMedia.thumbnailId,
        url: businessMedia.thumbnailUrl,
        filename: "Video Thumbnail",
        contentType: "image/jpeg",
        size: thumbnailCloudflareData?.size || 0,
        uploadedAt: thumbnailCloudflareData?.uploaded || "",
        type: "thumbnail",
      })
    }

    // Add any orphaned Cloudflare images not in Redis
    for (const cloudflareImage of businessImages) {
      const existsInMediaFiles = mediaFiles.some((file) => file.id === cloudflareImage.id)

      if (!existsInMediaFiles) {
        mediaFiles.push({
          id: cloudflareImage.id,
          url: getCloudflareImageUrl(cloudflareImage.id),
          filename: cloudflareImage.filename || "Unknown",
          contentType: cloudflareImage.contentType || "Unknown",
          size: cloudflareImage.size || 0,
          uploadedAt: cloudflareImage.uploaded || "",
          type: "orphaned",
          meta: cloudflareImage.meta,
        })
      }
    }

    // Sort by upload date (newest first)
    mediaFiles.sort((a, b) => {
      const dateA = new Date(a.uploadedAt || 0).getTime()
      const dateB = new Date(b.uploadedAt || 0).getTime()
      return dateB - dateA
    })

    console.log(`Final media files count: ${mediaFiles.length}`)
    console.log("Media files breakdown:", {
      photos: mediaFiles.filter((f) => f.type === "photo").length,
      videos: mediaFiles.filter((f) => f.type === "video").length,
      thumbnails: mediaFiles.filter((f) => f.type === "thumbnail").length,
      orphaned: mediaFiles.filter((f) => f.type === "orphaned").length,
    })

    return {
      success: true,
      mediaFiles,
      totalFiles: mediaFiles.length,
      totalSize: mediaFiles.reduce((sum, file) => sum + (file.size || 0), 0),
    }
  } catch (error) {
    console.error("Error getting comprehensive media listing:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get media listing",
    }
  }
}

/**
 * Get all videos for a business from Cloudflare Stream
 */
export async function listBusinessVideos(businessId: string): Promise<VideoRetrievalResult> {
  try {
    console.log(`Listing videos for business: ${businessId}`)

    // Use the enhanced search function
    const result = await searchBusinessVideos(businessId)

    console.log(`Video listing completed for business ${businessId}:`, {
      success: result.success,
      videoCount: result.videos.length,
      error: result.error,
    })

    return result
  } catch (error) {
    console.error("Error listing business videos:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list videos",
      videos: [],
      totalCount: 0,
    }
  }
}
