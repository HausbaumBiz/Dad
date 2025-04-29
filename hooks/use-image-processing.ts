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
  warning?: string
}

export function useImageProcessing() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ProcessingResult | null>(null)

  // Helper function to create a data URL from a file
  const createDataUrl = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }

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

      // Send to API with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      try {
        const response = await fetch("/api/media/process", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        setProgress(70)

        if (!response.ok) {
          console.error(`Server responded with ${response.status}: ${response.statusText}`)
          throw new Error(`Server responded with ${response.status}`)
        }

        const data = await response.json()
        setProgress(100)

        if (data.success) {
          // Process successful
          const processedResult = {
            success: true,
            data: data.data,
            contentType: data.contentType,
            info: data.info,
            warning: data.warning,
          }

          setResult(processedResult)
          return processedResult
        } else {
          throw new Error(data.error || "Unknown error")
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError)

        // If server processing fails, use client-side fallback
        console.log("Using client-side fallback for image processing")

        // Create a data URL from the file as fallback
        const dataUrl = await createDataUrl(file)

        // Extract the base64 part (remove the data:image/xxx;base64, prefix)
        const base64 = dataUrl.split(",")[1]

        const fallbackResult = {
          success: true,
          data: base64,
          contentType: file.type,
          info: {
            width: 0, // Unknown dimensions
            height: 0,
            size: file.size,
            format: file.type.split("/")[1] || "unknown",
          },
          warning: "Server processing failed, using original image",
        }

        setResult(fallbackResult)
        return fallbackResult
      }
    } catch (error) {
      console.error("Error in image processing hook:", error)
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
