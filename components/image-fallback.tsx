"use client"

import { useState } from "react"
import Image, { type ImageProps } from "next/image"

interface ImageFallbackProps extends ImageProps {
  fallbackSrc: string
}

export function ImageFallback({ src, fallbackSrc, alt, ...rest }: ImageFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src)

  return (
    <Image
      {...rest}
      src={imgSrc || "/placeholder.svg"}
      alt={alt}
      onError={() => {
        setImgSrc(fallbackSrc)
      }}
    />
  )
}
