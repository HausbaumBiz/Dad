"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function HazardMitigationPage() {
  const filterOptions = [
    { id: "hazard1", label: "Lead-Based Paint Abatement", value: "Lead-Based Paint Abatement" },
    { id: "hazard2", label: "Radon Mitigation", value: "Radon Mitigation" },
    { id: "hazard3", label: "Mold Removal", value: "Mold Removal" },
    { id: "hazard4", label: "Asbestos Removal", value: "Asbestos Removal" },
    {
      id: "hazard5",
      label: "Smoke/Carbon Monoxide Detector Installation",
      value: "Smoke/Carbon Monoxide Detector Installation",
    },
    { id: "hazard6", label: "Fire Extinguisher Maintenance", value: "Fire Extinguisher Maintenance" },
    { id: "hazard7", label: "Other Home Hazard Mitigation", value: "Other Home Hazard Mitigation" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    "Safe Home Solutions": [
      {
        id: 1,
        username: "HealthConscious",
        rating: 5,
        date: "2023-11-12",
        comment:
          "Excellent mold removal service! They found hidden mold behind our walls that was causing health issues. Very thorough and professional.",
      },
      {
        id: 2,
        username: "OldHomeOwner",
        rating: 4,
        date: "2023-10-05",
        comment:
          "Great job with asbestos removal in our older home. They took all safety precautions and left the area clean. Would recommend.",
      },
      {
        id: 3,
        username: "AllergySufferer",
        rating: 5,
        date: "2023-09-18",
        comment:
          "The mold removal made a huge difference in my allergies! They were thorough, explained everything, and gave tips to prevent future issues.",
      },
    ],
    "Radon Experts": [
      {
        id: 1,
        username: "BasementDweller",
        rating: 5,
        date: "2023-11-20",
        comment:
          "Excellent radon mitigation system installation. Our levels went from dangerous to well below the EPA action level. Worth every penny!",
      },
      {
        id: 2,
        username: "SafetyFirst2023",
        rating: 4,
        date: "2023-10-15",
        comment:
          "Professional radon testing and mitigation. They explained everything clearly and installed an effective system with minimal disruption.",
      },
      {
        id: 3,
        username: "NewHomebuyer",
        rating: 5,
        date: "2023-09-30",
        comment:
          "Found high radon levels during our home purchase. They installed a mitigation system quickly and now our levels are safe. Great service!",
      },
    ],
    "Lead Safe Contractors": [
      {
        id: 1,
        username: "HistoricHomeowner",
        rating: 5,
        date: "2023-11-10",
        comment:
          "Excellent lead paint removal in our 1920s home. They followed all safety protocols and were especially careful since we have young children.",
      },
      {
        id: 2,
        username: "RenovationPro",
        rating: 4,
        date: "2023-10-22",
        comment:
          "Professional lead testing and abatement. They were knowledgeable about regulations and completed the work efficiently.",
      },
      {
        id: 3,
        username: "SafetyMinded",
        rating: 5,
        date: "2023-09-15",
        comment:
          "Great lead paint removal service. They contained the area perfectly and our post-testing showed no lead dust. Highly recommend!",
      },
    ],
    "Fire Safety Pros": [
      {
        id: 1,
        username: "FamilyProtector",
        rating: 5,
        date: "2023-11-25",
        comment:
          "Excellent installation of smoke and CO detectors throughout our home. They recommended optimal placement and even programmed them to communicate with each other.",
      },
      {
        id: 2,
        username: "BusinessOwner",
        rating: 4,
        date: "2023-10-18",
        comment:
          "Great fire extinguisher maintenance for our small business. They checked all units, replaced outdated ones, and provided training for our staff.",
      },
      {
        id: 3,
        username: "SafetyConscious",
        rating: 5,
        date: "2023-09-22",
        comment:
          "Installed a comprehensive fire safety system in our home. The technicians were knowledgeable and professional. Feel much safer now!",
      },
    ],
  }

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Safe Home Solutions",
      services: ["Mold Removal", "Asbestos Removal"],
      rating: 4.8,
      reviews: 124,
      location: "Canton, OH",
    },
    {
      id: 2,
      name: "Radon Experts",
      services: ["Radon Mitigation"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 3,
      name: "Lead Safe Contractors",
      services: ["Lead-Based Paint Abatement"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
    },
    {
      id: 4,
      name: "Fire Safety Pros",
      services: ["Smoke/Carbon Monoxide Detector Installation", "Fire Extinguisher Maintenance"],
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
    <CategoryLayout title="Home Hazard Mitigation" backLink="/home-improvement" backText="Home Improvement">
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
