"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"
import type { Business } from "@/lib/definitions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Star, Loader2 } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useToast } from "@/components/ui/use-toast"
import { useUserZipCode } from "@/hooks/use-user-zipcode"
import { ZipCodeFilterIndicator } from "@/components/zip-code-filter-indicator"

export default function CareServicesPage() {
  const { zipCode } = useUserZipCode()
  const { toast } = useToast()

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{ name: string; id: string } | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")

  const filterOptions = [
    { id: "homecare1", label: "Non-Medical Elder Care", value: "Non-Medical Elder Care" },
    { id: "homecare2", label: "Non-Medical Special Needs Adult Care", value: "Non-Medical Special Needs Adult Care" },
    { id: "childcare1", label: "Babysitting (18+ Sitters only)", value: "Babysitting (18+ Sitters only)" },
    { id: "homecare3", label: "Other Home Care", value: "Other Home Care" },
    { id: "childcare2", label: "Childcare Centers", value: "Childcare Centers" },
    { id: "homecare4", label: "Adult Day Services", value: "Adult Day Services" },
    { id: "homecare5", label: "Rehab/Nursing/Respite and Memory Care", value: "Rehab/Nursing/Respite and Memory Care" },
  ]

  useEffect(() => {
    const controller = new AbortController()

    async function fetchBusinesses() {
      // Skip fetch if no zip code is set
      if (!zipCode) {
        console.log("No zipCode set, skipping fetch")
        return
      }

      console.log(`Fetching care-services businesses for zipCode: ${zipCode}`)
      setLoading(true)
      setError(null)

      try {
        const result = await getBusinessesForCategoryPage("/care-services", zipCode)

        // Check if request was aborted
        if (controller.signal.aborted) {
          console.log("Request was aborted")
          return
        }

        console.log(`Found ${result.length} care-services businesses for zipCode: ${zipCode}`)
        setBusinesses(result)
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Request was aborted during error handling")
          return
        }

        console.error("Error fetching businesses:", error)
        setError("Failed to load care service providers")
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

  // Helper function to get phone number from business data
  const getPhoneNumber = (business: Business) => {
    // First try to get phone from ad design data
    if (business.adDesignData?.businessInfo?.phone) {
      return business.adDesignData.businessInfo.phone
    }
    // Then try displayPhone which might be set by the centralized system
    if (business.displayPhone) {
      return business.displayPhone
    }
    // Fall back to the business registration phone
    if (business.phone) {
      return business.phone
    }
    return null
  }

  // Add a formatPhoneNumber function for better display
  const formatPhoneNumber = (phoneNumberString: string | null | undefined) => {
    if (!phoneNumberString) return "No phone provided"

    // Strip all non-numeric characters
    const cleaned = phoneNumberString.replace(/\D/g, "")

    // Check if it's a valid 10-digit US phone number
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`
    }

    // Return the original if not a standard format
    return phoneNumberString
  }

  // Helper function to get location from business data
  const getLocation = (business: Business) => {
    // First try to get location from ad design data
    const adDesignCity = business.adDesignData?.businessInfo?.city
    const adDesignState = business.adDesignData?.businessInfo?.state

    // Then try displayCity/displayState which might be set by the centralized system
    const displayCity = business.displayCity
    const displayState = business.displayState

    // Finally fall back to registration data
    const registrationCity = business.city
    const registrationState = business.state

    // Build location string prioritizing ad design data
    const city = adDesignCity || displayCity || registrationCity
    const state = adDesignState || displayState || registrationState

    const parts = []
    if (city) parts.push(city)
    if (state) parts.push(state)

    if (parts.length > 0) {
      return parts.join(", ")
    }

    // If no city/state available, show zip code as fallback
    if (business.zipCode) {
      return `Zip: ${business.zipCode}`
    }

    return "Location not provided"
  }

  // Helper function to get subcategories
  const getSubcategories = (business: Business) => {
    // Prioritize subcategories from Redis
    if (business.subcategories && business.subcategories.length > 0) {
      return business.subcategories
    }

    // Fall back to services if available
    if (business.services && business.services.length > 0) {
      return business.services
    }

    return []
  }

  const handleViewReviews = (business: Business) => {
    console.log("Opening reviews for business:", business)
    setSelectedProvider({
      name: business.displayName || business.businessName,
      id: business.id || "",
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: Business) => {
    console.log("Opening profile for business:", business)
    setSelectedBusinessId(business.id || "")
    setSelectedBusinessName(business.displayName || business.businessName)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Elder and Child Care Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/home%20health-zJyA419byhmD7tyJa0Ebmegg0XzFN3.png"
            alt="Elder and Child Care Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find compassionate and professional care services for elders and children in your area. Browse providers
            below or use filters to narrow your search.
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

      {/* Business Listings */}
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading care service providers...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : businesses.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Care Service Providers ({businesses.length})</h2>

            <div className="grid gap-6">
              {businesses.map((business) => (
                <Card key={business.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {business.displayName || business.businessName}
                        </h3>

                        {business.description && <p className="text-gray-600 mb-3">{business.description}</p>}

                        {/* Contact Information */}
                        <div className="space-y-2 mb-4">
                          {getPhoneNumber(business) && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2 text-primary" />
                              <a href={`tel:${getPhoneNumber(business)}`} className="text-blue-600 hover:underline">
                                {formatPhoneNumber(getPhoneNumber(business))}
                              </a>
                            </div>
                          )}

                          {getLocation(business) && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2 text-primary" />
                              <span>{getLocation(business)}</span>
                            </div>
                          )}
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center mb-4">
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= (business.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">({business.rating || 0}/5)</span>
                        </div>

                        {/* Subcategories/Specialties */}
                        {getSubcategories(business).length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Specialties:</h4>
                            <div className="flex flex-wrap gap-2">
                              {getSubcategories(business).map((subcategory, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {typeof subcategory === "string" ? subcategory : subcategory.name || "Unknown"}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-start md:items-end justify-start space-y-2">
                        <Button className="w-full md:w-auto min-w-[120px]" onClick={() => handleViewReviews(business)}>
                          Reviews
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full md:w-auto min-w-[120px]"
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
          </div>
        ) : (
          <div className="mt-8 p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Care Service Providers Found</h3>
            <p className="text-gray-600">Enter your zip code to find care providers in your area.</p>
          </div>
        )}
      </div>

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name || ""}
        businessId={selectedProvider?.id || ""}
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
