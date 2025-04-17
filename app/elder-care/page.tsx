"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function ElderCarePage() {
  const filterOptions = [
    { id: "homecare1", label: "Non-Medical Elder Care", value: "Non-Medical Elder Care" },
    { id: "homecare2", label: "Non-Medical Special Needs Adult Care", value: "Non-Medical Special Needs Adult Care" },
    { id: "homecare3", label: "Assisted Living Facilities", value: "Assisted Living Facilities" },
    { id: "homecare4", label: "Memory Care", value: "Memory Care" },
    { id: "homecare5", label: "Respite Care", value: "Respite Care" },
    { id: "homecare6", label: "Nursing Homes", value: "Nursing Homes" },
    { id: "homecare7", label: "Hospice Care", value: "Hospice Care" },
    { id: "homecare8", label: "Adult Daycare", value: "Adult Daycare" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>("")

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Caring Hearts Home Care",
      services: ["Non-Medical Elder Care", "Respite Care"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Golden Years Assisted Living",
      services: ["Assisted Living Facilities", "Memory Care"],
      rating: 4.7,
      reviews: 64,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Compassionate Care Services",
      services: ["Hospice Care", "Non-Medical Elder Care"],
      rating: 4.8,
      reviews: 92,
      location: "Akron, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    "Caring Hearts Home Care": [
      {
        id: 1,
        userName: "Margaret J.",
        rating: 5,
        comment:
          "The caregivers from Caring Hearts have been a blessing for my father. They are attentive, compassionate, and truly care about his well-being. I can finally rest easy knowing he's in good hands.",
        date: "March 15, 2023",
      },
      {
        id: 2,
        userName: "Robert T.",
        rating: 5,
        comment:
          "We've tried several home care services for my mother, and Caring Hearts is by far the best. Their staff is reliable, professional, and they've become like family to us.",
        date: "February 3, 2023",
      },
      {
        id: 3,
        userName: "Susan M.",
        rating: 4,
        comment:
          "Very satisfied with the level of care provided. The only reason for 4 stars instead of 5 is occasional scheduling issues, but the care itself is excellent.",
        date: "January 22, 2023",
      },
    ],
    "Golden Years Assisted Living": [
      {
        id: 1,
        userName: "David L.",
        rating: 5,
        comment:
          "Golden Years has provided exceptional care for my mother who has dementia. The memory care unit is well-staffed with trained professionals who truly understand her needs.",
        date: "April 10, 2023",
      },
      {
        id: 2,
        userName: "Patricia H.",
        rating: 4,
        comment:
          "The facility is clean and well-maintained. Staff is friendly and attentive. My only suggestion would be more varied activities for residents.",
        date: "March 5, 2023",
      },
    ],
    "Compassionate Care Services": [
      {
        id: 1,
        userName: "Jennifer W.",
        rating: 5,
        comment:
          "During my father's final months, Compassionate Care provided dignity, comfort, and support not just for him but for our entire family. I cannot thank them enough.",
        date: "May 2, 2023",
      },
      {
        id: 2,
        userName: "Michael B.",
        rating: 5,
        comment:
          "The hospice nurses were angels during a difficult time. They explained everything clearly and made sure my grandmother was comfortable and pain-free.",
        date: "April 18, 2023",
      },
      {
        id: 3,
        userName: "Karen D.",
        rating: 5,
        comment:
          "Exceptional care and support. The staff was available 24/7 and responded quickly to any concerns we had.",
        date: "March 30, 2023",
      },
    ],
  }

  // Handler for opening reviews dialog
  const handleOpenReviews = (providerName: string) => {
    setSelectedProvider(providerName)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Elder Care Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="/home health.png"
            alt="Elder Care Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find compassionate and professional elder care services in your area. Browse providers below or use filters
            to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Verified and background-checked caregivers</li>
              <li>Detailed provider profiles with qualifications</li>
              <li>Read reviews from families like yours</li>
              <li>Find care options that fit your specific needs</li>
            </ul>
          </div>
        </div>
      </div>

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
                  <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider.name)}>
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
        providerName={selectedProvider}
        reviews={selectedProvider ? mockReviews[selectedProvider as keyof typeof mockReviews] || [] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}
