"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, VideoIcon, ImageIcon, X } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { compressImage, formatFileSize, createPreviewUrl } from "@/lib/media-utils"
import { CompressionStats } from "@/components/compression-stats"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface VideoItem {
  id: string
  file: File
  url: string
  name: string
  size: number
  type: string
  thumbnail?: {
    file: File
    url: string
    originalSize: number
    compressedSize: number
    compressionSavings: number
  }
}

export default function VideoPage() {
  const { toast } = useToast()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("upload")

  // For thumbnail handling
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [thumbnailStats, setThumbnailStats] = useState<{
    originalSize: number
    compressedSize: number
    compressionSavings: number
  } | null>(null)
  const [processingThumbnail, setProcessingThumbnail] = useState(false)

  // For video handling
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoPlayerRefs = useRef<{ [key: string]: HTMLVideoElement }>({})

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
      description: "Compressing image to under 600KB",
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

    setSelectedVideo(file)
    const url = await createPreviewUrl(file)
    setVideoPreview(url)
  }

  // Handle upload of both video and thumbnail
  const handleUpload = async () => {
    if (!selectedVideo) {
      toast({
        title: "No video selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        return newProgress >= 100 ? 100 : newProgress
      })
    }, 500)

    try {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const videoId = `video-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      const videoUrl = URL.createObjectURL(selectedVideo)

      const newVideo: VideoItem = {
        id: videoId,
        file: selectedVideo,
        url: videoUrl,
        name: selectedVideo.name,
        size: selectedVideo.size,
        type: selectedVideo.type,
      }

      // Add thumbnail if available
      if (selectedThumbnail && thumbnailStats) {
        const thumbnailUrl = URL.createObjectURL(selectedThumbnail)
        newVideo.thumbnail = {
          file: selectedThumbnail,
          url: thumbnailUrl,
          originalSize: thumbnailStats.originalSize,
          compressedSize: thumbnailStats.compressedSize,
          compressionSavings: thumbnailStats.compressionSavings,
        }
      }

      setVideos((prev) => [...prev, newVideo])
      setActiveTab("library")

      toast({
        title: "Upload complete",
        description: `${selectedVideo.name} has been uploaded successfully`,
      })

      // Reset form
      setSelectedVideo(null)
      setVideoPreview(null)
      setSelectedThumbnail(null)
      setThumbnailPreview(null)
      setThumbnailStats(null)

      if (videoInputRef.current) videoInputRef.current.value = ""
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
    } catch (error) {
      console.error("Error uploading:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your video",
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setUploadProgress(0)
      setIsUploading(false)
    }
  }

  // Handle video playback and thumbnail display
  const handleVideoEnded = (videoId: string) => {
    // Show thumbnail when video ends
    const videoElement = videoPlayerRefs.current[videoId]
    if (videoElement) {
      videoElement.currentTime = 0
    }
  }

  const handleVideoPlay = (video: VideoItem) => {
    setCurrentVideo(video)
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
          <TabsTrigger value="library">Video Library ({videos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
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
                        Thumbnails will be automatically compressed to under 600KB for optimal performance.
                      </AlertDescription>
                    </Alert>
                    <div
                      className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
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
                      <img
                        src={thumbnailPreview || "/placeholder.svg"}
                        alt="Thumbnail preview"
                        className="w-full h-auto rounded-lg object-cover aspect-video"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => {
                          setSelectedThumbnail(null)
                          setThumbnailPreview(null)
                          setThumbnailStats(null)
                          if (thumbnailInputRef.current) thumbnailInputRef.current.value = ""
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">File:</span>
                        <span className="font-medium">{selectedThumbnail?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">{formatFileSize(selectedThumbnail?.size || 0)}</span>
                      </div>
                    </div>

                    {thumbnailStats && (
                      <CompressionStats
                        originalSize={thumbnailStats.originalSize}
                        compressedSize={thumbnailStats.compressedSize}
                        compressionSavings={thumbnailStats.compressionSavings}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video Upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <VideoIcon className="h-5 w-5" />
                  <div>
                    <CardTitle>Upload Video</CardTitle>
                    <CardDescription>Select a video file to upload</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!videoPreview ? (
                  <div
                    className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => videoInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">Click to select a video file</p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, WebM up to 50MB</p>
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
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-auto rounded-lg"
                        poster={thumbnailPreview || undefined}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => {
                          setSelectedVideo(null)
                          setVideoPreview(null)
                          if (videoInputRef.current) videoInputRef.current.value = ""
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">File:</span>
                        <span className="font-medium">{selectedVideo?.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Size:</span>
                        <span className="font-medium">{formatFileSize(selectedVideo?.size || 0)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{selectedVideo?.type}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleUpload} disabled={!selectedVideo || isUploading || processingThumbnail}>
                  {isUploading ? "Uploading..." : "Upload Video"}
                </Button>
              </CardFooter>

              {isUploading && (
                <div className="px-6 pb-4">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center mt-1 text-muted-foreground">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </Card>
          </div>

          <div className="mt-6">
            <Alert>
              <AlertDescription>
                <p className="text-sm">
                  <strong>Note:</strong> The thumbnail will be displayed before the video plays and after it ends. For
                  best results, use an image that represents the content of your video.
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>

        <TabsContent value="library">
          {videos.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first video to get started</p>
              <Button onClick={() => setActiveTab("upload")}>Upload Video</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="relative">
                    <video
                      ref={(el) => {
                        if (el) videoPlayerRefs.current[video.id] = el
                      }}
                      src={video.url}
                      poster={video.thumbnail?.url}
                      className="w-full h-auto aspect-video object-cover"
                      controls
                      onEnded={() => handleVideoEnded(video.id)}
                      onPlay={() => handleVideoPlay(video)}
                    />
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-medium truncate" title={video.name}>
                      {video.name}
                    </h3>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{formatFileSize(video.size)}</span>
                    </div>
                    {video.thumbnail && (
                      <div className="mt-2 text-xs text-green-600">
                        Custom thumbnail added ({video.thumbnail.compressionSavings}% compressed)
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
