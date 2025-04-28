"use client"

import { useState } from "react"
import { uploadVideo, uploadThumbnail, uploadPhoto, deletePhoto } from "@/app/actions/media-actions"
import {
  createMediaFormData,
  isValidImage,
  isValidVideo,
  isWithinSizeLimit,
  compressImage,
  calculateCompressionSavings,
  getRecommendedQuality,
  getRecommendedMaxDimension,
} from "@/lib/media-utils"
import { toast } from "@/components/ui/use-toast"

type UploadState = {
  isUploading: boolean
  progress: number
  error: string | null
  originalSize?: number
  compressedSize?: number
  compressionSavings?: number
}

export type CompressionSettings = {
  enabled: boolean
  quality: number
  maxDimension: number
  format: "jpeg" | "png" | "webp" | "avif"
  autoOptimize: boolean
}

const defaultCompressionSettings: CompressionSettings = {
  enabled: true,
  quality: 80,
  maxDimension: 1920,
  format: "webp",
  autoOptimize: true,
}

export function useMediaUpload(businessId: string) {
  const [videoUploadState, setVideoUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  })

  const [thumbnailUploadState, setThumbnailUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  })

  const [photoUploadState, setPhotoUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  })

  const [compressionSettings, setCompressionSettings] = useState<CompressionSettings>(defaultCompressionSettings)

  /**
   * Upload a video file
   */
  const handleVideoUpload = async (file: File, designId?: string) => {
    // Validate the file
    if (!isValidVideo(file)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid video file (MP4, MOV, M4V, 3GP).",
        variant: "destructive",
      })
      return null
    }

    if (!isWithinSizeLimit(file, 50)) {
      // 50MB limit
      toast({
        title: "File too large",
        description: "Video files must be under 50MB.",
        variant: "destructive",
      })
      return null
    }

    // Start upload
    setVideoUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      originalSize: file.size,
    })

    try {
      // Create form data
      const formData = createMediaFormData(file, businessId, "video", designId)

      // Simulate progress (since we don't have real progress events)
      const progressInterval = setInterval(() => {
        setVideoUploadState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }))
      }, 500)

      // Upload the file
      const result = await uploadVideo(formData)

      // Clear the progress interval
      clearInterval(progressInterval)

      if (result.success) {
        setVideoUploadState({
          isUploading: false,
          progress: 100,
          error: null,
          originalSize: file.size,
          compressedSize: result.size,
        })

        toast({
          title: "Video uploaded",
          description: "Your video has been uploaded successfully.",
        })

        return result
      } else {
        setVideoUploadState({
          isUploading: false,
          progress: 0,
          error: result.error || "Failed to upload video",
        })

        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload video. Please try again.",
          variant: "destructive",
        })

        return null
      }
    } catch (error) {
      setVideoUploadState({
        isUploading: false,
        progress: 0,
        error: "An unexpected error occurred",
      })

      toast({
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })

      return null
    }
  }

  /**
   * Upload a thumbnail image with compression
   */
  const handleThumbnailUpload = async (file: File) => {
    // Validate the file
    if (!isValidImage(file)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file (JPG, PNG, GIF, WebP).",
        variant: "destructive",
      })
      return null
    }

    if (!isWithinSizeLimit(file, 5)) {
      // 5MB limit
      toast({
        title: "File too large",
        description: "Image files must be under 5MB.",
        variant: "destructive",
      })
      return null
    }

    // Start upload
    setThumbnailUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      originalSize: file.size,
    })

    try {
      let fileToUpload = file
      let compressionApplied = false

      // Apply client-side compression if enabled
      if (compressionSettings.enabled) {
        // Determine quality and dimensions
        const quality = compressionSettings.autoOptimize
          ? getRecommendedQuality(file.size)
          : compressionSettings.quality / 100

        const maxDimension = compressionSettings.autoOptimize
          ? getRecommendedMaxDimension("thumbnail")
          : compressionSettings.maxDimension

        // Compress the image
        setThumbnailUploadState((prev) => ({
          ...prev,
          progress: 10,
        }))

        const compressedFile = await compressImage(file, quality, maxDimension)

        if (compressedFile.size < file.size) {
          fileToUpload = compressedFile
          compressionApplied = true

          setThumbnailUploadState((prev) => ({
            ...prev,
            progress: 30,
            compressedSize: compressedFile.size,
            compressionSavings: calculateCompressionSavings(file.size, compressedFile.size).percentage,
          }))
        }
      }

      // Create form data
      const formData = createMediaFormData(fileToUpload, businessId, "thumbnail")

      // Add compression options
      if (compressionSettings.enabled) {
        formData.append("quality", compressionSettings.quality.toString())
        formData.append("maxWidth", compressionSettings.maxDimension.toString())
        formData.append("maxHeight", compressionSettings.maxDimension.toString())
        formData.append("format", compressionSettings.format)
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setThumbnailUploadState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }))
      }, 300)

      // Upload the file
      const result = await uploadThumbnail(formData)

      // Clear the progress interval
      clearInterval(progressInterval)

      if (result.success) {
        setThumbnailUploadState({
          isUploading: false,
          progress: 100,
          error: null,
          originalSize: file.size,
          compressedSize: result.size,
          compressionSavings: result.compressionSavings,
        })

        const compressionMessage = result.compressionSavings > 0 ? ` (${result.compressionSavings}% smaller)` : ""

        toast({
          title: "Thumbnail uploaded",
          description: `Your thumbnail has been uploaded successfully${compressionMessage}.`,
        })

        return result
      } else {
        setThumbnailUploadState({
          isUploading: false,
          progress: 0,
          error: result.error || "Failed to upload thumbnail",
        })

        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload thumbnail. Please try again.",
          variant: "destructive",
        })

        return null
      }
    } catch (error) {
      setThumbnailUploadState({
        isUploading: false,
        progress: 0,
        error: "An unexpected error occurred",
      })

      toast({
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })

      return null
    }
  }

  /**
   * Upload a photo to the album with compression
   */
  const handlePhotoUpload = async (file: File) => {
    // Validate the file
    if (!isValidImage(file)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a valid image file (JPG, PNG, GIF, WebP).",
        variant: "destructive",
      })
      return null
    }

    if (!isWithinSizeLimit(file, 5)) {
      // 5MB limit
      toast({
        title: "File too large",
        description: "Image files must be under 5MB.",
        variant: "destructive",
      })
      return null
    }

    // Start upload
    setPhotoUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      originalSize: file.size,
    })

    try {
      let fileToUpload = file
      let compressionApplied = false

      // Apply client-side compression if enabled
      if (compressionSettings.enabled) {
        // Determine quality and dimensions
        const quality = compressionSettings.autoOptimize
          ? getRecommendedQuality(file.size)
          : compressionSettings.quality / 100

        const maxDimension = compressionSettings.autoOptimize
          ? getRecommendedMaxDimension("photo")
          : compressionSettings.maxDimension

        // Compress the image
        setPhotoUploadState((prev) => ({
          ...prev,
          progress: 10,
        }))

        const compressedFile = await compressImage(file, quality, maxDimension)

        if (compressedFile.size < file.size) {
          fileToUpload = compressedFile
          compressionApplied = true

          setPhotoUploadState((prev) => ({
            ...prev,
            progress: 30,
            compressedSize: compressedFile.size,
            compressionSavings: calculateCompressionSavings(file.size, compressedFile.size).percentage,
          }))
        }
      }

      // Create form data
      const formData = createMediaFormData(fileToUpload, businessId, "photo")

      // Add compression options
      if (compressionSettings.enabled) {
        formData.append("quality", compressionSettings.quality.toString())
        formData.append("maxWidth", compressionSettings.maxDimension.toString())
        formData.append("maxHeight", compressionSettings.maxDimension.toString())
        formData.append("format", compressionSettings.format)
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setPhotoUploadState((prev) => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90),
        }))
      }, 300)

      // Upload the file
      const result = await uploadPhoto(formData)

      // Clear the progress interval
      clearInterval(progressInterval)

      if (result.success) {
        setPhotoUploadState({
          isUploading: false,
          progress: 100,
          error: null,
          originalSize: file.size,
          compressedSize: result.photo.size,
          compressionSavings: result.photo.compressionSavings,
        })

        const compressionMessage =
          result.photo.compressionSavings && result.photo.compressionSavings > 0
            ? ` (${result.photo.compressionSavings}% smaller)`
            : ""

        toast({
          title: "Photo uploaded",
          description: `Your photo has been added to the album${compressionMessage}.`,
        })

        return result
      } else {
        setPhotoUploadState({
          isUploading: false,
          progress: 0,
          error: result.error || "Failed to upload photo",
        })

        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload photo. Please try again.",
          variant: "destructive",
        })

        return null
      }
    } catch (error) {
      setPhotoUploadState({
        isUploading: false,
        progress: 0,
        error: "An unexpected error occurred",
      })

      toast({
        title: "Upload failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })

      return null
    }
  }

  /**
   * Delete a photo from the album
   */
  const handleDeletePhoto = async (photoId: string) => {
    try {
      const result = await deletePhoto(businessId, photoId)

      if (result.success) {
        toast({
          title: "Photo deleted",
          description: "The photo has been removed from your album.",
        })

        return result
      } else {
        toast({
          title: "Deletion failed",
          description: result.error || "Failed to delete photo. Please try again.",
          variant: "destructive",
        })

        return null
      }
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })

      return null
    }
  }

  return {
    videoUploadState,
    thumbnailUploadState,
    photoUploadState,
    compressionSettings,
    setCompressionSettings,
    handleVideoUpload,
    handleThumbnailUpload,
    handlePhotoUpload,
    handleDeletePhoto,
  }
}
