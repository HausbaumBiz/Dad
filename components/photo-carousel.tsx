"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LazyImage } from "@/components/lazy-image"
import { useMobile } from "@/hooks/use-mobile"

interface PhotoCarouselProps {
  businessId: string
  photos: string[]
  onLoadPhotos: () => void
  className?: string
  showMultiple?: boolean
  photosPerView?: number
  size?: "small" | "medium" // new prop to control size
}

export function PhotoCarousel({
  businessId,
  photos,
  onLoadPhotos,
  className = "",
  showMultiple = false,
  photosPerView = 1,
  size = "small", // default to small size
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasLoadedPhotos, setHasLoadedPhotos] = useState(false)
  const isMobile = useMobile()
  const carouselRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hasLoadedPhotos) {
      onLoadPhotos()
      setHasLoadedPhotos(true)
    }
  }, [onLoadPhotos, hasLoadedPhotos])

  const nextPhoto = () => {
    if (photos.length > photosPerView) {
      setCurrentIndex((prev) => {
        const maxIndex = photos.length - photosPerView
        return prev >= maxIndex ? 0 : prev + 1
      })
    }
  }

  const prevPhoto = () => {
    if (photos.length > photosPerView) {
      setCurrentIndex((prev) => {
        const maxIndex = photos.length - photosPerView
        return prev <= 0 ? maxIndex : prev - 1
      })
    }
  }

  let containerWidthClass = "w-40" // Default width
  let imageHeightClass = "h-30" // Default height
  let imageWidth = 160 // Default width
  let imageHeight = 120 // Default height

  if (size === "medium") {
    containerWidthClass = "w-[220px]"
    imageHeightClass = "h-[220px]"
    imageWidth = 220
    imageHeight = 220
  }

  // Determine photos per view based on screen size
  const currentPhotosPerView = isMobile ? 2 : photosPerView

  if (!photos || photos.length === 0) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${showMultiple ? "h-32" : "h-30"} ${className}`}
      >
        <div className="text-center text-gray-400">
          <Camera className="h-8 w-8 mx-auto mb-2" />
          <p className="text-xs">No Photos</p>
        </div>
      </div>
    )
  }

  if (showMultiple) {
    const visiblePhotos = photos.slice(currentIndex, currentIndex + currentPhotosPerView)
    const canNavigate = photos.length > currentPhotosPerView

    return (
      <div className={`relative ${className}`}>
        <div
          ref={carouselRef}
          className="flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory"
          style={{ scrollSnapType: "x mandatory", overflowScrolling: "touch" }}
        >
          {visiblePhotos.map((photo, index) => (
            <div
              key={currentIndex + index}
              className={`flex-1 min-w-0 ${containerWidthClass} ${imageHeightClass} snap-start`}
            >
              <LazyImage
                src={photo}
                alt={`Business photo ${currentIndex + index + 1}`}
                className="w-full h-full object-cover rounded-lg"
                placeholderSrc="/placeholder.svg"
                width={imageWidth}
                height={imageHeight}
              />
            </div>
          ))}

          {/* Fill remaining slots if we have fewer photos than photosPerView */}
          {visiblePhotos.length < currentPhotosPerView &&
            Array.from({ length: currentPhotosPerView - visiblePhotos.length }).map((_, index) => (
              <div
                key={`empty-${index}`}
                className={`flex-1 min-w-0 ${containerWidthClass} ${imageHeightClass} snap-start`}
              >
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            ))}
        </div>

        {canNavigate && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 p-1 h-8 w-8 z-10"
              onClick={prevPhoto}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 p-1 h-8 w-8 z-10"
              onClick={nextPhoto}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {Math.min(currentIndex + currentPhotosPerView, photos.length)} of {photos.length}
            </div>
          </>
        )}
      </div>
    )
  }

  // Single photo mode (original functionality)
  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      <LazyImage
        src={photos[currentIndex]}
        alt={`Business photo ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        placeholderSrc="/placeholder.svg"
        width={imageWidth}
        height={imageHeight}
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
