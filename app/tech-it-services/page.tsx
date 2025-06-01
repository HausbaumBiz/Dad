"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"

// Import the ReviewsDialog component
import { ReviewsDialog } from "@/components/reviews-dialog"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
// Replace this import
// import { getBusinessesByCategory } from "@/app/actions/business-actions"

// With this import
// import { getBusinessesBySelectedCategories } from "@/app/actions/business-category-fetcher"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"

export default function TechITServicesPage() {
  const filterOptions = [
    { id: "computers1", label: "Computer Network Specialists", value: "Computer Network Specialists" },
    { id: "computers2", label: "Database Administrators", value: "Database Administrators" },
    { id: "computers3", label: "Database Architects", value: "Database Architects" },
    { id: "computers4", label: "Computer Programmers", value: "Computer Programmers" },
    { id: "computers5", label: "Software Developers", value: "Software Developers" },
    { id: "computers6", label: "Website Developers", value: "Website Developers" },
    { id: "computers7", label: "Computer Security", value: "Computer Security" },
    { id: "computers8", label: "Blockchain and Crypto", value: "Blockchain and Crypto" },
    { id: "computers9", label: "Technology Consultants", value: "Technology Consultants" },
  ]

  // Add state variables for tracking the selected provider and dialog open state
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Replace the entire useEffect function with:
  useEffect(() => {
    async function fetchProviders() {
      try {
        setLoading(true)

        // Use the centralized system
        const businesses = await getBusinessesForCategoryPage("/tech-it-services")

        console.log(`Found ${businesses.length} tech businesses`)
        setProviders(businesses)
      } catch (err) {
        console.error("Error fetching tech providers:", err)
        setError("Failed to load providers")
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  // Add a handler function for opening the reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider({
      ...provider,
      reviews: provider.reviews || [],
    })
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Tech & IT Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/computer-KPP5QpYvz9S9ORgJKtPMWS2q7tYAGS.png"
            alt="Tech and IT Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified technology professionals in your area. Browse services below or use filters to narrow your
            search.
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

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tech providers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Tech Providers Yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first technology professional to join our platform and connect with clients in your area.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">Register Your Business</Button>
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
          reviews={selectedProvider?.reviews || []}
        />
      )}

      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />

      <Toaster />
    </CategoryLayout>
  )
}
