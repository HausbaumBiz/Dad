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

    // Get existing media data
    const existingMedia = await getBusinessMedia(businessId)

    // Add the new photo to the album
    const updatedPhotoAlbum = [...(existingMedia?.photoAlbum || []), newPhoto]

    // Store in Redis
    await kv.hset(`business:${businessId}:media`, {
      photoAlbum: JSON.stringify(updatedPhotoAlbum),
    })

    revalidatePath(`/photo-album`)

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
    console.error("Error getting business media:", error)
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

    // Clear all media data from Redis
    await kv.del(`business:${businessId}:media`)

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
