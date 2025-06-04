"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"

export default function PestControlPage() {
  const filterOptions = [
    { id: "pest1", label: "Rodent/Small Animal Infestations", value: "Rodent/Small Animal Infestations" },
    { id: "pest2", label: "Wildlife Removal", value: "Wildlife Removal" },
    { id: "pest3", label: "Insect and Bug Control", value: "Insect and Bug Control" },
    { id: "pest4", label: "Other Pest Control/Wildlife Removal", value: "Other Pest Control/Wildlife Removal" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined)

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
      console.log(`User zip code loaded: ${savedZipCode}`)
    } else {
      console.log("No user zip code found in localStorage")
      setUserZipCode(null)
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      if (userZipCode === undefined) return // Wait until zip code is loaded (even if null)

      setLoading(true)
      try {
        console.log("Fetching pest control businesses...")

        // Use the more efficient category-based approach
        let result = []

        if (userZipCode) {
          // Fetch businesses by category and zip code efficiently
          console.log(`Fetching businesses for pest control category in zip code: ${userZipCode}`)

          // Try to get businesses using the category mapping system
          result = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Pest Control/Wildlife Removal")

          // Filter businesses that serve the user's zip code
          const filteredBusinesses = []

          for (const business of result) {
            // Check if business serves this zip code
            try {
              const response = await fetch(`/api/admin/business/${business.id}/service-area`)
              if (response.ok) {
                const serviceAreaData = await response.json()

                // Check if business is nationwide or serves the specific zip
                if (serviceAreaData.isNationwide) {
                  filteredBusinesses.push(business)
                } else if (serviceAreaData.zipCodes && Array.isArray(serviceAreaData.zipCodes)) {
                  const servicesUserZip = serviceAreaData.zipCodes.some((zipData) => {
                    const zipCode = typeof zipData === "string" ? zipData : zipData?.zip
                    return zipCode === userZipCode
                  })

                  if (servicesUserZip) {
                    filteredBusinesses.push(business)
                  }
                }
              } else {
                // If we can't check service area, include the business
                filteredBusinesses.push(business)
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName}:`, error)
              filteredBusinesses.push(business)
            }
          }

          result = filteredBusinesses
          console.log(`After filtering by zip code ${userZipCode}: ${result.length} businesses found`)
        } else {
          // No zip code, show all pest control businesses
          console.log("No user zip code, fetching all pest control businesses")
          result = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Pest Control/Wildlife Removal")
        }

        console.log(`Found ${result.length} total pest control businesses`)

        // Transform the data for display
        const transformedProviders = result.map((business) => {
          // Extract service tags from subcategories
          const serviceTags = getServiceTags(business.subcategories || [])

          return {
            id: business.id,
            name: business.displayName || business.businessName,
            location:
              business.displayLocation ||
              `${business.city || ""}, ${business.state || ""}`.trim().replace(/^,|,$/g, "") ||
              "Location not specified",
            phone: business.displayPhone || business.phone,
            rating: business.rating || 4.5,
            reviews: business.reviewCount || 0,
            services: serviceTags.length > 0 ? serviceTags : ["Pest Control"],
            // Keep the original business data for the profile dialog
            businessData: business,
          }
        })

        setProviders(transformedProviders)
      } catch (error) {
        console.error("Error fetching businesses:", error)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  // Extract service tags from subcategories - improved version
  const getServiceTags = (subcategories) => {
    if (!subcategories || subcategories.length === 0) {
      return ["Pest Control"]
    }

    return subcategories
      .filter((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        return path && path.includes("Pest Control/Wildlife Removal")
      })
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return "Pest Control"

        const parts = path.split(" > ")
        const serviceName = parts[parts.length - 1]

        // Map to user-friendly names
        const serviceMap = {
          "Rodent/Small Animal Infestations": "Rodent Control",
          "Wildlife Removal": "Wildlife Removal",
          "Insect and Bug Control": "Insect Control",
          "Other Pest Control/Wildlife Removal": "General Pest Control",
        }

        return serviceMap[serviceName] || serviceName || "Pest Control"
      })
      .filter((service, index, array) => array.indexOf(service) === index) // Remove duplicates
      .slice(0, 3) // Limit to 3 for display
  }

  // Handle opening reviews dialog
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
    <CategoryLayout title="Pest Control/Wildlife Removal" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} />

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Showing businesses that service: {userZipCode}</p>
              <p className="text-sm text-blue-700">Only businesses available in your area are displayed</p>
            </div>
          </div>
        </div>
      )}

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
            <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pest Control Services Found</h3>
            <p className="text-gray-600 mb-6">
              {userZipCode
                ? `We're currently building our network of pest control services in the ${userZipCode} area.`
                : "Be the first pest control service to join our platform and help local customers with their pest problems!"}
            </p>
            <Button>Register Your Pest Control Business</Button>
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
                            Pest Control
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
