"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function MusicLessonsPage() {
  const filterOptions = [
    { id: "music1", label: "Piano Lessons", value: "Piano Lessons" },
    { id: "music2", label: "Guitar Lessons", value: "Guitar Lessons" },
    { id: "music3", label: "Violin Lessons", value: "Violin Lessons" },
    { id: "music4", label: "Cello Lessons", value: "Cello Lessons" },
    { id: "music5", label: "Trumpet Lessons", value: "Trumpet Lessons" },
    { id: "music6", label: "Other Instrument Lessons", value: "Other Instrument Lessons" },
    { id: "music7", label: "Instrument Repair", value: "Instrument Repair" },
    { id: "music8", label: "Used and New Instruments for Sale", value: "Used and New Instruments for Sale" },
    { id: "music9", label: "Other Music", value: "Other Music" },
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
      name: "Harmony Music Studio",
      services: ["Piano Lessons", "Guitar Lessons", "Violin Lessons"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Emily R.",
          rating: 5,
          comment:
            "My daughter has been taking piano lessons here for a year and her progress is amazing. The instructors are patient and make learning fun.",
          date: "2023-04-08",
        },
        {
          id: 2,
          userName: "Mark T.",
          rating: 5,
          comment:
            "I started guitar lessons as an adult beginner and couldn't be happier with my experience. The instructors adapt to your learning style and pace.",
          date: "2023-03-15",
        },
        {
          id: 3,
          userName: "Sophia L.",
          rating: 4,
          comment:
            "My son enjoys his violin lessons here. The studio is well-equipped and the teachers are knowledgeable. Only giving 4 stars because scheduling can sometimes be difficult.",
          date: "2023-02-22",
        },
      ],
    },
    {
      id: 2,
      name: "String & Keys Music School",
      services: ["Piano Lessons", "Violin Lessons", "Cello Lessons"],
      rating: 4.8,
      reviews: 64,
      location: "Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Nathan P.",
          rating: 5,
          comment:
            "The cello instruction here is top-notch. My technique has improved dramatically in just a few months.",
          date: "2023-04-02",
        },
        {
          id: 2,
          userName: "Olivia M.",
          rating: 5,
          comment:
            "We've tried several music schools for my children's piano lessons, and this is by far the best. The recitals they organize are professional and give students great performance experience.",
          date: "2023-03-20",
        },
        {
          id: 3,
          userName: "William J.",
          rating: 4,
          comment:
            "Good violin instruction for intermediate players. The teachers have strong classical training and focus on proper technique.",
          date: "2023-02-10",
        },
      ],
    },
    {
      id: 3,
      name: "Instrumental Repair Shop",
      services: ["Instrument Repair", "Used and New Instruments for Sale"],
      rating: 4.7,
      reviews: 52,
      location: "Akron, OH",
      reviewsData: [
        {
          id: 1,
          userName: "David K.",
          rating: 5,
          comment:
            "They did an amazing job repairing my vintage guitar. The craftsmanship is excellent and the price was fair.",
          date: "2023-04-15",
        },
        {
          id: 2,
          userName: "Rachel S.",
          rating: 4,
          comment:
            "Bought a used violin for my daughter here. Good selection and the staff was knowledgeable in helping us choose the right instrument for her level.",
          date: "2023-03-28",
        },
        {
          id: 3,
          userName: "Michael B.",
          rating: 5,
          comment:
            "I've been bringing my brass instruments here for maintenance for years. They always do quality work and stand behind their repairs.",
          date: "2023-02-05",
        },
      ],
    },
  ])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Music Lessons & Instrument Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="/music lesson.png"
            alt="Music Lessons"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified music teachers and instrument services in your area. Browse options below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Verified and experienced music instructors</li>
              <li>Read reviews from other students</li>
              <li>Compare rates and availability</li>
              <li>Find lessons for all skill levels</li>
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
