"use client"

import { useState, useEffect } from "react"
import { MediaUploader } from "@/components/media-uploader"
import { PhotoAlbum } from "@/components/photo-album"
import { getBusinessMedia, type MediaItem, type BusinessMedia } from "@/app/actions/media-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LazyVideo } from "@/components/lazy-video"
import { LazyImage } from "@/components/lazy-image"

interface MediaManagerProps {
  businessId: string
  designId?: string
}

export function MediaManager({ businessId, designId }: MediaManagerProps) {
  const [media, setMedia] = useState<BusinessMedia | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch media on component mount
  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true)
      try {
        const mediaData = await getBusinessMedia(businessId)
        setMedia(mediaData)
      } catch (error) {
        console.error("Error fetching media:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMedia()
  }, [businessId])

  // Handle video upload completion
  const handleVideoUploadComplete = (result: any) => {
    if (result && result.success) {
      setMedia((prev) => {
        if (!prev) return { photoAlbum: [], videoUrl: result.url, videoId: result.id }
        return { ...prev, videoUrl: result.url, videoId: result.id }
      })
    }
  }

  // Handle thumbnail upload completion
  const handleThumbnailUploadComplete = (result: any) => {
    if (result && result.success) {
      setMedia((prev) => {
        if (!prev) return { photoAlbum: [], thumbnailUrl: result.url, thumbnailId: result.id }
        return { ...prev, thumbnailUrl: result.url, thumbnailId: result.id }
      })
    }
  }

  // Handle photo upload completion
  const handlePhotoUploadComplete = (result: any) => {
    if (result && result.success && result.photoAlbum) {
      setMedia((prev) => {
        if (!prev) return { photoAlbum: result.photoAlbum }
        return { ...prev, photoAlbum: result.photoAlbum }
      })
    }
  }

  // Handle photo album update
  const handlePhotoAlbumUpdate = (photos: MediaItem[]) => {
    setMedia((prev) => {
      if (!prev) return { photoAlbum: photos }
      return { ...prev, photoAlbum: photos }
    })
  }

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
        <p className="mt-2 text-gray-600">Loading media...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="video">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="thumbnail">Thumbnail</TabsTrigger>
          <TabsTrigger value="photos">Photo Album</TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="mt-4">
          <MediaUploader
            businessId={businessId}
            type="video"
            accept=".mp4,.mov,.m4v,.3gp"
            maxSizeMB={50}
            title="Upload Video"
            description="Upload a video to display in your AdBox"
            onUploadComplete={handleVideoUploadComplete}
            designId={designId}
          />

          {media?.videoUrl && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Current Video</h4>
              <LazyVideo
                src={media.videoUrl}
                thumbnailSrc={media.thumbnailUrl}
                className="w-full"
                showControls={true}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="thumbnail" className="mt-4">
          <MediaUploader
            businessId={businessId}
            type="thumbnail"
            accept=".jpg,.jpeg,.png,.webp"
            maxSizeMB={5}
            title="Upload Thumbnail"
            description="Upload a thumbnail image to display before your video plays"
            onUploadComplete={handleThumbnailUploadComplete}
          />

          {media?.thumbnailUrl && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Current Thumbnail</h4>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <LazyImage
                  src={media.thumbnailUrl}
                  alt="Video thumbnail"
                  className="w-full h-full object-contain"
                  aspectRatio="aspect-video"
                />
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="photos" className="mt-4">
          <div className="space-y-6">
            <MediaUploader
              businessId={businessId}
              type="photo"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              maxSizeMB={5}
              title="Upload Photo"
              description="Upload photos to your album"
              onUploadComplete={handlePhotoUploadComplete}
            />

            <PhotoAlbum businessId={businessId} photos={media?.photoAlbum || []} onUpdate={handlePhotoAlbumUpdate} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
