"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function OutsideMaintenancePage() {
  const filterOptions = [
    { id: "outside1", label: "Roofing", value: "Roofing" },
    { id: "outside2", label: "Masonry Stone and Brick", value: "Masonry Stone and Brick" },
    { id: "outside3", label: "Glass Block", value: "Glass Block" },
    { id: "outside4", label: "Siding", value: "Siding" },
    { id: "outside5", label: "Deck Cleaning/Refinishing", value: "Deck Cleaning/Refinishing" },
    { id: "outside6", label: "Garage Doors", value: "Garage Doors" },
    { id: "outside7", label: "House Painting", value: "House Painting" },
    { id: "outside8", label: "Pressure Washing", value: "Pressure Washing" },
    { id: "outside9", label: "Foundation Repair", value: "Foundation Repair" },
    { id: "outside10", label: "Gutter Cleaning/Repair", value: "Gutter Cleaning/Repair" },
    { id: "outside11", label: "Septic Tank Service", value: "Septic Tank Service" },
    { id: "outside12", label: "Well & Water Pump Repair", value: "Well & Water Pump Repair" },
    { id: "outside13", label: "Other Outside Home Maintenance", value: "Other Outside Home Maintenance" },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Premier Roofing Solutions",
      services: ["Roofing", "Gutter Cleaning/Repair"],
      rating: 4.7,
      reviews: 98,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Exterior Experts",
      services: ["Siding", "House Painting", "Pressure Washing"],
      rating: 4.9,
      reviews: 112,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Foundation Masters",
      services: ["Foundation Repair", "Masonry Stone and Brick"],
      rating: 4.8,
      reviews: 76,
      location: "Akron, OH",
    },
  ])

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    "Premier Roofing Solutions": [
      {
        id: 1,
        username: "HomeProtector",
        rating: 5,
        date: "2023-09-18",
        comment:
          "Excellent roofing job! They replaced our entire roof in just two days and cleaned up perfectly afterward.",
      },
      {
        id: 2,
        username: "RainReadyHome",
        rating: 4,
        date: "2023-08-05",
        comment: "Did a thorough job cleaning and repairing our gutters. No more overflows during heavy rain.",
      },
      {
        id: 3,
        username: "QualitySeeker",
        rating: 5,
        date: "2023-07-22",
        comment:
          "Used them for a roof inspection before buying our home. Very detailed report and honest assessment of needed repairs.",
      },
    ],
    "Exterior Experts": [
      {
        id: 1,
        username: "CurbAppealFan",
        rating: 5,
        date: "2023-10-12",
        comment:
          "The new siding transformed our home! Professional installation and they helped us choose the perfect color.",
      },
      {
        id: 2,
        username: "FreshLookHome",
        rating: 5,
        date: "2023-09-30",
        comment:
          "Their house painting service was top-notch. The crew was meticulous with prep work and the finish is flawless.",
      },
      {
        id: 3,
        username: "CleanDriveway",
        rating: 4,
        date: "2023-08-15",
        comment:
          "Pressure washed our driveway, walkways, and patio. Everything looks brand new again. Would recommend.",
      },
    ],
    "Foundation Masters": [
      {
        id: 1,
        username: "StructuralSafety",
        rating: 5,
        date: "2023-07-28",
        comment:
          "Fixed a serious foundation issue that other companies said couldn't be repaired. Saved us from having to sell our home.",
      },
      {
        id: 2,
        username: "BrickHomeOwner",
        rating: 4,
        date: "2023-06-15",
        comment: "Repaired and repointed our brick exterior. Matched the mortar color perfectly to the original.",
      },
      {
        id: 3,
        username: "BasementDry",
        rating: 5,
        date: "2023-05-20",
        comment:
          "Fixed our foundation cracks and waterproofed the basement. Haven't had any water issues since, even during heavy storms.",
      },
    ],
  }

  // Handler for opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout
      title="Outside Home Maintenance and Repair"
      backLink="/home-improvement"
      backText="Home Improvement"
    >
      <CategoryFilter options={filterOptions} />

      <div className="space-y-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{provider.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

                  <div className="flex items-center mt-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(provider.rating) ? "text-yellow-400" : "text-gray-300"}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">
                      {provider.rating} ({provider.reviews} reviews)
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Services:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {provider.services.map((service, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                  <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider)}>
                    Reviews
                  </Button>
                  <Button variant="outline" className="mt-2 w-full md:w-auto">
                    View Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name}
        reviews={selectedProvider ? mockReviews[selectedProvider.name] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}
