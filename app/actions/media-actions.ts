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

// Replace the uploadVideo function with this improved version:

export async function uploadVideo(formData: FormData) {
  try {
    const businessId = formData.get("businessId") as string
    const file = formData.get("video") as File
    const designId = formData.get("designId") as string

    if (!file || !businessId) {
      return { success: false, error: "Missing required fields" }
    }

    // Check file size
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
      blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
        maxSize: MAX_VIDEO_SIZE_MB * MB_IN_BYTES,
      })
    } catch (blobError) {
      console.error("Blob upload error:", blobError)

      // Simple error handling without trying to parse anything
      let errorMessage = "Failed to upload video"

      if (blobError instanceof Error) {
        errorMessage = blobError.message
      } else if (typeof blobError === "string") {
        errorMessage = blobError
      } else if (blobError && typeof blobError === "object") {
        // Safely convert object to string without parsing
        try {
          errorMessage = String(blobError)
        } catch (e) {
          errorMessage = "Unknown upload error"
        }
      }

      // Check for common error patterns
      if (
        errorMessage.includes("too large") ||
        errorMessage.includes("exceeds") ||
        errorMessage.includes("Request Entity Too Large") ||
        errorMessage.includes("413")
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

    // Store reference in KV - explicitly set all video-related fields
    await kv.hset(`business:${businessId}:media`, {
      videoUrl: blob.url,
      videoContentType: blob.contentType,
      videoId: filename,
      designId: designId || existingMedia.designId,
    })

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload video",
    }
  }
}

// Also replace the uploadThumbnail function with this simplified version:

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
    const format = "jpeg" // Default format
    const filename = `${businessId}/thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${format}`

    // Upload to Vercel Blob directly without compression
    let blob
    try {
      blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
        maxSize: MAX_IMAGE_SIZE_MB * MB_IN_BYTES,
      })
    } catch (blobError) {
      console.error("Blob upload error:", blobError)

      // Simple error handling without trying to parse anything
      let errorMessage = "Failed to upload thumbnail"

      if (blobError instanceof Error) {
        errorMessage = blobError.message
      } else if (typeof blobError === "string") {
        errorMessage = blobError
      } else if (blobError && typeof blobError === "object") {
        // Safely convert object to string without parsing
        try {
          errorMessage = String(blobError)
        } catch (e) {
          errorMessage = "Unknown upload error"
        }
      }

      // Check for common error patterns
      if (
        errorMessage.includes("too large") ||
        errorMessage.includes("exceeds") ||
        errorMessage.includes("Request Entity Too Large") ||
        errorMessage.includes("413")
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

    // Get existing media data
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

    // Store reference in KV - explicitly set all thumbnail-related fields
    const compressionSavings = 0 // No compression is done, so savings is 0
    await kv.hset(`business:${businessId}:media`, {
      thumbnailUrl: blob.url,
      thumbnailId: filename,
      thumbnailWidth: 800, // Estimated width
      thumbnailHeight: 600, // Estimated height
      thumbnailOriginalSize: originalSize,
      thumbnailCompressionSavings: compressionSavings,
    })

    revalidatePath(`/ad-design/customize`)

    return {
      success: true,
      url: blob.url,
      contentType: blob.contentType,
      size: blob.size,
      originalSize,
      compressionSavings,
      width: 800, // Estimated width
      height: 600, // Estimated height
      id: filename,
    }
  } catch (error) {
    console.error("Error uploading thumbnail:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload thumbnail",
    }
  }
}

