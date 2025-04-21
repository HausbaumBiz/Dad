"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function MedicalPractitionersPage() {
  const filterOptions = [
    { id: "medical1", label: "Chiropractors", value: "Chiropractors" },
    { id: "medical2", label: "Dentists", value: "Dentists" },
    { id: "medical3", label: "Orthodontists", value: "Orthodontists" },
    { id: "medical4", label: "Optometrists", value: "Optometrists" },
    { id: "medical5", label: "Podiatrists", value: "Podiatrists" },
    { id: "medical6", label: "Audiologists", value: "Audiologists" },
    { id: "medical7", label: "Dietitians and Nutritionists", value: "Dietitians and Nutritionists" },
    { id: "medical8", label: "Naturopaths", value: "Naturopaths" },
    { id: "medical9", label: "Herbalists", value: "Herbalists" },
    { id: "medical10", label: "Acupuncturist", value: "Acupuncturist" },
    { id: "medical11", label: "Orthotists and Prosthetists", value: "Orthotists and Prosthetists" },
    { id: "medical12", label: "Midwives and Doulas", value: "Midwives and Doulas" },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Wellness Chiropractic Center",
      services: ["Chiropractors"],
      rating: 4.9,
      reviews: 124,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Bright Smile Dental",
      services: ["Dentists", "Orthodontists"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Natural Healing Center",
      services: ["Acupuncturist", "Naturopaths", "Herbalists"],
      rating: 4.7,
      reviews: 56,
      location: "Akron, OH",
    },
  ])

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    1: [
      {
        id: 1,
        username: "BackPainRelieved",
        rating: 5,
        date: "2023-11-15",
        comment:
          "Dr. Johnson at Wellness Chiropractic Center is amazing! After just three sessions, my chronic back pain has significantly improved. The staff is friendly and the facility is clean and modern.",
      },
      {
        id: 2,
        username: "ActiveGrandma",
        rating: 5,
        date: "2023-10-22",
        comment:
          "I've been seeing Dr. Johnson for my arthritis pain for over a year. His adjustments have helped me stay active and play with my grandchildren without pain. Highly recommend!",
      },
      {
        id: 3,
        username: "WeekendAthlete",
        rating: 4,
        date: "2023-09-18",
        comment:
          "Great experience overall. The doctor took time to explain my condition and treatment plan. My neck pain is much better after treatment.",
      },
    ],
    2: [
      {
        id: 1,
        username: "SmileMore",
        rating: 5,
        date: "2023-11-05",
        comment:
          "Bright Smile Dental is the best! Dr. Garcia is gentle and thorough. My teeth have never looked better after my cleaning and whitening treatment.",
      },
      {
        id: 2,
        username: "NoMoreToothache",
        rating: 5,
        date: "2023-10-12",
        comment:
          "Had a root canal done here and was surprised at how painless it was. Dr. Garcia and her team are skilled professionals who really care about patient comfort.",
      },
      {
        id: 3,
        username: "BracesGraduate",
        rating: 4,
        date: "2023-09-30",
        comment:
          "Just got my braces off after 18 months and my smile looks amazing! The orthodontist was great at explaining everything throughout the process.",
      },
    ],
    3: [
      {
        id: 1,
        username: "HolisticHealth",
        rating: 5,
        date: "2023-11-20",
        comment:
          "The Natural Healing Center has transformed my approach to health. Their acupuncture treatments have helped with my migraines when nothing else worked.",
      },
      {
        id: 2,
        username: "StressFreeLiving",
        rating: 4,
        date: "2023-10-08",
        comment:
          "I've been seeing their herbalist for my anxiety and sleep issues. The herbal remedies have made a noticeable difference without the side effects I experienced with prescription medications.",
      },
      {
        id: 3,
        username: "ChronicPainSurvivor",
        rating: 5,
        date: "2023-09-15",
        comment:
          "The combination of acupuncture and naturopathic medicine has helped me manage my fibromyalgia. The practitioners really listen and create personalized treatment plans.",
      },
    ],
  }

  // Handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Medical Practitioners (non MD/DO)" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/home%20health-zJyA419byhmD7tyJa0Ebmegg0XzFN3.png"
            alt="Medical Practitioners"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified healthcare professionals in your area. Browse practitioners below or use filters to narrow
            your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Licensed and experienced healthcare professionals</li>
              <li>Read reviews from other patients</li>
              <li>Compare services and rates</li>
              <li>Find specialized care for your specific needs</li>
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

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name}
        reviews={selectedProvider ? mockReviews[selectedProvider.id] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}
