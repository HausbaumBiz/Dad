"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function MentalHealthPage() {
  const filterOptions = [
    { id: "counselors1", label: "Counselors", value: "Counselors" },
    {
      id: "counselors2",
      label: "Clinical and Counseling Psychologists",
      value: "Clinical and Counseling Psychologists",
    },
    { id: "counselors3", label: "Addiction Specialists", value: "Addiction Specialists" },
    { id: "counselors4", label: "Suboxone/Methadone Clinics", value: "Suboxone/Methadone Clinics" },
    { id: "counselors5", label: "Team Building", value: "Team Building" },
    {
      id: "counselors6",
      label: "Industrial-Organizational Psychologists",
      value: "Industrial-Organizational Psychologists",
    },
    { id: "counselors7", label: "Motivational Speakers", value: "Motivational Speakers" },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Mindful Therapy Group",
      services: ["Counselors", "Clinical and Counseling Psychologists"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Recovery Solutions",
      services: ["Addiction Specialists", "Suboxone/Methadone Clinics"],
      rating: 4.8,
      reviews: 64,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Corporate Wellness Consultants",
      services: ["Team Building", "Industrial-Organizational Psychologists", "Motivational Speakers"],
      rating: 4.7,
      reviews: 52,
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
        username: "HealingJourney",
        rating: 5,
        date: "2023-11-18",
        comment:
          "Dr. Williams at Mindful Therapy Group has been instrumental in helping me work through my anxiety. The cognitive behavioral therapy techniques she taught me have changed my life.",
      },
      {
        id: 2,
        username: "NewBeginnings",
        rating: 5,
        date: "2023-10-25",
        comment:
          "After my divorce, I was struggling to cope. The counseling I received here gave me tools to process my grief and start rebuilding. Highly recommend their services.",
      },
      {
        id: 3,
        username: "GratefulParent",
        rating: 4,
        date: "2023-09-12",
        comment:
          "We sought help for our teenager who was dealing with depression. The therapist connected well with our child and we've seen significant improvement in their mood and outlook.",
      },
    ],
    2: [
      {
        id: 1,
        username: "SoberAndStrong",
        rating: 5,
        date: "2023-11-10",
        comment:
          "Recovery Solutions saved my life. Their addiction specialists understand the complex nature of addiction and provide compassionate, effective treatment. I'm now 8 months sober.",
      },
      {
        id: 2,
        username: "FamilySupport",
        rating: 4,
        date: "2023-10-05",
        comment:
          "As the spouse of someone in recovery, I appreciated the family counseling services. They helped me understand addiction better and how to support my partner without enabling.",
      },
      {
        id: 3,
        username: "SecondChance",
        rating: 5,
        date: "2023-09-22",
        comment:
          "The medication-assisted treatment program here is excellent. The staff is non-judgmental and the doctors work with you to find the right treatment approach.",
      },
    ],
    3: [
      {
        id: 1,
        username: "TeamLeader",
        rating: 5,
        date: "2023-11-20",
        comment:
          "Corporate Wellness Consultants transformed our workplace culture. Their team building workshop was engaging and produced tangible improvements in how our departments collaborate.",
      },
      {
        id: 2,
        username: "HRDirector",
        rating: 4,
        date: "2023-10-15",
        comment:
          "We brought in their organizational psychologist to help with employee satisfaction issues. The assessment and recommendations were data-driven and practical.",
      },
      {
        id: 3,
        username: "ConferenceOrganizer",
        rating: 5,
        date: "2023-09-08",
        comment:
          "Their motivational speaker was the highlight of our annual conference. Engaging, inspiring, and provided actionable strategies our attendees could implement immediately.",
      },
    ],
  }

  // Handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Counselors, Psychologists & Addiction Specialists" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/couseling-4fgTKlpfTgyIe4nhlAyiC5v7PpaJcE.png"
            alt="Mental Health Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified mental health professionals in your area. Browse services below or use filters to narrow your
            search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Licensed and experienced mental health professionals</li>
              <li>Confidential and secure service connections</li>
              <li>Compare specialties and approaches</li>
              <li>Find the right support for your specific needs</li>
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
