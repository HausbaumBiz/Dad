"use client"

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
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { BusinessPhotoAlbumDialog } from "./business-photo-album-dialog"
import { BusinessCouponsDialog } from "./business-coupons-dialog"
import { BusinessJobsDialog } from "./business-jobs-dialog"
import { DocumentsDialog } from "./documents-dialog"
import { getCloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"
import type { CloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

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
}

export function BusinessProfileDialog({ isOpen, onClose, businessId, businessName }: BusinessProfileDialogProps) {
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

  useEffect(() => {
    if (isOpen && businessId) {
      console.log(`BusinessProfileDialog opened for business ID: ${businessId}`)
      loadBusinessData()
      loadBusinessAdDesign()
      loadBusinessVideo()
    }
  }, [isOpen, businessId])

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
        console.log("Loaded ad design:", design)
        setAdDesign(design)
      } else {
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

  // Get the color values from the design
  const getColorValues = () => {
    if (!adDesign || !adDesign.colorValues) {
      return { primary: "#007BFF", secondary: "#0056b3" }
    }

    return {
      primary: adDesign.colorValues.primary || "#007BFF",
      secondary: adDesign.colorValues.secondary || "#0056b3",
      textColor: adDesign.colorValues.textColor,
    }
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

  // Helper function to format phone number
  const formatPhone = (phone: string) => {
    return phone || "Not provided"
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
    const phoneNumber = phone.replace(/\D/g, "")
    window.open(`tel:${phoneNumber}`)
  }

  // Function to handle map directions
  const handleGetDirections = (address: string) => {
    if (!address) return
    window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, "_blank")
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
              <Button variant="outline" className="mt-4" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : adDesign ? (
            <div className="overflow-hidden">
              {/* Mobile Layout (unchanged) */}
              <div className="block md:hidden">
                <Card className="w-full">
                  <div
                    className={`p-5 ${colorValues.textColor ? "text-black" : "text-white"} animate-in fade-in duration-500`}
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

                  <div className="pt-6 px-6 space-y-4 animate-in slide-in-from-bottom duration-600 delay-200">
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
                    <div className="border-t pt-4 mt-4 px-4 animate-in fade-in duration-700 delay-400">
                      <div className="relative w-full pb-[56.25%]">
                        {(() => {
                          if (businessVideo && businessVideo.cloudflareVideoId) {
                            const embedUrl = `https://customer-5093uhykxo17njhi.cloudflarestream.com/${businessVideo.cloudflareVideoId}/iframe`
                            return (
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
                    </div>
                  )}

                  {/* Mobile Footer with buttons */}
                  <div className="flex flex-col items-stretch gap-3 border-t pt-4 px-4 pb-4 mt-4 animate-in slide-in-from-bottom duration-600 delay-500">
                    <div className="grid grid-cols-3 gap-2">
                      {!adDesign.hiddenFields?.photoAlbum && (
                        <Button
                          variant="outline"
                          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
                          onClick={() => setIsPhotoAlbumOpen(true)}
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
                          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
                          onClick={() => setIsCouponsOpen(true)}
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
                          className="flex flex-col items-center justify-center gap-1 h-auto py-3"
                          onClick={() => setIsJobsOpen(true)}
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

                    {!adDesign.hiddenFields?.customButton && (
                      <Button
                        variant="outline"
                        className="flex flex-col items-center justify-center gap-1 h-auto py-3 mt-2"
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
                    )}

                    {!adDesign.hiddenFields?.website && adDesign.businessInfo?.website && (
                      <button
                        onClick={() => window.open(`https://${adDesign.businessInfo.website}`, "_blank")}
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

              {/* Desktop Layout (updated with custom button logic) */}
              <div className="hidden md:block">
                <div className="max-w-6xl mx-auto">
                  {/* Header with Business Name */}
                  <div
                    className={`text-white rounded-t-lg p-8 ${colorValues.textColor ? "text-black" : "text-white"} animate-in fade-in duration-500`}
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
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {adDesign.businessInfo?.businessName || businessName}
                    </h1>
                    {!adDesign.hiddenFields?.freeText && adDesign.businessInfo?.freeText && (
                      <p className="opacity-90 mt-2">{adDesign.businessInfo.freeText}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-6 rounded-b-lg shadow-lg">
                    {/* Left Column - Business Info */}
                    <div className="space-y-6">
                      {/* Contact Information */}
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

                      {/* Hours of Operation */}
                      {!adDesign.hiddenFields?.hours && (
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
                      )}

                      {/* Quick Links */}
                      <Card className="overflow-hidden border-none shadow-md animate-in slide-in-from-left duration-700 delay-600">
                        <CardContent className="p-0">
                          <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
                            <h2 className="font-semibold text-lg">Quick Links</h2>
                          </div>
                          <div className="p-4 grid grid-cols-2 gap-3">
                            {!adDesign.hiddenFields?.photoAlbum && (
                              <button
                                onClick={() => setIsPhotoAlbumOpen(true)}
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

                            {/* Conditionally render either the website button or the custom button */}
                            {adDesign.hiddenFields?.customButton &&
                            !adDesign.hiddenFields?.website &&
                            adDesign.businessInfo?.website ? (
                              <button
                                onClick={() => window.open(`https://${adDesign.businessInfo.website}`, "_blank")}
                                className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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
                                  <path d="M2 12h20"></path>
                                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                                </svg>
                                <span className="text-sm font-medium">Website</span>
                              </button>
                            ) : (
                              !adDesign.hiddenFields?.customButton && (
                                <button
                                  onClick={() => setIsDocumentsOpen(true)}
                                  className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors col-span-2"
                                >
                                  {(() => {
                                    const IconComponent = getIconComponent(adDesign.customButton?.icon || "Menu")
                                    return (
                                      <IconComponent
                                        className="h-5 w-5"
                                        style={{
                                          color: colorValues.primary,
                                        }}
                                      />
                                    )
                                  })()}
                                  <span className="text-sm font-medium">{adDesign.customButton?.name || "Menu"}</span>
                                </button>
                              )
                            )}

                            {!adDesign.hiddenFields?.savingsButton && (
                              <button
                                onClick={() => setIsCouponsOpen(true)}
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
                                onClick={() => setIsJobsOpen(true)}
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
                    </div>

                    {/* Right Column - Video */}
                    <div className="space-y-6">
                      {!adDesign.hiddenFields?.video && (
                        <Card className="overflow-hidden border-none shadow-md h-full animate-in slide-in-from-right duration-700 delay-300">
                          <CardContent className="p-0 h-full flex flex-col">
                            <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
                              <h2 className="font-semibold text-lg">Featured Video</h2>
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                              <div className="relative w-full pb-[56.25%] flex-1">
                                {(() => {
                                  if (businessVideo && businessVideo.cloudflareVideoId) {
                                    const embedUrl = `https://customer-5093uhykxo17njhi.cloudflarestream.com/${businessVideo.cloudflareVideoId}/iframe`
                                    return (
                                      <iframe
                                        src={embedUrl}
                                        className="absolute top-0 left-0 w-full h-full rounded-md"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        title={`${businessName} video`}
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

                              {/* Conditionally render either the website button or the custom button */}
                              {adDesign.hiddenFields?.customButton &&
                              !adDesign.hiddenFields?.website &&
                              adDesign.businessInfo?.website ? (
                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                  <button
                                    onClick={() => window.open(`https://${adDesign.businessInfo.website}`, "_blank")}
                                    className="flex items-center justify-center gap-2 w-full text-white p-3 rounded-md transition-colors hover:opacity-90"
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
                                          : textureOptions.find((t) => t.value === adDesign.texture)?.style
                                              .backgroundImage || "none",
                                      backgroundSize:
                                        textureOptions.find((t) => t.value === adDesign.texture)?.style
                                          .backgroundSize || "auto",
                                      backgroundRepeat:
                                        textureOptions.find((t) => t.value === adDesign.texture)?.style
                                          .backgroundRepeat || "repeat",
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
                              ) : (
                                !adDesign.hiddenFields?.customButton && (
                                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <button
                                      onClick={() => setIsDocumentsOpen(true)}
                                      className="flex items-center justify-center gap-2 w-full text-white p-3 rounded-md transition-colors hover:opacity-90"
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
                                            : textureOptions.find((t) => t.value === adDesign.texture)?.style
                                                .backgroundImage || "none",
                                        backgroundSize:
                                          textureOptions.find((t) => t.value === adDesign.texture)?.style
                                            .backgroundSize || "auto",
                                        backgroundRepeat:
                                          textureOptions.find((t) => t.value === adDesign.texture)?.style
                                            .backgroundRepeat || "repeat",
                                      }}
                                    >
                                      {(() => {
                                        const IconComponent = getIconComponent(adDesign.customButton?.icon || "Menu")
                                        return <IconComponent className="h-5 w-5 text-white" />
                                      })()}
                                      <span>{adDesign.customButton?.name || "Menu"}</span>
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No profile information available for this business.</p>
              <Button variant="outline" className="mt-4" onClick={onClose}>
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
