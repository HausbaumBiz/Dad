"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images"

interface CloudflareImageProps {
  imageId: string
  alt: string
  variant?: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export default function CloudflareImage({
  imageId,
  alt,
  variant = "public",
  width,
  height,
  className,
  priority = false,
}: CloudflareImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadImageUrl() {
      try {
        if (!imageId) {
          setError("No image ID provided")
          setLoading(false)
          return
        }

        const url = await getCloudflareImageUrl(imageId, variant)
        setImageUrl(url)
        setLoading(false)
      } catch (err) {
        console.error("Error loading Cloudflare image:", err)
        setError("Failed to load image")
        setLoading(false)
      }
    }

    loadImageUrl()
  }, [imageId, variant])

  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded" style={{ width, height }} />
  }

  if (error || !imageUrl) {
    return (
      <div className="flex items-center justify-center bg-gray-100 text-gray-400 rounded" style={{ width, height }}>
        {error || "Image not available"}
      </div>
    )
  }

  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  )
}
