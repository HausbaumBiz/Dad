"use client"

import { useState, useEffect } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2 } from "lucide-react"

export default function RealEstatePage() {
  const filterOptions = [
    { id: "home1", label: "Real Estate Agent", value: "Real Estate Agent" },
    { id: "home2", label: "Real Estate Appraising", value: "Real Estate Appraising" },
    { id: "home3", label: "Home Staging", value: "Home Staging" },
    { id: "home4", label: "Home Inspection", value: "Home Inspection" },
    { id: "home5", label: "Home Energy Audit", value: "Home Energy Audit" },
    { id: "home6", label: "Other Home Buying and Selling", value: "Other Home Buying and Selling" },
  ]

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [providers, setProviders] = useState<any[]>([])
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const { toast } = useToast()

  // State for dialogs
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)

  // Fetch businesses when component mounts
  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/businesses/by-category?category=real-estate`)
        if (!response.ok) {
          throw new Error("Failed to fetch businesses")
        }
        const data = await response.json()
        setProviders(data.businesses || [])
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load real estate providers. Please try again later.")
        toast({
          title: "Error",
          description: "Failed to load real estate providers. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [toast])

  const handleFilterClick = (filter: string) => {
    setSelectedFilters((prev) => {
      if (prev.includes(filter)) {
        return prev.filter((f) => f !== filter)
      } else {
        return [...prev, filter]
      }
    })
  }

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  // Filter providers based on selected filters
  const filteredProviders =
    selectedFilters.length > 0
      ? providers.filter((provider) => {
          // Check if provider has any of the selected subcategories
          return selectedFilters.some((filter) => {
            return (
              provider.subcategory === filter ||
              (provider.allSubcategories && provider.allSubcategories.includes(filter))
            )
          })
        })
      : providers

  return (
    <CategoryLayout title="Home Buying and Selling" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/realestate002-uC3LlRrHqFBnFoowNNyWGD4WLtnTXj.png"
            alt="Real Estate Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified real estate professionals to help with buying or selling your home. Browse services below or
            use filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Licensed and experienced real estate professionals</li>
              <li>Read reviews from other clients</li>
              <li>Compare services and rates</li>
              <li>Find all the help you need in one place</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter UI */}
      <div className="mb-8">
        <h3 className="text-lg font-medium mb-3">Filter by Service:</h3>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleFilterClick(option.value)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedFilters.includes(option.value)
                  ? "bg-primary text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
            >
              {option.label}
            </button>
          ))}
          {selectedFilters.length > 0 && (
            <button
              onClick={() => setSelectedFilters([])}
              className="px-3 py-1.5 text-sm rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading real estate providers...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <p>{error}</p>
        </div>
      ) : filteredProviders.length > 0 ? (
        <div className="space-y-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.businessName || "Unnamed Business"}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {provider.city && provider.state
                        ? `${provider.city}, ${provider.state}`
                        : "Location not specified"}
                    </p>

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(provider.rating || 0) ? "text-yellow-400" : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating || "No ratings"} ({provider.reviewCount || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(provider.allSubcategories || []).map((service: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {service}
                          </span>
                        ))}
                        {(!provider.allSubcategories || provider.allSubcategories.length === 0) && (
                          <span className="text-sm text-gray-500 italic">No services specified</span>
                        )}
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
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-900 mb-2">No real estate providers found</h3>
          <p className="text-gray-500">
            {selectedFilters.length > 0
              ? "Try adjusting your filters or check back later."
              : "Check back soon or be the first to list your services!"}
          </p>
        </div>
      )}

      {selectedProvider && (
        <>
          <ReviewsDialog
            isOpen={isReviewsDialogOpen}
            onClose={() => setIsReviewsDialogOpen(false)}
            providerName={selectedProvider.businessName || "Business"}
            reviews={selectedProvider.reviews || []}
          />
          <BusinessProfileDialog
            isOpen={isProfileDialogOpen}
            onClose={() => setIsProfileDialogOpen(false)}
            businessId={selectedProvider.id}
            businessName={selectedProvider.businessName || "Business"}
          />
        </>
      )}

      <Toaster />
    </CategoryLayout>
  )
}
