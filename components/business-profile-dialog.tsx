"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getBusinessAdDesign } from "@/app/actions/business-actions"
import { Loader2, ImageIcon, Ticket, Briefcase } from "lucide-react"
import { BusinessPhotoAlbumDialog } from "./business-photo-album-dialog"
import { BusinessCouponsDialog } from "./business-coupons-dialog"

interface BusinessProfileDialogProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
  businessName: string
}

export function BusinessProfileDialog({ isOpen, onClose, businessId, businessName }: BusinessProfileDialogProps) {
  const [loading, setLoading] = useState(true)
  const [adDesign, setAdDesign] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPhotoAlbumOpen, setIsPhotoAlbumOpen] = useState(false)
  const [isCouponsOpen, setIsCouponsOpen] = useState(false)

  useEffect(() => {
    if (isOpen && businessId) {
      loadBusinessAdDesign()
    }
  }, [isOpen, businessId])

  useEffect(() => {
    // Close child dialogs when main dialog is closed
    if (!isOpen) {
      setIsPhotoAlbumOpen(false)
      setIsCouponsOpen(false)
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{businessName} Profile</DialogTitle>
          </DialogHeader>

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

                  {/* New buttons for Photo Album, Coupons, and Job Opportunities */}
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
                      onClick={() => window.open(`/business/${businessId}/jobs`, "_blank")}
                    >
                      <Briefcase className="h-5 w-5" />
                      <span className="text-xs">Job Opportunities</span>
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
    </>
  )
}
