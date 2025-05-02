"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Upload,
  VideoIcon,
  Trash2,
  Play,
  Pause,
  LayoutTemplateIcon as LayoutLandscape,
  LayoutTemplateIcon as LayoutPortrait,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { formatFileSize } from "@/lib/media-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { uploadVideo, deleteVideo, getBusinessVideos, type VideoItem } from "@/app/actions/video-actions"
import { uploadFileInChunks } from "@/lib/chunked-upload"

// Mock business ID for demo purposes - in a real app, this would come from authentication
const BUSINESS_ID = "demo-business-123"

// Demo video URL for testing
const DEMO_VIDEO_URL = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"

// Add a type for aspect ratio
type AspectRatio = "16:9" | "9:16"

// File size thresholds
const REGULAR_UPLOAD_LIMIT_MB = 50
const MAX_UPLOAD_SIZE_MB = 500 // Maximum size for chunked uploads

export default function VideoPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9")
  const [savedVideos, setSavedVideos] = useState<VideoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [useChunkedUpload, setUseChunkedUpload] = useState(false)

  const videoInputRef = useRef<HTMLInputElement>(null)
  const videoPlayerRef = useRef<HTMLVideoElement>(null)

  // Load saved videos on component mount
  useEffect(() => {
    async function loadVideos() {
      try {
        setIsLoading(true)
        const result = await getBusinessVideos(BUSINESS_ID)
        if (result) {
          setSavedVideos(result.videos)
        }
      } catch (error) {
        console.error("Error loading videos:", error)
        toast({
          title: "Error loading videos",
          description: "There was a problem loading your videos. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadVideos()
  }, [toast])

  // Determine if chunked upload should be used when a file is selected
  useEffect(() => {
    if (selectedVideo) {
      const fileSizeMB = selectedVideo.size / (1024 * 1024)
      setUseChunkedUpload(fileSizeMB > REGULAR_UPLOAD_LIMIT_MB)
    } else {
      setUseChunkedUpload(false)
    }
  }, [selectedVideo])

  // Handle video selection
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size against absolute maximum
    const fileSizeMB = file.size / (1024 * 1024)

    if (fileSizeMB > MAX_UPLOAD_SIZE_MB) {
      toast({
        title: "File too large",
        description: `Video file size (${fileSizeMB.toFixed(2)}MB) exceeds the ${MAX_UPLOAD_SIZE_MB}MB limit.`,
        variant: "destructive",
      })
      if (videoInputRef.current) videoInputRef.current.value = ""
      return
    }

    setSelectedVideo(file)
    const url = URL.createObjectURL(file)
    setVideoPreview(url)
    setVideoError(null)
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

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const fileSizeMB = selectedVideo.size / (1024 * 1024)

      // Use chunked upload for larger files
      if (fileSizeMB > REGULAR_UPLOAD_LIMIT_MB) {
        await uploadLargeVideo()
      } else {
        await uploadRegularVideo()
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive",
      })
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  // Regular upload for smaller files
  const uploadRegularVideo = async () => {
    try {
      // Create form data for upload
      const formData = new FormData()
      formData.append("businessId", BUSINESS_ID)
      formData.append("video", selectedVideo!)
      formData.append("aspectRatio", aspectRatio)

      // Upload the video
      const result = await uploadVideo(formData)

      if (result.success) {
        setUploadProgress(100)
        setSavedVideos(result.videos)

        toast({
          title: "Upload successful",
          description: "Your video has been uploaded successfully.",
        })

        // Reset form and switch to library tab
        setSelectedVideo(null)
        setVideoPreview(null)
        if (videoInputRef.current) videoInputRef.current.value = ""
        setActiveTab("library")
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "There was an error uploading your video. Please try again.",
          variant: "destructive",
        })
        setUploadProgress(0)
      }
    } catch (uploadError) {
      console.error("Upload error:", uploadError)

      // Check if the error is related to "Request Entity Too Large"
      let errorMessage = "There was an error uploading your video. Please try again."
      if (uploadError instanceof Error && uploadError.message.includes("Request Entity Too Large")) {
        errorMessage =
          "The video file is too large for the server to process. Please try using the chunked upload option."
      } else if (uploadError instanceof Error && uploadError.message.includes("Unexpected token")) {
        errorMessage = "The server returned an invalid response. This often happens when the file is too large."
      }

      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      })
      setUploadProgress(0)
    }
  }

  // Chunked upload for larger files
  const uploadLargeVideo = async () => {
    try {
      await uploadFileInChunks({
        file: selectedVideo!,
        businessId: BUSINESS_ID,
        onProgress: (progress) => {
          setUploadProgress(progress)
        },
        onComplete: (result) => {
          if (result.success) {
            // Refresh the video list
            getBusinessVideos(BUSINESS_ID).then((result) => {
              if (result) {
                setSavedVideos(result.videos)
              }
            })

            toast({
              title: "Upload successful",
              description: "Your video has been uploaded successfully.",
            })

            // Reset form and switch to library tab
            setSelectedVideo(null)
            setVideoPreview(null)
            if (videoInputRef.current) videoInputRef.current.value = ""
            setActiveTab("library")
          } else {
            toast({
              title: "Upload failed",
              description: result.error || "There was an error uploading your video. Please try again.",
              variant: "destructive",
            })
          }
        },
        onError: (error) => {
          toast({
            title: "Upload failed",
            description: error.message || "There was an error uploading your video. Please try again.",
            variant: "destructive",
          })
          setUploadProgress(0)
        },
      })
    } catch (error) {
      console.error("Chunked upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your video. Please try again.",
        variant: "destructive",
      })
      setUploadProgress(0)
    }
  }

  // Handle video playback
  const togglePlayPause = () => {
    if (videoPlayerRef.current) {
      if (isPlaying) {
        videoPlayerRef.current.pause()
      } else {
        videoPlayerRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Handle video removal
  const handleRemoveVideo = () => {
    if (selectedVideo) {
      setSelectedVideo(null)
      setVideoPreview(null)
      if (videoInputRef.current) videoInputRef.current.value = ""
    }
  }

  // Handle deleting a saved video
  const handleDeleteSavedVideo = async (videoId: string) => {
    try {
      const result = await deleteVideo(BUSINESS_ID, videoId)

      if (result.success) {
        setSavedVideos(result.videos)
        toast({
          title: "Video deleted",
          description: "The video has been removed from your library.",
        })
      } else {
        toast({
          title: "Deletion failed",
          description: result.error || "There was an error deleting your video. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting video:", error)
      toast({
        title: "Deletion failed",
        description: "There was an error deleting your video. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Use demo video
  const handleUseDemoVideo = () => {
    setVideoPreview(DEMO_VIDEO_URL)
    setSelectedVideo(null)
    if (videoInputRef.current) videoInputRef.current.value = ""

    toast({
      title: "Using demo video",
      description: "A demo video has been loaded for preview.",
    })
  }

  // Add a helper function to get the appropriate aspect ratio class
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
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors ${getAspectRatioClass()}`}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">Click to select a video file</p>
                  <p className="text-xs text-muted-foreground">MP4, MOV, WebM up to {MAX_UPLOAD_SIZE_MB}MB</p>
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
                    <div
                      className={`overflow-hidden rounded-lg bg-black flex items-center justify-center ${getAspectRatioClass()}`}
                    >
                      <video
                        ref={videoPlayerRef}
                        src={videoPreview}
                        className="w-full h-full object-contain"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onError={() => {
                          setVideoError("Error loading video. The format may not be supported.")
                        }}
                      />

                      {/* Play/Pause overlay */}
                      <button
                        onClick={togglePlayPause}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        {isPlaying ? (
                          <Pause className="h-16 w-16 text-white" />
                        ) : (
                          <Play className="h-16 w-16 text-white" />
                        )}
                      </button>
                    </div>
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
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Upload Method:</span>
                        <span className="font-medium">
                          {useChunkedUpload ? "Chunked Upload (Large File)" : "Standard Upload"}
                        </span>
                      </div>

                      {/* File size warning */}
                      {selectedVideo && selectedVideo.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024 && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription>
                            File exceeds the maximum upload size of {MAX_UPLOAD_SIZE_MB}MB.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}

                  {videoError && (
                    <Alert variant="destructive">
                      <AlertDescription>{videoError}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between gap-2">
              <Button variant="outline" onClick={handleRemoveVideo} disabled={!videoPreview} className="flex-1">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Video
              </Button>

              {videoPreview ? (
                <Button
                  onClick={handleVideoUpload}
                  disabled={
                    isUploading ||
                    !selectedVideo ||
                    (selectedVideo && selectedVideo.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024)
                  }
                  className="flex-1"
                >
                  {isUploading ? "Uploading..." : "Upload Video"}
                </Button>
              ) : (
                <Button variant="outline" onClick={handleUseDemoVideo} className="flex-1">
                  Use Demo Video
                </Button>
              )}
            </CardFooter>
            {isUploading && (
              <div className="px-6 pb-4">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  Uploading... {Math.round(uploadProgress)}%{useChunkedUpload && " (Chunked Upload)"}
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="library">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your videos...</p>
            </div>
          ) : savedVideos.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <VideoIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No videos yet</h3>
              <p className="text-muted-foreground mb-4">Upload your first video to get started</p>
              <Button onClick={() => setActiveTab("upload")}>Upload Video</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedVideos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div
                    className={
                      video.aspectRatio === "16:9"
                        ? "aspect-video w-full bg-black"
                        : "aspect-[9/16] w-full max-w-[280px] mx-auto bg-black"
                    }
                  >
                    <video src={video.url} className="w-full h-full object-contain" controls />
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-medium truncate" title={video.filename}>
                      {video.filename}
                    </h3>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{formatFileSize(video.size)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Aspect Ratio:</span>
                      <span className="flex items-center">
                        {video.aspectRatio === "16:9" ? (
                          <>
                            <LayoutLandscape className="h-4 w-4 mr-1" /> Landscape
                          </>
                        ) : (
                          <>
                            <LayoutPortrait className="h-4 w-4 mr-1" /> Vertical
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-muted-foreground">Uploaded:</span>
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteSavedVideo(video.id)}
                      className="w-full flex items-center"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Video
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
