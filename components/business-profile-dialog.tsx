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
import { Card } from "@/components/ui/card"
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
        <DialogContent className="business-profile-dialog-content w-full p-0 m-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{businessName}</DialogTitle>
            <DialogDescription>
              Business profile dialog showing detailed information, contact details, and services for {businessName}
            </DialogDescription>
          </DialogHeader>

          {/* Custom close button - centered above content */}
          <div className="flex justify-center w-full py-1 border-b">
            <DialogClose className="rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
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
            <div className="overflow-hidden rounded-lg shadow-md">
              <Card className="w-full">
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

                {/* Video Section - Using Cloudflare Video or Image Placeholder */}
                {!adDesign.hiddenFields?.video && (
                  <div className="border-t pt-4 mt-4 px-4">
                    <div className="relative w-full pb-[56.25%]">
                      {(() => {
                        console.log("Video render check:", {
                          businessVideo,
                          hasVideoId: businessVideo?.cloudflareVideoId,
                          isReady: businessVideo?.cloudflareVideoReadyToStream,
                          fullCondition:
                            businessVideo &&
                            businessVideo.cloudflareVideoId &&
                            businessVideo.cloudflareVideoReadyToStream,
                        })

                        if (businessVideo && businessVideo.cloudflareVideoId) {
                          // Use Cloudflare Stream iframe embed for better compatibility
                          const embedUrl = `https://customer-5093uhykxo17njhi.cloudflarestream.com/${businessVideo.cloudflareVideoId}/iframe`

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

                  {/* Custom Button */}
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

                  {/* Website button */}
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
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                      Visit Website
                    </button>
                  )}
                </div>
              </Card>
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
