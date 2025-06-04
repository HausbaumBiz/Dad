"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { MapPin, Phone, X } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"

// Enhanced Business interface with service area
interface Business {
  id: string
  displayName?: string
  businessName: string
  displayLocation?: string
  displayPhone?: string
  zipCode: string
  serviceArea?: string[] // Changed from nested object to array
  isNationwide?: boolean // Added as separate property
  subcategories?: string[]
  adDesignData?: any
}

export default function PhysicalRehabilitationPage() {
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
      console.log(`User zip code loaded: ${savedZipCode}`)
    } else {
      console.log("No user zip code found in localStorage")
    }
  }, [])

  // Helper function to check if a business serves a specific zip code
  const businessServesZipCode = (business: Business, targetZipCode: string): boolean => {
    console.log(`  - Checking business: ${business.displayName || business.businessName}`)
    console.log(`    Primary ZIP: ${business.zipCode}`)
    console.log(`    Service Area: ${business.serviceArea ? `[${business.serviceArea.join(", ")}]` : "none"}`)
    console.log(`    Nationwide: ${business.isNationwide}`)
    console.log(`    Target ZIP: ${targetZipCode}`)

    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`    Result: MATCH (nationwide service)`)
      return true
    }

    // Check if zip code is in service area
    if (business.serviceArea && business.serviceArea.length > 0) {
      const matches = business.serviceArea.includes(targetZipCode)
      console.log(`    Result: ${matches ? "MATCH" : "NO MATCH"} (service area check)`)
      return matches
    }

    // Fall back to primary zip code
    const matches = business.zipCode === targetZipCode
    console.log(`    Result: ${matches ? "MATCH" : "NO MATCH"} (primary ZIP fallback)`)
    return matches
  }

  useEffect(() => {
    async function fetchProviders() {
      const currentFetchId = ++fetchIdRef.current
      console.log(
        `[${new Date().toISOString()}] Fetching businesses for /physical-rehabilitation (request #${currentFetchId})`,
      )

      try {
        setLoading(true)

        const businesses = await getBusinessesForCategoryPage("/physical-rehabilitation")
        console.log(
          `[${new Date().toISOString()}] Retrieved ${businesses.length} total businesses (request #${currentFetchId})`,
        )

        // Check if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${currentFetchId}`)
          return
        }

        businesses.forEach((business) => {
          console.log(
            `  - ${business.id}: "${business.displayName || business.businessName}" (zipCode: ${business.zipCode})`,
          )
        })

        // Filter by zip code if available
        let filteredBusinesses = businesses
        if (userZipCode) {
          console.log(
            `[${new Date().toISOString()}] Filtering by user zip code: ${userZipCode} (request #${currentFetchId})`,
          )
          filteredBusinesses = businesses.filter((business) => businessServesZipCode(business, userZipCode))
          console.log(
            `[${new Date().toISOString()}] After filtering: ${filteredBusinesses.length} businesses (request #${currentFetchId})`,
          )
        }

        // Transform the data to match the expected format
        const transformedProviders = filteredBusinesses.map((business) => ({
          id: business.id,
          name: business.displayName || business.businessName,
          location: business.displayLocation,
          phone: business.displayPhone,
          rating: 4.5, // Default rating
          reviews: 0, // Default review count
          services: business.subcategories || ["Physical Rehabilitation"],
          adDesignData: business.adDesignData,
          serviceArea: business.serviceArea,
          isNationwide: business.isNationwide,
        }))

        setProviders(transformedProviders)
      } catch (err) {
        console.error("Error fetching rehabilitation providers:", err)
        if (currentFetchId === fetchIdRef.current) {
          setError("Failed to load providers")
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchProviders()
  }, [userZipCode])

  const filterOptions = [
    { id: "therapy1", label: "Occupational Therapists", value: "Occupational Therapists" },
    { id: "therapy2", label: "Physical Therapists", value: "Physical Therapists" },
    { id: "therapy3", label: "Recreational Therapists", value: "Recreational Therapists" },
    { id: "therapy4", label: "Respiratory Therapists", value: "Respiratory Therapists" },
    { id: "therapy5", label: "Speech-Language Pathologists", value: "Speech-Language Pathologists" },
    { id: "therapy6", label: "Exercise Physiologists", value: "Exercise Physiologists" },
    { id: "therapy7", label: "Massage Therapists", value: "Massage Therapists" },
    { id: "therapy8", label: "Art Therapists", value: "Art Therapists" },
    { id: "therapy9", label: "Music Therapists", value: "Music Therapists" },
    { id: "therapy10", label: "Therapists, All Other", value: "Therapists, All Other" },
  ]

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider({
      ...provider,
      reviewsData: provider.reviews || [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (business: any) => {
    setSelectedBusiness(business)
    setIsProfileOpen(true)
  }

  // Handle clearing zip code filter
  const handleClearZipCode = () => {
    localStorage.removeItem("savedZipCode")
    setUserZipCode(null)
  }

  return (
    <CategoryLayout title="Physical Rehabilitation" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/phyical-RZOSg66X6bkbf12ZqgYD8MRTtNgk6H.png"
            alt="Physical Rehabilitation"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified rehabilitation professionals in your area. Browse services below or use filters to narrow
            your search.
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

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800">Showing businesses that service: {userZipCode}</p>
                <p className="text-sm text-blue-700">Including businesses with this ZIP code in their service area</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearZipCode}
              className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading rehabilitation providers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {userZipCode
                  ? `No Rehabilitation Providers Found in ${userZipCode}`
                  : "No Rehabilitation Providers Yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {userZipCode
                  ? `No rehabilitation providers found serving ZIP code ${userZipCode}. Try clearing the filter to see all providers.`
                  : "Be the first rehabilitation professional to join our platform and connect with patients in your area."}
              </p>
              <Button className="bg-purple-600 hover:bg-purple-700">Register Your Practice</Button>
            </div>
          </div>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.name}</h3>
                    <div className="flex items-center mt-2 text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{provider.location}</span>
                    </div>

                    {provider.phone && (
                      <div className="flex items-center mt-1 text-gray-600">
                        <Phone className="w-4 h-4 mr-1" />
                        <a href={`tel:${provider.phone}`} className="text-sm hover:text-primary">
                          {provider.phone}
                        </a>
                      </div>
                    )}

                    {/* Service Area Indicator */}
                    {userZipCode && (provider.serviceArea || provider.isNationwide) && (
                      <div className="mt-2">
                        {provider.isNationwide ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Serves nationwide
                          </span>
                        ) : provider.serviceArea && provider.serviceArea.includes(userZipCode) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Serves {userZipCode} area
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Primary location: {provider.zipCode}
                          </span>
                        )}
                      </div>
                    )}

                    {provider.services && provider.services.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {provider.services.map((service, idx) => (
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
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleOpenProfile(provider)}
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

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          reviews={selectedProvider?.reviewsData || []}
        />
      )}

      {selectedBusiness && (
        <BusinessProfileDialog
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          businessId={selectedBusiness.id}
          businessName={selectedBusiness.name}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
