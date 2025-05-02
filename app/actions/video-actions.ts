"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { del } from "@vercel/blob"

export interface VideoItem {
  id: string
  url: string
  contentType: string
  aspectRatio: string
  createdAt: string
  filename: string
  size: number
}

export async function uploadVideo(formData: FormData) {
  try {
    // Log the form data for debugging
    const businessId = formData.get("businessId") as string
    const video = formData.get("video") as File

    if (!businessId || !video) {
      return { success: false, error: "Missing required fields" }
    }

    console.log(`Uploading video: ${video.name}, size: ${video.size} bytes`)

    // Use fetch to call our dedicated API route
    const response = await fetch("/api/video-upload", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Upload failed with status ${response.status}: ${errorText}`)
      return {
        success: false,
        error: `Upload failed: ${response.statusText}. ${errorText}`,
      }
    }

    const result = await response.json()

    // Revalidate the video page
    revalidatePath("/video")

    return {
      success: true,
      ...result,
    }
  } catch (error) {
    console.error("Error in uploadVideo server action:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function deleteVideo(businessId: string, videoId: string) {
  try {
    // Delete from Blob storage
    await del(videoId)

    // Remove from Redis
    const mediaKey = `business:${businessId}:media`
    await kv.hdel(mediaKey, "videoUrl", "videoId", "videoContentType", "aspectRatio", "uploadedAt")

    // Revalidate the video page
    revalidatePath("/video")

    return {
      success: true,
      videos: [], // Return empty array since we deleted the video
    }
  } catch (error) {
    console.error("Error deleting video:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}

export async function getBusinessVideos(businessId: string) {
  try {
    const mediaKey = `business:${businessId}:media`
    const videoData = await kv.hgetall(mediaKey)

    if (!videoData || !videoData.videoUrl) {
      return {
        success: true,
        videos: [],
      }
    }

    const videos: VideoItem[] = [
      {
        id: videoData.videoId as string,
        url: videoData.videoUrl as string,
        contentType: videoData.videoContentType as string,
        aspectRatio: (videoData.aspectRatio as string) || "16:9",
        createdAt: (videoData.uploadedAt as string) || new Date().toISOString(),
        filename: ((videoData.videoId as string) || "").split("/").pop() || "video.mp4",
        size: 0, // We don't have the size stored
      },
    ]

    return {
      success: true,
      videos,
    }
  } catch (error) {
    console.error("Error getting business videos:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unknown error occurred",
      videos: [],
    }
  }
}
