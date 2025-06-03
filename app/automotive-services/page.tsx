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
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import type { Business } from "@/lib/definitions"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useToast } from "@/components/ui/use-toast"
import { Phone } from "lucide-react"
import { useUserZipCode } from "@/hooks/use-user-zipcode"
import { ZipCodeFilterIndicator } from "@/components/zip-code-filter-indicator"

// Format phone number for display
function formatPhoneNumber(phone: string): string {
  if (!phone) return "No phone provided"

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "")

  // Check if we have a valid 10-digit US phone number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  // Return original if not a standard format
  return phone
}

export default function AutomotiveServicesPage() {
  const { zipCode } = useUserZipCode()
  const { toast } = useToast()

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

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<{
    id: string
    name: string
  } | null>(null)

  // State for businesses and ad designs
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [businessAdDesigns, setBusinessAdDesigns] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchBusinesses() {
      // Skip fetch if no zip code is set
      if (!zipCode) {
        console.log("No zipCode set, skipping fetch")
        return
      }

      console.log(`Fetching automotive-services businesses for zipCode: ${zipCode}`)
      setLoading(true)
      setError(null)

      try {
        const result = await getBusinessesForCategoryPage("/automotive-services", zipCode)

        // Check if request was aborted
        if (controller.signal.aborted) {
          console.log("Request was aborted")
          return
        }

        console.log(`Found ${result.length} automotive-services businesses for zipCode: ${zipCode}`)
        setBusinesses(result)
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Request was aborted during error handling")
          return
        }

        console.error("Error fetching businesses:", error)
        setError("Failed to load automotive service providers")
        toast({
          title: "Error loading businesses",
          description: "There was a problem loading businesses. Please try again later.",
          variant: "destructive",
        })
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchBusinesses()

    // Cleanup function to abort the request if component unmounts or zipCode changes
    return () => {
      controller.abort()
    }
  }, [zipCode, toast])

  const handleOpenReviews = (business: Business) => {
    setSelectedProvider({
      id: business.id,
      name: business.displayName || business.businessName,
      reviews: business.reviewsData || [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (business: Business) => {
    setSelectedBusinessProfile({
      id: business.id,
      name: business.displayName || business.businessName,
    })
    setIsProfileDialogOpen(true)
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

      <ZipCodeFilterIndicator />

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
                    title={business.displayName || adDesign.businessInfo?.businessName || business.businessName}
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
                        <h3 className="text-xl font-semibold">{business.displayName || business.businessName}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {(() => {
                            // Prioritize city/state from ad design data
                            const adCity = business.adDesignData?.businessInfo?.city
                            const adState = business.adDesignData?.businessInfo?.state

                            if (adCity && adState) {
                              return `${adCity}, ${adState}`
                            }

                            // Fall back to display city/state from centralized system
                            if (business.displayCity && business.displayState) {
                              return `${business.displayCity}, ${business.displayState}`
                            }

                            // Fall back to original business city/state
                            if (business.city && business.state) {
                              return `${business.city}, ${business.state}`
                            }

                            // Final fallback to zip code
                            return business.zipCode ? `Zip: ${business.zipCode}` : "Location not provided"
                          })()}
                        </p>

                        {/* Phone Number */}
                        {(business.adDesignData?.businessInfo?.phone || business.displayPhone || business.phone) && (
                          <div className="flex items-center mt-1">
                            <Phone className="w-4 h-4 text-gray-500 mr-1" />
                            <span className="text-gray-600 text-sm">
                              {formatPhoneNumber(
                                business.adDesignData?.businessInfo?.phone ||
                                  business.displayPhone ||
                                  business.phone ||
                                  "",
                              )}
                            </span>
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
                        <Button
                          variant="outline"
                          className="mt-2 w-full md:w-auto"
                          onClick={() => handleOpenProfile(business)}
                        >
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

      {/* Reviews Dialog */}
      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          businessId={selectedProvider.id}
          reviews={selectedProvider.reviews}
        />
      )}

      {/* Business Profile Dialog */}
      {selectedBusinessProfile && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedBusinessProfile.id}
          businessName={selectedBusinessProfile.name}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
