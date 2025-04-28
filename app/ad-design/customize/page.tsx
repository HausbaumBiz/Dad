"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Pause } from "lucide-react"
import { ChevronLeft, ChevronRight, X, Trash2 } from "lucide-react"
import { type Coupon, getBusinessCoupons } from "@/app/actions/coupon-actions"
import { type JobListing, getBusinessJobs } from "@/app/actions/job-actions"
import { toast } from "@/components/ui/use-toast"
import {
  getBusinessMedia,
  uploadVideo,
  uploadThumbnail,
  deletePhoto,
  saveMediaSettings,
  type MediaItem,
  uploadPhoto,
} from "@/app/actions/media-actions"
import { saveBusinessAdDesign } from "@/app/actions/business-actions"

import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"

// Add imports for Link component if not already present
import Link from "next/link"

// First, add the import for the FileSizeWarning component
import { FileSizeWarning } from "@/components/file-size-warning"

import { del } from "@vercel/blob"
import { kv } from "@vercel/kv"

interface PhotoItem {
  id: string
  url: string
  name: string
}

export default function CustomizeAdDesignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const designId = searchParams.get("design")
  const colorParam = searchParams.get("color") || "blue"
  const [selectedDesign, setSelectedDesign] = useState<number | null>(designId ? Number.parseInt(designId) : 6)
  const [selectedColor, setSelectedColor] = useState(colorParam)
  const [businessId, setBusinessId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Add state for the dialogs
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  const [isJobsDialogOpen, setIsJobsDialogOpen] = useState(false)

  // Add state for saved coupons and loading state:
  const [savedCoupons, setSavedCoupons] = useState<Coupon[]>([])
  const [isCouponsLoading, setIsCouponsLoading] = useState(false)

  // Add state for job listings and jobs dialog
  const [jobListings, setJobListings] = useState<JobListing[]>([])
  const [isJobsLoading, setIsJobsLoading] = useState(false)

  // Add state for terms and conditions dialog
  const [openDialogId, setOpenDialogId] = useState<string | null>(null)

  // Color mapping
  const colorMap: Record<string, { primary: string; secondary: string }> = {
    blue: { primary: "#007BFF", secondary: "#0056b3" },
    purple: { primary: "#6f42c1", secondary: "#5e37a6" },
    green: { primary: "#28a745", secondary: "#218838" },
    teal: { primary: "#20c997", secondary: "#17a2b8" },
    orange: { primary: "#fd7e14", secondary: "#e65f02" },
    red: { primary: "#dc3545", secondary: "#c82333" },
    black: { primary: "#000000", secondary: "#333333" },
    slategrey: { primary: "#708090", secondary: "#4E5964" },
    brown: { primary: "#8B4513", secondary: "#6B3610" },
  }

  // Get the selected color values
  const colorValues = colorMap[selectedColor] || colorMap.blue

  const [formData, setFormData] = useState({
    businessName: "Business Name",
    address: "123 Business St, City, ST 12345",
    phone: "(555) 123-4567",
    hours: "Mon-Fri: 9AM-5PM\nSat: 10AM-3PM",
    website: "www.businessname.com",
    freeText: "We offer professional services with 10+ years of experience in the industry.",
    videoFile: null,
    thumbnailFile: null,
  })

  // Add state variables for field visibility
  const [hiddenFields, setHiddenFields] = useState<{
    address: boolean
    phone: boolean
    hours: boolean
    website: boolean
    video: boolean
    thumbnail: boolean
    photoAlbum: boolean
    freeText: boolean
  }>({
    address: false,
    phone: false,
    hours: false,
    website: false,
    video: false,
    thumbnail: false,
    photoAlbum: false,
    freeText: false,
  })

  // Add a handler function for toggling field visibility
  const toggleFieldVisibility = (field: keyof typeof hiddenFields) => {
    setHiddenFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  // Add sample coupons data
  const sampleCoupons = [
    {
      id: "1",
      businessName: formData.businessName,
      title: "Summer Special",
      discount: "20% OFF",
      description: "Get 20% off on all summer products",
      code: "SUMMER20",
      startDate: "2025-06-01",
      expirationDate: "2025-08-31",
      terms: "No cash value. Cannot be combined with other offers.",
    },
    {
      id: "2",
      businessName: formData.businessName,
      title: "New Customer",
      discount: "$10 OFF",
      description: "First-time customers get $10 off their purchase",
      code: "NEWCUST10",
      startDate: "2025-01-01",
      expirationDate: "2025-12-31",
      terms: "Valid for first-time customers only.",
    },
  ]

  // Photo album state
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [isPhotoAlbumOpen, setIsPhotoAlbumOpen] = useState(false)

  // Current upload state
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(true)

  // Ref for file input to reset it
  const fileInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const verticalVideoRef = useRef<HTMLVideoElement>(null)
  const mobileVideoRef = useRef<HTMLVideoElement>(null)

  // Refs for coupons
  const couponRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Add these state variables after the other state declarations
  const [videoRemoved, setVideoRemoved] = useState(false)
  const [thumbnailRemoved, setThumbnailRemoved] = useState(false)

  // Add these new state variables after the other state declarations
  const [queuedPhotos, setQueuedPhotos] = useState<File[]>([])
  const [queuedPhotosPreviews, setQueuedPhotosPreviews] = useState<string[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [queuedThumbnailFile, setQueuedThumbnailFile] = useState<File | null>(null)
  const [queuedThumbnailPreview, setQueuedThumbnailPreview] = useState<string | null>(null)

  // Set the color based on URL parameter
  useEffect(() => {
    if (colorParam && colorMap[colorParam]) {
      setSelectedColor(colorParam)
    }
  }, [colorParam])

  // Fetch business ID and load saved data
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        // In a real app, you would get this from the user session
        // For now, we'll use a demo business ID
        const id = "demo-business"
        setBusinessId(id)

        // Load saved media
        await loadSavedMedia(id)

        // Load business data
        await loadBusinessData(id)

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading business data:", error)
        toast({
          title: "Error",
          description: "Failed to load your business data. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchBusinessData()
  }, [])

  // Add this useEffect after the other useEffect hooks:
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Load saved media for the business
  const loadSavedMedia = async (id: string) => {
    try {
      const media = await getBusinessMedia(id)

      if (media) {
        // Set video if available
        if (media.videoUrl) {
          setVideoPreview(media.videoUrl)
        }

        // Set thumbnail if available
        if (media.thumbnailUrl) {
          setThumbnailPreview(media.thumbnailUrl)
        }

        // Set photo album if available
        if (media.photoAlbum && Array.isArray(media.photoAlbum) && media.photoAlbum.length > 0) {
          const loadedPhotos = media.photoAlbum.map((photo: MediaItem) => ({
            id: photo.id,
            url: photo.url,
            name: photo.filename || "Unnamed photo",
          }))
          setPhotos(loadedPhotos)
        } else {
          // Initialize with empty array if no photos or invalid data
          setPhotos([])
        }
      }
    } catch (error) {
      console.error("Error loading saved media:", error)
      // Initialize with empty values on error
      setVideoPreview(null)
      setThumbnailPreview(null)
      setPhotos([])

      toast({
        title: "Warning",
        description: "There was an issue loading your saved media. Starting with empty state.",
        variant: "destructive",
      })
    }
  }

  // Load business data
  const loadBusinessData = async (id: string) => {
    try {
      // In a real app, you would fetch the business data from your API
      // For now, we'll use mock data

      // You could fetch business details here
      // const businessDetails = await getBusinessDetails(id)

      // For now, we'll just set some default values if none are loaded
      setFormData((prev) => ({
        ...prev,
        businessName: "Your Business Name", // Replace with actual data
        address: "Your Business Address", // Replace with actual data
        phone: "Your Business Phone", // Replace with actual data
        hours: "Your Business Hours", // Replace with actual data
        website: "Your Business Website", // Replace with actual data
        freeText: "Your Business Description", // Replace with actual data
      }))
    } catch (error) {
      console.error("Error loading business data:", error)
    }
  }

  // Modify the handleImageUpload function to handle mobile differently
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]

      // For desktop, keep the existing behavior
      if (!isMobile) {
        setImageFile(file)

        // Create preview URL
        const reader = new FileReader()
        reader.onload = (event) => {
          setImagePreview(event.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
      // For mobile, add to queue instead of immediate upload
      else {
        // Create preview URL
        const reader = new FileReader()
        reader.onload = (event) => {
          setQueuedPhotosPreviews((prev) => [...prev, event.target?.result as string])
        }
        reader.readAsDataURL(file)

        // Add to queue
        setQueuedPhotos((prev) => [...prev, file])

        // Reset the file input to allow selecting the same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }

        toast({
          title: "Photo queued",
          description: "Photo will be uploaded when you save",
        })
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setVideoFile(file)
      setFormData((prev) => ({ ...prev, videoFile: file }))

      // Create preview URL
      const url = URL.createObjectURL(file)
      setVideoPreview(url)

      // Reset playing state when a new video is uploaded
      setIsPlaying(false)
      setShowThumbnail(true)
    }
  }

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        const previewUrl = event.target?.result as string

        // For mobile, queue the thumbnail instead of immediate upload
        if (isMobile) {
          setQueuedThumbnailFile(file)
          setQueuedThumbnailPreview(previewUrl)

          // If there's a previous thumbnail, mark it for replacement
          if (thumbnailPreview) {
            // We don't actually remove it yet, just show the user it will be replaced
            toast({
              title: "Thumbnail queued",
              description: "This will replace your current thumbnail when you save",
            })
          } else {
            toast({
              title: "Thumbnail queued",
              description: "Thumbnail will be uploaded when you save",
            })
          }

          // Reset the file input to allow selecting the same file again
          if (thumbnailInputRef.current) {
            thumbnailInputRef.current.value = ""
          }
        } else {
          // For desktop, keep the existing behavior
          setThumbnailFile(file)
          setThumbnailPreview(previewUrl)
          setFormData((prev) => ({ ...prev, thumbnailFile: file }))

          // Ensure thumbnail is shown
          setShowThumbnail(true)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Function to handle saving coupon as image
  const handleSaveCoupon = (couponId: string) => {
    const couponElement = couponRefs.current[couponId]
    if (!couponElement) return

    // Show saving message
    alert("Saving coupon to your device...")

    // In a real implementation, you would use html2canvas to capture the coupon as an image
    // and then create a download link or use the Web Share API for mobile

    // Example implementation (commented out as it requires html2canvas library):
    /*
    import html2canvas from 'html2canvas';
    
    html2canvas(couponElement).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      
      // For mobile devices, try to use the Web Share API
      if (navigator.share && navigator.canShare) {
        fetch(imgData)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], "coupon.png", { type: "image/png" });
            navigator.share({
              files: [file],
              title: 'Your Coupon',
              text: 'Here is your saved coupon',
            }).catch(err => {
              // Fallback to download if sharing fails
              downloadImage(imgData);
            });
          });
      } else {
        // For desktop, create a download link
        downloadImage(imgData);
      }
    });
    
    function downloadImage(imgData) {
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `coupon-${couponId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    */
  }

  // Video control functions
  const handlePlayVideo = () => {
    console.log("Play video triggered")

    // Hide thumbnail when play is triggered
    setShowThumbnail(false)

    // Set isPlaying to true immediately to update UI
    setIsPlaying(true)

    // Get all video elements
    const videoElements = [videoRef.current, verticalVideoRef.current, mobileVideoRef.current].filter(Boolean)

    // Reset all videos to beginning to ensure consistent playback
    videoElements.forEach((video) => {
      if (video) {
        video.currentTime = 0
      }
    })

    // Play all videos (only one will be visible at a time)
    videoElements.forEach((video) => {
      if (video) {
        // Make sure audio is enabled
        video.muted = false

        const playPromise = video.play()

        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Video playback started successfully")
            })
            .catch((error) => {
              console.error("Error playing video:", error)
              // If all videos fail to play, show thumbnail again
              if (videoElements.every((v) => v.paused)) {
                setShowThumbnail(true)
                setIsPlaying(false)
              }
            })
        }
      }
    })
  }

  const handlePauseVideo = () => {
    const videoElements = [videoRef.current, verticalVideoRef.current, mobileVideoRef.current]

    videoElements.forEach((video) => {
      if (video) {
        video.pause()
      }
    })

    setIsPlaying(false)
    // Don't show thumbnail on pause, only when video ends or before it starts
  }

  // Add video end handler
  useEffect(() => {
    // Get all video elements that currently exist in the DOM
    const videoElements = [videoRef.current, verticalVideoRef.current, mobileVideoRef.current].filter(Boolean)

    const handleVideoEnd = () => {
      console.log("Video ended, showing thumbnail")
      setIsPlaying(false)
      setShowThumbnail(true) // Show thumbnail when video ends
    }

    // Add event listeners to all video elements
    videoElements.forEach((video) => {
      if (video) {
        // Remove any existing event listeners first to avoid duplicates
        video.removeEventListener("ended", handleVideoEnd)

        // Add the event listener for video end
        video.addEventListener("ended", handleVideoEnd)

        // Also monitor the currentTime to detect when video is near the end
        // This is a backup in case the ended event doesn't fire properly
        const timeUpdateHandler = () => {
          if (video.currentTime >= video.duration - 0.2 && video.duration > 0) {
            console.log(`Video near end: ${video.currentTime}/${video.duration}`)
            handleVideoEnd()
          }
        }

        video.removeEventListener("timeupdate", timeUpdateHandler)
        video.addEventListener("timeupdate", timeUpdateHandler)
      }
    })

    return () => {
      // Clean up all event listeners
      videoElements.forEach((video) => {
        if (video) {
          video.removeEventListener("ended", handleVideoEnd)
          // Remove all timeupdate listeners
          const clone = video.cloneNode(true)
          if (video.parentNode) {
            video.parentNode.replaceChild(clone, video)
          }
        }
      })
    }
  }, [videoRef.current, verticalVideoRef.current, mobileVideoRef.current])

  // Add a function to handle removing queued photos
  const handleRemoveQueuedPhoto = (index: number) => {
    setQueuedPhotos((prev) => prev.filter((_, i) => i !== index))
    setQueuedPhotosPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveQueuedThumbnail = () => {
    setQueuedThumbnailFile(null)
    setQueuedThumbnailPreview(null)
  }

  const handleAddToPhotoAlbum = async () => {
    if (imageFile && imagePreview && businessId) {
      try {
        // Create FormData for upload
        const formData = new FormData()
        formData.append("businessId", businessId)
        formData.append("photo", imageFile)

        // Upload the photo
        const result = await uploadPhoto(formData)

        if (result.success && result.photo) {
          // Add the new photo to the album
          const newPhoto: PhotoItem = {
            id: result.photo.id,
            url: result.photo.url,
            name: result.photo.filename,
          }

          setPhotos((prev) => [...prev, newPhoto])

          // Reset the current upload
          setImageFile(null)
          setImagePreview(null)

          // Reset the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = ""
          }

          toast({
            title: "Success",
            description: "Photo added to album successfully!",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to upload photo. Please try again.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error uploading photo:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleRemovePhoto = async (id: string) => {
    if (!businessId) return

    try {
      const result = await deletePhoto(businessId, id)

      if (result.success) {
        setPhotos((prev) => prev.filter((photo) => photo.id !== id))

        // If we're removing the current photo and it's the last one, adjust the index
        if (photos.length > 0) {
          if (currentPhotoIndex >= photos.length - 1) {
            setCurrentPhotoIndex(Math.max(0, photos.length - 2))
          }
        }

        toast({
          title: "Success",
          description: "Photo removed from album.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove photo. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing photo:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleOpenPhotoAlbum = () => {
    if (photos.length > 0) {
      setIsPhotoAlbumOpen(true)
    } else {
      alert("Your photo album is empty. Please add photos first.")
    }
  }

  const handleNextPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
    }
  }

  const handlePrevPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!businessId) {
      toast({
        title: "Error",
        description: "Business ID is missing. Please try again.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)

      // Handle video removal if requested
      if (videoRemoved) {
        try {
          const existingMedia = await getBusinessMedia(businessId)
          if (existingMedia?.videoId) {
            await del(existingMedia.videoId)
            // Update KV to remove video references
            await kv.hset(`business:${businessId}:media`, {
              videoUrl: null,
              videoContentType: null,
              videoId: null,
            })
          }
        } catch (error) {
          console.error("Error removing video:", error)
        }
      }

      // Handle thumbnail removal if requested
      if (thumbnailRemoved) {
        try {
          const existingMedia = await getBusinessMedia(businessId)
          if (existingMedia?.thumbnailId) {
            await del(existingMedia.thumbnailId)
            // Update KV to remove thumbnail references
            await kv.hset(`business:${businessId}:media`, {
              thumbnailUrl: null,
              thumbnailId: null,
            })
          }
        } catch (error) {
          console.error("Error removing thumbnail:", error)
        }
      }

      // Upload video if selected
      const videoUrl = null
      const thumbnailUrl = null

      // Upload video if selected
      if (formData.videoFile) {
        try {
          // Check file size before attempting upload
          const fileSizeMB = formData.videoFile.size / (1024 * 1024)
          if (fileSizeMB > 100) {
            // 100MB limit
            toast({
              title: "Error",
              description: `Video file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is 100MB.`,
              variant: "destructive",
            })
            setIsLoading(false)
            return
          }

          const videoFormData = new FormData()
          videoFormData.append("businessId", businessId)
          videoFormData.append("video", formData.videoFile)
          videoFormData.append("designId", selectedDesign?.toString() || "1")

          const videoResult = await uploadVideo(videoFormData)

          if (!videoResult.success) {
            throw new Error(videoResult.error || "Failed to upload video")
          }
        } catch (error: any) {
          console.error("Error uploading video:", error)
          toast({
            title: "Error",
            description: error.message || "Failed to upload video. Please try a smaller file or different format.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }

      // Upload thumbnail if selected
      if (formData.thumbnailFile) {
        try {
          // Check file size before attempting upload
          const fileSizeMB = formData.thumbnailFile.size / (1024 * 1024)
          if (fileSizeMB > 10) {
            // 10MB limit
            toast({
              title: "Error",
              description: `Thumbnail file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is 10MB.`,
              variant: "destructive",
            })
            setIsLoading(false)
            return
          }

          const thumbnailFormData = new FormData()
          thumbnailFormData.append("businessId", businessId)
          thumbnailFormData.append("thumbnail", formData.thumbnailFile)

          const thumbnailResult = await uploadThumbnail(thumbnailFormData)

          if (!thumbnailResult.success) {
            throw new Error(thumbnailResult.error || "Failed to upload thumbnail")
          }
        } catch (error: any) {
          console.error("Error uploading thumbnail:", error)
          toast({
            title: "Error",
            description: error.message || "Failed to upload thumbnail. Please try a smaller file or different format.",
            variant: "destructive",
          })
          setIsLoading(false)
          return
        }
      }

      // Upload queued thumbnail if any (for mobile)
      if (queuedThumbnailFile) {
        try {
          // Check file size before attempting upload
          const fileSizeMB = queuedThumbnailFile.size / (1024 * 1024)
          if (fileSizeMB > 10) {
            // 10MB limit
            toast({
              title: "Error",
              description: `Thumbnail file is too large (${fileSizeMB.toFixed(2)}MB). Maximum allowed size is 10MB.`,
              variant: "destructive",
            })
          } else {
            // First, delete the existing thumbnail if there is one
            try {
              const existingMedia = await getBusinessMedia(businessId)
              if (existingMedia?.thumbnailId) {
                await del(existingMedia.thumbnailId)
                // We don't need to update KV here as the new upload will overwrite the references
              }
            } catch (error) {
              console.error("Error removing existing thumbnail:", error)
              // Continue with upload even if deletion fails
            }

            const thumbnailFormData = new FormData()
            thumbnailFormData.append("businessId", businessId)
            thumbnailFormData.append("thumbnail", queuedThumbnailFile)

            const thumbnailResult = await uploadThumbnail(thumbnailFormData)

            if (thumbnailResult.success) {
              // Update the UI with the new thumbnail
              setThumbnailPreview(thumbnailResult.url)
              setThumbnailRemoved(false) // Reset the removed flag since we've added a new one

              toast({
                title: "Success",
                description: "Thumbnail uploaded successfully!",
              })
            } else {
              toast({
                title: "Error",
                description: thumbnailResult.error || "Failed to upload thumbnail. Please try again.",
                variant: "destructive",
              })
            }
          }
        } catch (error: any) {
          console.error("Error uploading queued thumbnail:", error)
          toast({
            title: "Error",
            description: error.message || "Failed to upload thumbnail. Please try again.",
            variant: "destructive",
          })
        } finally {
          // Clear the queued thumbnail
          setQueuedThumbnailFile(null)
          setQueuedThumbnailPreview(null)
        }
      }

      // Save hidden fields settings
      await saveMediaSettings(businessId, { hiddenFields })

      // Save business ad design data
      await saveBusinessAdDesign(businessId, {
        designId: selectedDesign,
        colorScheme: selectedColor,
        businessInfo: formData,
      })

      // Save to localStorage for client-side persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("hausbaum_selected_design", selectedDesign?.toString() || "")
        localStorage.setItem("hausbaum_selected_color", selectedColor)
      }

      // Upload queued photos if any
      if (queuedPhotos.length > 0) {
        setIsLoading(true)

        // Upload each queued photo
        for (const file of queuedPhotos) {
          try {
            const formData = new FormData()
            formData.append("businessId", businessId)
            formData.append("photo", file)

            const result = await uploadPhoto(formData)

            if (result.success && result.photo) {
              // Add the new photo to the album
              const newPhoto: PhotoItem = {
                id: result.photo.id,
                url: result.photo.url,
                name: result.photo.filename,
              }

              setPhotos((prev) => [...prev, newPhoto])
            }
          } catch (error) {
            console.error("Error uploading queued photo:", error)
          }
        }

        // Clear the queue after uploading
        setQueuedPhotos([])
        setQueuedPhotosPreviews([])
      }

      toast({
        title: "Success",
        description: "Your ad design has been saved successfully!",
      })

      // Redirect to the workbench or another page
      // router.push("/workbench")
    } catch (error) {
      console.error("Error saving ad design:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save your ad design. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Custom video control buttons component
  const VideoControls = () => (
    <div className="flex justify-center mt-2 space-x-4">
      <button
        onClick={handlePlayVideo}
        className={`p-2 rounded-full ${isPlaying ? "opacity-50" : "opacity-100"}`}
        style={{ backgroundColor: colorValues.primary }}
        disabled={isPlaying}
      >
        <Play size={20} className="text-white" />
      </button>
      <button
        onClick={handlePauseVideo}
        className={`p-2 rounded-full ${!isPlaying ? "opacity-50" : "opacity-100"}`}
        style={{ backgroundColor: colorValues.primary }}
        disabled={!isPlaying}
      >
        <Pause size={20} className="text-white" />
      </button>
    </div>
  )

  // Update the fetchSavedCoupons function to properly fetch coupons

  const fetchSavedCoupons = async () => {
    setIsCouponsLoading(true)
    try {
      // Get coupons using the getBusinessCoupons function
      const result = await getBusinessCoupons()

      if (result.success && result.coupons) {
        setSavedCoupons(result.coupons)
      } else if (result.error) {
        console.error("Failed to fetch coupons:", result.error)
        toast({
          title: "Error",
          description: "Failed to load coupons. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching coupons:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading coupons.",
        variant: "destructive",
      })
    } finally {
      setIsCouponsLoading(false)
    }
  }

  // Add the fetchJobListings function after the fetchSavedCoupons function
  const fetchJobListings = async () => {
    setIsJobsLoading(true)
    try {
      // For now, use a hardcoded business ID - in a real application,
      // this would come from the authenticated user's session
      const businessId = "demo-business"

      const jobs = await getBusinessJobs(businessId)

      // Add some validation to ensure we have valid job objects
      const validJobs = jobs.filter((job) => {
        // Basic validation to ensure required fields exist
        return job && job.id && job.jobTitle && job.businessName
      })

      setJobListings(validJobs)

      if (validJobs.length < jobs.length) {
        console.warn(`Filtered out ${jobs.length - validJobs.length} invalid job listings`)
      }
    } catch (error) {
      console.error("Error fetching job listings:", error)
      toast({
        title: "Error",
        description: "Failed to load job listings. Please try again.",
        variant: "destructive",
      })
      // Set empty array to prevent UI issues
      setJobListings([])
    } finally {
      setIsJobsLoading(false)
    }
  }

  useEffect(() => {
    if (isSavingsDialogOpen) {
      fetchSavedCoupons()
    }
  }, [isSavingsDialogOpen])

  // Add this useEffect to load job listings when the dialog opens
  useEffect(() => {
    if (isJobsDialogOpen) {
      fetchJobListings()
    }
  }, [isJobsDialogOpen])

  // Feature buttons component
  const FeatureButtons = () => (
    <div className="flex justify-center gap-4 p-4 bg-gray-100 rounded-b-lg">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsSavingsDialogOpen(true)}
        className="flex items-center gap-2"
        style={{ borderColor: colorValues.primary, color: colorValues.primary }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
          <path d="M7 7h.01" />
        </svg>
        Savings
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsJobsDialogOpen(true)}
        className="flex items-center gap-2"
        style={{ borderColor: colorValues.primary, color: colorValues.primary }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
        Job Opportunities
      </Button>
    </div>
  )

  // Update the renderDesignPreview function to handle all designs with the selected color
  const renderDesignPreview = () => {
    // Render the selected design based on the designId
    if (selectedDesign === 3) {
      // Emerald Valley design (mirror of Purple Horizon)
      return (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Selected Design: Design 3</h2>
          <div className="overflow-hidden rounded-lg shadow-md">
            <Card className="relative overflow-hidden">
              <div
                className="p-5 text-white"
                style={{
                  background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                }}
              >
                <h3 className="text-xl font-bold text-center">{formData.businessName}</h3>
              </div>

              {/* Business Info Section - Top section */}
              <div className="p-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {!hiddenFields.address && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Address</p>
                        <p className="text-sm text-gray-600">{formData.address}</p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.phone && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Phone</p>
                        <p className="text-sm text-gray-600">{formData.phone}</p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.hours && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Hours</p>
                        {formData.hours.split("\n").map((line, i) => (
                          <p key={i} className="text-sm text-gray-600">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hiddenFields.website && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Website</p>
                        <p className="text-sm underline" style={{ color: colorValues.primary }}>
                          {formData.website}
                        </p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.photoAlbum && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm md:col-span-2">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <circle cx="9" cy="9" r="2"></circle>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Photo Album</p>
                        <button
                          className="text-sm underline cursor-pointer"
                          style={{ color: colorValues.primary }}
                          onClick={handleOpenPhotoAlbum}
                        >
                          Browse Photos {photos.length > 0 && `(${photos.length})`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Free Text Section */}
              {!hiddenFields.freeText && formData.freeText && (
                <div className="w-full bg-white p-4 text-center border-t border-gray-100">
                  <p className="text-lg font-medium" style={{ color: colorValues.primary }}>
                    {formData.freeText}
                  </p>
                </div>
              )}

              {/* Landscape Video Player - Bottom section */}
              {!hiddenFields.video && (
                <div className="w-full bg-gradient-to-b from-gray-50 to-gray-100 p-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="relative mx-auto w-full max-w-[392px] h-auto aspect-video bg-white rounded-lg border-2 shadow-lg overflow-hidden"
                      style={{ borderColor: colorValues.primary }}
                    >
                      {/* Thumbnail overlay */}
                      {!hiddenFields.thumbnail && thumbnailPreview && showThumbnail && (
                        <div className="absolute inset-0 z-20">
                          <img
                            src={thumbnailPreview || "/placeholder.svg?height=220&width=392"}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {videoPreview ? (
                        <video
                          ref={videoRef}
                          src={videoPreview}
                          className="absolute inset-0 w-full h-full object-cover"
                          onClick={isPlaying ? handlePauseVideo : handlePlayVideo}
                          muted
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          onClick={handlePlayVideo}
                        >
                          <div
                            className="rounded-full p-3 shadow-lg"
                            style={{
                              background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white"
                            >
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        16:9 ratio
                      </div>
                    </div>

                    {/* Custom video controls */}
                    {videoPreview && <VideoControls />}
                  </div>
                </div>
              )}

              <div className="p-3 text-center text-white" style={{ backgroundColor: colorValues.primary }}>
                <p className="font-medium">Design 3</p>
              </div>
              {/* Add Feature Buttons */}
              <FeatureButtons />
            </Card>
          </div>
        </div>
      )
    } else if (selectedDesign === 4) {
      // Amber Sunrise design (mirror of Teal Waves)
      return (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Selected Design: Design 4</h2>
          <div className="overflow-hidden rounded-lg shadow-md">
            <Card className="relative overflow-hidden">
              <div
                className="p-5 text-white"
                style={{
                  background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                }}
              >
                <h3 className="text-xl font-bold text-center">{formData.businessName}</h3>
              </div>
              <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                {/* Video Player - Positioned absolutely on larger screens (LEFT SIDE) */}
                {!hiddenFields.video && (
                  <div
                    className="hidden lg:block absolute top-[40%] left-4 transform -translate-y-1/2 w-[220px] h-[392px] bg-white rounded-lg border-2 shadow-lg overflow-hidden"
                    style={{ borderColor: colorValues.primary }}
                  >
                    <div className="relative w-full h-full">
                      {/* Thumbnail overlay */}
                      {!hiddenFields.thumbnail && thumbnailPreview && showThumbnail && (
                        <div className="absolute inset-0 z-20">
                          <img
                            src={thumbnailPreview || "/placeholder.svg?height=392&width=220"}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {videoPreview ? (
                        <video
                          ref={verticalVideoRef}
                          src={videoPreview}
                          className="absolute inset-0 w-full h-full object-cover z-10" // Add z-index to ensure it's on top
                          onClick={isPlaying ? handlePauseVideo : handlePlayVideo}
                          muted
                          playsInline // Add playsInline for better mobile support
                          style={{ pointerEvents: "auto" }} // Ensure clicks are registered
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          onClick={handlePlayVideo}
                        >
                          <div
                            className="rounded-full p-3 shadow-lg"
                            style={{
                              background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white"
                            >
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom video controls for desktop - positioned below video */}
                {!hiddenFields.video && videoPreview && (
                  <div className="hidden lg:block absolute left-4 top-[calc(40%+205px)] w-[220px]">
                    <VideoControls />
                  </div>
                )}

                {/* Business info shifted to the right */}
                <div className={`space-y-4 ${!hiddenFields.video ? "lg:ml-[240px]" : ""}`}>
                  {!hiddenFields.address && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Address</p>
                        <p className="text-sm text-gray-600">{formData.address}</p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.phone && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Phone</p>
                        <p className="text-sm text-gray-600">{formData.phone}</p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.hours && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Hours</p>
                        {formData.hours.split("\n").map((line, i) => (
                          <p key={i} className="text-sm text-gray-600">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hiddenFields.website && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Website</p>
                        <p className="text-sm underline" style={{ color: colorValues.primary }}>
                          {formData.website}
                        </p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.photoAlbum && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <circle cx="9" cy="9" r="2"></circle>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Photo Album</p>
                        <button
                          className="text-sm underline cursor-pointer"
                          style={{ color: colorValues.primary }}
                          onClick={handleOpenPhotoAlbum}
                        >
                          Browse Photos {photos.length > 0 && `(${photos.length})`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Free Text Section */}
              {!hiddenFields.freeText && formData.freeText && (
                <div className="w-full bg-white p-4 text-center border-t border-gray-100">
                  <p className="text-lg font-medium" style={{ color: colorValues.primary }}>
                    {formData.freeText}
                  </p>
                </div>
              )}

              <div className="p-3 text-center text-white" style={{ backgroundColor: colorValues.primary }}>
                <p className="font-medium">Design 4</p>
              </div>

              {/* Add Feature Buttons */}
              <FeatureButtons />
            </Card>

            {/* Video Space for Mobile - Only shown on small screens */}
            {!hiddenFields.video && (
              <div className="lg:hidden w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-b-lg overflow-hidden flex items-center justify-center">
                <div className="relative w-full py-6">
                  <div className="mx-auto w-[220px] flex flex-col items-center">
                    <div
                      className="w-full h-[392px] bg-white rounded-lg border-2 flex flex-col items-center justify-center overflow-hidden"
                      style={{ borderColor: colorValues.primary }}
                    >
                      <div className="relative w-full h-full">
                        {/* Thumbnail overlay for mobile */}
                        {!hiddenFields.thumbnail && thumbnailPreview && showThumbnail && (
                          <div className="absolute inset-0 z-20">
                            <img
                              src={thumbnailPreview || "/placeholder.svg?height=392&width=220"}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {videoPreview ? (
                          <video
                            ref={mobileVideoRef}
                            src={videoPreview}
                            className="absolute inset-0 w-full h-full object-cover z-10" // Add z-index to ensure it's on top
                            onClick={isPlaying ? handlePauseVideo : handlePlayVideo}
                            muted
                            playsInline
                            style={{ pointerEvents: "auto" }} // Ensure clicks are registered
                          />
                        ) : (
                          <div
                            className="absolute inset-0 flex items-center justify-center cursor-pointer"
                            onClick={handlePlayVideo}
                          >
                            <div
                              className="rounded-full p-3 shadow-lg"
                              style={{
                                background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-white"
                              >
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom video controls for mobile */}
                    {videoPreview && <VideoControls />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    } else if (selectedDesign === 2) {
      // Purple Horizon design with landscape video (16:9)
      return (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Selected Design: Design 2</h2>
          <div className="overflow-hidden rounded-lg shadow-md">
            <Card className="relative overflow-hidden">
              <div
                className="p-5 text-white"
                style={{
                  background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                }}
              >
                <h3 className="text-xl font-bold text-center">{formData.businessName}</h3>
              </div>

              {/* Landscape Video Player - Top section */}
              {!hiddenFields.video && (
                <div className="w-full bg-gradient-to-b from-gray-100 to-gray-50 p-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="relative mx-auto w-full max-w-[392px] h-auto aspect-video bg-white rounded-lg border-2 shadow-lg overflow-hidden"
                      style={{ borderColor: colorValues.primary }}
                    >
                      {/* Thumbnail overlay */}
                      {!hiddenFields.thumbnail && thumbnailPreview && showThumbnail && (
                        <div className="absolute inset-0 z-20">
                          <img
                            src={thumbnailPreview || "/placeholder.svg?height=220&width=392"}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      {videoPreview ? (
                        <video
                          ref={videoRef}
                          src={videoPreview}
                          className="absolute inset-0 w-full h-full object-cover"
                          onClick={isPlaying ? handlePauseVideo : handlePlayVideo}
                          muted
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          onClick={handlePlayVideo}
                        >
                          <div
                            className="rounded-full p-3 shadow-lg"
                            style={{
                              background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                            }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="32"
                              height="32"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-white"
                            >
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                        16:9 ratio
                      </div>
                    </div>

                    {/* Custom video controls */}
                    {videoPreview && <VideoControls />}
                  </div>
                </div>
              )}

              {/* Business Info Section */}
              <div className="p-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {!hiddenFields.address && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Address</p>
                        <p className="text-sm text-gray-600">{formData.address}</p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.phone && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Phone</p>
                        <p className="text-sm text-gray-600">{formData.phone}</p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.hours && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Hours</p>
                        {formData.hours.split("\n").map((line, i) => (
                          <p key={i} className="text-sm text-gray-600">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {!hiddenFields.website && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Website</p>
                        <p className="text-sm underline" style={{ color: colorValues.primary }}>
                          {formData.website}
                        </p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.photoAlbum && (
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg shadow-sm md:col-span-2">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <circle cx="9" cy="9" r="2"></circle>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Photo Album</p>
                        <button
                          className="text-sm underline cursor-pointer"
                          style={{ color: colorValues.primary }}
                          onClick={handleOpenPhotoAlbum}
                        >
                          Browse Photos {photos.length > 0 && `(${photos.length})`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Free Text Section */}
              {!hiddenFields.freeText && formData.freeText && (
                <div className="w-full bg-white p-4 text-center border-t border-gray-100">
                  <p className="text-lg font-medium" style={{ color: colorValues.primary }}>
                    {formData.freeText}
                  </p>
                </div>
              )}

              <div className="p-3 text-center text-white" style={{ backgroundColor: colorValues.primary }}>
                <p className="font-medium">Design 2</p>
              </div>

              {/* Add Feature Buttons */}
              <FeatureButtons />
            </Card>
          </div>
        </div>
      )
    } else {
      // Default Teal Waves design (design #1 or #6) with portrait video (9:16)
      return (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Selected Design: Design 1</h2>
          <div className="overflow-hidden rounded-lg shadow-md relative">
            <Card className="relative overflow-hidden">
              <div
                className="p-5 text-white"
                style={{
                  background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                }}
              >
                <h3 className="text-xl font-bold text-center">{formData.businessName}</h3>
              </div>
              <div className="p-6 bg-gradient-to-b from-white to-gray-50">
                <div className="space-y-4">
                  {!hiddenFields.address && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Address</p>
                        <p className="text-sm text-gray-600">{formData.address}</p>
                      </div>
                    </div>
                  )}
                  {!hiddenFields.phone && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Phone</p>
                        <p className="text-sm text-gray-600">{formData.phone}</p>
                      </div>
                    </div>
                  )}
                  {!hiddenFields.hours && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Hours</p>
                        {formData.hours.split("\n").map((line, i) => (
                          <p key={i} className="text-sm text-gray-600">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {!hiddenFields.website && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Website</p>
                        <p className="text-sm underline" style={{ color: colorValues.primary }}>
                          {formData.website}
                        </p>
                      </div>
                    </div>
                  )}
                  {!hiddenFields.photoAlbum && (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-gray-100 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: colorValues.primary }}
                        >
                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                          <circle cx="9" cy="9" r="2"></circle>
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">Photo Album</p>
                        <button
                          className="text-sm underline cursor-pointer"
                          style={{ color: colorValues.primary }}
                          onClick={handleOpenPhotoAlbum}
                        >
                          Browse Photos {photos.length > 0 && `(${photos.length})`}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Free Text Section */}
                {!hiddenFields.freeText && formData.freeText && (
                  <div className="w-full bg-white p-4 text-center border-t border-gray-100">
                    <p className="text-lg font-medium" style={{ color: colorValues.primary }}>
                      {formData.freeText}
                    </p>
                  </div>
                )}
              </div>

              {/* Video Player - Positioned absolutely on larger screens */}
              {!hiddenFields.video && (
                <div
                  className="hidden lg:block absolute top-[40%] right-4 transform -translate-y-1/2 w-[220px] h-[392px] bg-white rounded-lg border-2 shadow-lg overflow-hidden"
                  style={{ borderColor: colorValues.primary }}
                >
                  <div className="relative w-full h-full">
                    {/* Thumbnail overlay */}
                    {!hiddenFields.thumbnail && thumbnailPreview && showThumbnail && (
                      <div className="absolute inset-0 z-20">
                        <img
                          src={thumbnailPreview || "/placeholder.svg?height=392&width=220"}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {videoPreview ? (
                      <video
                        ref={verticalVideoRef}
                        src={videoPreview}
                        className="absolute inset-0 w-full h-full object-cover z-10" // Add z-index to ensure it's on top
                        onClick={isPlaying ? handlePauseVideo : handlePlayVideo}
                        muted
                        playsInline // Add playsInline for better mobile support
                        style={{ pointerEvents: "auto" }} // Ensure clicks are registered
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center cursor-pointer"
                        onClick={handlePlayVideo}
                      >
                        <div
                          className="rounded-full p-3 shadow-lg"
                          style={{
                            background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-white"
                          >
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom video controls for desktop - positioned below video */}
              {!hiddenFields.video && videoPreview && (
                <div className="hidden lg:block absolute right-4 top-[calc(40%+205px)] w-[220px]">
                  <VideoControls />
                </div>
              )}

              <div className="p-3 text-center text-white" style={{ backgroundColor: colorValues.primary }}>
                <p className="font-medium">Design 1</p>
              </div>

              {/* Add Feature Buttons */}
              <FeatureButtons />
            </Card>

            {/* Video Space for Mobile - Only shown on small screens */}
            {!hiddenFields.video && (
              <div className="lg:hidden w-full bg-gradient-to-b from-gray-100 to-gray-200 rounded-b-lg overflow-hidden flex items-center justify-center">
                <div className="relative w-full py-6">
                  <div className="mx-auto w-[220px] flex flex-col items-center">
                    <div
                      className="w-full h-[392px] bg-white rounded-lg border-2 flex flex-col items-center justify-center overflow-hidden"
                      style={{ borderColor: colorValues.primary }}
                    >
                      <div className="relative w-full h-full">
                        {/* Thumbnail overlay for mobile */}
                        {!hiddenFields.thumbnail && thumbnailPreview && showThumbnail && (
                          <div className="absolute inset-0 z-20">
                            <img
                              src={thumbnailPreview || "/placeholder.svg?height=392&width=220"}
                              alt="Video thumbnail"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {videoPreview ? (
                          <video
                            ref={mobileVideoRef}
                            src={videoPreview}
                            className="absolute inset-0 w-full h-full object-cover z-10" // Add z-index to ensure it's on top
                            onClick={isPlaying ? handlePauseVideo : handlePlayVideo}
                            muted
                            playsInline
                            style={{ pointerEvents: "auto" }} // Ensure clicks are registered
                          />
                        ) : (
                          <div
                            className="absolute inset-0 flex items-center justify-center cursor-pointer"
                            onClick={handlePlayVideo}
                          >
                            <div
                              className="rounded-full p-3 shadow-lg"
                              style={{
                                background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-white"
                              >
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom video controls for mobile */}
                    {videoPreview && <VideoControls />}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Customize Your AdBox</h1>
            <p className="text-gray-600">
              Enter your business information and upload media files to complete your AdBox design.
            </p>
            <div className="mt-4">
              <Link
                href="/ad-design"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ backgroundColor: colorValues.primary }}
              >
                Select Another Design
              </Link>
            </div>
          </div>

          {selectedDesign ? (
            <>
              {renderDesignPreview()}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Video Upload Section - Moved above Business Information */}
                <Card>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold">Upload Video</h2>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hideVideo"
                          checked={hiddenFields.video}
                          onChange={() => toggleFieldVisibility("video")}
                          className="mr-2"
                        />
                        <label htmlFor="hideVideo" className="text-sm text-gray-500">
                          Hide from AdBox
                        </label>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="videoUpload" className="block mb-2">
                        Upload Video (
                        {selectedDesign === 2 || selectedDesign === 3
                          ? "16:9 ratio recommended"
                          : "9:16 ratio recommended"}
                        )
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          id="videoUpload"
                          accept=".mp4,.mov,.m4v,.3gp"
                          onChange={handleVideoUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="videoUpload"
                          className="cursor-pointer flex flex-col items-center justify-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-400 mb-2"
                          >
                            <path d="m22 8-6 4 6 4V8Z" />
                            <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Click to upload video</span>
                          <span className="text-xs text-gray-500 mt-1">MP4, MOV, M4V, 3GP accepted</span>
                          <span className="text-xs text-gray-500 mt-1">
                            {selectedDesign === 2 || selectedDesign === 3
                              ? "Landscape format (16:9) recommended for this design"
                              : "Portrait format (9:16) recommended for this design"}
                          </span>
                          {videoPreview && (
                            <span className="text-xs text-amber-600 mt-1 font-medium">
                              Note: Uploading a new video will replace your current video
                            </span>
                          )}
                        </label>
                      </div>
                      {videoFile && (
                        <p className="mt-2 text-sm text-green-600">
                          Video uploaded: {videoFile.name} ({Math.round(videoFile.size / 1024)} KB)
                        </p>
                      )}
                      {videoPreview && !videoFile && (
                        <div className="mt-2 flex items-center">
                          <p className="text-sm text-blue-600">Using previously saved video</p>
                          <button
                            type="button"
                            onClick={() => {
                              setVideoPreview(null)
                              setVideoFile(null)
                              setIsPlaying(false)
                              setShowThumbnail(true)
                              setVideoRemoved(true)
                              toast({
                                title: "Video removed",
                                description: "Your video has been removed. Save to confirm changes.",
                              })
                            }}
                            className="ml-2 text-xs text-red-500 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    {/* After the video file input: */}
                    <FileSizeWarning fileType="video" maxSize={50} />
                  </div>
                </Card>

                {/* Thumbnail Upload Section */}
                <Card>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold">Upload Video Thumbnail</h2>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hideThumbnail"
                          checked={hiddenFields.thumbnail}
                          onChange={() => toggleFieldVisibility("thumbnail")}
                          className="mr-2"
                        />
                        <label htmlFor="hideThumbnail" className="text-sm text-gray-500">
                          Hide from AdBox
                        </label>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="thumbnailUpload" className="block mb-2">
                        Upload Thumbnail Image (will be shown before video plays)
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          id="thumbnailUpload"
                          ref={thumbnailInputRef}
                          accept=".jpg,.jpeg,.png,.webp"
                          onChange={handleThumbnailUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="thumbnailUpload"
                          className="cursor-pointer flex flex-col items-center justify-center"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-400 mb-2"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700">Click to upload thumbnail</span>
                          <span className="text-xs text-gray-500 mt-1">JPG, PNG, WebP accepted</span>
                          <span className="text-xs text-gray-500 mt-1">
                            This image will be shown before the video plays and after it ends. Use the controls below
                            the video to play/pause.
                          </span>
                          {thumbnailPreview && (
                            <span className="text-xs text-amber-600 mt-1 font-medium">
                              Note: Uploading a new thumbnail will replace your current thumbnail
                            </span>
                          )}
                        </label>
                      </div>
                      {thumbnailFile && (
                        <div className="mt-4">
                          <p className="text-sm text-green-600 mb-2">
                            Thumbnail uploaded: {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024)} KB)
                          </p>
                          {thumbnailPreview && (
                            <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                              <img
                                src={thumbnailPreview || "/placeholder.svg"}
                                alt="Thumbnail preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      {thumbnailPreview && !thumbnailFile && (
                        <div className="mt-4">
                          <div className="flex items-center mb-2">
                            <p className="text-sm text-blue-600">Using previously saved thumbnail</p>
                            <button
                              type="button"
                              onClick={() => {
                                setThumbnailPreview(null)
                                setThumbnailFile(null)
                                setShowThumbnail(false)
                                setThumbnailRemoved(true)
                                toast({
                                  title: "Thumbnail removed",
                                  description: "Your thumbnail has been removed. Save to confirm changes.",
                                })
                              }}
                              className="ml-2 text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={thumbnailPreview || "/placeholder.svg"}
                              alt="Thumbnail preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                      {isMobile && queuedThumbnailPreview && (
                        <div className="mt-4">
                          <div className="flex items-center mb-2">
                            <p className="text-sm text-amber-600">
                              {thumbnailPreview ? "Will replace current thumbnail" : "Thumbnail queued for upload"}
                            </p>
                            <button
                              type="button"
                              onClick={handleRemoveQueuedThumbnail}
                              className="ml-2 text-xs text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={queuedThumbnailPreview || "/placeholder.svg"}
                              alt="Queued thumbnail preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    {/* After the thumbnail file input: */}
                    <FileSizeWarning fileType="image" maxSize={5} />
                  </div>
                </Card>

                {/* Business Information Section */}
                <Card>
                  <div className="p-6 space-y-6">
                    <h2 className="text-xl font-semibold">Business Information</h2>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="businessName">Business Name</label>
                        <input
                          id="businessName"
                          name="businessName"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="address">Address</label>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="hideAddress"
                              checked={hiddenFields.address}
                              onChange={() => toggleFieldVisibility("address")}
                              className="mr-2"
                            />
                            <label htmlFor="hideAddress" className="text-sm text-gray-500">
                              Hide from AdBox
                            </label>
                          </div>
                        </div>
                        <input
                          id="address"
                          name="address"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={formData.address}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="phone">Phone Number</label>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="hidePhone"
                              checked={hiddenFields.phone}
                              onChange={() => toggleFieldVisibility("phone")}
                              className="mr-2"
                            />
                            <label htmlFor="hidePhone" className="text-sm text-gray-500">
                              Hide from AdBox
                            </label>
                          </div>
                        </div>
                        <input
                          id="phone"
                          name="phone"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="hours">Business Hours</label>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="hideHours"
                              checked={hiddenFields.hours}
                              onChange={() => toggleFieldVisibility("hours")}
                              className="mr-2"
                            />
                            <label htmlFor="hideHours" className="text-sm text-gray-500">
                              Hide from AdBox
                            </label>
                          </div>
                        </div>
                        <textarea
                          id="hours"
                          name="hours"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={formData.hours}
                          onChange={handleInputChange}
                          rows={3}
                          required
                        />
                        <p className="text-sm text-gray-500 mt-1">Enter each day on a new line</p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label htmlFor="website">Website</label>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="hideWebsite"
                              checked={hiddenFields.website}
                              onChange={() => toggleFieldVisibility("website")}
                              className="mr-2"
                            />
                            <label htmlFor="hideWebsite" className="text-sm text-gray-500">
                              Hide from AdBox
                            </label>
                          </div>
                        </div>
                        <input
                          id="website"
                          name="website"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={formData.website}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Color Selection Section */}
                <Card>
                  <div className="p-6 space-y-6">
                    <h2 className="text-xl font-semibold">Color Theme</h2>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        Choose a color theme for your AdBox. This will affect headers, buttons, and accents.
                      </p>

                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                        {Object.entries(colorMap).map(([colorKey, colorValue]) => (
                          <button
                            key={colorKey}
                            type="button"
                            className={`relative p-1 rounded-md transition-all ${
                              selectedColor === colorKey ? "ring-2 ring-offset-2" : "hover:opacity-80"
                            }`}
                            style={{
                              backgroundColor: colorValue.primary,
                              ringColor: colorValue.primary,
                            }}
                            onClick={() => setSelectedColor(colorKey)}
                            aria-label={`Select ${colorKey} theme`}
                          >
                            <div className="h-12 w-full rounded flex items-center justify-center">
                              <span className="capitalize text-white font-medium text-sm shadow-sm">{colorKey}</span>
                            </div>
                            {selectedColor === colorKey && (
                              <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ color: colorValue.primary }}
                                >
                                  <path d="M20 6L9 17l-5-5" />
                                </svg>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-sm text-gray-600">
                          Selected theme: <span className="font-medium capitalize">{selectedColor}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: colorValues.primary }}
                            title="Primary color"
                          ></div>
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: colorValues.secondary }}
                            title="Secondary color"
                          ></div>
                          <span className="text-xs text-gray-500">Primary and secondary colors</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Free Text Section */}
                <Card>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold">Custom Message</h2>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hideFreeText"
                          checked={hiddenFields.freeText}
                          onChange={() => toggleFieldVisibility("freeText")}
                          className="mr-2"
                        />
                        <label htmlFor="hideFreeText" className="text-sm text-gray-500">
                          Hide from AdBox
                        </label>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="freeText">Custom Message Text</label>
                      <textarea
                        id="freeText"
                        name="freeText"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        value={formData.freeText}
                        onChange={handleInputChange}
                        placeholder="Enter a custom message or slogan to display in your AdBox"
                        rows={3}
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        This text will be displayed prominently in your AdBox
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Photo Album Section */}
                <Card>
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold">Photo Album</h2>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hidePhotoAlbum"
                          checked={hiddenFields.photoAlbum}
                          onChange={() => toggleFieldVisibility("photoAlbum")}
                          className="mr-2"
                        />
                        <Label htmlFor="hidePhotoAlbum" className="text-sm text-gray-500">
                          Hide from AdBox
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="imageUpload" className="block mb-2">
                          {isMobile
                            ? "Upload Images for Photo Album (Queue for batch upload)"
                            : "Upload Images for Photo Album"}
                        </Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                          <input
                            type="file"
                            id="imageUpload"
                            ref={fileInputRef}
                            accept=".jpg,.jpeg,.png,.webp,.gif"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="imageUpload"
                            className="cursor-pointer flex flex-col items-center justify-center"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="text-gray-400 mb-2"
                            >
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                            <span className="text-sm font-medium text-gray-700">Click to upload image</span>
                            <span className="text-xs text-gray-500 mt-1">JPG, PNG, WebP, GIF accepted</span>
                            {isMobile && (
                              <span className="text-xs text-amber-600 mt-1">
                                On mobile, photos are queued and uploaded when you save
                              </span>
                            )}
                          </label>
                        </div>
                      </div>

                      {imagePreview && (
                        <div className="space-y-4">
                          <div className="relative h-40 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={imagePreview || "/placeholder.svg"}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                            <button
                              type="button"
                              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                              onClick={() => {
                                setImageFile(null)
                                setImagePreview(null)
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = ""
                                }
                              }}
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <Button
                            type="button"
                            onClick={handleAddToPhotoAlbum}
                            className="w-full"
                            style={{ backgroundColor: colorValues.primary, color: "white" }}
                          >
                            Add to Photo Album
                          </Button>
                        </div>
                      )}

                      {/* Queued Photos Section (Mobile Only) */}
                      {isMobile && queuedPhotos.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-md font-medium mb-2">Queued Photos ({queuedPhotos.length})</h3>
                          <p className="text-sm text-amber-600 mb-3">
                            These photos will be uploaded when you press "Save and Continue"
                          </p>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {queuedPhotosPreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                  <img
                                    src={preview || "/placeholder.svg"}
                                    alt={`Queued photo ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveQueuedPhoto(index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-70 hover:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4">
                        <h3 className="text-md font-medium mb-2">Current Photo Album ({photos.length} photos)</h3>

                        {photos.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {photos.map((photo) => (
                              <div key={photo.id} className="relative group">
                                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                  <img
                                    src={photo.url || "/placeholder.svg"}
                                    alt={photo.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(photo.id)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-4">
                            No photos in album yet. Upload and add photos above.
                          </p>
                        )}

                        {photos.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-4 w-full"
                            onClick={handleOpenPhotoAlbum}
                          >
                            View Photo Album
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    className="px-8 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    style={{ backgroundColor: colorValues.primary }}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Saving..."
                      : queuedPhotos.length > 0 || queuedThumbnailFile
                        ? `Save and Upload ${[
                            queuedThumbnailFile ? "Thumbnail" : "",
                            queuedPhotos.length > 0
                              ? `${queuedPhotos.length} Photo${queuedPhotos.length > 1 ? "s" : ""}`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" & ")}`
                        : "Save and Continue"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center p-12 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold text-red-500">No design selected</h2>
              <p className="mt-2 text-gray-600">Please go back to the design page.</p>
              <button
                className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  window.location.href = "/ad-design"
                }}
              >
                Back to Design Page
              </button>
            </div>
          )}
        </div>
      </main>

      <MainFooter />

      {/* Photo Album Modal */}
      <Dialog open={isPhotoAlbumOpen} onOpenChange={setIsPhotoAlbumOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Photo Album</DialogTitle>
          </DialogHeader>

          <div className="relative">
            {photos.length > 0 ? (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <img
                  src={photos[currentPhotoIndex].url || "/placeholder.svg"}
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-contain"
                />

                <div className="absolute bottom-2 left-0 right-0 text-center text-white text-sm">
                  {currentPhotoIndex + 1} of {photos.length}
                </div>

                {photos.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevPhoto}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={handleNextPhoto}
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
                  index === currentPhotoIndex ? "border-primary" : "border-transparent"
                }`}
                onClick={() => setCurrentPhotoIndex(index)}
                style={{ borderColor: index === currentPhotoIndex ? colorValues.primary : "transparent" }}
              >
                <img
                  src={photo.url || "/placeholder.svg"}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Savings Dialog */}
      <Dialog open={isSavingsDialogOpen} onOpenChange={setIsSavingsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Available Coupons</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {isCouponsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
                <p className="mt-2 text-gray-600">Loading coupons...</p>
              </div>
            ) : savedCoupons.length > 0 ? (
              <div className="space-y-6">
                {/* Small Coupons */}
                {savedCoupons.filter((coupon) => coupon.size === "small").length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Small Coupons</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {savedCoupons
                        .filter((coupon) => coupon.size === "small")
                        .map((coupon) => (
                          <div
                            key={coupon.id}
                            className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-4"
                            ref={(el) => {
                              if (el) couponRefs.current[coupon.id] = el
                            }}
                          >
                            <div className="text-center mb-2">
                              <h4 className="font-bold text-lg text-teal-700">{coupon.businessName}</h4>
                            </div>

                            <div className="text-center mb-3">
                              <div className="font-bold text-xl">{coupon.title}</div>
                              <div className="text-2xl font-extrabold text-red-600">{coupon.discount}</div>
                            </div>

                            <div className="text-sm mb-3">{coupon.description}</div>

                            {coupon.code && (
                              <div className="text-center mb-2">
                                <span className="inline-block bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                                  Code: {coupon.code}
                                </span>
                              </div>
                            )}

                            <div className="text-xs text-gray-600 mt-2">
                              Valid: {formatDate(coupon.startDate)} - {formatDate(coupon.expirationDate)}
                            </div>

                            <div className="text-xs text-gray-500 mt-1">
                              <button
                                className="text-teal-600 hover:underline"
                                onClick={() => setOpenDialogId(coupon.id)}
                              >
                                Terms & Conditions
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Large Coupons */}
                {savedCoupons.filter((coupon) => coupon.size === "large").length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-4">Large Coupons</h3>
                    <div className="space-y-4">
                      {savedCoupons
                        .filter((coupon) => coupon.size === "large")
                        .map((coupon) => (
                          <div
                            key={coupon.id}
                            className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-6"
                            ref={(el) => {
                              if (el) couponRefs.current[coupon.id] = el
                            }}
                          >
                            <div className="flex flex-col md:flex-row md:items-center">
                              <div className="md:w-1/3 text-center mb-4 md:mb-0">
                                <h4 className="font-bold text-xl text-teal-700 mb-2">{coupon.businessName}</h4>
                                <div className="text-3xl font-extrabold text-red-600">{coupon.discount}</div>
                                <div className="font-bold text-xl mt-1">{coupon.title}</div>
                              </div>

                              <div className="md:w-2/3 md:pl-6 md:border-l border-gray-200">
                                <div className="text-lg mb-3">{coupon.description}</div>

                                {coupon.code && (
                                  <div className="mb-3">
                                    <span className="inline-block bg-gray-100 px-3 py-1 rounded font-mono">
                                      Code: {coupon.code}
                                    </span>
                                  </div>
                                )}

                                <div className="text-sm text-gray-600 mt-4">
                                  Valid: {formatDate(coupon.startDate)} - {formatDate(coupon.expirationDate)}
                                </div>

                                <div className="text-sm text-gray-500 mt-1">
                                  <button
                                    className="text-teal-600 hover:underline"
                                    onClick={() => setOpenDialogId(coupon.id)}
                                  >
                                    Terms & Conditions
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No coupons available. Create coupons on the Penny Saver Workbench page.</p>
                <Button className="mt-4" onClick={() => (window.location.href = "/coupons")}>
                  Go to Coupons Page
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Now let's add the Jobs Dialog component */}

      <Dialog open={isJobsDialogOpen} onOpenChange={setIsJobsDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Opportunities</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {isJobsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
                <p className="mt-2 text-gray-600">Loading job listings...</p>
              </div>
            ) : jobListings.length > 0 ? (
              <div className="space-y-6">
                {jobListings.map((job) => (
                  <div key={job.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    {/* Job Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b border-gray-200">
                      <div className="flex items-center">
                        {job.logoUrl ? (
                          <div className="mr-4 flex-shrink-0">
                            <div className="relative h-16 w-16">
                              <img
                                src={job.logoUrl || "/placeholder.svg"}
                                alt={`${job.businessName} logo`}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          </div>
                        ) : null}
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{job.jobTitle}</h3>
                          <p className="text-sm text-gray-600">{job.businessName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Job Summary */}
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.payType === "hourly" && job.hourlyMin && (
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            ${job.hourlyMin}
                            {job.hourlyMax ? ` - $${job.hourlyMax}` : ""}/hour
                          </span>
                        )}
                        {job.payType === "salary" && job.salaryMin && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            ${job.salaryMin}
                            {job.salaryMax ? ` - $${job.salaryMax}` : ""}/year
                          </span>
                        )}
                        {job.payType === "other" && job.otherPay && (
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            {job.otherPay}
                          </span>
                        )}
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {job.workHours}
                        </span>
                      </div>

                      <div className="mb-3 line-clamp-2">
                        <p className="text-sm text-gray-700">{job.jobDescription}</p>
                      </div>

                      {/* Categories */}
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-1">Categories:</p>
                        <div className="flex flex-wrap gap-1">
                          {job.categories.map((category, index) => (
                            <span
                              key={index}
                              className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Show Details Button */}
                      <button
                        className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => window.open(`/job-listings/${job.id}`, "_blank")}
                      >
                        View Full Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No job listings available. Create job listings on the Job Listing Workbench page.</p>
                <Button className="mt-4" onClick={() => (window.location.href = "/job-listing")}>
                  Go to Job Listing Page
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms and Conditions Dialog */}
      <Dialog open={openDialogId !== null} onOpenChange={() => setOpenDialogId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Terms and Conditions</DialogTitle>
          </DialogHeader>
          {savedCoupons
            .filter((coupon) => coupon.id === openDialogId)
            .map((coupon) => (
              <div key={coupon.id} className="text-sm">
                {coupon.terms ? <p>{coupon.terms}</p> : <p>No terms and conditions specified for this coupon.</p>}
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
