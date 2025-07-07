"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { AdBox } from "@/components/ad-box"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useToast } from "@/components/ui/use-toast"
import { Phone, Loader2, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"

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
  subcategories?: string[]
  allSubcategories?: string[]
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
  photos?: string[]
  businessDescription?: string
  displayLocation?: string
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

// Add this helper function after the formatPhoneNumber function and before the component
function getSubcategoryString(subcategory: any): string {
  if (typeof subcategory === "string") {
    return subcategory
  }

  // Handle object format with various possible properties
  if (typeof subcategory === "object" && subcategory !== null) {
    // Return the most specific value available
    return (
      subcategory.subcategory || subcategory.name || subcategory.fullPath || subcategory.category || "Unknown Service"
    )
  }

  return "Unknown Service"
}

// Helper function for exact subcategory matching
const hasExactSubcategoryMatch = (business: Business, filters: string[]): boolean => {
  if (filters.length === 0) return true

  console.log(`Checking business ${business.displayName || business.businessName} subcategories:`, {
    subcategories: business.subcategories,
    allSubcategories: business.allSubcategories,
    services: business.services,
    filters,
  })

  // Collect all subcategory strings from all sources
  const allSubcategoryStrings: string[] = []

  // Check subcategories array
  if (business.subcategories && Array.isArray(business.subcategories)) {
    business.subcategories.forEach((subcategory) => {
      const subcategoryString = getSubcategoryString(subcategory)
      if (subcategoryString && subcategoryString !== "Unknown Service") {
        allSubcategoryStrings.push(subcategoryString)
      }
    })
  }

  // Check allSubcategories array
  if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
    business.allSubcategories.forEach((subcategory) => {
      const subcategoryString = getSubcategoryString(subcategory)
      if (subcategoryString && subcategoryString !== "Unknown Service") {
        allSubcategoryStrings.push(subcategoryString)
      }
    })
  }

  // Check services array (fallback)
  if (business.services && Array.isArray(business.services)) {
    business.services.forEach((service) => {
      const serviceString = getSubcategoryString(service)
      if (serviceString && serviceString !== "Unknown Service") {
        allSubcategoryStrings.push(serviceString)
      }
    })
  }

  // Remove duplicates
  const uniqueSubcategories = [...new Set(allSubcategoryStrings)]

  console.log(`Business ${business.displayName || business.businessName} subcategory strings:`, uniqueSubcategories)

  // Check for matches using case-insensitive comparison
  const hasMatch = filters.some((filter) => {
    const filterLower = filter.toLowerCase().trim()
    const match = uniqueSubcategories.some((subcategory) => {
      const subcategoryLower = subcategory.toLowerCase().trim()
      // Check for exact match or partial match
      return (
        subcategoryLower === filterLower ||
        subcategoryLower.includes(filterLower) ||
        filterLower.includes(subcategoryLower)
      )
    })

    if (match) {
      console.log(`✅ Found match for filter "${filter}" in business ${business.displayName || business.businessName}`)
    }

    return match
  })

  console.log(`Business ${business.displayName || business.businessName} matches filters: ${hasMatch}`)
  return hasMatch
}

export default function AutomotiveServicesPage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "auto1", label: "General Auto Repair", value: "General Auto Repair" },
    { id: "auto2", label: "Engine and Transmission", value: "Engine and Transmission" },
    { id: "auto3", label: "Body Shop", value: "Body Shop" },
    { id: "auto4", label: "Tire and Brakes", value: "Tire and Brakes" },
    { id: "auto5", label: "Mufflers", value: "Mufflers" },
    { id: "auto6", label: "Oil Change", value: "Oil Change" },
    { id: "auto7", label: "Windshield Repair", value: "Windshield Repair" },
    { id: "auto8", label: "Custom Paint", value: "Custom Paint" },
    { id: "auto9", label: "Detailing Services", value: "Detailing Services" },
    { id: "auto10", label: "Car Wash", value: "Car Wash" },
    { id: "auto11", label: "Auto Parts", value: "Auto Parts" },
    { id: "auto12", label: "ATV/Motorcycle Repair", value: "ATV/Motorcycle Repair" },
    { id: "auto13", label: "Utility Vehicle Repair", value: "Utility Vehicle Repair" },
    { id: "auto14", label: "RV Maintenance and Repair", value: "RV Maintenance and Repair" },
    { id: "auto15", label: "Other Automotive/Motorcycle/RV, etc", value: "Other Automotive/Motorcycle/RV, etc" },
    { id: "auto16", label: "Automotive Sales", value: "Automotive Sales" },
    { id: "auto17", label: "Motor Sport/Utility Vehicle/RV Sales", value: "Motor Sport/Utility Vehicle/RV Sales" },
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

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

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

    toast({
      title: "Filters Applied",
      description: `${selectedFilters.length === 0 ? "Showing all" : `Found ${filteredBusinesses.length}`} automotive service providers`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses(allBusinesses)
    toast({
      title: "Filters Cleared",
      description: "Showing all automotive service providers",
    })
  }

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

        // Load photos for each business using public Cloudflare URLs
        const businessesWithPhotos = await Promise.all(
          result.map(async (business: Business) => {
            const photos = await loadBusinessPhotos(business.id)
            return { ...business, photos }
          }),
        )

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
          const filteredBusinesses = businessesWithPhotos.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Automotive Services] Business ${business.displayName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              business,
            )
            return serves
          })
          console.log(`[Automotive Services] After filtering: ${filteredBusinesses.length} businesses`)
          setBusinesses(filteredBusinesses)
          setAllBusinesses(filteredBusinesses)
          setFilteredBusinesses(filteredBusinesses)
        } else {
          setBusinesses(businessesWithPhotos)
          setAllBusinesses(businessesWithPhotos)
          setFilteredBusinesses(businessesWithPhotos)
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
              className="text-blue-600 border-blue-300 hover:bg-blue-100 bg-transparent"
            >
              Clear Filter
            </Button>
          </div>
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
          {filteredBusinesses.map((business) => {
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
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                  <div className="flex flex-col space-y-4">
                    {/* Business Name and Description */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {business.displayName || business.businessName}
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
                        {(business.adDesignData?.businessInfo?.phone || business.displayPhone || business.phone) && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <a
                              href={`tel:${
                                business.adDesignData?.businessInfo?.phone ||
                                business.displayPhone ||
                                business.phone ||
                                ""
                              }`}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              {formatPhoneNumber(
                                business.adDesignData?.businessInfo?.phone ||
                                  business.displayPhone ||
                                  business.phone ||
                                  "",
                              )}
                            </a>
                          </div>
                        )}

                        {/* Location */}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">
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
                          </span>
                        </div>

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
                          businessName={business.displayName || business.businessName}
                        />
                      </div>

                      {/* Right side - Action Buttons */}
                      <div className="flex flex-col gap-2 lg:items-end lg:w-24 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenReviews(business)}
                          className="text-sm min-w-[100px]"
                        >
                          Reviews
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleOpenProfile(business)}
                          className="text-sm min-w-[100px]"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>

                    {/* Subcategories/Specialties */}
                    {(business.subcategories && business.subcategories.length > 0) ||
                    (business.services && business.services.length > 0) ? (
                      <div className="w-full">
                        <div className="lg:w-64">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Specializes in:</h4>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full">
                          {/* Prioritize subcategories over services */}
                          {(business.subcategories && business.subcategories.length > 0
                            ? business.subcategories
                            : business.services || []
                          ).map((subcategory, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              {getSubcategoryString(subcategory)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
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
