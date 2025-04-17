"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function FitnessAthleticsPage() {
  const filterOptions = [
    { id: "athletics1", label: "Baseball/Softball", value: "Baseball/Softball" },
    { id: "athletics2", label: "Golf", value: "Golf" },
    { id: "athletics3", label: "Tennis", value: "Tennis" },
    { id: "athletics4", label: "Basketball", value: "Basketball" },
    { id: "athletics5", label: "Football", value: "Football" },
    { id: "athletics6", label: "Soccer", value: "Soccer" },
    { id: "athletics7", label: "Ice Skating", value: "Ice Skating" },
    { id: "athletics8", label: "Gymnastics", value: "Gymnastics" },
    { id: "athletics9", label: "Pickleball", value: "Pickleball" },
    { id: "athletics10", label: "Table Tennis", value: "Table Tennis" },
    { id: "athletics11", label: "Dance", value: "Dance" },
    { id: "athletics12", label: "Personal Trainers", value: "Personal Trainers" },
    { id: "athletics13", label: "Group Fitness Classes", value: "Group Fitness Classes" },
    { id: "athletics14", label: "Other Athletics & Fitness", value: "Other Athletics & Fitness" },
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
      name: "Elite Sports Training",
      services: ["Baseball/Softball", "Basketball", "Football"],
      rating: 4.9,
      reviews: 112,
      location: "North Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Michael J.",
          rating: 5,
          comment:
            "Coach Tom helped my son improve his batting average significantly. Highly recommend their baseball training program!",
          date: "2023-03-15",
        },
        {
          id: 2,
          userName: "Sarah W.",
          rating: 5,
          comment:
            "The basketball training here is top-notch. My daughter's skills have improved tremendously in just a few months.",
          date: "2023-02-22",
        },
        {
          id: 3,
          userName: "David R.",
          rating: 4,
          comment:
            "Great football training program. The coaches are experienced and really know how to motivate the kids.",
          date: "2023-01-10",
        },
      ],
    },
    {
      id: 2,
      name: "Peak Performance Fitness",
      services: ["Personal Trainers", "Group Fitness Classes"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Jennifer L.",
          rating: 5,
          comment: "My personal trainer, Alex, has been amazing! I've lost 15 pounds and feel stronger than ever.",
          date: "2023-04-05",
        },
        {
          id: 2,
          userName: "Robert K.",
          rating: 5,
          comment:
            "The group fitness classes are energetic and challenging. The instructors keep you motivated throughout.",
          date: "2023-03-18",
        },
        {
          id: 3,
          userName: "Lisa M.",
          rating: 4,
          comment:
            "Great facility with knowledgeable trainers. The only reason for 4 stars is that it can get crowded during peak hours.",
          date: "2023-02-27",
        },
      ],
    },
    {
      id: 3,
      name: "Dance & Movement Studio",
      services: ["Dance", "Gymnastics"],
      rating: 4.7,
      reviews: 64,
      location: "Akron, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Emma S.",
          rating: 5,
          comment: "My daughter loves her ballet classes here! The instructors are patient and encouraging.",
          date: "2023-04-12",
        },
        {
          id: 2,
          userName: "Thomas B.",
          rating: 4,
          comment: "The gymnastics program is excellent. My son has gained so much confidence since starting here.",
          date: "2023-03-30",
        },
        {
          id: 3,
          userName: "Olivia P.",
          rating: 5,
          comment:
            "We've tried several dance studios in the area, and this one is by far the best. Professional yet nurturing environment.",
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
    <CategoryLayout title="Athletics, Fitness & Dance Instruction" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="/baseball.png"
            alt="Athletics and Fitness"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified coaches, trainers, and fitness professionals in your area. Browse options below or use
            filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Certified and experienced fitness professionals</li>
              <li>Read reviews from other clients</li>
              <li>Compare rates and availability</li>
              <li>Find options for all skill and fitness levels</li>
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
