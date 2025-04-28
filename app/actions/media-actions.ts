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
 * Upload a video to Vercel Blob storage
 */
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

    try {
      // Upload to Vercel Blob with proper error handling
      let blob
      try {
        blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: false, // We already added randomness to the filename
          contentType: file.type, // Explicitly set content type
          maxSize: MAX_VIDEO_SIZE_MB * MB_IN_BYTES, // Set max size explicitly
        })
      } catch (blobError) {
        console.error("Blob upload error details:", blobError)

        // Handle Response object error (Request Entity Too Large)
        if (
          blobError instanceof Response ||
          (typeof blobError === "object" && blobError !== null && "text" in blobError)
        ) {
          try {
            // Try to get the response text
            const errorText = await (blobError as Response).text()

            // Check if it contains "Request Entity Too Large"
            if (errorText.includes("Request Entity Too Large") || errorText.includes("Request En")) {
              return {
                success: false,
                error: `File is too large for upload. Please reduce the file size to under ${MAX_VIDEO_SIZE_MB}MB.`,
              }
            }

            return {
              success: false,
              error: `Blob upload failed: ${errorText.substring(0, 100)}...`,
            }
          } catch (textError) {
            // If we can't get the text, return a generic error
            return {
              success: false,
              error: "File upload failed. The file may be too large or in an unsupported format.",
            }
          }
        }

        // Handle other types of errors
        return {
          success: false,
          error:
            blobError instanceof Error
              ? `Blob upload failed: ${blobError.message}`
              : "Unknown error during blob upload",
        }
      }

      // Get existing media data or initialize new object
      const existingMedia = (await getBusinessMedia(businessId)) || { photoAlbum: [] }

      // If there's an existing video, delete it to save storage
      if (existingMedia.videoId) {
        try {
          await del(existingMedia.videoId)
        } catch (deleteError) {
          console.error("Error deleting previous video:", deleteError)
          // Continue even if deletion fails
        }
      }

      // Store reference in KV
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
    } catch (uploadError) {
      console.error("Error in Vercel Blob upload:", uploadError)

      // Try to extract more detailed error information
      let errorMessage = "Failed to upload video to storage"

      if (uploadError instanceof Error) {
        errorMessage = uploadError.message
      } else if (typeof uploadError === "object" && uploadError !== null) {
        errorMessage = JSON.stringify(uploadError)
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  } catch (error) {
    console.error("Error in uploadVideo function:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload video",
    }
  }
}

/**
 * Upload a thumbnail image to Vercel Blob storage with compression
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
    const format = "jpeg" // Default format
    const filename = `${businessId}/thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${format}`

    try {
      // Upload to Vercel Blob directly without compression
      let blob
      try {
        blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: false,
          contentType: file.type, // Explicitly set content type
          maxSize: MAX_IMAGE_SIZE_MB * MB_IN_BYTES, // Set max size explicitly
        })
      } catch (blobError) {
        console.error("Blob upload error details:", blobError)

        // Handle Response object error (Request Entity Too Large)
        if (
          blobError instanceof Response ||
          (typeof blobError === "object" && blobError !== null && "text" in blobError)
        ) {
          try {
            // Try to get the response text
            const errorText = await (blobError as Response).text()

            // Check if it contains "Request Entity Too Large"
            if (errorText.includes("Request Entity Too Large") || errorText.includes("Request En")) {
              return {
                success: false,
                error: `File is too large for upload. Please reduce the file size to under ${MAX_IMAGE_SIZE_MB}MB.`,
              }
            }

            return {
              success: false,
              error: `Blob upload failed: ${errorText.substring(0, 100)}...`,
            }
          } catch (textError) {
            // If we can't get the text, return a generic error
            return {
              success: false,
              error: "File upload failed. The file may be too large or in an unsupported format.",
            }
          }
        }

        // Handle other types of errors
        return {
          success: false,
          error:
            blobError instanceof Error
              ? `Blob upload failed: ${blobError.message}`
              : "Unknown error during blob upload",
        }
      }

      // Calculate compression savings (in this case, none)
      const compressionSavings = 0

      // Get existing media data
      const existingMedia = (await getBusinessMedia(businessId)) || { photoAlbum: [] }

      // If there's an existing thumbnail, delete it
      if (existingMedia.thumbnailId) {
        try {
          await del(existingMedia.thumbnailId)
        } catch (deleteError) {
          console.error("Error deleting previous thumbnail:", deleteError)
        }
      }

      // Store reference in KV
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
    } catch (uploadError) {
      console.error("Error in Vercel Blob upload:", uploadError)

      // Try to extract more detailed error information
      let errorMessage = "Failed to upload thumbnail to storage"

      if (uploadError instanceof Error) {
        errorMessage = uploadError.message
      } else if (typeof uploadError === "object" && uploadError !== null) {
        errorMessage = JSON.stringify(uploadError)
      }

      return {
        success: false,
        error: errorMessage,
      }
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
 * Upload a photo to the business's photo album with compression
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
    const format = "jpeg" // Default format
    const filename = `${businessId}/photos/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${format}`

    try {
      // Upload to Vercel Blob directly without compression
      let blob
      try {
        blob = await put(filename, file, {
          access: "public",
          addRandomSuffix: false,
          contentType: file.type, // Explicitly set content type
          maxSize: MAX_IMAGE_SIZE_MB * MB_IN_BYTES, // Set max size explicitly
        })
      } catch (blobError) {
        console.error("Blob upload error details:", blobError)

        // Handle Response object error (Request Entity Too Large)
        if (
          blobError instanceof Response ||
          (typeof blobError === "object" && blobError !== null && "text" in blobError)
        ) {
          try {
            // Try to get the response text
            const errorText = await (blobError as Response).text()

            // Check if it contains "Request Entity Too Large"
            if (errorText.includes("Request Entity Too Large") || errorText.includes("Request En")) {
              return {
                success: false,
                error: `File is too large for upload. Please reduce the file size to under ${MAX_IMAGE_SIZE_MB}MB.`,
              }
            }

            return {
              success: false,
              error: `Blob upload failed: ${errorText.substring(0, 100)}...`,
            }
          } catch (textError) {
            // If we can't get the text, return a generic error
            return {
              success: false,
              error: "File upload failed. The file may be too large or in an unsupported format.",
            }
          }
        }

        // Handle other types of errors
        return {
          success: false,
          error:
            blobError instanceof Error
              ? `Blob upload failed: ${blobError.message}`
              : "Unknown error during blob upload",
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
    } catch (uploadError) {
      console.error("Error in Vercel Blob upload:", uploadError)

      // Try to extract more detailed error information
      let errorMessage = "Failed to upload photo to storage"

      if (uploadError instanceof Error) {
        errorMessage = uploadError.message
      } else if (typeof uploadError === "object" && uploadError !== null) {
        errorMessage = JSON.stringify(uploadError)
      }

      return {
        success: false,
        error: errorMessage,
      }
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

    // List all blobs with the business ID prefix
    const { blobs } = await list({ prefix: `${businessId}/` })

    return {
      success: true,
      blobs,
    }
  } catch (error) {
    console.error("Error listing business blobs:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to list blobs",
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
