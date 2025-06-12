"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { useEffect } from "react"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getZipCode } from "@/lib/zip-code-db"

const filterOptions = [
  { id: "handymen1", label: "Odd Jobs and Repairs", value: "Odd Jobs and Repairs" },
  { id: "handymen2", label: "Product Assembly", value: "Product Assembly" },
  { id: "handymen3", label: "Other Handymen", value: "Other Handymen" },
]

export default function HandymenPage() {
  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Add after the reviews dialog state
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<any[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([])

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined)

  // Add this function:
  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    return subcategories
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
    // Remove the .slice(0, 4) limit to show all subcategories
  }

  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
    setSelectedFilters((prev) => (checked ? [...prev, filterId] : prev.filter((id) => id !== filterId)))
  }

  const clearFilters = () => {
    setSelectedFilters([])
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

      try {
        setLoading(true)
        setError(null)

        console.log("Fetching businesses for subcategory: Home, Lawn, and Manual Labor > Handymen")
        const allBusinessesData = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Handymen")
        console.log(`Found ${allBusinessesData.length} total handymen businesses`)

        // If we have a zip code, filter by service area
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          const filteredBusinessesByZip = []

          for (const business of allBusinessesData) {
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
                  filteredBusinessesByZip.push(business)
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
                    filteredBusinessesByZip.push(business)
                  } else {
                    console.log(
                      `❌ ${business.displayName || business.businessName} does not service zip code ${userZipCode}`,
                    )
                  }
                } else {
                  console.log(
                    `⚠️ ${business.displayName || business.businessName} has no service area data, including by default`,
                  )
                  filteredBusinessesByZip.push(business)
                }
              } else {
                console.log(
                  `⚠️ Could not fetch service area for ${business.displayName || business.businessName}, including by default`,
                )
                filteredBusinessesByZip.push(business)
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName || business.businessName}:`, error)
              filteredBusinessesByZip.push(business)
            }
          }

          console.log(`After zip code filtering: ${filteredBusinessesByZip.length} businesses service ${userZipCode}`)

          // Transform the data for display with city/state lookup
          const transformedBusinesses = await Promise.all(
            filteredBusinessesByZip.map(async (business: any) => {
              // Extract service tags from subcategories
              // Add this improved function that shows all terminal subcategories

              // Fetch city and state from ZIP code database
              let location = "Service Area"

              // First try to use ad design location if available
              if (business.adDesignData?.businessInfo?.city && business.adDesignData?.businessInfo?.state) {
                location = `${business.adDesignData.businessInfo.city}, ${business.adDesignData.businessInfo.state}`
              }
              // Otherwise, look up ZIP code in database
              else if (business.zipCode) {
                try {
                  console.log(`Looking up ZIP code ${business.zipCode} for business ${business.id}`)
                  const zipData = await getZipCode(business.zipCode)
                  if (zipData && zipData.city && zipData.state) {
                    location = `${zipData.city}, ${zipData.state}`
                    console.log(`Found location for ${business.zipCode}: ${location}`)
                  } else {
                    console.log(`No ZIP data found for ${business.zipCode}, using ZIP code as fallback`)
                    location = `Zip: ${business.zipCode}`
                  }
                } catch (zipError) {
                  console.error(`Error looking up ZIP code ${business.zipCode}:`, zipError)
                  location = `Zip: ${business.zipCode}`
                }
              }
              // Fallback to display location if available
              else if (business.displayLocation) {
                location = business.displayLocation
              }

              return {
                id: business.id,
                name:
                  business.displayName ||
                  business.adDesignData?.businessInfo?.businessName ||
                  business.businessName ||
                  "Business Name",
                location: location,
                rating: business.rating || 0,
                reviews: business.reviewCount || 0,
                services: business.subcategories,
                phone: business.displayPhone || business.adDesignData?.businessInfo?.phone || business.phone,
              }
            }),
          )

          setAllBusinesses(transformedBusinesses)
        } else {
          console.log("No user zip code available, showing all businesses")

          // Transform the data for display with city/state lookup
          const transformedBusinesses = await Promise.all(
            allBusinessesData.map(async (business: any) => {
              // Extract service tags from subcategories
              // Add this improved function that shows all terminal subcategories

              // Fetch city and state from ZIP code database
              let location = "Service Area"

              // First try to use ad design location if available
              if (business.adDesignData?.businessInfo?.city && business.adDesignData?.businessInfo?.state) {
                location = `${business.adDesignData.businessInfo.city}, ${business.adDesignData.businessInfo.state}`
              }
              // Otherwise, look up ZIP code in database
              else if (business.zipCode) {
                try {
                  console.log(`Looking up ZIP code ${business.zipCode} for business ${business.id}`)
                  const zipData = await getZipCode(business.zipCode)
                  if (zipData && zipData.city && zipData.state) {
                    location = `${zipData.city}, ${zipData.state}`
                    console.log(`Found location for ${business.zipCode}: ${location}`)
                  } else {
                    console.log(`No ZIP data found for ${business.zipCode}, using ZIP code as fallback`)
                    location = `Zip: ${business.zipCode}`
                  }
                } catch (zipError) {
                  console.error(`Error looking up ZIP code ${business.zipCode}:`, zipError)
                  location = `Zip: ${business.zipCode}`
                }
              }
              // Fallback to display location if available
              else if (business.displayLocation) {
                location = business.displayLocation
              }

              return {
                id: business.id,
                name:
                  business.displayName ||
                  business.adDesignData?.businessInfo?.businessName ||
                  business.businessName ||
                  "Business Name",
                location: location,
                rating: business.rating || 0,
                reviews: business.reviewCount || 0,
                services: business.subcategories,
                phone: business.displayPhone || business.adDesignData?.businessInfo?.phone || business.phone,
              }
            }),
          )

          setAllBusinesses(transformedBusinesses)
        }
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  // Filter businesses based on selected filters
  useEffect(() => {
    if (selectedFilters.length === 0) {
      setFilteredBusinesses(allBusinesses)
      return
    }

    // Convert filter IDs to filter values
    const filterValues = selectedFilters
      .map((filterId) => {
        const option = filterOptions.find((opt) => opt.id === filterId)
        return option?.value
      })
      .filter(Boolean)

    console.log("Looking for filter values:", filterValues)

    const filtered = allBusinesses.filter((business) => {
      const businessServices = getAllTerminalSubcategories(business.services || [])

      return filterValues.some((filterValue) => businessServices.some((service) => service === filterValue))
    })

    setFilteredBusinesses(filtered)
  }, [selectedFilters, allBusinesses])

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  // Function to handle opening profile dialog
  const handleViewProfile = (provider: any) => {
    console.log("Opening profile for business:", provider.id, provider.name)
    setSelectedBusinessId(provider.id)
    setSelectedBusinessName(provider.name)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Handymen" backLink="/home-improvement" backText="Home Improvement">
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
                    return option?.value
                  })
                  .join(", ")}
              </p>
              <p className="text-sm text-green-600">
                Showing {filteredBusinesses.length} of {allBusinesses.length} businesses
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
            <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Handymen Found</h3>
            <p className="text-gray-600 mb-6">
              Be the first handyman to join our platform and connect with local customers!
            </p>
            <Button>Register Your Handyman Business</Button>
          </div>
        ) : (
          filteredBusinesses.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${provider.reviews > 0 && i < Math.floor(provider.rating) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.reviews > 0
                          ? `${provider.rating} (${provider.reviews} ${provider.reviews === 1 ? "review" : "reviews"})`
                          : "No reviews yet"}
                      </span>
                    </div>

                    {provider.phone && <p className="text-sm text-gray-600 mt-1">📞 {provider.phone}</p>}

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        Services ({getAllTerminalSubcategories(provider.services || []).length}):
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto">
                        {getAllTerminalSubcategories(provider.services || []).map((service, idx) => {
                          const filterValues = selectedFilters
                            .map((filterId) => {
                              const option = filterOptions.find((opt) => opt.id === filterId)
                              return option?.value
                            })
                            .filter(Boolean)

                          const isHighlighted = filterValues.includes(service)

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
                      {getAllTerminalSubcategories(provider.services || []).length > 8 && (
                        <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
                      )}
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
        provider={selectedProvider}
        reviews={selectedProvider?.reviews || []}
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
