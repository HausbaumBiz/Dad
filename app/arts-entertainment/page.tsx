"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
// Import the ReviewsDialog component
import { ReviewsDialog } from "@/components/reviews-dialog"
import { ReviewLoginDialog } from "@/components/review-login-dialog"

export default function ArtsEntertainmentPage() {
  const filterOptions = [
    {
      id: "arts1",
      label: "Fine Artists, Including Painters, Sculptors, and Illustrators",
      value: "Fine Artists, Including Painters, Sculptors, and Illustrators",
    },
    { id: "arts2", label: "Craft Artists", value: "Craft Artists" },
    { id: "arts3", label: "Musicians and Singers", value: "Musicians and Singers" },
    { id: "arts4", label: "Recording Studios", value: "Recording Studios" },
    { id: "arts5", label: "Art Galleries", value: "Art Galleries" },
    { id: "arts6", label: "Concert Venues", value: "Concert Venues" },
    { id: "arts7", label: "Fashion Designers", value: "Fashion Designers" },
    { id: "arts8", label: "Interior Designers", value: "Interior Designers" },
    { id: "arts9", label: "Photographers and Videographers", value: "Photographers and Videographers" },
    { id: "arts10", label: "Floral Designers", value: "Floral Designers" },
    { id: "arts11", label: "Graphic Designers", value: "Graphic Designers" },
    { id: "arts12", label: "All Entertainers and Talent", value: "All Entertainers and Talent" },
    { id: "arts13", label: "Talent Agent", value: "Talent Agent" },
    { id: "arts14", label: "Models", value: "Models" },
  ]

  // Add state variables for tracking the selected provider and dialog open state
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Creative Visions Studio",
      services: ["Photographers and Videographers", "Graphic Designers"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Harmony Music Productions",
      services: ["Musicians and Singers", "Recording Studios"],
      rating: 4.8,
      reviews: 64,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Modern Space Interiors",
      services: ["Interior Designers"],
      rating: 4.7,
      reviews: 52,
      location: "Akron, OH",
    },
  ])

  // Add mock reviews data specific to arts and entertainment services
  const mockReviews = [
    {
      id: 1,
      providerName: "Creative Visions Studio",
      reviews: [
        {
          id: 101,
          username: "ArtLover42",
          rating: 5,
          date: "2023-11-15",
          comment:
            "Absolutely stunning photography work! They captured our family portraits with such creativity and attention to detail. The graphic design work they did for our business cards was equally impressive.",
        },
        {
          id: 102,
          username: "DesignEnthusiast",
          rating: 5,
          date: "2023-10-22",
          comment:
            "Professional, creative, and a pleasure to work with. Their photography perfectly captured the essence of our event, and the edited photos were delivered ahead of schedule.",
        },
        {
          id: 103,
          username: "MarketingPro",
          rating: 4,
          date: "2023-09-18",
          comment:
            "Great graphic design work for our company rebrand. They really understood our vision and translated it beautifully into our new logo and marketing materials.",
        },
      ],
    },
    {
      id: 2,
      providerName: "Harmony Music Productions",
      reviews: [
        {
          id: 201,
          username: "MusicFan88",
          rating: 5,
          date: "2023-11-10",
          comment:
            "The musicians they provided for our wedding were exceptional! They learned our special request songs and performed them beautifully. The recording studio is also top-notch.",
        },
        {
          id: 202,
          username: "BandMember23",
          rating: 4,
          date: "2023-10-05",
          comment:
            "Great recording studio with professional sound engineers. They helped us get the perfect sound for our EP. The equipment is high quality and the space is comfortable.",
        },
        {
          id: 203,
          username: "EventPlanner",
          rating: 5,
          date: "2023-09-12",
          comment:
            "Hired their musicians for a corporate event and they were fantastic! Very professional, on time, and their performance created the perfect atmosphere.",
        },
      ],
    },
    {
      id: 3,
      providerName: "Modern Space Interiors",
      reviews: [
        {
          id: 301,
          username: "HomeOwner2023",
          rating: 5,
          date: "2023-11-20",
          comment:
            "Transformed our living space completely! Their interior design vision was exactly what we needed. They worked within our budget and the results exceeded our expectations.",
        },
        {
          id: 302,
          username: "BusinessOwner",
          rating: 4,
          date: "2023-10-15",
          comment:
            "Hired them to redesign our office space and they did a fantastic job. The space is now both functional and beautiful. Our clients always comment on how nice it looks.",
        },
        {
          id: 303,
          username: "RenovationQueen",
          rating: 5,
          date: "2023-09-05",
          comment:
            "Amazing attention to detail and they really listen to what you want. They helped me select the perfect colors, furniture, and accessories for my home renovation.",
        },
      ],
    },
  ]

  // Add a handler function for opening the reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Arts & Entertainment" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/clown-xZLibLvsgZ7U7sWOXy9eokr8IyyUZy.png"
            alt="Arts and Entertainment"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find creative professionals and entertainment services in your area. Browse options below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Talented and experienced creative professionals</li>
              <li>Read reviews from other clients</li>
              <li>Compare portfolios and services</li>
              <li>Find the perfect match for your creative needs</li>
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

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          reviews={mockReviews.find((p) => p.providerName === selectedProvider.name)?.reviews || []}
        />
      )}

      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />

      <Toaster />
    </CategoryLayout>
  )
}
