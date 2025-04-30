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
  folderId?: string
  tags?: string[]
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
    console.log("Starting uploadVideo server action")
    console.log("FormData keys:", [...formData.keys()])

    const businessId = formData.get("businessId")
    if (!businessId || typeof businessId !== "string") {
      console.error("Missing or invalid businessId:", businessId)
      return { success: false, error: "Missing or invalid businessId" }
    }

    const videoFile = formData.get("video")
    if (!videoFile) {
      console.error("Missing video file in formData")
      return { success: false, error: "Missing video file" }
    }

    // Check if the video is a File or Blob
    if (!(videoFile instanceof Blob)) {
      console.error("Video is not a Blob:", typeof videoFile)
      return { success: false, error: "Invalid video format" }
    }

    const designId = formData.get("designId") || "default-design"

    // Log file details
    console.log(`Video file details - Size: ${videoFile.size} bytes, Type: ${videoFile.type}`)

    // Check file size
    const fileSizeMB = videoFile.size / MB_IN_BYTES
    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
      return {
        success: false,
        error: `Video file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${MAX_VIDEO_SIZE_MB}MB.`,
      }
    }

    // Generate a unique filename with timestamp
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)
    const extension = "mp4" // Default to mp4 if we can't determine the extension
    const filename = `${businessId}/videos/${timestamp}-${randomString}.${extension}`

    // Ensure we have a valid content type
    const contentType = videoFile.type || `video/${extension}`

    console.log(`Generated filename: ${filename}`)

    try {
      // Upload to Vercel Blob with proper error handling
      let blob
      try {
        console.log(`Attempting to upload video: ${filename}, size: ${videoFile.size} bytes, type: ${contentType}`)

        // Convert the Blob to an ArrayBuffer and then to a Buffer
        const arrayBuffer = await videoFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        console.log(`Successfully converted video to buffer, size: ${buffer.length} bytes`)

        // Create a blob options object with no null values
        const blobOptions = {
          access: "public",
          addRandomSuffix: false,
          contentType: contentType,
        }

        console.log("Blob upload options:", blobOptions)

        // Use the buffer for upload instead of the file directly
        blob = await put(filename, buffer, blobOptions)
        console.log("Video upload successful:", blob)
      } catch (blobError) {
        console.error("Blob upload error details:", blobError)

        // Try to get more details about the error
        if (blobError instanceof Error) {
          console.error("Error name:", blobError.name)
          console.error("Error message:", blobError.message)
          console.error("Error stack:", blobError.stack)
        }

        // Check if the error is a Response object
        if (blobError instanceof Response) {
          const status = blobError.status
          const statusText = blobError.statusText
          console.error(`Response status: ${status} ${statusText}`)

          try {
            // Try to get the response text without parsing as JSON
            const errorText = await blobError.text()
            console.error("Response error text:", errorText)

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
            console.error("Error getting response text:", textError)
            return {
              success: false,
              error: `Upload failed with status ${status}: ${statusText}`,
            }
          }
        }

        // Check for null args error
        if (blobError instanceof Error && blobError.message.includes("null args are not supported")) {
          return {
            success: false,
            error:
              "Upload failed: One or more required parameters were missing. Please try again with a different file.",
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
        designId: designId,
      })

      revalidatePath(`/ad-design/customize`)
      revalidatePath(`/video`)

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
    // Log more details about the error
    if (error instanceof Error) {
      console.error("Error name:", error.name)
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    } else {
      console.error("Non-Error object thrown:", error)
    }
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

    // Ensure we have a valid content type
    const contentType = file.type || "image/jpeg"

    try {
      // Upload to Vercel Blob directly without compression
      let blob
      try {
        // Convert the File to a Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Create a blob options object with no null values
        const blobOptions = {
          access: "public",
          addRandomSuffix: false,
          contentType: contentType,
        }

        blob = await put(filename, buffer, blobOptions)
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

        // Check for null args error
        if (blobError instanceof Error && blobError.message.includes("null args are not supported")) {
          return {
            success: false,
            error:
              "Upload failed: One or more required parameters were missing. Please try again with a different file.",
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
      revalidatePath(`/video`)

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
 * Delete a thumbnail for a business
 */
export async function deleteThumbnail(businessId: string) {
  try {
    if (!businessId) {
      return { success: false, error: "Missing business ID" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia || !existingMedia.thumbnailId) {
      return { success: false, error: "No thumbnail found" }
    }

    // Delete the thumbnail from Blob storage
    try {
      await del(existingMedia.thumbnailId)
    } catch (deleteError) {
      console.error("Error deleting thumbnail from Blob storage:", deleteError)
      // Continue with removing from the record even if blob deletion fails
    }

    // Update the business media record to remove thumbnail references
    await kv.hset(`business:${businessId}:media`, {
      thumbnailUrl: null,
      thumbnailId: null,
      thumbnailWidth: null,
      thumbnailHeight: null,
      thumbnailOriginalSize: null,
      thumbnailCompressionSavings: null,
    })

    revalidatePath(`/video`)
    revalidatePath(`/ad-design/customize`)

    return { success: true }
  } catch (error) {
    console.error("Error deleting thumbnail:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete thumbnail",
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
    const folderId = formData.get("folderId") as string | null
    const tags = formData.get("tags") as string | null

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

    // Ensure we have a valid content type
    const contentType = file.type || "image/jpeg"

    try {
      // Upload to Vercel Blob directly without compression
      let blob
      try {
        // Convert the File to a Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Create a blob options object with no null values
        const blobOptions = {
          access: "public",
          addRandomSuffix: false,
          contentType: contentType,
        }

        blob = await put(filename, buffer, blobOptions)
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

        // Check for null args error
        if (blobError instanceof Error && blobError.message.includes("null args are not supported")) {
          return {
            success: false,
            error:
              "Upload failed: One or more required parameters were missing. Please try again with a different file.",
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

      // Parse tags if provided
      let parsedTags: string[] = []
      if (tags) {
        try {
          parsedTags = JSON.parse(tags)
        } catch (e) {
          console.error("Error parsing tags:", e)
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
        compressionSavings,
        width: 1200, // Estimated width
        height: 800, // Estimated height
        createdAt: new Date().toISOString(),
        folderId: folderId || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      }

      // Get existing media data
      const existingMedia = (await getBusinessMedia(businessId)) || { photoAlbum: [], folders: [], tags: [] }

      // Add the new photo to the album
      const updatedPhotoAlbum = [...(existingMedia.photoAlbum || []), newPhoto]

      // Update tags in the business media if new tags were added
      const updatedTags = existingMedia.tags || []
      if (parsedTags.length > 0) {
        // Add any new tags that don't already exist
        parsedTags.forEach((tag) => {
          if (!updatedTags.includes(tag)) {
            updatedTags.push(tag)
          }
        })
      }

      // Store reference in KV - ENSURE we stringify the photoAlbum array and tags array
      await kv.hset(`business:${businessId}:media`, {
        photoAlbum: JSON.stringify(updatedPhotoAlbum),
        tags: JSON.stringify(updatedTags),
      })

      revalidatePath(`/photo-album`)

      return {
        success: true,
        photo: newPhoto,
        photoAlbum: updatedPhotoAlbum,
        tags: updatedTags,
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

    revalidatePath(`/photo-album`)

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
      return { photoAlbum: [], folders: [], tags: [] }
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

    // Parse folders if they exist
    let folders: MediaFolder[] = []
    if (mediaData.folders) {
      try {
        folders = JSON.parse(mediaData.folders as string)
      } catch (error) {
        console.error("Error parsing folders:", error)
        folders = []

        // Fix the data in Redis by storing an empty array
        await kv.hset(`business:${businessId}:media`, {
          folders: JSON.stringify([]),
        })
      }
    }

    // Parse tags if they exist
    let tags: string[] = []
    if (mediaData.tags) {
      try {
        tags = JSON.parse(mediaData.tags as string)
      } catch (error) {
        console.error("Error parsing tags:", error)
        tags = []

        // Fix the data in Redis by storing an empty array
        await kv.hset(`business:${businessId}:media`, {
          tags: JSON.stringify([]),
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
      folders,
      tags,
    }

    return businessMedia
  } catch (error) {
    console.error("Error getting business media:", error)
    return { photoAlbum: [], folders: [], tags: [] }
  }
}

/**
 * Create a new folder
 */
export async function createFolder(businessId: string, folderName: string, parentId?: string) {
  try {
    if (!businessId || !folderName) {
      return { success: false, error: "Missing required fields" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia) {
      return { success: false, error: "No media data found" }
    }

    // Create a new folder
    const newFolder: MediaFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      name: folderName,
      createdAt: new Date().toISOString(),
      parentId: parentId,
    }

    // Add the new folder to the list
    const updatedFolders = [...(existingMedia.folders || []), newFolder]

    // Store in KV
    await kv.hset(`business:${businessId}:media`, {
      folders: JSON.stringify(updatedFolders),
    })

    revalidatePath(`/photo-album`)

    return {
      success: true,
      folder: newFolder,
      folders: updatedFolders,
    }
  } catch (error) {
    console.error("Error creating folder:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create folder",
    }
  }
}

/**
 * Rename a folder
 */
export async function renameFolder(businessId: string, folderId: string, newName: string) {
  try {
    if (!businessId || !folderId || !newName) {
      return { success: false, error: "Missing required fields" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia || !existingMedia.folders) {
      return { success: false, error: "No folders found" }
    }

    // Find the folder to rename
    const folderIndex = existingMedia.folders.findIndex((folder) => folder.id === folderId)

    if (folderIndex === -1) {
      return { success: false, error: "Folder not found" }
    }

    // Update the folder name
    const updatedFolders = [...existingMedia.folders]
    updatedFolders[folderIndex] = {
      ...updatedFolders[folderIndex],
      name: newName,
    }

    // Store in KV
    await kv.hset(`business:${businessId}:media`, {
      folders: JSON.stringify(updatedFolders),
    })

    revalidatePath(`/photo-album`)

    return {
      success: true,
      folders: updatedFolders,
    }
  } catch (error) {
    console.error("Error renaming folder:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to rename folder",
    }
  }
}

/**
 * Delete a folder
 */
export async function deleteFolder(businessId: string, folderId: string) {
  try {
    if (!businessId || !folderId) {
      return { success: false, error: "Missing required fields" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia || !existingMedia.folders) {
      return { success: false, error: "No folders found" }
    }

    // Find the folder to delete
    const folderIndex = existingMedia.folders.findIndex((folder) => folder.id === folderId)

    if (folderIndex === -1) {
      return { success: false, error: "Folder not found" }
    }

    // Remove the folder
    const updatedFolders = existingMedia.folders.filter((folder) => folder.id !== folderId)

    // Update photos to remove the folder reference
    const updatedPhotoAlbum = existingMedia.photoAlbum.map((photo) => {
      if (photo.folderId === folderId) {
        return { ...photo, folderId: undefined }
      }
      return photo
    })

    // Store in KV
    await kv.hset(`business:${businessId}:media`, {
      folders: JSON.stringify(updatedFolders),
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

    revalidatePath(`/photo-album`)

    return {
      success: true,
      folders: updatedFolders,
      photoAlbum: updatedPhotoAlbum,
    }
  } catch (error) {
    console.error("Error deleting folder:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete folder",
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
    revalidatePath(`/photo-album`)

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
 * Create a new tag
 */
export async function createTag(businessId: string, tagName: string) {
  try {
    if (!businessId || !tagName) {
      return { success: false, error: "Missing required fields" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia) {
      return { success: false, error: "No media data found" }
    }

    // Check if tag already exists
    const existingTags = existingMedia.tags || []
    if (existingTags.includes(tagName)) {
      return { success: false, error: "Tag already exists" }
    }

    // Add the new tag
    const updatedTags = [...existingTags, tagName]

    // Store in KV
    await kv.hset(`business:${businessId}:media`, {
      tags: JSON.stringify(updatedTags),
    })

    revalidatePath(`/photo-album`)

    return {
      success: true,
      tags: updatedTags,
    }
  } catch (error) {
    console.error("Error creating tag:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create tag",
    }
  }
}

/**
 * Delete a tag
 */
export async function deleteTag(businessId: string, tagName: string) {
  try {
    if (!businessId || !tagName) {
      return { success: false, error: "Missing required fields" }
    }

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    if (!existingMedia) {
      return { success: false, error: "No media data found" }
    }

    // Remove the tag from the list
    const existingTags = existingMedia.tags || []
    const updatedTags = existingTags.filter((tag) => tag !== tagName)

    // Remove the tag from all photos
    const updatedPhotoAlbum = existingMedia.photoAlbum.map((photo) => {
      if (photo.tags && photo.tags.includes(tagName)) {
        const newTags = photo.tags.filter((tag) => tag !== tagName)
        return {
          ...photo,
          tags: newTags.length > 0 ? newTags : undefined,
        }
      }
      return photo
    })

    // Store in KV
    await kv.hset(`business:${businessId}:media`, {
      tags: JSON.stringify(updatedTags),
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

    revalidatePath(`/photo-album`)

    return {
      success: true,
      tags: updatedTags,
      photoAlbum: updatedPhotoAlbum,
    }
  } catch (error) {
    console.error("Error deleting tag:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete tag",
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
