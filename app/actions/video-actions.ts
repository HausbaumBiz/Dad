"use server"

import { put, del } from "@vercel/blob"
import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"

// Types for video storage
export type VideoItem = {
  id: string
  url: string
  filename: string
  contentType: string
  size: number
  aspectRatio: "16:9" | "9:16"
  createdAt: string
}

export type BusinessVideos = {
  videos: VideoItem[]
}

// Constants for file size limits
const MAX_VIDEO_SIZE_MB = 50
const MB_IN_BYTES = 1024 * 1024

/**
 * Upload a video to Vercel Blob storage
 */
export async function uploadVideo(formData: FormData) {
  try {
    const businessId = formData.get("businessId") as string
    const video = formData.get("video") as File
    const aspectRatio = (formData.get("aspectRatio") as string) || "16:9"

    if (!businessId || !video) {
      return {
        success: false,
        error: "Missing required fields",
      }
    }

    // Check file size
    const fileSizeMB = video.size / MB_IN_BYTES
    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
      return {
        success: false,
        error: `Video file size (${fileSizeMB.toFixed(2)}MB) exceeds the ${MAX_VIDEO_SIZE_MB}MB limit.`,
      }
    }

    // Generate a unique filename with timestamp
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 10)

    // Get file extension from the original filename or default to mp4
    const originalExtension = video.name.split(".").pop()?.toLowerCase() || "mp4"
    const filename = `${businessId}/videos/${timestamp}-${randomString}.${originalExtension}`

    // Upload to Vercel Blob with proper error handling
    try {
      const blob = await put(filename, video, {
        access: "public",
        addRandomSuffix: false,
      })

      // Create a video item
      const newVideo: VideoItem = {
        id: filename,
        url: blob.url,
        filename: video.name,
        contentType: blob.contentType,
        size: blob.size,
        aspectRatio: aspectRatio as "16:9" | "9:16",
        createdAt: new Date().toISOString(),
      }

      // Get existing videos for this business
      const existingVideos = await getBusinessVideos(businessId)
      const updatedVideos = [...(existingVideos?.videos || []), newVideo]

      // Store in Redis
      await kv.hset(`business:${businessId}:videos`, {
        videos: JSON.stringify(updatedVideos),
      })

      revalidatePath("/video")

      return {
        success: true,
        video: newVideo,
        videos: updatedVideos,
      }
    } catch (blobError) {
      console.error("Blob storage error:", blobError)

      // Check for specific error types
      if (blobError instanceof Response) {
        const status = blobError.status
        try {
          const errorText = await blobError.text()
          if (errorText.includes("Request Entity Too Large") || status === 413) {
            return {
              success: false,
              error: `The video file is too large for the server to process. Please try a smaller file (under ${MAX_VIDEO_SIZE_MB}MB).`,
            }
          } else {
            return {
              success: false,
              error: `Upload failed with status ${status}: ${errorText}`,
            }
          }
        } catch (e) {
          return {
            success: false,
            error: `Upload failed with status ${status}`,
          }
        }
      }

      return {
        success: false,
        error: blobError instanceof Error ? blobError.message : "Error uploading to storage",
      }
    }
  } catch (error) {
    console.error("Error uploading video:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during video upload",
    }
  }
}

/**
 * Get all videos for a business
 */
export async function getBusinessVideos(businessId: string): Promise<BusinessVideos | null> {
  try {
    if (!businessId) {
      return null
    }

    // Get the videos data from KV
    const videosData = await kv.hgetall(`business:${businessId}:videos`)

    if (!videosData) {
      return { videos: [] }
    }

    // Parse the videos JSON
    let videos: VideoItem[] = []
    if (videosData.videos) {
      try {
        if (typeof videosData.videos === "string") {
          videos = JSON.parse(videosData.videos as string)
        } else if (Array.isArray(videosData.videos)) {
          videos = videosData.videos
        }
      } catch (error) {
        console.error("Error parsing videos:", error)
        videos = []
      }
    }

    return { videos }
  } catch (error) {
    console.error("Error getting business videos:", error)
    return { videos: [] }
  }
}

/**
 * Delete a video
 */
export async function deleteVideo(businessId: string, videoId: string) {
  try {
    if (!videoId || !businessId) {
      return { success: false, error: "Missing required fields" }
    }

    // Get existing videos
    const existingVideos = await getBusinessVideos(businessId)

    if (!existingVideos || !existingVideos.videos.length) {
      return { success: false, error: "No videos found" }
    }

    // Find the video to delete
    const videoToDelete = existingVideos.videos.find((video) => video.id === videoId)

    if (!videoToDelete) {
      return { success: false, error: "Video not found" }
    }

    try {
      // Delete from Vercel Blob
      await del(videoId)
    } catch (deleteError) {
      console.error("Error deleting video from Blob storage:", deleteError)
      // Continue with removing from the list even if blob deletion fails
    }

    // Remove from the videos list
    const updatedVideos = existingVideos.videos.filter((video) => video.id !== videoId)

    // Update the KV store
    await kv.hset(`business:${businessId}:videos`, {
      videos: JSON.stringify(updatedVideos),
    })

    revalidatePath("/video")

    return {
      success: true,
      videos: updatedVideos,
    }
  } catch (error) {
    console.error("Error deleting video:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete video",
    }
  }
}
