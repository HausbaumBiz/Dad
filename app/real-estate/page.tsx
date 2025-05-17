"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function RealEstatePage() {
  const filterOptions = [
    { id: "home1", label: "Real Estate Agent", value: "Real Estate Agent" },
    { id: "home2", label: "Real Estate Appraising", value: "Real Estate Appraising" },
    { id: "home3", label: "Home Staging", value: "Home Staging" },
    { id: "home4", label: "Home Inspection", value: "Home Inspection" },
    { id: "home5", label: "Home Energy Audit", value: "Home Energy Audit" },
    { id: "home6", label: "Other Home Buying and Selling", value: "Other Home Buying and Selling" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    reviews: any[]
  } | null>(null)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Premier Real Estate Group",
      services: ["Real Estate Agent", "Home Staging"],
      rating: 4.9,
      reviews: 124,
      location: "North Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Jennifer & Michael Davis",
          rating: 5,
          comment:
            "Sarah from Premier Real Estate Group was amazing! She helped us find our dream home in a competitive market and negotiated a great price. Her knowledge of the local neighborhoods was invaluable.",
          date: "2023-03-15",
        },
        {
          id: 2,
          userName: "Robert Wilson",
          rating: 5,
          comment:
            "We used Premier for both selling our old home and buying our new one. Their home staging service transformed our place and we got multiple offers above asking price within days.",
          date: "2023-02-22",
        },
        {
          id: 3,
          userName: "Lisa Thompson",
          rating: 4,
          comment:
            "Good experience overall. Our agent was responsive and knowledgeable. The only reason for 4 stars instead of 5 is that some paperwork took longer than expected.",
          date: "2023-01-10",
        },
      ],
    },
    {
      id: 2,
      name: "Accurate Home Inspections",
      services: ["Home Inspection", "Home Energy Audit"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "David Chen",
          rating: 5,
          comment:
            "Tom from Accurate Home Inspections was thorough and professional. He found issues that we would have never noticed and saved us from a potentially expensive mistake.",
          date: "2023-04-05",
        },
        {
          id: 2,
          userName: "Amanda Johnson",
          rating: 5,
          comment:
            "The energy audit was eye-opening. They identified several ways we could improve efficiency and save on utilities. The report was detailed and easy to understand.",
          date: "2023-03-18",
        },
        {
          id: 3,
          userName: "Mark Rodriguez",
          rating: 4,
          comment:
            "Solid inspection service. They were on time and detailed. I appreciated the same-day report with photos of all issues found.",
          date: "2023-02-27",
        },
      ],
    },
    {
      id: 3,
      name: "Value Appraisal Services",
      services: ["Real Estate Appraising"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
      reviewsData: [
        {
          id: 1,
          userName: "James Miller",
          rating: 5,
          comment:
            "Fast and professional service. The appraiser was knowledgeable about the local market and provided a fair valuation with detailed supporting documentation.",
          date: "2023-04-12",
        },
        {
          id: 2,
          userName: "Susan Williams",
          rating: 4,
          comment:
            "Good experience with Value Appraisal. They were responsive and completed the appraisal quickly for our refinance.",
          date: "2023-03-30",
        },
        {
          id: 3,
          userName: "Thomas Brown",
          rating: 5,
          comment:
            "I needed an appraisal for estate purposes, and Value Appraisal was recommended by my attorney. They were professional, thorough, and reasonably priced.",
          date: "2023-02-15",
        },
      ],
    },
  ])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Home Buying and Selling" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/realestate002-uC3LlRrHqFBnFoowNNyWGD4WLtnTXj.png"
            alt="Real Estate Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified real estate professionals to help with buying or selling your home. Browse services below or
            use filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Licensed and experienced real estate professionals</li>
              <li>Read reviews from other clients</li>
              <li>Compare services and rates</li>
              <li>Find all the help you need in one place</li>
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
