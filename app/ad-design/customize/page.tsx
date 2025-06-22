"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"

import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type Coupon, getBusinessCoupons } from "@/app/actions/coupon-actions"
import { type JobListing, getBusinessJobs } from "@/app/actions/job-actions"
import { toast } from "@/components/ui/use-toast"
import { getBusinessMedia, saveMediaSettings, type MediaItem } from "@/app/actions/media-actions"
import { saveBusinessAdDesign, getBusinessAdDesign } from "@/app/actions/business-actions"
import { getCurrentBusiness } from "@/app/actions/auth-actions"
import { getCloudflareBusinessMedia, type CloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"

import {
  Menu,
  List,
  FileText,
  ShoppingCart,
  Clipboard,
  Calendar,
  MessageSquare,
  Map,
  Settings,
  BookOpen,
  PenTool,
  Truck,
  Heart,
  Coffee,
  Gift,
  Music,
  ImageIcon,
  Ticket,
  Briefcase,
} from "lucide-react"

interface PhotoItem {
  id: string
  url: string
  name: string
}

export default function CustomizeAdDesignPage() {
  const searchParams = useSearchParams()
  const designId = searchParams.get("design")
  const colorParam = searchParams.get("color") || "blue"
  const [selectedDesign, setSelectedDesign] = useState<number | null>(designId ? Number.parseInt(designId) : 5)
  const [selectedColor, setSelectedColor] = useState(colorParam)
  const [businessId, setBusinessId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  // Add state for the dialogs
  const [isSavingsDialogOpen, setIsSavingsDialogOpen] = useState(false)
  // Add state variables for the photo album and jobs dialogs
  // Add these after the existing state variables (around line 45-50)
  const [isPhotoAlbumDialogOpen, setIsPhotoAlbumDialogOpen] = useState(false)
  const [isJobsDialogOpen, setIsJobsDialogOpen] = useState(false)

  // Add state for saved coupons and loading state:
  const [savedCoupons, setSavedCoupons] = useState<Coupon[]>([])
  const [isCouponsLoading, setIsCouponsLoading] = useState(false)

  // Add state for job listings and jobs dialog
  const [jobListings, setJobListings] = useState<JobListing[]>([])
  const [isJobsLoading, setIsJobsLoading] = useState(false)

  // Add state for terms and conditions dialog
  const [openDialogId, setOpenDialogId] = useState<string | null>(null)

  // Add state for custom button
  const [customButtonType, setCustomButtonType] = useState<string>("Menu")
  const [customButtonName, setCustomButtonName] = useState<string>("Menu")
  const [showCustomNameInput, setShowCustomNameInput] = useState<boolean>(false)

  // Add state for custom button icon
  const [customButtonIcon, setCustomButtonIcon] = useState<string>("Menu")

  // Add state for Cloudflare video
  const [cloudflareVideo, setCloudflareVideo] = useState<CloudflareBusinessMedia | null>(null)

  // Add state for completion status dialog
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false)
  const [completionStatus, setCompletionStatus] = useState<{
    businessInfo: boolean
    video: boolean
    photos: boolean
    coupons: boolean
    jobs: boolean
    customButton: boolean
    website: boolean
  }>({
    businessInfo: false,
    video: false,
    photos: false,
    coupons: false,
    jobs: false,
    customButton: false,
    website: false,
  })

  // Add state for tracking completion
  const [isAllComplete, setIsAllComplete] = useState(false)

  // Add a new state variable for the finalize dialog
  // Add this with the other dialog state variables around line 60-70
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false)

  // Color mapping
  const colorMap: Record<string, { primary: string; secondary: string; textColor?: string }> = {
    blue: { primary: "#007BFF", secondary: "#0056b3" },
    purple: { primary: "#6f42c1", secondary: "#5e37a6" },
    green: { primary: "#28a745", secondary: "#218838" },
    teal: { primary: "#20c997", secondary: "#17a2b8" },
    orange: { primary: "#fd7e14", secondary: "#e65f02" },
    red: { primary: "#dc3545", secondary: "#c82333" },
    black: { primary: "#000000", secondary: "#333333" },
    white: { primary: "#ffffff", secondary: "#f8f9fa", textColor: "#000000" },
    yellow: { primary: "#ffc107", secondary: "#ffdb58", textColor: "#000000" },
    slategrey: { primary: "#708090", secondary: "#4E5964" },
    brown: { primary: "#8B4513", secondary: "#6B3610" },
    darkpink: { primary: "#FF1493", secondary: "#C71585" },
    lightpink: { primary: "#FFC0CB", secondary: "#FFB6C1", textColor: "#000000" },
  }

  // Add texture options after colorMap
  const textureOptions = [
    {
      name: "None",
      value: "none",
      style: {
        backgroundColor: "",
        backgroundImage: "none",
        backgroundSize: "auto",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Gradient",
      value: "gradient",
      style: {
        backgroundColor: "",
        backgroundImage: "none",
        backgroundSize: "auto",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Dots",
      value: "dots",
      style: {
        backgroundColor: "",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "10px 10px",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Lines",
      value: "lines",
      style: {
        backgroundColor: "",
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
        backgroundSize: "auto",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Grid",
      value: "grid",
      style: {
        backgroundColor: "",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "10px 10px",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Diagonal",
      value: "diagonal",
      style: {
        backgroundColor: "",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 10px, transparent 10px, transparent 20px)",
        backgroundSize: "auto",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Waves",
      value: "waves",
      style: {
        backgroundColor: "",
        backgroundImage: "radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 50%)",
        backgroundSize: "20px 10px",
        backgroundRepeat: "repeat",
      },
    },
  ]

  // Add texture state after selectedColor state
  const [selectedTexture, setSelectedTexture] = useState("gradient")

  // Available icons for custom button
  const availableIcons = [
    { name: "Menu", component: Menu },
    { name: "List", component: List },
    { name: "FileText", component: FileText },
    { name: "ShoppingCart", component: ShoppingCart },
    { name: "Clipboard", component: Clipboard },
    { name: "Calendar", component: Calendar },
    { name: "MessageSquare", component: MessageSquare },
    { name: "Map", component: Map },
    { name: "Settings", component: Settings },
    { name: "BookOpen", component: BookOpen },
    { name: "PenTool", component: PenTool },
    { name: "Truck", component: Truck },
    { name: "Heart", component: Heart },
    { name: "Coffee", component: Coffee },
    { name: "Gift", component: Gift },
    { name: "Music", component: Music },
  ]

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
    customButton: boolean
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
    customButton: false,
  })

  // Add a handler function for toggling field visibility
  const toggleFieldVisibility = (field: keyof typeof hiddenFields) => {
    setHiddenFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  // Add handler for custom button type change
  const handleCustomButtonTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value
    setCustomButtonType(selectedType)

    if (selectedType === "Other") {
      setShowCustomNameInput(true)
      setCustomButtonName("")
    } else {
      setShowCustomNameInput(false)
      setCustomButtonName(selectedType)
    }
  }

  // Add handler for custom button name change
  const handleCustomButtonNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomButtonName(e.target.value)
  }

  // Photo album state
  const [photos, setPhotos] = useState<PhotoItem[]>([])

  // Video state
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [showThumbnail, setShowThumbnail] = useState(true)

  // Video refs
  const videoRef = useRef<HTMLVideoElement>(null)

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
        setIsLoading(true)

        // Get the current business from the session
        const business = await getCurrentBusiness()
        console.log("Current business:", business)

        let id = "demo-business" // Default fallback ID

        if (business && business.id) {
          id = business.id
          console.log("Using business ID from session:", id)
        } else {
          console.log("No business found in session, using default ID:", id)
        }

        setBusinessId(id)

        // Load saved media
        await loadSavedMedia(id)

        // Load business data - this now includes loading the saved ad design
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

      // Load Cloudflare video
      const cloudflareMedia = await getCloudflareBusinessMedia(id)
      console.log("Cloudflare media data:", cloudflareMedia)
      if (cloudflareMedia && cloudflareMedia.cloudflareVideoId) {
        console.log("Setting cloudflare video:", cloudflareMedia)
        setCloudflareVideo(cloudflareMedia)
      } else {
        console.log("No cloudflare video found or video ID missing")
      }

      if (media) {
        // We're not using video, so we don't need to set videoPreview
        setVideoPreview(null)

        // Set the Cloudflare image as our placeholder
        setThumbnailPreview(
          "https://imagedelivery.net/Fx83XHJ2QHIeAJio-AnNbA/78c875cc-ec1b-4ebb-a52e-a1387c030200/public",
        )

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
      setCloudflareVideo(null)
      // Still set the Cloudflare image as our placeholder even on error
      setThumbnailPreview(
        "https://imagedelivery.net/Fx83XHJ2QHIeAJio-AnNbA/78c875cc-ec1b-4ebb-a52e-a1387c030200/public",
      )
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
      console.log("Loading business data for ID:", id)

      // Get the saved ad design data, which includes business information
      const savedDesign = await getBusinessAdDesign(id)
      console.log("Saved design data:", savedDesign)

      if (savedDesign && savedDesign.businessInfo) {
        // Extract business info from saved design
        const businessInfo = savedDesign.businessInfo
        console.log("Found saved business info:", businessInfo)

        // Parse phone number if it exists in format (555) 123-4567
        let phoneArea = "555"
        let phonePrefix = "123"
        let phoneLine = "4567"

        if (businessInfo.phone) {
          // Try to parse formatted phone number like "(555) 123-4567"
          const phoneMatch = businessInfo.phone.match(/$$(\d{3})$$\s*(\d{3})-(\d{4})/)
          if (phoneMatch) {
            phoneArea = phoneMatch[1]
            phonePrefix = phoneMatch[2]
            phoneLine = phoneMatch[3]
          } else {
            // Try to parse just digits if format is different
            const digitsOnly = businessInfo.phone.replace(/\D/g, "")
            if (digitsOnly.length === 10) {
              phoneArea = digitsOnly.slice(0, 3)
              phonePrefix = digitsOnly.slice(3, 6)
              phoneLine = digitsOnly.slice(6, 10)
            }
          }
        }

        // Load hidden fields if available
        if (savedDesign.hiddenFields) {
          setHiddenFields((prevFields) => ({
            ...prevFields,
            ...savedDesign.hiddenFields,
          }))
        }

        // Update the loadBusinessData function to properly extract the custom button data
        // Around line 200-220

        // Load custom button settings if available
        if (savedDesign.customButton) {
          console.log("Found saved custom button settings:", savedDesign.customButton)
          setCustomButtonType(savedDesign.customButton.type || "Menu")
          setCustomButtonName(savedDesign.customButton.name || "Menu")
          setShowCustomNameInput(savedDesign.customButton.type === "Other")
          setCustomButtonIcon(savedDesign.customButton.icon || "Menu")
        } else {
          console.log("No custom button settings found, using defaults")
          setCustomButtonType("Menu")
          setCustomButtonName("Menu")
          setShowCustomNameInput(false)
          setCustomButtonIcon("Menu")
        }

        // Update form data with saved business information - ensure no undefined values
        setFormData({
          businessName: businessInfo.businessName || "Business Name",
          streetAddress: businessInfo.streetAddress || "123 Business St",
          city: businessInfo.city || "City",
          state: businessInfo.state || "ST",
          zipCode: businessInfo.zipCode || "12345",
          phoneArea: phoneArea || "555",
          phonePrefix: phonePrefix || "123",
          phoneLine: phoneLine || "4567",
          hours: businessInfo.hours || "Mon-Fri: 9AM-5PM\nSat: 10AM-3PM",
          website: businessInfo.website || "www.businessname.com",
          freeText:
            businessInfo.freeText || "We offer professional services with 10+ years of experience in the industry.",
          videoFile: null,
          thumbnailFile: null,
        })

        // If we have a saved color scheme, use it
        if (savedDesign.colorScheme) {
          setSelectedColor(savedDesign.colorScheme)
        }

        // If we have a saved texture, use it
        if (savedDesign.texture) {
          setSelectedTexture(savedDesign.texture)
        }

        // If we have a saved design ID, use it
        if (savedDesign.designId) {
          setSelectedDesign(Number(savedDesign.designId) || 5) // Provide fallback if NaN
        }

        return true
      } else {
        console.log("No saved business info found, using defaults")
        // No saved data, use defaults
        setFormData({
          businessName: "Your Business Name",
          streetAddress: "123 Main St",
          city: "Your City",
          state: "ST",
          zipCode: "12345",
          phoneArea: "555",
          phonePrefix: "123",
          phoneLine: "4567",
          hours: "Your Business Hours",
          website: "Your Business Website",
          freeText: "Your Business Description",
          videoFile: null,
          thumbnailFile: null,
        })
        return false
      }
    } catch (error) {
      console.error("Error loading business data:", error)
      // Ensure we set default values even on error
      setFormData({
        businessName: "Your Business Name",
        streetAddress: "123 Main St",
        city: "Your City",
        state: "ST",
        zipCode: "12345",
        phoneArea: "555",
        phonePrefix: "123",
        phoneLine: "4567",
        hours: "Your Business Hours",
        website: "Your Business Website",
        freeText: "Your Business Description",
        videoFile: null,
        thumbnailFile: null,
      })
      return false
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value || "", // Ensure we never set undefined
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
      [field]: truncatedValue || "", // Ensure we never set undefined
    }))
  }

  // Video control functions
  // const handlePlayVideo = () => {
  //   console.log("Play video triggered")

  //   // Hide thumbnail when play is triggered
  //   setShowThumbnail(false)

  //   // Set isPlaying to true immediately to update UI
  //   setIsPlaying(true)

  //   // Get video element
  //   const videoElement = videoRef.current

  //   // Reset video to beginning to ensure consistent playback
  //   if (videoElement) {
  //     videoElement.currentTime = 0
  //   }

  //   // Play video
  //   if (videoElement) {
  //     // Make sure audio is enabled
  //     videoElement.muted = false

  //     const playPromise = videoElement.play()

  //     if (playPromise !== undefined) {
  //       playPromise
  //         .then(() => {
  //           console.log("Video playback started successfully")
  //         })
  //         .catch((error) => {
  //           console.error("Error playing video:", error)
  //           // If video fails to play, show thumbnail again
  //           setShowThumbnail(true)
  //           setIsPlaying(false)
  //         })
  //     }
  //   }
  // }

  // const handlePauseVideo = () => {
  //   if (videoRef.current) {
  //     videoRef.current.pause()
  //   }

  //   setIsPlaying(false)
  //   // Don't show thumbnail on pause, only when video ends or before it starts
  // }

  // Update the video end handler useEffect
  // useEffect(() => {
  //   // Get video element that currently exists in the DOM
  //   const videoElement = videoRef.current
  //   let timeUpdateHandler: (() => void) | null = null

  //   const handleVideoEnd = () => {
  //     console.log("Video ended, showing thumbnail")
  //     setIsPlaying(false)
  //     setShowThumbnail(true) // Show thumbnail when video ends
  //   }

  //   // Add event listeners to video element
  //   if (videoElement) {
  //     // Remove any existing event listeners first to avoid duplicates
  //     videoElement.removeEventListener("ended", handleVideoEnd)

  //     // Add the event listener for video end
  //     videoElement.addEventListener("ended", handleVideoEnd)

  //     // Also monitor the currentTime to detect when video is near the end
  //     // This is a backup in case the ended event doesn't fire properly
  //     timeUpdateHandler = () => {
  //       if (videoElement.currentTime >= videoElement.duration - 0.2 && videoElement.duration > 0) {
  //         console.log(`Video near end: ${videoElement.currentTime}/${videoElement.duration}`)
  //         handleVideoEnd()
  //       }
  //     }

  //     videoElement.removeEventListener("timeupdate", timeUpdateHandler)
  //     videoElement.addEventListener("timeupdate", timeUpdateHandler)
  //   }

  //   return () => {
  //     // Clean up all event listeners safely
  //     if (videoElement) {
  //       videoElement.removeEventListener("ended", handleVideoEnd)

  //       // Remove timeupdate listener
  //       if (timeUpdateHandler) {
  //         videoElement.removeEventListener("timeupdate", timeUpdateHandler)
  //       }
  //     }
  //   }
  // }, [videoRef.current])

  // Replace the handleOpenPhotoAlbum function with this new version that opens the dialog
  // Around line 375
  const handleOpenPhotoAlbum = () => {
    // Open the photo album dialog instead of navigating to a different page
    setIsPhotoAlbumDialogOpen(true)
  }

  // Function to get the icon component based on icon name
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ElementType> = {
      Menu: Menu,
      List: List,
      FileText: FileText,
      ShoppingCart: ShoppingCart,
      Clipboard: Clipboard,
      Calendar: Calendar,
      MessageSquare: MessageSquare,
      Map: Map,
      Settings: Settings,
      BookOpen: BookOpen,
      PenTool: PenTool,
      Truck: Truck,
      Heart: Heart,
      Coffee: Coffee,
      Gift: Gift,
      Music: Music,
    }

    return iconMap[iconName] || Menu // Default to Menu if icon not found
  }

  // Function to check completion status of all sections
  const checkCompletionStatus = async () => {
    const status = {
      businessInfo: false, // Change to false by default
      video: false,
      photos: false,
      coupons: false,
      jobs: false,
      customButton: true, // Default to true since it's optional
      website: false, // Change to false by default
    }

    // Check business information completion - must not be default/sample data
    const hasRealBusinessName =
      formData.businessName &&
      formData.businessName !== "Business Name" &&
      formData.businessName !== "Your Business Name"

    const hasRealAddress =
      formData.streetAddress && formData.streetAddress !== "123 Business St" && formData.streetAddress !== "123 Main St"

    const hasRealCity = formData.city && formData.city !== "City" && formData.city !== "Your City"

    const hasRealPhone = formData.phoneArea !== "555" || formData.phonePrefix !== "123" || formData.phoneLine !== "4567"

    const hasRealHours =
      formData.hours && formData.hours !== "Mon-Fri: 9AM-5PM\nSat: 10AM-3PM" && formData.hours !== "Your Business Hours"

    // Business info is complete only if all fields have real data
    status.businessInfo = hasRealBusinessName && hasRealAddress && hasRealCity && hasRealPhone && hasRealHours

    // Check video completion
    if (cloudflareVideo && cloudflareVideo.cloudflareVideoId) {
      status.video = true
    }

    // Check photos completion
    if (photos && photos.length > 0) {
      status.photos = true
    }

    // Check coupons completion
    try {
      const couponsResult = await getBusinessCoupons()
      if (couponsResult.success && couponsResult.coupons && couponsResult.coupons.length > 0) {
        status.coupons = true
      }
    } catch (error) {
      console.error("Error checking coupons:", error)
    }

    // Check jobs completion
    try {
      const jobs = await getBusinessJobs(businessId)
      if (jobs && jobs.length > 0) {
        status.jobs = true
      }
    } catch (error) {
      console.error("Error checking jobs:", error)
    }

    // Check custom button completion (if not hidden)
    if (!hiddenFields.customButton) {
      status.customButton = !!(customButtonName && customButtonName !== "Menu")
    }

    // Check website completion - must not be default/sample data
    const hasRealWebsite =
      formData.website && formData.website !== "www.businessname.com" && formData.website !== "Your Business Website"

    status.website = hasRealWebsite

    // At the end of the checkCompletionStatus function, before the return statement:
    // Check if all sections are complete or hidden
    const allComplete =
      (status.businessInfo || false) &&
      (status.video || hiddenFields.video) &&
      (status.photos || hiddenFields.photoAlbum) &&
      (status.coupons || hiddenFields.savingsButton) &&
      (status.jobs || hiddenFields.jobsButton) &&
      (status.customButton || hiddenFields.customButton) &&
      (status.website || hiddenFields.website)

    setIsAllComplete(allComplete)

    setCompletionStatus(status)
    return status
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

    // Check completion status and show dialog
    const status = await checkCompletionStatus()
    setIsCompletionDialogOpen(true)
  }

  // Add new function to actually save the data
  const handleActualSave = async () => {
    try {
      setIsLoading(true)

      // Save hidden fields settings
      await saveMediaSettings(businessId, { hiddenFields })

      // Format the phone number for saving - ensure consistent format
      const formattedPhone = getFormattedPhone()
      const formattedData = {
        ...formData,
        phone: formattedPhone, // Use the formatted phone number
        address: getFormattedAddress(), // Add the formatted address
      }

      console.log("Saving phone number:", formattedPhone) // Debug log

      // Inside the try block of handleSubmit, before calling saveBusinessAdDesign
      console.log("Saving custom button settings:", {
        type: customButtonType,
        name: customButtonName,
        icon: customButtonIcon,
      })

      // Save business ad design data with all the necessary information
      const result = await saveBusinessAdDesign(businessId, {
        designId: selectedDesign,
        colorScheme: selectedColor,
        colorValues: colorValues, // Save the actual color values
        texture: selectedTexture, // Add this line
        businessInfo: formattedData,
        hiddenFields: hiddenFields, // Save visibility settings
        customButton: {
          type: customButtonType,
          name: customButtonName,
          icon: customButtonIcon,
        },
        updatedAt: new Date().toISOString(),
      })

      if (result.success) {
        toast({
          title: "Success",
          description: "Your ad design has been saved successfully!",
        })

        // Close the completion dialog
        setIsCompletionDialogOpen(false)

        // Redirect to the workbench or another page after successful save
        // window.location.href = "/workbench"
      } else {
        throw new Error(result.error || "Failed to save ad design")
      }
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

  // Add new function to handle finalize and submit
  // Replace the handleFinalizeAndSubmit function with this new implementation
  // This should be around line 600-610
  const handleFinalizeAndSubmit = async () => {
    // Open the finalize dialog instead of showing a toast
    setIsFinalizeDialogOpen(true)
  }

  // Add a new function to handle the actual finalization
  // Add this after the handleFinalizeAndSubmit function
  const handleActualFinalization = async () => {
    try {
      toast({
        title: "Success",
        description: "Your business profile has been finalized and submitted!",
      })

      // Redirect to the workbench page after successful finalization
      window.location.href = "/workbench"
    } catch (error) {
      console.error("Error finalizing business profile:", error)
      toast({
        title: "Error",
        description: "Failed to finalize your business profile. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Modify the handleSubmit function to save the formatted phone number

  // Custom video control buttons component
  // const VideoControls = () => (
  //   <div className="flex justify-center mt-2 space-x-4">
  //     <button
  //       onClick={handlePlayVideo}
  //       className={`p-2 rounded-full ${isPlaying ? "opacity-50" : "opacity-100"}`}
  //       style={{ backgroundColor: colorValues.primary }}
  //       disabled={isPlaying}
  //     >
  //       <Play size={20} className="text-white" />
  //     </button>
  //     <button
  //       onClick={handlePauseVideo}
  //       className={`p-2 rounded-full ${!isPlaying ? "opacity-50" : "opacity-100"}`}
  //       style={{ backgroundColor: colorValues.primary }}
  //       disabled={!isPlaying}
  //     >
  //       <Pause size={20} className="text-white" />
  //     </button>
  //   </div>
  // )

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

  // Add this state variable with the other state variables
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)

  // Update the renderDesignPreview function to handle all designs with the selected color
  const renderDesignPreview = () => {
    // Default to Design 5 (Modern Business Card design)
    return (
      <div className="mb-8">
        <div className="overflow-hidden rounded-lg shadow-md">
          <Card className="max-w-md mx-auto">
            <div
              className={`p-5 ${colorValues.textColor ? "text-black" : "text-white"}`}
              style={{
                backgroundColor: selectedTexture === "gradient" ? "" : colorValues.primary,
                backgroundImage:
                  selectedTexture === "gradient"
                    ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                    : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundImage || "none",
                backgroundSize: textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundSize || "auto",
                backgroundRepeat:
                  textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundRepeat || "repeat",
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
                  <div
                    className="h-5 w-5 mt-0.5 flex-shrink-0"
                    style={{
                      color: colorValues.textColor ? "#000000" : colorValues.primary,
                    }}
                  >
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
                  <div
                    className="h-5 w-5 mt-0.5 flex-shrink-0"
                    style={{
                      color: colorValues.textColor ? "#000000" : colorValues.primary,
                    }}
                  >
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
                  <div
                    className="h-5 w-5 mt-0.5 flex-shrink-0"
                    style={{
                      color: colorValues.textColor ? "#000000" : colorValues.primary,
                    }}
                  >
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

            {/* Video Section - Using Cloudflare Video or Image Placeholder */}
            {!hiddenFields.video && (
              <div className="border-t pt-4 mt-4 px-4">
                <div className="relative w-full pb-[56.25%]">
                  {(() => {
                    console.log("Video render check:", {
                      cloudflareVideo,
                      hasVideoId: cloudflareVideo?.cloudflareVideoId,
                      isReady: cloudflareVideo?.cloudflareVideoReadyToStream,
                      fullCondition:
                        cloudflareVideo &&
                        cloudflareVideo.cloudflareVideoId &&
                        cloudflareVideo.cloudflareVideoReadyToStream,
                    })

                    if (cloudflareVideo && cloudflareVideo.cloudflareVideoId) {
                      // Use Cloudflare Stream iframe embed for better compatibility
                      const embedUrl = `https://customer-5093uhykxo17njhi.cloudflarestream.com/${cloudflareVideo.cloudflareVideoId}/iframe`

                      console.log("Rendering video with embed URL:", embedUrl)

                      return (
                        /* Cloudflare Video using iframe embed */
                        <div className="absolute inset-0 z-20 rounded-md overflow-hidden">
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                            allowFullScreen
                            style={{ border: "none" }}
                            title="Business Video"
                          />
                        </div>
                      )
                    } else {
                      console.log("Rendering placeholder image instead of video")
                      return (
                        /* Image Placeholder */
                        <div className="absolute inset-0 z-20 rounded-md overflow-hidden">
                          <img
                            src="https://imagedelivery.net/Fx83XHJ2QHIeAJio-AnNbA/78c875cc-ec1b-4ebb-a52e-a1387c030200/public"
                            alt="Business image"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Footer with buttons */}
            <div className="flex flex-col items-stretch gap-3 border-t pt-4 px-4 pb-4 mt-4">
              {/* Grid layout for buttons - matching the AdBox dialog layout */}
              <div className="grid grid-cols-3 gap-2">
                {!hiddenFields.photoAlbum && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-1 h-auto py-3"
                    onClick={handleOpenPhotoAlbum}
                  >
                    <ImageIcon
                      className="h-5 w-5"
                      style={{
                        color: colorValues.textColor ? "#000000" : colorValues.primary,
                      }}
                    />
                    <span className="text-xs">Photo Album</span>
                  </Button>
                )}

                {!hiddenFields.savingsButton && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-1 h-auto py-3"
                    onClick={() => setIsSavingsDialogOpen(true)}
                  >
                    <Ticket
                      className="h-5 w-5"
                      style={{
                        color: colorValues.textColor ? "#000000" : colorValues.primary,
                      }}
                    />
                    <span className="text-xs">Coupons</span>
                  </Button>
                )}

                {!hiddenFields.jobsButton && (
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-1 h-auto py-3"
                    onClick={() => setIsJobsDialogOpen(true)}
                  >
                    <Briefcase
                      className="h-5 w-5"
                      style={{
                        color: colorValues.textColor ? "#000000" : colorValues.primary,
                      }}
                    />
                    <span className="text-xs">Jobs</span>
                  </Button>
                )}
              </div>

              {/* Custom Button */}
              {!hiddenFields.customButton && (
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center gap-1 h-auto py-3 mt-2"
                  onClick={() => setIsDocumentsOpen(true)}
                >
                  {(() => {
                    const IconComponent = getIconComponent(customButtonIcon)
                    return (
                      <IconComponent
                        className="h-5 w-5"
                        style={{
                          color: colorValues.textColor ? "#000000" : colorValues.primary,
                        }}
                      />
                    )
                  })()}
                  <span className="text-xs">{customButtonName}</span>
                </Button>
              )}

              {/* Website button */}

              <button
                onClick={() => window.open(`https://${formData.website}`, "_blank")}
                className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 ${
                  colorValues.textColor ? "text-black" : "text-white"
                }`}
                style={{
                  backgroundColor: selectedTexture === "gradient" ? "" : colorValues.primary,
                  backgroundImage:
                    selectedTexture === "gradient"
                      ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                      : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundImage || "none",
                  backgroundSize:
                    textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundSize || "auto",
                  backgroundRepeat:
                    textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundRepeat || "repeat",
                }}
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
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Add useEffect to check completion status when data changes
  useEffect(() => {
    if (businessId) {
      checkCompletionStatus()
    }
  }, [formData, hiddenFields, photos, cloudflareVideo, businessId])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Customize Your AdBox</h1>

              {selectedDesign ? (
                <>
                  {renderDesignPreview()}

                  {/* Color Selection Section */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Color Theme</h3>
                      <div className="grid grid-cols-4 gap-3">
                        {Object.entries(colorMap).map(([colorKey, colorObj]) => (
                          <button
                            key={colorKey}
                            onClick={() => setSelectedColor(colorKey)}
                            className={`w-12 h-12 rounded-lg border-2 ${
                              selectedColor === colorKey ? "border-gray-800" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: colorObj.primary }}
                            title={colorKey}
                          />
                        ))}
                      </div>
                    </div>
                  </Card>

                  {/* Texture Options Section */}
                  <Card className="p-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Texture Options</h3>
                      <p className="text-sm text-gray-600">Choose a texture pattern for your header and buttons</p>

                      <div className="grid grid-cols-3 gap-3">
                        {textureOptions.map((texture) => (
                          <button
                            key={texture.value}
                            onClick={() => setSelectedTexture(texture.value)}
                            className={`p-3 border rounded-lg text-center ${
                              selectedTexture === texture.value ? "border-blue-500 bg-blue-50" : "border-gray-300"
                            }`}
                          >
                            <div className="text-sm font-medium">
                              <span className="hidden sm:inline">{texture.name}</span>
                              <span className="sm:hidden">
                                {texture.name === "Diagonal"
                                  ? "Diag"
                                  : texture.name === "Gradient"
                                    ? "Grad"
                                    : texture.name}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </Card>
                </>
              ) : (
                <div className="text-center py-12">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No design selected</h2>
                  <p className="text-gray-600 mb-4">Please go back to the design page.</p>
                  <Button onClick={() => window.history.back()}>Back to Design Page</Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Information Section */}
              <Card className="p-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Business Information</h3>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hiddenFields.address}
                            onChange={() => toggleFieldVisibility("address")}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Hide from AdBox</span>
                        </label>
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          name="streetAddress"
                          placeholder="Street Address"
                          value={formData.streetAddress}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            name="city"
                            placeholder="City"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="state"
                            placeholder="State"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            name="zipCode"
                            placeholder="ZIP Code"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hiddenFields.phone}
                            onChange={() => toggleFieldVisibility("phone")}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Hide from AdBox</span>
                        </label>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <input
                          type="text"
                          name="phoneArea"
                          placeholder="Area"
                          value={formData.phoneArea}
                          onChange={(e) => handlePhoneChange(e, "phoneArea")}
                          maxLength={3}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          name="phonePrefix"
                          placeholder="Prefix"
                          value={formData.phonePrefix}
                          onChange={(e) => handlePhoneChange(e, "phonePrefix")}
                          maxLength={3}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          name="phoneLine"
                          placeholder="Line"
                          value={formData.phoneLine}
                          onChange={(e) => handlePhoneChange(e, "phoneLine")}
                          maxLength={4}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Format: (123) 456-7890</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Business Hours</label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hiddenFields.hours}
                            onChange={() => toggleFieldVisibility("hours")}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Hide from AdBox</span>
                        </label>
                      </div>

                      <textarea
                        name="hours"
                        value={formData.hours}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter each day on a new line"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Website</label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hiddenFields.website}
                            onChange={() => toggleFieldVisibility("website")}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Hide from AdBox</span>
                        </label>
                      </div>

                      <input
                        type="text"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Free Text Section */}
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Custom Message</label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hiddenFields.freeText}
                        onChange={() => toggleFieldVisibility("freeText")}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Hide from AdBox</span>
                    </label>
                  </div>

                  <textarea
                    name="freeText"
                    value={formData.freeText}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter a custom message or slogan to display in your AdBox"
                  />
                  <p className="text-xs text-gray-500">This text will be displayed prominently in your AdBox</p>
                </div>
              </Card>

              {/* Feature Buttons Section */}
              <Card className="p-6">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Feature Buttons</h3>

                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hiddenFields.savingsButton}
                        onChange={() => toggleFieldVisibility("savingsButton")}
                        className="mr-3"
                      />
                      <span className="text-sm">Hide Savings Button</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hiddenFields.jobsButton}
                        onChange={() => toggleFieldVisibility("jobsButton")}
                        className="mr-3"
                      />
                      <span className="text-sm">Hide Job Opportunities Button</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hiddenFields.website}
                        onChange={() => toggleFieldVisibility("website")}
                        className="mr-3"
                      />
                      <span className="text-sm">Hide Website Button/Link</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hiddenFields.photoAlbum}
                        onChange={() => toggleFieldVisibility("photoAlbum")}
                        className="mr-3"
                      />
                      <span className="text-sm">Hide Photo Album Button/Link</span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">Custom Button</label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={hiddenFields.customButton}
                          onChange={() => toggleFieldVisibility("customButton")}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-600">Hide Custom Button</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label htmlFor="customButtonType" className="block text-sm font-medium text-gray-700 mb-1">
                          Button Type
                        </label>
                        <select
                          id="customButtonType"
                          value={customButtonType}
                          onChange={handleCustomButtonTypeChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Menu">Menu</option>
                          <option value="Forms">Forms</option>
                          <option value="Product List">Product List</option>
                          <option value="Other">Other (Custom Name)</option>
                        </select>
                      </div>

                      {showCustomNameInput && (
                        <div>
                          <label htmlFor="customButtonName" className="block text-sm font-medium text-gray-700 mb-1">
                            Custom Button Name
                          </label>
                          <input
                            type="text"
                            id="customButtonName"
                            value={customButtonName}
                            onChange={handleCustomButtonNameChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Button Icon</h3>
                <div className="grid grid-cols-4 gap-3">
                  {availableIcons.map((icon) => {
                    const IconComponent = icon.component
                    return (
                      <button
                        key={icon.name}
                        type="button"
                        onClick={() => setCustomButtonIcon(icon.name)}
                        className={`p-3 border rounded-lg flex flex-col items-center gap-2 ${
                          customButtonIcon === icon.name ? "border-blue-500 bg-blue-50" : "border-gray-300"
                        }`}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="text-xs">
                          <span className="hidden sm:inline">{icon.name}</span>
                          <span className="sm:hidden">
                            {icon.name === "MessageSquare" ? "Msg" : icon.name === "ShoppingCart" ? "Cart" : icon.name}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Card>

              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save"}
                </Button>

                <Button type="button" onClick={handleFinalizeAndSubmit} variant="outline" className="flex-1">
                  Finalize and Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Placeholder dialogs - these would need to be implemented */}
      {isSavingsDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Coupons & Savings</h3>
            <p className="text-gray-600 mb-4">Coupons dialog would go here</p>
            <Button onClick={() => setIsSavingsDialogOpen(false)}>Close</Button>
          </div>
        </div>
      )}

      {isPhotoAlbumDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Photo Album</h3>
            <p className="text-gray-600 mb-4">Photo album dialog would go here</p>
            <Button onClick={() => setIsPhotoAlbumDialogOpen(false)}>Close</Button>
          </div>
        </div>
      )}

      {isJobsDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Job Listings</h3>
            <p className="text-gray-600 mb-4">Job listings dialog would go here</p>
            <Button onClick={() => setIsJobsDialogOpen(false)}>Close</Button>
          </div>
        </div>
      )}

      {isDocumentsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Documents</h3>
            <p className="text-gray-600 mb-4">Documents dialog would go here</p>
            <Button onClick={() => setIsDocumentsOpen(false)}>Close</Button>
          </div>
        </div>
      )}

      {isCompletionDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">AdBox Completion Status</h3>
                <p className="text-gray-600">Review which sections of your AdBox are complete before saving.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Business Information</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      completionStatus.businessInfo ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {completionStatus.businessInfo ? "Complete" : "Needs Content"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Business Video</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      hiddenFields.video
                        ? "bg-gray-100 text-gray-600"
                        : completionStatus.video
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {hiddenFields.video ? "Hidden" : completionStatus.video ? "Complete" : "Needs Content"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Photo Album</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      hiddenFields.photoAlbum
                        ? "bg-gray-100 text-gray-600"
                        : completionStatus.photos
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {hiddenFields.photoAlbum ? "Hidden" : completionStatus.photos ? "Complete" : "Needs Content"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Coupons & Savings</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      hiddenFields.savingsButton
                        ? "bg-gray-100 text-gray-600"
                        : completionStatus.coupons
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {hiddenFields.savingsButton ? "Hidden" : completionStatus.coupons ? "Complete" : "Needs Content"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Job Listings</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      hiddenFields.jobsButton
                        ? "bg-gray-100 text-gray-600"
                        : completionStatus.jobs
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {hiddenFields.jobsButton ? "Hidden" : completionStatus.jobs ? "Complete" : "Needs Content"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Custom Button</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      hiddenFields.customButton
                        ? "bg-gray-100 text-gray-600"
                        : completionStatus.customButton
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {hiddenFields.customButton ? "Hidden" : completionStatus.customButton ? "Complete" : "Needs Setup"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">Website Link</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      hiddenFields.website
                        ? "bg-gray-100 text-gray-600"
                        : completionStatus.website
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {hiddenFields.website ? "Hidden" : completionStatus.website ? "Complete" : "Needs Content"}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> If you don't want to add photos, coupons, job listings, or a custom button, you
                  can hide them using the checkboxes in the form above.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsCompletionDialogOpen(false)} className="flex-1">
                  Continue Editing
                </Button>
                <Button onClick={handleActualSave} disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFinalizeDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Finalize Business Profile</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to finalize and submit your business profile? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsFinalizeDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleActualFinalization} className="flex-1">
                Finalize and Submit
              </Button>
            </div>
          </div>
        </div>
      )}
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
