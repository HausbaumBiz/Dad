"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"

export default function ElderCarePage() {
  const filterOptions = [
    { id: "homecare1", label: "Non-Medical Elder Care", value: "Non-Medical Elder Care" },
    { id: "homecare2", label: "Non-Medical Special Needs Adult Care", value: "Non-Medical Special Needs Adult Care" },
    { id: "homecare3", label: "Assisted Living Facilities", value: "Assisted Living Facilities" },
    { id: "homecare4", label: "Memory Care", value: "Memory Care" },
    { id: "homecare5", label: "Respite Care", value: "Respite Care" },
    { id: "homecare6", label: "Nursing Homes", value: "Nursing Homes" },
    { id: "homecare7", label: "Hospice Care", value: "Hospice Care" },
    { id: "homecare8", label: "Adult Daycare", value: "Adult Daycare" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [selectedProviderId, setSelectedProviderId] = useState<string>("")

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // State for providers
  const [providers, setProviders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // Fetch businesses only once when component mounts
  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/businesses/by-category?category=elder-care")
        if (!response.ok) {
          throw new Error("Failed to fetch elder care businesses")
        }
        const data = await response.json()

        // Additional validation to filter out any legal services businesses
        const filteredBusinesses = (data.businesses || []).filter((business: any) => {
          if (!business) return false

          // Filter out any businesses that are clearly legal services
          const isLegalBusiness =
            business.category === "Lawyers" ||
            business.category === "Legal Services" ||
            (business.allCategories &&
              business.allCategories.some(
                (cat: string) =>
                  cat === "Lawyers" ||
                  cat === "Legal Services" ||
                  cat.toLowerCase().includes("lawyer") ||
                  cat.toLowerCase().includes("legal"),
              ))

          return !isLegalBusiness
        })

        setProviders(filteredBusinesses)

        // Log if we filtered out any businesses
        if (filteredBusinesses.length !== (data.businesses || []).length) {
          console.log(
            `Filtered out ${(data.businesses || []).length - filteredBusinesses.length} businesses that don't belong in Elder Care`,
          )
        }
      } catch (err) {
        console.error("Error fetching elder care businesses:", err)
        setError("Failed to load elder care businesses. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, []) // Empty dependency array means this runs once on mount

  // Mock reviews data
  const [reviewsData, setReviewsData] = useState<Record<string, any[]>>({})

  const fetchReviewsForProvider = async (providerId: string) => {
    try {
      const response = await fetch(`/api/businesses/${providerId}/reviews`)
      if (response.ok) {
        const data = await response.json()
        setReviewsData((prev) => ({
          ...prev,
          [providerId]: data.reviews || [],
        }))
      }
    } catch (err) {
      console.error("Error fetching reviews:", err)
    }
  }

  // Handler for opening reviews dialog
  const handleOpenReviews = (providerId: string, providerName: string) => {
    setSelectedProvider(providerName)
    setSelectedProviderId(providerId)
    setIsReviewsDialogOpen(true)

    // Fetch reviews if we don't have them yet
    if (!reviewsData[providerId]) {
      fetchReviewsForProvider(providerId)
    }
  }

  // Handler for opening business profile dialog
  const handleOpenProfile = (providerId: string, providerName: string) => {
    setSelectedProvider(providerName)
    setSelectedProviderId(providerId)
    setIsProfileDialogOpen(true)
  }

  // Filter providers based on selected filters - do this at render time
  const filteredProviders =
    selectedFilters.length > 0
      ? providers.filter((provider) => {
          const services = provider.allSubcategories || provider.services || []
          return selectedFilters.some((filter) => {
            const filterOption = filterOptions.find((option) => option.id === filter)
            return (
              filterOption &&
              services.some((service: string) => service.toLowerCase().includes(filterOption.value.toLowerCase()))
            )
          })
        })
      : providers

  // Simple filter button component to avoid using external CategoryFilter
  const FilterButton = ({
    id,
    label,
    isActive,
    onClick,
  }: { id: string; label: string; isActive: boolean; onClick: () => void }) => (
    <Button variant={isActive ? "default" : "outline"} size="sm" onClick={onClick} className="rounded-full">
      {label}
    </Button>
  )

  return (
    <CategoryLayout title="Elder Care Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/home%20health-zJyA419byhmD7tyJa0Ebmegg0XzFN3.png"
            alt="Elder Care Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find compassionate and professional elder care services in your area. Browse providers below or use filters
            to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Verified and background-checked caregivers</li>
              <li>Detailed provider profiles with qualifications</li>
              <li>Read reviews from families like yours</li>
              <li>Find care options that fit your specific needs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Filter by Service</h2>
          {selectedFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFilters([])}
              className="h-8 px-2 text-sm text-gray-500"
            >
              Clear filters
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <FilterButton
              key={option.id}
              id={option.id}
              label={option.label}
              isActive={selectedFilters.includes(option.id)}
              onClick={() => {
                setSelectedFilters((prev) =>
                  prev.includes(option.id) ? prev.filter((id) => id !== option.id) : [...prev, option.id],
                )
              }}
            />
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded text-sm"
          >
            Try Again
          </button>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
          {selectedFilters.length > 0 ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Providers Match Your Filters</h3>
              <p className="text-gray-600 mb-6">Try adjusting your filters to see more results.</p>
              <Button variant="outline" onClick={() => setSelectedFilters([])}>
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Elder Care Providers Found</h3>
              <p className="text-gray-600 mb-6">There are currently no elder care providers registered in this area.</p>
              <p className="text-sm text-gray-500">
                Are you an elder care provider?
                <a href="/business-register" className="text-primary hover:underline ml-1">
                  Register your business
                </a>
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.businessName || provider.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {provider.city && provider.state
                        ? `${provider.city}, ${provider.state}`
                        : provider.location || "Location not specified"}
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
                        {provider.rating || "No ratings"} ({provider.reviewCount || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(provider.allSubcategories || provider.services || []).map((service: string, idx: number) => (
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
                      onClick={() => handleOpenReviews(provider.id, provider.businessName || provider.name)}
                    >
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleOpenProfile(provider.id, provider.businessName || provider.name)}
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

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider}
        reviews={reviewsData[selectedProviderId] || []}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedProviderId}
        businessName={selectedProvider}
      />

      <Toaster />
    </CategoryLayout>
  )
}
