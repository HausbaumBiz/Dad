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

export default function InsideMaintenancePage() {
  const filterOptions = [
    { id: "inside1", label: "Electricians", value: "Electricians" },
    { id: "inside2", label: "Plumbers", value: "Plumbers" },
    {
      id: "inside3",
      label: "Heating, Ventilation, and Air Conditioning Services",
      value: "Heating, Ventilation, and Air Conditioning Services",
    },
    {
      id: "inside4",
      label: "Appliance Repair and Installation",
      value: "Appliance Repair and Installation",
    },
    { id: "inside5", label: "Indoor Painting", value: "Indoor Painting" },
    { id: "inside6", label: "Drywalling and Repair", value: "Drywalling and Repair" },
    { id: "inside7", label: "Marble & Granite", value: "Marble & Granite" },
    { id: "inside8", label: "Water Softeners", value: "Water Softeners" },
    { id: "inside9", label: "Water Heaters", value: "Water Heaters" },
    { id: "inside10", label: "Insulation", value: "Insulation" },
    { id: "inside11", label: "Air Duct Cleaning", value: "Air Duct Cleaning" },
    { id: "inside12", label: "Dryer Duct Cleaning", value: "Dryer Duct Cleaning" },
    { id: "inside13", label: "Central Vacuum Cleaning", value: "Central Vacuum Cleaning" },
    { id: "inside14", label: "Mold Removal", value: "Mold Removal" },
    { id: "inside15", label: "Plaster Work", value: "Plaster Work" },
    { id: "inside16", label: "Water Damage Repair", value: "Water Damage Repair" },
    { id: "inside17", label: "Basement Waterproofing", value: "Basement Waterproofing" },
    {
      id: "inside18",
      label: "Wallpaper Hanging and Removing",
      value: "Wallpaper Hanging and Removing",
    },
    { id: "inside19", label: "Countertop Installation", value: "Countertop Installation" },
    { id: "inside20", label: "Ceiling Fan Installation", value: "Ceiling Fan Installation" },
    { id: "inside21", label: "Bathtub Refinishing", value: "Bathtub Refinishing" },
    { id: "inside22", label: "Cabinet Resurfacing", value: "Cabinet Resurfacing" },
    { id: "inside23", label: "Cabinet Makers", value: "Cabinet Makers" },
    { id: "inside24", label: "Tile Installation", value: "Tile Installation" },
    {
      id: "inside25",
      label: "Other Inside Home Maintenance and Repair",
      value: "Other Inside Home Maintenance and Repair",
    },
  ]

  // Function to extract terminal subcategories (defined at the top to avoid initialization errors)
  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    const allServices = subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        // Extract the specific service name (last part after the last >)
        const parts = path.split(" > ")

        // Get the terminal subcategory (most specific service)
        return parts[parts.length - 1].trim()
      })
      .filter(Boolean) // Remove nulls
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

    console.log(`Found ${allServices.length} unique services for business`)
    return allServices
  }

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // State for business profile dialog
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // State for businesses and filtering
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  const subcategoryPath = "Home, Lawn, and Manual Labor > Inside Home Maintenance and Repair"

  // Handle filter changes
  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
    if (checked) {
      setSelectedFilters((prev) => [...prev, filterId])
    } else {
      setSelectedFilters((prev) => prev.filter((id) => id !== filterId))
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters([])
  }

  // Get filter values from filter IDs
  const getFilterValues = () => {
    return selectedFilters.map((filterId) => {
      const option = filterOptions.find((opt) => opt.id === filterId)
      return option ? option.value : filterId
    })
  }

  // Filter businesses based on selected filters
  const filteredBusinesses = businesses.filter((business) => {
    // If no filters selected, show all businesses
    if (selectedFilters.length === 0) return true

    // Get the terminal subcategories for this business
    const businessServices = getAllTerminalSubcategories(business.subcategories)

    // Get the filter values (not IDs)
    const filterValues = getFilterValues()

    // Check if any of the business services match any of the selected filters
    return businessServices.some((service) =>
      filterValues.some(
        (filter) =>
          service.toLowerCase().includes(filter.toLowerCase()) || filter.toLowerCase().includes(service.toLowerCase()),
      ),
    )
  })

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

  // Log applied filters
  useEffect(() => {
    console.log("Applied filters:", selectedFilters)
    console.log(`Showing ${filteredBusinesses.length} of ${businesses.length} businesses`)
  }, [selectedFilters, filteredBusinesses.length, businesses.length])

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

  // Check if a service matches any of the selected filters
  const isServiceMatching = (service) => {
    if (selectedFilters.length === 0) return false

    const filterValues = getFilterValues()

    return filterValues.some(
      (filter) =>
        service.toLowerCase().includes(filter.toLowerCase()) || filter.toLowerCase().includes(service.toLowerCase()),
    )
  }

  return (
    <CategoryLayout title="Inside Home Maintenance and Repair" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Filter Status */}
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Filtering by {selectedFilters.length} {selectedFilters.length === 1 ? "service" : "services"}:{" "}
                {getFilterValues().join(", ")}
              </p>
              <p className="text-sm text-blue-700">
                Showing {filteredBusinesses.length} of {businesses.length} businesses
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
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
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 002-2H5a2 2 0 00-2-2v0"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedFilters.length > 0 ? "No matching services found" : "No Inside Maintenance Services Found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedFilters.length > 0
                ? "Try selecting different service filters or clear the current filters."
                : userZipCode
                  ? `We're currently building our network of home maintenance professionals in the ${userZipCode} area.`
                  : "Be the first home maintenance professional to join our platform!"}
            </p>
            {selectedFilters.length > 0 && <Button onClick={clearFilters}>Clear Filters</Button>}
            {selectedFilters.length === 0 && <Button>Register Your Business</Button>}
          </div>
        ) : (
          filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{business.displayName}</h3>
                    <p className="text-gray-600 text-sm mt-1">{business.displayLocation || "Location not specified"}</p>
                    {business.displayPhone && <p className="text-gray-600 text-sm mt-1">📞 {business.displayPhone}</p>}
                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(business.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {business.rating || 0} ({business.reviewCount || 0} reviews)
                      </span>
                    </div>
                    {business.subcategories && getAllTerminalSubcategories(business.subcategories).length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">
                          Services ({getAllTerminalSubcategories(business.subcategories).length}):
                        </p>
                        <div className="max-h-32 overflow-y-auto mt-1">
                          <div className="flex flex-wrap gap-2">
                            {getAllTerminalSubcategories(business.subcategories).map((service, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                                  ${
                                    isServiceMatching(service)
                                      ? "bg-green-100 text-green-800 ring-1 ring-green-400"
                                      : "bg-primary/10 text-primary"
                                  }`}
                              >
                                {service}
                              </span>
                            ))}
                          </div>
                          {getAllTerminalSubcategories(business.subcategories).length > 8 && (
                            <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(business)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleViewProfile(business)}
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
