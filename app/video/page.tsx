"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowLeft,
  Upload,
  VideoIcon,
  X,
  RefreshCw,
  Cloud,
  LayoutTemplateIcon as LayoutLandscape,
  LayoutTemplateIcon as LayoutPortrait,
  AlertTriangle,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { formatFileSize, createPreviewUrl } from "@/lib/media-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  saveCloudflareVideo,
  getCloudflareBusinessMedia,
  deleteCloudflareVideo,
  type CloudflareBusinessMedia,
  checkCloudflareVideoStatus,
} from "@/app/actions/cloudflare-media-actions"
import { getCurrentBusiness } from "@/app/actions/business-actions"
import { useRouter } from "next/navigation"
import { CloudflareStreamPlayer } from "@/components/cloudflare-stream-player"

// Add these constants
const MAX_VIDEO_SIZE_MB = 200 // Cloudflare Stream accepts larger videos

type AspectRatio = "16:9" | "9:16"

export default function VideoPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [cloudflareUploadUrl, setCloudflareUploadUrl] = useState<string | null>(null)
  const [cloudflareVideoId, setCloudflareVideoId] = useState<string | null>(null)
  const [checkingCloudflareConfig, setCheckingCloudflareConfig] = useState(false)
  const [cloudflareConfigured, setCloudflareConfigured] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [existingVideo, setExistingVideo] = useState<CloudflareBusinessMedia | null>(null)
  const [isDeletingVideo, setIsDeletingVideo] = useState(false)
  // First, add a new state for tracking video processing
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  const videoInputRef = useRef<HTMLInputElement>(null)

  // Load business ID and existing video on component mount
  useEffect(() => {
    async function loadBusiness() {
      try {
        setIsLoading(true)

        // Get the current business from the session
        const business = await getCurrentBusiness()

        if (!business) {
          // If no business is logged in, redirect to login
          toast({
            title: "Authentication required",
            description: "Please log in to access video management",
            variant: "destructive",
          })
          router.push("/business-login")
          return
        }

        setBusinessId(business.id)
        console.log(`Loaded business ID: ${business.id}`)

        // Load existing video if any
        const media = await getCloudflareBusinessMedia(business.id)
        if (media && media.cloudflareVideoId) {
          setExistingVideo(media)
          setAspectRatio((media.videoAspectRatio as AspectRatio) || "16:9")
        }
      } catch (error) {
        console.error("Error loading business:", error)
        toast({
          title: "Error loading data",
          description: "There was a problem loading your business information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadBusiness()
    checkCloudflareConfig()
  }, [toast, router])

  // Check Cloudflare Stream configuration
  const checkCloudflareConfig = async () => {
    try {
      setCheckingCloudflareConfig(true)
      const response = await fetch("/api/cloudflare-stream/check-config")
      const data = await response.json()

      setCloudflareConfigured(data.configured)

      if (data.configured) {
        toast({
          title: "Cloudflare Stream configured",
          description: "Your Cloudflare Stream integration is working properly.",
        })
      } else {
        toast({
          title: "Cloudflare Stream configuration issue",
          description: `Error: ${data.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to check Cloudflare configuration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setCheckingCloudflareConfig(false)
    }
  }

  // Get a direct upload URL from Cloudflare Stream
  const getDirectUploadUrl = async () => {
    try {
      const response = await fetch("/api/cloudflare-stream/direct-upload")
      const data = await response.json()

      if (data.success && data.uploadUrl && data.id) {
        setCloudflareUploadUrl(data.uploadUrl)
        setCloudflareVideoId(data.id)
        return { uploadUrl: data.uploadUrl, videoId: data.id }
      } else {
        toast({
          title: "Failed to get upload URL",
          description: data.error || "An unknown error occurred",
          variant: "destructive",
        })
        return null
      }
    } catch (error) {
      toast({
        title: "Error getting upload URL",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
      return null
    }
  }

  // Handle video selection
  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
      toast({
        title: "File too large",
        description: `Video file size (${fileSizeMB.toFixed(2)}MB) exceeds the ${MAX_VIDEO_SIZE_MB}MB limit.`,
        variant: "destructive",
      })
      if (videoInputRef.current) videoInputRef.current.value = ""
      return
    }

    setSelectedVideo(file)
    const url = await createPreviewUrl(file)
    setVideoPreview(url)
  }

  // Now modify the handleVideoUpload function to set isProcessingVideo
  // Replace the existing handleVideoUpload function with this updated version:

  // Handle video upload to Cloudflare Stream
  const handleVideoUpload = async () => {
    if (!businessId) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload videos",
        variant: "destructive",
      })
      return
    }

    if (!selectedVideo) {
      toast({
        title: "No video selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      })
      return
    }

    // Check Cloudflare configuration
    if (!cloudflareConfigured) {
      toast({
        title: "Cloudflare Stream not configured",
        description: "Please check your Cloudflare Stream configuration",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get a direct upload URL if we don't have one
      const uploadData =
        cloudflareUploadUrl && cloudflareVideoId
          ? { uploadUrl: cloudflareUploadUrl, videoId: cloudflareVideoId }
          : await getDirectUploadUrl()

      if (!uploadData) {
        throw new Error("Failed to get Cloudflare upload URL")
      }

      // Store the video ID for status polling
      setCloudflareVideoId(uploadData.videoId)

      // Upload the video directly to Cloudflare Stream
      const formData = new FormData()
      formData.append("file", selectedVideo)

      // Create upload options
      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentComplete)
        }
      })

      // Set up promise for XHR completion
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`HTTP Error: ${xhr.status}`))
          }
        }

        xhr.onerror = () => {
          reject(new Error("Network error during upload"))
        }
      })

      // Start the upload
      xhr.open("POST", uploadData.uploadUrl, true)
      xhr.send(formData)

      // Wait for upload to complete
      await uploadPromise

      // Upload completed successfully
      toast({
        title: "Video uploaded successfully",
        description: "Your video is being processed and will be available shortly.",
      })

      // Save the video information in our backend
      const result = await saveCloudflareVideo(businessId, uploadData.videoId, aspectRatio)

      if (result.success) {
        // Reset the form
        setSelectedVideo(null)
        setVideoPreview(null)
        if (videoInputRef.current) videoInputRef.current.value = ""

        // Start polling for video processing status
        setIsProcessingVideo(true)
        setProcessingProgress(10)
        setCloudflareVideoId(uploadData.videoId) // Make sure this is set for polling

        // Immediately try to get the video info
        const media = await getCloudflareBusinessMedia(businessId)
        if (media && media.cloudflareVideoId) {
          setExistingVideo(media)
          console.log("Initial video data loaded after upload:", media)
        }
      } else {
        throw new Error(result.error || "Failed to save video information")
      }
    } catch (error) {
      console.error("Error uploading video:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred during upload",
        variant: "destructive",
      })
      setIsProcessingVideo(false)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Add this after the other useEffect hooks
  useEffect(() => {
    // Poll for video status if we have a video that's processing
    let interval: NodeJS.Timeout | null = null

    if (isProcessingVideo && businessId && cloudflareVideoId) {
      console.log(`Starting polling for video ${cloudflareVideoId}`)

      // Define the polling function
      const checkVideoStatus = async () => {
        try {
          // Use the server action that directly checks with Cloudflare API
          const statusResult = await checkCloudflareVideoStatus(businessId)
          console.log("Video status check result:", statusResult)

          if (statusResult.success) {
            // Update processing progress for visual feedback
            setProcessingProgress((prev) => Math.min(prev + 5, 95))

            // If the video is ready to stream, stop polling and update UI
            if (statusResult.readyToStream) {
              setIsProcessingVideo(false)

              // Fetch the latest video data to update the UI
              const media = await getCloudflareBusinessMedia(businessId)
              if (media && media.cloudflareVideoId) {
                setExistingVideo(media)
                console.log("Video is ready to stream, updating UI")

                toast({
                  title: "Video ready",
                  description: "Your video is now ready to stream.",
                })
              }
            }
          } else {
            console.warn("Failed to check video status:", statusResult.error)
          }
        } catch (error) {
          console.error("Error checking video status:", error)
        }
      }

      // Run immediately once
      checkVideoStatus()

      // Then set up interval
      interval = setInterval(checkVideoStatus, 3000) // Check every 3 seconds
    }

    return () => {
      if (interval) {
        console.log("Clearing video status polling interval")
        clearInterval(interval)
      }
    }
  }, [isProcessingVideo, businessId, cloudflareVideoId, toast])

  // Handle video deletion
  const handleDeleteVideo = async () => {
    if (!businessId || !existingVideo?.cloudflareVideoId) {
      return
    }

    try {
      setIsDeletingVideo(true)
      const result = await deleteCloudflareVideo(businessId)

      if (result.success) {
        setExistingVideo(null)
        toast({
          title: "Video deleted",
          description: "Your video has been deleted successfully.",
        })
      } else {
        throw new Error(result.error || "Failed to delete video")
      }
    } catch (error) {
      console.error("Error deleting video:", error)
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeletingVideo(false)
    }
  }

  // Get the appropriate aspect ratio class for the video container
  const getAspectRatioClass = () => {
    return aspectRatio === "16:9" ? "aspect-video w-full" : "aspect-[9/16] w-full max-w-[280px] mx-auto"
  }

  if (isLoading) {
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
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!businessId) {
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
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>
            You need to be logged in to manage videos. Please{" "}
            <Link href="/business-login" className="underline">
              log in
            </Link>{" "}
            to continue.
          </AlertDescription>
        </Alert>
      </div>
    )
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

      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <AlertDescription className="flex items-center text-blue-700">
          <Cloud className="h-5 w-5 mr-2" />
          <span>Videos are stored and streamed using Cloudflare Stream for better performance and reliability.</span>
        </AlertDescription>
      </Alert>

      {/* Display existing video if available */}
      {existingVideo && existingVideo.cloudflareVideoId && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Your Video</h2>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteVideo}
              disabled={isDeletingVideo || isProcessingVideo}
              className="flex items-center gap-2"
            >
              {isDeletingVideo ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {isDeletingVideo ? "Deleting..." : "Delete Video"}
            </Button>
          </div>

          {isProcessingVideo ? (
            <Card>
              <CardHeader>
                <CardTitle>Processing Video</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                    <p>Your video is being processed by Cloudflare Stream...</p>
                  </div>
                  <Progress value={processingProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    This may take a few moments depending on the video size.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <CloudflareStreamPlayer
              videoId={existingVideo.cloudflareVideoId}
              aspectRatio={(existingVideo.videoAspectRatio as AspectRatio) || "16:9"}
              title="Your Business Video"
            />
          )}

          <p className="text-sm text-muted-foreground mt-4">
            {isProcessingVideo
              ? "Your video will be available for streaming once processing is complete."
              : "This video is now available for streaming. You can replace it by uploading a new video."}
          </p>
        </div>
      )}

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

      {/* Cloudflare Status */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              <div>
                <CardTitle>Cloudflare Stream</CardTitle>
                <CardDescription>Streaming service status</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkCloudflareConfig}
              disabled={checkingCloudflareConfig}
              className="text-xs"
            >
              {checkingCloudflareConfig ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                "Check Status"
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${cloudflareConfigured ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm">
              {cloudflareConfigured
                ? "Cloudflare Stream is configured and ready to use"
                : "Cloudflare Stream is not configured properly"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Video Upload */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <VideoIcon className="h-5 w-5" />
            <div>
              <CardTitle>{existingVideo ? "Replace Video" : "Upload Video"}</CardTitle>
              <CardDescription>Select a video file to upload to Cloudflare Stream</CardDescription>
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
              <p className="text-xs text-muted-foreground">MP4, MOV, WebM up to {MAX_VIDEO_SIZE_MB}MB</p>
              <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoSelect} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <div className={`w-full overflow-hidden rounded-lg ${getAspectRatioClass()}`}>
                  <video src={videoPreview} controls className="w-full h-full object-cover" />
                </div>
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
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <>
            <Button onClick={handleVideoUpload} disabled={isUploading || !selectedVideo || !cloudflareConfigured}>
              {isUploading ? "Uploading..." : existingVideo ? "Replace Video" : "Upload Video"}
            </Button>
          </>
        </CardFooter>

        {isUploading && (
          <div className="px-6 pb-4">
            <Progress value={uploadProgress} className="h-2" />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-muted-foreground">Uploading to Cloudflare... {Math.round(uploadProgress)}%</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
