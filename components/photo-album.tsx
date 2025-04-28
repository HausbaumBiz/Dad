"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { MediaItem } from "@/app/actions/media-actions"
import { useMediaUpload } from "@/hooks/use-media-upload"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import { LazyImage } from "@/components/lazy-image"

interface PhotoAlbumProps {
  businessId: string
  photos: MediaItem[]
  onUpdate?: (photos: MediaItem[]) => void
}

export function PhotoAlbum({ businessId, photos, onUpdate }: PhotoAlbumProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const { handleDeletePhoto } = useMediaUpload(businessId)

  const handleOpenAlbum = () => {
    if (photos.length > 0) {
      setIsOpen(true)
    }
  }

  const handleNext = () => {
    if (photos.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % photos.length)
    }
  }

  const handlePrev = () => {
    if (photos.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
    }
  }

  const handleDelete = async (photoId: string) => {
    const result = await handleDeletePhoto(photoId)

    if (result && result.success && onUpdate) {
      onUpdate(result.photoAlbum)

      // Adjust current index if needed
      if (currentIndex >= result.photoAlbum.length) {
        setCurrentIndex(Math.max(0, result.photoAlbum.length - 1))
      }
    }
  }

  return (
    <>
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Photo Album</h3>
            <p className="text-sm text-gray-500">{photos.length} photos</p>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map((photo, index) => (
                <div key={photo.id} className="relative group">
                  <div
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => {
                      setCurrentIndex(index)
                      handleOpenAlbum()
                    }}
                  >
                    <LazyImage
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full"
                      placeholderSrc="/placeholder.svg"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No photos in album yet. Upload photos to get started.</p>
            </div>
          )}

          {photos.length > 0 && (
            <Button type="button" variant="outline" className="w-full" onClick={handleOpenAlbum}>
              View Photo Album
            </Button>
          )}
        </div>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo Album</DialogTitle>
          </DialogHeader>

          <div className="relative">
            {photos.length > 0 ? (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <img
                  src={photos[currentIndex]?.url || "/placeholder.svg"}
                  alt={`Photo ${currentIndex + 1}`}
                  className="w-full h-full object-contain"
                />

                <div className="absolute bottom-2 left-0 right-0 text-center text-white text-sm">
                  {currentIndex + 1} of {photos.length}
                </div>

                {photos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No photos in album</p>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-24 overflow-y-auto">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className={`aspect-square rounded-md overflow-hidden cursor-pointer border-2 ${
                  index === currentIndex ? "border-blue-500" : "border-transparent"
                }`}
                onClick={() => setCurrentIndex(index)}
              >
                <LazyImage src={photo.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
