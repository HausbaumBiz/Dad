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
    const fileId = formData.get("fileId") as string
    const action = formData.get("action") as string

    // Handle finalization request separately
    if (action === "finalize") {
      return await finalizeUpload(
        businessId,
        fileId,
        formData.get("fileName") as string,
        formData.get("fileType") as string,
        Number(formData.get("totalChunks")),
        (formData.get("aspectRatio") as string) || "16:9",
      )
    }

    const chunkIndex = Number(formData.get("chunkIndex"))
    const totalChunks = Number(formData.get("totalChunks"))
    const fileName = formData.get("fileName") as string
    const fileType = formData.get("fileType") as string
    const chunk = formData.get("chunk") as File
    const aspectRatio = (formData.get("aspectRatio") as string) || "16:9"
    const isLastChunk = chunkIndex === totalChunks - 1 || formData.get("isLastChunk") === "true"

    if (!businessId || !fileId || !chunk || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    console.log(`Processing chunk ${chunkIndex + 1}/${totalChunks} for file ${fileId}`)

    // Upload the chunk to blob storage with proper error handling
    try {
      // Upload the chunk to blob storage
      const chunkPath = `${businessId}/chunks/${fileId}/${chunkIndex}`
      const chunkBlob = await put(chunkPath, chunk, {
        access: "public",
        addRandomSuffix: false,
      })

      console.log(`Chunk ${chunkIndex + 1} uploaded to blob storage: ${chunkPath}`)

      // Store chunk metadata in Redis - ensure all values are strings
      const chunkKey = `business:${businessId}:chunks:${fileId}`

      // Store chunk data directly without nesting in an object
      await kv.hset(chunkKey, `chunk_url:${chunkIndex}`, chunkBlob.url)
      await kv.hset(chunkKey, `chunk_path:${chunkIndex}`, chunkPath)
      await kv.hset(chunkKey, `chunk_size:${chunkIndex}`, chunkBlob.size.toString())
      await kv.hset(chunkKey, `chunk_uploaded:${chunkIndex}`, new Date().toISOString())

      console.log(`Chunk ${chunkIndex + 1} metadata stored in Redis`)

      // If this is the first chunk, store the file metadata
      if (chunkIndex === 0) {
        console.log(`Storing file metadata for ${fileId}`)
        await kv.hset(chunkKey, {
          fileName,
          fileType,
          totalChunks: totalChunks.toString(), // Convert to string
          fileId,
          businessId,
          aspectRatio,
          startTime: new Date().toISOString(),
          // Set expiry for cleanup of abandoned uploads
          expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          uploadedChunks: "1", // Initialize with 1 for the first chunk
        })
      } else {
        // Update the uploaded chunks count
        const currentUploaded = await kv.hget(chunkKey, "uploadedChunks")
        const newUploaded = currentUploaded ? (Number.parseInt(currentUploaded, 10) + 1).toString() : "1"
        await kv.hset(chunkKey, "uploadedChunks", newUploaded)
        console.log(`Updated uploaded chunks count to ${newUploaded}`)
      }

      // If this is the last chunk, finalize the upload
      if (isLastChunk) {
        console.log(`Last chunk received, finalizing upload for ${fileId}`)
        return await finalizeUpload(businessId, fileId, fileName, fileType, totalChunks, aspectRatio)
      }

      // Get the current uploaded chunks count
      const uploadedChunksStr = await kv.hget(chunkKey, "uploadedChunks")
      const uploadedChunks = uploadedChunksStr ? Number.parseInt(uploadedChunksStr, 10) : 0
      console.log(`Current uploaded chunks: ${uploadedChunks}/${totalChunks}`)

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

// Helper function to finalize an upload
async function finalizeUpload(
  businessId: string,
  fileId: string,
  fileName: string,
  fileType: string,
  totalChunks: number,
  aspectRatio: string,
) {
  try {
    console.log(`Finalizing upload for file ${fileId}`)

    // Get all chunk metadata
    const chunkKey = `business:${businessId}:chunks:${fileId}`
    const chunkData = await kv.hgetall(chunkKey)

    if (!chunkData) {
      console.error("Chunk data not found")
      return NextResponse.json({ success: false, error: "Chunk data not found" }, { status: 400 })
    }

    // Check if there's an existing video for this business
    const existingMedia = await kv.hgetall(`business:${businessId}:media`)
    if (existingMedia?.videoId) {
      // Delete the existing video
      try {
        console.log(`Deleting existing video: ${existingMedia.videoId}`)
        await del(existingMedia.videoId)
      } catch (error) {
        console.error("Error deleting existing video:", error)
        // Continue with the upload even if deletion fails
      }
    }

    // Create the final video path
    const videoPath = `videos/${businessId}/${fileName}`

    // Get the last chunk URL directly from Redis
    const lastChunkUrl = chunkData[`chunk_url:${totalChunks - 1}`]

    if (!lastChunkUrl) {
      console.error(`Last chunk URL not found for chunk ${totalChunks - 1}`)

      // Log available keys to help diagnose the issue
      console.log("Available keys in Redis:", Object.keys(chunkData))

      return NextResponse.json(
        {
          success: false,
          error: `Last chunk URL not found. Available keys: ${Object.keys(chunkData).join(", ")}`,
        },
        { status: 400 },
      )
    }

    console.log(`Using last chunk as complete file: ${lastChunkUrl}`)

    // Store the video info in Redis - ensure all values are strings
    const mediaKey = `business:${businessId}:media`
    try {
      await kv.hset(mediaKey, {
        videoUrl: lastChunkUrl,
        videoId: videoPath,
        videoContentType: fileType,
        aspectRatio,
        uploadedAt: new Date().toISOString(),
      })
      console.log(`Video info stored in Redis: ${mediaKey}`)
    } catch (redisError) {
      console.error("Error storing video info in Redis:", redisError)
      return NextResponse.json(
        {
          success: false,
          error: `Error storing video info: ${redisError instanceof Error ? redisError.message : String(redisError)}`,
        },
        { status: 500 },
      )
    }

    // Clean up chunks (in a real implementation)
    // This would happen after successful combination
    // For now, we'll keep them for demonstration

    // Revalidate paths
    revalidatePath("/video")

    return NextResponse.json({
      success: true,
      message: "All chunks uploaded and processed",
      url: lastChunkUrl,
      id: videoPath,
      contentType: fileType,
      isComplete: true,
    })
  } catch (error) {
    console.error("Error finalizing upload:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Error finalizing upload: ${error instanceof Error ? error.message : String(error)}`,
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
    console.log(`Checking upload status for file ${fileId}`)
    const chunkKey = `business:${businessId}:chunks:${fileId}`
    const chunkData = await kv.hgetall(chunkKey)

    if (!chunkData) {
      console.log(`No upload data found for file ${fileId}`)
      return NextResponse.json({ success: false, error: "Upload not found" }, { status: 404 })
    }

    const uploadedChunks = Number.parseInt(chunkData.uploadedChunks || "0", 10)
    const totalChunks = Number.parseInt(chunkData.totalChunks || "0", 10)

    console.log(`Upload status: ${uploadedChunks}/${totalChunks} chunks uploaded`)

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
