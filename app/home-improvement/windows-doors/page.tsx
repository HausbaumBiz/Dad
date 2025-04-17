"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function WindowsDoorsPage() {
  const filterOptions = [
    { id: "windows1", label: "Window Replacement", value: "Window Replacement" },
    { id: "windows2", label: "Door Installation", value: "Door Installation" },
    { id: "windows3", label: "Window Security Film", value: "Window Security Film" },
    { id: "windows4", label: "Window Tinting", value: "Window Tinting" },
    { id: "windows5", label: "Window Dressing/Curtains", value: "Window Dressing/Curtains" },
    { id: "windows6", label: "Blind/Drapery Cleaning", value: "Blind/Drapery Cleaning" },
    { id: "windows7", label: "Locksmith", value: "Locksmith" },
    { id: "windows8", label: "Other Windows and Doors", value: "Other Windows and Doors" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Clear View Window Solutions",
      services: ["Window Replacement", "Window Tinting"],
      rating: 4.9,
      reviews: 112,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Secure Door Installations",
      services: ["Door Installation", "Locksmith"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Elegant Window Treatments",
      services: ["Window Dressing/Curtains", "Blind/Drapery Cleaning"],
      rating: 4.7,
      reviews: 64,
      location: "Akron, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    "Clear View Window Solutions": [
      {
        id: 1,
        username: "EnergyEfficient",
        rating: 5,
        date: "2023-09-15",
        comment:
          "Replaced all the windows in our 1970s home. The difference in temperature control and noise reduction is amazing! The installation team was professional and clean.",
      },
      {
        id: 2,
        username: "SunProtection",
        rating: 5,
        date: "2023-08-22",
        comment:
          "Had window tinting installed on our south-facing windows. The heat reduction is significant and it's helped protect our furniture from fading. Great service!",
      },
      {
        id: 3,
        username: "NewHomeowner",
        rating: 4,
        date: "2023-10-05",
        comment:
          "Good quality windows and installation. Only giving 4 stars because scheduling took longer than expected, but the end result was worth the wait.",
      },
    ],
    "Secure Door Installations": [
      {
        id: 1,
        username: "SafetyFirst",
        rating: 5,
        date: "2023-11-02",
        comment:
          "Installed a new front door with enhanced security features. The craftsmanship is excellent and the door looks beautiful while providing peace of mind.",
      },
      {
        id: 2,
        username: "LockUpgrade",
        rating: 5,
        date: "2023-10-18",
        comment:
          "Called them when I was locked out of my house. They arrived quickly and got me in without damaging the lock. Then upgraded all my locks to smart locks. Great service!",
      },
      {
        id: 3,
        username: "GarageDoorFix",
        rating: 4,
        date: "2023-09-30",
        comment:
          "Installed a new garage entry door. Good quality work and reasonable pricing. Would use again for future door needs.",
      },
    ],
    "Elegant Window Treatments": [
      {
        id: 1,
        username: "StyleUpgrade",
        rating: 5,
        date: "2023-10-28",
        comment:
          "Beautiful custom drapes for our living room. They helped with fabric selection and the installation was perfect. Transformed the entire room!",
      },
      {
        id: 2,
        username: "CleanAndBright",
        rating: 5,
        date: "2023-09-15",
        comment:
          "Had years of dust cleaned from our vertical blinds. They look like new again! The team was careful with our furnishings and left everything spotless.",
      },
      {
        id: 3,
        username: "PrivacyPlus",
        rating: 4,
        date: "2023-08-20",
        comment:
          "Installed new blinds throughout our home. Good quality products and the installation was quick. Would recommend for anyone looking for window treatments.",
      },
    ],
  }

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Windows and Doors" backLink="/home-improvement" backText="Home Improvement">
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
