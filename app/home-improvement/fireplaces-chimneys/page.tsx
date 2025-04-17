"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function FireplacesChimneysPage() {
  const filterOptions = [
    { id: "fireplace1", label: "Chimney Sweep", value: "Chimney Sweep" },
    { id: "fireplace2", label: "Chimney and Chimney Cap Repair", value: "Chimney and Chimney Cap Repair" },
    { id: "fireplace3", label: "Gas Fireplace Repair", value: "Gas Fireplace Repair" },
    { id: "fireplace4", label: "Fireplace Services", value: "Fireplace Services" },
    { id: "fireplace5", label: "Firewood Suppliers", value: "Firewood Suppliers" },
    { id: "fireplace6", label: "Heating Oil Suppliers", value: "Heating Oil Suppliers" },
    { id: "fireplace7", label: "Other Fireplaces and Chimneys", value: "Other Fireplaces and Chimneys" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    "Chimney Masters": [
      {
        id: 1,
        username: "WarmAndCozy",
        rating: 5,
        date: "2023-10-20",
        comment:
          "Chimney Masters did an excellent job cleaning our chimney. They were prompt, professional, and left no mess behind. They also identified a small crack in our chimney cap and repaired it on the spot.",
      },
      {
        id: 2,
        username: "SafetyFirst",
        rating: 4,
        date: "2023-09-15",
        comment:
          "Good service overall. They were thorough with the cleaning and inspection. The only reason for 4 stars is they were about 30 minutes late for the appointment.",
      },
      {
        id: 3,
        username: "OldHomeowner",
        rating: 5,
        date: "2023-08-10",
        comment:
          "Our 100-year-old home needed significant chimney repair. Chimney Masters provided a detailed assessment and completed the work with great attention to historical accuracy. Very impressed!",
      },
    ],
    "Fireplace Experts": [
      {
        id: 1,
        username: "ModernLiving",
        rating: 5,
        date: "2023-10-12",
        comment:
          "We had issues with our gas fireplace not igniting properly. Fireplace Experts diagnosed and fixed the problem quickly. They were knowledgeable and explained everything clearly.",
      },
      {
        id: 2,
        username: "NewHomeowner",
        rating: 5,
        date: "2023-09-28",
        comment:
          "Hired them to service our fireplace before winter. They did a complete inspection, cleaning, and tune-up. Very professional and reasonably priced.",
      },
      {
        id: 3,
        username: "CozyNights",
        rating: 4,
        date: "2023-08-05",
        comment:
          "They installed a new gas insert in our old wood-burning fireplace. The work was excellent, though it took a bit longer than initially estimated. The end result is beautiful and works perfectly.",
      },
    ],
    "Quality Firewood": [
      {
        id: 1,
        username: "WinterPrepper",
        rating: 5,
        date: "2023-10-25",
        comment:
          "Quality Firewood delivers exactly what their name promises. The wood is well-seasoned, clean, and burns beautifully. Delivery was on time and the driver stacked it neatly as requested.",
      },
      {
        id: 2,
        username: "WeekendFirepit",
        rating: 4,
        date: "2023-09-18",
        comment:
          "Good selection of hardwoods for our outdoor fire pit. Prices are reasonable and delivery is convenient. Would recommend for anyone who enjoys a good fire.",
      },
      {
        id: 3,
        username: "CabinOwner",
        rating: 5,
        date: "2023-08-22",
        comment:
          "We order in bulk for our vacation cabin. Quality Firewood has been our go-to supplier for three years now. Their wood is consistently dry and ready to burn, and they're always reliable with scheduling.",
      },
    ],
  }

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Chimney Masters",
      services: ["Chimney Sweep", "Chimney and Chimney Cap Repair"],
      rating: 4.8,
      reviews: 92,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Fireplace Experts",
      services: ["Gas Fireplace Repair", "Fireplace Services"],
      rating: 4.9,
      reviews: 78,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Quality Firewood",
      services: ["Firewood Suppliers"],
      rating: 4.7,
      reviews: 45,
      location: "Akron, OH",
    },
  ])

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Fireplaces and Chimneys" backLink="/home-improvement" backText="Home Improvement">
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
