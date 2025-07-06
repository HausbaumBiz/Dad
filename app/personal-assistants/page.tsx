"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StarIcon, MapPinIcon, PhoneIcon, GlobeIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { CloudflareImage } from "@/components/cloudflare-image"
import { Suspense } from "react"
import { useState } from "react"

// Sample business data for personal assistants
const personalAssistantBusinesses = [
  {
    id: "1",
    name: "Elite Personal Services",
    description:
      "Professional personal assistant services for busy executives and families. We handle scheduling, travel arrangements, household management, and administrative tasks.",
    address: "123 Main Street, Downtown",
    phone: "(555) 123-4567",
    website: "www.elitepersonalservices.com",
    rating: 4.8,
    reviewCount: 45,
    categories: ["Personal Assistant", "Executive Support", "Household Management"],
    serviceArea: "Downtown, Midtown, Uptown",
    photos: [
      "https://imagedelivery.net/your-account/photo1/public",
      "https://imagedelivery.net/your-account/photo2/public",
      "https://imagedelivery.net/your-account/photo3/public",
      "https://imagedelivery.net/your-account/photo4/public",
      "https://imagedelivery.net/your-account/photo5/public",
      "https://imagedelivery.net/your-account/photo6/public",
    ],
  },
  {
    id: "2",
    name: "Lifestyle Management Solutions",
    description:
      "Comprehensive lifestyle management and personal concierge services. From event planning to daily errands, we make your life easier.",
    address: "456 Oak Avenue, Westside",
    phone: "(555) 234-5678",
    website: "www.lifestylemanagement.com",
    rating: 4.9,
    reviewCount: 62,
    categories: ["Personal Assistant", "Concierge Services", "Event Planning"],
    serviceArea: "Westside, Central, Eastside",
    photos: [
      "https://imagedelivery.net/your-account/photo7/public",
      "https://imagedelivery.net/your-account/photo8/public",
      "https://imagedelivery.net/your-account/photo9/public",
      "https://imagedelivery.net/your-account/photo10/public",
      "https://imagedelivery.net/your-account/photo11/public",
    ],
  },
  {
    id: "3",
    name: "Executive Assistant Pro",
    description:
      "Dedicated executive assistant services for professionals and entrepreneurs. Specializing in calendar management, correspondence, and project coordination.",
    address: "789 Business Blvd, Financial District",
    phone: "(555) 345-6789",
    website: "www.executiveassistantpro.com",
    rating: 4.7,
    reviewCount: 38,
    categories: ["Executive Assistant", "Administrative Support", "Project Management"],
    serviceArea: "Financial District, Downtown, Midtown",
    photos: [
      "https://imagedelivery.net/your-account/photo12/public",
      "https://imagedelivery.net/your-account/photo13/public",
      "https://imagedelivery.net/your-account/photo14/public",
      "https://imagedelivery.net/your-account/photo15/public",
      "https://imagedelivery.net/your-account/photo16/public",
      "https://imagedelivery.net/your-account/photo17/public",
      "https://imagedelivery.net/your-account/photo18/public",
    ],
  },
]

function PhotoCarousel({ photos, businessName }: { photos: string[]; businessName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!photos || photos.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg h-32">
        <span className="text-gray-500 text-sm">No photos available</span>
      </div>
    )
  }

  const photosToShow = 5
  const maxIndex = Math.max(0, photos.length - photosToShow)

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  return (
    <div className="flex-1 relative">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          disabled={currentIndex === 0}
          className="h-8 w-8 p-0 flex-shrink-0 bg-transparent"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        <div className="flex space-x-2 overflow-hidden flex-1">
          {photos.slice(currentIndex, currentIndex + photosToShow).map((photo, index) => (
            <div key={index} className="flex-shrink-0 w-24 h-24">
              <CloudflareImage
                src={photo}
                alt={`${businessName} photo ${currentIndex + index + 1}`}
                width={96}
                height={96}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          disabled={currentIndex >= maxIndex}
          className="h-8 w-8 p-0 flex-shrink-0"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>

      {photos.length > photosToShow && (
        <div className="text-center mt-2">
          <span className="text-xs text-gray-500">
            {currentIndex + 1}-{Math.min(currentIndex + photosToShow, photos.length)} of {photos.length} photos
          </span>
        </div>
      )}
    </div>
  )
}

function BusinessCard({ business }: { business: (typeof personalAssistantBusinesses)[0] }) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-6">
          {/* Left: Business Info */}
          <div className="flex-shrink-0 w-80">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{business.name}</h3>
              <div className="flex items-center space-x-1">
                <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">{business.rating}</span>
                <span className="text-sm text-gray-500">({business.reviewCount})</span>
              </div>
            </div>

            <p className="text-gray-600 mb-4 text-sm leading-relaxed">{business.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{business.address}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{business.phone}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <GlobeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>{business.website}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {business.categories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <span className="font-medium">Service Area:</span> {business.serviceArea}
            </div>
          </div>

          {/* Center: Photo Carousel */}
          <PhotoCarousel photos={business.photos} businessName={business.name} />

          {/* Right: Action Buttons */}
          <div className="flex flex-col space-y-2 flex-shrink-0">
            <ReviewsDialog businessId={business.id} businessName={business.name}>
              <Button variant="outline" size="sm" className="text-xs px-3 py-1 h-7 bg-transparent">
                Reviews
              </Button>
            </ReviewsDialog>
            <BusinessProfileDialog business={business}>
              <Button size="sm" className="text-xs px-3 py-1 h-7">
                View Profile
              </Button>
            </BusinessProfileDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PersonalAssistantsContent() {
  return (
    <div className="space-y-6">
      {personalAssistantBusinesses.map((business) => (
        <BusinessCard key={business.id} business={business} />
      ))}
    </div>
  )
}

export default function PersonalAssistantsPage() {
  return (
    <CategoryLayout
      title="Personal Assistants"
      description="Professional personal assistant and concierge services to help manage your busy lifestyle. From administrative support to household management, find qualified assistants to make your life easier."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Personal Assistants", href: "/personal-assistants" },
      ]}
    >
      <Suspense fallback={<div>Loading personal assistant services...</div>}>
        <PersonalAssistantsContent />
      </Suspense>
    </CategoryLayout>
  )
}
