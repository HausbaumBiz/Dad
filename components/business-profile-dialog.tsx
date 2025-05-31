"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBusinessAdDesign } from "@/app/actions/business-actions"
import {
  Loader2,
  ImageIcon,
  Ticket,
  Briefcase,
  AlertCircle,
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { kv } from "@/lib/redis"
import { KEY_PREFIXES } from "@/lib/db-schema"

// Add CSS to hide the default close button
const hideDefaultCloseButtonStyle = `
  .business-profile-dialog-content > div[class*="absolute right-4 top-4"] {
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
        <DialogContent
          className="business-profile-dialog-content w-full p-0 m-0"
          aria-describedby="business-profile-description"
        >
          {/* Hidden description for accessibility */}
          <div id="business-profile-description" className="sr-only">
            Business profile dialog showing detailed information, contact details, and services for {businessName}
          </div>
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
                    background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
                  }}
                >
                  <h3 className="text-2xl font-bold">{adDesign.businessInfo?.businessName || businessName}</h3>
                  {!adDesign.hiddenFields?.freeText && adDesign.businessInfo?.freeText && (
                    <p className="text-base mt-1 opacity-90">{adDesign.businessInfo.freeText}</p>
                  )}
                </div>

                <div className="pt-6 px-6 space-y-4">
                  {/* Phone Number - prioritize Redis data */}
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

                {/* Business Video */}
                {businessVideo && businessVideo.cloudflareVideoId && (
                  <div className="border-t pt-4 mt-4 px-4">
                    <p className="text-sm font-medium text-gray-500 mb-2">Business Video</p>

                    {/* Using iframe embed for maximum compatibility */}
                    <div
                      className={`relative ${businessVideo.videoAspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"} w-full overflow-hidden rounded-md`}
                    >
                      <iframe
                        src={`https://iframe.cloudflarestream.com/${businessVideo.cloudflareVideoId}`}
                        className="absolute top-0 left-0 w-full h-full"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={`${businessName} Video`}
                      ></iframe>
                    </div>
                  </div>
                )}

                {videoLoading && (
                  <div className="flex justify-center items-center py-2 mb-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
                    <span className="text-sm">Loading video...</span>
                  </div>
                )}

                {videoError && !videoLoading && !businessVideo && (
                  <Alert className="mb-3 bg-yellow-50 border-yellow-200">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-700 text-sm">{videoError}</AlertDescription>
                  </Alert>
                )}

                {/* Footer with buttons */}
                <div className="flex flex-col items-stretch gap-3 border-t pt-4 px-4 pb-4 mt-4">
                  {/* Buttons for Photo Album, Coupons, and Jobs */}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center gap-1 h-auto py-3"
                      onClick={() => setIsPhotoAlbumOpen(true)}
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span className="text-xs">Photo Album</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center gap-1 h-auto py-3"
                      onClick={() => setIsCouponsOpen(true)}
                    >
                      <Ticket className="h-5 w-5" />
                      <span className="text-xs">Coupons</span>
                    </Button>

                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center gap-1 h-auto py-3"
                      onClick={() => setIsJobsOpen(true)}
                    >
                      <Briefcase className="h-5 w-5" />
                      <span className="text-xs">Jobs</span>
                    </Button>
                  </div>

                  {/* Custom Button */}
                  {adDesign && adDesign.customButton && !adDesign.hiddenFields?.customButton && (
                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center gap-1 h-auto py-3 mt-2"
                      onClick={() => setIsDocumentsOpen(true)}
                    >
                      {(() => {
                        const IconComponent = getIconComponent(adDesign.customButton.icon || "Menu")
                        return (
                          <IconComponent
                            className="h-5 w-5"
                            style={{
                              color: colorValues.textColor ? "#000000" : colorValues.primary,
                            }}
                          />
                        )
                      })()}
                      <span className="text-xs">{adDesign.customButton.name || "Menu"}</span>
                    </Button>
                  )}

                  {/* Website button */}
                  {!adDesign.hiddenFields?.website && adDesign.businessInfo?.website && (
                    <button
                      onClick={() => window.open(`https://${adDesign.businessInfo.website}`, "_blank")}
                      className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90 mt-2"
                      style={{
                        backgroundColor: colorValues.textColor ? "#000000" : colorValues.primary,
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
