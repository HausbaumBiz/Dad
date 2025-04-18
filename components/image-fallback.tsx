"use client"

import { useState, useEffect } from "react"
import Image, { type ImageProps } from "next/image"
import { getBlurDataUrl } from "@/utils/image-optimization"

interface ImageFallbackProps extends Omit<ImageProps, "src"> {
  src: string
  fallbackSrc: string
  lowQualitySrc?: string
}

export function ImageFallback({ src, fallbackSrc, lowQualitySrc, alt, ...rest }: ImageFallbackProps) {
  const [imgSrc, setImgSrc] = useState<string>(src)
  const [isLoading, setIsLoading] = useState(true)

  // Reset loading state when src changes
  useEffect(() => {
    setImgSrc(src)
    setIsLoading(true)
  }, [src])

  // Generate blur placeholder
  const blurDataURL = getBlurDataUrl()

  return (
    <div className="relative">
      {isLoading && lowQualitySrc && (
        <Image
          {...rest}
          src={lowQualitySrc || "/placeholder.svg"}
          alt={alt}
          className="absolute inset-0 blur-sm"
          style={{ opacity: 0.7 }}
        />
      )}
      <Image
        {...rest}
        src={imgSrc || "/placeholder.svg"}
        alt={alt}
        onError={() => {
          if (imgSrc !== fallbackSrc) {
            setImgSrc(fallbackSrc)
          }
        }}
        onLoad={() => setIsLoading(false)}
        placeholder="blur"
        blurDataURL={blurDataURL}
      />
    </div>
  )
}
