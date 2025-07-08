"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useCallback } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { PhotoCarousel } from "@/components/photo-carousel"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

export default function LawnGardenPage() {
  const filterOptions = [
    { id: "lawn1", label: "Lawn & Landscaping", value: "Lawn & Landscaping" },
    { id: "lawn2", label: "Lawn Treatment", value: "Lawn Treatment" },
    { id: "lawn3", label: "Landscape Lighting", value: "Landscape Lighting" },
    { id: "lawn4", label: "Lawn Mower and Equipment Repair", value: "Lawn Mower and Equipment Repair" },
    { id: "lawn5", label: "Tree Service", value: "Tree Service" },
    { id: "lawn6", label: "Plant Nurseries", value: "Plant Nurseries" },
    { id: "lawn7", label: "Mulch Delivery", value: "Mulch Delivery" },
    { id: "lawn8", label: "Soil Tilling", value: "Soil Tilling" },
    { id: "lawn9", label: "Leaf Removal", value: "Leaf Removal" },
    { id: "lawn10", label: "Hardscaping", value: "Hardscaping" },
    { id: "lawn11", label: "Snow Removal", value: "Snow Removal" },
    { id: "lawn12", label: "Other Lawn, Garden and Snow Removal", value: "Other Lawn, Garden and Snow Removal" },
  ]

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: string[] }>({})

  // State for category filters
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

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

  // Handler for filter changes
  const handleFilterChange = (filterId: string, checked: boolean) => {
    setSelectedFilters((prev) => {
      if (checked) {
        return [...prev, filterId]
      } else {
        return prev.filter((id) => id !== filterId)
      }
    })
  }

  // Function to load photos for a business
  const loadPhotosForBusiness = async (businessId: string) => {
    if (businessPhotos[businessId]) return // Already loaded

    try {
      const photos = await loadBusinessPhotos(businessId)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: photos,
      }))
    } catch (error) {
      console.error(`Error loading photos for business ${businessId}:`, error)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: [],
      }))
    }
  }

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true)
      console.log("Fetching businesses for Lawn, Garden and Snow Removal subcategory with zip code filtering...")

      // Use the base path - the function will find all subcategories that start with this path
      const basePath = "Home, Lawn, and Manual Labor > Lawn, Garden and Snow Removal"
      const allBusinesses = await getBusinessesForSubcategory(basePath)

      console.log(`Found ${allBusinesses.length} total businesses for base path: ${basePath}`)

      let filteredBusinesses = allBusinesses

      // Filter by user's zip code if available
      if (userZipCode) {
        console.log(`Filtering businesses that service zip code: ${userZipCode}`)

        filteredBusinesses = []

        for (const business of allBusinesses) {
          try {
            // Check if business services the user's zip code
            const response = await fetch(`/api/admin/business/${business.id}/service-area`)

            if (response.ok) {
              const serviceAreaData = await response.json()
              console.log(`Service area data for ${business.displayName}:`, serviceAreaData)

              // Check if the user's zip code is in the business's service area
              if (serviceAreaData.zipCodes && Array.isArray(serviceAreaData.zipCodes)) {
                // Handle both possible data structures
                const servicesUserZip = serviceAreaData.zipCodes.some((zipData) => {
                  // Check if zipData is a string (just the zip code)
                  if (typeof zipData === "string") {
                    return zipData === userZipCode
                  }
                  // Check if zipData is an object with zip property
                  if (typeof zipData === "object" && zipData.zip) {
                    return zipData.zip === userZipCode
                  }
                  return false
                })

                if (servicesUserZip) {
                  console.log(`✅ ${business.displayName} services zip code ${userZipCode}`)
                  filteredBusinesses.push(business)
                } else {
                  console.log(`❌ ${business.displayName} does not service zip code ${userZipCode}`)
                  console.log(`Available zip codes:`, serviceAreaData.zipCodes)
                }
              } else if (serviceAreaData.isNationwide) {
                console.log(`✅ ${business.displayName} services nationwide (including ${userZipCode})`)
                filteredBusinesses.push(business)
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
            // Include business by default if there's an error
            filteredBusinesses.push(business)
          }
        }
      }

      console.log(`After zip code filtering: ${filteredBusinesses.length} businesses service ${userZipCode}`)
      setProviders(filteredBusinesses)
    } catch (err) {
      setError("Failed to load providers")
      console.error("Error fetching providers:", err)
    } finally {
      setLoading(false)
    }
  }, [userZipCode])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  // Helper function to extract ALL subcategories from ALL categories selected by the business
  const extractAllTerminalSubcategories = (subcategories) => {
    if (!subcategories || !Array.isArray(subcategories)) return []

    console.log("Raw subcategories data:", subcategories)

    const allSubcategories = subcategories
      .map((subcat) => {
        // Handle different data structures
        let fullPath = null

        if (typeof subcat === "string") {
          fullPath = subcat
        } else if (subcat?.fullPath) {
          fullPath = subcat.fullPath
        } else if (subcat?.subcategory && subcat?.category) {
          fullPath = `${subcat.category} > ${subcat.subcategory}`
        } else if (subcat?.name) {
          fullPath = subcat.name
        }

        if (!fullPath) {
          console.log("No fullPath found for subcategory:", subcat)
          return null
        }

        console.log("Processing fullPath:", fullPath)

        // Split by " > " and get the last part (terminal subcategory)
        const parts = fullPath.split(" > ")
        console.log("Path parts:", parts)

        // Always use the last part (most specific/terminal subcategory)
        const terminalSubcategory = parts[parts.length - 1].trim()
        console.log("Extracted terminal subcategory:", terminalSubcategory)
        return terminalSubcategory
      })
      .filter(Boolean) // Remove nulls and empty strings
      .filter((service, index, array) => array.indexOf(service) === index) // Remove duplicates

    console.log("Final extracted terminal subcategories:", allSubcategories)
    return allSubcategories
  }

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // State for business profile dialog
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // Handler for opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  // Handler for opening business profile dialog
  const handleViewProfile = (provider: any) => {
    setSelectedBusiness(provider)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Lawn, Garden and Snow Removal" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">Showing businesses that service: {userZipCode}</p>
              <p className="text-sm text-green-700">Only businesses available in your area are displayed</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Status Indicator */}
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Filtering by {selectedFilters.length} service{selectedFilters.length > 1 ? "s" : ""}
                </p>
                <p className="text-sm text-blue-700">
                  {selectedFilters
                    .map((filterId) => {
                      const option = filterOptions.find((opt) => opt.id === filterId)
                      return option?.label
                    })
                    .join(", ")}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFilters([])}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Clear Filters
            </Button>
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
      ) : providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lawn & Garden Services Found</h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `We're currently building our network of lawn, garden, and snow removal professionals in the ${userZipCode} area.`
                : "We're currently building our network of lawn, garden, and snow removal professionals in your area."}
            </p>
            <Button className="bg-green-600 hover:bg-green-700">Register Your Business</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {providers
            .filter((provider) => {
              // If no filters selected, show all providers
              if (selectedFilters.length === 0) return true

              // Get terminal subcategories for this provider
              const terminalSubcategories = extractAllTerminalSubcategories(provider.subcategories)

              // Get the filter values that are selected
              const selectedFilterValues = selectedFilters
                .map((filterId) => {
                  const option = filterOptions.find((opt) => opt.id === filterId)
                  return option?.value
                })
                .filter(Boolean)

              // Check if provider has any of the selected services
              return selectedFilterValues.some((filterValue) =>
                terminalSubcategories.some(
                  (service) =>
                    service.toLowerCase().includes(filterValue.toLowerCase()) ||
                    filterValue.toLowerCase().includes(service.toLowerCase()),
                ),
              )
            })
            .map((provider) => {
              const terminalSubcategories = extractAllTerminalSubcategories(provider.subcategories)

              return (
                <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      {/* Business Info Section - Compact */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">{provider.displayName}</h3>

                        {/* Contact Info Row */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span>{provider.displayLocation}</span>
                          {provider.displayPhone && (
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              <span>{provider.displayPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Services Tags */}
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Services ({terminalSubcategories.length}):
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {terminalSubcategories.length > 0 ? (
                              terminalSubcategories.slice(0, 4).map((service, idx) => {
                                // Highlight services that match selected filters
                                const isMatchingFilter =
                                  selectedFilters.length > 0 &&
                                  selectedFilters.some((filterId) => {
                                    const option = filterOptions.find((opt) => opt.id === filterId)
                                    const filterValue = option?.value
                                    return (
                                      filterValue &&
                                      (service.toLowerCase().includes(filterValue.toLowerCase()) ||
                                        filterValue.toLowerCase().includes(service.toLowerCase()))
                                    )
                                  })

                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                                      isMatchingFilter
                                        ? "bg-green-100 text-green-800 border-green-200 ring-2 ring-green-300"
                                        : "bg-blue-100 text-blue-800 border-blue-200"
                                    }`}
                                  >
                                    {service}
                                  </span>
                                )
                              })
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                                General Services
                              </span>
                            )}
                            {terminalSubcategories.length > 4 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                +{terminalSubcategories.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Photo Carousel and Buttons Row */}
                      <div className="flex flex-col lg:flex-row gap-4">
                        {/* Photo Carousel */}
                        <div className="flex-1">
                          <PhotoCarousel
                            businessId={provider.id}
                            photos={businessPhotos[provider.id] || []}
                            onLoadPhotos={() => loadPhotosForBusiness(provider.id)}
                            showMultiple={true}
                            photosPerView={5}
                          />
                        </div>

                        {/* Action Buttons */}
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
            })}
        </div>
      )}

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.displayName}
        reviews={selectedProvider ? [] : []}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusiness?.id || ""}
        businessName={selectedBusiness?.displayName || ""}
      />

      <Toaster />
    </CategoryLayout>
  )
}
