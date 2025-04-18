"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { getBlurDataUrl } from "@/utils/image-optimization"

interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  threshold?: number
}

export function LazyImage({ src, alt, width, height, className = "", threshold = 0.1 }: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [threshold])

  // Generate blur placeholder
  const blurDataURL = getBlurDataUrl()

  return (
    <div
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "auto",
      }}
    >
      {isVisible ? (
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          onLoad={() => setIsLoaded(true)}
          placeholder="blur"
          blurDataURL={blurDataURL}
          className={`transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        <div
          className="w-full h-full bg-gray-200 animate-pulse"
          style={{
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: "cover",
          }}
        />
      )}
    </div>
  )
}
