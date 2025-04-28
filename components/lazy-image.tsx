"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholderSrc?: string
  blurDataURL?: string
  aspectRatio?: string
  fallbackSrc?: string
}

export function LazyImage({
  src,
  alt,
  className,
  placeholderSrc,
  blurDataURL,
  aspectRatio = "aspect-square",
  fallbackSrc = "/placeholder.svg",
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Set up intersection observer to detect when image is in viewport
  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before it comes into view
        threshold: 0.01,
      },
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Set image source when in view
  useEffect(() => {
    if (isInView && src) {
      setImgSrc(src)
    }
  }, [isInView, src])

  // Handle image load and error
  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setError(true)
    if (fallbackSrc) {
      setImgSrc(fallbackSrc)
    }
  }

  return (
    <div className={cn("relative overflow-hidden bg-gray-100 rounded-md", aspectRatio, className)}>
      {/* Placeholder or blur-up image */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          {blurDataURL ? (
            <img
              src={blurDataURL || "/placeholder.svg"}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-110 transition-opacity opacity-60"
              aria-hidden="true"
            />
          ) : placeholderSrc ? (
            <img
              src={placeholderSrc || "/placeholder.svg"}
              alt=""
              className="w-full h-full object-cover transition-opacity opacity-60"
              aria-hidden="true"
            />
          ) : (
            <Skeleton className="w-full h-full" />
          )}
        </div>
      )}

      {/* Actual image */}
      <img
        ref={imgRef}
        src={imgSrc || "/placeholder.svg"}
        alt={alt || ""}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        {...props}
      />
    </div>
  )
}
