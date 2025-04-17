"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function AsphaltConcretePage() {
  const filterOptions = [
    { id: "asphalt1", label: "Concrete Driveways", value: "Concrete Driveways" },
    { id: "asphalt2", label: "Asphalt Driveways", value: "Asphalt Driveways" },
    { id: "asphalt3", label: "Other Driveways", value: "Other Driveways" },
    { id: "asphalt4", label: "Stone & Gravel", value: "Stone & Gravel" },
    { id: "asphalt5", label: "Stamped Concrete", value: "Stamped Concrete" },
    { id: "asphalt6", label: "Concrete Repair", value: "Concrete Repair" },
    {
      id: "asphalt7",
      label: "Other Asphalt, Concrete, Stone and Gravel",
      value: "Other Asphalt, Concrete, Stone and Gravel",
    },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Quality Concrete Solutions",
      services: ["Concrete Driveways", "Stamped Concrete", "Concrete Repair"],
      rating: 4.9,
      reviews: 132,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Asphalt Paving Experts",
      services: ["Asphalt Driveways"],
      rating: 4.8,
      reviews: 98,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Stone & Gravel Supply",
      services: ["Stone & Gravel", "Other Driveways"],
      rating: 4.7,
      reviews: 76,
      location: "Akron, OH",
    },
    {
      id: 4,
      name: "Complete Driveway Services",
      services: ["Concrete Driveways", "Asphalt Driveways", "Stone & Gravel"],
      rating: 4.9,
      reviews: 105,
      location: "North Canton, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    "Quality Concrete Solutions": [
      {
        id: 1,
        username: "HomeImprover2023",
        rating: 5,
        date: "2023-08-10",
        comment:
          "Quality Concrete Solutions transformed our old, cracked driveway into a beautiful stamped concrete masterpiece. The attention to detail was impressive!",
      },
      {
        id: 2,
        username: "ProudHomeowner",
        rating: 5,
        date: "2023-07-22",
        comment:
          "They repaired our concrete patio that had significant cracks and settling issues. The repair is seamless - you can't even tell where the damage was.",
      },
      {
        id: 3,
        username: "DIYGiveup",
        rating: 4,
        date: "2023-06-15",
        comment:
          "After trying to fix my driveway myself, I called the professionals. They were patient, explained the process, and delivered excellent results.",
      },
    ],
    "Asphalt Paving Experts": [
      {
        id: 1,
        username: "SmoothRide",
        rating: 5,
        date: "2023-08-05",
        comment:
          "Our new asphalt driveway is perfect! The crew was professional, the work was completed in two days as promised, and the finish is smooth and even.",
      },
      {
        id: 2,
        username: "BudgetConscious",
        rating: 4,
        date: "2023-07-18",
        comment:
          "Good value for the price. They were upfront about costs and delivered what they promised. The driveway looks great and drains properly now.",
      },
      {
        id: 3,
        username: "LongDriveway",
        rating: 5,
        date: "2023-06-30",
        comment:
          "We have a 300-foot driveway that needed complete replacement. They handled the job efficiently and the result is fantastic. No more muddy ruts!",
      },
    ],
    "Stone & Gravel Supply": [
      {
        id: 1,
        username: "RuralProperty",
        rating: 5,
        date: "2023-08-12",
        comment:
          "Great selection of gravel for our country driveway. They helped us choose the right type for our needs and delivered promptly.",
      },
      {
        id: 2,
        username: "LandscapeDesigner",
        rating: 4,
        date: "2023-07-25",
        comment:
          "I use them for all my landscaping projects. Their stone selection is excellent, and they're always reliable with deliveries.",
      },
      {
        id: 3,
        username: "DIYEnthusiast",
        rating: 5,
        date: "2023-06-15",
        comment:
          "They provided exactly what I needed for my garden pathways project. The staff was knowledgeable and helped me calculate the right amount.",
      },
    ],
    "Complete Driveway Services": [
      {
        id: 1,
        username: "NewConstruction",
        rating: 5,
        date: "2023-08-20",
        comment:
          "They installed both our concrete front driveway and asphalt back driveway. Both look fantastic and were completed on schedule.",
      },
      {
        id: 2,
        username: "PropertyManager",
        rating: 5,
        date: "2023-07-15",
        comment:
          "We use Complete Driveway Services for all our rental properties. Their work is consistently excellent and reasonably priced.",
      },
      {
        id: 3,
        username: "CornerLot",
        rating: 4,
        date: "2023-06-10",
        comment:
          "Our corner lot presented some drainage challenges, but they designed a solution that works perfectly. Very satisfied with the results.",
      },
    ],
  }

  // Function to handle opening the reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout
      title="Asphalt, Concrete, Stone and Gravel"
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
