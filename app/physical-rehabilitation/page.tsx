"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function PhysicalRehabilitationPage() {
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)

  const filterOptions = [
    { id: "therapy1", label: "Occupational Therapists", value: "Occupational Therapists" },
    { id: "therapy2", label: "Physical Therapists", value: "Physical Therapists" },
    { id: "therapy3", label: "Recreational Therapists", value: "Recreational Therapists" },
    { id: "therapy4", label: "Respiratory Therapists", value: "Respiratory Therapists" },
    { id: "therapy5", label: "Speech-Language Pathologists", value: "Speech-Language Pathologists" },
    { id: "therapy6", label: "Exercise Physiologists", value: "Exercise Physiologists" },
    { id: "therapy7", label: "Massage Therapists", value: "Massage Therapists" },
    { id: "therapy8", label: "Art Therapists", value: "Art Therapists" },
    { id: "therapy9", label: "Music Therapists", value: "Music Therapists" },
    { id: "therapy10", label: "Therapists, All Other", value: "Therapists, All Other" },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Complete Physical Therapy",
      services: ["Physical Therapists", "Occupational Therapists"],
      rating: 4.9,
      reviews: 112,
      location: "North Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Robert J.",
          rating: 5,
          comment:
            "After my knee surgery, I was worried about recovery. The team at Complete Physical Therapy created a personalized plan that got me back to running in just 3 months!",
          date: "April 5, 2023",
        },
        {
          id: 2,
          userName: "Maria S.",
          rating: 5,
          comment:
            "The occupational therapists here are amazing. They helped my mother regain independence after her stroke with practical, effective exercises and techniques.",
          date: "March 12, 2023",
        },
        {
          id: 3,
          userName: "Thomas L.",
          rating: 4,
          comment:
            "Very professional staff and clean facility. My only complaint is that sometimes appointments run behind schedule, but the quality of care makes up for it.",
          date: "February 28, 2023",
        },
      ],
    },
    {
      id: 2,
      name: "Healing Touch Massage",
      services: ["Massage Therapists"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Jennifer K.",
          rating: 5,
          comment:
            "Best deep tissue massage I've ever had! The therapist really listened to my concerns about chronic back pain and targeted all the right areas.",
          date: "April 10, 2023",
        },
        {
          id: 2,
          userName: "Paul M.",
          rating: 5,
          comment:
            "As someone who sits at a desk all day, their office worker package was exactly what I needed. My neck and shoulder tension is finally gone!",
          date: "March 22, 2023",
        },
        {
          id: 3,
          userName: "Samantha R.",
          rating: 4,
          comment:
            "Very relaxing environment and skilled therapists. They offer a variety of massage styles to choose from. Prices are reasonable for the quality.",
          date: "February 15, 2023",
        },
      ],
    },
    {
      id: 3,
      name: "Speech & Language Specialists",
      services: ["Speech-Language Pathologists"],
      rating: 4.7,
      reviews: 64,
      location: "Akron, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Daniel T.",
          rating: 5,
          comment:
            "The speech therapists here worked wonders with my 5-year-old son. His pronunciation has improved dramatically in just a few months of sessions.",
          date: "April 3, 2023",
        },
        {
          id: 2,
          userName: "Lisa W.",
          rating: 4,
          comment:
            "After my father's stroke, he struggled with speaking. The pathologists here were patient and effective in helping him regain his communication skills.",
          date: "March 18, 2023",
        },
        {
          id: 3,
          userName: "Kevin B.",
          rating: 5,
          comment:
            "As an adult who stutters, I was nervous about seeking help. The team here was so supportive and non-judgmental. I've seen real improvement in my fluency.",
          date: "February 5, 2023",
        },
      ],
    },
  ])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Physical Rehabilitation" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/phyical-RZOSg66X6bkbf12ZqgYD8MRTtNgk6H.png"
            alt="Physical Rehabilitation"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified rehabilitation professionals in your area. Browse services below or use filters to narrow
            your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Licensed and experienced therapy professionals</li>
              <li>Read reviews from other patients</li>
              <li>Compare services and specialties</li>
              <li>Find the right care for your specific needs</li>
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
