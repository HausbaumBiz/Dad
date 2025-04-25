"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { useState } from "react"

export default function FuneralServicesPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)

  const mockReviews = {
    "Peaceful Passages Funeral Home": [
      {
        id: 1,
        username: "Michael R.",
        rating: 5,
        comment:
          "During our difficult time, the staff at Peaceful Passages provided exceptional care and support. They handled everything with dignity and respect.",
        date: "2023-11-15",
      },
      {
        id: 2,
        username: "Sarah J.",
        rating: 5,
        comment:
          "The funeral service they arranged for my father was beautiful and meaningful. They were compassionate throughout the entire process.",
        date: "2023-10-22",
      },
      {
        id: 3,
        username: "David L.",
        rating: 4,
        comment:
          "Professional and caring service. They guided us through all the arrangements with patience and understanding.",
        date: "2023-09-18",
      },
    ],
    "Eternal Rest Memorial Services": [
      {
        id: 1,
        username: "Jennifer K.",
        rating: 5,
        comment:
          "Eternal Rest helped us create a beautiful celebration of life for our mother. Their attention to detail was remarkable.",
        date: "2023-12-05",
      },
      {
        id: 2,
        username: "Robert T.",
        rating: 4,
        comment:
          "Compassionate staff who truly care about the families they serve. They made a difficult time more bearable.",
        date: "2023-11-10",
      },
      {
        id: 3,
        username: "Patricia M.",
        rating: 5,
        comment:
          "They handled all aspects of the funeral with professionalism and dignity. I'm grateful for their support during our loss.",
        date: "2023-10-28",
      },
    ],
    "Serenity Funeral Chapel": [
      {
        id: 1,
        username: "Thomas W.",
        rating: 5,
        comment:
          "The staff at Serenity provided exceptional service during our time of grief. They took care of every detail with compassion.",
        date: "2023-12-12",
      },
      {
        id: 2,
        username: "Elizabeth B.",
        rating: 4,
        comment:
          "Their pre-planning services were invaluable. They helped us make difficult decisions with sensitivity and care.",
        date: "2023-11-25",
      },
      {
        id: 3,
        username: "William H.",
        rating: 5,
        comment:
          "The memorial service they arranged was a perfect tribute. They listened to our wishes and exceeded our expectations.",
        date: "2023-10-15",
      },
    ],
    "Grace Memorial Funeral Home": [
      {
        id: 1,
        username: "Karen D.",
        rating: 5,
        comment:
          "Grace Memorial provided exceptional service during our difficult time. Their compassion and professionalism were outstanding.",
        date: "2023-12-08",
      },
      {
        id: 2,
        username: "James F.",
        rating: 4,
        comment:
          "They guided us through the entire process with patience and understanding. The service was beautiful and meaningful.",
        date: "2023-11-20",
      },
      {
        id: 3,
        username: "Susan P.",
        rating: 5,
        comment:
          "Their attention to detail and personal touches made the service special. They truly honored our loved one's memory.",
        date: "2023-10-30",
      },
    ],
  }

  const handleOpenReviews = (providerName: string) => {
    setSelectedProvider(providerName)
    setIsReviewsOpen(true)
  }

  const filterOptions = [
    { id: "funeral1", label: "Funeral Homes", value: "Funeral Homes" },
    { id: "funeral2", label: "Cemeteries", value: "Cemeteries" },
    { id: "funeral3", label: "Florists", value: "Florists" },
    { id: "funeral4", label: "Headstones/Monuments", value: "Headstones/Monuments" },
    { id: "funeral5", label: "Caskets and Urns", value: "Caskets and Urns" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProviderOld, setSelectedProviderOld] = useState<{
    id: number
    name: string
    reviews: any[]
  } | null>(null)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Peaceful Rest Funeral Home",
      services: ["Funeral Homes", "Caskets and Urns"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Margaret Wilson",
          rating: 5,
          comment:
            "During our time of grief, the staff at Peaceful Rest provided exceptional care and support. They handled all the arrangements with dignity and respect, making a difficult time much easier for our family.",
          date: "2023-03-15",
        },
        {
          id: 2,
          userName: "James Thompson",
          rating: 5,
          comment:
            "I cannot express enough gratitude for how they helped us honor my father's memory. Their attention to detail and compassionate service was truly remarkable. The facility was beautiful and accommodating for all our guests.",
          date: "2023-02-08",
        },
        {
          id: 3,
          userName: "Susan Miller",
          rating: 4,
          comment:
            "The funeral directors were professional and caring throughout the entire process. They guided us through all the decisions with patience. The only reason for 4 stars instead of 5 is that some of the pricing options could have been clearer.",
          date: "2023-01-20",
        },
      ],
    },
    {
      id: 2,
      name: "Evergreen Memorial Gardens",
      services: ["Cemeteries", "Headstones/Monuments"],
      rating: 4.8,
      reviews: 64,
      location: "Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Robert Johnson",
          rating: 5,
          comment:
            "Evergreen Memorial Gardens is a beautiful and peaceful final resting place. The grounds are immaculately maintained, and the staff was helpful in selecting the perfect location for our loved one.",
          date: "2023-04-05",
        },
        {
          id: 2,
          userName: "Elizabeth Davis",
          rating: 4,
          comment:
            "We appreciated the range of options for headstones and the guidance provided in designing a meaningful monument. The cemetery is serene and well-kept, providing comfort when we visit.",
          date: "2023-03-12",
        },
        {
          id: 3,
          userName: "Michael Brown",
          rating: 5,
          comment:
            "After visiting several cemeteries, we chose Evergreen for its beautiful landscape and respectful atmosphere. The staff was compassionate and helped us through every step of the process during a difficult time.",
          date: "2023-02-27",
        },
      ],
    },
    {
      id: 3,
      name: "Sympathy Floral Designs",
      services: ["Florists"],
      rating: 4.7,
      reviews: 52,
      location: "Akron, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Jennifer Adams",
          rating: 5,
          comment:
            "The floral arrangements created for my mother's funeral were absolutely beautiful. They captured her spirit perfectly and brought a touch of beauty to a somber occasion. Delivery was prompt and the flowers were fresh.",
          date: "2023-04-10",
        },
        {
          id: 2,
          userName: "David Wilson",
          rating: 4,
          comment:
            "Sympathy Floral Designs provided lovely arrangements for our service. They were accommodating with our specific requests and worked within our budget. The only reason for 4 stars is that one arrangement was slightly different than what we had discussed.",
          date: "2023-03-22",
        },
        {
          id: 3,
          userName: "Patricia Clark",
          rating: 5,
          comment:
            "I ordered flowers from out of state for my aunt's funeral, and Sympathy Floral Designs made the process easy. They were responsive to my calls and emails, and the family told me the arrangements were stunning.",
          date: "2023-02-15",
        },
      ],
    },
  ])

  const handleOpenReviewsOld = (provider: any) => {
    setSelectedProviderOld(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Funeral Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/funeral-d3jRmRhs8rBZ2YN1inIrZFWmBn3SPi.png"
            alt="Funeral Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find compassionate funeral service providers in your area. Browse services below or use filters to narrow
            your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Respectful and professional service providers</li>
              <li>Read reviews from other families</li>
              <li>Compare services and options</li>
              <li>Find the right support during difficult times</li>
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
                  <Button
                    className="w-full md:w-auto"
                    onClick={() => handleOpenReviews("Peaceful Passages Funeral Home")}
                  >
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

      <ReviewsDialog
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        providerName={selectedProvider || ""}
        reviews={selectedProvider ? mockReviews[selectedProvider] || [] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}
