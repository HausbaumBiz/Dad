"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Pause } from "lucide-react"

interface PhotoItem {
  id: string
  url: string
  name: string
}

export default function CustomizeAdDesignPage() {
  const searchParams = useSearchParams()
  const designId = searchParams.get("design")
  const colorParam = searchParams.get("color") || "blue"
  const [selectedDesign, setSelectedDesign] = useState<number | null>(designId ? Number.parseInt(designId) : 6)
  const [selectedColor, setSelectedColor] = useState(colorParam)

  // Add state for the dialogs
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  const [isJobsDialogOpen, setIsJobsDialogOpen] = useState(false)

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

  // Add sample jobs data
  const sampleJobs = [
    {
      id: "1",
      title: "Sales Associate",
      description: "Looking for an energetic sales associate to join our team.",
      requirements: "Previous retail experience preferred. Strong communication skills required.",
      salary: "$15-18/hour",
      location: "In-store",
    },
    {
      id: "2",
      title: "Marketing Specialist",
      description: "Help us grow our brand with creative marketing campaigns.",
      requirements: "Bachelor's degree in Marketing or related field. 2+ years experience.",
      salary: "$45,000-55,000/year",
      location: "Hybrid (Remote/Office)",
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

  // Set the color based on URL parameter
  useEffect(() => {
    if (colorParam && colorMap[colorParam]) {
      setSelectedColor(colorParam)
    }
  }, [colorParam])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setVideoFile(file)

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
      setThumbnailFile(file)

      // Create preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        setThumbnailPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Ensure thumbnail is shown
      setShowThumbnail(true)
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

  const handleAddToPhotoAlbum = () => {
    if (imageFile && imagePreview) {
      const newPhoto: PhotoItem = {
        id: Date.now().toString(),
        url: imagePreview,
        name: imageFile.name,
      }

      setPhotos((prev) => [...prev, newPhoto])

      // Reset the current upload
      setImageFile(null)
      setImagePreview(null)

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Show success message
      alert("Photo added to album successfully!")
    }
  }

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id))

    // If we're removing the current photo and it's the last one, adjust the index
    if (photos.length > 0) {
      if (currentPhotoIndex >= photos.length - 1) {
        setCurrentPhotoIndex(Math.max(0, photos.length - 2))
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, this would save the data and proceed to the next step
    alert("Ad design customized! Your information has been saved.")
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
                    className="hidden lg:block absolute top-1/2 left-4 transform -translate-y-1/2 w-[220px] h-[392px] bg-white rounded-lg border-2 shadow-lg overflow-hidden"
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
                  <div className="hidden lg:block absolute left-4 top-[calc(50%+205px)] w-[220px]">
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
                  className="hidden lg:block absolute top-1/2 right-4 transform -translate-y-1/2 w-[220px] h-[392px] bg-white rounded-lg border-2 shadow-lg overflow-hidden"
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
                <div className="hidden lg:block absolute right-4 top-[calc(50%+205px)] w-[220px]">
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
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold">HausBaum</h1>
            <div className="flex items-center space-x-4">
              <button className="text-sm text-gray-600 hover:text-gray-900">Help</button>
              <button className="text-sm text-gray-600 hover:text-gray-900">Account</button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Customize Your AdBox</h1>
            <p className="text-gray-600">
              Enter your business information and upload media files to complete your AdBox design.
            </p>
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
                        </label>
                      </div>
                      {videoFile && (
                        <p className="mt-2 text-sm text-green-600">
                          Video uploaded: {videoFile.name} ({Math.round(videoFile.size / 1024)} KB)
                        </p>
                      )}
                    </div>
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
                    </div>
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

                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    className="px-8 py-2 bg-blue-600 text-white font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    style={{ backgroundColor: colorValues.primary }}
                  >
                    Save and Continue
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

      <div className="bg-gray-100 py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-600 text-sm">
            &copy; {new Date().getFullYear()} HausBaum. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
