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

export default function FireplacesChimneysPage() {
  const filterOptions = [
    { id: "fireplace1", label: "Chimney Sweep", value: "Chimney Sweep" },
    { id: "fireplace2", label: "Chimney and Chimney Cap Repair", value: "Chimney and Chimney Cap Repair" },
    { id: "fireplace3", label: "Gas Fireplace Repair", value: "Gas Fireplace Repair" },
    { id: "fireplace4", label: "Fireplace Services", value: "Fireplace Services" },
    { id: "fireplace5", label: "Firewood Suppliers", value: "Firewood Suppliers" },
    { id: "fireplace6", label: "Heating Oil Suppliers", value: "Heating Oil Suppliers" },
    { id: "fireplace7", label: "Other Fireplaces and Chimneys", value: "Other Fireplaces and Chimneys" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined)

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        console.log("Fetching fireplaces and chimneys businesses with subcategory path...")
        const result = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Fireplaces and Chimneys")
        console.log(`Found ${result.length} total fireplaces and chimneys businesses`)

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
            // Extract service tags from subcategories
            const serviceTags = getServiceTags(business.subcategories || [])

            return {
              id: business.id,
              name: business.displayName || business.businessName,
              location: business.displayLocation || `${business.city || ""}, ${business.state || ""}`,
              phone: business.displayPhone || business.phone,
              rating: business.rating || 4.5,
              reviews: business.reviewCount || 0,
              services: serviceTags,
              // Keep the original business data for the profile dialog
              businessData: business,
            }
          })

          setProviders(transformedProviders)
        } else {
          console.log("No user zip code available, showing all businesses")

          // Transform the data for display
          const transformedProviders = result.map((business) => {
            // Extract service tags from subcategories
            const serviceTags = getServiceTags(business.subcategories || [])

            return {
              id: business.id,
              name: business.displayName || business.businessName,
              location: business.displayLocation || `${business.city || ""}, ${business.state || ""}`,
              phone: business.displayPhone || business.phone,
              rating: business.rating || 4.5,
              reviews: business.reviewCount || 0,
              services: serviceTags,
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

  // Replace the getServiceTags function with this improved version that shows all terminal subcategories

  // Replace this function:
  const getServiceTags = (subcategories) => {
    return subcategories
      .filter((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        return path && path.includes("Fireplaces and Chimneys")
      })
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return "Fireplace Services"

        const parts = path.split(" > ")
        return parts[parts.length - 1] // Get just the service name
      })
      .slice(0, 3) // Limit to 3 for display
  }

  // With this improved version:
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

  return (
    <CategoryLayout title="Fireplaces and Chimneys" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} />

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
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Fireplace & Chimney Services Found</h3>
            <p className="text-gray-600 mb-6">
              {userZipCode
                ? `We're currently building our network of fireplace and chimney services in the ${userZipCode} area.`
                : "Be the first fireplace and chimney service to join our platform and help local homeowners!"}
            </p>
            <Button>Register Your Fireplace Business</Button>
          </div>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.location}</p>
                    {provider.phone && <p className="text-gray-600 text-sm mt-1">{provider.phone}</p>}
                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(provider.rating) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating} ({provider.reviews} reviews)
                      </span>
                    </div>
                    // Also update the JSX where the services are displayed:
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        Services ({getAllTerminalSubcategories(provider.businessData.subcategories).length}):
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto">
                        {provider.services.length > 0 ? (
                          getAllTerminalSubcategories(provider.businessData.subcategories).map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Fireplace Services
                          </span>
                        )}
                      </div>
                      {getAllTerminalSubcategories(provider.businessData.subcategories).length > 8 && (
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
