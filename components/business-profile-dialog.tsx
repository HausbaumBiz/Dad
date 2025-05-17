"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBusinessAdDesign } from "@/app/actions/business-actions"
import { Loader2, ImageIcon, Ticket, Briefcase, AlertCircle, X } from "lucide-react"
import { BusinessPhotoAlbumDialog } from "./business-photo-album-dialog"
import { BusinessCouponsDialog } from "./business-coupons-dialog"
import { BusinessJobsDialog } from "./business-jobs-dialog"
import { getCloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"
import type { CloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useMobile } from "@/hooks/use-mobile"

interface BusinessProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
  businessName: string
  business?: any // Optional full business object
}

export function BusinessProfileDialog({
  isOpen,
  onClose,
  businessId,
  businessName,
  business,
}: BusinessProfileDialogProps) {
  const isMobile = useMobile()
  const [loading, setLoading] = useState(true)
  const [adDesign, setAdDesign] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPhotoAlbumOpen, setIsPhotoAlbumOpen] = useState(false)
  const [isCouponsOpen, setIsCouponsOpen] = useState(false)
  const [isJobsOpen, setIsJobsOpen] = useState(false)
  const [businessVideo, setBusinessVideo] = useState<CloudflareBusinessMedia | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)

  // Debug toggle function
  const toggleDebug = () => {
    setShowDebug((prev) => !prev)
  }

  useEffect(() => {
    if (isOpen && businessId) {
      console.log(`BusinessProfileDialog opened for business ID: ${businessId}, name: ${businessName}`)
      loadBusinessAdDesign()
      loadBusinessVideo()
    }
  }, [isOpen, businessId, businessName])

  useEffect(() => {
    // Close child dialogs when main dialog is closed
    if (!isOpen) {
      setIsPhotoAlbumOpen(false)
      setIsCouponsOpen(false)
      setIsJobsOpen(false)
    }
  }, [isOpen])

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

  // Function to manually retry loading the video
  const retryLoadVideo = () => {
    loadBusinessVideo()
  }

  // Function to get Cloudflare Stream public URL
  const getCloudflareStreamUrl = (videoId: string) => {
    const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID
    return `https://customer-${accountId}.cloudflarestream.com/${videoId}/manifest/video.m3u8`
  }

  // Function to get Cloudflare Stream iframe embed URL
  const getCloudflareStreamEmbedUrl = (videoId: string) => {
    return `https://iframe.cloudflarestream.com/${videoId}`
  }

  // Function to get Cloudflare Stream thumbnail URL
  const getCloudflareStreamThumbnailUrl = (videoId: string, time = 0) => {
    const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID
    return `https://customer-${accountId}.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg?time=${time}s`
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg lg:max-w-3xl xl:max-w-4xl max-h-[90vh] lg:max-h-[85vh] overflow-y-auto">
          {/* Enhanced mobile close button */}
          {isMobile && (
            <div className="absolute right-4 top-4 z-10">
              <DialogClose className="rounded-full p-3 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          )}

          {/* Debug button - only in development */}
          {process.env.NODE_ENV !== "production" && (
            <div className="absolute top-2 right-16 z-50">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDebug}
                className="h-7 px-2 text-xs bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
              >
                {showDebug ? "Hide Debug" : "Debug"}
              </Button>
            </div>
          )}

          {/* Debug information panel */}
          {showDebug && debugInfo && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-xs overflow-auto max-h-40">
              <h4 className="font-medium text-yellow-800 mb-1">Debug Information:</h4>
              <div className="grid grid-cols-2 gap-1">
                <div className="font-medium">Business ID:</div>
                <div>{debugInfo.businessId || "Not set"}</div>

                <div className="font-medium">Business Name:</div>
                <div>{businessName || "Not set"}</div>

                <div className="font-medium">Has Video ID:</div>
                <div>{debugInfo.hasVideoId ? "Yes" : "No"}</div>

                <div className="font-medium">Ready to Stream:</div>
                <div>{debugInfo.isReadyToStream ? "Yes" : "No"}</div>

                <div className="font-medium">Aspect Ratio:</div>
                <div>{debugInfo.aspectRatio}</div>

                <div className="font-medium">Timestamp:</div>
                <div>{debugInfo.timestamp}</div>

                {debugInfo.hasVideoId && (
                  <>
                    <div className="font-medium">Video ID:</div>
                    <div>{debugInfo.videoData?.cloudflareVideoId}</div>

                    <div className="font-medium">Account ID:</div>
                    <div>{process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID || "Not set"}</div>
                  </>
                )}
              </div>

              {debugInfo.error && (
                <div className="mt-2 text-red-600">
                  <div className="font-medium">Error:</div>
                  <div>{debugInfo.error}</div>
                  {debugInfo.errorStack && (
                    <details>
                      <summary className="cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs mt-1 p-1 bg-red-50">{debugInfo.errorStack}</pre>
                    </details>
                  )}
                </div>
              )}

              <details>
                <summary className="cursor-pointer mt-2 text-yellow-700">Full Video Data</summary>
                <pre className="text-xs mt-1 p-1 bg-yellow-100 overflow-auto">
                  {JSON.stringify(debugInfo.videoData, null, 2)}
                </pre>
              </details>

              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={retryLoadVideo} className="h-6 px-2 text-xs">
                  Retry Load Video
                </Button>
              </div>
            </div>
          )}

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
                  {!adDesign.hiddenFields?.phone && (
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
                        <p>{formatPhone(adDesign.businessInfo?.phone)}</p>
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
                        <p>{formatAddress(adDesign.businessInfo)}</p>
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

                {/* Footer with buttons */}
                <div className="flex flex-col items-stretch gap-3 border-t pt-4 px-4 pb-4 mt-4">
                  {/* Business Video */}
                  {businessVideo && businessVideo.cloudflareVideoId && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-500 mb-2">Business Video</p>

                      {/* Using iframe embed for maximum compatibility */}
                      <div
                        className={`relative ${businessVideo.videoAspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"} w-full overflow-hidden rounded-md`}
                      >
                        <iframe
                          src={getCloudflareStreamEmbedUrl(businessVideo.cloudflareVideoId)}
                          className="absolute top-0 left-0 w-full h-full"
                          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={`${businessName} Video`}
                        ></iframe>
                      </div>

                      {/* Fallback for debugging */}
                      {showDebug && (
                        <div className="mt-2 text-xs">
                          <p>Direct video URL (for debugging):</p>
                          <a
                            href={getCloudflareStreamUrl(businessVideo.cloudflareVideoId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 break-all"
                          >
                            {getCloudflareStreamUrl(businessVideo.cloudflareVideoId)}
                          </a>
                        </div>
                      )}
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
                      <AlertDescription className="text-yellow-700 text-sm">
                        {videoError}
                        {process.env.NODE_ENV !== "production" && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={retryLoadVideo}
                            className="p-0 h-auto text-xs text-yellow-700 underline ml-2"
                          >
                            Retry
                          </Button>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {!adDesign.hiddenFields?.website && adDesign.businessInfo?.website && (
                    <button
                      onClick={() => window.open(`https://${adDesign.businessInfo.website}`, "_blank")}
                      className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
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

          {/* Mobile-friendly bottom close button */}
          {isMobile && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" size="lg" className="w-full py-3 text-base font-medium" onClick={onClose}>
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
    </>
  )
}
