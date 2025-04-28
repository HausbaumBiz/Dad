"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Play, Pause } from "lucide-react"

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  thumbnailSrc?: string
  aspectRatio?: string
  showControls?: boolean
  autoPlayWhenVisible?: boolean
}

export function LazyVideo({
  src,
  thumbnailSrc,
  className,
  aspectRatio = "aspect-video",
  showControls = true,
  autoPlayWhenVisible = false,
  ...props
}: LazyVideoProps) {
  const [isInView, setIsInView] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Set up intersection observer to detect when video is in viewport
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true)
          if (autoPlayWhenVisible && videoRef.current) {
            handlePlay()
          }
        } else {
          // Pause video when out of view to save resources
          if (isPlaying && videoRef.current) {
            videoRef.current.pause()
            setIsPlaying(false)
          }
        }
      },
      {
        rootMargin: "100px",
        threshold: 0.1,
      },
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [autoPlayWhenVisible, isPlaying])

  // Handle video events
  const handleLoadedData = () => {
    setIsLoaded(true)
  }

  const handlePlay = () => {
    if (!videoRef.current) return

    setShowThumbnail(false)

    const playPromise = videoRef.current.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true)
        })
        .catch((error) => {
          console.error("Error playing video:", error)
          setIsPlaying(false)
          setShowThumbnail(true)
        })
    }
  }

  const handlePause = () => {
    if (!videoRef.current) return

    videoRef.current.pause()
    setIsPlaying(false)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setShowThumbnail(true)
  }

  // Custom video controls
  const VideoControls = () => (
    <div className="flex justify-center mt-2 space-x-4">
      <button
        onClick={handlePlay}
        className={`p-2 rounded-full bg-blue-600 ${isPlaying ? "opacity-50" : "opacity-100"}`}
        disabled={isPlaying}
        aria-label="Play video"
      >
        <Play size={20} className="text-white" />
      </button>
      <button
        onClick={handlePause}
        className={`p-2 rounded-full bg-blue-600 ${!isPlaying ? "opacity-50" : "opacity-100"}`}
        disabled={!isPlaying}
        aria-label="Pause video"
      >
        <Pause size={20} className="text-white" />
      </button>
    </div>
  )

  return (
    <div className="space-y-2">
      <div ref={containerRef} className={cn("relative overflow-hidden bg-gray-100 rounded-md", aspectRatio, className)}>
        {/* Loading skeleton */}
        {!isLoaded && !showThumbnail && <Skeleton className="absolute inset-0 w-full h-full" />}

        {/* Thumbnail */}
        {thumbnailSrc && showThumbnail && (
          <div className="absolute inset-0 z-10">
            <img
              src={thumbnailSrc || "/placeholder.svg"}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={handlePlay}
                className="p-3 rounded-full bg-blue-600 bg-opacity-80 hover:bg-opacity-100 transition-all transform hover:scale-105"
                aria-label="Play video"
              >
                <Play size={24} className="text-white" />
              </button>
            </div>
          </div>
        )}

        {/* Video element - only load src when in view */}
        <video
          ref={videoRef}
          src={isInView ? src : undefined}
          className="w-full h-full object-cover"
          controls={showControls && !showThumbnail}
          onLoadedData={handleLoadedData}
          onEnded={handleEnded}
          playsInline
          {...props}
        />

        {/* Play overlay for videos without thumbnails */}
        {!thumbnailSrc && !isPlaying && !showControls && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button
              onClick={handlePlay}
              className="p-3 rounded-full bg-blue-600 bg-opacity-80 hover:bg-opacity-100 transition-all transform hover:scale-105"
              aria-label="Play video"
            >
              <Play size={24} className="text-white" />
            </button>
          </div>
        )}
      </div>

      {/* Custom controls if needed */}
      {!showControls && isInView && <VideoControls />}
    </div>
  )
}
