"use client"

import { useState, useRef, useEffect } from "react"
import { getBlurDataUrl } from "@/utils/image-optimization"

interface ResponsivePictureProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  sizes?: string
  loading?: "lazy" | "eager"
}

export function ResponsivePicture({
  src,
  alt,
  className = "",
  width,
  height,
  sizes = "100vw",
  loading = "lazy",
}: ResponsivePictureProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Extract filename without extension
  const basePath = src.substring(0, src.lastIndexOf(".")) || src
  const ext = src.split(".").pop() || "jpg"

  // Generate paths for optimized images
  const webpSm = `/optimized${basePath}-sm.webp`
  const webpMd = `/optimized${basePath}-md.webp`
  const webpLg = `/optimized${basePath}-lg.webp`
  const avifSm = `/optimized${basePath}-sm.avif`
  const avifMd = `/optimized${basePath}-md.avif`
  const avifLg = `/optimized${basePath}-lg.avif`
  const placeholder = `/optimized${basePath}-placeholder.webp`

  // Handle image load
  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true)
    }
  }, [])

  // Generate blur placeholder
  const blurDataURL = getBlurDataUrl()

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
        backgroundColor: "#f3f4f6", // Light gray background while loading
      }}
    >
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center blur-sm"
          style={{
            backgroundImage: `url(${placeholder}), url(${blurDataURL})`,
            opacity: 0.7,
          }}
        />
      )}

      <picture>
        {/* AVIF format - best compression, newer browsers */}
        <source type="image/avif" srcSet={`${avifSm} 640w, ${avifMd} 1024w, ${avifLg} 1920w`} sizes={sizes} />

        {/* WebP format - good compression, wide support */}
        <source type="image/webp" srcSet={`${webpSm} 640w, ${webpMd} 1024w, ${webpLg} 1920w`} sizes={sizes} />

        {/* Original format as fallback */}
        <img
          ref={imgRef}
          src={src || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
      </picture>
    </div>
  )
}
