"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function InsideMaintenancePage() {
  const filterOptions = [
    { id: "inside1", label: "Electricians", value: "Electricians" },
    { id: "inside2", label: "Plumbers", value: "Plumbers" },
    {
      id: "inside3",
      label: "Heating, Ventilation, and Air Conditioning Services",
      value: "Heating, Ventilation, and Air Conditioning Services",
    },
    {
      id: "inside4",
      label: "Appliance Repair and Installation",
      value: "Appliance Repair and Installation",
    },
    { id: "inside5", label: "Indoor Painting", value: "Indoor Painting" },
    { id: "inside6", label: "Drywalling and Repair", value: "Drywalling and Repair" },
    { id: "inside7", label: "Marble & Granite", value: "Marble & Granite" },
    { id: "inside8", label: "Water Softeners", value: "Water Softeners" },
    { id: "inside9", label: "Water Heaters", value: "Water Heaters" },
    { id: "inside10", label: "Insulation", value: "Insulation" },
    { id: "inside11", label: "Air Duct Cleaning", value: "Air Duct Cleaning" },
    { id: "inside12", label: "Dryer Duct Cleaning", value: "Dryer Duct Cleaning" },
    { id: "inside13", label: "Central Vacuum Cleaning", value: "Central Vacuum Cleaning" },
    { id: "inside14", label: "Mold Removal", value: "Mold Removal" },
    { id: "inside15", label: "Plaster Work", value: "Plaster Work" },
    { id: "inside16", label: "Water Damage Repair", value: "Water Damage Repair" },
    { id: "inside17", label: "Basement Waterproofing", value: "Basement Waterproofing" },
    {
      id: "inside18",
      label: "Wallpaper Hanging and Removing",
      value: "Wallpaper Hanging and Removing",
    },
    { id: "inside19", label: "Countertop Installation", value: "Countertop Installation" },
    { id: "inside20", label: "Ceiling Fan Installation", value: "Ceiling Fan Installation" },
    { id: "inside21", label: "Bathtub Refinishing", value: "Bathtub Refinishing" },
    { id: "inside22", label: "Cabinet Resurfacing", value: "Cabinet Resurfacing" },
    { id: "inside23", label: "Cabinet Makers", value: "Cabinet Makers" },
    { id: "inside24", label: "Tile Installation", value: "Tile Installation" },
    {
      id: "inside25",
      label: "Other Inside Home Maintenance and Repair",
      value: "Other Inside Home Maintenance and Repair",
    },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Elite Electrical Services",
      services: ["Electricians", "Ceiling Fan Installation"],
      rating: 4.9,
      reviews: 156,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Premium Plumbing Solutions",
      services: ["Plumbers", "Water Heaters", "Water Damage Repair"],
      rating: 4.8,
      reviews: 124,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Comfort HVAC Specialists",
      services: ["Heating, Ventilation, and Air Conditioning Services", "Air Duct Cleaning"],
      rating: 4.7,
      reviews: 98,
      location: "Akron, OH",
    },
    {
      id: 4,
      name: "Interior Design & Renovation",
      services: ["Indoor Painting", "Wallpaper Hanging and Removing", "Cabinet Makers"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
  ])

  // Mock reviews data
  const mockReviews = {
    "Elite Electrical Services": [
      {
        id: 1,
        username: "SafetyFirst",
        rating: 5,
        date: "2023-10-15",
        comment:
          "Excellent work rewiring our old house. They were thorough, professional, and made sure everything was up to code. Highly recommend for any electrical work!",
      },
      {
        id: 2,
        username: "HomeRenovator",
        rating: 5,
        date: "2023-09-22",
        comment:
          "Installed ceiling fans throughout our home. Clean installation, no mess left behind, and fans work perfectly. Fair pricing too!",
      },
      {
        id: 3,
        username: "NewHomeowner",
        rating: 4,
        date: "2023-08-05",
        comment:
          "Fixed some electrical issues in our newly purchased home. They were prompt and knowledgeable. Only reason for 4 stars is the price was a bit higher than expected.",
      },
    ],
    "Premium Plumbing Solutions": [
      {
        id: 1,
        username: "NoMoreLeaks",
        rating: 5,
        date: "2023-11-02",
        comment:
          "Fixed a persistent leak that two other plumbers couldn't solve. Professional, clean, and efficient. Worth every penny!",
      },
      {
        id: 2,
        username: "WarmShowers",
        rating: 5,
        date: "2023-10-18",
        comment:
          "Installed a new water heater after our old one failed. They came same day and had hot water restored by evening. Excellent service!",
      },
      {
        id: 3,
        username: "BasementDry",
        rating: 4,
        date: "2023-09-30",
        comment:
          "Did a great job repairing water damage in our basement. They were thorough and explained everything they were doing. Would use again.",
      },
    ],
    "Comfort HVAC Specialists": [
      {
        id: 1,
        username: "CoolSummer",
        rating: 5,
        date: "2023-07-15",
        comment:
          "Installed a new AC system during the hottest week of summer. They worked quickly and efficiently. Our house has never been more comfortable!",
      },
      {
        id: 2,
        username: "CleanAir",
        rating: 5,
        date: "2023-06-22",
        comment:
          "Had my air ducts cleaned and the difference is amazing. Less dust and better airflow throughout the house. The technicians were professional and thorough.",
      },
      {
        id: 3,
        username: "WinterReady",
        rating: 4,
        date: "2023-11-05",
        comment:
          "Serviced our furnace before winter. They were on time and did a complete check of the system. Only 4 stars because they could have explained more about maintenance.",
      },
    ],
    "Interior Design & Renovation": [
      {
        id: 1,
        username: "FreshLook",
        rating: 5,
        date: "2023-10-28",
        comment:
          "Painted our entire first floor and it looks amazing! The crew was professional, protected all our furniture, and cleaned up perfectly when done.",
      },
      {
        id: 2,
        username: "WallpaperLover",
        rating: 5,
        date: "2023-09-15",
        comment:
          "Had vintage wallpaper removed and new modern paper installed in our dining room. The work was impeccable and transformed the space completely!",
      },
      {
        id: 3,
        username: "KitchenUpgrade",
        rating: 5,
        date: "2023-08-20",
        comment:
          "Custom cabinets for our kitchen remodel. The craftsmanship is outstanding and they worked with us on every detail. Worth the investment!",
      },
    ],
  }

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Inside Home Maintenance and Repair" backLink="/home-improvement" backText="Home Improvement">
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
