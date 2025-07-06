"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useEffect, useRef } from "react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { Phone, X } from "lucide-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"

// Photo Carousel Component - displays 5 photos in landscape format
interface PhotoCarouselProps {
  photos: string[]
  businessName: string
}

function PhotoCarousel({ photos, businessName }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!photos || photos.length === 0) {
    return null // Don't show anything if no photos
  }

  const photosPerView = 5
  const maxIndex = Math.max(0, photos.length - photosPerView)

  const nextPhotos = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const prevPhotos = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const visiblePhotos = photos.slice(currentIndex, currentIndex + photosPerView)

  return (
    <div className="hidden lg:block w-full">
      <div className="relative group w-full">
        <div className="flex gap-2 justify-center w-full">
          {visiblePhotos.map((photo, index) => (
            <div key={currentIndex + index} className="w-40 h-30 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={photo || "/placeholder.svg"}
                alt={`${businessName} photo ${currentIndex + index + 1}`}
                width={160}
                height={120}
                className="w-full h-full object-cover"
                sizes="160px"
              />
            </div>
          ))}

          {/* Fill empty slots if less than 5 photos visible */}
          {visiblePhotos.length < photosPerView && (
            <>
              {Array.from({ length: photosPerView - visiblePhotos.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="w-40 h-30 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex-shrink-0"
                ></div>
              ))}
            </>
          )}
        </div>

        {/* Navigation arrows - only show if there are more than 5 photos */}
        {photos.length > photosPerView && (
          <>
            <button
              onClick={prevPhotos}
              disabled={currentIndex === 0}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextPhotos}
              disabled={currentIndex >= maxIndex}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed z-10"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Photo counter */}
        {photos.length > photosPerView && (
          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {Math.min(currentIndex + photosPerView, photos.length)} of {photos.length}
          </div>
        )}
      </div>

      {/* Pagination dots - only show if there are more than 5 photos */}
      {photos.length > photosPerView && (
        <div className="flex justify-center mt-2 space-x-1">
          {Array.from({ length: Math.ceil(photos.length / photosPerView) }).map((_, index) => {
            const pageStartIndex = index * photosPerView
            const isActive = currentIndex >= pageStartIndex && currentIndex < pageStartIndex + photosPerView
            return (
              <button
                key={index}
                onClick={() => setCurrentIndex(pageStartIndex)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? "bg-blue-500" : "bg-gray-300"}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

// Function to load business photos from Cloudflare using public URLs
const loadBusinessPhotos = async (businessId: string): Promise<string[]> => {
  try {
    console.log(`Loading photos for business ${businessId}`)

    // Fetch business media data from the updated API
    const response = await fetch(`/api/businesses/${businessId}`)
    if (!response.ok) {
      console.error(`Failed to fetch business data: ${response.status} ${response.statusText}`)
      return []
    }

    const businessData = await response.json()
    console.log(`Business data for ${businessId}:`, businessData)

    // Try multiple possible locations for photo data
    let photoAlbum = null

    // Check direct photoAlbum property
    if (businessData.photoAlbum && Array.isArray(businessData.photoAlbum)) {
      photoAlbum = businessData.photoAlbum
    }
    // Check nested media.photoAlbum
    else if (businessData.media?.photoAlbum && Array.isArray(businessData.media.photoAlbum)) {
      photoAlbum = businessData.media.photoAlbum
    }
    // Check adDesign.photoAlbum
    else if (businessData.adDesign?.photoAlbum && Array.isArray(businessData.adDesign.photoAlbum)) {
      photoAlbum = businessData.adDesign.photoAlbum
    }

    if (!photoAlbum || !Array.isArray(photoAlbum)) {
      console.log(`No photo album found for business ${businessId}`)
      return []
    }

    console.log(`Found ${photoAlbum.length} photos in album for business ${businessId}`)

    // Convert Cloudflare image IDs to public URLs
    const photoUrls = photoAlbum
      .map((photo: any, index: number) => {
        // Handle different photo data structures
        let imageId = null

        if (typeof photo === "string") {
          // If photo is just a string (image ID)
          imageId = photo
        } else if (photo && typeof photo === "object") {
          // If photo is an object, try to extract the image ID
          imageId = photo.imageId || photo.id || photo.cloudflareId || photo.url

          // If it's already a full URL, return it as-is
          if (typeof imageId === "string" && (imageId.startsWith("http") || imageId.startsWith("https"))) {
            console.log(`Photo ${index} already has full URL: ${imageId}`)
            return imageId
          }
        }

        if (!imageId) {
          console.warn(`No image ID found for photo ${index}:`, photo)
          return null
        }

        // Generate public Cloudflare URL
        try {
          const publicUrl = getCloudflareImageUrl(imageId, "public")
          console.log(`Generated URL for image ${imageId}: ${publicUrl}`)
          return publicUrl
        } catch (error) {
          console.error(`Error generating URL for image ${imageId}:`, error)
          return null
        }
      })
      .filter(Boolean) // Remove null/undefined URLs

    console.log(`Successfully loaded ${photoUrls.length} photos for business ${businessId}`)
    return photoUrls
  } catch (error) {
    console.error(`Error loading photos for business ${businessId}:`, error)
    return []
  }
}

// Enhanced Business interface with service area
interface Business {
  id: string
  displayName?: string
  businessName: string
  displayLocation?: string
  displayPhone?: string
  zipCode: string
  serviceArea?: string[] // Changed from object to string array
  isNationwide?: boolean // Added separate isNationwide flag
  subcategories?: string[]
  adDesignData?: any
  photos?: string[] // Add this line
}

// Helper function to extract string from subcategory (handles both string and object formats)
const getSubcategoryString = (subcategory: any): string => {
  if (typeof subcategory === "string") {
    return subcategory
  }
  if (typeof subcategory === "object" && subcategory !== null) {
    return subcategory.subcategory || subcategory.category || "Unknown Service"
  }
  return "Unknown Service"
}

export default function MedicalPractitionersPage() {
  const filterOptions = [
    { id: "medical1", label: "Chiropractors", value: "Chiropractors" },
    { id: "medical2", label: "Dentists", value: "Dentists" },
    { id: "medical3", label: "Orthodontists", value: "Orthodontists" },
    { id: "medical4", label: "Optometrists", value: "Optometrists" },
    { id: "medical5", label: "Podiatrists", value: "Podiatrists" },
    { id: "medical6", label: "Audiologists", value: "Audiologists" },
    { id: "medical7", label: "Dietitians and Nutritionists", value: "Dietitians and Nutritionists" },
    { id: "medical8", label: "Naturopaths", value: "Naturopaths" },
    { id: "medical9", label: "Herbalists", value: "Herbalists" },
    { id: "medical10", label: "Acupuncturist", value: "Acupuncturist" },
    { id: "medical11", label: "Orthotists and Prosthetists", value: "Orthotists and Prosthetists" },
    { id: "medical12", label: "Midwives and Doulas", value: "Midwives and Doulas" },
  ]

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState<any[]>([])

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

  useEffect(() => {
    async function fetchProviders() {
      const currentFetchId = ++fetchIdRef.current
      console.log(
        `[${new Date().toISOString()}] Fetching businesses for /medical-practitioners (request #${currentFetchId})`,
      )

      try {
        setLoading(true)

        // Use the centralized system
        let result = await getBusinessesForCategoryPage("/medical-practitioners")
        console.log(
          `[${new Date().toISOString()}] Retrieved ${result.length} total businesses (request #${currentFetchId})`,
        )

        // Check if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${currentFetchId}`)
          return
        }

        // Load photos for each business using public Cloudflare URLs
        const businessesWithPhotos = await Promise.all(
          result.map(async (business: Business) => {
            const photos = await loadBusinessPhotos(business.id)
            return { ...business, photos }
          }),
        )

        // Check if this is still the latest request after photo loading
        if (currentFetchId !== fetchIdRef.current) {
          console.log(
            `[${new Date().toISOString()}] Ignoring stale response after photo loading for request #${currentFetchId}`,
          )
          return
        }

        result = businessesWithPhotos

        result.forEach((business) => {
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
          result = result.filter((business) => businessServesZipCode(business, userZipCode))
          console.log(
            `[${new Date().toISOString()}] After filtering: ${result.length} businesses (request #${currentFetchId})`,
          )
        }

        if (result && result.length > 0) {
          // Transform the business data to match the expected provider format
          const transformedProviders = result.map((business) => ({
            id: business.id,
            name: business.displayName || business.businessName,
            location:
              business.displayLocation ||
              `${business.displayCity || ""}, ${business.displayState || ""}`.trim() ||
              `Zip: ${business.zipCode}`,
            rating: 0, // Changed from 4.5 to 0 - no demo rating
            reviews: 0, // Changed from 12 to 0 - no demo reviews
            services: business.subcategories || ["General Practice"],
            // Get phone from ad design data if available, otherwise use registration phone
            phone: business.adDesignData?.businessInfo?.phone || business.phone || "No phone provided",
            address: business.address,
            adDesignData: business.adDesignData,
            serviceArea: business.serviceArea,
            isNationwide: business.isNationwide,
            zipCode: business.zipCode,
            photos: business.photos || [], // Add photos to transformed providers
          }))

          console.log("Transformed providers with phone numbers:", transformedProviders)
          setProviders(transformedProviders)
          setAllProviders(transformedProviders)
        } else {
          setProviders([])
        }
      } catch (err) {
        console.error("Error fetching medical practitioners:", err)
        if (currentFetchId === fetchIdRef.current) {
          setError("Failed to load providers")
          setProviders([])
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchProviders()
  }, [userZipCode])

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // State for business profile dialog
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

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "No phone provided"

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "")

    // Check if we have a 10-digit number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }

    // Return original if not a standard format
    return phone
  }

  return (
    <CategoryLayout title="Medical Practitioners (non MD/DO)" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/dentists-Yk2J0P7JAsffashXwMR6wGx202Gf6v.png"
            alt="Medical Practitioners"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified healthcare professionals in your area. Browse practitioners below or use filters to narrow
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

      {/* Enhanced Filter Controls */}
      <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filter by Medical Specialty</h3>
          <span className="text-sm text-gray-500">{selectedFilters.length} selected</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
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
                Showing {providers.length} of {allProviders.length} medical practitioners
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
            <p className="mt-2 text-gray-600">Loading medical practitioners...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {userZipCode ? `No Medical Practitioners Found in ${userZipCode}` : "No Medical Practitioners Yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {userZipCode
                  ? `No medical practitioners found serving ZIP code ${userZipCode}. Try clearing the filter to see all providers.`
                  : "Be the first healthcare professional to join our platform and connect with patients in your area."}
              </p>
              <Button className="bg-green-600 hover:bg-green-700">Register Your Practice</Button>
            </div>
          </div>
        ) : (
          providers.map((provider) => (
            <div key={provider.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex flex-col space-y-4">
                {/* Business Name and Description */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{provider.name}</h3>
                  {provider.businessDescription && (
                    <p className="text-gray-600 text-sm leading-relaxed">{provider.businessDescription}</p>
                  )}
                </div>

                {/* Main content area with contact info, photos, and buttons */}
                <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                  {/* Left side - Contact and Location Info - Made smaller */}
                  <div className="lg:w-64 space-y-2 flex-shrink-0">
                    {/* Phone */}
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{formatPhoneNumber(provider.phone)}</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-gray-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
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
                      <span className="text-sm text-gray-700">{provider.location}</span>
                    </div>

                    {/* Service Area Indicator */}
                    {userZipCode && (
                      <div className="text-xs text-green-600 mt-1">
                        {provider.isNationwide ? (
                          <span>✓ Serves nationwide</span>
                        ) : provider.serviceArea?.includes(userZipCode) ? (
                          <span>✓ Serves {userZipCode} and surrounding areas</span>
                        ) : provider.zipCode === userZipCode ? (
                          <span>✓ Located in {userZipCode}</span>
                        ) : null}
                      </div>
                    )}

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-4 h-4 ${
                              provider.reviews > 0 && star <= Math.floor(provider.rating)
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        {provider.reviews > 0 ? `${provider.rating} (${provider.reviews} reviews)` : "No reviews yet"}
                      </span>
                    </div>
                  </div>

                  {/* Middle - Photo Carousel (desktop only) - Now has more space */}
                  <div className="flex-1 flex justify-center">
                    <PhotoCarousel photos={provider.photos || []} businessName={provider.name} />
                  </div>

                  {/* Right side - Action Buttons */}
                  <div className="flex flex-col gap-2 lg:items-end lg:w-24 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenReviews(provider)}
                      className="text-sm min-w-[100px]"
                    >
                      Reviews
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenProfile(provider)}
                      className="text-sm min-w-[100px]"
                    >
                      View Profile
                    </Button>
                  </div>
                </div>

                {/* Services/Specialties */}
                {provider.services && provider.services.length > 0 && (
                  <div className="w-full">
                    <div className="lg:w-64">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                    </div>
                    <div className="flex flex-wrap gap-2 w-full">
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
            </div>
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
