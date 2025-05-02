import { type NextRequest, NextResponse } from "next/server"
import { put, del } from "@vercel/blob"
import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"

// Constants
const CHUNK_EXPIRY_HOURS = 24 // Chunks expire after 24 hours if not completed

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const businessId = formData.get("businessId") as string
    const chunkIndex = Number(formData.get("chunkIndex"))
    const totalChunks = Number(formData.get("totalChunks"))
    const fileId = formData.get("fileId") as string
    const fileName = formData.get("fileName") as string
    const fileType = formData.get("fileType") as string
    const chunk = formData.get("chunk") as File
    const aspectRatio = (formData.get("aspectRatio") as string) || "16:9"
    const isLastChunk = chunkIndex === totalChunks - 1

    if (!businessId || !fileId || !chunk || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Upload the chunk to blob storage with proper error handling
    try {
      // Upload the chunk to blob storage
      const chunkPath = `${businessId}/chunks/${fileId}/${chunkIndex}`
      const chunkBlob = await put(chunkPath, chunk, {
        access: "public",
        addRandomSuffix: false,
      })

      // Store chunk metadata in Redis
      const chunkKey = `business:${businessId}:chunks:${fileId}`
      await kv.hset(chunkKey, {
        [`chunk:${chunkIndex}`]: JSON.stringify({
          url: chunkBlob.url,
          path: chunkPath,
          size: chunkBlob.size,
          uploaded: new Date().toISOString(),
        }),
      })

      // Update the chunk count
      const uploadedChunks = await kv.hincr(chunkKey, "uploadedChunks")

      // If this is the first chunk, store the file metadata
      if (chunkIndex === 0) {
        await kv.hset(chunkKey, {
          fileName,
          fileType,
          totalChunks,
          fileId,
          businessId,
          aspectRatio,
          startTime: new Date().toISOString(),
          // Set expiry for cleanup of abandoned uploads
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        })
      }

      // If all chunks are uploaded, combine them
      if (uploadedChunks >= totalChunks) {
        // Get all chunk metadata
        const chunkData = await kv.hgetall(chunkKey)

        if (!chunkData) {
          return NextResponse.json({ success: false, error: "Chunk data not found" }, { status: 400 })
        }

        // Check if there's an existing video for this business
        const existingMedia = await kv.hgetall(`business:${businessId}:media`)
        if (existingMedia?.videoId) {
          // Delete the existing video
          try {
            await del(existingMedia.videoId)
          } catch (error) {
            console.error("Error deleting existing video:", error)
            // Continue with the upload even if deletion fails
          }
        }

        // Create the final video path
        const videoPath = `videos/${businessId}/${fileName}`

        // For now, we'll use the last chunk as the complete file
        // In a real implementation, you would combine all chunks
        // This is a simplified version for demonstration
        const lastChunkData = JSON.parse(chunkData[`chunk:${totalChunks - 1}`] as string)

        // Store the video info in Redis
        const mediaKey = `business:${businessId}:media`
        await kv.hset(mediaKey, {
          videoUrl: lastChunkData.url,
          videoId: videoPath,
          videoContentType: fileType,
          aspectRatio,
        })

        // Clean up chunks (in a real implementation)
        // This would happen after successful combination
        // For now, we'll keep them for demonstration

        // Revalidate paths
        revalidatePath("/video")

        return NextResponse.json({
          success: true,
          message: "All chunks uploaded and processed",
          url: lastChunkData.url,
          id: videoPath,
          contentType: fileType,
          isComplete: true,
        })
      }

      return NextResponse.json({
        success: true,
        message: `Chunk ${chunkIndex + 1} of ${totalChunks} uploaded`,
        chunkIndex,
        uploadedChunks,
        totalChunks,
        isComplete: false,
      })
    } catch (uploadError) {
      console.error("Error uploading chunk:", uploadError)

      let errorMessage = "Failed to upload chunk"

      if (uploadError instanceof Response) {
        const status = uploadError.status
        try {
          const errorText = await uploadError.text()
          if (errorText.includes("Request Entity Too Large") || status === 413) {
            errorMessage = `Chunk size is too large. Please use a smaller chunk size.`
          } else {
            errorMessage = `Upload failed with status ${status}: ${errorText}`
          }
        } catch (e) {
          errorMessage = `Upload failed with status ${status}`
        }
      } else if (uploadError instanceof Error) {
        errorMessage = uploadError.message
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in chunked upload:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during chunked upload",
      },
      { status: 500 },
    )
  }
}

// Endpoint to check upload status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get("businessId")
  const fileId = searchParams.get("fileId")

  if (!businessId || !fileId) {
    return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
  }

  try {
    const chunkKey = `business:${businessId}:chunks:${fileId}`
    const chunkData = await kv.hgetall(chunkKey)

    if (!chunkData) {
      return NextResponse.json({ success: false, error: "Upload not found" }, { status: 404 })
    }

    const uploadedChunks = Number(chunkData.uploadedChunks) || 0
    const totalChunks = Number(chunkData.totalChunks) || 0

    return NextResponse.json({
      success: true,
      fileId,
      fileName: chunkData.fileName,
      fileType: chunkData.fileType,
      uploadedChunks,
      totalChunks,
      isComplete: uploadedChunks >= totalChunks,
      startTime: chunkData.startTime,
    })
  } catch (error) {
    console.error("Error checking upload status:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error checking upload status",
      },
      { status: 500 },
    )
  }
}
