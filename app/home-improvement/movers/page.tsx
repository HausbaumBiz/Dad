"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function MoversPage() {
  const filterOptions = [
    { id: "movers1", label: "Moving Truck Rental", value: "Moving Truck Rental" },
    { id: "movers2", label: "Piano Movers", value: "Piano Movers" },
    { id: "movers3", label: "Movers", value: "Movers" },
    { id: "movers4", label: "Other Movers/Moving Trucks", value: "Other Movers/Moving Trucks" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // State for providers
  const [providers, setProviders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch providers from API
  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/businesses/by-page?page=home-improvement-movers`)
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const data = await response.json()
        setProviders(data.businesses || [])
      } catch (err) {
        console.error("Error fetching providers:", err)
        setError("Failed to load businesses. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProviders()
  }, [])

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Movers/Moving Trucks" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">No moving businesses found.</p>
          <p className="text-gray-500 mb-4">Be the first to register your business in this category!</p>
          <Button asChild>
            <a href="/business-register">Register Your Business</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.business_name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {provider.city}, {provider.state}
                    </p>

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
                        {provider.rating || "No ratings"} ({provider.reviews?.length || 0} reviews)
                      </span>
                    </div>

                    {provider.categories && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {provider.categories.map((category: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button
                      className="w-full md:w-auto"
                      onClick={() => handleOpenReviews(provider)}
                      disabled={!provider.reviews || provider.reviews.length === 0}
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
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.business_name}
          reviews={selectedProvider.reviews || []}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
