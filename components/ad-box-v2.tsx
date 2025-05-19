"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Phone, MapPin } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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
}: AdBoxProps) {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = () => {
    setIsVisible(false)
    if (onClose) {
      onClose()
    }
  }

  if (!isVisible) {
    return null
  }

  const finalCtaLink = ctaLink || `/business/${businessId}`
  const mapsUrl = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm adbox-container">
      <CardContent className="p-4 sm:p-6">
        {/* Header section with title at the top */}
        <div className="adbox-header mb-4">
          {/* Title at the top */}
          <h3 className="text-lg font-semibold mb-2 adbox-title text-center">{title}</h3>

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

        <div className="space-y-3 mb-4">
          {phoneNumber && (
            <a
              href={`tel:${phoneNumber.replace(/\D/g, "")}`}
              className="text-sm text-blue-600 flex items-center hover:underline"
            >
              <Phone className="h-4 w-4 mr-2" />
              {phoneNumber}
            </a>
          )}

          {address && mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 flex items-center hover:underline"
            >
              <MapPin className="h-4 w-4 mr-2" />
              <span className="line-clamp-2">{address}</span>
            </a>
          )}
        </div>

        <div className="flex justify-end">
          <Link href={finalCtaLink}>
            <Button variant="default" size="sm">
              {ctaText}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
