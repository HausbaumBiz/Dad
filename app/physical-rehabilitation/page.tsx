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

export default function PhysicalRehabilitationPage() {
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProviders() {
      try {
        setLoading(true)
        const categoryVariants = [
          "Physical Rehabilitation",
          "Physical Therapists",
          "Occupational Therapists",
          "Massage Therapists",
          "Speech-Language Pathologists",
        ]

        let allProviders: any[] = []
        for (const category of categoryVariants) {
          try {
            const result = await getBusinessesByCategory(category)
            if (result.success && result.businesses) {
              allProviders = [...allProviders, ...result.businesses]
            }
          } catch (err) {
            console.warn(`Failed to fetch businesses for category: ${category}`)
          }
        }

        // Remove duplicates based on business ID
        const uniqueProviders = allProviders.filter(
          (provider, index, self) => index === self.findIndex((p) => p.id === provider.id),
        )

        setProviders(uniqueProviders)
      } catch (err) {
        console.error("Error fetching rehabilitation providers:", err)
        setError("Failed to load providers")
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

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

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider({
      ...provider,
      reviewsData: provider.reviews || [],
    })
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
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading rehabilitation providers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Rehabilitation Providers Yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first rehabilitation professional to join our platform and connect with patients in your area.
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700">Register Your Practice</Button>
            </div>
          </div>
        ) : (
          providers.map((provider) => (
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
          ))
        )}
      </div>

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          reviews={selectedProvider?.reviewsData || []}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
