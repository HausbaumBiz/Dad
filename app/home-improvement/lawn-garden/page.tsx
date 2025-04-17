"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function LawnGardenPage() {
  const filterOptions = [
    { id: "lawn1", label: "Lawn & Landscaping", value: "Lawn & Landscaping" },
    { id: "lawn2", label: "Lawn Treatment", value: "Lawn Treatment" },
    { id: "lawn3", label: "Landscape Lighting", value: "Landscape Lighting" },
    { id: "lawn4", label: "Lawn Mower and Equipment Repair", value: "Lawn Mower and Equipment Repair" },
    { id: "lawn5", label: "Tree Service", value: "Tree Service" },
    { id: "lawn6", label: "Plant Nurseries", value: "Plant Nurseries" },
    { id: "lawn7", label: "Mulch Delivery", value: "Mulch Delivery" },
    { id: "lawn8", label: "Soil Tilling", value: "Soil Tilling" },
    { id: "lawn9", label: "Leaf Removal", value: "Leaf Removal" },
    { id: "lawn10", label: "Hardscaping", value: "Hardscaping" },
    { id: "lawn11", label: "Snow Removal", value: "Snow Removal" },
    { id: "lawn12", label: "Other Lawn, Garden and Snow Removal", value: "Other Lawn, Garden and Snow Removal" },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Green Thumb Landscaping",
      services: ["Lawn & Landscaping", "Lawn Treatment", "Hardscaping"],
      rating: 4.8,
      reviews: 124,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Snow Masters",
      services: ["Snow Removal", "Leaf Removal"],
      rating: 4.6,
      reviews: 89,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Tree Care Experts",
      services: ["Tree Service", "Landscape Lighting"],
      rating: 4.9,
      reviews: 56,
      location: "Akron, OH",
    },
  ])

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    "Green Thumb Landscaping": [
      {
        id: 1,
        username: "GardenEnthusiast",
        rating: 5,
        date: "2023-10-15",
        comment:
          "Transformed our backyard into a beautiful oasis! The landscaping team was professional and completed the job ahead of schedule.",
      },
      {
        id: 2,
        username: "HomeownerJane",
        rating: 5,
        date: "2023-09-22",
        comment:
          "Their lawn treatment service has made our grass the envy of the neighborhood. Highly recommend their seasonal treatment plan.",
      },
      {
        id: 3,
        username: "PatioLover",
        rating: 4,
        date: "2023-08-05",
        comment:
          "Did a fantastic job on our hardscaping project. The new patio and retaining wall look amazing. Took a bit longer than expected, but worth the wait.",
      },
    ],
    "Snow Masters": [
      {
        id: 1,
        username: "WinterResident",
        rating: 5,
        date: "2023-12-18",
        comment: "Reliable snow removal service! They're always here within hours of a snowfall, even on weekends.",
      },
      {
        id: 2,
        username: "BusinessOwner",
        rating: 4,
        date: "2023-11-30",
        comment: "Great leaf removal service in the fall. They were thorough and left our property looking pristine.",
      },
      {
        id: 3,
        username: "SeniorCitizen",
        rating: 5,
        date: "2023-01-10",
        comment:
          "As an older homeowner, I rely on their snow removal service every winter. They're dependable and take extra care around my walkways.",
      },
    ],
    "Tree Care Experts": [
      {
        id: 1,
        username: "OakLover",
        rating: 5,
        date: "2023-07-12",
        comment: "Professional tree trimming service. They handled our 100-year-old oak with care and expertise.",
      },
      {
        id: 2,
        username: "NightGardener",
        rating: 5,
        date: "2023-06-28",
        comment:
          "The landscape lighting they installed has transformed our garden at night. Beautiful design and quality fixtures.",
      },
      {
        id: 3,
        username: "SafetyFirst",
        rating: 4,
        date: "2023-05-15",
        comment: "Removed a dangerous tree that was leaning toward our house. Quick response and reasonable pricing.",
      },
    ],
  }

  // Handler for opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Lawn, Garden and Snow Removal" backLink="/home-improvement" backText="Home Improvement">
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
