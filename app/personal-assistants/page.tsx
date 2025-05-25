"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { useState } from "react"
import { getBusinessesByCategory } from "@/app/actions/business-actions"
import { useEffect } from "react"

export default function PersonalAssistantsPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)

  const mockReviews = {
    "Elite Personal Assistants": [
      {
        id: 1,
        username: "Jonathan M.",
        rating: 5,
        comment:
          "My assistant from Elite has been a game-changer for my busy schedule. Incredibly organized and proactive.",
        date: "2023-12-10",
      },
      {
        id: 2,
        username: "Rebecca S.",
        rating: 4,
        comment:
          "Professional service that has helped me reclaim hours in my week. My assistant anticipates my needs perfectly.",
        date: "2023-11-15",
      },
      {
        id: 3,
        username: "Andrew P.",
        rating: 5,
        comment:
          "The level of detail and efficiency is outstanding. My assistant handles everything from travel arrangements to personal errands flawlessly.",
        date: "2023-10-20",
      },
    ],
    "Executive Support Services": [
      {
        id: 1,
        username: "Victoria L.",
        rating: 5,
        comment:
          "Executive Support Services matched me with the perfect assistant who understands my business needs and personal preferences.",
        date: "2023-12-05",
      },
      {
        id: 2,
        username: "Daniel R.",
        rating: 4,
        comment:
          "Reliable and professional. My assistant has excellent communication skills and handles all tasks promptly.",
        date: "2023-11-08",
      },
      {
        id: 3,
        username: "Sophia T.",
        rating: 5,
        comment:
          "Having an assistant from Executive Support has transformed my productivity. Worth every penny for the time saved.",
        date: "2023-10-12",
      },
    ],
    "Concierge Assistants": [
      {
        id: 1,
        username: "Christopher B.",
        rating: 5,
        comment:
          "The concierge service is exceptional. My assistant handles everything from dinner reservations to gift shopping with style and efficiency.",
        date: "2023-12-15",
      },
      {
        id: 2,
        username: "Olivia W.",
        rating: 4,
        comment: "Very responsive and attentive to details. My assistant has made my life so much easier.",
        date: "2023-11-20",
      },
      {
        id: 3,
        username: "Matthew K.",
        rating: 5,
        comment: "Excellent service that goes above and beyond. My assistant anticipates my needs and always delivers.",
        date: "2023-10-25",
      },
    ],
    "Virtual Assistant Pro": [
      {
        id: 1,
        username: "Emma J.",
        rating: 5,
        comment:
          "My virtual assistant is incredibly efficient and has streamlined all my administrative tasks. Excellent communication.",
        date: "2023-12-08",
      },
      {
        id: 2,
        username: "Nathan F.",
        rating: 4,
        comment:
          "Great value for the service provided. My VA handles my email, scheduling, and research tasks perfectly.",
        date: "2023-11-12",
      },
      {
        id: 3,
        username: "Isabella M.",
        rating: 5,
        comment:
          "Working with my virtual assistant has been seamless. They're responsive, detail-oriented, and very professional.",
        date: "2023-10-18",
      },
    ],
  }

  const handleOpenReviews = (providerName: string) => {
    setSelectedProvider(providerName)
    setIsReviewsOpen(true)
  }

  const filterOptions = [
    { id: "assistants1", label: "Personal Drivers", value: "Personal Drivers" },
    { id: "assistants2", label: "Personal Assistants", value: "Personal Assistants" },
    { id: "assistants3", label: "Companions", value: "Companions" },
    { id: "assistants4", label: "Personal Secretaries", value: "Personal Secretaries" },
    { id: "assistants5", label: "Personal Shoppers", value: "Personal Shoppers" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Remove the mock providers state and replace with real data fetching
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        setError(null)

        // Try multiple category formats to find businesses
        const categoryVariants = [
          "Personal Assistants",
          "personal-assistants",
          "Personal Services",
          "Assistant Services",
        ]

        let allBusinesses: any[] = []

        for (const category of categoryVariants) {
          try {
            const businesses = await getBusinessesByCategory(category)
            if (businesses && businesses.length > 0) {
              allBusinesses = [...allBusinesses, ...businesses]
            }
          } catch (err) {
            console.log(`No businesses found for category: ${category}`)
          }
        }

        // Remove duplicates based on business ID
        const uniqueBusinesses = allBusinesses.filter(
          (business, index, self) => index === self.findIndex((b) => b.id === business.id),
        )

        setProviders(uniqueBusinesses)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  const handleOpenReviewsOld = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Personal Assistants" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/assistant-YGJCy1KrgYFG9a6r1XgV5abefXkzCB.png"
            alt="Personal Assistants"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find reliable personal assistants and support professionals in your area. Browse services below or use
            filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Vetted and experienced personal assistants</li>
              <li>Read reviews from other clients</li>
              <li>Compare services and rates</li>
              <li>Find the perfect match for your personal needs</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading personal assistants...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Personal Assistants Yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first personal assistant service to join our platform and connect with clients in your area.
            </p>
            <Button className="bg-indigo-600 hover:bg-indigo-700">Register Your Service</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.location || "Location not specified"}</p>

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(provider.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating || 0} ({provider.reviewCount || 0} reviews)
                      </span>
                    </div>

                    {provider.services && provider.services.length > 0 && (
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
                    )}
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider.name)}>
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
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsOpen}
          onClose={() => setIsReviewsOpen(false)}
          providerName={selectedProvider || ""}
          reviews={selectedProvider ? mockReviews[selectedProvider] || [] : []}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
