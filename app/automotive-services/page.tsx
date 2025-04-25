"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function AutomotiveServicesPage() {
  const filterOptions = [
    { id: "auto1", label: "General Auto Repair", value: "General Auto Repair" },
    { id: "auto2", label: "Engine and Transmission", value: "Engine and Transmission" },
    { id: "auto3", label: "Body Shop", value: "Body Shop" },
    { id: "auto4", label: "Tire and Brakes", value: "Tire and Brakes" },
    { id: "auto5", label: "Mufflers", value: "Mufflers" },
    { id: "auto6", label: "Oil Change", value: "Oil Change" },
    { id: "auto7", label: "Windshield Repair", value: "Windshield Repair" },
    { id: "auto8", label: "Custom Paint", value: "Custom Paint" },
    { id: "auto9", label: "Detailing Services", value: "Detailing Services" },
    { id: "auto10", label: "Car Wash", value: "Car Wash" },
    { id: "auto11", label: "Auto Parts", value: "Auto Parts" },
    { id: "auto12", label: "ATV/Motorcycle Repair", value: "ATV/Motorcycle Repair" },
    { id: "auto13", label: "Utility Vehicle Repair", value: "Utility Vehicle Repair" },
    { id: "auto14", label: "RV Maintenance and Repair", value: "RV Maintenance and Repair" },
    { id: "auto15", label: "Other Automotive Services", value: "Other Automotive Services" },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Quick Fix Auto Repair",
      services: ["General Auto Repair", "Tire and Brakes", "Oil Change"],
      rating: 4.8,
      reviews: 156,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Premium Auto Body",
      services: ["Body Shop", "Custom Paint", "Windshield Repair"],
      rating: 4.7,
      reviews: 98,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Engine Masters",
      services: ["Engine and Transmission", "General Auto Repair"],
      rating: 4.9,
      reviews: 112,
      location: "Akron, OH",
    },
  ])

  const [selectedProvider, setSelectedProvider] = useState<number | null>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = [
    {
      id: 1,
      userName: "MikeT",
      rating: 5,
      comment: "Quick Fix Auto Repair did an excellent job with my oil change. Fast service and fair pricing.",
      date: "2023-12-10",
    },
    {
      id: 2,
      userName: "SarahL",
      rating: 4,
      comment:
        "Good service overall. They were a bit busy so I had to wait longer than expected, but the work was done well.",
      date: "2023-11-22",
    },
    {
      id: 3,
      userName: "DavidW",
      rating: 5,
      comment: "These guys are the best! They diagnosed and fixed an issue that two other shops couldn't figure out.",
      date: "2023-10-15",
    },
  ]

  // Add a function to handle opening the reviews dialog
  const handleReviewsClick = (providerId: number) => {
    setSelectedProvider(providerId)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Automotive Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/auto-mQWtZXyRogQgO5qlNVcR1OYcyDqe59.png"
            alt="Automotive Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified automotive professionals for all your vehicle needs. Browse services below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Verified local mechanics and auto professionals</li>
              <li>Compare quotes from multiple service providers</li>
              <li>Read customer reviews before hiring</li>
              <li>Book appointments online</li>
            </ul>
          </div>
        </div>
      </div>

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
                  <Button className="w-full md:w-auto" onClick={() => handleReviewsClick(provider.id)}>
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

      {selectedProvider !== null && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={providers.find((p) => p.id === selectedProvider)?.name || ""}
          reviews={mockReviews}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
