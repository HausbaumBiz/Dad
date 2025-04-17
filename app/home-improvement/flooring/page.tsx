"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function FlooringPage() {
  const filterOptions = [
    { id: "floor1", label: "Carpet Installation", value: "Carpet Installation" },
    { id: "floor2", label: "Hardwood Floor Installation", value: "Hardwood Floor Installation" },
    { id: "floor3", label: "Epoxy Flooring", value: "Epoxy Flooring" },
    { id: "floor4", label: "Tile Flooring", value: "Tile Flooring" },
    { id: "floor5", label: "Laminate Flooring", value: "Laminate Flooring" },
    { id: "floor6", label: "Carpet Cleaning", value: "Carpet Cleaning" },
    { id: "floor7", label: "Floor Buffing and Cleaning", value: "Floor Buffing and Cleaning" },
    { id: "floor8", label: "Oriental Rug Cleaning", value: "Oriental Rug Cleaning" },
    {
      id: "floor9",
      label: "Other Floor/Carpet Care and Installation",
      value: "Other Floor/Carpet Care and Installation",
    },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Carpet Kings",
      services: ["Carpet Installation", "Carpet Cleaning"],
      rating: 4.8,
      reviews: 124,
      location: "Canton, OH",
    },
    {
      id: 2,
      name: "Hardwood Specialists",
      services: ["Hardwood Floor Installation", "Floor Buffing and Cleaning"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 3,
      name: "Tile Masters",
      services: ["Tile Flooring", "Epoxy Flooring"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
    },
    {
      id: 4,
      name: "Floor Care Experts",
      services: ["Laminate Flooring", "Oriental Rug Cleaning"],
      rating: 4.6,
      reviews: 92,
      location: "Massillon, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    "Carpet Kings": [
      {
        id: 1,
        username: "SoftSteps",
        rating: 5,
        date: "2023-10-15",
        comment:
          "Had carpet installed in our entire upstairs. The quality is excellent and the installation team was professional and efficient. Our home feels so much cozier now!",
      },
      {
        id: 2,
        username: "CleanHome",
        rating: 5,
        date: "2023-09-22",
        comment:
          "Used their carpet cleaning service and was amazed at the results. Stains I thought were permanent came right out. The carpet looks almost new again!",
      },
      {
        id: 3,
        username: "PetOwner",
        rating: 4,
        date: "2023-08-05",
        comment:
          "Good job cleaning our carpets that had pet stains. Most stains came out completely. The technician was friendly and gave us tips for maintaining our carpet.",
      },
    ],
    "Hardwood Specialists": [
      {
        id: 1,
        username: "ClassicHome",
        rating: 5,
        date: "2023-11-02",
        comment:
          "Installed beautiful oak hardwood floors throughout our first floor. The craftsmanship is outstanding and they finished ahead of schedule. Worth every penny!",
      },
      {
        id: 2,
        username: "ShinyFloors",
        rating: 5,
        date: "2023-10-18",
        comment:
          "Had our 15-year-old hardwood floors buffed and refinished. They look brand new! The team was careful with our furniture and cleaned up perfectly.",
      },
      {
        id: 3,
        username: "OldHouseRenovator",
        rating: 5,
        date: "2023-09-30",
        comment:
          "Restored the original hardwood floors in our 1920s home. They were able to match the existing wood perfectly where repairs were needed. Exceptional work!",
      },
    ],
    "Tile Masters": [
      {
        id: 1,
        username: "KitchenReno",
        rating: 5,
        date: "2023-07-15",
        comment:
          "Installed porcelain tile in our kitchen and entryway. The pattern layout is perfect and the grout lines are flawless. Very happy with the results!",
      },
      {
        id: 2,
        username: "GarageUpgrade",
        rating: 5,
        date: "2023-06-22",
        comment:
          "Had epoxy flooring installed in our garage. The finish is beautiful and durable. The team was professional and completed the job in just two days.",
      },
      {
        id: 3,
        username: "BathroomMakeover",
        rating: 4,
        date: "2023-11-05",
        comment:
          "Good job on our bathroom tile installation. The work is quality, but there were some delays in scheduling that pushed our project back a week.",
      },
    ],
    "Floor Care Experts": [
      {
        id: 1,
        username: "BudgetReno",
        rating: 5,
        date: "2023-10-28",
        comment:
          "Installed laminate flooring throughout our basement. It looks amazing and was much more affordable than hardwood. The installation was quick and professional.",
      },
      {
        id: 2,
        username: "HeirloomRug",
        rating: 5,
        date: "2023-09-15",
        comment:
          "Had our family's antique Persian rug cleaned. They were extremely careful and knowledgeable about proper cleaning techniques. The rug looks vibrant again!",
      },
      {
        id: 3,
        username: "RentalProperty",
        rating: 4,
        date: "2023-08-20",
        comment:
          "Used their laminate flooring for my rental property. Good quality for the price and should hold up well to tenant use. Installation was completed on schedule.",
      },
    ],
  }

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Floor/Carpet Care and Installation" backLink="/home-improvement" backText="Home Improvement">
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
        reviews={selectedProvider ? mockReviews[selectedProvider] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}
