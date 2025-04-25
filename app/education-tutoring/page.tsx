"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function EducationTutoringPage() {
  const filterOptions = [
    { id: "language1", label: "Spanish", value: "Spanish" },
    { id: "language2", label: "French", value: "French" },
    { id: "language3", label: "Chinese", value: "Chinese" },
    { id: "language4", label: "American Sign Language", value: "American Sign Language" },
    { id: "language5", label: "English as a Second Language", value: "English as a Second Language" },
    { id: "language6", label: "Other Language", value: "Other Language" },
    { id: "language7", label: "Math - Elementary", value: "Math - Elementary" },
    { id: "language8", label: "Math - High School", value: "Math - High School" },
    { id: "language9", label: "Reading Tutors (Adult and Children)", value: "Reading Tutors (Adult and Children)" },
    { id: "language10", label: "Test Prep", value: "Test Prep" },
    { id: "language11", label: "Other Subjects", value: "Other Subjects" },
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
      name: "Academic Excellence Tutoring",
      services: ["Math - Elementary", "Math - High School", "Test Prep"],
      rating: 4.9,
      reviews: 112,
      location: "North Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Karen M.",
          rating: 5,
          comment:
            "My son's math grades improved from a C to an A after just two months of tutoring. The tutors are patient and know how to explain complex concepts in simple terms.",
          date: "2023-04-10",
        },
        {
          id: 2,
          userName: "James P.",
          rating: 5,
          comment:
            "The SAT prep course was excellent. My daughter's score improved by 150 points! Highly recommend for any student preparing for college entrance exams.",
          date: "2023-03-22",
        },
        {
          id: 3,
          userName: "Melissa T.",
          rating: 4,
          comment:
            "Good tutoring service for elementary math. My child enjoys the sessions and is gaining confidence in her abilities.",
          date: "2023-02-15",
        },
      ],
    },
    {
      id: 2,
      name: "Language Learning Center",
      services: ["Spanish", "French", "English as a Second Language"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Daniel R.",
          rating: 5,
          comment:
            "The Spanish classes here are fantastic. The instructor uses immersive techniques that make learning fun and effective.",
          date: "2023-04-05",
        },
        {
          id: 2,
          userName: "Sophie L.",
          rating: 4,
          comment:
            "I've been taking French lessons for 6 months and can already hold basic conversations. The small class sizes ensure you get plenty of speaking practice.",
          date: "2023-03-18",
        },
        {
          id: 3,
          userName: "Wei C.",
          rating: 5,
          comment:
            "As a non-native English speaker, the ESL program has been invaluable. My confidence in speaking and writing English has improved dramatically.",
          date: "2023-02-27",
        },
      ],
    },
    {
      id: 3,
      name: "Reading Success",
      services: ["Reading Tutors (Adult and Children)"],
      rating: 4.7,
      reviews: 64,
      location: "Akron, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Amanda J.",
          rating: 5,
          comment:
            "My 7-year-old struggled with reading, but after working with Ms. Sarah, he's reading at grade level and actually enjoys it now!",
          date: "2023-04-12",
        },
        {
          id: 2,
          userName: "Robert M.",
          rating: 4,
          comment:
            "As an adult who always struggled with reading comprehension, I finally found help here. The tutors are respectful and the methods are effective.",
          date: "2023-03-30",
        },
        {
          id: 3,
          userName: "Tina B.",
          rating: 5,
          comment:
            "The reading program here is excellent. They use a combination of phonics and whole language approaches that really work for my daughter.",
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
    <CategoryLayout title="Language Lessons & School Subject Tutoring" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/tutor-oUQE3gdqYse3GcFicrOH9B9CAeaRVb.png"
            alt="Education and Tutoring"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified tutors and language instructors in your area. Browse options below or use filters to narrow
            your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Experienced and qualified educators</li>
              <li>Read reviews from other students</li>
              <li>Compare rates and teaching styles</li>
              <li>Find tutors for all ages and skill levels</li>
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
