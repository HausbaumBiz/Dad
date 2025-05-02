import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"

// Increase the body parser size limit for this specific route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
}

export async function POST(request: NextRequest) {
  try {
    // Log the request size to help with debugging
    const contentLength = request.headers.get("content-length")
    console.log(`Received upload request with content length: ${contentLength} bytes`)

    const formData = await request.formData()
    const businessId = formData.get("businessId") as string
    const video = formData.get("video") as File
    const aspectRatio = (formData.get("aspectRatio") as string) || "16:9"

    if (!businessId || !video) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    console.log(`Processing video upload: ${video.name}, size: ${video.size} bytes, type: ${video.type}`)

    // Upload to Vercel Blob
    const videoPath = `videos/${businessId}/${video.name}`
    const blob = await put(videoPath, video, {
      access: "public",
      addRandomSuffix: false,
    })

    console.log(`Video uploaded to Blob storage: ${blob.url}`)

    // Store video info in Redis
    const mediaKey = `business:${businessId}:media`
    await kv.hset(mediaKey, {
      videoUrl: blob.url,
      videoId: videoPath,
      videoContentType: video.type,
      aspectRatio,
      uploadedAt: new Date().toISOString(),
    })

    console.log(`Video info stored in Redis: ${mediaKey}`)

    // Revalidate paths
    revalidatePath("/video")

    // Get all videos for this business
    const videos = await getBusinessVideos(businessId)

    return NextResponse.json({
      success: true,
      message: "Video uploaded successfully",
      url: blob.url,
      id: videoPath,
      contentType: video.type,
      videos,
    })
  } catch (error) {
    console.error("Error uploading video:", error)

    // Provide more detailed error information
    let errorMessage = "Failed to upload video"
    let statusCode = 500

    if (error instanceof Error) {
      errorMessage = error.message

      // Check for specific error types
      if (errorMessage.includes("body size limit")) {
        errorMessage = "The video file is too large. Maximum size is 100MB."
        statusCode = 413
      } else if (errorMessage.includes("ETIMEDOUT") || errorMessage.includes("timeout")) {
        errorMessage = "The upload timed out. Please try with a smaller file or check your connection."
        statusCode = 408
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode },
    )
  }
}

// Helper function to get all videos for a business
async function getBusinessVideos(businessId: string) {
  try {
    const mediaKey = `business:${businessId}:media`
    const videoData = await kv.hgetall(mediaKey)

    if (!videoData || !videoData.videoUrl) {
      return []
    }

    return [
      {
        id: videoData.videoId,
        url: videoData.videoUrl,
        contentType: videoData.videoContentType,
        aspectRatio: videoData.aspectRatio || "16:9",
        createdAt: videoData.uploadedAt || new Date().toISOString(),
        filename: videoData.videoId.split("/").pop() || "video.mp4",
        size: 0, // We don't have the size stored, so default to 0
      },
    ]
  } catch (error) {
    console.error("Error getting business videos:", error)
    return []
  }
}
