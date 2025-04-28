"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface LQIPGeneratorProps {
  imageSrc: string
  onGenerated?: (lqipDataUrl: string) => void
}

export function LQIPGenerator({ imageSrc, onGenerated }: LQIPGeneratorProps) {
  const [lqipDataUrl, setLqipDataUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateLQIP = async () => {
    if (!imageSrc) return

    setIsGenerating(true)
    setError(null)

    try {
      // Create a tiny version of the image using canvas
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        // Create a small canvas (e.g., 20px wide)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          setError("Canvas context not available")
          setIsGenerating(false)
          return
        }

        // Calculate dimensions (maintain aspect ratio)
        const aspectRatio = img.width / img.height
        const width = 20
        const height = Math.round(width / aspectRatio)

        canvas.width = width
        canvas.height = height

        // Draw the image at a small size
        ctx.drawImage(img, 0, 0, width, height)

        // Get the data URL (low quality)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.1)
        setLqipDataUrl(dataUrl)

        if (onGenerated) {
          onGenerated(dataUrl)
        }

        setIsGenerating(false)
      }

      img.onerror = () => {
        setError("Failed to load image")
        setIsGenerating(false)
      }

      img.src = imageSrc
    } catch (err) {
      setError("Error generating LQIP")
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    if (imageSrc) {
      generateLQIP()
    }
  }, [imageSrc])

  return (
    <div className="space-y-2">
      {isGenerating ? (
        <Skeleton className="w-full h-20" />
      ) : lqipDataUrl ? (
        <div className="space-y-2">
          <div className="aspect-video bg-gray-100 rounded overflow-hidden">
            <img
              src={lqipDataUrl || "/placeholder.svg"}
              alt="Low quality placeholder"
              className="w-full h-full object-cover"
            />
          </div>
          <p className="text-xs text-gray-500">LQIP generated successfully</p>
        </div>
      ) : error ? (
        <div className="p-2 bg-red-50 text-red-600 rounded text-sm">
          {error}
          <Button variant="link" size="sm" onClick={generateLQIP} className="ml-2">
            Retry
          </Button>
        </div>
      ) : null}
    </div>
  )
}
