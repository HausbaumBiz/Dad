"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images"
import { CLOUDFLARE_ACCOUNT_HASH } from "@/lib/cloudflare-constants"

interface CloudflareImageProps {
  imageId: string
  alt: string
  width?: number
  height?: number
  className?: string
  variant?: string
  priority?: boolean
}

export default function CloudflareImage({
  imageId,
  alt,
  width,
  height,
  className,
  variant = "public",
  priority = false,
}: CloudflareImageProps) {
  const [imageUrl, setImageUrl] = useState<string>("")

  useEffect(() => {
    if (!imageId) return

    // Generate URL directly for immediate display
    const directUrl = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/${variant}`
    setImageUrl(directUrl)

    // Also fetch the URL through the server function (for future-proofing)
    const fetchUrl = async () => {
      try {
        const url = await getCloudflareImageUrl(imageId, variant)
        if (url) setImageUrl(url)
      } catch (error) {
        console.error("Error fetching Cloudflare image URL:", error)
      }
    }

    fetchUrl()
  }, [imageId, variant])

  if (!imageUrl) return null

  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      priority={priority}
    />
  )
}
