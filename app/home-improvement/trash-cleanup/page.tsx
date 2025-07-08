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
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

export default function TrashCleanupPage() {
  const filterOptions = [
    { id: "trash1", label: "Biohazard Cleanup", value: "Biohazard Cleanup" },
    { id: "trash2", label: "Dumpster Rental", value: "Dumpster Rental" },
    {
      id: "trash3",
      label: "Hauling/Old Furniture and Appliance Removal",
      value: "Hauling/Old Furniture and Appliance Removal",
    },
    { id: "trash4", label: "Document Shredding", value: "Document Shredding" },
    { id: "trash5", label: "Trash/Junk Removal", value: "Trash/Junk Removal" },
    { id: "trash6", label: "Other Trash Cleanup and Removal", value: "Other Trash Cleanup and Removal" },
  ]

  // State for filtering
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined)

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for business photos
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: string[] }>({})

  // Function to load photos for a specific business
  const loadPhotosForBusiness = async (businessId: string) => {
    if (businessPhotos[businessId]) return // Already loaded

    try {
      const photos = await loadBusinessPhotos(businessId)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: photos,
      }))
    } catch (error) {
      console.error(`Failed to load photos for business ${businessId}:`, error)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: [],
      }))
    }
  }

  // Updated function to display ALL terminal subcategories
  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    const allSubcategories = subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        // Extract the specific service name (last part after the last >)
        const parts = path.split(" > ")

        // Skip if it's just a top-level category
        if (parts.length < 2) return null

        // Get the terminal subcategory (most specific service)
        return parts[parts.length - 1]
      })
      .filter(Boolean) // Remove nulls
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

    console.log(`Extracted ${allSubcategories.length} unique subcategories for display`)
    return allSubcategories
  }

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

  // Filter change handler
  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
    if (checked) {
      setSelectedFilters((prev) => [...prev, filterId])
    } else {
      setSelectedFilters((prev) => prev.filter((id) => id !== filterId))
    }
  }

  // Clear filters
  const clearFilters = () => {
    setSelectedFilters([])
  }

  // Get filter values from IDs
  const getFilterValues = (filterIds: string[]) => {
    return filterIds.map((id) => {
      const option = filterOptions.find((opt) => opt.id === id)
      return option ? option.value : id
    })
  }

  // Filter businesses based on selected filters
  const filteredBusinesses =
    selectedFilters.length === 0
      ? providers
      : providers.filter((provider) => {
          const businessServices = getAllTerminalSubcategories(provider.businessData.subcategories)
          const filterValues = getFilterValues(selectedFilters)

          console.log(`Business ${provider.name} services:`, businessServices)
          console.log("Looking for filter values:", filterValues)

          return businessServices.some((service) => filterValues.some((filterValue) => service === filterValue))
        })

  useEffect(() => {
    async function fetchBusinesses() {
      if (userZipCode === undefined) return // Wait until zip code is loaded (even if null)

      setLoading(true)
      try {
        console.log("Fetching trash cleanup businesses with subcategory path...")
        const result = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Trash Cleanup and Removal")
        console.log(`Found ${result.length} total trash cleanup businesses`)

        // If we have a zip code, filter by service area
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          const filteredBusinesses = []

          for (const business of result) {
            try {
              const response = await fetch(`/api/admin/business/${business.id}/service-area`)
              if (response.ok) {
                const serviceAreaData = await response.json()
                console.log(`Service area data for ${business.displayName || business.businessName}:`, {
                  zipCount: serviceAreaData.zipCodes?.length || 0,
                  isNationwide: serviceAreaData.isNationwide,
                  businessId: serviceAreaData.businessId,
                })

                // Check if business is nationwide
                if (serviceAreaData.isNationwide) {
                  console.log(
                    `✅ ${business.displayName || business.businessName} services nationwide (including ${userZipCode})`,
                  )
                  filteredBusinesses.push(business)
                  continue
                }

                // Check if the user's zip code is in the business's service area
                if (serviceAreaData.zipCodes && Array.isArray(serviceAreaData.zipCodes)) {
                  const servicesUserZip = serviceAreaData.zipCodes.some((zipData) => {
                    // Handle both string and object formats
                    const zipCode = typeof zipData === "string" ? zipData : zipData?.zip
                    return zipCode === userZipCode
                  })

                  if (servicesUserZip) {
                    console.log(`✅ ${business.displayName || business.businessName} services zip code ${userZipCode}`)
                    filteredBusinesses.push(business)
                  } else {
                    console.log(
                      `❌ ${business.displayName || business.businessName} does not service zip code ${userZipCode}`,
                    )
                  }
                } else {
                  console.log(
                    `⚠️ ${business.displayName || business.businessName} has no service area data, including by default`,
                  )
                  filteredBusinesses.push(business)
                }
              } else {
                console.log(
                  `⚠️ Could not fetch service area for ${business.displayName || business.businessName}, including by default`,
                )
                filteredBusinesses.push(business)
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName || business.businessName}:`, error)
              filteredBusinesses.push(business)
            }
          }

          console.log(`After zip code filtering: ${filteredBusinesses.length} businesses service ${userZipCode}`)

          // Transform the data for display
          const transformedProviders = filteredBusinesses.map((business) => {
            return {
              id: business.id,
              name: business.displayName || business.businessName,
              location: business.displayLocation || `${business.city || ""}, ${business.state || ""}`,
              phone: business.displayPhone || business.phone,
              rating: business.rating || 0,
              reviews: business.reviewCount || 0,
              services: [],
              // Keep the original business data for the profile dialog
              businessData: business,
            }
          })

          setProviders(transformedProviders)
        } else {
          console.log("No user zip code available, showing all businesses")

          // Transform the data for display
          const transformedProviders = result.map((business) => {
            return {
              id: business.id,
              name: business.displayName || business.businessName,
              location: business.displayLocation || `${business.city || ""}, ${business.state || ""}`,
              phone: business.displayPhone || business.phone,
              rating: business.rating || 0,
              reviews: business.reviewCount || 0,
              services: [],
              // Keep the original business data for the profile dialog
              businessData: business,
            }
          })

          setProviders(transformedProviders)
        }
      } catch (error) {
        console.error("Error fetching businesses:", error)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [userZipCode])

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

  console.log("Applied filters:", selectedFilters)
  console.log(`Showing ${filteredBusinesses.length} of ${providers.length} businesses`)

  return (
    <CategoryLayout title="Trash Cleanup and Removal" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Filter Status */}
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Filtering by {selectedFilters.length} service{selectedFilters.length > 1 ? "s" : ""}:{" "}
                {getFilterValues(selectedFilters).join(", ")}
              </p>
              <p className="text-sm text-blue-700">
                Showing {filteredBusinesses.length} of {providers.length} businesses
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}

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
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedFilters.length > 0 ? "No Matching Services Found" : "No Trash & Cleanup Services Found"}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedFilters.length > 0
                ? `No businesses match the selected filters: ${getFilterValues(selectedFilters).join(", ")}`
                : userZipCode
                  ? `We're currently building our network of trash cleanup services in the ${userZipCode} area.`
                  : "Be the first cleanup service to join our platform and help local customers with their waste removal needs!"}
            </p>
            {selectedFilters.length > 0 ? (
              <Button onClick={clearFilters}>Clear Filters</Button>
            ) : (
              <Button>Register Your Cleanup Business</Button>
            )}
          </div>
        ) : (
          filteredBusinesses.map((provider) => {
            const allServices = getAllTerminalSubcategories(provider.businessData.subcategories)
            const filterValues = getFilterValues(selectedFilters)

            return (
              <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-4">
                    {/* Business Info */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{provider.name}</h3>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {provider.location && (
                          <div className="flex items-center">
                            <span>📍 {provider.location}</span>
                          </div>
                        )}
                        {provider.phone && (
                          <div className="flex items-center">
                            <span>📞 {provider.phone}</span>
                          </div>
                        )}
                      </div>

                      {allServices.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Services ({allServices.length}):</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {allServices.slice(0, 4).map((service, idx) => {
                              const isHighlighted =
                                selectedFilters.length > 0 &&
                                filterValues.some((filterValue) => service === filterValue)
                              return (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                    isHighlighted
                                      ? "bg-green-100 text-green-800 ring-2 ring-green-300"
                                      : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  {service}
                                </span>
                              )
                            })}
                            {allServices.length > 4 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{allServices.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Photo Carousel and Buttons */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <PhotoCarousel
                          businessId={provider.id}
                          photos={businessPhotos[provider.id] || []}
                          onLoadPhotos={() => loadPhotosForBusiness(provider.id)}
                          showMultiple={true}
                          photosPerView={5}
                          className="w-full"
                        />
                      </div>

                      <div className="flex flex-row lg:flex-col gap-2 lg:w-32">
                        <Button className="flex-1 lg:flex-none" onClick={() => handleOpenReviews(provider)}>
                          Reviews
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 lg:flex-none bg-transparent"
                          onClick={() => handleViewProfile(provider)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
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
