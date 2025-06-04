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
    async function fetchProviders() {
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

          console.log(`After zip code filtering: ${filteredBusinesses.length} businesses service ${userZipCode}`)
        } else {
          console.log("No user zip code available, showing all businesses")
        }

        setProviders(filteredBusinesses)
      } catch (err) {
        setError("Failed to load providers")
        console.error("Error fetching providers:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [userZipCode])

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
      <CategoryFilter options={filterOptions} />

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
          {providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.displayName}</h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.displayLocation}</p>

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(provider.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating || 0} ({provider.reviews || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {provider.subcategories && provider.subcategories.length > 0 ? (
                          provider.subcategories
                            .filter((service) => service.includes("Lawn, Garden and Snow Removal"))
                            .map((service, idx) => {
                              // Extract just the specific service name from the full path
                              const serviceName = service.split(" > ").pop() || service
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                >
                                  {serviceName}
                                </span>
                              )
                            })
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Lawn, Garden and Snow Removal
                          </span>
                        )}
                      </div>
                    </div>

                    {provider.displayPhone && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Phone:</span> {provider.displayPhone}
                        </p>
                      </div>
                    )}
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
          ))}
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
