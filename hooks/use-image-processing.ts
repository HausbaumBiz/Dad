"use client"

import { useState } from "react"

interface ProcessingOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: "jpeg" | "png" | "webp" | "avif"
}

interface ProcessingResult {
  success: boolean
  data?: string
  contentType?: string
  info?: {
    width: number
    height: number
    size: number
    format: string
  }
  error?: string
}

export function useImageProcessing() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ProcessingResult | null>(null)

  const processImage = async (file: File, options: ProcessingOptions = {}): Promise<ProcessingResult> => {
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    setIsProcessing(true)
    setProgress(10)
    setResult(null)

    try {
      // Create form data
      const formData = new FormData()
      formData.append("file", file)

      if (options.quality) formData.append("quality", options.quality.toString())
      if (options.maxWidth) formData.append("maxWidth", options.maxWidth.toString())
      if (options.maxHeight) formData.append("maxHeight", options.maxHeight.toString())
      if (options.format) formData.append("format", options.format)

      setProgress(30)

      // Send to API
      const response = await fetch("/api/media/process", {
        method: "POST",
        body: formData,
      })

      setProgress(70)

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const data = await response.json()
      setProgress(100)

      if (data.success) {
        // Convert base64 to Blob for further use if needed
        const processedResult = {
          success: true,
          data: data.data,
          contentType: data.contentType,
          info: data.info,
        }

        setResult(processedResult)
        return processedResult
      } else {
        throw new Error(data.error || "Unknown error")
      }
    } catch (error) {
      console.error("Error processing image:", error)
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process image",
      }
      setResult(errorResult)
      return errorResult
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    processImage,
    isProcessing,
    progress,
    result,
  }
}
