/**
 * Utility for chunked file uploads
 */

// Default chunk size: 5MB
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024

export interface ChunkUploadOptions {
  file: File
  chunkSize?: number
  businessId: string
  onProgress?: (progress: number) => void
  onComplete?: (result: any) => void
  onError?: (error: Error) => void
}

export async function uploadFileInChunks({
  file,
  chunkSize = DEFAULT_CHUNK_SIZE,
  businessId,
  onProgress,
  onComplete,
  onError,
}: ChunkUploadOptions) {
  try {
    // Generate a unique file ID
    const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`

    // Calculate total chunks
    const totalChunks = Math.ceil(file.size / chunkSize)
    let uploadedChunks = 0

    // Upload each chunk
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize
      const end = Math.min(file.size, start + chunkSize)
      const chunk = file.slice(start, end)

      // Create form data for this chunk
      const formData = new FormData()
      formData.append("businessId", businessId)
      formData.append("fileId", fileId)
      formData.append("chunkIndex", i.toString())
      formData.append("totalChunks", totalChunks.toString())
      formData.append("fileName", file.name)
      formData.append("fileType", file.type)
      formData.append("chunk", chunk)
      formData.append("isLastChunk", (i === totalChunks - 1).toString())

      // Upload the chunk
      const response = await fetch("/api/media/chunked-upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Chunk upload failed: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Chunk upload failed")
      }

      // Update progress
      uploadedChunks++
      const progress = Math.round((uploadedChunks / totalChunks) * 100)
      onProgress?.(progress)

      // If this was the last chunk or the server indicates completion
      if (result.isComplete || i === totalChunks - 1) {
        // Finalize the upload if needed
        if (!result.isComplete) {
          const finalizeFormData = new FormData()
          finalizeFormData.append("businessId", businessId)
          finalizeFormData.append("fileId", fileId)
          finalizeFormData.append("action", "finalize")
          finalizeFormData.append("fileName", file.name)
          finalizeFormData.append("fileType", file.type)
          finalizeFormData.append("totalChunks", totalChunks.toString())

          const finalizeResponse = await fetch("/api/media/chunked-upload", {
            method: "POST",
            body: finalizeFormData,
          })

          if (!finalizeResponse.ok) {
            throw new Error(`Failed to finalize upload: ${finalizeResponse.statusText}`)
          }

          const finalizeResult = await finalizeResponse.json()

          if (!finalizeResult.success) {
            throw new Error(finalizeResult.error || "Failed to finalize upload")
          }

          onComplete?.(finalizeResult)
        } else {
          onComplete?.(result)
        }

        break
      }
    }
  } catch (error) {
    console.error("Chunked upload error:", error)
    onError?.(error instanceof Error ? error : new Error("Unknown error during chunked upload"))
  }
}
