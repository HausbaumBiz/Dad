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

export default function OutsideMaintenancePage() {
  const filterOptions = [
    { id: "outside1", label: "Roofing", value: "Roofing" },
    { id: "outside2", label: "Masonry Stone and Brick", value: "Masonry Stone and Brick" },
    { id: "outside3", label: "Glass Block", value: "Glass Block" },
    { id: "outside4", label: "Siding", value: "Siding" },
    { id: "outside5", label: "Deck Cleaning/Refinishing", value: "Deck Cleaning/Refinishing" },
    { id: "outside6", label: "Garage Doors", value: "Garage Doors" },
    { id: "outside7", label: "House Painting", value: "House Painting" },
    { id: "outside8", label: "Pressure Washing", value: "Pressure Washing" },
    { id: "outside9", label: "Foundation Repair", value: "Foundation Repair" },
    { id: "outside10", label: "Gutter Cleaning/Repair", value: "Gutter Cleaning/Repair" },
    { id: "outside11", label: "Septic Tank Service", value: "Septic Tank Service" },
    { id: "outside12", label: "Well & Water Pump Repair", value: "Well & Water Pump Repair" },
    { id: "outside13", label: "Other Outside Home Maintenance", value: "Other Outside Home Maintenance" },
  ]

  // State for businesses
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // State for dialogs
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // The subcategory path to search for
  const subcategoryPath = "Home, Lawn, and Manual Labor > Outside Home Maintenance and Repair"

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        console.log(`Fetching businesses for ${subcategoryPath} subcategory...`)

        const result = await getBusinessesForSubcategory(subcategoryPath)
        console.log(`Found ${result.length} businesses for base path: ${subcategoryPath}`)

        setBusinesses(result)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [subcategoryPath])

  // Handler for opening reviews dialog
  const handleOpenReviews = (business) => {
    setSelectedBusiness(business)
    setIsReviewsDialogOpen(true)
  }

  // Handler for opening profile dialog
  const handleViewProfile = (business) => {
    setSelectedBusiness(business)
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
  }

  return (
    <CategoryLayout
      title="Outside Home Maintenance and Repair"
      backLink="/home-improvement"
      backText="Home Improvement"
    >
      <CategoryFilter options={filterOptions} />

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
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Outside Maintenance Services Found</h3>
            <p className="text-gray-600 mb-4">
              We're currently building our network of exterior home maintenance and repair professionals in your area.
            </p>
            <Button className="bg-orange-600 hover:bg-orange-700">Register Your Business</Button>
          </div>
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
        providerName={selectedBusiness?.displayName}
        reviews={[]}
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
