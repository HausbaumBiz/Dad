"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { getBusinessesByCategory } from "@/app/actions/business-actions"

export default function TravelVacationPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProviders() {
      try {
        setLoading(true)
        const categoryVariants = [
          "Travel & Vacation Services",
          "Travel and Vacation Services",
          "Travel Services",
          "Vacation Services",
          "Travel",
        ]

        let allProviders: any[] = []
        for (const category of categoryVariants) {
          try {
            const businesses = await getBusinessesByCategory(category)
            if (businesses && businesses.length > 0) {
              allProviders = [...allProviders, ...businesses]
            }
          } catch (err) {
            console.log(`No businesses found for category: ${category}`)
          }
        }

        setProviders(allProviders)
      } catch (err) {
        setError("Failed to load providers")
        console.error("Error fetching providers:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  const filterOptions = [
    { id: "travel1", label: "Tour and Travel Guides", value: "Tour and Travel Guides" },
    { id: "travel2", label: "Travel Agents", value: "Travel Agents" },
    { id: "travel3", label: "Car Rental", value: "Car Rental" },
    { id: "travel4", label: "Boat Rental", value: "Boat Rental" },
    { id: "travel5", label: "RV Rental", value: "RV Rental" },
    { id: "travel6", label: "Airport Pick-up and Drop-off Services", value: "Airport Pick-up and Drop-off Services" },
    { id: "travel7", label: "Hotels, Motels, and Resorts", value: "Hotels, Motels, and Resorts" },
    { id: "travel8", label: "Bed and Breakfast", value: "Bed and Breakfast" },
    { id: "travel9", label: "Airbnb", value: "Airbnb" },
    { id: "travel10", label: "Camp Grounds and Cabins", value: "Camp Grounds and Cabins" },
  ]

  const handleOpenReviews = (providerName: string) => {
    setSelectedProvider(providerName)
    setIsReviewsOpen(true)
  }

  return (
    <CategoryLayout title="Travel & Vacation Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/travel%20agent-2swsPk7s1rFb3Cehv2GXYkYhwXFXwd.png"
            alt="Travel and Vacation"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified travel and vacation professionals in your area. Browse services below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read reviews from other customers</li>
              <li>View business videos showcasing work and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you'd trust to hire yourself</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Travel Services Found</h3>
            <p className="text-gray-600 mb-4">
              We're currently building our network of travel and vacation service professionals in your area.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">Register Your Business</Button>
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

      <ReviewsDialog
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        providerName={selectedProvider || ""}
        reviews={selectedProvider ? [] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}
