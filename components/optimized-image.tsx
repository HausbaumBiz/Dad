"use client"

import { useState, useEffect, useRef } from "react"
import Image, { type ImageProps } from "next/image"
import { getResponsiveImageUrl, getBlurDataUrl, getLoadingStrategy, IMAGE_QUALITY } from "@/utils/image-optimization"

interface OptimizedImageProps extends Omit<ImageProps, "src"> {
  src: string
  fallbackSrc?: string
  quality?: number
  priority?: boolean
}

export function OptimizedImage({
  src,
  fallbackSrc = "/placeholder.svg",
  alt,
  width,
  height,
  quality = IMAGE_QUALITY.HIGH,
  priority = false,
  className,
  style,
  ...rest
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInViewport, setIsInViewport] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Handle image errors
  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
    }
  }

  // Check if image is in viewport for loading strategy
  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) {
          setIsInViewport(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Get optimized image URL
  const optimizedSrc = getResponsiveImageUrl(
    imgSrc,
    typeof width === "number" ? width : 800,
    typeof height === "number" ? height : undefined,
  )

  // Get loading strategy
  const loading = getLoadingStrategy(priority, isInViewport)

  // Generate blur placeholder
  const blurDataURL = getBlurDataUrl()

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className || ""}`}
      style={{
        ...style,
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    >
      <Image
        src={optimizedSrc || "/placeholder.svg"}
        alt={alt}
        width={typeof width === "number" ? width : undefined}
        height={typeof height === "number" ? height : undefined}
        quality={quality}
        loading={loading}
        onError={handleError}
        onLoad={() => setIsLoaded(true)}
        placeholder="blur"
        blurDataURL={blurDataURL}
        className={`transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        {...rest}
      />
    </div>
  )
}
