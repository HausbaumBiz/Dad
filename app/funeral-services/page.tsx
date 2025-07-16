"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"
import { toast } from "@/components/ui/use-toast"

// Helper function to extract string from subcategory (handles both string and object formats)
const getSubcategoryString = (subcategory: any): string => {
  if (typeof subcategory === "string") {
    return subcategory
  }

  if (subcategory && typeof subcategory === "object") {
    // Try to get the subcategory field first, then category, then fullPath
    return subcategory.subcategory || subcategory.category || subcategory.fullPath || "Unknown Service"
  }

  return "Unknown Service"
}

// Enhanced Business interface
interface Business {
  id: string
  businessName?: string
  displayName?: string
  displayPhone?: string
  displayLocation?: string
  rating?: number
  reviews?: number
  reviewCount?: number
  subcategories?: any[]
  businessDescription?: string
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
  photos?: string[]
  adDesignData?: {
    businessInfo?: {
      phone?: string
      city?: string
      state?: string
    }
  }
  allSubcategories?: any[]
  subcategory?: string
}

// Photo Carousel Component - displays 5 photos in 220px × 220px format
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
            <div
              key={currentIndex + index}
              className="w-[220px] h-[220px] bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
            >
              <Image
                src={photo || "/placeholder.svg"}
                alt={`${businessName} photo ${currentIndex + index + 1}`}
                width={220}
                height={220}
                className="w-full h-full object-cover"
                sizes="220px"
              />
            </div>
          ))}

          {/* Fill empty slots if less than 5 photos visible */}
          {visiblePhotos.length < photosPerView && (
            <>
              {Array.from({ length: photosPerView - visiblePhotos.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="w-[220px] h-[220px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex-shrink-0"
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

// Mobile Photo Carousel Component - displays 2 photos side by side
interface MobilePhotoCarouselProps {
  photos: string[]
  businessName: string
}

function MobilePhotoCarousel({ photos, businessName }: MobilePhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!photos || photos.length === 0) {
    return null
  }

  const mobileNext = () => {
    if (currentIndex < photos.length - 2) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      setCurrentIndex(0) // Loop back to start
    }
  }

  const mobilePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    } else {
      setCurrentIndex(Math.max(0, photos.length - 2)) // Go to last possible position
    }
  }

  const visiblePhotos = photos.slice(currentIndex, currentIndex + 2)

  // Fill with placeholder if we have less than 2 photos
  while (visiblePhotos.length < 2 && photos.length > 0) {
    visiblePhotos.push(photos[0]) // Repeat first photo as placeholder
  }

  return (
    <div className="relative">
      <div className="flex gap-2 px-8">
        {visiblePhotos.map((photo, index) => (
          <div key={`${currentIndex}-${index}`} className="flex-1 aspect-square">
            <Image
              src={photo || "/placeholder.svg"}
              alt={`${businessName} photo ${currentIndex + index + 1}`}
              className="w-full h-full object-cover rounded-lg"
              width={200}
              height={200}
            />
          </div>
        ))}
      </div>

      {/* Mobile Navigation Arrows - positioned outside photo area */}
      {photos.length > 2 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-black/80 text-white hover:bg-black/90 p-2 h-10 w-10 z-10 rounded-full shadow-lg"
            onClick={mobilePrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-black/80 text-white hover:bg-black/90 p-2 h-10 w-10 z-10 rounded-full shadow-lg"
            onClick={mobileNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
        {Math.min(currentIndex + 2, photos.length)} of {photos.length}
      </div>
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

// Helper function to check if business serves a zip code
const businessServesZipCode = (business: Business, zipCode: string): boolean => {
  console.log(`Checking if business ${business.displayName || business.businessName} serves ${zipCode}:`, {
    isNationwide: business.isNationwide,
    serviceArea: business.serviceArea,
    primaryZip: business.zipCode,
  })

  // Check if business serves nationwide
  if (business.isNationwide) {
    console.log(`✓ Business serves nationwide`)
    return true
  }

  // Check if zip code is in service area
  if (business.serviceArea && Array.isArray(business.serviceArea)) {
    const serves = business.serviceArea.includes(zipCode)
    console.log(`${serves ? "✓" : "✗"} Service area check: ${business.serviceArea.join(", ")}`)
    return serves
  }

  // Fallback to primary zip code
  const matches = business.zipCode === zipCode
  console.log(`${matches ? "✓" : "✗"} Primary zip code check: ${business.zipCode}`)
  return matches
}

export default function FuneralServicesPage() {
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "funeral1", label: "Funeral Homes", value: "Funeral Homes" },
    { id: "funeral2", label: "Cremation Services", value: "Cremation Services" },
    { id: "funeral3", label: "Memorial Services", value: "Memorial Services" },
    { id: "funeral4", label: "Burial Services", value: "Burial Services" },
    { id: "funeral5", label: "Pre-Planning Services", value: "Pre-Planning Services" },
    { id: "funeral6", label: "Grief Counseling", value: "Grief Counseling" },
    { id: "funeral7", label: "Cemetery Services", value: "Cemetery Services" },
    { id: "funeral8", label: "Monument & Headstone Services", value: "Monument & Headstone Services" },
    { id: "funeral9", label: "Florists", value: "Florists" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    rating: number
    reviews: number
  } | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")

  // State for businesses
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  // Helper function for exact subcategory matching
  const hasExactSubcategoryMatch = (business: Business, filters: string[]): boolean => {
    if (filters.length === 0) return true

    console.log(`Checking business ${business.displayName || business.businessName} subcategories:`, {
      subcategories: business.subcategories,
      filters,
    })

    // Check subcategories array
    if (business.subcategories && Array.isArray(business.subcategories)) {
      const hasMatch = filters.some((filter) =>
        business.subcategories!.some((subcat) => getSubcategoryString(subcat) === filter),
      )
      if (hasMatch) return true
    }

    return false
  }

  // Filter handlers
  const handleFilterChange = (filterValue: string, checked: boolean) => {
    setSelectedFilters((prev) => (checked ? [...prev, filterValue] : prev.filter((f) => f !== filterValue)))
  }

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All businesses:", allBusinesses)

    if (selectedFilters.length === 0) {
      setFilteredBusinesses(allBusinesses)
      setAppliedFilters([])
      toast({
        title: "Filters cleared",
        description: `Showing all ${allBusinesses.length} funeral service providers`,
      })
    } else {
      const filtered = allBusinesses.filter((business) => hasExactSubcategoryMatch(business, selectedFilters))
      console.log("Filtered results:", filtered)
      setFilteredBusinesses(filtered)
      setAppliedFilters([...selectedFilters])
      toast({
        title: "Filters applied",
        description: `Found ${filtered.length} funeral service providers matching your criteria`,
      })
    }
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses(allBusinesses)
    toast({
      title: "Filters cleared",
      description: `Showing all ${allBusinesses.length} funeral service providers`,
    })
  }

  // Fetch businesses with race condition prevention
  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current

      try {
        setLoading(true)
        setError(null)

        console.log(`[Funeral Services] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

        const fetchedBusinesses = await getBusinessesForCategoryPage("/funeral-services")

        // Load photos for each business using public Cloudflare URLs
        const businessesWithPhotos = await Promise.all(
          fetchedBusinesses.map(async (business: Business) => {
            const photos = await loadBusinessPhotos(business.id)
            return { ...business, photos }
          }),
        )

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Funeral Services] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Funeral Services] Fetch ${currentFetchId} completed, got ${fetchedBusinesses.length} businesses`)

        // Filter by zip code if available
        let filteredBusinesses = businessesWithPhotos
        if (userZipCode) {
          console.log(`[Funeral Services] Filtering by zip code: ${userZipCode}`)
          filteredBusinesses = businessesWithPhotos.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Funeral Services] Business ${business.displayName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              {
                serviceArea: business.serviceArea,
                primaryZip: business.zipCode,
              },
            )
            return serves
          })
          console.log(`[Funeral Services] After filtering: ${filteredBusinesses.length} businesses`)
        }

        setBusinesses(filteredBusinesses)
        setAllBusinesses(filteredBusinesses)
        setFilteredBusinesses(filteredBusinesses)
      } catch (err) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Funeral Services] Error in fetch ${currentFetchId}:`, err)
          setError("Failed to load funeral services")
        }
      } finally {
        // Only update loading if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  const handleOpenReviews = (business: Business) => {
    setSelectedProvider({
      id: Number.parseInt(business.id || "0"),
      name: business.displayName || business.businessName || "Funeral Service Provider",
      rating: business.rating || 0,
      reviews: business.reviewCount || business.reviews || 0,
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: Business) => {
    console.log("Opening profile for business:", business.id, business.businessName)
    setSelectedBusinessId(business.id || "")
    setSelectedBusinessName(business.displayName || business.businessName || "Funeral Service Provider")
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Funeral Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/funeral02-ucBlsKFT249wL1nxpps7j52TtTVUcy.png"
            alt="Funeral Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              e.currentTarget.src = "/placeholder.svg?height=500&width=500&text=Funeral+Services"
            }}
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find compassionate funeral service providers in your area. Browse services below or use filters to narrow
            your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read reviews from other families</li>
              <li>View business videos showcasing facilities and staff</li>
              <li>Access information directly on each business listing</li>
              <li>Connect with trusted funeral service providers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Showing businesses that serve zip code:</span> {userZipCode}
            <span className="text-xs block mt-1">Includes businesses with {userZipCode} in their service area</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem("savedZipCode")
              setUserZipCode(null)
            }}
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            Clear Filter
          </Button>
        </div>
      )}

      {/* Enhanced Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filter by Service Type</h3>
          <div className="text-sm text-gray-600">
            {selectedFilters.length > 0 &&
              `${selectedFilters.length} filter${selectedFilters.length > 1 ? "s" : ""} selected`}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filterOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedFilters.includes(option.value)}
                onCheckedChange={(checked) => handleFilterChange(option.value, checked as boolean)}
              />
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={applyFilters} disabled={selectedFilters.length === 0} className="min-w-[120px]">
            Apply Filters
          </Button>
          {appliedFilters.length > 0 && (
            <Button variant="outline" onClick={clearFilters} className="min-w-[120px] bg-transparent">
              Clear Filters
            </Button>
          )}
        </div>

        {appliedFilters.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Active filters:</strong> {appliedFilters.join(", ")}
              <br />
              <span className="text-blue-600">
                Showing {filteredBusinesses.length} of {allBusinesses.length} businesses
              </span>
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="mt-8 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading funeral service providers...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userZipCode ? `No Funeral Services in ${userZipCode} Area` : "No Funeral Service Providers Yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `We're building our network of funeral service providers in the ${userZipCode} area.`
                : "Be the first funeral service provider to join our platform and connect with families in your area."}
            </p>
            <Button className="bg-slate-600 hover:bg-slate-700">Register Your Funeral Home</Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Funeral Service Providers ({filteredBusinesses.length})</h2>
          <div className="grid gap-6">
            {filteredBusinesses.map((business: Business) => (
              <div key={business.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex flex-col space-y-4">
                  {/* Business Name and Description */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {business.displayName || business.businessName || "Funeral Service Provider"}
                    </h3>
                    {business.businessDescription && (
                      <p className="text-gray-600 text-sm leading-relaxed">{business.businessDescription}</p>
                    )}
                  </div>

                  {/* Main content area with contact info and buttons */}
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Left side - Contact and Location Info - Made smaller */}
                    <div className="lg:w-64 space-y-2 flex-shrink-0">
                      {/* Phone */}
                      {business.displayPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`tel:${business.displayPhone}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            {business.displayPhone}
                          </a>
                        </div>
                      )}

                      {/* Location */}
                      {business.displayLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{business.displayLocation}</span>
                        </div>
                      )}

                      {/* Service Area Indicator */}
                      {userZipCode && (
                        <div className="text-xs text-green-600 mt-1">
                          {business.isNationwide ? (
                            <span>✓ Serves nationwide</span>
                          ) : business.serviceArea?.includes(userZipCode) ? (
                            <span>✓ Serves {userZipCode} and surrounding areas</span>
                          ) : business.zipCode === userZipCode ? (
                            <span>✓ Located in {userZipCode}</span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Right side - Action Buttons */}
                    <div className="flex flex-col gap-2 lg:items-end lg:ml-auto lg:w-24 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReviews(business)}
                        className="text-sm min-w-[100px]"
                      >
                        Ratings
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewProfile(business)}
                        className="text-sm min-w-[100px]"
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>

                  {/* Subcategories/Specialties */}
                  {business.subcategories && business.subcategories.length > 0 && (
                    <div className="w-full">
                      <div className="lg:w-64">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full">
                        {business.subcategories.map((subcategory: any, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {getSubcategoryString(subcategory)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photo Carousel - Desktop version (unchanged) */}
                  <div className="hidden lg:block w-full">
                    <PhotoCarousel
                      photos={business.photos || []}
                      businessName={business.displayName || business.businessName || "Funeral Service Provider"}
                    />
                  </div>

                  {/* Photo Carousel - Mobile version (new) */}
                  <div className="lg:hidden w-full">
                    {business.photos && business.photos.length > 0 && (
                      <div className="mb-4">
                        <MobilePhotoCarousel
                          photos={business.photos}
                          businessName={business.displayName || business.businessName || "Funeral Service Provider"}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name || ""}
        businessId={selectedProvider?.id.toString() || ""}
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
