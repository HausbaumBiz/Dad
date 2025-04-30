"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, ImageIcon, Video, X } from 'lucide-react'
import { useMediaUpload } from "@/hooks/use-media-upload"
import { useImageProcessing } from "@/hooks/use-image-processing"
import { formatFileSize, createPreviewUrl } from "@/lib/media-utils"
import { CompressionSettingsDialog } from "./compression-settings"
import { CompressionStats } from "./compression-stats"
import { toast } from "@/components/ui/use-toast"
import { isValidVideo, isWithinSizeLimit, createMediaFormData, uploadVideo } from "@/lib/video-utils"

interface MediaUploaderProps {
  businessId: string
  type: "video" | "thumbnail" | "photo"
  designId?: string
  onUploadComplete?: (result: any) => void
}

export function MediaUploader({ businessId, type, designId, onUploadComplete }: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const { processImage, isProcessing } = useImageProcessing()

  const {
    videoUploadState,
    thumbnailUploadState,
    photoUploadState,
    compressionSettings,
    setCompressionSettings,
    handleThumbnailUpload,
    handlePhotoUpload,
    setVideoUploadState,
  } = useMediaUpload(businessId)

  // Get the appropriate upload state based on type
  const uploadState =
    type === "video" ? videoUploadState : type === "thumbnail" ? thumbnailUploadState : photoUploadState

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    // Create preview URL
    const url = await createPreviewUrl(file)
    setPreviewUrl(url)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    let result

    if (type === "video") {
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

        console.log(`Validating video size: ${file.size} bytes (${file.size / (1024 * 1024).toFixed(2)}MB)`)
        if (!isWithinSizeLimit(file, 50)) {
          // 50MB limit
          toast({
            title: "File too large",
            description: `Video files must be under 50MB. Current file: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
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

          // Log formData details (excluding the actual file)
          console.log("FormData created for video upload:", {
            businessId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            designId,
          })

          // Simulate progress (since we don't have real progress events)
          const progressInterval = setInterval(() => {
            setVideoUploadState((prev) => ({
              ...prev,
              progress: Math.min(prev.progress + 10, 90),
            }))
          }, 500)

          // Upload the file
          console.log("Starting video upload to server...")
          const result = await uploadVideo(formData)
          console.log("Upload result:", result)

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
          console.error("Error in video upload:", error)
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
      result = await handleVideoUpload(selectedFile, designId)
    } else if (type === "thumbnail" || type === "photo") {
      // For images, we'll process them first if needed
      if (type === "thumbnail" && compressionSettings.enabled) {
        // Process the image on the server
        const processResult = await processImage(selectedFile, {
          quality: compressionSettings.quality,
          maxWidth: compressionSettings.maxWidth,
          maxHeight: compressionSettings.maxHeight,
          format: compressionSettings.format,
        })

        if (processResult.success && processResult.data) {
          // Convert base64 to File
          const base64Data = processResult.data
          const byteCharacters = atob(base64Data)
          const byteArrays = []

          for (let i = 0; i < byteCharacters.length; i++) {
            byteArrays.push(byteCharacters.charCodeAt(i))
          }

          const byteArray = new Uint8Array(byteArrays)
          const processedFile = new File([byteArray], selectedFile.name, {
            type: processResult.contentType || selectedFile.type,
          })

          // Upload the processed file
          result =
            type === "thumbnail" ? await handleThumbnailUpload(processedFile) : await handlePhotoUpload(processedFile)
        } else {
          // Fall back to original file if processing failed
          result =
            type === "thumbnail" ? await handleThumbnailUpload(selectedFile) : await handlePhotoUpload(selectedFile)
        }
      } else {
        // Upload without processing
        result =
          type === "thumbnail" ? await handleThumbnailUpload(selectedFile) : await handlePhotoUpload(selectedFile)
      }
    }

    if (result?.success && onUploadComplete) {
      onUploadComplete(result)
    }
  }

  const handleClearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getTitle = () => {
    switch (type) {
      case "video":
        return "Upload Video"
      case "thumbnail":
        return "Upload Thumbnail"
      case "photo":
        return "Upload Photo"
    }
  }

  const getDescription = () => {
    switch (type) {
      case "video":
        return "Upload a video file (MP4, MOV, M4V)"
      case "thumbnail":
        return "Upload a thumbnail image (JPG, PNG, WebP)"
      case "photo":
        return "Upload a photo for your album (JPG, PNG, WebP)"
    }
  }

  const getIcon = () => {
    switch (type) {
      case "video":
        return <Video className="h-6 w-6" />
      case "thumbnail":
      case "photo":
        return <ImageIcon className="h-6 w-6" />
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <div>
              <CardTitle className="text-lg">{getTitle()}</CardTitle>
              <CardDescription>{getDescription()}</CardDescription>
            </div>
          </div>

          {(type === "thumbnail" || type === "photo") && (
            <CompressionSettingsDialog settings={compressionSettings} onChange={setCompressionSettings} />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!selectedFile ? (
          <div
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">Click to select a file or drag and drop</p>
            <p className="text-xs text-muted-foreground">
              {type === "video" ? "MP4, MOV, M4V up to 50MB" : "JPG, PNG, WebP up to 5MB"}
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept={type === "video" ? "video/*" : "image/*"}
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              {previewUrl &&
                (type === "video" ? (
                  <video src={previewUrl} controls className="w-full h-auto rounded-lg" />
                ) : (
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-auto rounded-lg" />
                ))}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleClearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">File:</span>
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{formatFileSize(selectedFile.size)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{selectedFile.type}</span>
              </div>
            </div>

            {uploadState.isUploading && <Progress value={uploadState.progress} className="h-2" />}

            {uploadState.compressedSize && uploadState.originalSize && (
              <CompressionStats
                originalSize={uploadState.originalSize}
                compressedSize={uploadState.compressedSize}
                compressionSavings={uploadState.compressionSavings}
              />
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {selectedFile && !uploadState.isUploading && (
          <>
            <Button variant="outline" onClick={handleClearSelection}>
              Cancel
            </Button>
            <Button onClick={handleUpload}>Upload</Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
