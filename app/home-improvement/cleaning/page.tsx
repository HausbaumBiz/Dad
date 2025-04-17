"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function CleaningPage() {
  const filterOptions = [
    { id: "cleaning1", label: "House Cleaning", value: "House Cleaning" },
    { id: "cleaning2", label: "Office Cleaning", value: "Office Cleaning" },
    { id: "cleaning3", label: "Window Cleaning", value: "Window Cleaning" },
    { id: "cleaning4", label: "Deep Carpet and Floor Cleaning", value: "Deep Carpet and Floor Cleaning" },
    { id: "cleaning5", label: "Other Home and Office Cleaning", value: "Other Home and Office Cleaning" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    "Spotless Home Cleaners": [
      {
        id: 1,
        username: "BusyParent",
        rating: 5,
        date: "2023-10-18",
        comment:
          "Spotless Home Cleaners has been a lifesaver for our family. They are thorough, reliable, and always leave our home smelling fresh. Their deep carpet cleaning service is exceptional!",
      },
      {
        id: 2,
        username: "WorkFromHome",
        rating: 4,
        date: "2023-09-25",
        comment:
          "I've been using their bi-weekly cleaning service for six months now. They're generally very good, though occasionally miss some spots. Overall, I'm happy with the service.",
      },
      {
        id: 3,
        username: "CleanFreak",
        rating: 5,
        date: "2023-08-12",
        comment:
          "As someone who is particular about cleaning, I was skeptical about hiring a service. Spotless Home Cleaners exceeded my expectations. They pay attention to detail and use eco-friendly products as requested.",
      },
    ],
    "Professional Office Maintenance": [
      {
        id: 1,
        username: "SmallBusinessOwner",
        rating: 5,
        date: "2023-10-14",
        comment:
          "We've contracted Professional Office Maintenance for our medical practice, and they've been excellent. They understand the importance of sanitation in our environment and are always thorough.",
      },
      {
        id: 2,
        username: "OfficeManager",
        rating: 4,
        date: "2023-09-20",
        comment:
          "Reliable service for our corporate office. They work after hours as requested and are responsive to special cleaning requests. Good value for the quality provided.",
      },
      {
        id: 3,
        username: "StartupFounder",
        rating: 5,
        date: "2023-08-05",
        comment:
          "Our startup needed a flexible cleaning service that could adapt to our changing office needs. Professional Office Maintenance has been perfect - accommodating and detail-oriented.",
      },
    ],
    "Crystal Clear Windows": [
      {
        id: 1,
        username: "HistoricHomeowner",
        rating: 5,
        date: "2023-10-10",
        comment:
          "Crystal Clear Windows did an amazing job on our historic home with 30+ windows. They were careful with the old glass and frames, and the results were spectacular. Worth every penny!",
      },
      {
        id: 2,
        username: "SunlightLover",
        rating: 4,
        date: "2023-09-15",
        comment:
          "Good service overall. They cleaned our two-story home's windows inside and out. A few streaks were left on some windows, but they came back to fix it when I pointed it out.",
      },
      {
        id: 3,
        username: "RetailShopOwner",
        rating: 5,
        date: "2023-08-22",
        comment:
          "We use Crystal Clear for our storefront windows monthly. They are always on time, professional, and make our shop look inviting. Our customers often comment on how clean our windows are!",
      },
    ],
  }

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Spotless Home Cleaners",
      services: ["House Cleaning", "Deep Carpet and Floor Cleaning"],
      rating: 4.9,
      reviews: 156,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Professional Office Maintenance",
      services: ["Office Cleaning"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Crystal Clear Windows",
      services: ["Window Cleaning"],
      rating: 4.7,
      reviews: 64,
      location: "Akron, OH",
    },
  ])

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Home and Office Cleaning" backLink="/home-improvement" backText="Home Improvement">
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
        reviews={selectedProvider ? mockReviews[selectedProvider] || [] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}
