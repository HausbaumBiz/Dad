"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function PoolServicesPage() {
  const filterOptions = [
    { id: "pool1", label: "Swimming Pool Installers/Builders", value: "Swimming Pool Installers/Builders" },
    { id: "pool2", label: "Swimming Pool Maintenance/Cleaning", value: "Swimming Pool Maintenance/Cleaning" },
    { id: "pool3", label: "Other Pool Services", value: "Other Pool Services" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Blue Waters Pool Construction",
      services: ["Swimming Pool Installers/Builders"],
      rating: 4.9,
      reviews: 45,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Crystal Clear Pool Services",
      services: ["Swimming Pool Maintenance/Cleaning"],
      rating: 4.7,
      reviews: 83,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Complete Pool Solutions",
      services: ["Swimming Pool Installers/Builders", "Swimming Pool Maintenance/Cleaning", "Other Pool Services"],
      rating: 4.8,
      reviews: 62,
      location: "Akron, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    "Blue Waters Pool Construction": [
      {
        id: 1,
        username: "PoolOwner2023",
        rating: 5,
        date: "2023-07-15",
        comment:
          "Blue Waters built our dream pool! The design process was collaborative, and they finished on time and on budget. Our backyard is now the envy of the neighborhood.",
      },
      {
        id: 2,
        username: "SummerFun",
        rating: 5,
        date: "2023-06-22",
        comment:
          "Exceptional craftsmanship! They handled all permits and inspections, making the process stress-free. The finished pool exceeded our expectations.",
      },
      {
        id: 3,
        username: "HomeImprover",
        rating: 4,
        date: "2023-05-10",
        comment:
          "Great work overall. There were some minor delays due to weather, but they communicated well throughout the process. The pool is beautiful and well-constructed.",
      },
    ],
    "Crystal Clear Pool Services": [
      {
        id: 1,
        username: "BusyHomeowner",
        rating: 5,
        date: "2023-08-05",
        comment:
          "Crystal Clear has been maintaining our pool for two years now. They're reliable, thorough, and our pool always looks pristine. Worth every penny!",
      },
      {
        id: 2,
        username: "SwimFanatic",
        rating: 4,
        date: "2023-07-18",
        comment:
          "Good service overall. They're prompt and professional. Occasionally miss some debris in corners, but quick to fix when pointed out.",
      },
      {
        id: 3,
        username: "SummerHost",
        rating: 5,
        date: "2023-06-30",
        comment:
          "We host a lot of summer parties, and Crystal Clear keeps our pool in perfect condition. Their chemical balancing is spot-on, and the water is always crystal clear.",
      },
    ],
    "Complete Pool Solutions": [
      {
        id: 1,
        username: "NewPoolOwner",
        rating: 5,
        date: "2023-08-12",
        comment:
          "From design to maintenance, Complete Pool Solutions has been fantastic. They built our pool last year and now handle all maintenance. Couldn't be happier!",
      },
      {
        id: 2,
        username: "BackyardOasis",
        rating: 4,
        date: "2023-07-25",
        comment:
          "They installed our pool and now do regular maintenance. The installation was flawless, and their maintenance service is reliable and thorough.",
      },
      {
        id: 3,
        username: "YearRoundSwimmer",
        rating: 5,
        date: "2023-06-15",
        comment:
          "We had them install a heated pool with a cover system. Everything works perfectly, and their maintenance team keeps it in top condition year-round.",
      },
    ],
  }

  // Function to handle opening the reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Pool Services" backLink="/home-improvement" backText="Home Improvement">
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
