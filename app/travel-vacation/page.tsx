"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function TravelVacationPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)

  const filterOptions = [
    { id: "travel1", label: "Tour and Travel Guides", value: "Tour and Travel Guides" },
    { id: "travel2", label: "Travel Agents", value: "Travel Agents" },
    { id: "travel3", label: "Car Rental", value: "Car Rental" },
    { id: "travel4", label: "Boat Rental", value: "Boat Rental" },
    { id: "travel5", label: "RV Rental", value: "RV Rental" },
    { id: "travel6", label: "Airport Pick-up and Drop-off Services", value: "Airport Pick-up and Drop-off Services" },
    { id: "travel7", label: "Hotels, Motels, and Resorts", value: "Hotels, Motels, and Resorts" },
    { id: "travel8", label: "Bed and Breakfast", value: "Bed and Breakfast" },
    { id: "travel9", label: "Airbnb", value: "Airbnb" },
    { id: "travel10", label: "Camp Grounds and Cabins", value: "Camp Grounds and Cabins" },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Wanderlust Travel Agency",
      services: ["Travel Agents", "Tour and Travel Guides"],
      rating: 4.9,
      reviews: 124,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Luxury Car & RV Rentals",
      services: ["Car Rental", "RV Rental"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Cozy Pines Cabins",
      services: ["Camp Grounds and Cabins"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
    },
  ])

  const mockReviews = {
    "Wanderlust Travel Agency": [
      {
        id: 1,
        username: "Emily & John Parker",
        rating: 5,
        comment:
          "Wanderlust planned our honeymoon to Italy, and it was absolutely perfect! Every detail was taken care of, from flights to accommodations to local tours. Their knowledge of hidden gems made our trip truly special.",
        date: "2023-04-10",
      },
      {
        id: 2,
        username: "Michael Stevens",
        rating: 5,
        comment:
          "I've used Wanderlust for both business and leisure travel. Their agents are responsive and always find the best deals. When my flight was canceled during a business trip, they rebooked me immediately with minimal disruption.",
        date: "2023-03-22",
      },
      {
        id: 3,
        username: "Sophia Rodriguez",
        rating: 4,
        comment:
          "Good travel agency with knowledgeable staff. They planned a great family vacation to Costa Rica for us. The only reason for 4 stars is that some of the restaurant recommendations weren't as good as expected.",
        date: "2023-02-15",
      },
    ],
    "Luxury Car & RV Rentals": [
      {
        id: 1,
        username: "David Thompson",
        rating: 5,
        comment:
          "Rented a luxury SUV for a weekend trip and was impressed with both the vehicle and the service. The car was immaculate, and the pickup/drop-off process was quick and efficient.",
        date: "2023-04-05",
      },
      {
        id: 2,
        username: "Jennifer Wilson",
        rating: 4,
        comment:
          "We rented an RV for a two-week national parks tour. The RV was well-maintained and fully equipped. The staff provided a thorough orientation before we left. The only issue was a slight delay at pickup.",
        date: "2023-03-18",
      },
      {
        id: 3,
        username: "Robert Chen",
        rating: 5,
        comment:
          "Exceptional service! When our original rental had a mechanical issue, they upgraded us at no extra cost. The vehicles in their fleet are newer models with all the latest features. Will definitely use them again.",
        date: "2023-02-27",
      },
    ],
    "Cozy Pines Cabins": [
      {
        id: 1,
        username: "Sarah & Mark Johnson",
        rating: 5,
        comment:
          "Our stay at Cozy Pines was exactly what we needed - peaceful, scenic, and comfortable. The cabin was clean and well-equipped, with a beautiful view of the lake. The staff was friendly and helpful with local hiking recommendations.",
        date: "2023-04-12",
      },
      {
        id: 2,
        username: "Thomas Brown",
        rating: 4,
        comment:
          "Nice cabins in a beautiful setting. We enjoyed the fire pit and proximity to hiking trails. The cabin was rustic but comfortable. The only improvement would be better WiFi coverage.",
        date: "2023-03-30",
      },
      {
        id: 3,
        username: "Lisa Martinez",
        rating: 5,
        comment:
          "We've stayed at Cozy Pines three times now, and it never disappoints. The cabins are spaced far enough apart to feel private, and the amenities are perfect for a family getaway. The kids love the small beach area and fishing dock.",
        date: "2023-02-15",
      },
    ],
  }

  const handleOpenReviews = (providerName: string) => {
    setSelectedProvider(providerName)
    setIsReviewsOpen(true)
  }

  return (
    <CategoryLayout title="Travel & Vacation Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="/travel agent.png"
            alt="Travel and Vacation"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified travel and vacation professionals in your area. Browse services below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Experienced and knowledgeable travel professionals</li>
              <li>Read reviews from other travelers</li>
              <li>Compare services and rates</li>
              <li>Find the perfect vacation options for your needs</li>
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

      <ReviewsDialog
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        providerName={selectedProvider || ""}
        reviews={selectedProvider ? mockReviews[selectedProvider] || [] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}
