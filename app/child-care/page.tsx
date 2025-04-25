"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function ChildCarePage() {
  const filterOptions = [
    { id: "childcare1", label: "Daycare", value: "Daycare" },
    {
      id: "childcare2",
      label: "Babysitters (Only sitters over age 18)",
      value: "Babysitters (Only sitters over age 18)",
    },
    { id: "childcare3", label: "After School Sitters/Programs", value: "After School Sitters/Programs" },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Sunshine Daycare Center",
      services: ["Daycare"],
      rating: 4.9,
      reviews: 124,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "After School Adventures",
      services: ["After School Sitters/Programs"],
      rating: 4.8,
      reviews: 87,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Trusted Sitters Network",
      services: ["Babysitters (Only sitters over age 18)"],
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
    "Sunshine Daycare Center": [
      {
        id: 1,
        userName: "HappyParent123",
        rating: 5,
        comment:
          "My daughter loves going to Sunshine Daycare! The staff is incredibly caring and they have such engaging activities. I've seen tremendous growth in her social skills since she started.",
        date: "June 12, 2023",
      },
      {
        id: 2,
        userName: "WorkingMom2",
        rating: 5,
        comment:
          "As a working parent, I need reliable childcare I can trust. Sunshine provides daily updates and photos so I never feel like I'm missing important moments. Their facility is clean and secure.",
        date: "May 3, 2023",
      },
      {
        id: 3,
        userName: "DadOfTwins",
        rating: 4,
        comment:
          "My twins have been attending for 6 months now. The structured curriculum is impressive - they're learning so much! Only wish they had longer hours for parents with non-traditional schedules.",
        date: "April 18, 2023",
      },
    ],
    "After School Adventures": [
      {
        id: 1,
        userName: "BusyProfessional",
        rating: 5,
        comment:
          "After School Adventures has been a lifesaver for our family. My son gets help with homework and participates in fun activities. The staff communicates well and genuinely cares about the kids.",
        date: "May 25, 2023",
      },
      {
        id: 2,
        userName: "SportsMom",
        rating: 4,
        comment:
          "My daughter loves the variety of activities they offer. From arts and crafts to outdoor games, she's never bored. The pickup process is well-organized and efficient.",
        date: "April 30, 2023",
      },
      {
        id: 3,
        userName: "ElementaryTeacher",
        rating: 5,
        comment:
          "As both a teacher and parent, I'm impressed with their educational approach. They strike the perfect balance between academic support and letting kids have fun after a long school day.",
        date: "March 15, 2023",
      },
    ],
    "Trusted Sitters Network": [
      {
        id: 1,
        userName: "DateNightParents",
        rating: 5,
        comment:
          "We've used several sitters from this network and have been consistently impressed. The screening process is thorough, and we've felt comfortable leaving our children every time.",
        date: "June 5, 2023",
      },
      {
        id: 2,
        userName: "SingleDadOf3",
        rating: 4,
        comment:
          "Finding reliable babysitters used to be so stressful until I discovered Trusted Sitters. The online booking system is convenient, and my kids actually look forward to when the sitter comes!",
        date: "May 12, 2023",
      },
      {
        id: 3,
        userName: "NewToTown",
        rating: 5,
        comment:
          "After moving to a new city, I had no local family to help with childcare. Trusted Sitters has been invaluable. The sitters are professional, punctual, and my daughter adores them.",
        date: "April 8, 2023",
      },
    ],
  }

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Child Care Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/daycare-tX4p6sCUHmjoNFymH3235qbTp3JM7U.png"
            alt="Child Care"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find trusted child care providers in your area. Browse services below or use filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Verified and background-checked child care providers</li>
              <li>Read reviews from other parents</li>
              <li>Compare services and rates</li>
              <li>Find the perfect care solution for your children</li>
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
          reviews={mockReviews[selectedProvider.name] || []}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
