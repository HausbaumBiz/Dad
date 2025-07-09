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
import { Phone } from "lucide-react"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

export default function PoolServicesPage() {
  const filterOptions = [
    { id: "pool1", label: "Swimming Pool Installers/Builders", value: "Swimming Pool Installers/Builders" },
    { id: "pool2", label: "Swimming Pool Maintenance/Cleaning", value: "Swimming Pool Maintenance/Cleaning" },
    { id: "pool3", label: "Other Pool Services", value: "Other Pool Services" },
  ]

  // State for businesses
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Add this state variable with the other state declarations
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // State for dialogs
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [selectedBusinessName, setSelectedBusinessName] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // State for photos
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, any[]>>({})

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

  // Updated function to display ALL terminal subcategories instead of limiting to 4
  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    console.log(`Processing ${subcategories.length} subcategories for display`)

    const allServices = subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        // Extract the specific service name (last part after the last >)
        const parts = path.split(" > ")

        // Skip if it's just a top-level category
        if (parts.length < 2) return null

        // Get the terminal subcategory (most specific service)
        const terminalService = parts[parts.length - 1]
        console.log(`Extracted terminal service: ${terminalService}`)
        return terminalService
      })
      .filter(Boolean) // Remove nulls
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

    console.log(`Final services to display: ${allServices.length}`, allServices)
    return allServices // Removed .slice(0, 4) to show ALL services
  }

  // Handler for filter changes
  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
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

  // Filter businesses based on selected filters
  const filteredBusinesses =
    selectedFilters.length === 0
      ? businesses
      : businesses.filter((business) => {
          const businessServices = getAllTerminalSubcategories(business.subcategories)
          return selectedFilters.some((filterId) => {
            const filterLabel = filterOptions.find((opt) => opt.id === filterId)?.label || filterId
            return businessServices.some(
              (service) =>
                service.toLowerCase().includes(filterLabel.toLowerCase()) ||
                filterLabel.toLowerCase().includes(service.toLowerCase()),
            )
          })
        })

  console.log(`Filtered businesses: ${filteredBusinesses.length} of ${businesses.length}`)

  // The subcategory path to search for
  const subcategoryPath = "Home, Lawn, and Manual Labor > Pool Services"

  // Add this useEffect after the other state declarations
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
    console.log("Opening profile for:", business.id, business.displayName)
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.displayName)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Pool Services" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Filter Status Indicator */}
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Filtering by {selectedFilters.length} service{selectedFilters.length > 1 ? "s" : ""}:{" "}
                {selectedFilters
                  .map((filterId) => filterOptions.find((opt) => opt.id === filterId)?.label || filterId)
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
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pool Services Found</h3>
          <p className="text-gray-600 mb-4">
            {userZipCode
              ? `We're currently building our network of pool service professionals in the ${userZipCode} area.`
              : "We're currently building our network of pool service professionals in your area."}
          </p>
          <Button>Register Your Business</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  {/* Business Info Section - Compact */}
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

                    {/* Services Tags */}
                    {(() => {
                      const services = getAllTerminalSubcategories(business.subcategories)

                      return (
                        <div className="space-y-2">
                          {services.length > 0 ? (
                            <div
                              className={`flex flex-wrap gap-2 ${services.length > 8 ? "max-h-32 overflow-y-auto" : ""}`}
                            >
                              {services.map((service, idx) => {
                                // Check if this service matches any selected filter
                                const isHighlighted = selectedFilters.some((filterId) => {
                                  const filterLabel =
                                    filterOptions.find((opt) => opt.id === filterId)?.label || filterId
                                  return (
                                    service.toLowerCase().includes(filterLabel.toLowerCase()) ||
                                    filterLabel.toLowerCase().includes(service.toLowerCase())
                                  )
                                })

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
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                Pool Services
                              </span>
                            </div>
                          )}
                          {services.length > 8 && (
                            <p className="text-xs text-gray-500 italic">Scroll to see more services</p>
                          )}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Photos and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Photo Carousel */}
                    <div className="flex-1">
                      <PhotoCarousel
                        businessId={business.id}
                        photos={businessPhotos[business.id] || []}
                        onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                        showMultiple={true}
                        photosPerView={5}
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
