"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImageIcon, ChevronLeft, ChevronRight, X, Loader2 } from "lucide-react"
import { getBusinessMedia, type MediaItem } from "@/app/actions/media-actions"

interface BusinessPhotoAlbumDialogProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
  businessName: string
}

export function BusinessPhotoAlbumDialog({ isOpen, onClose, businessId, businessName }: BusinessPhotoAlbumDialogProps) {
  const [photos, setPhotos] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"grid" | "slideshow">("grid")

  // Fetch photos when the dialog opens
  useEffect(() => {
    if (isOpen && businessId) {
      fetchBusinessPhotos()
    }
  }, [isOpen, businessId])

  const fetchBusinessPhotos = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const media = await getBusinessMedia(businessId)

      if (media && media.photoAlbum && media.photoAlbum.length > 0) {
        // Sort photos by sortOrder if available, otherwise by creation date
        const sortedPhotos = [...media.photoAlbum].sort((a, b) => {
          if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
            return a.sortOrder - b.sortOrder
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        setPhotos(sortedPhotos)
      } else {
        setPhotos([])
      }
    } catch (err) {
      console.error("Error fetching business photos:", err)
      setError("Failed to load photos. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  const nextPhoto = () => {
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
    }
  }

  const prevPhoto = () => {
    if (photos.length > 0) {
      setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
    }
  }

  // Reset to grid view when dialog opens
  useEffect(() => {
    if (isOpen) {
      setViewMode("grid")
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{businessName} Photo Album</DialogTitle>
            <div className="flex items-center gap-2">
              {viewMode === "slideshow" && (
                <Button variant="outline" size="sm" onClick={() => setViewMode("grid")}>
                  Back to Grid
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading photos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button variant="outline" onClick={fetchBusinessPhotos}>
                Try Again
              </Button>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-2">No photos available</p>
              <p className="text-sm text-gray-400">This business hasn't uploaded any photos yet.</p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="aspect-square bg-gray-100 rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    setCurrentPhotoIndex(index)
                    setViewMode("slideshow")
                  }}
                >
                  <img
                    src={photo.url || "/placeholder.svg"}
                    alt={photo.label || `Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.src = "/abstract-colorful-swirls.png"
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative bg-black h-[70vh]">
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={photos[currentPhotoIndex]?.url || "/placeholder.svg"}
                alt={photos[currentPhotoIndex]?.label || `Photo ${currentPhotoIndex + 1}`}
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  // Fallback if image fails to load
                  e.currentTarget.src = "/abstract-colorful-swirls.png"
                }}
              />
            </div>

            <div className="absolute inset-y-0 left-0 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  prevPhoto()
                }}
                className="rounded-full bg-black/30 text-white hover:bg-black/50 ml-2"
              >
                <ChevronLeft className="h-8 w-8" />
                <span className="sr-only">Previous photo</span>
              </Button>
            </div>

            <div className="absolute inset-y-0 right-0 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  nextPhoto()
                }}
                className="rounded-full bg-black/30 text-white hover:bg-black/50 mr-2"
              >
                <ChevronRight className="h-8 w-8" />
                <span className="sr-only">Next photo</span>
              </Button>
            </div>

            {photos.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full ${index === currentPhotoIndex ? "bg-white" : "bg-white/50"}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setCurrentPhotoIndex(index)
                    }}
                  />
                ))}
              </div>
            )}

            {photos[currentPhotoIndex]?.label && (
              <div className="absolute top-4 left-0 right-0 text-center">
                <div className="inline-block bg-black/50 text-white px-4 py-2 rounded-md text-sm">
                  {photos[currentPhotoIndex].label}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
