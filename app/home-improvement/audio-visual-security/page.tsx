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

export default function AudioVisualSecurityPage() {
  const filterOptions = [
    { id: "audiovisual1", label: "Smart Home Setup", value: "Smart Home Setup" },
    { id: "audiovisual2", label: "Home Security Solutions", value: "Home Security Solutions" },
    { id: "audiovisual3", label: "Cinema Room Setup", value: "Cinema Room Setup" },
    { id: "audiovisual4", label: "Telecommunication", value: "Telecommunication" },
    { id: "audiovisual5", label: "Cable/Satellite/Antenna Television", value: "Cable/Satellite/Antenna Television" },
    { id: "audiovisual6", label: "Computer Repair", value: "Computer Repair" },
    {
      id: "audiovisual7",
      label: "Other Audio/Visual and Home Security",
      value: "Other Audio/Visual and Home Security",
    },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // State for business profile dialog
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

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
        console.log("Fetching businesses for Audio/Visual and Home Security subcategory...")
        const result = await getBusinessesForSubcategory(
          "Home, Lawn, and Manual Labor > Audio/Visual and Home Security",
        )
        console.log(`Found ${result.length} total businesses for audio/visual security`)

        // If we have a zip code, filter by service area
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          const filteredBusinesses = []

          for (const business of result) {
            try {
              const response = await fetch(`/api/admin/business/${business.id}/service-area`)
              if (response.ok) {
                const serviceAreaData = await response.json()
                console.log(`Service area data for ${business.displayName}:`, {
                  zipCount: serviceAreaData.zipCodes?.length || 0,
                  isNationwide: serviceAreaData.isNationwide,
                  businessId: serviceAreaData.businessId,
                })

                // Check if business is nationwide
                if (serviceAreaData.isNationwide) {
                  console.log(`✅ ${business.displayName} services nationwide (including ${userZipCode})`)
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
                    console.log(`✅ ${business.displayName} services zip code ${userZipCode}`)
                    filteredBusinesses.push(business)
                  } else {
                    console.log(`❌ ${business.displayName} does not service zip code ${userZipCode}`)
                  }
                } else {
                  console.log(`⚠️ ${business.displayName} has no service area data, including by default`)
                  filteredBusinesses.push(business)
                }
              } else {
                console.log(`⚠️ Could not fetch service area for ${business.displayName}, including by default`)
                filteredBusinesses.push(business)
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName}:`, error)
              filteredBusinesses.push(business)
            }
          }

          console.log(`After zip code filtering: ${filteredBusinesses.length} businesses service ${userZipCode}`)
          setBusinesses(filteredBusinesses)
        } else {
          console.log("No user zip code available, showing all businesses")
          setBusinesses(result)
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

  // Function to handle opening business profile dialog
  const handleViewProfile = (business) => {
    setSelectedBusiness(business)
    setIsProfileDialogOpen(true)
  }

  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
    if (checked) {
      setSelectedFilters((prev) => [...prev, filterId])
    } else {
      setSelectedFilters((prev) => prev.filter((id) => id !== filterId))
    }
  }

  const clearFilters = () => {
    setSelectedFilters([])
  }

  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    const allSubcategories = subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        const parts = path.split(" > ")
        if (parts.length < 2) return null

        return parts[parts.length - 1].trim()
      })
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)

    console.log(`Processing ${subcategories.length} subcategories for service extraction`)
    return allSubcategories
  }

  const filteredBusinesses =
    selectedFilters.length === 0
      ? businesses
      : businesses.filter((business) => {
          const businessServices = getAllTerminalSubcategories(business.subcategories)

          const filterValues = selectedFilters.map((filterId) => {
            const option = filterOptions.find((opt) => opt.id === filterId)
            return option?.value || filterId
          })

          console.log(`Business ${business.displayName} services:`, businessServices)
          console.log(`Looking for filter values:`, filterValues)

          return filterValues.some((filterValue) =>
            businessServices.some(
              (service) =>
                service.toLowerCase().includes(filterValue.toLowerCase()) ||
                filterValue.toLowerCase().includes(service.toLowerCase()),
            ),
          )
        })

  console.log(`Applied filters: ${JSON.stringify(selectedFilters)}`)
  console.log(`Showing ${filteredBusinesses.length} of ${businesses.length} businesses`)

  return (
    <CategoryLayout title="Audio/Visual and Home Security" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                Filtering by {selectedFilters.length} service{selectedFilters.length > 1 ? "s" : ""}:{" "}
                {selectedFilters
                  .map((filterId) => {
                    const option = filterOptions.find((opt) => opt.id === filterId)
                    return option?.label || filterId
                  })
                  .join(", ")}
              </p>
              <p className="text-sm text-green-700">
                Showing {filteredBusinesses.length} of {businesses.length} businesses
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
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Audio/Visual & Security Services Found</h3>
            <p className="text-gray-600 mb-6">
              {userZipCode
                ? `We're currently building our network of AV and security specialists in the ${userZipCode} area.`
                : "Be the first AV and security specialist to join our platform and help local customers with their tech needs!"}
            </p>
            <Button>Register Your AV/Security Business</Button>
          </div>
        ) : (
          filteredBusinesses.map((business) => {
            const allServices = getAllTerminalSubcategories(business.subcategories)
            return (
              <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Business Info */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{business.displayName}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {business.displayLocation && (
                          <span className="flex items-center">
                            <span className="mr-1">📍</span>
                            {business.displayLocation}
                          </span>
                        )}
                        {business.displayPhone && (
                          <span className="flex items-center">
                            <span className="mr-1">📞</span>
                            {business.displayPhone}
                          </span>
                        )}
                      </div>
                      {allServices.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">Services ({allServices.length}):</p>
                          <div className="max-h-32 overflow-y-auto">
                            <div className="flex flex-wrap gap-2 mt-1">
                              {allServices.map((service, idx) => {
                                const filterValues = selectedFilters.map((filterId) => {
                                  const option = filterOptions.find((opt) => opt.id === filterId)
                                  return option?.value || filterId
                                })

                                const isHighlighted =
                                  selectedFilters.length > 0 &&
                                  filterValues.some(
                                    (filterValue) =>
                                      service.toLowerCase().includes(filterValue.toLowerCase()) ||
                                      filterValue.toLowerCase().includes(service.toLowerCase()),
                                  )

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
                            </div>
                          </div>
                          {allServices.length > 8 && (
                            <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Photo Carousel and Buttons */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Photo Carousel */}
                      <div className="flex-1">
                        <PhotoCarousel
                          businessId={business.id}
                          photos={businessPhotos[business.id] || []}
                          onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                          showMultiple={true}
                          photosPerView={5}
                          className="w-full"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-row lg:flex-col gap-2 lg:w-32">
                        <Button className="flex-1 lg:w-full" onClick={() => handleOpenReviews(business)}>
                          Ratings
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 lg:w-full bg-transparent"
                          onClick={() => handleViewProfile(business)}
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
        providerName={selectedProvider?.displayName}
        reviews={selectedProvider?.reviews || []}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusiness?.id}
        businessName={selectedBusiness?.displayName}
      />

      <Toaster />
    </CategoryLayout>
  )
}
