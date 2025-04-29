"use server"

import { put, del, list } from "@vercel/blob"
import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
// Image processing will be handled differently without Sharp

// Types for media storage
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
}

export type BusinessMedia = {
  videoUrl?: string
  videoContentType?: string
  videoId?: string
  thumbnailUrl?: string
  thumbnailId?: string
  photoAlbum: MediaItem[]
}

export type CompressionOptions = {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: "jpeg" | "png" | "webp" | "avif"
}

// Constants for file size limits
const MAX_VIDEO_SIZE_MB = 50 // Reduced from 100MB to 50MB
const MAX_IMAGE_SIZE_MB = 5 // Reduced from 10MB to 5MB
const MB_IN_BYTES = 1024 * 1024

/**
 * Process image data without using Sharp
 * This is a placeholder that will be replaced by server-side processing
 */
async function processImageData(
  buffer: Buffer,
  contentType: string,
  options: CompressionOptions = {},
): Promise<{ buffer: Buffer; info: { width: number; height: number } }> {
  // In a real implementation, this would be handled by a server API
  // For now, we'll just return the original buffer with estimated dimensions
  return {
    buffer,
    info: {
      width: options.maxWidth || 1920,
      height: options.maxHeight || 1080,
    },
  }
}

/**
 * Compress an image buffer using browser-compatible methods
 * This replaces the Sharp-based implementation
 */
async function compressImageBuffer(
  buffer: Buffer,
  contentType: string,
  options: CompressionOptions = {},
): Promise<{ buffer: Buffer; info: { width: number; height: number } }> {
  // Use the processImageData function instead of Sharp
  return processImageData(buffer, contentType, options)
}

/**
 * Upload a video to Vercel Blob and store the reference in Redis
 */
