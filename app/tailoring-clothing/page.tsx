"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function TailoringClothingPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)

  const filterOptions = [
    {
      id: "tailors1",
      label: "Tailors, Dressmakers, and Custom Sewers",
      value: "Tailors, Dressmakers, and Custom Sewers",
    },
    { id: "tailors2", label: "Laundry and Dry-Cleaning", value: "Laundry and Dry-Cleaning" },
    { id: "tailors3", label: "Shoe and Leather Repair", value: "Shoe and Leather Repair" },
    { id: "tailors4", label: "Costume Makers", value: "Costume Makers" },
    { id: "tailors5", label: "Upholsterers", value: "Upholsterers" },
    {
      id: "tailors6",
      label: "Curtains, Drapes and Window Coverings Makers",
      value: "Curtains, Drapes and Window Coverings Makers",
    },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Perfect Fit Tailoring",
      services: ["Tailors, Dressmakers, and Custom Sewers"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Express Dry Cleaning",
      services: ["Laundry and Dry-Cleaning"],
      rating: 4.8,
      reviews: 124,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Creative Costume Design",
      services: ["Costume Makers", "Tailors, Dressmakers, and Custom Sewers"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
    },
    {
      id: 4,
      name: "Elite Alterations",
      services: ["Tailors, Dressmakers, and Custom Sewers", "Shoe and Leather Repair"],
      rating: 4.9,
      reviews: 92,
      location: "Canton, OH",
    },
  ])

  const mockReviews = {
    "Perfect Fit Tailoring": [
      {
        id: 1,
        username: "Rachel G.",
        rating: 5,
        comment:
          "Perfect Fit altered my wedding dress beautifully. The attention to detail was impressive, and the fit was flawless.",
        date: "2023-12-12",
      },
      {
        id: 2,
        username: "Michael B.",
        rating: 4,
        comment: "Great work on my suit alterations. Quick turnaround and professional service.",
        date: "2023-11-08",
      },
      {
        id: 3,
        username: "Emily S.",
        rating: 5,
        comment:
          "I've been going to Perfect Fit for years. Their work is consistently excellent, and they're always accommodating with rush jobs.",
        date: "2023-10-15",
      },
    ],
    "Express Dry Cleaning": [
      {
        id: 1,
        username: "David W.",
        rating: 5,
        comment:
          "Express Dry Cleaning always does a fantastic job with my business shirts. They come back perfectly pressed and spotless.",
        date: "2023-12-05",
      },
      {
        id: 2,
        username: "Sophia L.",
        rating: 4,
        comment:
          "Reliable service and good quality. They handled my delicate fabrics with care. Only giving 4 stars because they're a bit pricey.",
        date: "2023-11-10",
      },
      {
        id: 3,
        username: "Anthony R.",
        rating: 5,
        comment:
          "I appreciate their eco-friendly cleaning methods. My clothes come back clean without harsh chemical smells.",
        date: "2023-10-20",
      },
    ],
    "Creative Costume Design": [
      {
        id: 1,
        username: "Nicole P.",
        rating: 5,
        comment:
          "Creative Costume Design created amazing Halloween costumes for my entire family. The craftsmanship was outstanding.",
        date: "2023-12-15",
      },
      {
        id: 2,
        username: "Jason M.",
        rating: 4,
        comment:
          "They designed a great cosplay outfit for my convention. Good attention to detail and reasonable pricing.",
        date: "2023-11-18",
      },
      {
        id: 3,
        username: "Christina T.",
        rating: 5,
        comment:
          "Their theatrical costume work is exceptional. They created period-accurate costumes for our community theater production.",
        date: "2023-10-25",
      },
    ],
    "Elite Alterations": [
      {
        id: 1,
        username: "Robert J.",
        rating: 5,
        comment:
          "Elite Alterations transformed my off-the-rack suit into something that looks custom-made. Excellent craftsmanship.",
        date: "2023-12-08",
      },
      {
        id: 2,
        username: "Amanda K.",
        rating: 4,
        comment:
          "They did a great job repairing my leather boots. The stitching is nearly invisible, and they look almost new again.",
        date: "2023-11-12",
      },
      {
        id: 3,
        username: "Daniel H.",
        rating: 5,
        comment:
          "I've had several pairs of dress pants altered here, and the results are always perfect. Their turnaround time is quick too.",
        date: "2023-10-18",
      },
    ],
  }

  const handleOpenReviews = (providerName: string) => {
    setSelectedProvider(providerName)
    setIsReviewsOpen(true)
  }

  return (
    <CategoryLayout title="Tailoring & Clothing Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="/dress maker.png"
            alt="Tailoring and Clothing"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find skilled tailors and clothing service professionals in your area. Browse options below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Experienced and skilled clothing professionals</li>
              <li>Read reviews from other customers</li>
              <li>Compare services and rates</li>
              <li>Find the perfect match for your clothing needs</li>
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
