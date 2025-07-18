"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForSubcategory } from "@/lib/business-category-service"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

export default function OutdoorStructuresPage() {
  // Define the getAllTerminalSubcategories function first to avoid initialization errors
  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    // Log the total number of subcategories
    console.log(`Processing ${subcategories.length} subcategories for business`)

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

  const filterOptions = [
    { id: "structure1", label: "Deck/Patio/Porch Construction", value: "Deck/Patio/Porch Construction" },
    { id: "structure2", label: "Patio and Patio Enclosures", value: "Patio and Patio Enclosures" },
    { id: "structure3", label: "Exterior Cooking Areas", value: "Exterior Cooking Areas" },
    { id: "structure4", label: "Awnings/Canopies", value: "Awnings/Canopies" },
    {
      id: "structure5",
      label: "Playground Equipment Installation/Basketball Hoops",
      value: "Playground Equipment Installation/Basketball Hoops",
    },
    { id: "structure6", label: "Fountains and Waterscaping", value: "Fountains and Waterscaping" },
    { id: "structure7", label: "Pond Construction", value: "Pond Construction" },
    { id: "structure8", label: "Solar Panel Installation", value: "Solar Panel Installation" },
    { id: "structure9", label: "Power Generator Installation", value: "Power Generator Installation" },
    { id: "structure10", label: "Driveway Gate Installation", value: "Driveway Gate Installation" },
    { id: "structure11", label: "Earthquake Retrofitting", value: "Earthquake Retrofitting" },
    { id: "structure12", label: "Mailbox Installation/Repair", value: "Mailbox Installation/Repair" },
    { id: "structure13", label: "Fences", value: "Fences" },
    {
      id: "structure14",
      label: "Other Outdoor Structure Assembly/Construction and Fencing",
      value: "Other Outdoor Structure Assembly/Construction and Fencing",
    },
  ]

  // Add state for selected filters
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // Handler for filter changes
  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter changed: ${filterId} = ${checked}`)
    if (checked) {
      setSelectedFilters((prev) => [...prev, filterId])
    } else {
      setSelectedFilters((prev) => prev.filter((id) => id !== filterId))
    }
  }

  // Handler to clear all filters
  const clearFilters = () => {
    setSelectedFilters([])
  }

  // State for businesses
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // State for business photos
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

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

  // Filter businesses based on selected filters
  const filteredBusinesses = businesses.filter((business) => {
    // If no filters selected, show all businesses
    if (selectedFilters.length === 0) return true

    // Get all terminal subcategories for this business
    const businessServices = getAllTerminalSubcategories(business.subcategories)

    // Check if any of the business services match any of the selected filters
    return selectedFilters.some((filterId) => {
      const filterValue = filterOptions.find((option) => option.id === filterId)?.value
      if (!filterValue) return false

      // Check if any business service contains the filter value or vice versa (case insensitive)
      return businessServices.some(
        (service) =>
          service.toLowerCase().includes(filterValue.toLowerCase()) ||
          filterValue.toLowerCase().includes(service.toLowerCase()),
      )
    })
  })

  // State for dialogs
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [selectedBusinessName, setSelectedBusinessName] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // The subcategory path to search for
  const subcategoryPath = "Home, Lawn, and Manual Labor > Outdoor Structure Assembly/Construction and Fencing"

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
      console.log(`User zip code loaded: ${savedZipCode}`)
    } else {
      console.log("No user zip code found in localStorage")
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        console.log(`Fetching businesses for ${subcategoryPath} subcategory with zip code filtering...`)

        const allBusinesses = await getBusinessesForSubcategory(subcategoryPath)
        console.log(`Found ${allBusinesses.length} total businesses for base path: ${subcategoryPath}`)

        let filteredBusinesses = allBusinesses

        // Filter by user's zip code if available
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          filteredBusinesses = []

          for (const business of allBusinesses) {
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
        } else {
          console.log("No user zip code available, showing all businesses")
        }

        console.log(`Enhanced ${filteredBusinesses.length} businesses with ad design data`)
        setBusinesses(filteredBusinesses)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [subcategoryPath, userZipCode])

  // Handler for opening reviews dialog
  const handleOpenReviews = (business) => {
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.displayName)
    setIsReviewsDialogOpen(true)
  }

  // Handler for opening profile dialog
  const handleViewProfile = (business) => {
    console.log(`Opening profile for business ${business.id}: ${business.displayName}`)
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.displayName)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout
      title="Outdoor Structure Assembly/Construction and Fencing"
      backLink="/home-improvement"
      backText="Home Improvement"
    >
      <div className="mb-6">
        <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

        {/* Filter status indicator */}
        {selectedFilters.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-md mb-4">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Filtering by {selectedFilters.length} {selectedFilters.length === 1 ? "service" : "services"}:
                {selectedFilters
                  .map((id) => {
                    const label = filterOptions.find((opt) => opt.id === id)?.label
                    return label ? ` ${label}` : ""
                  })
                  .join(", ")}
              </p>
              <p className="text-xs text-blue-600">
                Showing {filteredBusinesses.length} of {businesses.length} businesses
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="text-sm bg-white px-3 py-1 rounded border border-blue-300 hover:bg-blue-50"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Showing businesses that service: {userZipCode}</p>
              <p className="text-sm text-amber-700">Only businesses available in your area are displayed</p>
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
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matching Outdoor Structure Services Found</h3>
            <p className="text-gray-600 mb-4">
              {selectedFilters.length > 0
                ? "No businesses match your selected filters. Try selecting different services or clear the filters."
                : userZipCode
                  ? `We're currently building our network of outdoor construction and fencing professionals in the ${userZipCode} area.`
                  : "We're currently building our network of outdoor construction and fencing professionals in your area."}
            </p>
            {selectedFilters.length > 0 && (
              <Button onClick={clearFilters} className="mb-4">
                Clear Filters
              </Button>
            )}
            <Button className="bg-amber-600 hover:bg-amber-700">Register Your Business</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{business.displayName}</h3>

                    {/* Combined location, phone, and service area in one row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>{business.displayLocation}</span>
                      {business.displayPhone && (
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 text-gray-500 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span>{business.displayPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Services - show only 4 with +X more indicator */}
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Services ({getAllTerminalSubcategories(business.subcategories).length}):
                      </p>
                      <div
                        className={`flex flex-wrap gap-1 ${getAllTerminalSubcategories(business.subcategories).length > 8 ? "max-h-32 overflow-y-auto" : ""}`}
                      >
                        {getAllTerminalSubcategories(business.subcategories).length > 0 ? (
                          getAllTerminalSubcategories(business.subcategories).map((service, idx) => {
                            const isMatched =
                              selectedFilters.length > 0 &&
                              selectedFilters.some((filterId) => {
                                const filterValue = filterOptions.find((opt) => opt.id === filterId)?.value
                                return (
                                  filterValue &&
                                  (service.toLowerCase().includes(filterValue.toLowerCase()) ||
                                    filterValue.toLowerCase().includes(service.toLowerCase()))
                                )
                              })

                            return (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                                    ${isMatched ? "bg-green-100 text-green-800 ring-1 ring-green-400" : "bg-primary/10 text-primary"}`}
                              >
                                {service}
                              </span>
                            )
                          })
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Outdoor Structure Construction
                          </span>
                        )}
                      </div>
                      {getAllTerminalSubcategories(business.subcategories).length > 8 && (
                        <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
                      )}
                    </div>
                  </div>

                  {/* Photo Carousel and Buttons Row */}
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
                      <Button className="flex-1 lg:flex-none" onClick={() => handleOpenReviews(business)}>
                        Ratings
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 lg:flex-none bg-transparent"
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
