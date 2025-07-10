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

// Enhanced Business interface
interface Business {
  id: string
  displayName?: string
  businessName?: string
  businessDescription?: string
  displayLocation?: string
  displayPhone?: string
  rating?: number
  reviewCount?: number
  subcategories?: any[]
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
  photos?: string[]
}

// Helper function to extract string from subcategory data
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
            <div key={currentIndex + index} className="w-48 h-36 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={photo || "/placeholder.svg"}
                alt={`${businessName} photo ${currentIndex + index + 1}`}
                width={192}
                height={144}
                className="w-full h-full object-cover"
                sizes="192px"
              />
            </div>
          ))}

          {/* Fill empty slots if less than 5 photos visible */}
          {visiblePhotos.length < photosPerView && (
            <>
              {Array.from({ length: photosPerView - visiblePhotos.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="w-48 h-36 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex-shrink-0"
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

export default function PetCarePage() {
  // Add fetchIdRef for race condition prevention
  const fetchIdRef = useRef(0)

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    rating: number
    reviews: number
  } | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

  const filterOptions = [
    { id: "pet1", label: "Veterinarians", value: "Veterinarians" },
    { id: "pet2", label: "Pet Hospitals", value: "Pet Hospitals" },
    { id: "pet3", label: "Dog Fencing/Invisible Fence", value: "Dog Fencing/Invisible Fence" },
    { id: "pet4", label: "Pet Groomers", value: "Pet Groomers" },
    { id: "pet5", label: "Pet Trainers", value: "Pet Trainers" },
    { id: "pet6", label: "Pet Walkers", value: "Pet Walkers" },
    { id: "pet7", label: "Pet Sitters", value: "Pet Sitters" },
    { id: "pet8", label: "Pet Boarders", value: "Pet Boarders" },
    { id: "pet9", label: "Pet Breeders", value: "Pet Breeders" },
    { id: "pet10", label: "Pet Shops", value: "Pet Shops" },
    { id: "pet11", label: "Pet Rescues", value: "Pet Rescues" },
    { id: "pet12", label: "Aquariums/Pet Enclosures", value: "Aquariums/Pet Enclosures" },
    { id: "pet13", label: "Pet Poop Pickup", value: "Pet Poop Pickup" },
    { id: "pet14", label: "Other Pet Care", value: "Other Pet Care" },
  ]

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  // Helper function to check if business serves the zip code
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
    } else {
      const filtered = allBusinesses.filter((business) => hasExactSubcategoryMatch(business, selectedFilters))
      console.log("Filtered results:", filtered)
      setFilteredBusinesses(filtered)
      setAppliedFilters([...selectedFilters])
    }
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses(allBusinesses)
  }

  // Fetch businesses with race condition prevention
  useEffect(() => {
    async function loadBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[PetCare] Starting fetch ${currentFetchId} for zip code:`, userZipCode)

      try {
        setLoading(true)
        const fetchedBusinesses = await getBusinessesForCategoryPage("/pet-care")

        // Load photos for each business using public Cloudflare URLs
        const businessesWithPhotos = await Promise.all(
          fetchedBusinesses.map(async (business: Business) => {
            const photos = await loadBusinessPhotos(business.id)
            return { ...business, photos }
          }),
        )

        // Only update if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[PetCare] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[PetCare] Fetch ${currentFetchId} got ${fetchedBusinesses.length} businesses`)

        // Filter businesses by zip code if userZipCode is available
        if (userZipCode) {
          const originalCount = businessesWithPhotos.length
          const filteredBusinesses = businessesWithPhotos.filter((business: Business) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[PetCare] Filtered from ${originalCount} to ${filteredBusinesses.length} businesses for zip ${userZipCode}`,
          )
          setBusinesses(filteredBusinesses)
          setAllBusinesses(filteredBusinesses)
          setFilteredBusinesses(filteredBusinesses)
        } else {
          setBusinesses(businessesWithPhotos)
          setAllBusinesses(businessesWithPhotos)
          setFilteredBusinesses(businessesWithPhotos)
        }
      } catch (error) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[PetCare] Fetch ${currentFetchId} error:`, error)
        }
      } finally {
        // Only update loading if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    loadBusinesses()
  }, [userZipCode])

  const handleViewReviews = (business: Business) => {
    setSelectedProvider({
      id: Number.parseInt(business.id || "0"),
      name: business.displayName || business.businessName || "Pet Care Provider",
      rating: business.rating || 0,
      reviews: business.reviewCount || 0,
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: Business) => {
    console.log("Opening profile for business:", business.id, business.businessName)
    setSelectedBusinessId(business.id || "")
    setSelectedBusinessName(business.displayName || business.businessName || "Pet Care Provider")
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Pet Care Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/cat%20and%20dog-7hvR8Ytt6JBV7PFG8N6uigZg80K6xP.png"
            alt="Pet Care Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified pet care professionals in your area. Browse services below or use filters to narrow your
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
          <p className="mt-2 text-gray-600">Loading pet care providers...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Pet Care Providers ({filteredBusinesses.length})</h2>
          <div className="grid gap-6">
            {filteredBusinesses.map((business: Business) => (
              <div key={business.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex flex-col space-y-4">
                  {/* Business Name and Description */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {business.displayName || business.businessName || "Pet Care Provider"}
                    </h3>
                    {business.businessDescription && (
                      <p className="text-gray-600 text-sm leading-relaxed">{business.businessDescription}</p>
                    )}
                  </div>

                  {/* Main content area with contact info, photos, and buttons */}
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

                    {/* Middle - Photo Carousel (desktop only) - Now has more space */}
                    <div className="flex-1 flex justify-center">
                      <PhotoCarousel
                        photos={business.photos || []}
                        businessName={business.displayName || business.businessName || "Pet Care Provider"}
                      />
                    </div>

                    {/* Right side - Action Buttons */}
                    <div className="flex flex-col gap-2 lg:items-end lg:w-24 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReviews(business)}
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
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Specialties:</h4>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Pet Care Providers Found</h3>
          <p className="text-gray-600">
            {userZipCode
              ? `No pet care providers found that serve the ${userZipCode} area.`
              : "Enter your zip code to find pet care providers in your area."}
          </p>
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
