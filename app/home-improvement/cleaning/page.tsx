"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useEffect } from "react"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"

export default function CleaningPage() {
  const filterOptions = [
    { id: "cleaning1", label: "House Cleaning", value: "House Cleaning" },
    { id: "cleaning2", label: "Office Cleaning", value: "Office Cleaning" },
    { id: "cleaning3", label: "Window Cleaning", value: "Window Cleaning" },
    { id: "cleaning4", label: "Deep Carpet and Floor Cleaning", value: "Deep Carpet and Floor Cleaning" },
    { id: "cleaning5", label: "Other Home and Office Cleaning", value: "Other Home and Office Cleaning" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true)
      try {
        console.log("Fetching cleaning businesses with subcategory path...")
        const result = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Home and Office Cleaning")

        // Transform the data for display
        const transformedProviders = result.map((business) => {
          // Extract service tags from subcategories
          const serviceTags = getServiceTags(business.subcategories || [])

          return {
            id: business.id,
            name: business.displayName || business.businessName,
            location: business.displayLocation || `${business.city || ""}, ${business.state || ""}`,
            phone: business.displayPhone || business.phone,
            rating: business.rating || 4.5,
            reviews: business.reviewCount || 0,
            services: serviceTags,
            // Keep the original business data for the profile dialog
            businessData: business,
          }
        })

        setProviders(transformedProviders)
        console.log(`Found ${transformedProviders.length} cleaning businesses`)
      } catch (error) {
        console.error("Error fetching businesses:", error)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  // Extract service tags from subcategories
  const getServiceTags = (subcategories) => {
    return subcategories
      .filter((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        return path && path.includes("Home and Office Cleaning")
      })
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return "Cleaning Services"

        const parts = path.split(" > ")
        return parts[parts.length - 1] // Get just the service name
      })
      .slice(0, 3) // Limit to 3 for display
  }

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  // Handle opening profile dialog
  const handleViewProfile = (provider) => {
    setSelectedBusiness(provider.businessData)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Home and Office Cleaning" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} />

      <div className="space-y-6">
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
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Cleaning Services Found</h3>
            <p className="text-gray-600 mb-6">
              Be the first cleaning service to join our platform and help local customers keep their spaces spotless!
            </p>
            <Button>Register Your Cleaning Business</Button>
          </div>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

                    {provider.phone && <p className="text-gray-600 text-sm mt-1">{provider.phone}</p>}

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
                        {provider.services.length > 0 ? (
                          provider.services.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Cleaning Services
                          </span>
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
                      onClick={() => handleViewProfile(provider)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name}
        reviews={selectedProvider?.reviews || []}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusiness?.id}
        businessName={selectedBusiness?.displayName || selectedBusiness?.businessName}
      />

      <Toaster />
    </CategoryLayout>
  )
}
