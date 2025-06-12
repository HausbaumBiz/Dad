"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"

// Define filter options outside the component to prevent re-creation on every render
const filterOptions = [
  { id: "movers1", label: "Moving Truck Rental", value: "Moving Truck Rental" },
  { id: "movers2", label: "Piano Movers", value: "Piano Movers" },
  { id: "movers3", label: "Movers", value: "Movers" },
  { id: "movers4", label: "Other Movers/Moving Trucks", value: "Other Movers/Moving Trucks" },
]

export default function MoversPage() {
  // Function to extract terminal subcategories
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
  }

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // State for business profile dialog
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // State for businesses and filtering
  const [allBusinesses, setAllBusinesses] = useState<any[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([])
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined)

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

  // Fetch businesses
  useEffect(() => {
    async function fetchBusinesses() {
      if (userZipCode === undefined) return // Wait until zip code is loaded (even if null)

      try {
        setLoading(true)
        setError(null)

        console.log("Fetching businesses for subcategory: Home, Lawn, and Manual Labor > Movers/Moving Trucks")
        const businesses = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Movers/Moving Trucks")
        console.log(`Found ${businesses.length} total businesses for movers/moving trucks`)

        // If we have a zip code, filter by service area
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          const filteredByZip = []

          for (const business of businesses) {
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
                  filteredByZip.push(business)
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
                    filteredByZip.push(business)
                  } else {
                    console.log(
                      `❌ ${business.displayName || business.businessName} does not service zip code ${userZipCode}`,
                    )
                  }
                } else {
                  console.log(
                    `⚠️ ${business.displayName || business.businessName} has no service area data, including by default`,
                  )
                  filteredByZip.push(business)
                }
              } else {
                console.log(
                  `⚠️ Could not fetch service area for ${business.displayName || business.businessName}, including by default`,
                )
                filteredByZip.push(business)
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName || business.businessName}:`, error)
              filteredByZip.push(business)
            }
          }

          console.log(`After zip code filtering: ${filteredByZip.length} businesses service ${userZipCode}`)

          // Transform the data for display
          const transformedBusinesses = filteredByZip.map((business: any) => {
            return {
              id: business.id,
              name: business.displayName || business.businessName || "Business Name",
              location: business.displayLocation || "Service Area",
              rating: business.rating || 0,
              reviews: business.reviewCount || 0,
              phone: business.displayPhone,
              subcategories: business.subcategories,
            }
          })

          setAllBusinesses(transformedBusinesses)
          setFilteredBusinesses(transformedBusinesses)
        } else {
          console.log("No user zip code available, showing all businesses")

          // Transform the data for display
          const transformedBusinesses = businesses.map((business: any) => {
            return {
              id: business.id,
              name: business.displayName || business.businessName || "Business Name",
              location: business.displayLocation || "Service Area",
              rating: business.rating || 0,
              reviews: business.reviewCount || 0,
              phone: business.displayPhone,
              subcategories: business.subcategories,
            }
          })

          setAllBusinesses(transformedBusinesses)
          setFilteredBusinesses(transformedBusinesses)
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

    // Map filter IDs to filter values
    const filterValues = selectedFilters
      .map((filterId) => {
        const filter = filterOptions.find((option) => option.id === filterId)
        return filter ? filter.value : null
      })
      .filter(Boolean)

    console.log("Applied filters:", selectedFilters)
    console.log("Looking for filter values:", filterValues)

    const filtered = allBusinesses.filter((business) => {
      const services = getAllTerminalSubcategories(business.subcategories || [])
      console.log(`Business ${business.name} services:`, services)

      // Check if any service matches any filter
      return services.some((service) => filterValues.some((filterValue) => service === filterValue))
    })

    console.log(`Showing ${filtered.length} of ${allBusinesses.length} businesses`)
    setFilteredBusinesses(filtered)
  }, [selectedFilters, allBusinesses])

  // Function to handle filter changes
  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
    setSelectedFilters((prev) => {
      if (checked) {
        return [...prev, filterId]
      } else {
        return prev.filter((id) => id !== filterId)
      }
    })
  }

  // Function to clear all filters
  const clearFilters = () => {
    setSelectedFilters([])
  }

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  // Function to handle opening profile dialog
  const handleViewProfile = (provider: any) => {
    console.log("Opening profile for provider:", provider)
    setSelectedBusinessId(provider.id)
    setSelectedBusinessName(provider.name)
    setIsProfileDialogOpen(true)
  }

  // Function to check if a service matches any selected filter
  const isServiceMatched = (service: string) => {
    if (selectedFilters.length === 0) return false

    const filterValues = selectedFilters
      .map((filterId) => {
        const filter = filterOptions.find((option) => option.id === filterId)
        return filter ? filter.value : null
      })
      .filter(Boolean)

    return filterValues.some((filterValue) => service === filterValue)
  }

  return (
    <CategoryLayout title="Movers/Moving Trucks" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Filter Status */}
      {selectedFilters.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
          <div>
            <span className="font-medium">
              Filtering by {selectedFilters.length} {selectedFilters.length === 1 ? "service" : "services"}:
            </span>{" "}
            {selectedFilters
              .map((filterId) => {
                const filter = filterOptions.find((option) => option.id === filterId)
                return filter ? filter.label : null
              })
              .filter(Boolean)
              .join(", ")}
            <div className="text-sm text-blue-700">
              Showing {filteredBusinesses.length} of {allBusinesses.length} businesses
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
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
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedFilters.length > 0 ? "No Moving Services Match Your Filters" : "No Moving Services Found"}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedFilters.length > 0
                ? "Try adjusting your filter selections or clearing filters to see more results."
                : userZipCode
                  ? `We're currently building our network of moving services in the ${userZipCode} area.`
                  : "Be the first moving company to join our platform and help local customers with their moves!"}
            </p>
            {selectedFilters.length > 0 && (
              <Button onClick={clearFilters} className="mb-4">
                Clear Filters
              </Button>
            )}
            <Button variant="outline">Register Your Moving Business</Button>
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
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
                        Services ({getAllTerminalSubcategories(provider.subcategories || []).length}):
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto">
                        {getAllTerminalSubcategories(provider.subcategories || []).map((service, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                              ${
                                isServiceMatched(service)
                                  ? "bg-green-100 text-green-800 ring-1 ring-green-400"
                                  : "bg-primary/10 text-primary"
                              }`}
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                      {getAllTerminalSubcategories(provider.subcategories || []).length > 8 && (
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
