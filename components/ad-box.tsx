"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Phone, MapPin } from "lucide-react"
import Image from "next/image"
import { BusinessProfileDialog } from "./business-profile-dialog"
import { useToast } from "@/components/ui/use-toast"

interface AdBoxProps {
  title: string
  description: string
  imageUrl?: string
  businessName: string
  businessId: string
  ctaText?: string
  ctaLink?: string
  phoneNumber?: string
  address?: string
  onClose?: () => void
  // Add page context to ensure adbox only shows on correct pages
  pageContext?: string
}

export function AdBox({
  title,
  description,
  imageUrl,
  businessName,
  businessId,
  ctaText = "Learn More",
  ctaLink,
  phoneNumber,
  address,
  onClose,
  pageContext,
}: AdBoxProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [hasError, setHasError] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Validate business ID
    if (!businessId || businessId.trim() === "") {
      console.error("AdBox: Invalid business ID provided", { businessId, businessName })
      setHasError(true)
    }

    // Log page context for debugging
    if (pageContext) {
      console.log(`AdBox for business ${businessId} rendered on page: ${pageContext}`)
    }
  }, [businessId, businessName, pageContext])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    if (onClose) {
      onClose()
    }
  }, [onClose])

  const handleLearnMore = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      console.log(`Opening profile dialog for business ${businessId} from page ${pageContext}`)

      toast({
        title: "Opening business profile",
        description: `Loading profile for ${businessName}...`,
        duration: 2000,
      })

      setIsProfileOpen(true)
    },
    [businessId, businessName, pageContext, toast],
  )

  const handleCloseProfile = useCallback(() => {
    console.log(`Closing profile dialog for business ${businessId}`)
    setIsProfileOpen(false)
  }, [businessId])

  if (!isVisible || hasError) {
    return null
  }

  const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null

  return (
    <>
      <Card className="overflow-hidden border border-gray-200 shadow-sm adbox-container">
        <CardContent className="p-4 sm:p-6">
          {/* Header section with title */}
          <div className="adbox-header mb-4">
            {/* Title at the top */}
            <h3 className="text-lg font-semibold mb-3 adbox-title text-center">{title}</h3>

            {/* Close button centered at the top */}
            <div className="flex justify-center mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0 rounded-full adbox-close-button"
                aria-label="Close advertisement"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Business name centered below the close button */}
            <p className="text-sm text-gray-600 adbox-business-name text-center">{businessName}</p>
          </div>

          {imageUrl && (
            <div className="relative w-full h-40 mb-4 rounded-md overflow-hidden">
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}

          <p className="text-sm text-gray-700 mb-4">{description}</p>

          <div className="space-y-3 mb-4 relative z-10">
            {phoneNumber && (
              <a
                href={`tel:${phoneNumber?.replace(/\D/g, "")}`}
                className="text-sm text-blue-600 flex items-center hover:underline active:text-blue-800 cursor-pointer z-10 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{phoneNumber}</span>
              </a>
            )}

            {address && mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 flex items-center hover:underline active:text-blue-800 cursor-pointer z-10 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="line-clamp-2">{address}</span>
              </a>
            )}
          </div>

          <div className="flex justify-end">
            {/* IMPORTANT: Removed Link component and using only Button with onClick */}
            <Button
              variant="default"
              size="sm"
              onClick={handleLearnMore}
              data-business-id={businessId}
              data-page-context={pageContext}
              className="view-profile-button"
            >
              {ctaText}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileOpen}
        onClose={handleCloseProfile}
        businessId={businessId}
        businessName={businessName}
      />
    </>
  )
}
