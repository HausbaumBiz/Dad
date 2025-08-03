"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getBusinessMedia, type MediaItem } from "@/app/actions/media-actions"
import {
  getBusinessAdDesign,
  saveBusinessAdDesign,
  saveBusinessHeaderImage,
  getBusinessHeaderImage,
} from "@/app/actions/business-actions"
import { getCurrentBusiness } from "@/app/actions/auth-actions"
import { getCloudflareBusinessMedia, type CloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"
import { uploadHeaderImageToCloudflare, getCloudflareDeliveryUrl } from "@/app/actions/cloudflare-image-actions"
import {
  ImageIcon,
  Ticket,
  Briefcase,
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
  Phone,
  Mail,
  MapPin,
  Monitor,
  Smartphone,
  Square,
  Upload,
  Save,
} from "lucide-react"

interface PhotoItem {
  id: string
  url: string
  name: string
}

type LayoutType = "standard" | "video-focus" | "info-focus"
type VideoAspectRatio = "landscape" | "portrait" | "square"

interface HeaderImageData {
  imageId: string
  viewWindowPosition: { x: number; y: number }
  originalImageDimensions: { width: number; height: number }
  updatedAt: string
}

export default function CustomizeDesktopProfilePage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingImage, setIsSavingImage] = useState(false)
  const [selectedColor, setSelectedColor] = useState("blue")
  const [selectedTexture, setSelectedTexture] = useState("gradient")
  const [useCustomColors, setUseCustomColors] = useState(false)
  const [customColors, setCustomColors] = useState({
    primary: "#007BFF",
    secondary: "#0056b3",
  })

  const [showImageUpload, setShowImageUpload] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [savedHeaderImage, setSavedHeaderImage] = useState<string | null>(null)
  const [viewWindowPosition, setViewWindowPosition] = useState({ x: 0, y: 0 })
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLImageElement>(null)
  const viewWindowRef = useRef<HTMLDivElement>(null)

  const [headerTextColor, setHeaderTextColor] = useState<"white" | "black">("white")

  // Desktop layout customization state
  const [layoutType, setLayoutType] = useState<LayoutType>("standard")
  const [backgroundColor, setBackgroundColor] = useState("#ffffff")
  const [videoAspectRatio, setVideoAspectRatio] = useState<VideoAspectRatio>("landscape")

  // Form data state
  const [formData, setFormData] = useState({
    businessName: "Business Name",
    streetAddress: "123 Business St",
    city: "City",
    state: "ST",
    zipCode: "12345",
    phoneArea: "555",
    phonePrefix: "123",
    phoneLine: "4567",
    email: "business@example.com",
    hours: "Mon-Fri: 9AM-5PM\nSat: 10AM-3PM",
    website: "www.businessname.com",
    freeText: "We offer professional services with 10+ years of experience in the industry.",
  })

  // Hidden fields state
  const [hiddenFields, setHiddenFields] = useState<{
    address: boolean
    phone: boolean
    email: boolean
    hours: boolean
    website: boolean
    video: boolean
    photoAlbum: boolean
    freeText: boolean
    savingsButton: boolean
    jobsButton: boolean
    customButton: boolean
  }>({
    address: false,
    phone: false,
    email: false,
    hours: false,
    website: false,
    video: false,
    photoAlbum: false,
    freeText: false,
    savingsButton: false,
    jobsButton: false,
    customButton: false,
  })

  // Custom button state
  const [customButtonType, setCustomButtonType] = useState<string>("Menu")
  const [customButtonName, setCustomButtonName] = useState<string>("Menu")
  const [customButtonIcon, setCustomButtonIcon] = useState<string>("Menu")

  // Media state
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [cloudflareVideo, setCloudflareVideo] = useState<CloudflareBusinessMedia | null>(null)

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

  // Texture options
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

  // Get the selected color values
  const colorValues = useCustomColors
    ? {
        primary: customColors.primary,
        secondary: customColors.secondary,
        textColor: isLightColor(customColors.primary) ? "#000000" : undefined,
      }
    : colorMap[selectedColor] || colorMap.blue

  // Get background color value
  const getBackgroundColorValue = () => {
    return backgroundColor
  }

  // Load business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setIsLoading(true)

        // Get the current business from the session
        const business = await getCurrentBusiness()
        let id = "demo-business"

        if (business && business.id) {
          id = business.id
        }

        setBusinessId(id)

        // Load saved media
        await loadSavedMedia(id)

        // Load business data
        await loadBusinessData(id)

        // Load saved header image
        await loadSavedHeaderImage(id)

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

  // Load saved header image
  const loadSavedHeaderImage = async (id: string) => {
    try {
      const headerImageData = await getBusinessHeaderImage(id)

      if (headerImageData && headerImageData.imageId) {
        console.log("Loading saved header image:", headerImageData)

        // Get the Cloudflare delivery URL
        const imageUrl = await getCloudflareDeliveryUrl(headerImageData.imageId)

        if (imageUrl) {
          setSavedHeaderImage(imageUrl)
          setViewWindowPosition(headerImageData.viewWindowPosition || { x: 0, y: 0 })
          setOriginalImageDimensions(headerImageData.originalImageDimensions || { width: 0, height: 0 })
          console.log("Loaded saved header image:", imageUrl)
        }
      }
    } catch (error) {
      console.error("Error loading saved header image:", error)
    }
  }

  // Load saved media for the business
  const loadSavedMedia = async (id: string) => {
    try {
      const media = await getBusinessMedia(id)

      // Load Cloudflare video
      const cloudflareMedia = await getCloudflareBusinessMedia(id)
      if (cloudflareMedia && cloudflareMedia.cloudflareVideoId) {
        setCloudflareVideo(cloudflareMedia)
      }

      if (media) {
        // Set photo album if available
        if (media.photoAlbum && Array.isArray(media.photoAlbum) && media.photoAlbum.length > 0) {
          const loadedPhotos = media.photoAlbum.map((photo: MediaItem) => ({
            id: photo.id,
            url: photo.url,
            name: photo.filename || "Unnamed photo",
          }))
          setPhotos(loadedPhotos)
        } else {
          setPhotos([])
        }
      }
    } catch (error) {
      console.error("Error loading saved media:", error)
      setCloudflareVideo(null)
      setPhotos([])
    }
  }

  // Load business data
  const loadBusinessData = async (id: string) => {
    try {
      const savedDesign = await getBusinessAdDesign(id)

      if (savedDesign && savedDesign.businessInfo) {
        const businessInfo = savedDesign.businessInfo

        // Parse phone number
        let phoneArea = "555"
        let phonePrefix = "123"
        let phoneLine = "4567"

        if (businessInfo.phone) {
          const phoneMatch = businessInfo.phone.match(/$$(\d{3})$$\s*(\d{3})-(\d{4})/)
          if (phoneMatch) {
            phoneArea = phoneMatch[1]
            phonePrefix = phoneMatch[2]
            phoneLine = phoneMatch[3]
          } else {
            const digitsOnly = businessInfo.phone.replace(/\D/g, "")
            if (digitsOnly.length === 10) {
              phoneArea = digitsOnly.slice(0, 3)
              phonePrefix = digitsOnly.slice(3, 6)
              phoneLine = digitsOnly.slice(6, 10)
            }
          }
        }

        // Load hidden fields
        if (savedDesign.hiddenFields) {
          setHiddenFields((prevFields) => ({
            ...prevFields,
            ...savedDesign.hiddenFields,
          }))
        }

        // Load custom button settings
        if (savedDesign.customButton) {
          setCustomButtonType(savedDesign.customButton.type || "Menu")
          setCustomButtonName(savedDesign.customButton.name || "Menu")
          setCustomButtonIcon(savedDesign.customButton.icon || "Menu")
        }

        // Load desktop layout settings
        if (savedDesign.desktopLayout) {
          setLayoutType(savedDesign.desktopLayout.layoutType || "standard")
          setBackgroundColor(savedDesign.desktopLayout.backgroundColor || "#ffffff")
          setVideoAspectRatio(savedDesign.desktopLayout.videoAspectRatio || "landscape")
        }

        // Update form data
        setFormData({
          businessName: businessInfo.businessName || "Business Name",
          streetAddress: businessInfo.streetAddress || "123 Business St",
          city: businessInfo.city || "City",
          state: businessInfo.state || "ST",
          zipCode: businessInfo.zipCode || "12345",
          phoneArea: phoneArea || "555",
          phonePrefix: phonePrefix || "123",
          phoneLine: phoneLine || "4567",
          email: businessInfo.email || "business@example.com",
          hours: businessInfo.hours || "Mon-Fri: 9AM-5PM\nSat: 10AM-3PM",
          website: businessInfo.website || "www.businessname.com",
          freeText:
            businessInfo.freeText || "We offer professional services with 10+ years of experience in the industry.",
        })

        // Load color settings
        if (savedDesign.customColors) {
          setUseCustomColors(true)
          setCustomColors(savedDesign.customColors)
        } else if (savedDesign.colorScheme === "custom") {
          setUseCustomColors(true)
        } else {
          setUseCustomColors(false)
        }

        if (savedDesign.colorScheme && savedDesign.colorScheme !== "custom") {
          setSelectedColor(savedDesign.colorScheme)
        }

        if (savedDesign.texture) {
          setSelectedTexture(savedDesign.texture)
        }

        // Load header text color
        if (savedDesign.headerTextColor) {
          console.log("Loading saved header text color:", savedDesign.headerTextColor)
          setHeaderTextColor(savedDesign.headerTextColor)
        } else {
          console.log("No saved header text color found, using default 'white'")
          setHeaderTextColor("white")
        }
      }
    } catch (error) {
      console.error("Error loading business data:", error)
    }
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setUploadedImage(result)
        setViewWindowPosition({ x: 0, y: 0 })

        // Create an image element to get dimensions
        const img = new Image()
        img.onload = () => {
          setOriginalImageDimensions({ width: img.width, height: img.height })
        }
        img.src = result
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle mouse down on view window
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({
      x: e.clientX - viewWindowPosition.x,
      y: e.clientY - viewWindowPosition.y,
    })
  }

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return

    const imageRect = imageRef.current.getBoundingClientRect()
    const headerWidth = Math.min(800, imageRect.width) // Max header width
    const headerHeight = 200 // Header height

    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, imageRect.width - headerWidth))
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, imageRect.height - headerHeight))

    setViewWindowPosition({ x: newX, y: newY })
  }

  // Handle mouse up
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Save header image to Cloudflare
  const saveHeaderImage = async () => {
    if (!uploadedImage) {
      toast({
        title: "Error",
        description: "No image to save. Please upload an image first.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSavingImage(true)

      console.log("Saving header image with position:", viewWindowPosition)
      console.log("Original image dimensions:", originalImageDimensions)

      // Upload image to Cloudflare
      const uploadResult = await uploadHeaderImageToCloudflare(
        uploadedImage,
        businessId,
        viewWindowPosition,
        originalImageDimensions,
      )

      if (!uploadResult.success || !uploadResult.imageId) {
        throw new Error(uploadResult.error || "Failed to upload image")
      }

      // Save header image data to database
      const saveResult = await saveBusinessHeaderImage(
        businessId,
        uploadResult.imageId,
        viewWindowPosition,
        originalImageDimensions,
      )

      if (!saveResult.success) {
        throw new Error(saveResult.error || "Failed to save image data")
      }

      // Get the Cloudflare delivery URL and update the saved header image
      const imageUrl = await getCloudflareDeliveryUrl(uploadResult.imageId)
      if (imageUrl) {
        setSavedHeaderImage(imageUrl)
      }

      // Clear the uploaded image since it's now saved
      setUploadedImage(null)
      setShowImageUpload(false)

      toast({
        title: "Success",
        description: "Header image saved successfully!",
      })
    } catch (error) {
      console.error("Error saving header image:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save header image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingImage(false)
    }
  }

  // Save desktop layout settings
  const saveDesktopLayout = async () => {
    try {
      setIsSaving(true)

      // Get current design data
      const currentDesign = await getBusinessAdDesign(businessId)

      // Prepare the updated design data with desktop layout settings
      const updatedDesign = {
        ...currentDesign,
        desktopLayout: {
          layoutType,
          videoAspectRatio,
          backgroundColor,
        },
        headerTextColor, // Make sure this is included
      }

      // Save the updated design
      const result = await saveBusinessAdDesign(businessId, updatedDesign)

      if (result.success) {
        toast({
          title: "Success",
          description: "Desktop layout settings saved successfully!",
        })
      } else {
        throw new Error(result.error || "Failed to save")
      }
    } catch (error) {
      console.error("Error saving desktop layout:", error)
      toast({
        title: "Error",
        description: "Failed to save desktop layout settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Helper functions
  const getFormattedPhone = () => {
    return `(${formData.phoneArea}) ${formData.phonePrefix}-${formData.phoneLine}`
  }

  const getFormattedAddress = () => {
    return `${formData.streetAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}`
  }

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

    return iconMap[iconName] || Menu
  }

  const handleReturnToMobile = () => {
    router.push("/ad-design/customize")
  }

  const getPhoneNumber = () => {
    return `(${formData.phoneArea}) ${formData.phonePrefix}-${formData.phoneLine}`
  }

  // Get video aspect ratio styles
  const getVideoAspectRatio = () => {
    switch (videoAspectRatio) {
      case "portrait":
        return "pb-[177.78%]" // 9:16 aspect ratio
      case "square":
        return "pb-[100%]" // 1:1 aspect ratio
      case "landscape":
      default:
        return "pb-[56.25%]" // 16:9 aspect ratio
    }
  }

  // Render video content based on layout and aspect ratio
  const renderVideoContent = () => {
    const aspectRatioClass = getVideoAspectRatio()

    return (
      <div className={`relative w-full ${aspectRatioClass}`}>
        {(() => {
          if (cloudflareVideo && cloudflareVideo.cloudflareVideoId) {
            const embedUrl = `https://customer-5093uhykxo17njhi.cloudflarestream.com/${cloudflareVideo.cloudflareVideoId}/iframe`
            return (
              <iframe
                src={embedUrl}
                className="absolute top-0 left-0 w-full h-full rounded-md"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${formData.businessName} video`}
                style={{ border: "none" }}
              />
            )
          } else {
            return (
              <img
                src="https://imagedelivery.net/Fx83XHJ2QHIeAJio-AnNbA/78c875cc-ec1b-4ebb-a52e-a1387c030200/public"
                alt="Business image"
                className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
              />
            )
          }
        })()}
      </div>
    )
  }

  // Get the current header image (either uploaded or saved)
  const getCurrentHeaderImage = () => {
    return uploadedImage || savedHeaderImage
  }

  // Render desktop business profile with different layouts
  const renderDesktopProfile = () => {
    const currentHeaderImage = getCurrentHeaderImage()

    const headerContent = (
      <div
        className={`text-white rounded-t-lg p-8 ${headerTextColor === "black" ? "text-black" : "text-white"} animate-in fade-in duration-500 relative overflow-hidden`}
        style={{
          backgroundColor: currentHeaderImage
            ? "transparent"
            : selectedTexture === "gradient"
              ? ""
              : colorValues.primary,
          backgroundImage: currentHeaderImage
            ? `url(${currentHeaderImage})`
            : selectedTexture === "gradient"
              ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
              : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundImage || "none",
          backgroundSize: currentHeaderImage
            ? "cover"
            : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundSize || "auto",
          backgroundRepeat: currentHeaderImage
            ? "no-repeat"
            : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundRepeat || "repeat",
          backgroundPosition: currentHeaderImage ? `${-viewWindowPosition.x}px ${-viewWindowPosition.y}px` : "center",
          height: "200px",
        }}
      >
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-bold">{formData.businessName}</h1>
          {!hiddenFields.freeText && formData.freeText && <p className="opacity-90 mt-2">{formData.freeText}</p>}
        </div>
      </div>
    )

    const contactInfoCard = (
      <Card className="overflow-hidden border-none shadow-md animate-in slide-in-from-left duration-700 delay-200">
        <CardContent className="p-0">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
            <h2 className="font-semibold text-lg">Contact Information</h2>
          </div>
          <div className="p-4 space-y-4">
            {!hiddenFields.phone && getPhoneNumber() && (
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-full"
                  style={{
                    backgroundColor: `${colorValues.primary}20`,
                  }}
                >
                  <Phone
                    className="h-5 w-5"
                    style={{
                      color: colorValues.primary,
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                  <p className="font-medium">{getFormattedPhone()}</p>
                </div>
              </div>
            )}

            {!hiddenFields.email && (
              <div className="flex items-center gap-3">
                <div
                  className="p-2 rounded-full"
                  style={{
                    backgroundColor: `${colorValues.primary}20`,
                  }}
                >
                  <Mail
                    className="h-5 w-5"
                    style={{
                      color: colorValues.primary,
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{formData.email}</p>
                </div>
              </div>
            )}

            {!hiddenFields.address && (
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-full mt-1"
                  style={{
                    backgroundColor: `${colorValues.primary}20`,
                  }}
                >
                  <MapPin
                    className="h-5 w-5"
                    style={{
                      color: colorValues.primary,
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{getFormattedAddress()}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )

    const hoursCard = !hiddenFields.hours ? (
      <Card className="overflow-hidden border-none shadow-md animate-in slide-in-from-left duration-700 delay-400">
        <CardContent className="p-0">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
            <h2 className="font-semibold text-lg">Hours of Operation</h2>
          </div>
          <div className="p-4">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="p-2 rounded-full"
                style={{
                  backgroundColor: `${colorValues.primary}20`,
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
                  style={{
                    color: colorValues.primary,
                  }}
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 dark:text-slate-400">Open Hours</p>
              </div>
            </div>

            <div className="space-y-2 pl-12">
              {formData.hours.split("\n").map((line, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-slate-700 pb-2 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-medium">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    ) : null

    const quickLinksCard = (
      <Card className="overflow-hidden border-none shadow-md animate-in slide-in-from-left duration-700 delay-600">
        <CardContent className="p-0">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
            <h2 className="font-semibold text-lg">Quick Links</h2>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {!hiddenFields.photoAlbum && (
              <button className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <ImageIcon
                  className="h-5 w-5"
                  style={{
                    color: colorValues.primary,
                  }}
                />
                <span className="text-sm font-medium">Photo Album</span>
              </button>
            )}

            {!hiddenFields.savingsButton && (
              <button className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Ticket
                  className="h-5 w-5"
                  style={{
                    color: colorValues.primary,
                  }}
                />
                <span className="text-sm font-medium">Coupons</span>
              </button>
            )}

            {!hiddenFields.jobsButton && (
              <button className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Briefcase
                  className="h-5 w-5"
                  style={{
                    color: colorValues.primary,
                  }}
                />
                <span className="text-sm font-medium">Jobs</span>
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    )

    const videoCard = !hiddenFields.video ? (
      <Card className="overflow-hidden border-none shadow-md h-full animate-in slide-in-from-right duration-700 delay-300">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
            <h2 className="font-semibold text-lg">Featured Video</h2>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            {renderVideoContent()}

            {/* Conditionally render either the website button or the custom button or colored rectangle */}
            {hiddenFields.customButton && !hiddenFields.website && formData.website ? (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => window.open(`https://${formData.website}`, "_blank")}
                  className="flex items-center justify-center gap-2 w-full text-white p-3 rounded-md transition-colors hover:opacity-90"
                  style={{
                    backgroundColor:
                      selectedTexture === "gradient" ? "" : colorValues.textColor ? "#000000" : colorValues.primary,
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
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15,3 21,3 21,9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  <span>Visit Our Full Website</span>
                </button>
              </div>
            ) : !hiddenFields.customButton ? (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  className="flex items-center justify-center gap-2 w-full text-white p-3 rounded-md transition-colors hover:opacity-90"
                  style={{
                    backgroundColor:
                      selectedTexture === "gradient" ? "" : colorValues.textColor ? "#000000" : colorValues.primary,
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
                  {(() => {
                    const IconComponent = getIconComponent(customButtonIcon)
                    return <IconComponent className="h-5 w-5 text-white" />
                  })()}
                  <span>{customButtonName}</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div
                  className="w-full h-12 rounded-md"
                  style={{
                    backgroundColor:
                      selectedTexture === "gradient" ? "" : colorValues.textColor ? "#000000" : colorValues.primary,
                    backgroundImage:
                      selectedTexture === "gradient"
                        ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                        : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundImage || "none",
                    backgroundSize:
                      textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundSize || "auto",
                    backgroundRepeat:
                      textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundRepeat || "repeat",
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    ) : null

    // Render different layouts based on layoutType
    return (
      <div className="max-w-6xl mx-auto">
        {headerContent}

        {layoutType === "standard" && (
          <div
            className="grid md:grid-cols-2 gap-6 p-6 rounded-b-lg shadow-lg"
            style={{ backgroundColor: getBackgroundColorValue() }}
          >
            {/* Left Column - Business Info */}
            <div className="space-y-6">
              {contactInfoCard}
              {hoursCard}
              {quickLinksCard}
            </div>

            {/* Right Column - Video */}
            <div className="space-y-6">{videoCard}</div>
          </div>
        )}

        {layoutType === "video-focus" && (
          <div className="p-6 rounded-b-lg shadow-lg" style={{ backgroundColor: getBackgroundColorValue() }}>
            {/* Video takes priority - full width or larger section */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Video takes 2 columns */}
              <div className="md:col-span-2">{videoCard}</div>

              {/* Info takes 1 column */}
              <div className="space-y-4">
                {contactInfoCard}
                {quickLinksCard}
              </div>
            </div>

            {/* Hours below if not hidden */}
            {hoursCard && <div className="mt-6">{hoursCard}</div>}
          </div>
        )}

        {layoutType === "info-focus" && (
          <div className="p-6 rounded-b-lg shadow-lg" style={{ backgroundColor: getBackgroundColorValue() }}>
            {/* Info takes priority */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Info takes 2 columns */}
              <div className="md:col-span-2 space-y-6">
                {contactInfoCard}
                {hoursCard}
                {quickLinksCard}
              </div>

              {/* Video takes 1 column */}
              <div className="space-y-6">{videoCard}</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render image editor
  const renderImageEditor = () => {
    if (!uploadedImage) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-auto">
          <h3 className="text-xl font-semibold mb-4">Position Your Header Image</h3>
          <p className="text-gray-600 mb-4">Drag the view window to select the part of the image for your header</p>

          <div
            className="relative inline-block border-2 border-gray-300 rounded-lg overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={uploadedImage || "/placeholder.svg"}
              alt="Header image"
              className="max-w-full max-h-96 object-contain"
              style={{ filter: "brightness(0.25)" }}
            />

            {/* View window with header shape */}
            <div
              ref={viewWindowRef}
              className="absolute border-4 border-blue-500 cursor-move bg-transparent rounded-t-lg overflow-hidden"
              style={{
                left: viewWindowPosition.x,
                top: viewWindowPosition.y,
                width: Math.min(800, imageRef.current?.offsetWidth || 800),
                height: "200px",
                backgroundImage: `url(${uploadedImage})`,
                backgroundSize: `${imageRef.current?.offsetWidth}px ${imageRef.current?.offsetHeight}px`,
                backgroundPosition: `-${viewWindowPosition.x}px -${viewWindowPosition.y}px`,
                backgroundRepeat: "no-repeat",
              }}
              onMouseDown={handleMouseDown}
            >
              <div className="absolute inset-0 border-2 border-dashed border-white opacity-50 rounded-t-lg"></div>
              {/* Header content overlay to show what it will look like */}
              <div className="absolute inset-0 bg-black bg-opacity-30 rounded-t-lg flex items-center justify-center">
                <div className="text-white text-center">
                  <h1 className="text-2xl font-bold">{formData.businessName}</h1>
                  {!hiddenFields.freeText && formData.freeText && (
                    <p className="opacity-90 mt-1 text-sm">{formData.freeText}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button onClick={() => setUploadedImage(null)} variant="outline">
              Cancel
            </Button>
            <Button onClick={() => setShowImageUpload(false)}>Apply Image</Button>
            <Button onClick={saveHeaderImage} disabled={isSavingImage} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              {isSavingImage ? "Saving..." : "Save Header Image"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your desktop profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customize Your Desktop Profile</h1>
          <Button type="button" variant="outline" onClick={handleReturnToMobile}>
            Return to Mobile Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Desktop Profile Preview (2/3 width) */}
          <div className="lg:col-span-2 flex justify-center">{renderDesktopProfile()}</div>

          {/* Right Side - Customization Area (1/3 width) */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Desktop Layout Options</h2>
              <p className="text-gray-600 mb-6 text-sm">
                Customize how your business profile appears on desktop devices.
              </p>
            </div>

            {/* Layout Type Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Profile Layout</Label>
              <RadioGroup value={layoutType} onValueChange={(value: LayoutType) => setLayoutType(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard" className="flex items-center gap-2 cursor-pointer">
                    <Monitor className="h-4 w-4" />
                    Standard Layout
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video-focus" id="video-focus" />
                  <Label htmlFor="video-focus" className="flex items-center gap-2 cursor-pointer">
                    <Square className="h-4 w-4" />
                    Video-Focused Layout
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="info-focus" id="info-focus" />
                  <Label htmlFor="info-focus" className="flex items-center gap-2 cursor-pointer">
                    <FileText className="h-4 w-4" />
                    Information-Focused Layout
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Video Aspect Ratio Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Video Aspect Ratio</Label>
              <RadioGroup
                value={videoAspectRatio}
                onValueChange={(value: VideoAspectRatio) => setVideoAspectRatio(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="landscape" id="landscape" />
                  <Label htmlFor="landscape" className="flex items-center gap-2 cursor-pointer">
                    <Monitor className="h-4 w-4" />
                    Landscape (16:9)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="portrait" id="portrait" />
                  <Label htmlFor="portrait" className="flex items-center gap-2 cursor-pointer">
                    <Smartphone className="h-4 w-4" />
                    Portrait (9:16)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="square" id="square" />
                  <Label htmlFor="square" className="flex items-center gap-2 cursor-pointer">
                    <Square className="h-4 w-4" />
                    Square (1:1)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Background Color Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Background Color</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-12 h-12 rounded-md border border-gray-300 cursor-pointer"
                    title="Select background color"
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium">Custom Color</Label>
                    <input
                      type="text"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                      placeholder="#ffffff"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
                <div className="p-3 rounded-md border" style={{ backgroundColor: backgroundColor }}>
                  <p className="text-sm text-gray-600">Preview of selected background color</p>
                </div>
              </div>
            </div>

            {/* Header Text Color Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Header Text Color</Label>
              <Select value={headerTextColor} onValueChange={(value: "white" | "black") => setHeaderTextColor(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select text color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
                </SelectContent>
              </Select>
              <div
                className="p-3 rounded-md border flex items-center justify-center"
                style={{ backgroundColor: headerTextColor === "white" ? "#333" : "#f0f0f0" }}
              >
                <p className="text-sm font-medium" style={{ color: headerTextColor }}>
                  Preview of header text color
                </p>
              </div>
            </div>

            {/* Save Button */}
            <Button onClick={saveDesktopLayout} disabled={isSaving} className="w-full">
              {isSaving ? "Saving..." : "Save Desktop Layout"}
            </Button>

            {/* Header Image Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Header Image</h3>

              {/* Show current header image status */}
              {savedHeaderImage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">✓ Header image is saved and will persist between logins</p>
                </div>
              )}

              {/* Add Image to Header Button */}
              <Button
                variant="outline"
                className="w-full bg-transparent mb-3"
                onClick={() => setShowImageUpload(!showImageUpload)}
              >
                <Upload className="h-4 w-4 mr-2" />
                {savedHeaderImage ? "Change Header Image" : "Add Image to Header"}
              </Button>

              {/* Save Header Image Button - only show when there's an uploaded image */}
              {uploadedImage && (
                <Button
                  onClick={saveHeaderImage}
                  disabled={isSavingImage}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingImage ? "Saving..." : "Save Header Image"}
                </Button>
              )}

              {/* Image Upload Input */}
              {showImageUpload && (
                <div className="space-y-3 mt-3">
                  <Label className="text-sm font-medium">Upload Header Image</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500">
                    Upload an image and position it using the editor. Click "Save Header Image" to make it permanent.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Editor Modal */}
      {uploadedImage && showImageUpload && renderImageEditor()}
    </div>
  )
}
