"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Pause } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { type Coupon, getBusinessCoupons } from "@/app/actions/coupon-actions"
import { type JobListing, getBusinessJobs } from "@/app/actions/job-actions"
import { toast } from "@/components/ui/use-toast"
import { getBusinessMedia, deletePhoto, saveMediaSettings, type MediaItem } from "@/app/actions/media-actions"
import { saveBusinessAdDesign } from "@/app/actions/business-actions"

import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"

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
    streetAddress: "123 Business St",
    city: "City",
    state: "ST",
    zipCode: "12345",
    phoneArea: "555",
    phonePrefix: "123",
    phoneLine: "4567",
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
    savingsButton: boolean
    jobsButton: boolean
  }>({
    address: false,
    phone: false,
    hours: false,
    website: false,
    video: false,
    thumbnail: false,
    photoAlbum: false,
    freeText: false,
    savingsButton: false,
    jobsButton: false,
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

  // Video state
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(true)

  // Video refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const verticalVideoRef = useRef<HTMLVideoElement>(null)
  const mobileVideoRef = useRef<HTMLVideoElement>(null)

  // Refs for coupons
  const couponRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

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

  // Add this function after the getFormattedPhone function
  const getFormattedAddress = () => {
    return `${formData.streetAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}`
  }

  // Modify the loadBusinessData function to parse phone number
  const loadBusinessData = async (id: string) => {
    try {
      // In a real app, you would fetch the business data from your API
      // For now, we'll use mock data

      // You could fetch business details here
      // const businessDetails = await getBusinessDetails(id)

      // For now, we'll just set some default values if none are loaded
      setFormData((prev) => {
        // Parse phone number if it exists in format (555) 123-4567
        let phoneArea = "555"
        let phonePrefix = "123"
        let phoneLine = "4567"

        const phoneMatch = prev.phone?.match(/$$(\d{3})$$\s*(\d{3})-(\d{4})/)
        if (phoneMatch) {
          phoneArea = phoneMatch[1]
          phonePrefix = phoneMatch[2]
          phoneLine = phoneMatch[3]
        }

        return {
          ...prev,
          businessName: "Your Business Name", // Replace with actual data
          streetAddress: "123 Main St", // Replace with actual data
          city: "Your City", // Replace with actual data
          state: "ST", // Replace with actual data
          zipCode: "12345", // Replace with actual data
          phoneArea,
          phonePrefix,
          phoneLine,
          hours: "Your Business Hours", // Replace with actual data
          website: "Your Business Website", // Replace with actual data
          freeText: "Your Business Description", // Replace with actual data
        }
      })
    } catch (error) {
      console.error("Error loading business data:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Add this function after the handleInputChange function
  const getFormattedPhone = () => {
    return `(${formData.phoneArea}) ${formData.phonePrefix}-${formData.phoneLine}`
  }

  // Add this function after the getFormattedPhone function
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const { value } = e.target

    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, "")

    // Limit length based on the field
    let truncatedValue = numericValue
    if (field === "phoneArea") {
      truncatedValue = numericValue.slice(0, 3)
    } else if (field === "phonePrefix") {
      truncatedValue = numericValue.slice(0, 3)
    } else if (field === "phoneLine") {
      truncatedValue = numericValue.slice(0, 4)
    }

    setFormData((prev) => ({
      ...prev,
      [field]: truncatedValue,
    }))
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
    const timeUpdateHandlers = new Map()

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

        // Store the handler reference so we can remove it later
        timeUpdateHandlers.set(video, timeUpdateHandler)
      }
    })

    return () => {
      // Clean up all event listeners safely
      videoElements.forEach((video) => {
        if (video) {
          video.removeEventListener("ended", handleVideoEnd)

          // Remove timeupdate listener using the stored reference
          const timeUpdateHandler = timeUpdateHandlers.get(video)
          if (timeUpdateHandler) {
            video.removeEventListener("timeupdate", timeUpdateHandler)
          }
        }
      })
    }
  }, [videoRef.current, verticalVideoRef.current, mobileVideoRef.current])

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

  // Modify the handleSubmit function to save the formatted phone number
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

      // Save hidden fields settings
      await saveMediaSettings(businessId, { hiddenFields })

      // Format the phone number for saving
      const formattedData = {
        ...formData,
        phone: getFormattedPhone(), // Use the formatted phone number
        address: getFormattedAddress(), // Add the formatted address
      }

      // Save business ad design data
      await saveBusinessAdDesign(businessId, {
        designId: selectedDesign,
        colorScheme: selectedColor,
        businessInfo: formattedData,
      })

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
      {!hiddenFields.savingsButton && (
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
      )}
      {!hiddenFields.jobsButton && (
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
      )}
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
                        <p className="text-sm text-gray-600">{getFormattedAddress()}</p>
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
                        <p className="text-sm text-gray-600">{getFormattedPhone()}</p>
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
                        <p className="text-sm text-gray-600">{getFormattedAddress()}</p>
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
                        <p className="text-sm text-gray-600">{getFormattedPhone()}</p>
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
                        <p className="text-sm text-gray-600">{getFormattedAddress()}</p>
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
                        <p className="text-sm text-gray-600">{getFormattedPhone()}</p>
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
    } else if (selectedDesign === 5) {
      // Modern Business Card design
      return (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Selected Design: Design 5</h2>
          <div className="overflow-hidden rounded-lg shadow-md">
            <Card className="max-w-md mx-auto">
              <div
                className="p-5 text-white"
                style={{
                  background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                }}
              >
                <h3 className="text-2xl font-bold">{formData.businessName}</h3>
                {!hiddenFields.freeText && formData.freeText && (
                  <p className="text-base mt-1 opacity-90">{formData.freeText}</p>
                )}
              </div>

              <div className="pt-6 px-6 space-y-4">
                {!hiddenFields.phone && (
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: colorValues.primary }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p>{getFormattedPhone()}</p>
                    </div>
                  </div>
                )}

                {!hiddenFields.address && (
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: colorValues.primary }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p>{getFormattedAddress()}</p>
                    </div>
                  </div>
                )}

                {!hiddenFields.hours && (
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: colorValues.primary }}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Hours of Operation</p>
                      <div className="space-y-1">
                        {formData.hours.split("\n").map((line, i) => (
                          <p key={i} className="text-sm">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Section */}
              {!hiddenFields.video && (
                <div className="border-t pt-4 mt-4 px-4">
                  <div className="relative w-full pb-[56.25%]">
                    {/* Thumbnail overlay */}
                    {!hiddenFields.thumbnail && thumbnailPreview && showThumbnail && (
                      <div className="absolute inset-0 z-20 rounded-md overflow-hidden">
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
                        className="absolute top-0 left-0 w-full h-full rounded-md"
                        onClick={isPlaying ? handlePauseVideo : handlePlayVideo}
                        muted
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center cursor-pointer bg-gray-100 rounded-md"
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

                  {/* Custom video controls */}
                  {videoPreview && <VideoControls />}
                </div>
              )}

              {/* Footer with buttons */}

              <div className="flex flex-col items-stretch gap-3 border-t pt-4 px-4 pb-4 mt-4">
                {!hiddenFields.photoAlbum && (
                  <button
                    onClick={handleOpenPhotoAlbum}
                    className="flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
                  >
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
                      style={{ color: colorValues.primary }}
                    >
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                      <circle cx="9" cy="9" r="2"></circle>
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                    </svg>
                    View Photo Album
                  </button>
                )}

                {!hiddenFields.website && (
                  <button
                    onClick={() => window.open(`https://${formData.website}`, "_blank")}
                    className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    style={{ backgroundColor: colorValues.primary }}
                  >
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
                      className="text-white"
                    >
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    Visit Website
                  </button>
                )}

                {!hiddenFields.savingsButton && (
                  <button
                    onClick={() => setIsSavingsDialogOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
                  >
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
                      style={{ color: colorValues.primary }}
                    >
                      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                      <path d="M7 7h.01" />
                    </svg>
                    View Coupons
                  </button>
                )}

                {!hiddenFields.jobsButton && (
                  <button
                    onClick={() => setIsJobsDialogOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-50"
                  >
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
                      style={{ color: colorValues.primary }}
                    >
                      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    Job Opportunities
                  </button>
                )}
              </div>

              <div className="p-3 text-center text-white" style={{ backgroundColor: colorValues.primary }}>
                <p className="font-medium">Design 5</p>
              </div>
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
                        <p className="text-sm text-gray-600">{getFormattedAddress()}</p>
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
                        <p className="text-sm text-gray-600">{getFormattedPhone()}</p>
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
            <p className="text-gray-600">Enter your business information and select your Design.</p>
          </div>

          {selectedDesign ? (
            <>
              {renderDesignPreview()}

              {/* Color Selection Section */}
              <Card>
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold">Color Theme</h2>

                  <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                    {Object.entries(colorMap).map(([colorKey, colorObj]) => (
                      <button
                        key={colorKey}
                        onClick={() => setSelectedColor(colorKey)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all ${
                          selectedColor === colorKey ? "ring-2 ring-offset-1" : "hover:scale-105"
                        }`}
                        style={{
                          background: `linear-gradient(to right, ${colorObj.primary}, ${colorObj.secondary})`,
                          borderColor: selectedColor === colorKey ? colorObj.primary : "transparent",
                          ringColor: colorObj.primary,
                        }}
                        aria-label={`Select ${colorKey} theme`}
                      >
                        <span className="sr-only">{colorKey}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Design Selection Section */}
              <Card>
                <div className="p-6 space-y-6">
                  <h2 className="text-xl font-semibold">Design Layout</h2>
                  <p className="text-gray-600 mb-4">Choose a layout for your AdBox</p>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((designId) => (
                      <button
                        key={designId}
                        onClick={() => setSelectedDesign(designId)}
                        className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                          selectedDesign === designId
                            ? `border-[${colorValues.primary}] ring-2 ring-offset-1`
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        style={{
                          borderColor: selectedDesign === designId ? colorValues.primary : undefined,
                          ringColor: selectedDesign === designId ? colorValues.primary : undefined,
                        }}
                      >
                        <div className="aspect-[3/4] bg-gray-50 flex flex-col">
                          {/* Design preview thumbnail */}
                          <div
                            className="h-8 text-white text-center text-sm font-medium flex items-center justify-center"
                            style={{
                              background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                            }}
                          >
                            Business Name
                          </div>

                          <div className="flex-1 p-2 flex flex-col items-center justify-center">
                            {/* Design 1 - Right video */}
                            {designId === 1 && (
                              <div className="w-full h-full flex items-center">
                                <div className="flex-1 bg-white rounded-md p-1 text-[6px]">
                                  <div className="h-2 w-3/4 bg-gray-200 rounded mb-1"></div>
                                  <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                                </div>
                                <div className="w-1/3 h-3/4 ml-1 bg-gray-300 rounded-md"></div>
                              </div>
                            )}

                            {/* Design 2 - Top video */}
                            {designId === 2 && (
                              <div className="w-full h-full flex flex-col">
                                <div className="w-full h-1/3 bg-gray-300 rounded-md mb-1"></div>
                                <div className="flex-1 bg-white rounded-md p-1 text-[6px]">
                                  <div className="h-2 w-3/4 bg-gray-200 rounded mb-1"></div>
                                  <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                                </div>
                              </div>
                            )}

                            {/* Design 3 - Bottom video */}
                            {designId === 3 && (
                              <div className="w-full h-full flex flex-col">
                                <div className="flex-1 bg-white rounded-md p-1 text-[6px] mb-1">
                                  <div className="h-2 w-3/4 bg-gray-200 rounded mb-1"></div>
                                  <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                                </div>
                                <div className="w-full h-1/3 bg-gray-300 rounded-md"></div>
                              </div>
                            )}

                            {/* Design 4 - Left video */}
                            {designId === 4 && (
                              <div className="w-full h-full flex items-center">
                                <div className="w-1/3 h-3/4 mr-1 bg-gray-300 rounded-md"></div>
                                <div className="flex-1 bg-white rounded-md p-1 text-[6px]">
                                  <div className="h-2 w-3/4 bg-gray-200 rounded mb-1"></div>
                                  <div className="h-2 w-1/2 bg-gray-200 rounded"></div>
                                </div>
                              </div>
                            )}

                            {/* Design 5 - Modern Card */}
                            {designId === 5 && (
                              <div className="w-full h-full flex flex-col">
                                <div className="w-full bg-white rounded-md p-1 mb-1">
                                  <div className="flex items-center gap-1 mb-1">
                                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                    <div className="h-1 w-10 bg-gray-200 rounded"></div>
                                  </div>
                                  <div className="flex items-center gap-1 mb-1">
                                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                    <div className="h-1 w-8 bg-gray-200 rounded"></div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                                    <div className="h-1 w-12 bg-gray-200 rounded"></div>
                                  </div>
                                </div>
                                <div className="w-full h-1/3 bg-gray-300 rounded-md mb-1"></div>
                                <div className="w-full flex gap-1">
                                  <div className="flex-1 h-2 bg-gray-200 rounded"></div>
                                  <div className="flex-1 h-2 bg-gray-200 rounded"></div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="h-6 bg-gray-100 text-xs flex items-center justify-center font-medium">
                            Design {designId}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              <form onSubmit={handleSubmit} className="space-y-8">
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
                          <label htmlFor="streetAddress">Address</label>
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
                        <div className="space-y-3">
                          <input
                            id="streetAddress"
                            name="streetAddress"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            value={formData.streetAddress}
                            onChange={handleInputChange}
                            placeholder="Street Address"
                            required
                          />
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-6">
                              <input
                                id="city"
                                name="city"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={formData.city}
                                onChange={handleInputChange}
                                placeholder="City"
                                required
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                id="state"
                                name="state"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={formData.state}
                                onChange={handleInputChange}
                                placeholder="State"
                                maxLength={2}
                                required
                              />
                            </div>
                            <div className="col-span-4">
                              <input
                                id="zipCode"
                                name="zipCode"
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                placeholder="ZIP Code"
                                maxLength={10}
                                required
                              />
                            </div>
                          </div>
                        </div>
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
                        <div className="flex gap-2">
                          <div className="w-24">
                            <input
                              id="phoneArea"
                              name="phoneArea"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                              value={formData.phoneArea}
                              onChange={(e) => handlePhoneChange(e, "phoneArea")}
                              placeholder="Area"
                              maxLength={3}
                              required
                            />
                          </div>
                          <div className="w-24">
                            <input
                              id="phonePrefix"
                              name="phonePrefix"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                              value={formData.phonePrefix}
                              onChange={(e) => handlePhoneChange(e, "phonePrefix")}
                              placeholder="Prefix"
                              maxLength={3}
                              required
                            />
                          </div>
                          <div className="w-28">
                            <input
                              id="phoneLine"
                              name="phoneLine"
                              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
                              value={formData.phoneLine}
                              onChange={(e) => handlePhoneChange(e, "phoneLine")}
                              placeholder="Line"
                              maxLength={4}
                              required
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Format: (123) 456-7890</p>
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

                {/* Feature Buttons Section */}
                <Card>
                  <div className="p-6 space-y-6">
                    <h2 className="text-xl font-semibold">Feature Buttons</h2>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hideSavingsButton"
                          checked={hiddenFields.savingsButton}
                          onChange={() => toggleFieldVisibility("savingsButton")}
                          className="mr-2"
                        />
                        <label htmlFor="hideSavingsButton" className="text-gray-700">
                          Hide Savings Button
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hideJobsButton"
                          checked={hiddenFields.jobsButton}
                          onChange={() => toggleFieldVisibility("jobsButton")}
                          className="mr-2"
                        />
                        <label htmlFor="hideJobsButton" className="text-gray-700">
                          Hide Job Opportunities Button
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hideWebsiteButton"
                          checked={hiddenFields.website}
                          onChange={() => toggleFieldVisibility("website")}
                          className="mr-2"
                        />
                        <label htmlFor="hideWebsiteButton" className="text-gray-700">
                          Hide Website Button/Link
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="hidePhotoAlbumButton"
                          checked={hiddenFields.photoAlbum}
                          onChange={() => toggleFieldVisibility("photoAlbum")}
                          className="mr-2"
                        />
                        <label htmlFor="hidePhotoAlbumButton" className="text-gray-700">
                          Hide Photo Album Button/Link
                        </label>
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
                    {isLoading ? "Saving..." : "Save and Continue"}
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
