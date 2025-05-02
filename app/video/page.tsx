"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Upload,
  VideoIcon,
  ImageIcon,
  X,
  Trash2,
  LayoutTemplateIcon as LayoutLandscape,
  LayoutTemplateIcon as LayoutPortrait,
  SliceIcon as ChunksIcon,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { compressImage, formatFileSize, createPreviewUrl } from "@/lib/media-utils"
import { CompressionStats } from "@/components/compression-stats"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { uploadThumbnail, uploadVideo, getBusinessMedia, deleteThumbnail } from "@/app/actions/media-actions"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useChunkedUpload } from "@/hooks/use-chunked-upload"
import { Switch } from "@/components/ui/switch"

// Add these constants
const MAX_VIDEO_SIZE_MB = 50
const MAX_CHUNKED_VIDEO_SIZE_MB = 500 // 500MB limit for chunked uploads
const MB_IN_BYTES = 1024 * 1024
const DEFAULT_CHUNK_SIZE_MB = 5

type AspectRatio = "16:9" | "9:16"

interface VideoItem {
  id: string
  file: File
  url: string
  name: string
  size: number
  type: string
}

// Mock business ID for demo purposes - in a real app, this would come from authentication
const BUSINESS_ID = "demo-business-123"

export default function VideoPage() {
  const { toast } = useToast()

  // Move the checkBlobConfig function inside the component
  const checkBlobConfig = async () => {
    try {
      const response = await fetch("/api/verify-blob-config")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Blob storage configured correctly",
          description: `Found ${data.blobCount} blobs in storage. Token is present.`,
        })
      } else {
        toast({
          title: "Blob storage configuration issue",
          description: `Error: ${data.error}. Token present: ${data.hasToken}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to check Blob configuration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const [videos, setVideos] = useState<VideoItem[]>([])
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("upload")
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9")
  const [useChunkedUploading, setUseChunkedUploading] = useState(true)
  const [chunkSizeMB, setChunkSizeMB] = useState(DEFAULT_CHUNK_SIZE_MB)

  // For thumbnail handling
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailStats, setThumbnailStats] = useState<{
    originalSize: number
    compressedSize: number
    compressionSavings: number
  } | null>(null)
  const [processingThumbnail, setProcessingThumbnail] = useState(false)

  // For stored thumbnail
  const [storedThumbnail, setStoredThumbnail] = useState<{
    url: string
    id: string
    aspectRatio?: AspectRatio
  } | null>(null)
  const [deletingThumbnail, setDeletingThumbnail] = useState(false)

  // For video handling
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [storedVideo, setStoredVideo] = useState<{
    url: string
    id: string
    contentType: string
    aspectRatio?: AspectRatio
  } | null>(null)

  // Chunked upload state
  const {
    uploadFile,
    cancelUpload,
    isUploading: isChunkUploading,
    progress: chunkProgress,
    error: chunkError,
    uploadedChunks,
    totalChunks,
  } = useChunkedUpload({
    chunkSize: chunkSizeMB * MB_IN_BYTES,
    onProgress: (progress) => {
      setUploadProgress(progress)
    },
    onChunkComplete: (chunkIndex, totalChunks) => {
      toast({
        title: `Chunk ${chunkIndex + 1} of ${totalChunks} uploaded`,
        description: `Upload progress: ${Math.round(((chunkIndex + 1) / totalChunks) * 100)}%`,
      })
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
      setIsUploading(false)
    },
    onComplete: (result) => {
      if (result.success) {
        setStoredVideo({
          url: result.url,
          id: result.id,
          contentType: result.contentType,
          aspectRatio,
        })

        toast({
          title: "Video uploaded successfully",
          description: "Your video has been saved and will be available when you return",
        })

        // Reset the form
        setSelectedVideo(null)
        if (videoInputRef.current) videoInputRef.current.value = ""

        // Keep the preview showing the stored video
        setVideoPreview(result.url)

        // Switch to library tab
        setActiveTab("library")
      }
    },
  })

  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoPlayerRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

  // Load existing media on component mount
  useEffect(() => {
    async function loadMedia() {
      try {
        const media = await getBusinessMedia(BUSINESS_ID)
        if (media) {
          // Set stored thumbnail if it exists
          if (media.thumbnailUrl && media.thumbnailId) {
            setStoredThumbnail({
              url: media.thumbnailUrl,
              id: media.thumbnailId,
              aspectRatio: (media.aspectRatio as AspectRatio) || "16:9",
            })
            setThumbnailPreview(media.thumbnailUrl)
          }

          // Set stored video if it exists
          if (media.videoUrl && media.videoId) {
            setStoredVideo({
              url: media.videoUrl,
              id: media.videoId,
              contentType: media.videoContentType || "video/mp4",
              aspectRatio: (media.aspectRatio as AspectRatio) || "16:9",
            })

            // Set the aspect ratio based on the stored video
            if (media.aspectRatio) {
              setAspectRatio(media.aspectRatio as AspectRatio)
            }
          }
        }
      } catch (error) {
        console.error("Error loading media:", error)
      }
    }

    loadMedia()
  }, [])

  // Handle thumbnail selection
  const handleThumbnailSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedThumbnail(file)
    const url = await createPreviewUrl(file)
    setThumbnailPreview(url)

    // Compress the thumbnail
    setProcessingThumbnail(true)
    toast({
      title: "Processing thumbnail...",
      description: "Compressing image to optimize for web",
    })

    try {
      const originalSize = file.size
      const compressedFile = await compressImage(file, 0.8, 1280)
      const compressedSize = compressedFile.size
      const compressionSavings = Math.round(((originalSize - compressedSize) / originalSize) * 100)

      setSelectedThumbnail(compressedFile)
      setThumbnailStats({
        originalSize,
        compressedSize,
        compressionSavings,
      })

      toast({
        title: "Thumbnail processed",
        description: `Reduced from ${formatFileSize(originalSize)} to ${formatFileSize(compressedSize)} (${compressionSavings}% smaller)`,
      })
    } catch (error) {
      console.error("Error compressing thumbnail:", error)
      toast({
        title: "Error processing thumbnail",
        description: "Failed to compress the image. Using original file.",
        variant: "destructive",
      })
    } finally {
      setProcessingThumbnail(false)
    }
  }

  // Handle video selection
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size based on upload method
    const fileSizeMB = file.size / MB_IN_BYTES
    const maxSize = useChunkedUploading ? MAX_CHUNKED_VIDEO_SIZE_MB : MAX_VIDEO_SIZE_MB

    if (fileSizeMB > maxSize) {
      toast({
        title: "File too large",
        description: `Video file size (${fileSizeMB.toFixed(2)}MB) exceeds the ${maxSize}MB limit.`,
        variant: "destructive",
      })
      if (videoInputRef.current) videoInputRef.current.value = ""
      return
    }

    setSelectedVideo(file)
    const url = await createPreviewUrl(file)
    setVideoPreview(url)
  }

  // Handle thumbnail upload
  const handleThumbnailUpload = async () => {
    if (!selectedThumbnail) {
      toast({
        title: "No thumbnail selected",
        description: "Please select a thumbnail image to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(10) // Start progress

    try {
      // If there's already a stored thumbnail, we need to replace it
      // The server action will handle deleting the old one

      // Create form data for upload
      const formData = new FormData()
      formData.append("businessId", BUSINESS_ID)
      formData.append("thumbnail", selectedThumbnail)
      formData.append("aspectRatio", aspectRatio)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 15
          return newProgress >= 90 ? 90 : newProgress
        })
      }, 500)

      // Upload the thumbnail
      const result = await uploadThumbnail(formData)
      clearInterval(progressInterval)

      if (result.success) {
        setUploadProgress(100)
        setStoredThumbnail({
          url: result.url,
          id: result.id,
          aspectRatio,
        })

        toast({
          title: "Thumbnail uploaded",
          description: "Your thumbnail has been saved and will be available when you return",
        })

        // Reset the form
        setSelectedThumbnail(null)
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
        setThumbnailStats(null)

        // Keep the preview showing the stored thumbnail
        setThumbnailPreview(result.url)
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "There was an error uploading your thumbnail",
          variant: "destructive",
        })
        setUploadProgress(0)
      }
    } catch (error) {
      console.error("Error uploading thumbnail:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your thumbnail",
        variant: "destructive",
      })
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  // Handle video upload
  const handleVideoUpload = async () => {
    if (!selectedVideo) {
      toast({
        title: "No video selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      })
      return
    }

    // Check file size again just to be safe
    const fileSizeMB = selectedVideo.size / MB_IN_BYTES
    console.log(`Uploading video: ${selectedVideo.name}, Size: ${fileSizeMB.toFixed(2)}MB, Type: ${selectedVideo.type}`)

    const maxSize = useChunkedUploading ? MAX_CHUNKED_VIDEO_SIZE_MB : MAX_VIDEO_SIZE_MB
    if (fileSizeMB > maxSize) {
      toast({
        title: "File too large",
        description: `Video file size (${fileSizeMB.toFixed(2)}MB) exceeds the ${maxSize}MB limit.`,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      if (useChunkedUploading) {
        // Use chunked upload
        toast({
          title: "Starting chunked upload",
          description: `File will be split into ${Math.ceil(selectedVideo.size / (chunkSizeMB * MB_IN_BYTES))} chunks`,
        })

        await uploadFile(selectedVideo, BUSINESS_ID, aspectRatio)
      } else {
        // Use regular upload
        // Create form data for upload
        const formData = new FormData()
        formData.append("businessId", BUSINESS_ID)
        formData.append("aspectRatio", aspectRatio)
        formData.append("video", selectedVideo, selectedVideo.name)

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const newProgress = prev + Math.random() * 10
            return newProgress >= 90 ? 90 : newProgress
          })
        }, 500)

        // Upload the video with error handling
        console.log("Starting regular video upload...")

        try {
          const result = await uploadVideo(formData)
          console.log("Upload result:", result)

          clearInterval(progressInterval)

          if (result.success) {
            setUploadProgress(100)
            setStoredVideo({
              url: result.url,
              id: result.id,
              contentType: result.contentType,
              aspectRatio,
            })

            toast({
              title: "Video uploaded",
              description: "Your video has been saved and will be available when you return",
            })

            // Reset the form
            setSelectedVideo(null)
            if (videoInputRef.current) videoInputRef.current.value = ""

            // Keep the preview showing the stored video
            setVideoPreview(result.url)

            // Switch to library tab
            setActiveTab("library")
          } else {
            console.error("Video upload failed:", result.error)
            toast({
              title: "Upload failed",
              description: result.error || "There was an error uploading your video",
              variant: "destructive",
            })
            setUploadProgress(0)
          }
        } catch (uploadError) {
          clearInterval(progressInterval)
          console.error("Error during upload:", uploadError)

          // Check if the error message contains "Request Entity Too Large"
          let errorMessage = "An error occurred during upload"

          if (uploadError instanceof Error) {
            errorMessage = uploadError.message

            // Check for specific error patterns
            if (
              errorMessage.includes("Request Entity Too Large") ||
              errorMessage.includes("413") ||
              errorMessage.includes("too large") ||
              (errorMessage.includes("Unexpected token") && errorMessage.includes("Request"))
            ) {
              errorMessage = `File is too large for upload. Please reduce the file size to under ${MAX_VIDEO_SIZE_MB}MB or use chunked upload.`
            }
          }

          toast({
            title: "Upload failed",
            description: errorMessage,
            variant: "destructive",
          })
          setUploadProgress(0)
        }
      }
    } catch (error) {
      console.error("Unexpected error in video upload:", error)
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred during upload. Please try again with a smaller file.",
        variant: "destructive",
      })
      setUploadProgress(0)
    } finally {
      if (!useChunkedUploading) {
        setIsUploading(false)
      }
    }
  }

  // Handle thumbnail deletion
  const handleDeleteThumbnail = async () => {
    if (!storedThumbnail) {
      console.log("No stored thumbnail to delete")
      return
    }

    setDeletingThumbnail(true)

    try {
      // Use the new deleteThumbnail function instead of deletePhoto
      const result = await deleteThumbnail(BUSINESS_ID)

      if (result.success) {
        // Update local state
        setStoredThumbnail(null)
        setThumbnailPreview(null)

        // Clear the file input if it exists
        if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""

        toast({
          title: "Thumbnail deleted",
          description: "Your thumbnail has been removed",
        })
      } else {
        console.error("Error response from deleteThumbnail:", result)
        toast({
          title: "Deletion failed",
          description: result.error || "There was an error deleting your thumbnail",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting thumbnail:", error)
      toast({
        title: "Deletion failed",
        description: "There was an error deleting your thumbnail",
        variant: "destructive",
      })
    } finally {
      setDeletingThumbnail(false)
    }
  }

  // Handle video removal
  const handleRemoveVideo = () => {
    // If there's a selected video (not yet uploaded), clear it
    if (selectedVideo) {
      setSelectedVideo(null)
      if (videoInputRef.current) videoInputRef.current.value = ""

      // If there's a stored video, show that instead
      if (storedVideo) {
        setVideoPreview(storedVideo.url)
      } else {
        setVideoPreview(null)
      }

      toast({
        title: "Video removed",
        description: "The video has been removed. You can select a new one.",
      })
    }
    // If there's a stored video (already uploaded), clear that
    else if (storedVideo) {
      setStoredVideo(null)
      setVideoPreview(null)

      toast({
        title: "Video removed",
        description: "Your video has been removed from the library.",
      })
    }
  }

  // Handle stored video removal
  const handleRemoveStoredVideo = () => {
    setStoredVideo(null)
    setVideoPreview(null)

    toast({
      title: "Video removed",
      description: "Your video has been removed from the library.",
    })
  }

  // Handle canceling chunked upload
  const handleCancelUpload = () => {
    cancelUpload()
    setIsUploading(false)
    setUploadProgress(0)

    toast({
      title: "Upload canceled",
      description: "Video upload has been canceled",
    })
  }

  // Get the appropriate aspect ratio class for the video/thumbnail container
  const getAspectRatioClass = () => {
    return aspectRatio === "16:9" ? "aspect-video w-full" : "aspect-[9/16] w-full max-w-[280px] mx-auto"
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center mb-6">
        <Link href="/workbench" className="mr-4">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Video Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upload">Upload Video</TabsTrigger>
          <TabsTrigger value="library">Video Library</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          {/* Aspect Ratio Selector */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Video Orientation</CardTitle>
              <CardDescription>Select the aspect ratio for your video</CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={aspectRatio}
                onValueChange={(value) => setAspectRatio(value as AspectRatio)}
                className="flex flex-col sm:flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="16:9" id="landscape" />
                  <Label htmlFor="landscape" className="flex items-center gap-2 cursor-pointer">
                    <LayoutLandscape className="h-5 w-5" />
                    <span>Landscape (16:9)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="9:16" id="portrait" />
                  <Label htmlFor="portrait" className="flex items-center gap-2 cursor-pointer">
                    <LayoutPortrait className="h-5 w-5" />
                    <span>Vertical (9:16)</span>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Chunked Upload Toggle */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Upload Method</CardTitle>
              <CardDescription>Choose how to upload your video</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="chunked-upload">Chunked Upload</Label>
                  <p className="text-sm text-muted-foreground">
                    {useChunkedUploading
                      ? `Upload larger videos (up to ${MAX_CHUNKED_VIDEO_SIZE_MB}MB) by splitting them into ${chunkSizeMB}MB chunks`
                      : `Standard upload (max ${MAX_VIDEO_SIZE_MB}MB)`}
                  </p>
                </div>
                <Switch id="chunked-upload" checked={useChunkedUploading} onCheckedChange={setUseChunkedUploading} />
              </div>

              {useChunkedUploading && (
                <div className="mt-4">
                  <Label htmlFor="chunk-size">Chunk Size: {chunkSizeMB}MB</Label>
                  <input
                    id="chunk-size"
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={chunkSizeMB}
                    onChange={(e) => setChunkSizeMB(Number.parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Smaller (more reliable)</span>
                    <span>Larger (faster)</span>
                  </div>
                </div>
              )}

              <Alert className="mt-4 bg-blue-50 border-blue-200">
                <AlertDescription className="text-xs text-blue-700">
                  Chunked upload is enabled by default for better reliability with larger files and slower connections.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Thumbnail Upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <div>
                    <CardTitle>Upload Thumbnail</CardTitle>
                    <CardDescription>Add a thumbnail image for your video</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!thumbnailPreview ? (
                  <>
                    <Alert className="mb-4 bg-blue-50 border-blue-200">
                      <AlertDescription className="text-xs text-blue-700">
                        Thumbnails will be automatically compressed for optimal performance. Only one thumbnail can be
                        used at a time.
                      </AlertDescription>
                    </Alert>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors ${getAspectRatioClass()}`}
                      onClick={() => thumbnailInputRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-1">Click to select a thumbnail image</p>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP up to 5MB</p>
                      <input
                        type="file"
                        ref={thumbnailInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleThumbnailSelect}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className={`w-full overflow-hidden rounded-lg ${getAspectRatioClass()}`}>
                        <img
                          src={thumbnailPreview || "/placeholder.svg"}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Show different buttons based on whether this is a stored thumbnail or a new one */}
                      {storedThumbnail && !selectedThumbnail ? (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={handleDeleteThumbnail}
                          disabled={deletingThumbnail}
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingThumbnail && <span className="sr-only">Deleting...</span>}
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => {
                            setSelectedThumbnail(null)
                            // If we have a stored thumbnail, show it again
                            setThumbnailPreview(storedThumbnail ? storedThumbnail.url : null)
                            setThumbnailStats(null)
                            if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {selectedThumbnail && (
                      <>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">File:</span>
                            <span className="font-medium">{selectedThumbnail.name}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Size:</span>
                            <span className="font-medium">{formatFileSize(selectedThumbnail.size)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Aspect Ratio:</span>
                            <span className="font-medium">{aspectRatio}</span>
                          </div>
                        </div>

                        {thumbnailStats && (
                          <CompressionStats
                            originalSize={thumbnailStats.originalSize}
                            compressedSize={thumbnailStats.compressedSize}
                            compressionSavings={thumbnailStats.compressionSavings}
                          />
                        )}

                        <Button
                          onClick={handleThumbnailUpload}
                          disabled={isUploading || processingThumbnail}
                          className="w-full"
                        >
                          {isUploading ? "Uploading..." : "Save Thumbnail"}
                        </Button>
                      </>
                    )}

                    {storedThumbnail && !selectedThumbnail && (
                      <Alert className="bg-green-50 border-green-200">
                        <AlertDescription className="text-xs text-green-700">
                          This thumbnail is saved and will be used for your video.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Upload */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <VideoIcon className="h-5 w-5" />
                    <div>
                      <CardTitle>Upload Video</CardTitle>
                      <CardDescription>Select a video file to upload</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={checkBlobConfig} className="text-xs">
                    Check Storage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!videoPreview ? (
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors ${getAspectRatioClass()}`}
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">Click to select a video file</p>
                    <p className="text-xs text-muted-foreground">
                      MP4, MOV, WebM up to {useChunkedUploading ? MAX_CHUNKED_VIDEO_SIZE_MB : MAX_VIDEO_SIZE_MB}MB
                    </p>
                    <input
                      type="file"
                      ref={videoInputRef}
                      className="hidden"
                      accept="video/*"
                      onChange={handleVideoSelect}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className={`w-full overflow-hidden rounded-lg ${getAspectRatioClass()}`}>
                        <video
                          src={videoPreview}
                          controls
                          className="w-full h-full object-cover"
                          poster={thumbnailPreview || undefined}
                        />
                      </div>
                      {selectedVideo && (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8"
                          onClick={() => {
                            setSelectedVideo(null)
                            // If we have a stored video, show it again
                            setVideoPreview(storedVideo ? storedVideo.url : null)
                            if (videoInputRef.current) videoInputRef.current.value = ""
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {selectedVideo && (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">File:</span>
                          <span className="font-medium">{selectedVideo.name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Size:</span>
                          <span className="font-medium">{formatFileSize(selectedVideo.size)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">{selectedVideo.type}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Aspect Ratio:</span>
                          <span className="font-medium">{aspectRatio}</span>
                        </div>
                        {useChunkedUploading && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Upload Method:</span>
                            <span className="font-medium flex items-center">
                              <ChunksIcon className="h-4 w-4 mr-1" />
                              Chunked ({Math.ceil(selectedVideo.size / (chunkSizeMB * MB_IN_BYTES))} chunks)
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {storedVideo && !selectedVideo && (
                      <Alert className="bg-green-50 border-green-200">
                        <AlertDescription className="text-xs text-green-700">
                          This video is saved and will be available when you return.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between gap-2">
                <>
                  <Button
                    variant="outline"
                    onClick={isUploading ? handleCancelUpload : handleRemoveVideo}
                    disabled={!selectedVideo && !videoPreview && !isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Cancel Upload
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Video
                      </>
                    )}
                  </Button>
                  <Button onClick={handleVideoUpload} disabled={isUploading || !selectedVideo} className="flex-1">
                    {isUploading ? "Uploading..." : "Upload Video"}
                  </Button>
                </>
              </CardFooter>

              {isUploading && (
                <div className="px-6 pb-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
                    {useChunkedUploading && uploadedChunks > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Chunk {uploadedChunks} of {totalChunks}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="mt-6">
            <Alert>
              <AlertDescription>
                <p className="text-sm">
                  <strong>Note:</strong> The thumbnail will be displayed before the video plays and after it ends. For
                  best results, use an image that represents the content of your video and matches the selected aspect
                  ratio.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>

        <TabsContent value="library">
          {!storedVideo ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first video to get started</p>
              <Button onClick={() => setActiveTab("upload")}>Upload Video</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="overflow-hidden">
                <div className="relative">
                  <div
                    className={`overflow-hidden ${
                      storedVideo.aspectRatio === "9:16"
                        ? "aspect-[9/16] w-full max-w-[280px] mx-auto"
                        : "aspect-video w-full"
                    }`}
                  >
                    <video
                      src={storedVideo.url}
                      poster={storedThumbnail?.url}
                      className="w-full h-full object-cover"
                      controls
                    />
                  </div>
                </div>
                <CardContent className="pt-4">
                  <h3 className="font-medium">Your Video</h3>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Type:</span>
                    <span>{storedVideo.contentType}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Aspect Ratio:</span>
                    <span>{storedVideo.aspectRatio || "16:9"}</span>
                  </div>
                  {storedThumbnail && <div className="mt-2 text-xs text-green-600">Custom thumbnail added</div>}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={handleRemoveStoredVideo} className="w-full flex items-center">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Video
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
