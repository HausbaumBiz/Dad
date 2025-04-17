"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function MoversPage() {
  const filterOptions = [
    { id: "movers1", label: "Moving Truck Rental", value: "Moving Truck Rental" },
    { id: "movers2", label: "Piano Movers", value: "Piano Movers" },
    { id: "movers3", label: "Movers", value: "Movers" },
    { id: "movers4", label: "Other Movers/Moving Trucks", value: "Other Movers/Moving Trucks" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Professional Moving Services",
      services: ["Movers"],
      rating: 4.9,
      reviews: 124,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Piano Moving Specialists",
      services: ["Piano Movers"],
      rating: 4.8,
      reviews: 56,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Truck Rental Depot",
      services: ["Moving Truck Rental"],
      rating: 4.7,
      reviews: 87,
      location: "Akron, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    1: [
      {
        id: 1,
        username: "RelocationSuccess",
        rating: 5,
        date: "2023-11-15",
        comment:
          "Professional Moving Services made our cross-town move so much easier! The team was punctual, careful with our belongings, and incredibly efficient. They even helped reassemble our furniture at the new place. Highly recommend for any move, big or small.",
      },
      {
        id: 2,
        username: "StressFreeMove",
        rating: 5,
        date: "2023-10-22",
        comment:
          "I was dreading moving day until I hired Professional Moving Services. They handled everything with such care and professionalism. Not a single item was damaged, and they worked quickly to stay within the estimated time frame. Worth every penny!",
      },
      {
        id: 3,
        username: "NewHomeowner2023",
        rating: 4,
        date: "2023-09-18",
        comment:
          "Great service overall. The movers were friendly and hardworking. They took special care with our antique furniture. Only reason for 4 stars instead of 5 is they arrived about 30 minutes late, but they did call ahead to let us know.",
      },
    ],
    2: [
      {
        id: 1,
        username: "ClassicalMusician",
        rating: 5,
        date: "2023-11-05",
        comment:
          "Moving a grand piano is no small task, but Piano Moving Specialists made it look easy. Their team used specialized equipment and techniques to safely transport my Steinway from our old home to the new one. They were extremely knowledgeable and careful.",
      },
      {
        id: 2,
        username: "MusicTeacher",
        rating: 5,
        date: "2023-10-12",
        comment:
          "I was nervous about moving my upright piano to my new studio, but these specialists were amazing! They wrapped it carefully, used proper equipment, and even helped position it perfectly in the new space. They also tuned it after the move as part of their service.",
      },
      {
        id: 3,
        username: "ConcertHallManager",
        rating: 4,
        date: "2023-09-30",
        comment:
          "We needed to relocate several pianos for our venue renovation, and Piano Moving Specialists handled the job professionally. They understand the delicacy and value of these instruments. The only hiccup was scheduling, which took longer than expected.",
      },
    ],
    3: [
      {
        id: 1,
        username: "DIYMover",
        rating: 5,
        date: "2023-11-20",
        comment:
          "Truck Rental Depot made my self-move so much easier. Their trucks are well-maintained and clean. The pickup process was quick, and they provided moving blankets and a dolly at no extra charge. Return was just as simple. Great value compared to the big national chains.",
      },
      {
        id: 2,
        username: "SmallBusinessOwner",
        rating: 4,
        date: "2023-10-08",
        comment:
          "Rented a 16-foot truck to move my shop inventory. The truck was in good condition and drove well. Staff was helpful in explaining features and providing tips for loading. Only giving 4 stars because the fuel gauge was a bit inaccurate, which caused some stress.",
      },
      {
        id: 3,
        username: "CollegeGrad2023",
        rating: 5,
        date: "2023-08-15",
        comment:
          "As a recent graduate moving to my first apartment, I appreciated how Truck Rental Depot made the process easy and affordable. They even helped me figure out what size truck I needed based on my furniture. The truck was easy to drive, even for someone with no experience driving larger vehicles.",
      },
    ],
  }

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Movers/Moving Trucks" backLink="/home-improvement" backText="Home Improvement">
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
