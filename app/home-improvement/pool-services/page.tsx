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

  // State for dialogs
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [selectedBusinessName, setSelectedBusinessName] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

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

  // Helper to extract service names from full paths
  const extractServiceNames = (subcategories) => {
    if (!subcategories || !Array.isArray(subcategories)) return []

    return subcategories
      .filter((subcat) => {
        // Handle both string and object formats
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        return path && path.includes(subcategoryPath)
      })
      .map((subcat) => {
        // Extract the service name from the path
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        // Get the last part after the subcategory path
        const parts = path.split(">")
        return parts[parts.length - 1].trim()
      })
      .filter(Boolean) // Remove nulls
      .slice(0, 3) // Limit to 3 tags
  }

  return (
    <CategoryLayout title="Pool Services" backLink="/home-improvement" backText="Home Improvement">
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
          {businesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{business.displayName}</h3>
                    <p className="text-gray-600 text-sm mt-1">{business.displayLocation}</p>

                    {/* Display phone number if available */}
                    {business.displayPhone && (
                      <div className="flex items-center mt-1 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5 mr-1" />
                        <span>{business.displayPhone}</span>
                      </div>
                    )}

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

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {extractServiceNames(business.subcategories).map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
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
