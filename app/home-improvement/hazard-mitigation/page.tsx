"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import Link from "next/link"

export default function HazardMitigationPage() {
  const filterOptions = [
    { id: "hazard1", label: "Lead-Based Paint Abatement", value: "Lead-Based Paint Abatement" },
    { id: "hazard2", label: "Radon Mitigation", value: "Radon Mitigation" },
    { id: "hazard3", label: "Mold Removal", value: "Mold Removal" },
    { id: "hazard4", label: "Asbestos Removal", value: "Asbestos Removal" },
    {
      id: "hazard5",
      label: "Smoke/Carbon Monoxide Detector Installation",
      value: "Smoke/Carbon Monoxide Detector Installation",
    },
    { id: "hazard6", label: "Fire Extinguisher Maintenance", value: "Fire Extinguisher Maintenance" },
    { id: "hazard7", label: "Other Home Hazard Mitigation", value: "Other Home Hazard Mitigation" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch providers from API endpoint
    const fetchProviders = async () => {
      try {
        const response = await fetch("/api/businesses/by-page?page=hazard-mitigation")
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setProviders(data.businesses || [])
      } catch (error) {
        console.error("Failed to fetch providers:", error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  // Handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Home Hazard Mitigation" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} />

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="h-24 bg-gray-200 animate-pulse rounded-md"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : providers.length > 0 ? (
          providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.business_name || provider.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {provider.city}, {provider.state}
                    </p>

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(provider.average_rating || provider.rating || 0)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {(provider.average_rating || provider.rating || 0).toFixed(1)} (
                        {provider.review_count || provider.reviews || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(provider.subcategories || provider.services || []).map((service, idx) => (
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
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider)}>
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
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-700 mb-4">
              No hazard mitigation businesses found. Be the first to register your business in this category!
            </p>
            <Link href="/business-register">
              <Button>Register Your Business</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.business_name || selectedProvider?.name}
        businessId={selectedProvider?.id}
      />

      <Toaster />
    </CategoryLayout>
  )
}
