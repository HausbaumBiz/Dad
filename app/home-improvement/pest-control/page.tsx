"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function PestControlPage() {
  const filterOptions = [
    { id: "pest1", label: "Rodent/Small Animal Infestations", value: "Rodent/Small Animal Infestations" },
    { id: "pest2", label: "Wildlife Removal", value: "Wildlife Removal" },
    { id: "pest3", label: "Insect and Bug Control", value: "Insect and Bug Control" },
    { id: "pest4", label: "Other Pest Control/Wildlife Removal", value: "Other Pest Control/Wildlife Removal" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    "Pest Busters": [
      {
        id: 1,
        username: "BugFreeHome",
        rating: 5,
        date: "2023-11-15",
        comment:
          "Excellent service! Had a terrible ant problem and they completely eliminated it. The technician was knowledgeable and thorough.",
      },
      {
        id: 2,
        username: "MouseHater",
        rating: 4,
        date: "2023-10-08",
        comment:
          "Great job with our mouse problem. They found all entry points and sealed them properly. Haven't seen a single mouse since!",
      },
      {
        id: 3,
        username: "CleanHomeOwner",
        rating: 5,
        date: "2023-09-22",
        comment:
          "Professional and effective service. They eliminated our cockroach problem and provided great tips to prevent future infestations.",
      },
    ],
    "Wildlife Solutions": [
      {
        id: 1,
        username: "SquirrelProblem",
        rating: 5,
        date: "2023-11-20",
        comment:
          "Amazing service! They humanely removed a family of squirrels from our attic and sealed all entry points. No more scratching noises at night!",
      },
      {
        id: 2,
        username: "RaccoonIssues",
        rating: 4,
        date: "2023-10-15",
        comment:
          "Professional wildlife removal. They trapped the raccoons that were destroying our yard and relocated them. Also gave us tips to prevent future issues.",
      },
      {
        id: 3,
        username: "AtticProtector",
        rating: 5,
        date: "2023-09-30",
        comment:
          "Great job removing mice from our home and installing preventative measures. The technician was knowledgeable and respectful of our property.",
      },
    ],
    "Bug Zappers": [
      {
        id: 1,
        username: "WaspFree",
        rating: 5,
        date: "2023-11-10",
        comment:
          "Excellent wasp nest removal! They removed multiple nests around our property safely and applied preventative treatments. Very professional.",
      },
      {
        id: 2,
        username: "TermiteFighter",
        rating: 4,
        date: "2023-10-22",
        comment:
          "Great termite treatment. They were thorough in their inspection and treatment. Follow-up visits were prompt and they answered all our questions.",
      },
      {
        id: 3,
        username: "BedBugSurvivor",
        rating: 5,
        date: "2023-09-15",
        comment:
          "Saved us from a bed bug nightmare! Their heat treatment was effective and they gave us great advice to prevent future infestations.",
      },
    ],
    "Critter Control": [
      {
        id: 1,
        username: "DeerProblem",
        rating: 5,
        date: "2023-11-25",
        comment:
          "Great wildlife management service. They helped us with deer that were destroying our garden with humane deterrents that actually work!",
      },
      {
        id: 2,
        username: "BatInHouse",
        rating: 4,
        date: "2023-10-18",
        comment:
          "Professional bat removal service. They safely removed bats from our attic and sealed entry points. Also did a thorough cleanup afterward.",
      },
      {
        id: 3,
        username: "GroundhogGone",
        rating: 5,
        date: "2023-09-22",
        comment:
          "Excellent groundhog removal. They humanely trapped and relocated the animal that was destroying our yard. Also gave us prevention tips.",
      },
    ],
  }

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Pest Busters",
      services: ["Rodent/Small Animal Infestations", "Insect and Bug Control"],
      rating: 4.8,
      reviews: 124,
      location: "Canton, OH",
    },
    {
      id: 2,
      name: "Wildlife Solutions",
      services: ["Wildlife Removal", "Rodent/Small Animal Infestations"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 3,
      name: "Bug Zappers",
      services: ["Insect and Bug Control"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
    },
    {
      id: 4,
      name: "Critter Control",
      services: ["Wildlife Removal", "Rodent/Small Animal Infestations"],
      rating: 4.6,
      reviews: 92,
      location: "Massillon, OH",
    },
  ])

  // Handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Pest Control/Wildlife Removal" backLink="/home-improvement" backText="Home Improvement">
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