export async function uploadVideo(formData: FormData) {
  try {
    const businessId = formData.get("businessId") as string
    const file = formData.get("video") as File
    const designId = formData.get("designId") as string

    if (!file || !businessId) {
      return { success: false, error: "Missing required fields" }
    }

    // Check file size before attempting upload
    const fileSizeMB = file.size / MB_IN_BYTES
    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
      return {
        success: false,
        error: `Video file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${MAX_VIDEO_SIZE_MB}MB.`,
      }
    }

    // Generate a unique filename with timestamp and original extension
    const extension = file.name.split(".").pop() || "mp4"
    const filename = `${businessId}/videos/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`

    // Upload to Vercel Blob with proper error handling
    let blob
    try {
      console.log(`Uploading video to Vercel Blob: ${filename}, size: ${fileSizeMB.toFixed(2)}MB`)

      // Create a new AbortController to set a timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      // Use a try-catch block specifically for the put operation
      try {
        blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: false,
          contentType: file.type,
          maxSize: MAX_VIDEO_SIZE_MB * MB_IN_BYTES,
          signal: controller.signal,
        })
      } catch (putError) {
        // Handle specific error cases from the put operation
        console.error("Error during Vercel Blob put operation:", putError)

        // Check if it's a Response object (from fetch)
        if (putError instanceof Response) {
          const status = putError.status
          const text = await putError.text() // Get the response text instead of trying to parse JSON

          if (status === 413) {
            return {
              success: false,
              error: `File is too large for upload. Please reduce the file size to under ${MAX_VIDEO_SIZE_MB}MB.`,
            }
          }

          return {
            success: false,
            error: `Upload failed with status ${status}: ${text.substring(0, 100)}`,
          }
        }

        // If it's a DOMException from the AbortController
        if (putError instanceof DOMException && putError.name === "AbortError") {
          return {
            success: false,
            error: "Upload timed out. Please try again with a smaller file or check your network connection.",
          }
        }

        // For any other error type
        return {
          success: false,
          error: putError instanceof Error ? putError.message : "Unknown upload error",
        }
      } finally {
        // Clear the timeout regardless of success or failure
        clearTimeout(timeoutId)
      }

      console.log(`Video uploaded successfully: ${blob.url}`)
    } catch (blobError) {
      console.error("Blob upload error:", blobError)

      // Handle non-JSON responses
      if (blobError instanceof Error && blobError.message.includes("is not valid JSON")) {
        // Extract the actual error message from the error
        const errorMatch = blobError.message.match(/'([^']*)/)
        const actualError = errorMatch ? errorMatch[1] : "Request Entity Too Large"

        if (actualError.includes("Request Entity Too Large") || actualError.includes("413")) {
          return {
            success: false,
            error: `File is too large for upload. Please reduce the file size to under ${MAX_VIDEO_SIZE_MB}MB.`,
          }
        }

        return {
          success: false,
          error: `Upload failed: ${actualError}`,
        }
      }

      // Handle AbortController timeout
      if (blobError instanceof DOMException && blobError.name === "AbortError") {
        return {
          success: false,
          error: "Upload timed out. Please try again with a smaller file or check your network connection.",
        }
      }

      // Handle HTTP errors (413 Request Entity Too Large, etc.)
      if (blobError instanceof Error) {
        const errorMessage = blobError.message || "Unknown error"

        if (
          errorMessage.includes("413") ||
          errorMessage.includes("Request Entity Too Large") ||
          errorMessage.includes("too large") ||
          errorMessage.includes("exceeds")
        ) {
          return {
            success: false,
            error: `File is too large for upload. Please reduce the file size to under ${MAX_VIDEO_SIZE_MB}MB.`,
          }
        }

        return {
          success: false,
          error: `Upload failed: ${errorMessage.substring(0, 100)}`,
        }
      }

      // Generic error handling
      return {
        success: false,
        error: "Failed to upload video. Please try again with a smaller file.",
      }
    }

    // If blob is undefined, return an error
    if (!blob) {
      return {
        success: false,
        error: "Upload failed. No response from storage service.",
      }
    }

    // Get existing media data or initialize new object
    const existingMedia = (await getBusinessMedia(businessId)) || { photoAlbum: [] }

    // If there's an existing video, delete it to save storage
    if (existingMedia.videoId) {
      try {
        console.log(`Deleting previous video: ${existingMedia.videoId}`)
        await del(existingMedia.videoId)
        console.log(`Successfully deleted previous video: ${existingMedia.videoId}`)
      } catch (deleteError) {
        console.error(`Error deleting previous video ${existingMedia.videoId}:`, deleteError)
        // Continue even if deletion fails - we'll overwrite the reference anyway
      }
    }

    // Create a Redis key for the business media
    const mediaKey = `business:${businessId}:media`

    // Store video metadata in Redis - filter out null/undefined values
    const videoData: Record<string, any> = {}

    // Only add non-null values
    if (blob.url) videoData.videoUrl = blob.url
    if (blob.contentType) videoData.videoContentType = blob.contentType
    if (filename) videoData.videoId = filename
    if (blob.size) videoData.videoSize = blob.size
    videoData.videoUploadedAt = new Date().toISOString()

    // Only add designId if it exists and is not null
    if (designId && designId !== "null" && designId !== "undefined") {
      videoData.designId = designId
    } else if (existingMedia.designId) {
      videoData.designId = existingMedia.designId
    }

    // Use hset to store the video data in Redis
    try {
      console.log(`Storing video metadata in Redis: ${mediaKey}`)

      // Make sure we have at least one valid field to store
      if (Object.keys(videoData).length > 0) {
        await kv.hset(mediaKey, videoData)
        console.log(`Video metadata stored successfully`)
      } else {
        console.warn("No valid video metadata to store in Redis")
      }
    } catch (redisError) {
      console.error(`Error storing video metadata in Redis:`, redisError)

      // If Redis storage fails, try to delete the uploaded blob to avoid orphaned files
      try {
        await del(filename)
      } catch (deleteError) {
        console.error(`Error deleting orphaned video after Redis failure:`, deleteError)
      }

      return {
        success: false,
        error: `Failed to store video metadata: ${redisError instanceof Error ? redisError.message : "Unknown error"}`,
      }
    }

    revalidatePath(`/ad-design/customize`)

    return {
      success: true,
      url: blob.url,
      contentType: blob.contentType,
      size: blob.size,
      id: filename,
    }
  } catch (error) {
    console.error("Error in uploadVideo function:", error)

    // Provide a user-friendly error message
    let errorMessage = "Failed to upload video"
    if (error instanceof Error) {
      errorMessage = error.message

      // Check for JSON parsing errors
      if (errorMessage.includes("Unexpected token") && errorMessage.includes("not valid JSON")) {
        const errorMatch = errorMessage.match(/'([^']*)/)
        errorMessage = errorMatch
          ? `Server error: ${errorMatch[1]}`
          : "The server returned an invalid response. This may be due to the file being too large."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Upload a thumbnail image to Vercel Blob and store the reference in Redis
 */
export async function uploadThumbnail(formData: FormData) {
  try {
    const businessId = formData.get("businessId") as string
    const file = formData.get("thumbnail") as File

    if (!file || !businessId) {
      return { success: false, error: "Missing required fields" }
    }

    // Check file size
    const fileSizeMB = file.size / MB_IN_BYTES
    if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
      return {
        success: false,
        error: `Thumbnail file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${MAX_IMAGE_SIZE_MB}MB.`,
      }
    }

    // Get the original file size
    const originalSize = file.size

    // Generate a unique filename
    const extension = file.name.split(".").pop() || "jpeg"
    const filename = `${businessId}/thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`

    // Get existing media data to check for previous thumbnail
    const existingMedia = (await getBusinessMedia(businessId)) || { photoAlbum: [] }

    // If there's an existing thumbnail, delete it
    if (existingMedia.thumbnailId) {
      try {
        console.log(`Deleting previous thumbnail: ${existingMedia.thumbnailId}`)
        await del(existingMedia.thumbnailId)
        console.log(`Successfully deleted previous thumbnail: ${existingMedia.thumbnailId}`)
      } catch (deleteError) {
        console.error(`Error deleting previous thumbnail ${existingMedia.thumbnailId}:`, deleteError)
        // Continue even if deletion fails - we'll overwrite the reference anyway
      }
    }

    // Upload to Vercel Blob directly
    let blob
    try {
      console.log(`Uploading thumbnail to Vercel Blob: ${filename}, size: ${fileSizeMB.toFixed(2)}MB`)

      // Create a new AbortController to set a timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      try {
        blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: false,
          contentType: file.type,
          maxSize: MAX_IMAGE_SIZE_MB * MB_IN_BYTES,
          signal: controller.signal,
        })
      } catch (putError) {
        // Handle specific error cases from the put operation
        console.error("Error during Vercel Blob put operation:", putError)

        // Check if it's a Response object (from fetch)
        if (putError instanceof Response) {
          const status = putError.status
          const text = await putError.text() // Get the response text instead of trying to parse JSON

          if (status === 413) {
            return {
              success: false,
              error: `File is too large for upload. Please reduce the file size to under ${MAX_IMAGE_SIZE_MB}MB.`,
            }
          }

          return {
            success: false,
            error: `Upload failed with status ${status}: ${text.substring(0, 100)}`,
          }
        }

        // If it's a DOMException from the AbortController
        if (putError instanceof DOMException && putError.name === "AbortError") {
          return {
            success: false,
            error: "Upload timed out. Please try again with a smaller file or check your network connection.",
          }
        }

        // For any other error type
        return {
          success: false,
          error: putError instanceof Error ? putError.message : "Unknown upload error",
        }
      } finally {
        // Clear the timeout regardless of success or failure
        clearTimeout(timeoutId)
      }

      console.log(`Thumbnail uploaded successfully: ${blob.url}`)
    } catch (blobError) {
      console.error("Blob upload error:", blobError)

      // Handle non-JSON responses
      if (blobError instanceof Error && blobError.message.includes("is not valid JSON")) {
        // Extract the actual error message from the error
        const errorMatch = blobError.message.match(/'([^']*)/)
        const actualError = errorMatch ? errorMatch[1] : "Request Entity Too Large"

        if (actualError.includes("Request Entity Too Large") || actualError.includes("413")) {
          return {
            success: false,
            error: `File is too large for upload. Please reduce the file size to under ${MAX_IMAGE_SIZE_MB}MB.`,
          }
        }

        return {
          success: false,
          error: `Upload failed: ${actualError}`,
        }
      }

      // Handle AbortController timeout
      if (blobError instanceof DOMException && blobError.name === "AbortError") {
        return {
          success: false,
          error: "Upload timed out. Please try again with a smaller file or check your network connection.",
        }
      }

      // Handle HTTP errors
      if (blobError instanceof Error) {
        const errorMessage = blobError.message || "Unknown error"

        if (
          errorMessage.includes("413") ||
          errorMessage.includes("Request Entity Too Large") ||
          errorMessage.includes("too large") ||
          errorMessage.includes("exceeds")
        ) {
          return {
            success: false,
            error: `File is too large for upload. Please reduce the file size to under ${MAX_IMAGE_SIZE_MB}MB.`,
          }
        }

        return {
          success: false,
          error: `Upload failed: ${errorMessage.substring(0, 100)}`,
        }
      }

      // Generic error handling
      return {
        success: false,
        error: "Failed to upload thumbnail. Please try again with a smaller file.",
      }
    }

    // If blob is undefined, return an error
    if (!blob) {
      return {
        success: false,
        error: "Upload failed. No response from storage service.",
      }
    }

    // Create a Redis key for the business media
    const mediaKey = `business:${businessId}:media`

    // Store thumbnail metadata in Redis - filter out null/undefined values
    const thumbnailData: Record<string, any> = {}

    // Only add non-null values
    if (blob.url) thumbnailData.thumbnailUrl = blob.url
    if (filename) thumbnailData.thumbnailId = filename
    if (blob.contentType) thumbnailData.thumbnailContentType = blob.contentType
    if (blob.size) thumbnailData.thumbnailSize = blob.size
    if (originalSize) thumbnailData.thumbnailOriginalSize = originalSize
    thumbnailData.thumbnailUploadedAt = new Date().toISOString()
    thumbnailData.thumbnailWidth = 800 // Estimated width
    thumbnailData.thumbnailHeight = 600 // Estimated height

    // Use hset to store the thumbnail data in Redis
    try {
      console.log(`Storing thumbnail metadata in Redis: ${mediaKey}`)

      // Make sure we have at least one valid field to store
      if (Object.keys(thumbnailData).length > 0) {
        await kv.hset(mediaKey, thumbnailData)
        console.log(`Thumbnail metadata stored successfully`)
      } else {
        console.warn("No valid thumbnail metadata to store in Redis")
      }
    } catch (redisError) {
      console.error(`Error storing thumbnail metadata in Redis:`, redisError)

      // If Redis storage fails, try to delete the uploaded blob to avoid orphaned files
      try {
        await del(filename)
      } catch (deleteError) {
        console.error(`Error deleting orphaned thumbnail after Redis failure:`, deleteError)
      }

      return {
        success: false,
        error: `Failed to store thumbnail metadata: ${redisError instanceof Error ? redisError.message : "Unknown error"}`,
      }
    }

    revalidatePath(`/ad-design/customize`)

    return {
      success: true,
      url: blob.url,
      contentType: blob.contentType,
      size: blob.size,
      originalSize,
      width: 800, // Estimated width
      height: 600, // Estimated height
      id: filename,
    }
  } catch (error) {
    console.error("Error uploading thumbnail:", error)

    // Provide a user-friendly error message
    let errorMessage = "Failed to upload thumbnail"
    if (error instanceof Error) {
      errorMessage = error.message

      // Check for JSON parsing errors
      if (errorMessage.includes("Unexpected token") && errorMessage.includes("not valid JSON")) {
        const errorMatch = errorMessage.match(/'([^']*)/)
        errorMessage = errorMatch
          ? `Server error: ${errorMatch[1]}`
          : "The server returned an invalid response. This may be due to the file being too large."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Upload a photo to Vercel Blob and add it to the business's photo album in Redis
 */
export async function uploadPhoto(formData: FormData) {
  try {
    const businessId = formData.get("businessId") as string
    const file = formData.get("photo") as File

    if (!file || !businessId) {
      return { success: false, error: "Missing required fields" }
    }

    // Check file size
    const fileSizeMB = file.size / MB_IN_BYTES
    if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
      return {
        success: false,
        error: `Photo file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${MAX_IMAGE_SIZE_MB}MB.`,
      }
    }

    // Get the original file size
    const originalSize = file.size

    // Generate a unique filename
    const extension = file.name.split(".").pop() || "jpeg"
    const filename = `${businessId}/photos/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`

    // Upload to Vercel Blob directly without compression
    let blob
    try {
      console.log(`Uploading photo to Vercel Blob: ${filename}, size: ${fileSizeMB.toFixed(2)}MB`)

      // Create a new AbortController to set a timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      try {
        blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: false,
          contentType: file.type,
          maxSize: MAX_IMAGE_SIZE_MB * MB_IN_BYTES,
          signal: controller.signal,
        })
      } catch (putError) {
        // Handle specific error cases from the put operation
        console.error("Error during Vercel Blob put operation:", putError)

        // Check if it's a Response object (from fetch)
        if (putError instanceof Response) {
          const status = putError.status
          const text = await putError.text() // Get the response text instead of trying to parse JSON

          if (status === 413) {
            return {
              success: false,
              error: `File is too large for upload. Please reduce the file size to under ${MAX_IMAGE_SIZE_MB}MB.`,
            }
          }

          return {
            success: false,
            error: `Upload failed with status ${status}: ${text.substring(0, 100)}`,
          }
        }

        // If it's a DOMException from the AbortController
        if (putError instanceof DOMException && putError.name === "AbortError") {
          return {
            success: false,
            error: "Upload timed out. Please try again with a smaller file or check your network connection.",
          }
        }

        // For any other error type
        return {
          success: false,
          error: putError instanceof Error ? putError.message : "Unknown upload error",
        }
      } finally {
        // Clear the timeout regardless of success or failure
        clearTimeout(timeoutId)
      }

      console.log(`Photo uploaded successfully: ${blob.url}`)
    } catch (blobError) {
      console.error("Blob upload error:", blobError)

      // Handle non-JSON responses
      if (blobError instanceof Error && blobError.message.includes("is not valid JSON")) {
        // Extract the actual error message from the error
        const errorMatch = blobError.message.match(/'([^']*)/)
        const actualError = errorMatch ? errorMatch[1] : "Request Entity Too Large"

        if (actualError.includes("Request Entity Too Large") || actualError.includes("413")) {
          return {
            success: false,
            error: `File is too large for upload. Please reduce the file size to under ${MAX_IMAGE_SIZE_MB}MB.`,
          }
        }

        return {
          success: false,
          error: `Upload failed: ${actualError}`,
        }
      }

      // Handle AbortController timeout
      if (blobError instanceof DOMException && blobError.name === "AbortError") {
        return {
          success: false,
          error: "Upload timed out. Please try again with a smaller file or check your network connection.",
        }
      }

      // Handle HTTP errors
      if (blobError instanceof Error) {
        const errorMessage = blobError.message || "Unknown error"

        if (
          errorMessage.includes("413") ||
          errorMessage.includes("Request Entity Too Large") ||
          errorMessage.includes("too large") ||
          errorMessage.includes("exceeds")
        ) {
          return {
            success: false,
            error: `File is too large for upload. Please reduce the file size to under ${MAX_IMAGE_SIZE_MB}MB.`,
          }
        }

        return {
          success: false,
          error: `Upload failed: ${errorMessage.substring(0, 100)}`,
        }
      }

      // Generic error handling
      return {
        success: false,
        error: "Failed to upload photo. Please try again with a smaller file.",
      }
    }

    // If blob is undefined, return an error
    if (!blob) {
      return {
        success: false,
        error: "Upload failed. No response from storage service.",
      }
    }

    // Create a media item
    const newPhoto: MediaItem = {
      id: filename,
      url: blob.url,
      filename: file.name,
      contentType: blob.contentType,
      size: blob.size,
      originalSize,
      width: 1200, // Estimated width
      height: 800, // Estimated height
      createdAt: new Date().toISOString(),
    }

    // Get existing media data
    const existingMedia = (await getBusinessMedia(businessId)) || { photoAlbum: [] }

    // Add the new photo to the album
    const updatedPhotoAlbum = [...(existingMedia.photoAlbum || []), newPhoto]

    // Create a Redis key for the business media
    const mediaKey = `business:${businessId}:media`

    // Store the updated photo album in Redis
    try {
      console.log(`Storing updated photo album in Redis: ${mediaKey}`)

      // Make sure the photo album is not null before stringifying
      if (updatedPhotoAlbum && updatedPhotoAlbum.length >= 0) {
        await kv.hset(mediaKey, {
          photoAlbum: JSON.stringify(updatedPhotoAlbum),
        })
        console.log(`Photo album updated successfully with ${updatedPhotoAlbum.length} photos`)
      } else {
        console.warn("No valid photo album to store in Redis")
      }
    } catch (redisError) {
      console.error(`Error storing photo album in Redis:`, redisError)

      // If Redis storage fails, try to delete the uploaded blob to avoid orphaned files
      try {
        await del(filename)
      } catch (deleteError) {
        console.error(`Error deleting orphaned photo after Redis failure:`, deleteError)
      }

      return {
        success: false,
        error: `Failed to update photo album: ${redisError instanceof Error ? redisError.message : "Unknown error"}`,
      }
    }

    revalidatePath(`/ad-design/customize`)

    return {
      success: true,
      photo: newPhoto,
      photoAlbum: updatedPhotoAlbum,
    }
  } catch (error) {
    console.error("Error uploading photo:", error)

    // Provide a user-friendly error message
    let errorMessage = "Failed to upload photo"
    if (error instanceof Error) {
      errorMessage = error.message

      // Check for JSON parsing errors
      if (errorMessage.includes("Unexpected token") && errorMessage.includes("not valid JSON")) {
        const errorMatch = errorMessage.match(/'([^']*)/)
        errorMessage = errorMatch
          ? `Server error: ${errorMatch[1]}`
          : "The server returned an invalid response. This may be due to the file being too large."
      }
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Delete a photo from the business's photo album
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

    try {
      // Delete from Vercel Blob
      console.log(`Deleting photo from Vercel Blob: ${photoId}`)
      await del(photoId)
      console.log(`Photo deleted successfully from Blob storage`)
    } catch (deleteError) {
      console.error("Error deleting photo from Blob storage:", deleteError)
      // Continue with removing from the album even if blob deletion fails
    }

    // Remove from the photo album
    const updatedPhotoAlbum = existingMedia.photoAlbum.filter((photo) => photo.id !== photoId)

    // Create a Redis key for the business media
    const mediaKey = `business:${businessId}:media`

    // Update the photo album in Redis
    try {
      console.log(`Updating photo album in Redis after deletion: ${mediaKey}`)
      await kv.hset(mediaKey, {
        photoAlbum: JSON.stringify(updatedPhotoAlbum),
      })
      console.log(`Photo album updated successfully with ${updatedPhotoAlbum.length} photos remaining`)
    } catch (redisError) {
      console.error(`Error updating photo album in Redis after deletion:`, redisError)
      return {
        success: false,
        error: `Failed to update photo album after deletion: ${redisError instanceof Error ? redisError.message : "Unknown error"}`,
      }
    }

    revalidatePath(`/ad-design/customize`)

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
      return null
    }

    // Create a Redis key for the business media
    const mediaKey = `business:${businessId}:media`

    // Get the media data from Redis
    console.log(`Fetching media data from Redis: ${mediaKey}`)
    const mediaData = await kv.hgetall(mediaKey)

    if (!mediaData) {
      console.log(`No media data found for business: ${businessId}`)
      return { photoAlbum: [] }
    }

    // Parse the photo album JSON
    let photoAlbum: MediaItem[] = []
    if (mediaData.photoAlbum) {
      try {
        // Check if photoAlbum is already an object (not a string)
        if (typeof mediaData.photoAlbum === "object" && !Array.isArray(mediaData.photoAlbum)) {
          // If it's an object but not an array, convert it to an empty array
          console.warn("Photo album is an object but not an array, initializing empty array")
          photoAlbum = []

          // Fix the data in Redis by storing an empty array
          await kv.hset(mediaKey, {
            photoAlbum: JSON.stringify([]),
          })
        } else if (typeof mediaData.photoAlbum === "string") {
          // Normal case - parse the JSON string
          photoAlbum = JSON.parse(mediaData.photoAlbum as string)
        } else if (Array.isArray(mediaData.photoAlbum)) {
          // If it's already an array, use it directly
          photoAlbum = mediaData.photoAlbum

          // Fix the data in Redis by storing it properly
          await kv.hset(mediaKey, {
            photoAlbum: JSON.stringify(mediaData.photoAlbum),
          })
        }
      } catch (error) {
        console.error("Error parsing photo album:", error)
        photoAlbum = []

        // Fix the data in Redis by storing an empty array
        await kv.hset(mediaKey, {
          photoAlbum: JSON.stringify([]),
        })
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
    }

    console.log(
      `Retrieved media data for business ${businessId}: video: ${businessMedia.videoUrl ? "yes" : "no"}, thumbnail: ${businessMedia.thumbnailUrl ? "yes" : "no"}, photos: ${photoAlbum.length}`,
    )
    return businessMedia
  } catch (error) {
    console.error("Error getting business media:", error)
    return { photoAlbum: [] }
  }
}

