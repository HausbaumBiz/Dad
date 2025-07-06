"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { MapPin, Phone, X } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { getBusinessMedia } from "@/app/actions/media-actions"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images"

// Enhanced Business interface with service area
interface Business {
  id: string
  displayName?: string
  businessName: string
  displayLocation?: string
  displayPhone?: string
  zipCode: string
  serviceArea?: string[] // Array of ZIP codes the business serves
  isNationwide?: boolean // Whether the business serves nationwide
  subcategories?: string[]
  adDesignData?: any
}

export default function MentalHealthPage() {
  const filterOptions = [
    { id: "counselors1", label: "Counselors", value: "Counselors" },
    {
      id: "counselors2",
      label: "Clinical and Counseling Psychologists",
      value: "Clinical and Counseling Psychologists",
    },
    { id: "counselors3", label: "Addiction Specialists", value: "Addiction Specialists" },
    { id: "counselors4", label: "Suboxone/Methadone Clinics", value: "Suboxone/Methadone Clinics" },
    { id: "counselors5", label: "Team Building", value: "Team Building" },
    {
      id: "counselors6",
      label: "Industrial-Organizational Psychologists",
      value: "Industrial-Organizational Psychologists",
    },
    { id: "counselors7", label: "Motivational Speakers", value: "Motivational Speakers" },
  ]

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState<any[]>([])

  const fetchIdRef = useRef(0)

  const [businessPhotos, setBusinessPhotos] = useState<Record<string, any[]>>({})

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
    console.log(`Checking if business serves ZIP ${targetZipCode}:`)
    console.log(`  Business: ${business.displayName || business.businessName}`)
    console.log(`  Primary ZIP: ${business.zipCode}`)
    console.log(`  Is Nationwide: ${business.isNationwide}`)
    console.log(`  Service Area: ${business.serviceArea ? JSON.stringify(business.serviceArea) : "none"}`)

    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`  - ${business.displayName || business.businessName}: nationwide=true, matches=true`)
      return true
    }

    // Check if zip code is in service area
    if (business.serviceArea && Array.isArray(business.serviceArea)) {
      const matches = business.serviceArea.includes(targetZipCode)
      console.log(
        `  - ${business.displayName || business.businessName}: serviceArea=[${business.serviceArea.join(", ")}], userZip="${targetZipCode}", matches=${matches}`,
      )
      return matches
    }

    // Fall back to primary zip code
    const matches = business.zipCode === targetZipCode
    console.log(
      `  - ${business.displayName || business.businessName}: primaryZip="${business.zipCode}", userZip="${targetZipCode}", matches=${matches}`,
    )
    return matches
  }

  // Add this helper function after the businessServesZipCode function and before the useEffect

  // Helper function to extract string value from subcategory object or return the string itself
  const getSubcategoryString = (subcategory: any): string => {
    if (typeof subcategory === "string") {
      return subcategory
    } else if (subcategory && typeof subcategory === "object") {
      // If it's an object with subcategory property, return that
      return subcategory.subcategory || subcategory.category || "Unknown Service"
    }
    return "Unknown Service"
  }

  // Helper function to load business photos from Cloudflare
  const loadBusinessPhotos = async (businessId: string) => {
    try {
      const media = await getBusinessMedia(businessId)
      if (media && media.photoAlbum && media.photoAlbum.length > 0) {
        // Take first 5 photos and convert to the format expected by PhotoCarousel
        return media.photoAlbum.slice(0, 5).map((photo) => ({
          id: photo.id,
          url: getCloudflareImageUrl(photo.id, "public"),
          filename: photo.filename,
        }))
      }
      return []
    } catch (error) {
      console.error(`Error loading photos for business ${businessId}:`, error)
      return []
    }
  }

  useEffect(() => {
    async function fetchProviders() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[${new Date().toISOString()}] Fetching businesses for /mental-health (request #${currentFetchId})`)

      try {
        setLoading(true)

        let businesses = await getBusinessesForCategoryPage("/mental-health")
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
          if (business.serviceArea) {
            console.log(
              `    Service area: ${Array.isArray(business.serviceArea) ? business.serviceArea.join(", ") : "unknown format"}`,
            )
          }
        })

        if (userZipCode) {
          console.log(
            `[${new Date().toISOString()}] Filtering by user zip code: ${userZipCode} (request #${currentFetchId})`,
          )
          businesses = businesses.filter((business) => businessServesZipCode(business, userZipCode))
          console.log(
            `[${new Date().toISOString()}] After filtering: ${businesses.length} businesses (request #${currentFetchId})`,
          )
        }

        // Transform the data to match the expected format
        const transformedProviders = businesses.map((business) => ({
          id: business.id,
          name: business.displayName || business.businessName,
          location: business.displayLocation || `${business.city}, ${business.state}`,
          phone: business.displayPhone || business.phone,
          rating: 0, // Remove default rating - will be calculated from actual reviews
          reviews: 0, // Default review count
          services: business.subcategories || ["Mental Health Services"],
          adDesignData: business.adDesignData,
          serviceArea: business.serviceArea,
          isNationwide: business.isNationwide,
          zipCode: business.zipCode,
        }))

        setProviders(transformedProviders)
        setAllProviders(transformedProviders)

        // Load photos for each provider
        const loadPhotos = async () => {
          const photoPromises = transformedProviders.map(async (provider) => {
            const photos = await loadBusinessPhotos(provider.id)
            return { businessId: provider.id, photos }
          })

          const photoResults = await Promise.all(photoPromises)
          const photoMap: Record<string, any[]> = {}

          photoResults.forEach(({ businessId, photos }) => {
            photoMap[businessId] = photos
          })

          setBusinessPhotos(photoMap)
        }

        if (transformedProviders.length > 0) {
          loadPhotos()
        }
      } catch (err) {
        console.error("Error fetching mental health providers:", err)
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

  // State for dialogs
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // Helper function to check if business has exact subcategory match
  const hasExactSubcategoryMatch = (provider: any, filterValue: string): boolean => {
    // Check services array (which comes from subcategories)
    if (provider.services && Array.isArray(provider.services)) {
      return provider.services.some((service) => getSubcategoryString(service) === filterValue)
    }
    return false
  }

  // Filter functions
  const handleFilterChange = (value: string) => {
    setSelectedFilters((prev) => (prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]))
  }

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All providers:", allProviders)

    if (selectedFilters.length === 0) {
      setProviders(allProviders)
      setAppliedFilters([])
      return
    }

    const filtered = allProviders.filter((provider) => {
      const hasMatch = selectedFilters.some((filter) => hasExactSubcategoryMatch(provider, filter))
      console.log(`Provider ${provider.name} services:`, provider.services)
      console.log(`Filter "${selectedFilters.join(", ")}" matches provider: ${hasMatch}`)
      return hasMatch
    })

    console.log("Filtered results:", filtered)
    setProviders(filtered)
    setAppliedFilters([...selectedFilters])
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setProviders(allProviders)
  }

  // Handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider({
      ...provider,
      reviews: provider.reviews || [],
    })
    setIsReviewsDialogOpen(true)
  }

  // Handle opening profile dialog
  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  // Handle clearing zip code filter
  const handleClearZipCode = () => {
    localStorage.removeItem("savedZipCode")
    setUserZipCode(null)
  }

  return (
    <CategoryLayout title="Counselors, Psychologists & Addiction Specialists" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/couseling-4fgTKlpfTgyIe4nhlAyiC5v7PpaJcE.png"
            alt="Mental Health Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified mental health professionals in your area. Browse services below or use filters to narrow your
            search.
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

      {/* Enhanced Filter Controls */}
      <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filter by Specialty</h3>
          <span className="text-sm text-gray-500">{selectedFilters.length} selected</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes(option.value)}
                onChange={() => handleFilterChange(option.value)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={applyFilters}
            disabled={selectedFilters.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            Apply Filters ({selectedFilters.length})
          </Button>

          {appliedFilters.length > 0 && (
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {appliedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Active filters: {appliedFilters.join(", ")}</p>
              <p className="text-sm text-blue-700">
                Showing {providers.length} of {allProviders.length} mental health providers
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-sm font-medium text-green-800">Showing businesses that service: {userZipCode}</p>
                <p className="text-sm text-green-700">Including businesses with this ZIP code in their service area</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearZipCode}
              className="text-green-700 hover:text-green-900 hover:bg-green-100"
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
            <p className="mt-2 text-gray-600">Loading mental health providers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {userZipCode ? `No Mental Health Providers Found in ${userZipCode}` : "No Mental Health Providers Yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {userZipCode
                  ? `No mental health professionals found serving ZIP code ${userZipCode}. Try clearing the filter to see all providers.`
                  : "Be the first mental health professional to join our platform and connect with clients in your area."}
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">Register Your Practice</Button>
            </div>
          </div>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column - Business Info */}
                  <div className="lg:col-span-4 space-y-3">
                    <h3 className="text-xl font-semibold">{provider.name}</h3>

                    {provider.location && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span>{provider.location}</span>
                      </div>
                    )}

                    {provider.phone && (
                      <div className="flex items-center text-gray-600 text-sm">
                        <Phone className="w-4 h-4 mr-1 flex-shrink-0" />
                        <a href={`tel:${provider.phone}`} className="hover:text-primary">
                          {provider.phone}
                        </a>
                      </div>
                    )}

                    {/* Service Area Indicator */}
                    {userZipCode && (
                      <div>
                        {provider.isNationwide ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Serves nationwide
                          </span>
                        ) : provider.serviceArea && provider.serviceArea.includes(userZipCode) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Serves {userZipCode} and surrounding areas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Primary location: {provider.zipCode}
                          </span>
                        )}
                      </div>
                    )}

                    {provider.services && provider.services.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {provider.services.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(service)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Center Column - Photos */}
                  <div className="lg:col-span-5">
                    <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                      {businessPhotos[provider.id] && businessPhotos[provider.id].length > 0 ? (
                        <div className="flex space-x-1 h-full">
                          {businessPhotos[provider.id].slice(0, 5).map((photo, index) => (
                            <div key={photo.id} className="flex-1 h-full">
                              <Image
                                src={photo.url || "/placeholder.svg"}
                                alt={`${provider.name} photo ${index + 1}`}
                                width={120}
                                height={128}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = "/placeholder.svg?height=128&width=120&text=No+Image"
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <div className="text-center">
                            <svg
                              className="w-8 h-8 text-gray-400 mx-auto mb-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="text-xs text-gray-500">No photos available</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Action Buttons */}
                  <div className="lg:col-span-3 flex flex-col justify-center space-y-2">
                    <Button size="xs" className="w-full" onClick={() => handleOpenReviews(provider)}>
                      Reviews
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      className="w-full bg-transparent"
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

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name}
        reviews={selectedProvider?.reviews || []}
      />

      {/* Business Profile Dialog */}
      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
          businessName={selectedProvider.name}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
