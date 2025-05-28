"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { AdBox } from "@/components/ad-box"
import { getBusinessesBySelectedCategories, getBusinessAdDesignData } from "@/app/actions/business-category-fetcher"
import type { Business } from "@/lib/definitions"

export default function AutomotiveServicesPage() {
  const filterOptions = [
    { id: "auto1", label: "Auto Repair", value: "Auto Repair" },
    { id: "auto2", label: "Oil Change", value: "Oil Change" },
    { id: "auto3", label: "Tire Service", value: "Tire Service" },
    { id: "auto4", label: "Brake Service", value: "Brake Service" },
    { id: "auto5", label: "Transmission Repair", value: "Transmission Repair" },
    { id: "auto6", label: "Engine Repair", value: "Engine Repair" },
    { id: "auto7", label: "Car Wash", value: "Car Wash" },
    { id: "auto8", label: "Auto Detailing", value: "Auto Detailing" },
    { id: "auto9", label: "Towing Service", value: "Towing Service" },
    { id: "auto10", label: "Auto Body Shop", value: "Auto Body Shop" },
    { id: "auto11", label: "Auto Glass Repair", value: "Auto Glass Repair" },
    { id: "auto12", label: "Motorcycle Repair", value: "Motorcycle Repair" },
    { id: "auto13", label: "RV Repair", value: "RV Repair" },
    { id: "auto14", label: "Auto Parts", value: "Auto Parts" },
    { id: "auto15", label: "Car Dealership", value: "Car Dealership" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: string
    name: string
    reviews: any[]
  } | null>(null)

  // State for businesses and ad designs
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [businessAdDesigns, setBusinessAdDesigns] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        setError(null)

        // Fetch businesses that have selected "automotive" category
        const matchingBusinesses = await getBusinessesBySelectedCategories("/automotive-services")
        setBusinesses(matchingBusinesses)

        // Fetch ad design data for each business
        const adDesigns: Record<string, any> = {}
        for (const business of matchingBusinesses) {
          const adDesign = await getBusinessAdDesignData(business.id)
          if (adDesign) {
            adDesigns[business.id] = adDesign
          }
        }
        setBusinessAdDesigns(adDesigns)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load automotive services")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  const handleOpenReviews = (business: Business) => {
    setSelectedProvider({
      id: business.id,
      name: business.businessName,
      reviews: business.reviewsData || [],
    })
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Automotive Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/auto-mQWtZXyRogQgO5qlNVcR1OYcyDqe59.png"
            alt="Automotive Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find trusted automotive professionals in your area. From routine maintenance to major repairs, connect with
            qualified mechanics and service providers.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read reviews from other customers</li>
              <li>View business videos showcasing work and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you'd trust to hire yourself</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading automotive service providers...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Automotive Services Yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first automotive professional to join our platform and connect with vehicle owners in your area.
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">Register Your Service</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {businesses.map((business) => {
            const adDesign = businessAdDesigns[business.id]

            return (
              <div key={business.id} className="space-y-4">
                {/* Business AdBox */}
                {adDesign && (
                  <AdBox
                    title={adDesign.businessInfo?.businessName || business.businessName}
                    description={adDesign.businessInfo?.freeText || "Professional automotive services"}
                    businessName={business.businessName}
                    businessId={business.id}
                    phoneNumber={adDesign.businessInfo?.phone || business.phone}
                    address={
                      adDesign.businessInfo?.streetAddress
                        ? `${adDesign.businessInfo.streetAddress}, ${adDesign.businessInfo.city || ""}, ${adDesign.businessInfo.state || ""} ${adDesign.businessInfo.zipCode || ""}`.trim()
                        : undefined
                    }
                  />
                )}

                {/* Business Card */}
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{business.businessName}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {business.city && business.state
                            ? `${business.city}, ${business.state}`
                            : `Zip: ${business.zipCode}`}
                        </p>

                        <div className="flex items-center mt-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(business.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 ml-2">
                            {business.rating || 0} ({business.reviews || 0} reviews)
                          </span>
                        </div>

                        {business.services && business.services.length > 0 && (
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
              </div>
            )
          })}
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          businessId={selectedProvider.id}
          reviews={selectedProvider.reviews}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
