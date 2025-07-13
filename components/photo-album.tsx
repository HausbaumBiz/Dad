"use client"

import type React from "react"
import { useState, useCallback } from "react"
import Image from "next/image"
import LightBox from "yet-another-react-lightbox"
import "yet-another-react-lightbox/styles.css"

interface Photo {
  url: string
  filename?: string
  tags?: string[]
}

interface PhotoAlbumProps {
  photos: Photo[]
}

const PhotoAlbum: React.FC<PhotoAlbumProps> = ({ photos }) => {
  const [open, setOpen] = useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index)
    setOpen(true)
  }

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const selectedPhoto = photos[selectedPhotoIndex]

  return (
    <div className="relative">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            onClick={() => handlePhotoClick(index)}
            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group cursor-pointer"
          >
            <Image
              src={photo.url || "/placeholder.svg"}
              alt={photo.filename || `Photo ${index + 1}`}
              fill
              className={`object-contain transition-transform duration-200 group-hover:scale-105 ${
                // Make Expert and Dependability awards smaller in grid view
                photo.tags?.includes("expert") || photo.tags?.includes("dependability") ? "scale-75" : ""
              }`}
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              onError={(e) => {
                console.error("Image failed to load:", photo.url)
                e.currentTarget.src = "/placeholder.svg?height=300&width=300"
              }}
            />
          </div>
        ))}
      </div>

      <LightBox
        open={open}
        close={handleClose}
        slides={photos.map((photo) => ({ src: photo.url }))}
        index={selectedPhotoIndex}
        render={{
          button: ({ type, disabled, onClick }) => {
            let ariaLabel = ""
            let icon = null

            switch (type) {
              case "close":
                ariaLabel = "Close"
                icon = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )
                break
              case "prev":
                ariaLabel = "Previous"
                icon = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                )
                break
              case "next":
                ariaLabel = "Next"
                icon = (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )
                break
              default:
                return null
            }

            return (
              <button className="yarl__button" aria-label={ariaLabel} disabled={disabled || false} onClick={onClick}>
                {icon}
              </button>
            )
          },
          slide: ({ slide }) => (
            <div className="relative w-full h-full flex items-center justify-center bg-gray-50">
              <Image
                src={selectedPhoto.url || "/placeholder.svg"}
                alt={selectedPhoto.filename || "Selected photo"}
                width={800}
                height={600}
                className={`max-w-full max-h-full object-contain ${
                  // Make Expert and Dependability awards smaller in main view
                  selectedPhoto.tags?.includes("expert") || selectedPhoto.tags?.includes("dependability")
                    ? "scale-75"
                    : ""
                }`}
                onError={(e) => {
                  console.error("Image failed to load:", selectedPhoto.url)
                  e.currentTarget.src = "/placeholder.svg?height=600&width=800"
                }}
              />
            </div>
          ),
          thumbnails: () => (
            <div className="absolute left-0 right-0 bottom-0 h-20 bg-black/50 flex items-center justify-center gap-2">
              {photos.map((photo, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-16 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedPhotoIndex(idx)}
                >
                  <Image
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.filename || `Photo ${idx + 1}`}
                    fill
                    className={`object-contain transition-all duration-200 ${
                      selectedPhotoIndex === idx ? "ring-2 ring-blue-500" : ""
                    } ${
                      // Make Expert and Dependability awards smaller in thumbnails
                      photo.tags?.includes("expert") || photo.tags?.includes("dependability") ? "scale-75" : ""
                    }`}
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          ),
        }}
      />
    </div>
  )
}

export default PhotoAlbum
