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
  size?: "small" | "medium"
}

export function PhotoCarousel({
  businessId,
  photos,
  onLoadPhotos,
  className = "",
  showMultiple = false,
  photosPerView = 1,
  size = "small",
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

  let containerWidthClass = "w-40"
  let imageHeightClass = "h-30"
  let imageWidth = 160
  let imageHeight = 120

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
    const canNavigate = photos.length > currentPhotosPerView

    if (isMobile) {
      // Mobile: Horizontal scrolling with native behavior
      return (
        <div className={`relative ${className}`}>
          <div
            ref={carouselRef}
            className="flex gap-2 overflow-x-scroll"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              touchAction: "pan-x",
              overscrollBehaviorX: "contain",
            }}
            onTouchStart={(e) => {
              // Prevent parent scroll interference
              e.stopPropagation()
            }}
            onTouchMove={(e) => {
              // Prevent parent scroll interference
              e.stopPropagation()
            }}
          >
            {photos.map((photo, index) => (
              <div
                key={index}
                className="flex-shrink-0"
                style={{
                  width: "130px",
                  height: "100px",
                }}
              >
                <LazyImage
                  src={photo}
                  alt={`Business photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                  placeholderSrc="/placeholder.svg"
                  width={130}
                  height={100}
                />
              </div>
            ))}
          </div>

          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {photos.length} photos
          </div>
        </div>
      )
    }

    // Desktop: Original pagination behavior (unchanged)
    return (
      <div className={`relative ${className}`}>
        <div className="flex gap-2 overflow-hidden">
          {photos.slice(currentIndex, currentIndex + currentPhotosPerView).map((photo, index) => (
            <div key={currentIndex + index} className={`flex-1 min-w-0 ${containerWidthClass} ${imageHeightClass}`}>
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

          {photos.slice(currentIndex, currentIndex + currentPhotosPerView).length < currentPhotosPerView &&
            Array.from({
              length: currentPhotosPerView - photos.slice(currentIndex, currentIndex + currentPhotosPerView).length,
            }).map((_, index) => (
              <div key={`empty-${index}`} className={`flex-1 min-w-0 ${containerWidthClass} ${imageHeightClass}`}>
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
          </>
        )}

        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {Math.min(currentIndex + currentPhotosPerView, photos.length)} of {photos.length}
        </div>
      </div>
    )
  }

  // Single photo mode (original functionality - unchanged)
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
