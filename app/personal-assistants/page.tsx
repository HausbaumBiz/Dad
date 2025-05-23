"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"

export default function PersonalAssistantsPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)

  const filterOptions = [
    { id: "assistants1", label: "Personal Drivers", value: "Personal Drivers" },
    { id: "assistants2", label: "Personal Assistants", value: "Personal Assistants" },
    { id: "assistants3", label: "Companions", value: "Companions" },
    { id: "assistants4", label: "Personal Secretaries", value: "Personal Secretaries" },
    { id: "assistants5", label: "Personal Shoppers", value: "Personal Shoppers" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProviderData, setSelectedProviderData] = useState<{
    id: number
    name: string
    reviews: any[]
    businessData: any
  } | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // State for providers
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch businesses
  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/businesses/by-page?page=personal-assistants")
        if (response.ok) {
          const data = await response.json()
          if (data.businesses && data.businesses.length > 0) {
            console.log(`Found ${data.businesses.length} businesses for personal-assistants page`)

            // Process business details
            const businessDetails = data.businesses.map((business: any) => {
              // Extract services from subcategories or use default
              let services = []
              if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
                services = business.allSubcategories
              } else if (business.subcategory) {
                services = [business.subcategory]
              }

              return {
                id: business.id,
                name: business.businessName || business.name || "Unknown Business",
                services: services,
                rating: business.rating || (Math.random() * 1 + 4).toFixed(1), // Random rating between 4.0 and 5.0
                reviews: business.reviewCount || Math.floor(Math.random() * 50) + 10, // Random review count
                location: business.city ? `${business.city}, ${business.state || "OH"}` : "Ohio",
                reviewsData: business.reviews || [], // Use actual reviews if available
                businessData: business, // Store the full business data
              }
            })

            setProviders(businessDetails)
          } else {
            console.log("No businesses found for personal-assistants page")
            setProviders([])
          }
        } else {
          console.error("Error fetching businesses:", response.statusText)
          setError("Failed to load businesses. Please try again later.")
          setProviders([])
        }
      } catch (error) {
        console.error("Error fetching businesses:", error)
        setError("An unexpected error occurred. Please try again later.")
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  const handleOpenReviews = (provider: any) => {
    setSelectedProviderData(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedProviderData(provider)
    setIsProfileDialogOpen(true)
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
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading personal assistants...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No personal assistants found in your area.</p>
          <p className="text-gray-500 mb-6">Be the first to list your personal assistant services!</p>
          <Button onClick={() => (window.location.href = "/business-register")}>Register Your Business</Button>
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
                            className={`w-4 h-4 ${i < Math.floor(Number(provider.rating)) ? "text-yellow-400" : "text-gray-300"}`}
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
                        {provider.services.map((service: string, idx: number) => (
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
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleOpenProfile(provider)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProviderData && (
        <>
          <ReviewsDialog
            isOpen={isReviewsDialogOpen}
            onClose={() => setIsReviewsDialogOpen(false)}
            providerName={selectedProviderData.name}
            reviews={selectedProviderData.reviewsData || []}
          />

          {isProfileDialogOpen && (
            <BusinessProfileDialog
              isOpen={isProfileDialogOpen}
              onClose={() => setIsProfileDialogOpen(false)}
              business={selectedProviderData.businessData}
            />
          )}
        </>
      )}

      <Toaster />
    </CategoryLayout>
  )
}
