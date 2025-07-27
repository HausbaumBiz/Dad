"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { deleteVideo, getVideoDetails } from "@/lib/cloudflare-stream"

// Business media type including Cloudflare Stream fields
export type CloudflareBusinessMedia = {
  cloudflareVideoId?: string
  cloudflareVideoUrl?: string
  cloudflareVideoStatus?: string
  cloudflareVideoReadyToStream?: boolean
  cloudflareVideoThumbnailTime?: number
  videoAspectRatio?: "16:9" | "9:16"
}

/**
 * Get Cloudflare Stream media for a business
 */
export async function getCloudflareBusinessMedia(businessId: string): Promise<CloudflareBusinessMedia | null> {
  if (!businessId) {
    console.error("No business ID provided to getCloudflareBusinessMedia")
    return null
  }

  try {
    const mediaKey = `business:${businessId}:cloudflare-media`
    console.log(`[getCloudflareBusinessMedia] Fetching media for key: ${mediaKey}`)

    const media = await kv.hgetall(mediaKey)
    console.log(`[getCloudflareBusinessMedia] Raw media data:`, media)

    if (!media || Object.keys(media).length === 0) {
      console.log(`[getCloudflareBusinessMedia] No media found for business ${businessId}`)
      return null
    }

    // Convert the readyToStream string to a boolean and handle potential null/undefined values
    const processedMedia = {
      cloudflareVideoId: media.cloudflareVideoId || undefined,
      cloudflareVideoUrl: media.cloudflareVideoUrl || undefined,
      cloudflareVideoStatus: media.cloudflareVideoStatus || undefined,
      cloudflareVideoReadyToStream:
        media.cloudflareVideoReadyToStream === "true" || media.cloudflareVideoReadyToStream === true,
      cloudflareVideoThumbnailTime: media.cloudflareVideoThumbnailTime
        ? Number.parseInt(media.cloudflareVideoThumbnailTime as string) || 0
        : 0,
      videoAspectRatio: (media.videoAspectRatio as "16:9" | "9:16") || undefined,
    } as CloudflareBusinessMedia

    console.log(`[getCloudflareBusinessMedia] Processed media data:`, processedMedia)
    return processedMedia
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error(`Error getting Cloudflare business media for business ${businessId}:`, {
      message: errorMessage,
      stack: errorStack,
      businessId,
      timestamp: new Date().toISOString(),
    })
    return null
  }
}

/**
 * Save Cloudflare video information after upload
 */
