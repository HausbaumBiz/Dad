"use client"

import { useState, useCallback } from "react"

interface ChunkedUploadOptions {
  chunkSize?: number
  onProgress?: (progress: number) => void
  onChunkComplete?: (chunkIndex: number, totalChunks: number) => void
  onError?: (error: Error) => void
  onComplete?: (response: any) => void
}

interface ChunkedUploadState {
  isUploading: boolean
  progress: number
  error: Error | null
  uploadedChunks: number
  totalChunks: number
}

export function useChunkedUpload(options: ChunkedUploadOptions = {}) {
  const {
    chunkSize = 5 * 1024 * 1024, // 5MB chunks by default
    onProgress,
    onChunkComplete,
    onError,
    onComplete,
  } = options

  const [state, setState] = useState<ChunkedUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedChunks: 0,
    totalChunks: 0,
  })

  const uploadFile = useCallback(
    async (file: File, businessId: string, aspectRatio = "16:9") => {
      if (!file) return

      // Generate a unique file ID
      const fileId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`

      // Calculate total chunks
      const totalChunks = Math.ceil(file.size / chunkSize)

      setState({
        isUploading: true,
        progress: 0,
        error: null,
        uploadedChunks: 0,
        totalChunks,
      })

      try {
        console.log(`Starting chunked upload of ${file.name} (${file.size} bytes) in ${totalChunks} chunks`)

        // Track the last successful chunk
        let lastSuccessfulChunk = -1
        let isComplete = false

        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          // Prepare the chunk
          const start = chunkIndex * chunkSize
          const end = Math.min(start + chunkSize, file.size)
          const chunk = file.slice(start, end)

          console.log(`Uploading chunk ${chunkIndex + 1}/${totalChunks} (${start}-${end}, ${chunk.size} bytes)`)

          // Create form data for this chunk
          const formData = new FormData()
          formData.append("businessId", businessId)
          formData.append("chunkIndex", chunkIndex.toString())
          formData.append("totalChunks", totalChunks.toString())
          formData.append("fileId", fileId)
          formData.append("fileName", file.name)
          formData.append("fileType", file.type)
          formData.append("chunk", chunk)
          formData.append("aspectRatio", aspectRatio)
          formData.append("isLastChunk", (chunkIndex === totalChunks - 1).toString())

          // Upload the chunk
          const response = await fetch("/api/media/chunked-upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error(`Chunk ${chunkIndex + 1} upload failed with status ${response.status}: ${errorText}`)
            throw new Error(`Chunk upload failed: ${errorText}`)
          }

          const result = await response.json()
          console.log(`Chunk ${chunkIndex + 1} upload result:`, result)

          if (!result.success) {
            console.error(`Chunk ${chunkIndex + 1} upload failed:`, result.error)
            throw new Error(result.error || "Chunk upload failed")
          }

          // Update progress
          const newProgress = ((chunkIndex + 1) / totalChunks) * 100
          setState((prev) => ({
            ...prev,
            progress: newProgress,
            uploadedChunks: chunkIndex + 1,
          }))

          if (onProgress) {
            onProgress(newProgress)
          }

          if (onChunkComplete) {
            onChunkComplete(chunkIndex, totalChunks)
          }

          lastSuccessfulChunk = chunkIndex

          // If this is the last chunk and the server indicates completion
          if (result.isComplete) {
            console.log("Server indicated upload is complete")
            isComplete = true

            setState((prev) => ({
              ...prev,
              isUploading: false,
              progress: 100,
            }))

            if (onComplete) {
              onComplete(result)
            }

            return result
          }
        }

        // If we've uploaded all chunks but the server didn't indicate completion
        if (lastSuccessfulChunk === totalChunks - 1 && !isComplete) {
          console.log("All chunks uploaded, finalizing video directly")

          // Instead of checking status, let's finalize the video directly
          const finalizeFormData = new FormData()
          finalizeFormData.append("businessId", businessId)
          finalizeFormData.append("fileId", fileId)
          finalizeFormData.append("fileName", file.name)
          finalizeFormData.append("fileType", file.type)
          finalizeFormData.append("totalChunks", totalChunks.toString())
          finalizeFormData.append("aspectRatio", aspectRatio)
          finalizeFormData.append("action", "finalize")

          const finalizeResponse = await fetch("/api/media/chunked-upload", {
            method: "POST",
            body: finalizeFormData,
          })

          if (!finalizeResponse.ok) {
            const errorText = await finalizeResponse.text()
            console.error(`Finalization failed with status ${finalizeResponse.status}: ${errorText}`)
            throw new Error(`Finalization failed: ${errorText}`)
          }

          const finalizeResult = await finalizeResponse.json()
          console.log("Finalization result:", finalizeResult)

          if (finalizeResult.success) {
            console.log("Video finalized successfully")

            setState((prev) => ({
              ...prev,
              isUploading: false,
              progress: 100,
            }))

            if (onComplete) {
              onComplete(finalizeResult)
            }

            return finalizeResult
          } else {
            console.error("Video finalization failed:", finalizeResult.error)
            throw new Error(`Video finalization failed: ${finalizeResult.error || "Unknown error"}`)
          }
        }

        // If we get here, something went wrong
        console.error(`Upload incomplete: Last successful chunk was ${lastSuccessfulChunk + 1}/${totalChunks}`)
        throw new Error(`Upload incomplete: Only ${lastSuccessfulChunk + 1} of ${totalChunks} chunks were processed`)
      } catch (error) {
        console.error("Error in chunked upload:", error)

        const errorObj = error instanceof Error ? error : new Error("Unknown upload error")

        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: errorObj,
        }))

        if (onError) {
          onError(errorObj)
        }

        throw errorObj
      }
    },
    [chunkSize, onProgress, onChunkComplete, onError, onComplete],
  )

  const cancelUpload = useCallback(() => {
    // In a real implementation, you would call an API to cancel the upload
    // For now, we'll just update the state
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedChunks: 0,
      totalChunks: 0,
    })
  }, [])

  return {
    uploadFile,
    cancelUpload,
    ...state,
  }
}
