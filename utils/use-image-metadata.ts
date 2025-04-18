"use client"

import { useEffect, useState } from "react"
import imageMetadata from "./image-metadata.json"

interface ImageMeta {
  src: string
  width: number
  height: number
  format: string
  size: number
}

export function useImageMetadata(src: string): ImageMeta | null {
  const [metadata, setMetadata] = useState<ImageMeta | null>(null)

  useEffect(() => {
    // Normalize the path
    const normalizedSrc = src.startsWith("/") ? src : `/${src}`

    // Get metadata from the JSON
    const meta = (imageMetadata as Record<string, ImageMeta>)[normalizedSrc]

    if (meta) {
      setMetadata(meta)
    } else {
      console.warn(`No metadata found for image: ${src}`)
      setMetadata(null)
    }
  }, [src])

  return metadata
}