export async function saveCloudflareVideo(
  businessId: string,
  videoId: string,
  aspectRatio: "16:9" | "9:16",
): Promise<{ success: boolean; error?: string }> {
  if (!businessId) {
    return {
      success: false,
      error: "No business ID provided",
    }
  }

  if (!videoId) {
    return {
      success: false,
      error: "No video ID provided",
    }
  }

  try {
    console.log(`[saveCloudflareVideo] Saving video ${videoId} for business ${businessId}`)

    // Get the existing media data
    const existingMedia = await getCloudflareBusinessMedia(businessId)

    // Check if there's already a video - if so, delete it from Cloudflare
    if (existingMedia?.cloudflareVideoId && existingMedia.cloudflareVideoId !== videoId) {
      try {
        console.log(
          `Attempting to delete existing video: ${existingMedia.cloudflareVideoId} for business ${businessId}`,
        )
        const deleteResult = await deleteVideo(existingMedia.cloudflareVideoId)
        if (!deleteResult.success) {
          console.warn(`Warning: Failed to delete existing video: ${deleteResult.error}`)
          // Continue with saving the new video even if deletion fails
        } else {
          console.log(`Successfully deleted existing video for business ${businessId}`)
        }
      } catch (deleteError) {
        const deleteErrorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError)
        console.error(`Error deleting existing Cloudflare video for business ${businessId}:`, deleteErrorMessage)
        // Continue with saving the new video even if deletion fails
      }
    }

    // Check video details in Cloudflare
    const videoDetails = await getVideoDetails(videoId)
    if (!videoDetails.success) {
      return {
        success: false,
        error: videoDetails.error || "Failed to get video details from Cloudflare",
      }
    }

    // Prepare the status value - ensure it's a string
    let statusValue = "unknown"
    if (videoDetails.video.status) {
      statusValue =
        typeof videoDetails.video.status === "string"
          ? videoDetails.video.status
          : JSON.stringify(videoDetails.video.status)
    }

    // Save the video info in Redis
    const mediaKey = `business:${businessId}:cloudflare-media`
    const mediaData = {
      cloudflareVideoId: videoId,
      cloudflareVideoStatus: statusValue,
      cloudflareVideoReadyToStream: String(videoDetails.video.readyToStream || false),
      cloudflareVideoThumbnailTime: "0",
      videoAspectRatio: aspectRatio,
    }

    console.log(`[saveCloudflareVideo] Saving media data to ${mediaKey}:`, mediaData)
    await kv.hset(mediaKey, mediaData)

    // Force revalidation to ensure the UI updates immediately
    revalidatePath("/video")

    console.log(`[saveCloudflareVideo] Successfully saved video for business ${businessId}`)
    return {
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error(`Error saving Cloudflare video for business ${businessId}:`, {
      message: errorMessage,
      stack: errorStack,
      businessId,
      videoId,
      aspectRatio,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Delete Cloudflare video
 */
export async function deleteCloudflareVideo(businessId: string): Promise<{ success: boolean; error?: string }> {
  if (!businessId) {
    return {
      success: false,
      error: "No business ID provided",
    }
  }

  try {
    console.log(`[deleteCloudflareVideo] Deleting video for business ${businessId}`)

    // Get the existing media data
    const existingMedia = await getCloudflareBusinessMedia(businessId)

    // If there's no video, return success
    if (!existingMedia?.cloudflareVideoId) {
      console.log(`[deleteCloudflareVideo] No video found for business ${businessId}`)
      return { success: true }
    }

    // Delete the video from Cloudflare
    try {
      console.log(`Attempting to delete video: ${existingMedia.cloudflareVideoId} for business ${businessId}`)
      const deleteResult = await deleteVideo(existingMedia.cloudflareVideoId)
      if (!deleteResult.success) {
        console.warn(`Warning: Failed to delete video: ${deleteResult.error}`)
        // Continue with removing from the record even if Cloudflare deletion fails
      } else {
        console.log(`Successfully deleted video for business ${businessId}`)
      }
    } catch (deleteError) {
      const deleteErrorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError)
      console.error(`Error deleting Cloudflare video for business ${businessId}:`, deleteErrorMessage)
      // Continue with removing from the record even if Cloudflare deletion fails
    }

    // Update the business media record to remove video references
    const mediaKey = `business:${businessId}:cloudflare-media`
    await kv.del(mediaKey)

    revalidatePath("/video")

    console.log(`[deleteCloudflareVideo] Successfully deleted video record for business ${businessId}`)
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error(`Error deleting Cloudflare video for business ${businessId}:`, {
      message: errorMessage,
      stack: errorStack,
      businessId,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Update Cloudflare video thumbnail time
 */
export async function updateCloudflareVideoThumbnailTime(
  businessId: string,
  time: number,
): Promise<{ success: boolean; error?: string }> {
  if (!businessId) {
    return {
      success: false,
      error: "No business ID provided",
    }
  }

  if (typeof time !== "number" || time < 0) {
    return {
      success: false,
      error: "Invalid thumbnail time provided",
    }
  }

  try {
    console.log(`[updateCloudflareVideoThumbnailTime] Updating thumbnail time to ${time} for business ${businessId}`)

    // Get the existing media data
    const existingMedia = await getCloudflareBusinessMedia(businessId)

    // If there's no video, return error
    if (!existingMedia?.cloudflareVideoId) {
      return {
        success: false,
        error: "No video found for this business",
      }
    }

    // Update the thumbnail time
    const mediaKey = `business:${businessId}:cloudflare-media`
    await kv.hset(mediaKey, {
      cloudflareVideoThumbnailTime: String(time),
    })

    revalidatePath("/video")

    console.log(`[updateCloudflareVideoThumbnailTime] Successfully updated thumbnail time for business ${businessId}`)
    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error(`Error updating Cloudflare video thumbnail time for business ${businessId}:`, {
      message: errorMessage,
      stack: errorStack,
      businessId,
      time,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Check if video is ready to stream
 */
export async function checkCloudflareVideoStatus(
  businessId: string,
): Promise<{ success: boolean; readyToStream: boolean; status?: string; error?: string }> {
  if (!businessId) {
    return {
      success: false,
      readyToStream: false,
      error: "No business ID provided",
    }
  }

  try {
    console.log(`[checkCloudflareVideoStatus] Checking video status for business ${businessId}`)

    // Get the existing media data
    const existingMedia = await getCloudflareBusinessMedia(businessId)

    // If there's no video, return error
    if (!existingMedia?.cloudflareVideoId) {
      return {
        success: false,
        readyToStream: false,
        error: "No video found for this business",
      }
    }

    // Check video details in Cloudflare
    const videoDetails = await getVideoDetails(existingMedia.cloudflareVideoId)
    if (!videoDetails.success) {
      return {
        success: false,
        readyToStream: false,
        error: videoDetails.error || "Failed to get video details from Cloudflare",
      }
    }

    // Prepare the status value - ensure it's a string
    let statusValue = "unknown"
    if (videoDetails.video.status) {
      statusValue =
        typeof videoDetails.video.status === "string"
          ? videoDetails.video.status
          : JSON.stringify(videoDetails.video.status)
    }

    // Check if the video is ready to stream
    const isReady = videoDetails.video.readyToStream || false

    // Update the video status in Redis
    const mediaKey = `business:${businessId}:cloudflare-media`
    await kv.hset(mediaKey, {
      cloudflareVideoStatus: statusValue,
      cloudflareVideoReadyToStream: String(isReady),
    })

    // Force revalidation to ensure the UI updates
    revalidatePath("/video")

    console.log(
      `[checkCloudflareVideoStatus] Video status check complete for business ${businessId}: ready=${isReady}, status=${statusValue}`,
    )
    return {
      success: true,
      readyToStream: isReady,
      status: statusValue,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error(`Error checking Cloudflare video status for business ${businessId}:`, {
      message: errorMessage,
      stack: errorStack,
      businessId,
      timestamp: new Date().toISOString(),
    })
    return {
      success: false,
      readyToStream: false,
      error: errorMessage,
    }
  }
}
