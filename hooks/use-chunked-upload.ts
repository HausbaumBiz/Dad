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
        for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
          // Prepare the chunk
          const start = chunkIndex * chunkSize
          const end = Math.min(start + chunkSize, file.size)
          const chunk = file.slice(start, end)

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

          // Upload the chunk
          const response = await fetch("/api/media/chunked-upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Chunk upload failed: ${errorText}`)
          }

          const result = await response.json()

          if (!result.success) {
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

          // If this is the last chunk and the server indicates completion
          if (result.isComplete) {
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

        // Check if the upload is complete
        const statusResponse = await fetch(`/api/media/chunked-upload?businessId=${businessId}&fileId=${fileId}`)
        const statusResult = await statusResponse.json()

        if (statusResult.success && statusResult.isComplete) {
          setState((prev) => ({
            ...prev,
            isUploading: false,
            progress: 100,
          }))

          if (onComplete) {
            onComplete(statusResult)
          }

          return statusResult
        } else {
          throw new Error("Upload did not complete successfully")
        }
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
