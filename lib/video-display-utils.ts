import { getVideoDetails, getStreamUrl, getThumbnailUrl } from "@/lib/cloudflare-stream"

export interface VideoDisplayData {
  id: string
  url: string
  embedUrl: string
  streamUrl: string
  thumbnailUrl: string
  filename: string
  contentType: string
  size: number
  uploadedAt: string
  duration?: number
  status: string
  readyToStream: boolean
  aspectRatio?: string
  meta?: {
    source: string
    businessId?: string
    [key: string]: any
  }
}

export interface VideoRetrievalResult {
  success: boolean
  videos: VideoDisplayData[]
  totalCount: number
  error?: string
}

/**
 * Validate video data from Cloudflare Stream API
 * Updated to handle the actual Cloudflare Stream response format
 */
function validateVideoData(videoData: any): boolean {
  if (!videoData || typeof videoData !== "object") {
    console.log("Video data is not an object:", videoData)
    return false
  }

  // Check for essential fields - Cloudflare uses 'uid' as the ID field
  if (!videoData.uid && !videoData.id) {
    console.log("Video data missing ID field (uid or id):", videoData)
    return false
  }

  return true
}

/**
 * Extract video status from Cloudflare Stream response
 */
function extractVideoStatus(statusData: any): { status: string; readyToStream: boolean } {
  if (!statusData) {
    return { status: "unknown", readyToStream: false }
  }

  // Handle different status formats
  if (typeof statusData === "string") {
    return { status: statusData, readyToStream: statusData === "ready" }
  }

  if (typeof statusData === "object") {
    // Cloudflare returns status as an object like { state: "ready" }
    const state = statusData.state || statusData.status || "unknown"
    return { status: state, readyToStream: state === "ready" }
  }

  return { status: "unknown", readyToStream: false }
}

/**
 * Create video display data from Cloudflare Stream video details
 */
export async function createVideoDisplayData(
  videoId: string,
  businessId: string,
  source = "Unknown",
): Promise<VideoDisplayData | null> {
  try {
    console.log(`Creating video display data for ${videoId} from ${source}`)

    // Get video details from Cloudflare Stream
    const videoDetailsResult = await getVideoDetails(videoId)

    if (!videoDetailsResult.success || !videoDetailsResult.video) {
      console.log(`Failed to get video details for ${videoId}:`, videoDetailsResult.error)
      return null
    }

    const videoData = videoDetailsResult.video

    // Validate the video data
    if (!validateVideoData(videoData)) {
      console.log(`Invalid video data structure for ${videoId}`)
      return null
    }

    // Extract status information
    const { status, readyToStream } = extractVideoStatus(videoData.status)

    // Use uid as the primary ID field, fallback to id
    const actualVideoId = videoData.uid || videoData.id || videoId

    // Create the video display data
    const videoDisplayData: VideoDisplayData = {
      id: actualVideoId,
      url: `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${actualVideoId}/iframe`,
      embedUrl: `https://customer-${process.env.CLOUDFLARE_ACCOUNT_ID}.cloudflarestream.com/${actualVideoId}/iframe`,
      streamUrl: getStreamUrl(actualVideoId),
      thumbnailUrl: getThumbnailUrl(actualVideoId),
      filename: videoData.meta?.name || videoData.filename || `Video ${actualVideoId}`,
      contentType: "video/mp4",
      size: videoData.size || 0,
      uploadedAt: videoData.created || videoData.uploaded || new Date().toISOString(),
      duration: videoData.duration || 0,
      status: status,
      readyToStream: readyToStream,
      aspectRatio:
        videoData.input?.width && videoData.input?.height
          ? `${videoData.input.width}:${videoData.input.height}`
          : undefined,
      meta: {
        source: source,
        businessId: businessId,
        ...videoData.meta,
      },
    }

    console.log(`Successfully created video display data for ${videoId}:`, {
      id: videoDisplayData.id,
      status: videoDisplayData.status,
      readyToStream: videoDisplayData.readyToStream,
      duration: videoDisplayData.duration,
      size: videoDisplayData.size,
    })

    return videoDisplayData
  } catch (error) {
    console.error(`Error creating video display data for ${videoId}:`, error)
    return null
  }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Format video duration in MM:SS or HH:MM:SS format
 */
export function formatVideoDuration(seconds: number): string {
  if (!seconds || seconds === 0) return "0:00"

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }
}

/**
 * Get video status information with color coding
 */
export function getVideoStatusInfo(
  status: string,
  readyToStream: boolean,
): {
  label: string
  color: string
  description: string
} {
  if (readyToStream) {
    return {
      label: "Ready",
      color: "bg-green-100 text-green-800",
      description: "Video is ready for streaming",
    }
  }

  switch (status?.toLowerCase()) {
    case "pendingupload":
      return {
        label: "Pending Upload",
        color: "bg-yellow-100 text-yellow-800",
        description: "Video upload is pending",
      }
    case "downloading":
      return {
        label: "Downloading",
        color: "bg-blue-100 text-blue-800",
        description: "Video is being downloaded",
      }
    case "queued":
      return {
        label: "Queued",
        color: "bg-orange-100 text-orange-800",
        description: "Video is queued for processing",
      }
    case "inprogress":
      return {
        label: "Processing",
        color: "bg-blue-100 text-blue-800",
        description: "Video is being processed",
      }
    case "ready":
      return {
        label: "Ready",
        color: "bg-green-100 text-green-800",
        description: "Video is ready for streaming",
      }
    case "error":
      return {
        label: "Error",
        color: "bg-red-100 text-red-800",
        description: "Video processing failed",
      }
    default:
      return {
        label: status || "Unknown",
        color: "bg-gray-100 text-gray-800",
        description: `Video status: ${status || "Unknown"}`,
      }
  }
}

/**
 * Check if video is playable
 */
export function isVideoPlayable(video: { readyToStream?: boolean; status?: string }): boolean {
  return video.readyToStream === true || video.status?.toLowerCase() === "ready"
}

/**
 * Get video embed HTML
 */
export function getVideoEmbedHtml(videoId: string, width = 640, height = 360): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  return `<iframe
    src="https://customer-${accountId}.cloudflarestream.com/${videoId}/iframe"
    style="border: none; width: ${width}px; height: ${height}px;"
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
    allowfullscreen="true">
  </iframe>`
}
