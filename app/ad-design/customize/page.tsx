"use client"

import { useState, useEffect, useRef } from "react"
import type React from "react"

import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { type Coupon, getBusinessCoupons } from "@/app/actions/coupon-actions"
import { type JobListing, getBusinessJobs } from "@/app/actions/job-actions"
import { toast } from "@/components/ui/use-toast"
import { getBusinessMedia, saveMediaSettings, type MediaItem } from "@/app/actions/media-actions"
import { saveBusinessAdDesign, getBusinessAdDesign } from "@/app/actions/business-actions"
import { getCurrentBusiness } from "@/app/actions/auth-actions"
import { getCloudflareBusinessMedia, type CloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"
import { getBusinessDocuments } from "@/app/actions/document-actions"

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
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"

import { BusinessPhotoAlbumDialog } from "@/components/business-photo-album-dialog"
import { BusinessCouponsDialog } from "@/components/business-coupons-dialog"
import { BusinessJobsDialog } from "@/components/business-jobs-dialog"
import { DocumentsDialog } from "@/components/documents-dialog"

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
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false)

  // Add custom color state
  const [useCustomColors, setUseCustomColors] = useState(false)
  const [customColors, setCustomColors] = useState({
    primary: "#007BFF",
    secondary: "#0056b3",
  })

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

  // Helper function to detect if a color is light
  const isLightColor = (hexColor: string): boolean => {
    const hex = hexColor.replace("#", "")
    const r = Number.parseInt(hex.substr(0, 2), 16)
    const g = Number.parseInt(hex.substr(2, 2), 16)
    const b = Number.parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128
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

  // Get the selected color values - use custom colors if enabled
  const colorValues = useCustomColors
    ? {
        primary: customColors.primary,
        secondary: customColors.secondary,
        textColor: isLightColor(customColors.primary) ? "#000000" : undefined,
      }
    : colorMap[selectedColor] || colorMap.blue

  const [formData, setFormData] = useState({
    businessName: "Business Name",
    streetAddress: "123 Business St",
    city: "City",
    state: "ST",
    zipCode: "12345",
    phoneArea: "555",
    phonePrefix: "123",
    phoneLine: "4567",
    email: "business@example.com", // Add this line
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
    email: boolean // Add this line
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
    email: false, // Add this line
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

  // Custom color handlers
  const handleCustomColorChange = (colorType: "primary" | "secondary", value: string) => {
    setCustomColors((prev) => ({
      ...prev,
      [colorType]: value,
    }))
  }

  const handleHexInputChange = (colorType: "primary" | "secondary", value: string) => {
    // Validate hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (hexRegex.test(value) || value === "") {
      setCustomColors((prev) => ({
        ...prev,
        [colorType]: value.startsWith("#") ? value : `#${value}`,
      }))
    }
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
          email: businessInfo.email || "business@example.com", // Add this line
          hours: businessInfo.hours || "Mon-Fri: 9AM-5PM\nSat: 10AM-3PM",
          website: businessInfo.website || "www.businessname.com",
          freeText:
            businessInfo.freeText || "We offer professional services with 10+ years of experience in the industry.",
          videoFile: null,
          thumbnailFile: null,
        })

        // If we have saved custom colors, use them
        if (savedDesign.customColors) {
          setUseCustomColors(true)
          setCustomColors(savedDesign.customColors)
        } else if (savedDesign.colorScheme === "custom") {
          setUseCustomColors(true)
        } else {
          setUseCustomColors(false)
        }

        // If we have a saved color scheme, use it
        if (savedDesign.colorScheme && savedDesign.colorScheme !== "custom") {
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
          email: "your-business@example.com", // Add this line
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
        email: "your-business@example.com", // Add this line
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

    const hasRealEmail = formData.email && formData.email !== "business@example.com" // Add this line

    const hasRealHours =
      formData.hours && formData.hours !== "Mon-Fri: 9AM-5PM\nSat: 10AM-3PM" && formData.hours !== "Your Business Hours"

    // Business info is complete only if all fields have real data
    status.businessInfo =
      hasRealBusinessName && hasRealAddress && hasRealCity && hasRealPhone && hasRealEmail && hasRealHours // Add hasRealEmail

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
      // Check if custom button has been configured (any name, including default "Menu")
      const hasCustomButtonName = !!(customButtonName && customButtonName.trim() !== "")

      // Check if documents have been uploaded
      let hasDocuments = false
      try {
        const documents = await getBusinessDocuments(businessId)
        hasDocuments = documents && documents.length > 0
      } catch (error) {
        console.error("Error checking documents for completion status:", error)
        hasDocuments = false
      }

      // Custom button is complete if it has a name (including default "Menu") AND documents uploaded
      status.customButton = hasCustomButtonName && hasDocuments

      console.log(
        `Custom button completion: name="${customButtonName}", hasName=${hasCustomButtonName}, documents=${hasDocuments}, complete=${status.customButton}`,
      )
    } else {
      // If custom button is hidden, mark as complete
      status.customButton = true
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
        colorScheme: useCustomColors ? "custom" : selectedColor,
        customColors: useCustomColors ? customColors : null,
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
  const handleFinalizeAndSubmit = async () => {
    // Open the finalize dialog instead of showing a toast
    setIsFinalizeDialogOpen(true)
  }

  // Add a new function to handle the actual finalization
  const handleActualFinalization = async () => {
    try {
      // First save the current changes
      await handleActualSave()

      toast({
        title: "Success",
        description: "Your business profile has been finalized and submitted!",
      })

      // Close the finalize dialog
      setIsFinalizeDialogOpen(false)

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
      // Use the actual business ID from component state, not hardcoded
      if (!businessId) {
        console.warn("No business ID available for fetching job listings")
        setJobListings([])
        return
      }

      const jobs = await getBusinessJobs(businessId)

      // Ensure jobs is an array before processing
      if (!Array.isArray(jobs)) {
        console.error("getBusinessJobs did not return an array:", jobs)
        setJobListings([])
        return
      }

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

              {!hiddenFields.email && (
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
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p>{formData.email}</p>
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

            {/* Video Section - Only show if video exists */}
            {!hiddenFields.video && cloudflareVideo && cloudflareVideo.cloudflareVideoId && (
              <div className="border-t pt-4 mt-4 px-4">
                <div className="relative w-full pb-[56.25%]">
                  <div className="absolute inset-0 z-20 rounded-md overflow-hidden">
                    <iframe
                      src={`https://customer-5093uhykxo17njhi.cloudflarestream.com/${cloudflareVideo.cloudflareVideoId}/iframe`}
                      className="w-full h-full"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                      allowFullScreen
                      style={{ border: "none" }}
                      title="Business Video"
                    />
                  </div>
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

              {/* Website button/footer */}
              {!hiddenFields.website ? (
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
              ) : (
                <div
                  className={`flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
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
                  {/* Empty div to maintain the colored footer bar */}
                </div>
              )}
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
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold">Color Theme</h3>

                      {/* Toggle between preset and custom colors */}
                      <div className="flex items-center gap-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="colorMode"
                            checked={!useCustomColors}
                            onChange={() => setUseCustomColors(false)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Preset Colors</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="colorMode"
                            checked={useCustomColors}
                            onChange={() => setUseCustomColors(true)}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium">Custom Colors</span>
                        </label>
                      </div>

                      {/* Preset Colors */}
                      {!useCustomColors && (
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">Choose from our preset color combinations</p>
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
                      )}

                      {/* Custom Colors */}
                      {useCustomColors && (
                        <div className="space-y-6">
                          <p className="text-sm text-gray-600">Create your own custom color combination</p>

                          {/* Primary Color */}
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={customColors.primary}
                                  onChange={(e) => handleCustomColorChange("primary", e.target.value)}
                                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                                  title="Pick primary color"
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500">Color Picker</span>
                                  <span className="text-xs font-mono">{customColors.primary}</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Hex Code</label>
                                <input
                                  type="text"
                                  value={customColors.primary}
                                  onChange={(e) => handleHexInputChange("primary", e.target.value)}
                                  placeholder="#007BFF"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                  maxLength={7}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Secondary Color */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
                              <span className="text-xs text-gray-500 italic">
                                Secondary colors appear only if Gradient is selected in the Texture Options
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={customColors.secondary}
                                  onChange={(e) => handleCustomColorChange("secondary", e.target.value)}
                                  className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                                  title="Pick secondary color"
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs text-gray-500">Color Picker</span>
                                  <span className="text-xs font-mono">{customColors.secondary}</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs text-gray-500 mb-1">Hex Code</label>
                                <input
                                  type="text"
                                  value={customColors.secondary}
                                  onChange={(e) => handleHexInputChange("secondary", e.target.value)}
                                  placeholder="#0056b3"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                  maxLength={7}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Color Preview */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Preview</label>
                            <div className="flex gap-2">
                              <div
                                className="w-16 h-8 rounded border border-gray-300 flex items-center justify-center"
                                style={{ backgroundColor: customColors.primary }}
                              >
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: isLightColor(customColors.primary) ? "#000" : "#fff" }}
                                >
                                  Primary
                                </span>
                              </div>
                              <div
                                className="w-16 h-8 rounded border border-gray-300 flex items-center justify-center"
                                style={{ backgroundColor: customColors.secondary }}
                              >
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: isLightColor(customColors.secondary) ? "#000" : "#fff" }}
                                >
                                  Secondary
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
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

                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            name="phoneArea"
                            placeholder="Area Code"
                            value={formData.phoneArea}
                            onChange={(e) => handlePhoneChange(e, "phoneArea")}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={3}
                          />
                          <input
                            type="text"
                            name="phonePrefix"
                            placeholder="Prefix"
                            value={formData.phonePrefix}
                            onChange={(e) => handlePhoneChange(e, "phonePrefix")}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={3}
                          />
                          <input
                            type="text"
                            name="phoneLine"
                            placeholder="Line"
                            value={formData.phoneLine}
                            onChange={(e) => handlePhoneChange(e, "phoneLine")}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={hiddenFields.email}
                            onChange={() => toggleFieldVisibility("email")}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Hide from AdBox</span>
                        </label>
                      </div>
                      <div>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Hours of Operation</label>
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
                      <div>
                        <textarea
                          id="hours"
                          name="hours"
                          value={formData.hours}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                      </div>
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
                      <div>
                        <input
                          type="text"
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">Free Text</label>
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
                      <div>
                        <textarea
                          id="freeText"
                          name="freeText"
                          value={formData.freeText}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Custom Button Section */}
              <Card className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Custom Button</h3>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hiddenFields.customButton}
                        onChange={() => toggleFieldVisibility("customButton")}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Hide from AdBox</span>
                    </label>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="customButtonType" className="block text-sm font-medium text-gray-700 mb-1">
                        Button Type
                      </label>
                      <select
                        id="customButtonType"
                        name="customButtonType"
                        value={customButtonType}
                        onChange={handleCustomButtonTypeChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Menu</option>
                        <option>List</option>
                        <option>FileText</option>
                        <option>ShoppingCart</option>
                        <option>Clipboard</option>
                        <option>Calendar</option>
                        <option>MessageSquare</option>
                        <option>Map</option>
                        <option>Settings</option>
                        <option>BookOpen</option>
                        <option>PenTool</option>
                        <option>Truck</option>
                        <option>Heart</option>
                        <option>Coffee</option>
                        <option>Gift</option>
                        <option>Music</option>
                        <option>Other</option>
                      </select>
                    </div>

                    {showCustomNameInput && (
                      <div>
                        <label htmlFor="customButtonName" className="block text-sm font-medium text-gray-700 mb-1">
                          Button Name
                        </label>
                        <input
                          type="text"
                          id="customButtonName"
                          name="customButtonName"
                          value={customButtonName}
                          onChange={handleCustomButtonNameChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    <div>
                      <label htmlFor="customButtonIcon" className="block text-sm font-medium text-gray-700 mb-1">
                        Button Icon
                      </label>
                      <select
                        id="customButtonIcon"
                        name="customButtonIcon"
                        value={customButtonIcon}
                        onChange={(e) => setCustomButtonIcon(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {availableIcons.map((icon) => (
                          <option key={icon.name} value={icon.name}>
                            {icon.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Button Visibility Section */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Button Visibility</h3>
                <p className="text-sm text-gray-600">Control which elements are visible in the AdBox.</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Video</label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hiddenFields.video}
                        onChange={() => toggleFieldVisibility("video")}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Hide from AdBox</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Photo Album</label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hiddenFields.photoAlbum}
                        onChange={() => toggleFieldVisibility("photoAlbum")}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Hide from AdBox</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Savings Button</label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hiddenFields.savingsButton}
                        onChange={() => toggleFieldVisibility("savingsButton")}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Hide from AdBox</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">Jobs Button</label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hiddenFields.jobsButton}
                        onChange={() => toggleFieldVisibility("jobsButton")}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Hide from AdBox</span>
                    </label>
                  </div>
                </div>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
                <Button type="button" variant="secondary" onClick={handleFinalizeAndSubmit} className="ml-4">
                  Finalize & Submit
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Completion Status Dialog */}
      <Dialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Save Progress</DialogTitle>
            <DialogDescription>Review your completion status before saving your ad design.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-3">
              {Object.entries(completionStatus).map(([key, isComplete]) => {
                const labels = {
                  businessInfo: "Business Information",
                  video: "Video",
                  photos: "Photos",
                  coupons: "Coupons",
                  jobs: "Job Listings",
                  customButton: "Custom Button",
                  website: "Website",
                }

                return (
                  <div key={key} className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={`text-sm ${isComplete ? "text-green-700" : "text-red-700"}`}>
                      {labels[key as keyof typeof labels]}
                    </span>
                  </div>
                )
              })}
            </div>

            {!isAllComplete && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  Some sections are incomplete. You can still save your progress and complete them later.
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsCompletionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleActualSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Progress"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finalize Dialog */}
      <Dialog open={isFinalizeDialogOpen} onOpenChange={setIsFinalizeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finalize & Submit</DialogTitle>
            <DialogDescription>
              Are you ready to finalize and submit your business profile? This will save all your changes and mark your
              profile as complete.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              Once finalized, you can still make changes later, but your profile will be marked as ready for review.
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsFinalizeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleActualFinalization} disabled={isLoading}>
              {isLoading ? "Finalizing..." : "Finalize & Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo Album Dialog */}
      <BusinessPhotoAlbumDialog
        open={isPhotoAlbumDialogOpen}
        onOpenChange={setIsPhotoAlbumDialogOpen}
        photos={photos}
        businessId={businessId}
      />

      {/* Coupons Dialog */}
      <BusinessCouponsDialog
        open={isSavingsDialogOpen}
        onOpenChange={setIsSavingsDialogOpen}
        coupons={savedCoupons}
        isLoading={isCouponsLoading}
        businessId={businessId}
      />

      {/* Jobs Dialog */}
      <BusinessJobsDialog
        open={isJobsDialogOpen}
        onOpenChange={setIsJobsDialogOpen}
        jobs={jobListings}
        isLoading={isJobsLoading}
        businessId={businessId}
      />

      {/* Documents Dialog */}
      <DocumentsDialog open={isDocumentsOpen} onOpenChange={setIsDocumentsOpen} businessId={businessId} />
    </div>
  )
}
