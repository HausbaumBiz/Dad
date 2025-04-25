"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function BeautyWellnessPage() {
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)

  const filterOptions = [
    { id: "beauty1", label: "Barbers", value: "Barbers" },
    {
      id: "beauty2",
      label: "Hairdressers, Hairstylists, and Cosmetologists",
      value: "Hairdressers, Hairstylists, and Cosmetologists",
    },
    { id: "beauty3", label: "Manicurists and Pedicurists", value: "Manicurists and Pedicurists" },
    { id: "beauty4", label: "Skincare Specialists", value: "Skincare Specialists" },
    { id: "beauty5", label: "Hair Removal", value: "Hair Removal" },
    { id: "beauty6", label: "Body Sculpting", value: "Body Sculpting" },
    { id: "beauty7", label: "Spas", value: "Spas" },
    { id: "beauty8", label: "Tanning", value: "Tanning" },
    { id: "beauty9", label: "Tattoo and Scar Removal Services", value: "Tattoo and Scar Removal Services" },
    { id: "beauty10", label: "Hair Wigs and Weaves", value: "Hair Wigs and Weaves" },
    { id: "beauty11", label: "Beauty Products", value: "Beauty Products" },
    {
      id: "beauty12",
      label: "Miscellaneous Personal Appearance Workers",
      value: "Miscellaneous Personal Appearance Workers",
    },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Elegant Hair Studio",
      services: ["Hairdressers, Hairstylists, and Cosmetologists", "Hair Wigs and Weaves"],
      rating: 4.9,
      reviews: 124,
      location: "North Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Jessica M.",
          rating: 5,
          comment:
            "Absolutely love what they did with my hair! The stylist took the time to understand exactly what I wanted and delivered perfectly. The atmosphere is so relaxing too.",
          date: "March 15, 2023",
        },
        {
          id: 2,
          userName: "Michael T.",
          rating: 5,
          comment:
            "Got a custom wig made here and the quality is outstanding. The attention to detail and natural look is exactly what I was hoping for.",
          date: "February 3, 2023",
        },
        {
          id: 3,
          userName: "Aisha K.",
          rating: 4,
          comment:
            "Great service and skilled stylists. The only reason I'm not giving 5 stars is because I had to wait a bit longer than my appointment time.",
          date: "January 22, 2023",
        },
      ],
    },
    {
      id: 2,
      name: "Tranquil Spa & Wellness",
      services: ["Spas", "Skincare Specialists", "Hair Removal"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Sarah P.",
          rating: 5,
          comment:
            "The most relaxing spa experience I've ever had! Their hot stone massage was incredible, and the aesthetician for my facial was knowledgeable and gentle.",
          date: "April 2, 2023",
        },
        {
          id: 2,
          userName: "David L.",
          rating: 5,
          comment:
            "Had my first professional skincare treatment here and was impressed with how much my skin improved. The staff was professional and made me feel comfortable.",
          date: "March 18, 2023",
        },
        {
          id: 3,
          userName: "Emma R.",
          rating: 4,
          comment:
            "Excellent laser hair removal results after just three sessions. Clean facility and professional staff. Pricing is a bit high but worth it for the results.",
          date: "February 27, 2023",
        },
      ],
    },
    {
      id: 3,
      name: "Classic Cuts Barbershop",
      services: ["Barbers"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
      reviewsData: [
        {
          id: 1,
          userName: "James W.",
          rating: 5,
          comment:
            "Best fade in town! My barber takes his time and is extremely precise. The shop has a great atmosphere and everyone is friendly.",
          date: "April 10, 2023",
        },
        {
          id: 2,
          userName: "Carlos M.",
          rating: 4,
          comment:
            "Solid barbershop with skilled barbers. They know how to handle all hair types and styles. Only downside is it can get pretty busy on weekends.",
          date: "March 25, 2023",
        },
        {
          id: 3,
          userName: "Tyler J.",
          rating: 5,
          comment:
            "Found my new regular spot! Great conversation, excellent cut, and reasonable prices. They even offer hot towel service which is a nice touch.",
          date: "February 12, 2023",
        },
      ],
    },
  ])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Beauty & Wellness Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/haircutting-qs8Z2Gv5npSVzpYZ19uRHdGRK94bFP.png"
            alt="Beauty and Wellness"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified beauty and wellness professionals in your area. Browse services below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Licensed and experienced beauty professionals</li>
              <li>Read reviews from other clients</li>
              <li>Compare services and rates</li>
              <li>Find the perfect match for your beauty needs</li>
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
          reviews={selectedProvider.reviewsData}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
