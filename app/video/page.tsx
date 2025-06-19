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
  LayoutTemplateIcon as LayoutLandscape,
  LayoutTemplateIcon as LayoutPortrait,
  AlertTriangle,
  Trash2,
} from "lucide-react"
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
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"

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
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

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

    // Reset any previous upload errors
    setUploadError(null)

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

    // Check file type
    const validTypes = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska"]
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `Please select a valid video file (MP4, MOV, WebM, MKV).`,
        variant: "destructive",
      })
      if (videoInputRef.current) videoInputRef.current.value = ""
      return
    }

    setSelectedVideo(file)
    const url = await createPreviewUrl(file)
    setVideoPreview(url)
  }

  // Handle video upload to Cloudflare Stream using fetch instead of XHR
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

    // Reset any previous errors
    setUploadError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Get a direct upload URL if we don't have one
      const uploadData = await getDirectUploadUrl()

      if (!uploadData) {
        throw new Error("Failed to get Cloudflare upload URL")
      }

      // Store the video ID for status polling
      setCloudflareVideoId(uploadData.videoId)

      // Use fetch with a ReadableStream to track progress
      const xhr = new XMLHttpRequest()
      xhr.open("POST", uploadData.uploadUrl)

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(percentComplete)
        }
      })

      // Handle response
      xhr.onload = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            // Upload completed successfully
            toast({
              title: "Video uploaded successfully",
              description: "Your video is being processed and will be available shortly.",
            })

            // Save the video information in our backend
            const result = await saveCloudflareVideo(businessId!, uploadData.videoId, aspectRatio)

            if (result.success) {
              // Reset the form
              setSelectedVideo(null)
              setVideoPreview(null)
              if (videoInputRef.current) videoInputRef.current.value = ""

              // Start polling for video processing status
              setIsProcessingVideo(true)
              setProcessingProgress(10)

              // Immediately try to get the video info
              const media = await getCloudflareBusinessMedia(businessId!)
              if (media && media.cloudflareVideoId) {
                setExistingVideo(media)
                console.log("Initial video data loaded after upload:", media)
              }

              // Trigger revalidation of the customize page so it picks up the new video
              try {
                await fetch("/api/revalidate-customize", { method: "POST" })
              } catch (error) {
                console.log("Could not trigger revalidation:", error)
              }
            } else {
              throw new Error(result.error || "Failed to save video information")
            }
          } catch (error) {
            console.error("Error processing upload response:", error)
            setUploadError(error instanceof Error ? error.message : "Unknown error processing upload")
            toast({
              title: "Upload processing failed",
              description: error instanceof Error ? error.message : "Unknown error processing upload",
              variant: "destructive",
            })
          } finally {
            setIsUploading(false)
            setUploadProgress(0)
          }
        } else {
          // Handle error response
          let errorMessage = `HTTP Error: ${xhr.status}`
          try {
            const errorData = JSON.parse(xhr.responseText)
            if (errorData.errors && errorData.errors.length > 0) {
              errorMessage = `Cloudflare API error: ${errorData.errors[0].message}`
            }
          } catch (e) {
            // If JSON parsing fails, use the response text if available
            if (xhr.responseText) {
              errorMessage = `HTTP Error ${xhr.status}: ${xhr.responseText}`
            }
          }

          console.error("Upload failed:", errorMessage)
          setUploadError(errorMessage)
          setIsUploading(false)
          setUploadProgress(0)

          toast({
            title: "Upload failed",
            description: errorMessage,
            variant: "destructive",
          })
        }
      }

      // Handle network errors
      xhr.onerror = () => {
        const errorMessage = "Network error during upload. Please check your connection and try again."
        console.error(errorMessage)
        setUploadError(errorMessage)
        setIsUploading(false)
        setUploadProgress(0)

        toast({
          title: "Upload failed",
          description: errorMessage,
          variant: "destructive",
        })
      }

      // Create form data and send
      const formData = new FormData()
      formData.append("file", selectedVideo)
      xhr.send(formData)
    } catch (error) {
      console.error("Error preparing upload:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error preparing upload"
      setUploadError(errorMessage)
      setIsUploading(false)
      setUploadProgress(0)

      toast({
        title: "Upload preparation failed",
        description: errorMessage,
        variant: "destructive",
      })
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

  // Get the appropriate class for the upload area based on aspect ratio
  const getUploadAreaClass = () => {
    if (aspectRatio === "16:9") {
      return "border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors w-full max-w-xs mx-auto h-32"
    } else {
      return "border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors w-full max-w-[160px] mx-auto h-64"
    }
  }

  // Get the appropriate class for the video preview container based on aspect ratio
  const getVideoPreviewClass = () => {
    if (aspectRatio === "16:9") {
      return "w-full max-w-xs mx-auto overflow-hidden rounded-lg h-32"
    } else {
      return "w-full max-w-[160px] mx-auto overflow-hidden rounded-lg h-64"
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      {/* Back to Workbench Button */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push("/workbench")}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workbench
          </Button>
        </div>
      </div>

      <main className="flex-1">
        <div className="container max-w-6xl py-8">
          <div className="flex items-center mb-6">
            <h1 className="text-3xl font-bold">Video Management</h1>
          </div>

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
                <div className={getUploadAreaClass()} onClick={() => videoInputRef.current?.click()}>
                  <Upload className="h-6 w-6 mb-1 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Select video file</p>
                  <p className="text-xs text-muted-foreground">MP4, MOV, WebM up to {MAX_VIDEO_SIZE_MB}MB</p>
                  <input
                    type="file"
                    ref={videoInputRef}
                    className="hidden"
                    accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                    onChange={handleVideoSelect}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <div className={getVideoPreviewClass()}>
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

              {/* Display upload error if any */}
              {uploadError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    <div className="font-medium">Upload failed</div>
                    <div className="text-sm mt-1">{uploadError}</div>
                  </AlertDescription>
                </Alert>
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
                  <p className="text-xs text-muted-foreground">
                    Uploading to Cloudflare... {Math.round(uploadProgress)}%
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>

      <MainFooter />
    </div>
  )
}
