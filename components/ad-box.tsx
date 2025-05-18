"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
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

  return (
    <Card className="overflow-hidden border border-gray-200 shadow-sm adbox-container">
      <CardContent className="p-4 sm:p-6">
        <div className="relative adbox-header">
          <h3 className="text-lg font-semibold mb-1 adbox-title">{title}</h3>

          {/* Close button - positioned absolutely */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute top-0 right-0 h-8 w-8 p-0 rounded-full adbox-close-button"
            aria-label="Close advertisement"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-gray-600 mb-3">{businessName}</p>

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