/**
 * Remove a specific media item (video or thumbnail) for a business
 */
export async function removeMediaItem(businessId: string, itemType: "video" | "thumbnail") {
  try {
    if (!businessId) {
      return { success: false, error: "Missing business ID" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia) {
      return { success: false, error: "No media found for this business" }
    }

    // Create a Redis key for the business media
    const mediaKey = `business:${businessId}:media`

    // Handle based on item type
    if (itemType === "video") {
      if (existingMedia.videoId) {
        try {
          console.log(`Deleting video from Vercel Blob: ${existingMedia.videoId}`)
          await del(existingMedia.videoId)
          console.log(`Video deleted successfully from Blob storage`)
        } catch (error) {
          console.error(`Error deleting video ${existingMedia.videoId}:`, error)
          // Continue even if deletion fails
        }

        // Update Redis to remove video references
        try {
          console.log(`Removing video references from Redis: ${mediaKey}`)
          // Instead of setting to null, we'll use hdel to delete the fields
          await kv.hdel(mediaKey, "videoUrl", "videoContentType", "videoId", "videoSize", "videoUploadedAt")
          console.log(`Video references removed successfully from Redis`)
        } catch (redisError) {
          console.error(`Error removing video references from Redis:`, redisError)
          return {
            success: false,
            error: `Failed to remove video references: ${redisError instanceof Error ? redisError.message : "Unknown error"}`,
          }
        }
      }
    } else if (itemType === "thumbnail") {
      if (existingMedia.thumbnailId) {
        try {
          console.log(`Deleting thumbnail from Vercel Blob: ${existingMedia.thumbnailId}`)
          await del(existingMedia.thumbnailId)
          console.log(`Thumbnail deleted successfully from Blob storage`)
        } catch (error) {
          console.error(`Error deleting thumbnail ${existingMedia.thumbnailId}:`, error)
          // Continue even if deletion fails
        }

        // Update Redis to remove thumbnail references
        try {
          console.log(`Removing thumbnail references from Redis: ${mediaKey}`)
          // Instead of setting to null, we'll use hdel to delete the fields
          await kv.hdel(
            mediaKey,
            "thumbnailUrl",
            "thumbnailId",
            "thumbnailContentType",
            "thumbnailSize",
            "thumbnailWidth",
            "thumbnailHeight",
            "thumbnailOriginalSize",
            "thumbnailUploadedAt",
          )
          console.log(`Thumbnail references removed successfully from Redis`)
        } catch (redisError) {
          console.error(`Error removing thumbnail references from Redis:`, redisError)
          return {
            success: false,
            error: `Failed to remove thumbnail references: ${redisError instanceof Error ? redisError.message : "Unknown error"}`,
          }
        }
      }
    }

    revalidatePath(`/ad-design/customize`)

    return { success: true }
  } catch (error) {
    console.error(`Error removing ${itemType}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `Failed to remove ${itemType}`,
    }
  }
}

/**
 * Delete all media for a business
 */
export async function deleteAllBusinessMedia(businessId: string) {
  try {
    if (!businessId) {
      return { success: false, error: "Missing business ID" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia) {
      return { success: true, message: "No media to delete" }
    }

    // Delete video if exists
    if (existingMedia.videoId) {
      try {
        console.log(`Deleting video from Vercel Blob: ${existingMedia.videoId}`)
        await del(existingMedia.videoId)
        console.log(`Video deleted successfully from Blob storage`)
      } catch (error) {
        console.error("Error deleting video:", error)
      }
    }

    // Delete thumbnail if exists
    if (existingMedia.thumbnailId) {
      try {
        console.log(`Deleting thumbnail from Vercel Blob: ${existingMedia.thumbnailId}`)
        await del(existingMedia.thumbnailId)
        console.log(`Thumbnail deleted successfully from Blob storage`)
      } catch (error) {
        console.error("Error deleting thumbnail:", error)
      }
    }

    // Delete all photos
    if (existingMedia.photoAlbum && existingMedia.photoAlbum.length > 0) {
      console.log(`Deleting ${existingMedia.photoAlbum.length} photos from Blob storage`)
      for (const photo of existingMedia.photoAlbum) {
        try {
          await del(photo.id)
        } catch (error) {
          console.error(`Error deleting photo ${photo.id}:`, error)
        }
      }
      console.log(`All photos deleted from Blob storage`)
    }

    // Delete the media record from Redis
    try {
      const mediaKey = `business:${businessId}:media`
      console.log(`Deleting all media references from Redis: ${mediaKey}`)
      await kv.del(mediaKey)
      console.log(`All media references deleted successfully from Redis`)
    } catch (redisError) {
      console.error(`Error deleting media references from Redis:`, redisError)
      return {
        success: false,
        error: `Failed to delete media references: ${redisError instanceof Error ? redisError.message : "Unknown error"}`,
      }
    }

    revalidatePath(`/ad-design/customize`)

    return { success: true }
  } catch (error) {
    console.error("Error deleting all business media:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete all media",
    }
  }
}

/**
 * List all blobs for a business (useful for admin purposes)
 */
export async function listBusinessBlobs(businessId: string) {
  try {
    if (!businessId) {
      return { success: false, error: "Missing business ID" }
    }

    console.log(`Listing blobs for business ID: ${businessId}`)

    // List all blobs with the business ID prefix
    const result = await list({ prefix: `${businessId}/` })
    console.log(`Found ${result.blobs.length} blobs`)

    // If no blobs found via direct listing, try to get media from Redis
    if (result.blobs.length === 0) {
      console.log("No blobs found via direct listing, checking Redis store")
      const mediaData = await getBusinessMedia(businessId)

      if (mediaData) {
        console.log("Found media data in Redis store:", mediaData)
        const allBlobs = []

        // Add video if exists
        if (mediaData.videoUrl && mediaData.videoId) {
          allBlobs.push({
            url: mediaData.videoUrl,
            pathname: mediaData.videoId,
            contentType: mediaData.videoContentType || "video/mp4",
            size: 0, // Size unknown
            uploadedAt: new Date().toISOString(),
          })
        }

        // Add thumbnail if exists
        if (mediaData.thumbnailUrl && mediaData.thumbnailId) {
          allBlobs.push({
            url: mediaData.thumbnailUrl,
            pathname: mediaData.thumbnailId,
            contentType: "image/jpeg", // Assuming JPEG
            size: 0, // Size unknown
            uploadedAt: new Date().toISOString(),
          })
        }

        // Add photos from album
        if (mediaData.photoAlbum && mediaData.photoAlbum.length > 0) {
          mediaData.photoAlbum.forEach((photo) => {
            allBlobs.push({
              url: photo.url,
              pathname: photo.id,
              contentType: photo.contentType,
              size: photo.size,
              uploadedAt: photo.createdAt,
            })
          })
        }

        if (allBlobs.length > 0) {
          console.log(`Found ${allBlobs.length} media items in Redis store`)
          return {
            success: true,
            blobs: allBlobs,
          }
        }
      }
    }

    return {
      success: true,
      blobs: result.blobs || [], // Ensure we always return an array
    }
  } catch (error) {
    console.error("Error listing business blobs:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list blobs",
      blobs: [], // Return empty array on error
    }
  }
}

/**
 * Save business media settings (like which fields to hide)
 */
export async function saveMediaSettings(businessId: string, settings: any) {
  try {
    if (!businessId) {
      return { success: false, error: "Missing business ID" }
    }

    // Create a Redis key for the business media
    const mediaKey = `business:${businessId}:media`

    // Store settings in Redis - ENSURE we stringify the settings object
    console.log(`Saving media settings to Redis: ${mediaKey}`)
    await kv.hset(mediaKey, {
      settings: JSON.stringify(settings),
    })
    console.log(`Media settings saved successfully to Redis`)

    revalidatePath(`/ad-design/customize`)

    return { success: true }
  } catch (error) {
    console.error("Error saving media settings:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save media settings",
    }
  }
}

/**
 * Get business media settings
 */
export async function getMediaSettings(businessId: string) {
  try {
    if (!businessId) {
      return null
    }

    // Create a Redis key for the business media
    const mediaKey = `business:${businessId}:media`

    // Get the media data from Redis
    console.log(`Fetching media settings from Redis: ${mediaKey}`)
    const mediaData = await kv.hgetall(mediaKey)

    if (!mediaData || !mediaData.settings) {
      console.log(`No media settings found for business: ${businessId}`)
      return null
    }

    // Parse the settings JSON
    try {
      // Check if settings is already an object (not a string)
      if (typeof mediaData.settings === "object" && mediaData.settings !== null) {
        // If it's already an object, use it directly
        return mediaData.settings
      } else if (typeof mediaData.settings === "string") {
        // Normal case - parse the JSON string
        return JSON.parse(mediaData.settings as string)
      }
      return null
    } catch (error) {
      console.error("Error parsing media settings:", error)
      return null
    }
  } catch (error) {
    console.error("Error getting media settings:", error)
    return null
  }
}