// And replace the uploadPhoto function with this simplified version:

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
    const format = "jpeg" // Default format
    const filename = `${businessId}/photos/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${format}`

    // Upload to Vercel Blob directly without compression
    let blob
    try {
      blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.type,
        maxSize: MAX_IMAGE_SIZE_MB * MB_IN_BYTES,
      })
    } catch (blobError) {
      console.error("Blob upload error:", blobError)

      // Simple error handling without trying to parse anything
      let errorMessage = "Failed to upload photo"

      if (blobError instanceof Error) {
        errorMessage = blobError.message
      } else if (typeof blobError === "string") {
        errorMessage = blobError
      } else if (blobError && typeof blobError === "object") {
        // Safely convert object to string without parsing
        try {
          errorMessage = String(blobError)
        } catch (e) {
          errorMessage = "Unknown upload error"
        }
      }

      // Check for common error patterns
      if (
        errorMessage.includes("too large") ||
        errorMessage.includes("exceeds") ||
        errorMessage.includes("Request Entity Too Large") ||
        errorMessage.includes("413")
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

    // Calculate compression savings (in this case, none)
    const compressionSavings = 0

    // Create a media item
    const newPhoto: MediaItem = {
      id: filename,
      url: blob.url,
      filename: file.name,
      contentType: blob.contentType,
      size: blob.size,
      originalSize,
      compressionSavings,
      width: 1200, // Estimated width
      height: 800, // Estimated height
      createdAt: new Date().toISOString(),
    }

    // Get existing media data
    const existingMedia = (await getBusinessMedia(businessId)) || { photoAlbum: [] }

    // Add the new photo to the album
    const updatedPhotoAlbum = [...(existingMedia.photoAlbum || []), newPhoto]

    // Store reference in KV - ENSURE we stringify the photoAlbum array
    await kv.hset(`business:${businessId}:media`, {
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

    revalidatePath(`/ad-design/customize`)

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
      await del(photoId)
    } catch (deleteError) {
      console.error("Error deleting photo from Blob storage:", deleteError)
      // Continue with removing from the album even if blob deletion fails
    }

    // Remove from the photo album
    const updatedPhotoAlbum = existingMedia.photoAlbum.filter((photo) => photo.id !== photoId)

    // Update the KV store - ENSURE we stringify the photoAlbum array
    await kv.hset(`business:${businessId}:media`, {
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

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

    // Get the media data from KV
    const mediaData = await kv.hgetall(`business:${businessId}:media`)

    if (!mediaData) {
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
          await kv.hset(`business:${businessId}:media`, {
            photoAlbum: JSON.stringify([]),
          })
        } else if (typeof mediaData.photoAlbum === "string") {
          // Normal case - parse the JSON string
          photoAlbum = JSON.parse(mediaData.photoAlbum as string)
        } else if (Array.isArray(mediaData.photoAlbum)) {
          // If it's already an array, use it directly
          photoAlbum = mediaData.photoAlbum

          // Fix the data in Redis by storing it properly
          await kv.hset(`business:${businessId}:media`, {
            photoAlbum: JSON.stringify(mediaData.photoAlbum),
          })
        }
      } catch (error) {
        console.error("Error parsing photo album:", error)
        photoAlbum = []

        // Fix the data in Redis by storing an empty array
        await kv.hset(`business:${businessId}:media`, {
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

    // Handle based on item type
    if (itemType === "video") {
      if (existingMedia.videoId) {
        try {
          await del(existingMedia.videoId)
        } catch (error) {
          console.error(`Error deleting video ${existingMedia.videoId}:`, error)
          // Continue even if deletion fails
        }

        // Update KV to remove video references
        await kv.hset(`business:${businessId}:media`, {
          videoUrl: null,
          videoContentType: null,
          videoId: null,
        })
      }
    } else if (itemType === "thumbnail") {
      if (existingMedia.thumbnailId) {
        try {
          await del(existingMedia.thumbnailId)
        } catch (error) {
          console.error(`Error deleting thumbnail ${existingMedia.thumbnailId}:`, error)
          // Continue even if deletion fails
        }

        // Update KV to remove thumbnail references
        await kv.hset(`business:${businessId}:media`, {
          thumbnailUrl: null,
          thumbnailId: null,
          thumbnailWidth: null,
          thumbnailHeight: null,
          thumbnailOriginalSize: null,
          thumbnailCompressionSavings: null,
        })
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
        await del(existingMedia.videoId)
      } catch (error) {
        console.error("Error deleting video:", error)
      }
    }

    // Delete thumbnail if exists
    if (existingMedia.thumbnailId) {
      try {
        await del(existingMedia.thumbnailId)
      } catch (error) {
        console.error("Error deleting thumbnail:", error)
      }
    }

    // Delete all photos
    if (existingMedia.photoAlbum && existingMedia.photoAlbum.length > 0) {
      for (const photo of existingMedia.photoAlbum) {
        try {
          await del(photo.id)
        } catch (error) {
          console.error(`Error deleting photo ${photo.id}:`, error)
        }
      }
    }

    // Delete the media record from KV
    await kv.del(`business:${businessId}:media`)

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

    // If no blobs found via direct listing, try to get media from KV
    if (result.blobs.length === 0) {
      console.log("No blobs found via direct listing, checking KV store")
      const mediaData = await getBusinessMedia(businessId)

      if (mediaData) {
        console.log("Found media data in KV store:", mediaData)
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
          console.log(`Found ${allBlobs.length} media items in KV store`)
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

    // Store settings in KV - ENSURE we stringify the settings object
    await kv.hset(`business:${businessId}:media`, {
      settings: JSON.stringify(settings),
    })

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

    // Get the media data from KV
    const mediaData = await kv.hgetall(`business:${businessId}:media`)

    if (!mediaData || !mediaData.settings) {
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

// Add this function to ensure we can get the complete media data in one call
// Add this near the end of the file, before the last closing brace

/**
 * Get complete business media data including settings
 */
export async function getCompleteBusinessMedia(businessId: string) {
  try {
    if (!businessId) {
      return null
    }

    // Get the media data
    const mediaData = await getBusinessMedia(businessId)

    // Get the settings
    const settings = await getMediaSettings(businessId)

    return {
      ...mediaData,
      settings,
    }
  } catch (error) {
    console.error("Error getting complete business media:", error)
    return { photoAlbum: [], settings: null }
  }
}
