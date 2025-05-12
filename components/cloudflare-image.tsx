"use client"

import { useState } from "react"
import Image from "next/image"
import { isCloudflareImageUrl, fixCloudflareImageUrl } from "@/lib/cloudflare-images-utils"

interface CloudflareImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  onError?: () => void
}

export default function CloudflareImage({
  src,
  alt,
  width = 500,
  height = 300,
  className = "",
  priority = false,
  onError,
}: CloudflareImageProps) {
  const [error, setError] = useState(false)
  const [imgSrc, setImgSrc] = useState(() => {
    // If it's a Cloudflare image URL, make sure it uses the correct account hash
    if (isCloudflareImageUrl(src)) {
      return fixCloudflareImageUrl(src)
    }
    return src
  })

  const handleError = () => {
    console.error(`Failed to load image: ${imgSrc}`)
    setError(true)
    if (onError) onError()
  }

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-500 ${className}`}
        style={{ width: width || "100%", height: height || 300 }}
      >
        <div className="text-center p-4">
          <p className="text-sm">Image not available</p>
          <p className="text-xs mt-2 text-gray-400 break-all">{imgSrc}</p>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={imgSrc || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={handleError}
    />
  )
}
