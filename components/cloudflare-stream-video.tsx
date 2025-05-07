"use client"

import { useEffect, useRef } from "react"

type CloudflareStreamVideoProps = {
  videoId: string
  aspectRatio?: "16:9" | "9:16"
  thumbnailTimestamp?: number
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
}

export function CloudflareStreamVideo({
  videoId,
  aspectRatio = "16:9",
  thumbnailTimestamp = 0,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
}: CloudflareStreamVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Get Cloudflare account ID from environment variable
    const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID || ""

    if (!accountId) {
      console.error("Cloudflare account ID is not set in environment variables")
      return
    }

    // Create HLS source URL
    const hlsUrl = `https://customer-${accountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8`

    // Create thumbnail URL
    const thumbnailUrl = `https://customer-${accountId}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=${thumbnailTimestamp}s`

    // Set up video element
    if (videoRef.current) {
      // Set poster (thumbnail)
      videoRef.current.poster = thumbnailUrl

      // Set source if not already set
      if (!videoRef.current.querySelector("source")) {
        const source = document.createElement("source")
        source.src = hlsUrl
        source.type = "application/x-mpegURL"
        videoRef.current.appendChild(source)
      }

      // Set attributes
      if (autoplay) videoRef.current.autoplay = true
      if (muted) videoRef.current.muted = true
      if (loop) videoRef.current.loop = true
    }
  }, [videoId, thumbnailTimestamp, autoplay, muted, loop])

  return <video ref={videoRef} className="w-full h-full" controls={controls} playsInline />
}
