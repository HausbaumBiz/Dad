"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function TrashCleanupPage() {
  const filterOptions = [
    { id: "trash1", label: "Biohazard Cleanup", value: "Biohazard Cleanup" },
    { id: "trash2", label: "Dumpster Rental", value: "Dumpster Rental" },
    {
      id: "trash3",
      label: "Hauling/Old Furniture and Appliance Removal",
      value: "Hauling/Old Furniture and Appliance Removal",
    },
    { id: "trash4", label: "Document Shredding", value: "Document Shredding" },
    { id: "trash5", label: "Trash/Junk Removal", value: "Trash/Junk Removal" },
    { id: "trash6", label: "Other Trash Cleanup and Removal", value: "Other Trash Cleanup and Removal" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    "Junk Busters": [
      {
        id: 1,
        username: "CleanSlate2023",
        rating: 5,
        date: "2023-10-15",
        comment:
          "Junk Busters cleared out my garage in record time. They were professional, efficient, and reasonably priced. Highly recommend for any junk removal needs!",
      },
      {
        id: 2,
        username: "MovingOnUp",
        rating: 4,
        date: "2023-09-22",
        comment:
          "They helped me remove old furniture before my move. Good service, though they were a bit late to arrive. Otherwise, very satisfied with their work.",
      },
      {
        id: 3,
        username: "HomeRenovator",
        rating: 5,
        date: "2023-08-05",
        comment:
          "After my kitchen renovation, I had a lot of debris to remove. Junk Busters made it painless and were very careful not to damage my new floors.",
      },
    ],
    "Clean Sweep Dumpsters": [
      {
        id: 1,
        username: "ContractorPro",
        rating: 5,
        date: "2023-10-10",
        comment:
          "I use Clean Sweep for all my construction projects. Their dumpsters are always delivered on time and pickup is prompt. Great customer service too!",
      },
      {
        id: 2,
        username: "DIYHomeowner",
        rating: 4,
        date: "2023-09-18",
        comment:
          "Rented a dumpster for my bathroom remodel. Good price and easy scheduling. Would use again for future projects.",
      },
      {
        id: 3,
        username: "SpringCleaner",
        rating: 5,
        date: "2023-07-30",
        comment:
          "Perfect solution for our annual neighborhood cleanup. The dumpster was spacious and the team was flexible with our schedule.",
      },
    ],
    "Biohazard Specialists": [
      {
        id: 1,
        username: "PropertyManager",
        rating: 5,
        date: "2023-10-05",
        comment:
          "Had to deal with a difficult situation in one of our rental properties. The team was discreet, thorough, and handled everything with professionalism.",
      },
      {
        id: 2,
        username: "SafetyFirst",
        rating: 5,
        date: "2023-09-12",
        comment:
          "When we discovered mold in our basement, these specialists came quickly and remediated the problem completely. Worth every penny for the peace of mind.",
      },
      {
        id: 3,
        username: "HealthConscious",
        rating: 4,
        date: "2023-08-20",
        comment:
          "Very knowledgeable team that explained the entire cleanup process. They took all necessary precautions and left the area spotless.",
      },
    ],
    "Secure Shred": [
      {
        id: 1,
        username: "BusinessOwner2023",
        rating: 5,
        date: "2023-10-12",
        comment:
          "We use Secure Shred for all our confidential document disposal. Their on-site shredding service gives us confidence that our client information is protected.",
      },
      {
        id: 2,
        username: "PaperlessOffice",
        rating: 4,
        date: "2023-09-05",
        comment:
          "Helped us clear years of old files during our digital transition. Efficient service and reasonable rates.",
      },
      {
        id: 3,
        username: "PrivacyProtector",
        rating: 5,
        date: "2023-08-15",
        comment:
          "After identity theft concerns, I needed to safely dispose of personal documents. Secure Shred provided a convenient drop-off service that was quick and secure.",
      },
    ],
  }

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Junk Busters",
      services: ["Trash/Junk Removal", "Hauling/Old Furniture and Appliance Removal"],
      rating: 4.8,
      reviews: 124,
      location: "Canton, OH",
    },
    {
      id: 2,
      name: "Clean Sweep Dumpsters",
      services: ["Dumpster Rental"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 3,
      name: "Biohazard Specialists",
      services: ["Biohazard Cleanup"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
    },
    {
      id: 4,
      name: "Secure Shred",
      services: ["Document Shredding"],
      rating: 4.6,
      reviews: 92,
      location: "Massillon, OH",
    },
  ])

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Trash Cleanup and Removal" backLink="/home-improvement" backText="Home Improvement">
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
