"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function HandymenPage() {
  const filterOptions = [
    { id: "handymen1", label: "Odd Jobs and Repairs", value: "Odd Jobs and Repairs" },
    { id: "handymen2", label: "Product Assembly", value: "Product Assembly" },
    { id: "handymen3", label: "Other Handymen", value: "Other Handymen" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Reliable Handyman Services",
      services: ["Odd Jobs and Repairs", "Product Assembly"],
      rating: 4.9,
      reviews: 156,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Assembly Pros",
      services: ["Product Assembly"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Fix-It-All Handyman",
      services: ["Odd Jobs and Repairs", "Other Handymen"],
      rating: 4.7,
      reviews: 112,
      location: "Akron, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    1: [
      {
        id: 1,
        username: "HomeownerJane",
        rating: 5,
        date: "2023-11-18",
        comment:
          "Reliable Handyman Services truly lives up to their name! They fixed multiple issues around my house in one visit - from a leaky faucet to hanging shelves and fixing a sticky door. Professional, punctual, and reasonably priced. Will definitely use them again.",
      },
      {
        id: 2,
        username: "DIYDisaster",
        rating: 5,
        date: "2023-10-25",
        comment:
          "After my attempt at assembling furniture went horribly wrong, I called Reliable Handyman Services. They not only fixed my mistakes but completed the assembly of all my new furniture in record time. They saved me hours of frustration!",
      },
      {
        id: 3,
        username: "BusyProfessional",
        rating: 4,
        date: "2023-09-30",
        comment:
          "Great service for all those small repairs I never have time to do myself. They installed new light fixtures, repaired drywall, and fixed a cabinet door that wouldn't close properly. Only giving 4 stars because scheduling took longer than expected, but the work itself was excellent.",
      },
    ],
    2: [
      {
        id: 1,
        username: "FurnitureEnthusiast",
        rating: 5,
        date: "2023-11-10",
        comment:
          "Assembly Pros assembled my entire home office setup - desk, chair, bookshelf, and filing cabinet. Everything was done perfectly and much faster than I could have done it. They even took away all the packaging materials. Worth every penny!",
      },
      {
        id: 2,
        username: "NewHomeowner2023",
        rating: 5,
        date: "2023-10-15",
        comment:
          "Moving into a new home with all new furniture was overwhelming until I hired Assembly Pros. They assembled our bed frame, dining table, chairs, and entertainment center in just a few hours. The quality of their work is outstanding.",
      },
      {
        id: 3,
        username: "RetailManager",
        rating: 4,
        date: "2023-09-22",
        comment:
          "We use Assembly Pros for our store displays and customer furniture assembly services. They're reliable and do quality work. The only reason for 4 stars instead of 5 is occasionally they're booked out several weeks in advance during busy seasons.",
      },
    ],
    3: [
      {
        id: 1,
        username: "OldHomeRestorer",
        rating: 5,
        date: "2023-11-22",
        comment:
          "Fix-It-All Handyman is a gem! They helped with numerous projects in my century-old home, from fixing squeaky floors to repairing original woodwork and updating electrical outlets. Their knowledge of older homes was impressive.",
      },
      {
        id: 2,
        username: "RentalPropertyOwner",
        rating: 5,
        date: "2023-10-18",
        comment:
          "I manage several rental properties and Fix-It-All is my go-to for all maintenance needs. They're responsive, thorough, and can handle just about any repair. Their work is always high quality and they're great at communicating with tenants.",
      },
      {
        id: 3,
        username: "WeekendWarrior",
        rating: 4,
        date: "2023-09-05",
        comment:
          "Called Fix-It-All for help with some projects that were beyond my DIY skills. They installed ceiling fans, repaired a garbage disposal, and fixed some plumbing issues. Good communication and fair pricing. Would use again for sure.",
      },
    ],
  }

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Handymen" backLink="/home-improvement" backText="Home Improvement">
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
        provider={selectedProvider}
        reviews={selectedProvider ? mockReviews[selectedProvider.id] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}
