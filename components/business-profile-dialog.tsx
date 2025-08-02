"use client"

import { Button } from "@/components/ui/button"
import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { getBusinessAdDesign } from "@/app/actions/business-actions"
import {
  Loader2,
  ImageIcon,
  Ticket,
  Briefcase,
  X,
  Phone,
  MapPin,
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
  Mail,
} from "lucide-react"
import { getCloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"
import type { CloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"
import { BusinessPhotoAlbumDialog } from "./business-photo-album-dialog"
import { BusinessCouponsDialog } from "./business-coupons-dialog"
import { BusinessJobsDialog } from "./business-jobs-dialog"
import { DocumentsDialog } from "./documents-dialog"
import {
  trackProfileView,
  trackPhotoAlbumClick,
  trackCouponClick,
  trackJobClick,
  trackPhoneClick,
  trackWebsiteClick,
  trackVideoView,
  getCurrentZipCode,
} from "@/lib/analytics-utils"

// Add CSS to hide the default close button
const hideDefaultCloseButtonStyle = `
.business-profile-dialog-content [data-radix-dialog-close] {
  display: none !important;
}
.business-profile-dialog-content > button[data-radix-dialog-close] {
  display: none !important;
}
.business-profile-dialog-content .absolute.right-4.top-4 {
  display: none !important;
}
`

interface BusinessProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
  businessName: string
  searchZipCode?: string | null
}

export function BusinessProfileDialog({
  isOpen,
  onClose,
  businessId,
  businessName,
  searchZipCode,
}: BusinessProfileDialogProps) {
  const [loading, setLoading] = useState(true)
  const [adDesign, setAdDesign] = useState<any>(null)
  const [businessData, setBusinessData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPhotoAlbumOpen, setIsPhotoAlbumOpen] = useState(false)
  const [isCouponsOpen, setIsCouponsOpen] = useState(false)
  const [isJobsOpen, setIsJobsOpen] = useState(false)
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false)
  const [businessVideo, setBusinessVideo] = useState<CloudflareBusinessMedia | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [currentZipCode, setCurrentZipCode] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (isOpen && businessId) {
      console.log(`🎬 BusinessProfileDialog opened for business ID: ${businessId}`)
      console.log(`📍 Search zip code prop: ${searchZipCode}`)

      // Get zip code from multiple sources, prioritizing the search ZIP code
      let zipCode = searchZipCode || getCurrentZipCode()

      // Also try to get from URL parameters if available
      if (!zipCode && typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search)
        zipCode = urlParams.get("zip") || urlParams.get("zipcode")
      }

      // Also try localStorage as fallback
      if (!zipCode && typeof window !== "undefined") {
        zipCode = localStorage.getItem("savedZipCode") || localStorage.getItem("currentSearchZip")
      }

      console.log(`📍 Final zip code for tracking: ${zipCode}`)
      setCurrentZipCode(zipCode)

      // Track profile view with the determined zip code
      if (zipCode) {
        console.log(`📊 Tracking profile view for business ${businessId} from ZIP ${zipCode}`)
        trackProfileView(businessId, zipCode, {
          businessName,
          timestamp: Date.now(),
          source: searchZipCode ? "search_prop" : "detected",
        })
      } else {
        console.log(`📊 Tracking profile view for business ${businessId} without ZIP code`)
        trackProfileView(businessId, undefined, {
          businessName,
          timestamp: Date.now(),
          source: "no_zip",
        })
      }

      loadBusinessData()
      loadBusinessAdDesign()
      loadBusinessVideo()
    }
  }, [isOpen, businessId, searchZipCode, businessName])

  useEffect(() => {
    // Close child dialogs when main dialog is closed
    if (!isOpen) {
      setIsPhotoAlbumOpen(false)
      setIsCouponsOpen(false)
      setIsJobsOpen(false)
      setIsDocumentsOpen(false)
    }
  }, [isOpen])

  const loadBusinessData = async () => {
    try {
      console.log(`Loading business data for business ID: ${businessId}`)

      // Check if KV environment variables are available
      if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
        console.warn("KV environment variables are missing. Skipping Redis business data fetch.")
        return
      }

      const business = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

      if (business) {
        console.log("Loaded business data:", business)
        setBusinessData(business)
      } else {
        console.log("No business data found")
      }
    } catch (err) {
      console.error("Error loading business data:", err)
      // Don't set error state, just log and continue without Redis data
      // The component will fall back to ad design data
    }
  }

  const loadBusinessAdDesign = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log(`Loading ad design for business ID: ${businessId}`)
      const design = await getBusinessAdDesign(businessId)

      if (design) {
        console.log("Loaded ad design with full data:", {
          designId: design.designId,
          colorScheme: design.colorScheme,
          colorValues: design.colorValues,
          texture: design.texture,
          businessInfo: design.businessInfo,
          hiddenFields: design.hiddenFields,
          customButton: design.customButton,
          desktopLayout: design.desktopLayout,
        })
        setAdDesign(design)
      } else {
        console.log("No ad design found for business:", businessId)
        setError("No ad design found for this business")
      }
    } catch (err) {
      console.error("Error loading business ad design:", err)
      setError("Failed to load business profile")
    } finally {
      setLoading(false)
    }
  }

  const loadBusinessVideo = async () => {
    try {
      setVideoLoading(true)
      setVideoError(null)

      console.log(`Loading video for business ID: ${businessId}`)
      const videoData = await getCloudflareBusinessMedia(businessId)

      console.log("Video data response:", videoData)

      // Update debug info
      setDebugInfo({
        businessId,
        videoData,
        timestamp: new Date().toISOString(),
        hasVideoId: videoData?.cloudflareVideoId ? true : false,
        isReadyToStream: videoData?.cloudflareVideoReadyToStream || false,
        aspectRatio: videoData?.videoAspectRatio || "unknown",
      })

      if (videoData && videoData.cloudflareVideoId) {
        console.log("Loaded business video:", videoData)
        setBusinessVideo(videoData)
      } else {
        console.log("No video found for this business")
        setBusinessVideo(null)
        setVideoError("No video found for this business")
      }
    } catch (err) {
      console.error("Error loading business video:", err)
      setBusinessVideo(null)
      setVideoError(err instanceof Error ? err.message : "Unknown error loading video")

      // Update debug info with error
      setDebugInfo((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        errorStack: err instanceof Error ? err.stack : undefined,
      }))
    } finally {
      setVideoLoading(false)
    }
  }

  // Replace the getColorValues function with this improved version:
  const getColorValues = () => {
    console.log("Getting color values from adDesign:", adDesign)

    // First, try to get the saved color values directly
    if (adDesign?.colorValues && adDesign.colorValues.primary) {
      console.log("Using saved colorValues:", adDesign.colorValues)
      return {
        primary: adDesign.colorValues.primary,
        secondary: adDesign.colorValues.secondary || adDesign.colorValues.primary,
        textColor: adDesign.colorValues.textColor,
      }
    }

    // If no direct color values, try to derive from colorScheme
    if (adDesign?.colorScheme) {
      console.log("Deriving colors from colorScheme:", adDesign.colorScheme)

      // Color mapping - same as in customize page
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

      const colors = colorMap[adDesign.colorScheme] || colorMap.blue
      console.log("Mapped colors:", colors)
      return colors
    }

    // Default fallback
    console.log("Using default blue colors")
    return { primary: "#007BFF", secondary: "#0056b3" }
  }

  const colorValues = getColorValues()

  // Get texture options
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

  // Helper function to get phone number from Redis business data first, then ad design
  const getPhoneNumber = () => {
    // First try to get phone from Redis business data
    if (businessData && typeof businessData === "object" && businessData.phone) {
      return businessData.phone
    }

    // Fall back to ad design phone
    if (adDesign?.businessInfo?.phone) {
      return adDesign.businessInfo.phone
    }

    return null
  }

  // Helper function to get email from ad design data first, then Redis business data
  const getEmail = () => {
    // First try to get email from ad design business info (customize page)
    if (adDesign?.businessInfo?.email) {
      return adDesign.businessInfo.email
    }

    // Fall back to Redis business data (registration email)
    if (businessData && typeof businessData === "object" && businessData.email) {
      return businessData.email
    }

    return null
  }

  // Helper function to format phone number
  const formatPhone = (phone: string) => {
    return phone || "Not provided"
  }

  // Helper function to format email
  const formatEmail = (email: string) => {
    return email || "Not provided"
  }

  // Helper function to format address
  const formatAddress = (info: any) => {
    if (!info) return "Not provided"

    const { streetAddress, city, state, zipCode } = info
    if (streetAddress && city && state && zipCode) {
      return `${streetAddress}, ${city}, ${state} ${zipCode}`
    } else if (info.address) {
      return info.address
    }
    return "Not provided"
  }

  // Helper function to format hours
  const formatHours = (hours: string) => {
    if (!hours) return ["Not provided"]
    return hours.split("\n")
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

  // Function to handle phone call
  const handlePhoneCall = (phone: string) => {
    if (!phone) return
    console.log(`📞 Tracking phone click for business ${businessId} from ZIP ${currentZipCode}`)
    trackPhoneClick(businessId, currentZipCode, {
      businessName,
      timestamp: Date.now(),
    })
    const phoneNumber = phone.replace(/\D/g, "")
    window.open(`tel:${phoneNumber}`)
  }

  // Function to handle email
  const handleEmail = (email: string) => {
    if (!email) return
    window.open(`mailto:${email}`)
  }

  // Function to handle map directions
  const handleGetDirections = (address: string) => {
    if (!address) return
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, "_blank")
  }

  // Function to handle website click
  const handleWebsiteClick = (website: string) => {
    if (!website) return
    console.log(`🌐 Tracking website click for business ${businessId} from ZIP ${currentZipCode}`)
    trackWebsiteClick(businessId, currentZipCode, {
      businessName,
      website,
      timestamp: Date.now(),
    })
    window.open(`https://${website}`, "_blank")
  }

  // Function to handle photo album click
  const handlePhotoAlbumClick = () => {
    console.log(`📸 Tracking photo album click for business ${businessId} from ZIP ${currentZipCode}`)
    trackPhotoAlbumClick(businessId, currentZipCode, {
      businessName,
      timestamp: Date.now(),
      source: "profile_dialog",
    })
    setIsPhotoAlbumOpen(true)
  }

  // Function to handle coupons click
  const handleCouponsClick = () => {
    console.log(`🎫 Tracking coupon click for business ${businessId} from ZIP ${currentZipCode}`)
    trackCouponClick(businessId, currentZipCode, {
      businessName,
      timestamp: Date.now(),
      source: "profile_dialog",
    })
    setIsCouponsOpen(true)
  }

  // Function to handle jobs click
  const handleJobsClick = () => {
    console.log(`💼 Tracking job click for business ${businessId} from ZIP ${currentZipCode}`)
    trackJobClick(businessId, currentZipCode, {
      businessName,
      timestamp: Date.now(),
      source: "profile_dialog",
    })
    setIsJobsOpen(true)
  }

  // Function to handle video view tracking
  const handleVideoView = () => {
    console.log(`🎥 Tracking video view for business ${businessId} from ZIP ${currentZipCode}`)
    trackVideoView(businessId, currentZipCode, {
      businessName,
      timestamp: Date.now(),
      source: "profile_dialog",
    })
  }

  // Get video aspect ratio styles based on desktop layout settings
  const getVideoAspectRatio = () => {
    const desktopLayout = adDesign?.desktopLayout
    if (!desktopLayout) return "pb-[56.25%]" // Default landscape

    switch (desktopLayout.videoAspectRatio) {
      case "portrait":
        return "pb-[177.78%]" // 9:16 aspect ratio
      case "square":
        return "pb-[100%]" // 1:1 aspect ratio
      case "landscape":
      default:
        return "pb-[56.25%]" // 16:9 aspect ratio
    }
  }

  // Render video content based on desktop layout settings
  const renderVideoContent = () => {
    const aspectRatioClass = getVideoAspectRatio()

    return (
      <div className={`relative w-full ${aspectRatioClass}`}>
        {(() => {
          if (businessVideo && businessVideo.cloudflareVideoId) {
            const embedUrl = `https://customer-5093uhykxo17njhi.cloudflarestream.com/${businessVideo.cloudflareVideoId}/iframe`
            return (
              <div className="absolute inset-0 z-20 rounded-md overflow-hidden">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${businessName} video`}
                  style={{ border: "none" }}
                  onLoad={() => {
                    // Track video view when iframe loads
                    handleVideoView()
                  }}
                />
              </div>
            )
          } else {
            return (
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
    )
  }

  // Render desktop profile with custom layout based on saved settings
  const renderDesktopProfile = () => {
    const desktopLayout = adDesign?.desktopLayout || { layoutType: "standard", videoAspectRatio: "landscape" }

    const headerContent = (
      <div
        className={`text-white rounded-t-lg p-8 ${colorValues.textColor ? "text-black" : "text-white"} animate-in fade-in duration-500`}
        style={{
          backgroundColor: adDesign.texture === "gradient" ? "" : colorValues.primary,
          backgroundImage:
            adDesign.texture === "gradient"
              ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
              : textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundImage || "none",
          backgroundSize: textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundSize || "auto",
          backgroundRepeat:
            textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundRepeat || "repeat",
        }}
      >
        <h1 className="text-3xl md:text-4xl font-bold">{adDesign.businessInfo?.businessName || businessName}</h1>
        {!adDesign.hiddenFields?.freeText && adDesign.businessInfo?.freeText && (
          <p className="opacity-90 mt-2">{adDesign.businessInfo.freeText}</p>
        )}
      </div>
    )

    const contactInfoCard = (
      <Card className="overflow-hidden border-none shadow-md animate-in slide-in-from-left duration-700 delay-200">
        <CardContent className="p-0">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
            <h2 className="font-semibold text-lg">Contact Information</h2>
          </div>
          <div className="p-4 space-y-4">
            {!adDesign.hiddenFields?.phone && getPhoneNumber() && (
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
                  <button
                    onClick={() => handlePhoneCall(getPhoneNumber())}
                    className="font-medium text-blue-600 hover:underline cursor-pointer"
                  >
                    {formatPhone(getPhoneNumber())}
                  </button>
                </div>
              </div>
            )}

            {!adDesign.hiddenFields?.email && getEmail() && (
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                  <button
                    onClick={() => handleEmail(getEmail())}
                    className="font-medium text-blue-600 hover:underline cursor-pointer"
                  >
                    {formatEmail(getEmail())}
                  </button>
                </div>
              </div>
            )}

            {!adDesign.hiddenFields?.address && (
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                  <button
                    onClick={() => handleGetDirections(formatAddress(adDesign.businessInfo))}
                    className="font-medium text-blue-600 hover:underline cursor-pointer text-left"
                  >
                    {formatAddress(adDesign.businessInfo)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )

    const hoursCard = !adDesign.hiddenFields?.hours ? (
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
              {formatHours(adDesign.businessInfo?.hours).map((line, i) => (
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
            {!adDesign.hiddenFields?.photoAlbum && (
              <button
                onClick={handlePhotoAlbumClick}
                className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ImageIcon
                  className="h-5 w-5"
                  style={{
                    color: colorValues.primary,
                  }}
                />
                <span className="text-sm font-medium">Photo Album</span>
              </button>
            )}

            {!adDesign.hiddenFields?.savingsButton && (
              <button
                onClick={handleCouponsClick}
                className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Ticket
                  className="h-5 w-5"
                  style={{
                    color: colorValues.primary,
                  }}
                />
                <span className="text-sm font-medium">Coupons</span>
              </button>
            )}

            {!adDesign.hiddenFields?.jobsButton && (
              <button
                onClick={handleJobsClick}
                className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
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

    const videoCard = !adDesign.hiddenFields?.video ? (
      <Card className="overflow-hidden border-none shadow-md h-full animate-in slide-in-from-right duration-700 delay-300">
        <CardContent className="p-0 h-full flex flex-col">
          <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
            <h2 className="font-semibold text-lg">Featured Video</h2>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            {renderVideoContent()}

            {/* Conditionally render either the website button or the custom button or colored rectangle */}
            {adDesign.hiddenFields?.customButton &&
            !adDesign.hiddenFields?.website &&
            adDesign.businessInfo?.website ? (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => handleWebsiteClick(adDesign.businessInfo.website)}
                  className="flex items-center justify-center gap-2 w-full text-white p-3 rounded-md transition-colors hover:opacity-90"
                  style={{
                    backgroundColor:
                      adDesign.texture === "gradient" ? "" : colorValues.textColor ? "#000000" : colorValues.primary,
                    backgroundImage:
                      adDesign.texture === "gradient"
                        ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                        : textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundImage || "none",
                    backgroundSize:
                      textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundSize || "auto",
                    backgroundRepeat:
                      textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundRepeat || "repeat",
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
            ) : !adDesign.hiddenFields?.customButton ? (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setIsDocumentsOpen(true)}
                  className="flex items-center justify-center gap-2 w-full text-white p-3 rounded-md transition-colors hover:opacity-90"
                  style={{
                    backgroundColor:
                      adDesign.texture === "gradient" ? "" : colorValues.textColor ? "#000000" : colorValues.primary,
                    backgroundImage:
                      adDesign.texture === "gradient"
                        ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                        : textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundImage || "none",
                    backgroundSize:
                      textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundSize || "auto",
                    backgroundRepeat:
                      textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundRepeat || "repeat",
                  }}
                >
                  {(() => {
                    const IconComponent = getIconComponent(adDesign.customButton?.icon || "Menu")
                    return <IconComponent className="h-5 w-5 text-white" />
                  })()}
                  <span>{adDesign.customButton?.name || "Menu"}</span>
                </button>
              </div>
            ) : (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div
                  className="w-full h-12 rounded-md"
                  style={{
                    backgroundColor:
                      adDesign.texture === "gradient" ? "" : colorValues.textColor ? "#000000" : colorValues.primary,
                    backgroundImage:
                      adDesign.texture === "gradient"
                        ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                        : textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundImage || "none",
                    backgroundSize:
                      textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundSize || "auto",
                    backgroundRepeat:
                      textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundRepeat || "repeat",
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    ) : null

    // Render different layouts based on saved desktop layout settings
    return (
      <div className="max-w-6xl mx-auto">
        {headerContent}

        {desktopLayout.layoutType === "standard" && (
          <div className="grid md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-6 rounded-b-lg shadow-lg">
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

        {desktopLayout.layoutType === "video-focus" && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-b-lg shadow-lg">
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

        {desktopLayout.layoutType === "info-focus" && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-b-lg shadow-lg">
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

  return (
    <>
      {/* Add style to hide default close button */}
      <style jsx global>
        {hideDefaultCloseButtonStyle}
      </style>

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="business-profile-dialog-content w-full p-0 m-0 max-w-4xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{businessName}</DialogTitle>
            <DialogDescription>
              Business profile dialog showing detailed information, contact details, and services for {businessName}
            </DialogDescription>
          </DialogHeader>

          {/* Custom close button - mobile: absolute top, desktop: centered above content */}
          <div className="md:flex md:justify-center md:w-full md:py-1 md:border-b">
            <DialogClose className="absolute top-2 right-2 z-50 rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none md:relative md:top-auto md:right-auto md:z-auto">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading business profile...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : adDesign ? (
            <div className="overflow-hidden">
              {/* Mobile Layout */}
              <div className="block md:hidden">
                <Card className="w-full animate-in fade-in duration-1000">
                  <div
                    className={`p-5 ${colorValues.textColor ? "text-black" : "text-white"}`}
                    style={{
                      backgroundColor: adDesign.texture === "gradient" ? "" : colorValues.primary,
                      backgroundImage:
                        adDesign.texture === "gradient"
                          ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                          : textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundImage || "none",
                      backgroundSize:
                        textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundSize || "auto",
                      backgroundRepeat:
                        textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundRepeat || "repeat",
                    }}
                  >
                    <h3 className="text-2xl font-bold">{adDesign.businessInfo?.businessName || businessName}</h3>
                    {!adDesign.hiddenFields?.freeText && adDesign.businessInfo?.freeText && (
                      <p className="text-base mt-1 opacity-90">{adDesign.businessInfo.freeText}</p>
                    )}
                  </div>

                  <div className="pt-6 px-6 space-y-4">
                    {!adDesign.hiddenFields?.phone && getPhoneNumber() && (
                      <div className="flex items-start gap-3">
                        <div
                          className="h-5 w-5 mt-0.5 flex-shrink-0"
                          style={{
                            color: colorValues.textColor ? "#000000" : colorValues.primary,
                          }}
                        >
                          <Phone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Phone</p>
                          <button
                            onClick={() => handlePhoneCall(getPhoneNumber())}
                            className="text-blue-600 hover:underline active:text-blue-800 cursor-pointer p-1 -m-1 z-50 relative"
                          >
                            {formatPhone(getPhoneNumber())}
                          </button>
                        </div>
                      </div>
                    )}

                    {!adDesign.hiddenFields?.email && getEmail() && (
                      <div className="flex items-start gap-3">
                        <div
                          className="h-5 w-5 mt-0.5 flex-shrink-0"
                          style={{
                            color: colorValues.textColor ? "#000000" : colorValues.primary,
                          }}
                        >
                          <Mail className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Email</p>
                          <button
                            onClick={() => handleEmail(getEmail())}
                            className="text-blue-600 hover:underline active:text-blue-800 cursor-pointer p-1 -m-1 z-50 relative"
                          >
                            {formatEmail(getEmail())}
                          </button>
                        </div>
                      </div>
                    )}

                    {!adDesign.hiddenFields?.address && (
                      <div className="flex items-start gap-3">
                        <div
                          className="h-5 w-5 mt-0.5 flex-shrink-0"
                          style={{
                            color: colorValues.textColor ? "#000000" : colorValues.primary,
                          }}
                        >
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Address</p>
                          <button
                            onClick={() => handleGetDirections(formatAddress(adDesign.businessInfo))}
                            className="text-blue-600 hover:underline active:text-blue-800 cursor-pointer p-1 -m-1 z-50 relative text-left"
                          >
                            {formatAddress(adDesign.businessInfo)}
                          </button>
                        </div>
                      </div>
                    )}

                    {!adDesign.hiddenFields?.hours && (
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
                            {formatHours(adDesign.businessInfo?.hours).map((line, i) => (
                              <p key={i} className="text-sm">
                                {line}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mobile Video Section */}
                  {!adDesign.hiddenFields?.video && (
                    <div className="border-t pt-4 mt-4 px-4 animate-in fade-in duration-2000 delay-500">
                      {renderVideoContent()}
                    </div>
                  )}

                  {/* Mobile Footer with buttons */}
                  <div className="flex flex-col items-stretch gap-3 border-t pt-4 px-4 pb-4 mt-4">
                    <div className="grid grid-cols-3 gap-2">
                      {!adDesign.hiddenFields?.photoAlbum && (
                        <Button
                          variant="outline"
                          className="flex flex-col items-center justify-center gap-1 h-auto py-3 bg-transparent"
                          onClick={handlePhotoAlbumClick}
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

                      {!adDesign.hiddenFields?.savingsButton && (
                        <Button
                          variant="outline"
                          className="flex flex-col items-center justify-center gap-1 h-auto py-3 bg-transparent"
                          onClick={handleCouponsClick}
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

                      {!adDesign.hiddenFields?.jobsButton && (
                        <Button
                          variant="outline"
                          className="flex flex-col items-center justify-center gap-1 h-auto py-3 bg-transparent"
                          onClick={handleJobsClick}
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

                    {/* Custom Button or Colored Rectangle - Mobile */}
                    {!adDesign.hiddenFields?.customButton ? (
                      <Button
                        variant="outline"
                        className="flex flex-col items-center justify-center gap-1 h-auto py-3 mt-2 bg-transparent"
                        onClick={() => setIsDocumentsOpen(true)}
                      >
                        {(() => {
                          const IconComponent = getIconComponent(adDesign.customButton?.icon || "Menu")
                          return (
                            <IconComponent
                              className="h-5 w-5"
                              style={{
                                color: colorValues.textColor ? "#000000" : colorValues.primary,
                              }}
                            />
                          )
                        })()}
                        <span className="text-xs">{adDesign.customButton?.name || "Menu"}</span>
                      </Button>
                    ) : (
                      <div
                        className="h-12 mt-2 rounded-md"
                        style={{
                          backgroundColor: adDesign.texture === "gradient" ? "" : colorValues.primary,
                          backgroundImage:
                            adDesign.texture === "gradient"
                              ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                              : textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundImage ||
                                "none",
                          backgroundSize:
                            textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundSize || "auto",
                          backgroundRepeat:
                            textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundRepeat ||
                            "repeat",
                        }}
                      />
                    )}

                    {!adDesign.hiddenFields?.website && adDesign.businessInfo?.website && (
                      <button
                        onClick={() => handleWebsiteClick(adDesign.businessInfo.website)}
                        className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                        style={{
                          backgroundColor:
                            adDesign.texture === "gradient"
                              ? ""
                              : colorValues.textColor
                                ? "#000000"
                                : colorValues.primary,
                          backgroundImage:
                            adDesign.texture === "gradient"
                              ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                              : textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundImage ||
                                "none",
                          backgroundSize:
                            textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundSize || "auto",
                          backgroundRepeat:
                            textureOptions.find((t) => t.value === adDesign.texture)?.style.backgroundRepeat ||
                            "repeat",
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
                    )}
                  </div>
                </Card>
              </div>

              {/* Desktop Layout */}
              <div className="hidden md:block">{renderDesktopProfile()}</div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No profile information available for this business.</p>
              <Button variant="outline" className="mt-4 bg-transparent" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Album Dialog */}
      <BusinessPhotoAlbumDialog
        isOpen={isPhotoAlbumOpen}
        onClose={() => setIsPhotoAlbumOpen(false)}
        businessId={businessId}
        businessName={businessName}
      />

      {/* Coupons Dialog */}
      <BusinessCouponsDialog
        isOpen={isCouponsOpen}
        onOpenChange={setIsCouponsOpen}
        businessId={businessId}
        businessName={businessName}
      />

      {/* Jobs Dialog */}
      <BusinessJobsDialog
        isOpen={isJobsOpen}
        onClose={() => setIsJobsOpen(false)}
        businessId={businessId}
        businessName={businessName}
      />

      {/* Documents Dialog */}
      <DocumentsDialog
        isOpen={isDocumentsOpen}
        onClose={() => setIsDocumentsOpen(false)}
        businessId={businessId}
        businessName={businessName}
      />
    </>
  )
}
