"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LazyImage } from "@/components/lazy-image"

interface PhotoCarouselProps {
  businessId: string
  photos: string[]
  onLoadPhotos: () => void
  className?: string
}

export function PhotoCarousel({ businessId, photos, onLoadPhotos, className = "" }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasLoadedPhotos, setHasLoadedPhotos] = useState(false)

  useEffect(() => {
    if (!hasLoadedPhotos) {
      onLoadPhotos()
      setHasLoadedPhotos(true)
    }
  }, [onLoadPhotos, hasLoadedPhotos])

  const nextPhoto = () => {
    if (photos.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % photos.length)
    }
  }

  const prevPhoto = () => {
    if (photos.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
    }
  }

  if (!photos || photos.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <Camera className="h-8 w-8 mx-auto mb-2" />
          <p className="text-xs">No Photos</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <LazyImage
        src={photos[currentIndex]}
        alt={`Business photo ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        placeholderSrc="/placeholder.svg"
      />

      {photos.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 p-1 h-6 w-6"
            onClick={prevPhoto}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 p-1 h-6 w-6"
            onClick={nextPhoto}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>

          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {currentIndex + 1}/{photos.length}
          </div>
        </>
      )}
    </div>
  )
}
