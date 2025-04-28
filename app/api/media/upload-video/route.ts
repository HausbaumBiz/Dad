import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

// Constants for file size limits
const MAX_VIDEO_SIZE_MB = 50
const MB_IN_BYTES = 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const businessId = formData.get("businessId") as string
    const file = formData.get("video") as File
    const designId = formData.get("designId") as string

    if (!file || !businessId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Check file size
    const fileSizeMB = file.size / MB_IN_BYTES
    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
      return NextResponse.json(
        {
          success: false,
          error: `Video file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is ${MAX_VIDEO_SIZE_MB}MB.`,
        },
        { status: 400 },
      )
    }

    // Generate a unique filename with timestamp and original extension
    const extension = file.name.split(".").pop() || "mp4"
    const filename = `${businessId}/videos/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
      maxSize: MAX_VIDEO_SIZE_MB * MB_IN_BYTES,
    })

    // Get existing media data
    const mediaData = await kv.hgetall(`business:${businessId}:media`)

    // If there's an existing video, we would delete it here
    // But for simplicity in this API route, we'll skip that step

    // Store reference in KV
    await kv.hset(`business:${businessId}:media`, {
      videoUrl: blob.url,
      videoContentType: blob.contentType,
      videoId: filename,
      designId: designId || (mediaData?.designId as string),
    })

    revalidatePath(`/ad-design/customize`)

    return NextResponse.json({
      success: true,
      url: blob.url,
      contentType: blob.contentType,
      size: blob.size,
      id: filename,
    })
  } catch (error) {
    console.error("Error in video upload API route:", error)

    // Return a proper error response
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to upload video",
      },
      { status: 500 },
    )
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
