"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function OutdoorStructuresPage() {
  const filterOptions = [
    { id: "structure1", label: "Deck/Patio/Porch Construction", value: "Deck/Patio/Porch Construction" },
    { id: "structure2", label: "Patio and Patio Enclosures", value: "Patio and Patio Enclosures" },
    { id: "structure3", label: "Exterior Cooking Areas", value: "Exterior Cooking Areas" },
    { id: "structure4", label: "Awnings/Canopies", value: "Awnings/Canopies" },
    {
      id: "structure5",
      label: "Playground Equipment Installation/Basketball Hoops",
      value: "Playground Equipment Installation/Basketball Hoops",
    },
    { id: "structure6", label: "Fountains and Waterscaping", value: "Fountains and Waterscaping" },
    { id: "structure7", label: "Pond Construction", value: "Pond Construction" },
    { id: "structure8", label: "Solar Panel Installation", value: "Solar Panel Installation" },
    { id: "structure9", label: "Power Generator Installation", value: "Power Generator Installation" },
    { id: "structure10", label: "Driveway Gate Installation", value: "Driveway Gate Installation" },
    { id: "structure11", label: "Earthquake Retrofitting", value: "Earthquake Retrofitting" },
    { id: "structure12", label: "Mailbox Installation/Repair", value: "Mailbox Installation/Repair" },
    { id: "structure13", label: "Fences", value: "Fences" },
    {
      id: "structure14",
      label: "Other Outdoor Structure Assembly/Construction and Fencing",
      value: "Other Outdoor Structure Assembly/Construction and Fencing",
    },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Custom Deck Builders",
      services: ["Deck/Patio/Porch Construction", "Exterior Cooking Areas"],
      rating: 4.8,
      reviews: 124,
      location: "Canton, OH",
    },
    {
      id: 2,
      name: "Secure Fence Solutions",
      services: ["Fences", "Driveway Gate Installation"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 3,
      name: "SunPower Installations",
      services: ["Solar Panel Installation", "Power Generator Installation"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
    },
    {
      id: 4,
      name: "Backyard Oasis Creators",
      services: ["Fountains and Waterscaping", "Pond Construction", "Patio and Patio Enclosures"],
      rating: 4.6,
      reviews: 92,
      location: "Massillon, OH",
    },
  ])

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    "Custom Deck Builders": [
      {
        id: 1,
        username: "OutdoorEntertainer",
        rating: 5,
        date: "2023-08-15",
        comment:
          "Our new deck is absolutely stunning! They incorporated all our ideas and added some great suggestions of their own.",
      },
      {
        id: 2,
        username: "GrillMaster",
        rating: 5,
        date: "2023-07-22",
        comment:
          "The outdoor kitchen they built is perfect for entertaining. High-quality materials and expert installation.",
      },
      {
        id: 3,
        username: "HomeValueBooster",
        rating: 4,
        date: "2023-06-10",
        comment:
          "Great work on our covered porch. It's added significant value to our home and gives us another living space.",
      },
    ],
    "Secure Fence Solutions": [
      {
        id: 1,
        username: "PrivacySeeker",
        rating: 5,
        date: "2023-09-28",
        comment:
          "The privacy fence they installed is exactly what we wanted. No more nosy neighbors looking into our backyard!",
      },
      {
        id: 2,
        username: "SafetyFirst",
        rating: 5,
        date: "2023-08-15",
        comment:
          "Their automatic driveway gate has given us peace of mind. Professional installation and works flawlessly.",
      },
      {
        id: 3,
        username: "DogOwner",
        rating: 4,
        date: "2023-07-05",
        comment:
          "Had them install a fence for our dogs. They were considerate of our pets' needs and created a safe space for them to play.",
      },
    ],
    "SunPower Installations": [
      {
        id: 1,
        username: "GreenEnergy",
        rating: 5,
        date: "2023-10-10",
        comment:
          "Our solar panel installation has already cut our electric bill by 70%. The team was knowledgeable and efficient.",
      },
      {
        id: 2,
        username: "PowerOutageSurvivor",
        rating: 4,
        date: "2023-09-05",
        comment: "The generator they installed kept our home running during a 3-day power outage. Worth every penny!",
      },
      {
        id: 3,
        username: "TechSavvy",
        rating: 5,
        date: "2023-08-22",
        comment:
          "Great job integrating our solar panels with our home automation system. Very forward-thinking company.",
      },
    ],
    "Backyard Oasis Creators": [
      {
        id: 1,
        username: "WaterFeatureFan",
        rating: 5,
        date: "2023-07-18",
        comment:
          "The waterfall and pond they created is breathtaking. The sound of flowing water has made our backyard so peaceful.",
      },
      {
        id: 2,
        username: "OutdoorLiving",
        rating: 4,
        date: "2023-06-30",
        comment: "Love our new enclosed patio! It's like having an extra room that connects us with nature.",
      },
      {
        id: 3,
        username: "KoiCollector",
        rating: 5,
        date: "2023-05-15",
        comment: "They built a perfect koi pond with all the right filtration and features. Our fish are thriving!",
      },
    ],
  }

  // Handler for opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout
      title="Outdoor Structure Assembly/Construction and Fencing"
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
