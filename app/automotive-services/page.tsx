"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { AdBox } from "@/components/ad-box"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useToast } from "@/components/ui/use-toast"
import { Phone, Loader2 } from "lucide-react"

// Enhanced Business interface with service area support
interface Business {
  id: string
  businessName: string
  displayName?: string
  city?: string
  state?: string
  zipCode?: string
  displayCity?: string
  displayState?: string
  displayPhone?: string
  phone?: string
  rating?: number
  reviews?: number
  services?: string[]
  reviewsData?: any[]
  adDesignData?: {
    businessInfo?: {
      phone?: string
      city?: string
      state?: string
      streetAddress?: string
      zipCode?: string
      businessName?: string
      freeText?: string
    }
  }
  serviceArea?: string[]
  isNationwide?: boolean
}

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
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Helper function to check if business serves a zip code
  const businessServesZipCode = (business: Business, zipCode: string): boolean => {
    console.log(
      `[Automotive Services] Checking if business ${business.displayName || business.businessName} serves ${zipCode}:`,
      {
        isNationwide: business.isNationwide,
        serviceArea: business.serviceArea,
        primaryZip: business.zipCode,
      },
    )

    // Check if business serves nationwide
    if (business.isNationwide) {
      console.log(`[Automotive Services] Business serves nationwide`)
      return true
    }

    // Check if business service area includes the zip code
    if (business.serviceArea && Array.isArray(business.serviceArea)) {
      const serves = business.serviceArea.some((area) => {
        if (typeof area === "string") {
          return area.toLowerCase().includes("nationwide") || area === zipCode
        }
        return false
      })
      console.log(`[Automotive Services] Service area check result: ${serves}`)
      if (serves) return true
    }

    // Fall back to primary zip code comparison
    const primaryMatch = business.zipCode === zipCode
    console.log(`[Automotive Services] Primary zip code match: ${primaryMatch}`)
    return primaryMatch
  }

  // Clear zip code filter
  const clearZipCodeFilter = () => {
    setUserZipCode(null)
    localStorage.removeItem("savedZipCode")
  }

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[Automotive Services] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

      try {
        setLoading(true)
        setError(null)

        const result = await getBusinessesForCategoryPage("/automotive-services")

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(
            `[Automotive Services] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`,
          )
          return
        }

        console.log(`[Automotive Services] Fetch ${currentFetchId} completed, got ${result.length} businesses`)

        // Filter businesses by zip code if userZipCode is available
        if (userZipCode) {
          console.log(`[Automotive Services] Filtering by zip code: ${userZipCode}`)
          const filteredBusinesses = result.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Automotive Services] Business ${business.displayName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              business,
            )
            return serves
          })
          console.log(`[Automotive Services] After filtering: ${filteredBusinesses.length} businesses`)
          setBusinesses(filteredBusinesses)
        } else {
          setBusinesses(result)
        }
      } catch (error) {
        // Only update error state if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error("Error fetching businesses:", error)
          setError("Failed to load businesses")
          toast({
            title: "Error loading businesses",
            description: "There was a problem loading businesses. Please try again later.",
            variant: "destructive",
          })
        }
      } finally {
        // Only update loading state if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [userZipCode])

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

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-800 text-sm">
                <strong>Showing results for ZIP code: {userZipCode}</strong>
                <br />
                <span className="text-blue-600">Including businesses that serve your area or operate nationwide.</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearZipCodeFilter}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      <CategoryFilter options={filterOptions} />

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading automotive service providers...</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userZipCode ? `No Automotive Services in ${userZipCode}` : "No Automotive Services Yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `We're building our network of automotive professionals in the ${userZipCode} area.`
                : "Be the first automotive professional to join our platform and connect with vehicle owners in your area."}
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

                        {/* Service Area Indicator */}
                        {business.isNationwide ? (
                          <div className="text-xs text-green-600 font-medium mb-1">✓ Serves nationwide</div>
                        ) : userZipCode && business.serviceArea?.includes(userZipCode) ? (
                          <div className="text-xs text-green-600 font-medium mb-1">✓ Serves {userZipCode} area</div>
                        ) : null}

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
