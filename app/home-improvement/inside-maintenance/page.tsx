"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { getBusinessesByCategory } from "@/app/actions/business-actions"

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

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        const categoryVariants = [
          "Inside Home Maintenance and Repair",
          "Electricians",
          "Plumbers",
          "HVAC Services",
          "Appliance Repair",
          "Indoor Painting",
          "Home Maintenance",
        ]

        let allBusinesses = []
        for (const category of categoryVariants) {
          try {
            const result = await getBusinessesByCategory(category)
            if (result && Array.isArray(result)) {
              allBusinesses = [...allBusinesses, ...result]
            }
          } catch (err) {
            console.warn(`Failed to fetch businesses for category: ${category}`)
          }
        }

        // Remove duplicates based on business ID
        const uniqueBusinesses = allBusinesses.filter(
          (business, index, self) => index === self.findIndex((b) => b.id === business.id),
        )

        setBusinesses(uniqueBusinesses)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([])

  // Mock reviews data
  const mockReviews = {}

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Inside Home Maintenance and Repair" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} />

      <div className="space-y-6">
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 002-2H5a2 2 0 00-2-2v0"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inside Maintenance Services Found</h3>
            <p className="text-gray-600 mb-4">Be the first home maintenance professional to join our platform!</p>
            <Button>Register Your Business</Button>
          </div>
        ) : (
          businesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{business.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{business.location || "Location not specified"}</p>
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
                    {business.services && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {business.services.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(business)}>
                      Reviews
                    </Button>
                    <Button variant="outline" className="mt-2 w-full md:w-auto">
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
        providerName={selectedProvider}
        reviews={selectedProvider ? mockReviews[selectedProvider] : []}
      />

      <Toaster />
    </CategoryLayout>
  )
}
