"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { PhotoCarousel } from "@/components/photo-carousel"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"
import { getBusinessAdDesign } from "@/app/actions/business-actions"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { Phone } from "lucide-react"

export default function ConstructionDesignPage() {
  const filterOptions = [
    { id: "homeconstruction1", label: "General Contractors", value: "General Contractors" },
    { id: "homeconstruction2", label: "Architect", value: "Architect" },
    { id: "homeconstruction3", label: "Home Remodeling", value: "Home Remodeling" },
    { id: "homeconstruction4", label: "Demolition", value: "Demolition" },
    { id: "homeconstruction5", label: "Excavating/Earth Moving", value: "Excavating/Earth Moving" },
    { id: "homeconstruction6", label: "Land Surveyors", value: "Land Surveyors" },
    {
      id: "homeconstruction7",
      label: "Other Home Construction and Design",
      value: "Other Home Construction and Design",
    },
  ]

  // Helper to extract service names from full paths
  const getAllTerminalSubcategories = (subcategories) => {
    if (!subcategories || !Array.isArray(subcategories)) return []

    console.log(`Processing ${subcategories.length} subcategories for service extraction`)

    return subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        // Extract the specific service name (last part after the last >)
        const parts = path.split(" > ")

        // Skip if it's just a top-level category
        if (parts.length < 2) return null

        // Get the terminal subcategory (most specific service)
        return parts[parts.length - 1].trim()
      })
      .filter(Boolean) // Remove nulls
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates
  }

  // State for businesses
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined) // Start as undefined

  // State for filtering
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // State for dialogs
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [selectedBusinessName, setSelectedBusinessName] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // State for photos
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: string[] }>({})

  // Function to load photos for a specific business
  const loadPhotosForBusiness = async (businessId: string) => {
    if (businessPhotos[businessId]) {
      return // Already loaded
    }

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

  // The subcategory path to search for
  const subcategoryPath = "Home, Lawn, and Manual Labor > Home Construction and Design"

  // Filter handlers
  const handleFilterChange = (filterId: string, isChecked: boolean) => {
    console.log(`Filter change: ${filterId} = ${isChecked}`)
    setSelectedFilters((prev) => {
      if (isChecked) {
        return [...prev, filterId]
      } else {
        return prev.filter((f) => f !== filterId)
      }
    })
  }

  const clearFilters = () => {
    console.log("Clearing all filters")
    setSelectedFilters([])
  }

  // Filter businesses based on selected filters
  const filteredBusinesses =
    selectedFilters.length === 0
      ? businesses
      : businesses.filter((business) => {
          const businessServices = getAllTerminalSubcategories(business.subcategories)

          // Convert filter IDs to filter values for matching
          const selectedFilterValues = selectedFilters.map((filterId) => {
            const filterOption = filterOptions.find((option) => option.id === filterId)
            return filterOption ? filterOption.value : filterId
          })

          console.log(`Business ${business.displayName} services:`, businessServices)
          console.log(`Looking for matches with:`, selectedFilterValues)

          return selectedFilterValues.some((filterValue) =>
            businessServices.some(
              (service) =>
                service.toLowerCase().includes(filterValue.toLowerCase()) ||
                filterValue.toLowerCase().includes(service.toLowerCase()),
            ),
          )
        })

  console.log(`Applied filters: ${JSON.stringify(selectedFilters)}`)
  console.log(`Showing ${filteredBusinesses.length} of ${businesses.length} businesses`)

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
      console.log(`User zip code loaded: ${savedZipCode}`)
    } else {
      setUserZipCode(null) // Set to null instead of leaving undefined
      console.log("No user zip code found in localStorage")
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        console.log(`Fetching businesses for ${subcategoryPath} subcategory with zip code filtering...`)

        const result = await getBusinessesForSubcategory(subcategoryPath)
        console.log(`Found ${result.length} total businesses for base path: ${subcategoryPath}`)

        let filteredBusinesses = result

        // Filter by user's zip code if available
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          filteredBusinesses = []

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
                    console.log(
                      `Available zip codes:`,
                      serviceAreaData.zipCodes.slice(0, 10).map((z) => (typeof z === "string" ? z : z?.zip)),
                    )
                  }
                } else {
                  console.log(`⚠️ ${business.displayName} has no service area data, excluding by default`)
                }
              } else {
                console.log(`⚠️ Could not fetch service area for ${business.displayName}, excluding by default`)
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName}:`, error)
            }
          }
        }
        console.log(`After zip code filtering: ${filteredBusinesses.length} businesses service ${userZipCode}`)

        // Fetch ad design data for each business to get phone numbers
        const enhancedBusinesses = await Promise.all(
          filteredBusinesses.map(async (business) => {
            try {
              // Fetch ad design data from Redis
              const adDesignData = await getBusinessAdDesign(business.id)
              console.log(`Fetched ad design data for business ${business.id}:`, adDesignData)

              // Extract phone number from ad design data if available
              let displayPhone = null
              if (adDesignData?.businessInfo?.phone) {
                displayPhone = adDesignData.businessInfo.phone
                console.log(`Found phone from ad design: ${displayPhone}`)
              } else if (business.phone) {
                displayPhone = business.phone
                console.log(`Using registration phone: ${displayPhone}`)
              } else {
                console.log(`No phone found for business ${business.id}`)
              }

              return {
                ...business,
                displayPhone,
                adDesignData,
              }
            } catch (err) {
              console.error(`Error fetching ad design data for business ${business.id}:`, err)
              return {
                ...business,
                displayPhone: business.phone || null,
              }
            }
          }),
        )

        setBusinesses(enhancedBusinesses)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have loaded the userZipCode state (even if it's null)
    // This prevents the race condition
    if (userZipCode !== undefined) {
      fetchBusinesses()
    }
  }, [subcategoryPath, userZipCode])

  // Handler for opening reviews dialog
  const handleOpenReviews = (business) => {
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.displayName)
    setIsReviewsDialogOpen(true)
  }

  // Handler for opening profile dialog
  const handleViewProfile = (business) => {
    console.log("Opening profile for business:", business.id, business.displayName)
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.displayName)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Home Construction and Design" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Filter Status */}
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Filtering by {selectedFilters.length} service{selectedFilters.length !== 1 ? "s" : ""}:{" "}
                {selectedFilters
                  .map((filterId) => {
                    const filterOption = filterOptions.find((option) => option.id === filterId)
                    return filterOption ? filterOption.value : filterId
                  })
                  .join(", ")}
              </p>
              <p className="text-sm text-blue-700">
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
          <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Construction & Design Services Found</h3>
          <p className="text-gray-600 mb-4">
            {userZipCode
              ? `We're currently building our network of construction & design professionals in the ${userZipCode} area.`
              : "Be the first contractor or designer to join our platform!"}
          </p>
          <Button>Register Your Business</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Business Info Section */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{business.displayName}</h3>

                    {/* Contact Info Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>{business.displayLocation}</span>
                      {business.displayPhone && (
                        <div className="flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          <span>{business.displayPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Services Tags - Display All Services */}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Services ({getAllTerminalSubcategories(business.subcategories).length}):
                      </p>
                      <div className="max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                          {getAllTerminalSubcategories(business.subcategories).map((service, idx) => {
                            // Convert filter IDs to filter values for highlighting
                            const selectedFilterValues = selectedFilters.map((filterId) => {
                              const filterOption = filterOptions.find((option) => option.id === filterId)
                              return filterOption ? filterOption.value : filterId
                            })

                            const isHighlighted = selectedFilterValues.some(
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
                        {getAllTerminalSubcategories(business.subcategories).length > 8 && (
                          <p className="text-xs text-gray-500 mt-2">Scroll to see more services</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Photo Carousel and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
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
          ))}
        </div>
      )}

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedBusinessName}
        reviews={[]}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusinessId}
        businessName={selectedBusinessName}
      />

      <Toaster />
    </CategoryLayout>
  )
}
