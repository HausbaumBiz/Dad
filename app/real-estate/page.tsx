"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Phone, MapPin, ChevronLeft, ChevronRight } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"
import { PhotoCarousel } from "@/components/photo-carousel"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Heart, HeartHandshake } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { StarRating } from "@/components/star-rating"
import { getBusinessReviews } from "@/app/actions/review-actions"

// Enhanced Business interface
interface Business {
  id: string
  businessName?: string
  displayName?: string
  displayPhone?: string
  displayCity?: string
  displayState?: string
  city?: string
  state?: string
  phone?: string
  rating?: number
  reviewCount?: number
  reviews?: any[]
  description?: string
  subcategory?: string
  subcategories?: string[]
  allSubcategories?: string[]
  services?: string[]
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
  photos?: string[]
  adDesignData?: {
    businessInfo?: {
      businessName?: string
      phone?: string
      city?: string
      state?: string
    }
  }
  email?: string
}

// Desktop Photo Carousel Component - displays 5 photos in landscape format
interface DesktopPhotoCarouselProps {
  photos: string[]
  businessName: string
}

function DesktopPhotoCarousel({ photos, businessName }: DesktopPhotoCarouselProps) {
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
  console.log(`[Real Estate] Checking if business serves ${zipCode}:`, {
    businessName: business.displayName || business.businessName,
    isNationwide: business.isNationwide,
    serviceArea: business.serviceArea,
    primaryZip: business.zipCode,
  })

  // Check if business serves nationwide
  if (business.isNationwide) {
    console.log(`[Real Estate] Business serves nationwide`)
    return true
  }

  // Check if the zip code is in the business's service area
  if (business.serviceArea && Array.isArray(business.serviceArea) && business.serviceArea.length > 0) {
    const serves = business.serviceArea.includes(zipCode)
    console.log(`[Real Estate] Service area check: ${serves}`)
    return serves
  }

  // Fall back to primary zip code comparison
  const primaryMatch = business.zipCode === zipCode
  console.log(`[Real Estate] Primary zip code check: ${primaryMatch}`)
  return primaryMatch
}

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(phoneNumberString: string) {
  if (!phoneNumberString) return "No phone provided"

  // Strip all non-numeric characters
  const cleaned = phoneNumberString.replace(/\D/g, "")

  // Check if the number is valid
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }

  // If the format doesn't match, return the original
  return phoneNumberString
}

const fetchBusinesses = async (
  fetchIdRef: any,
  setIsLoading: any,
  setBusinesses: any,
  setAllBusinesses: any,
  toast: any,
  userZipCode: any,
) => {
  const currentFetchId = ++fetchIdRef.current

  try {
    setIsLoading(true)

    console.log(`[Real Estate] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

    const result = await getBusinessesForCategoryPage("/real-estate")

    // Load photos and reviews for each business concurrently
    const businessesWithData = await Promise.all(
      result.map(async (business: Business) => {
        try {
          // Load photos and reviews concurrently
          const [photos, reviews] = await Promise.all([
            loadBusinessPhotos(business.id),
            getBusinessReviews(business.id),
          ])

          // Calculate average rating from reviews
          let rating = 0
          let reviewCount = 0

          if (reviews && Array.isArray(reviews) && reviews.length > 0) {
            reviewCount = reviews.length
            const totalRating = reviews.reduce((sum, review) => {
              const reviewRating =
                typeof review.overallRating === "number"
                  ? review.overallRating
                  : typeof review.rating === "number"
                    ? review.rating
                    : 0
              return sum + reviewRating
            }, 0)
            rating = totalRating / reviewCount
          }

          return {
            ...business,
            photos,
            reviews,
            rating: Number(rating.toFixed(1)) || 0,
            reviewCount: Number(reviewCount) || 0,
          }
        } catch (error) {
          console.error(`Error loading data for business ${business.id}:`, error)
          // Return business with default values if loading fails
          return {
            ...business,
            photos: [],
            reviews: [],
            rating: 0,
            reviewCount: 0,
          }
        }
      }),
    )

    // Check if this is still the current request
    if (currentFetchId !== fetchIdRef.current) {
      console.log(`[Real Estate] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
      return
    }

    console.log(`[Real Estate] Fetch ${currentFetchId} completed, got ${result.length} businesses`)

    // Filter by zip code if available
    let filteredResult = businessesWithData
    if (userZipCode) {
      console.log(`[Real Estate] Filtering by zip code: ${userZipCode}`)
      filteredResult = businessesWithData.filter((business: Business) => {
        const serves = businessServesZipCode(business, userZipCode)
        console.log(
          `[Real Estate] Business ${business.displayName || business.adDesignData?.businessInfo?.businessName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
          {
            serviceArea: business.serviceArea,
            primaryZip: business.zipCode,
            isNationwide: business.isNationwide,
          },
        )
        return serves
      })
      console.log(`[Real Estate] After filtering: ${filteredResult.length} businesses`)
    }

    setBusinesses(filteredResult)
    setAllBusinesses(filteredResult)
  } catch (error) {
    // Only update error if this is still the current request
    if (currentFetchId === fetchIdRef.current) {
      console.error(`[Real Estate] Error in fetch ${currentFetchId}:`, error)
      toast({
        title: "Error loading businesses",
        description: "There was a problem loading businesses. Please try again later.",
        variant: "destructive",
      })
    }
  } finally {
    // Only update loading if this is still the current request
    if (currentFetchId === fetchIdRef.current) {
      setIsLoading(false)
    }
  }
}

const filterOptions = [
  { id: "1", value: "Real Estate Buying", label: "Real Estate Buying" },
  { id: "2", value: "Real Estate Selling", label: "Real Estate Selling" },
  { id: "3", value: "Property Management", label: "Property Management" },
  { id: "4", value: "Home Staging", label: "Home Staging" },
]

export default function RealEstatePage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<{ [key: string]: boolean }>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  // Check user session on component mount
  useEffect(() => {
    const checkUserSession = async () => {
      try {
        const user = await getUserSession()
        setCurrentUser(user)
      } catch (error) {
        console.error("Error checking user session:", error)
      }
    }
    checkUserSession()
  }, [])

  // Load user's favorite businesses when user is available
  useEffect(() => {
    const loadFavorites = async () => {
      if (!currentUser?.id) return

      try {
        const favoriteChecks = await Promise.all(
          businesses.map(async (business) => {
            const isFavorite = await checkIfBusinessIsFavorite(business.id)
            return { businessId: business.id, isFavorite }
          }),
        )

        const favoriteIds = new Set(favoriteChecks.filter((check) => check.isFavorite).map((check) => check.businessId))
        setFavoriteBusinesses(favoriteIds)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (businesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, businesses])

  useEffect(() => {
    fetchBusinesses(fetchIdRef, setIsLoading, setBusinesses, setAllBusinesses, toast, userZipCode)
  }, [userZipCode])

  // Helper function to check if a business has a specific subcategory
  const hasExactSubcategoryMatch = (business: Business, subcategory: string): boolean => {
    // Check in subcategories array
    if (business.subcategories && Array.isArray(business.subcategories)) {
      if (
        business.subcategories.some((sub) => typeof sub === "string" && sub.toLowerCase() === subcategory.toLowerCase())
      ) {
        return true
      }
    }

    // Check in allSubcategories array
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      if (
        business.allSubcategories.some(
          (sub) => typeof sub === "string" && sub.toLowerCase() === subcategory.toLowerCase(),
        )
      ) {
        return true
      }
    }

    // Check in subcategory field
    if (business.subcategory && business.subcategory.toLowerCase() === subcategory.toLowerCase()) {
      return true
    }

    return false
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      } else {
        return [...prev, value]
      }
    })
  }

  const applyFilters = () => {
    if (selectedFilters.length === 0) {
      return
    }

    console.log("Applying filters:", selectedFilters)

    const filtered = allBusinesses.filter((business) => {
      // If no filters are selected, show all businesses
      if (selectedFilters.length === 0) return true

      // Check if business matches any of the selected filters
      return selectedFilters.some((filter) => hasExactSubcategoryMatch(business, filter))
    })

    setAppliedFilters([...selectedFilters])
    setBusinesses(filtered)

    toast({
      title: `Filter applied`,
      description: `Showing ${filtered.length} real estate professionals matching your criteria.`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setBusinesses(allBusinesses)

    toast({
      title: "Filters cleared",
      description: "Showing all real estate professionals.",
    })
  }

  // The businesses state now holds the filtered businesses directly
  const filteredBusinesses = businesses

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
    // Helper function to extract string from subcategory object
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

    // First try to get from subcategories (which should contain the full category objects)
    if (business.subcategories && business.subcategories.length > 0) {
      return business.subcategories.map(getSubcategoryString).filter((s) => s !== "Unknown Service")
    }

    // Then try allSubcategories
    if (business.allSubcategories && business.allSubcategories.length > 0) {
      return business.allSubcategories.map(getSubcategoryString).filter((s) => s !== "Unknown Service")
    }

    // Fall back to services if available
    if (business.services && business.services.length > 0) {
      return business.services.map(getSubcategoryString).filter((s) => s !== "Unknown Service")
    }

    return ["Real Estate Professional"]
  }

  const handleReviewsClick = (provider: Business) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleProfileClick = (provider: Business) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  const clearZipCodeFilter = () => {
    localStorage.removeItem("savedZipCode")
    setUserZipCode(null)
  }

  const handleAddToFavorites = async (business: Business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(business.id)) {
      toast({
        title: "Already saved",
        description: "This business is already in your favorites.",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [business.id]: true }))

    try {
      const businessData = {
        id: business.id,
        businessName: business.businessName || "",
        displayName:
          business.displayName || business.adDesignData?.businessInfo?.businessName || business.businessName || "",
        phone: getPhoneNumber(business) || "",
        email: business.email || "",
        address: getLocation(business) || "",
        zipCode: business.zipCode || "",
      }

      const result = await addFavoriteBusiness(businessData)

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, business.id]))
        toast({
          title: "Business saved!",
          description: `${businessData.displayName} has been added to your favorites.`,
        })
      } else {
        throw new Error(result.error || "Failed to save business")
      }
    } catch (error) {
      console.error("Error adding favorite business:", error)
      toast({
        title: "Error saving business",
        description: "There was a problem saving this business. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [business.id]: false }))
    }
  }

  const handleLoadPhotos = () => {
    // No-op function since photos are already loaded in useEffect
  }

  return (
    <CategoryLayout title="Home Buying and Selling" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/realestate002-uC3LlRrHqFBnFoowNNyWGD4WLtnTXj.png"
            alt="Real Estate Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified real estate professionals to help with buying or selling your home. Browse services below or
            use filters to narrow your search.
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

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Filter by Service Type</h3>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filterOptions.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={option.id}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={selectedFilters.includes(option.value)}
                  onChange={() => handleFilterChange(option.value)}
                />
                <label htmlFor={option.id} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={applyFilters} disabled={selectedFilters.length === 0} className="text-sm">
              Apply Filters {selectedFilters.length > 0 && `(${selectedFilters.length})`}
            </Button>

            {appliedFilters.length > 0 && (
              <Button variant="outline" onClick={clearFilters} className="text-sm bg-transparent">
                Clear Filters
              </Button>
            )}

            {appliedFilters.length > 0 && (
              <span className="text-sm text-gray-500">
                Showing {filteredBusinesses.length} of {businesses.length} professionals
              </span>
            )}
          </div>

          {appliedFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {appliedFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {filter}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Showing professionals for zip code:</span> {userZipCode}
              <span className="text-xs block mt-1">(Includes businesses with {userZipCode} in their service area)</span>
            </p>
            <Button variant="outline" size="sm" onClick={clearZipCodeFilter} className="text-xs bg-transparent">
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Image src="/loader.svg" alt="Loading..." width={32} height={32} className="mr-2" />
          <p>Loading real estate professionals...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Real Estate Professionals ({filteredBusinesses.length})</h2>
          <div className="grid gap-6">
            {filteredBusinesses.map((business: Business) => (
              <div key={business.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex flex-col space-y-4">
                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-4">
                    {/* Business Name, Star Rating, and Description */}
                    <div className="relative">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {business.displayName ||
                          business.adDesignData?.businessInfo?.businessName ||
                          business.businessName}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <StarRating rating={business.rating || 0} size="sm" />
                        <span className="text-sm text-gray-600">({business.reviewCount || 0})</span>
                      </div>
                      {business.description && (
                        <p className="text-gray-600 text-sm leading-relaxed">{business.description}</p>
                      )}
                    </div>
                    {/* Contact info */}
                    <div className="space-y-2">
                      {getPhoneNumber(business) && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`tel:${getPhoneNumber(business)}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            {formatPhoneNumber(getPhoneNumber(business)!)}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{getLocation(business)}</span>
                      </div>
                    </div>

                    {/* Services */}
                    {getSubcategories(business).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                        <div className="flex flex-wrap gap-2">
                          {getSubcategories(business).map((subcategory: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {typeof subcategory === "string" ? subcategory : subcategory.name || "Unknown"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mobile Photo Carousel */}
                    <PhotoCarousel
                      businessId={business.id}
                      photos={business.photos || []}
                      onLoadPhotos={handleLoadPhotos}
                      showMultiple={true}
                      photosPerView={2}
                      size="small"
                    />

                    {/* Mobile Action Buttons */}
                    <Button
                      variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleAddToFavorites(business)}
                      disabled={savingStates[business.id]}
                      className={
                        favoriteBusinesses.has(business.id)
                          ? "text-sm min-w-[100px] bg-red-600 hover:bg-red-700 border-red-600"
                          : "text-sm min-w-[100px] border-red-600 text-red-600 hover:bg-red-50"
                      }
                    >
                      {savingStates[business.id] ? (
                        <>
                          <Image src="/loader.svg" alt="Saving..." width={16} height={16} className="mr-1" />
                          Saving...
                        </>
                      ) : favoriteBusinesses.has(business.id) ? (
                        <>
                          <HeartHandshake className="h-4 w-4 mr-1" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Heart className="h-4 w-4 mr-1" />
                          Save Card
                        </>
                      )}
                    </Button>
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewsClick(business)}
                        className="text-sm min-w-[100px]"
                      >
                        Ratings
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleProfileClick(business)}
                        className="text-sm min-w-[100px]"
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden lg:flex flex-col space-y-4">
                    {/* Business Name and Star Rating */}
                    <div className="relative">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {business.displayName ||
                          business.adDesignData?.businessInfo?.businessName ||
                          business.businessName}
                      </h3>
                      <div className="flex items-center gap-1 mb-2">
                        <StarRating rating={business.rating || 0} size="sm" />
                        <span className="text-sm text-gray-600">({business.reviewCount || 0})</span>
                      </div>
                      {business.description && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">{business.description}</p>
                      )}
                    </div>
                    {/* Contact info */}
                    <div className="space-y-2">
                      {/* Phone Number */}
                      {getPhoneNumber(business) && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`tel:${getPhoneNumber(business)}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            {formatPhoneNumber(getPhoneNumber(business)!)}
                          </a>
                        </div>
                      )}

                      {/* Location */}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{getLocation(business)}</span>
                      </div>
                    </div>

                    {/* Services */}
                    {getSubcategories(business).length > 0 && (
                      <div className="w-full">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                        <div className="flex flex-wrap gap-2 w-full">
                          {getSubcategories(business).map((subcategory: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {typeof subcategory === "string" ? subcategory : subcategory.name || "Unknown"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Photo Album and Action Buttons Layout */}
                    <div className="flex gap-6 items-start">
                      {/* Left side - Photo Album */}
                      <div className="flex-1">
                        <DesktopPhotoCarousel
                          photos={business.photos || []}
                          businessName={
                            business.displayName ||
                            business.adDesignData?.businessInfo?.businessName ||
                            business.businessName ||
                            "Real Estate Professional"
                          }
                        />
                      </div>

                      {/* Right side - Action Buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Button
                          variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAddToFavorites(business)}
                          disabled={savingStates[business.id]}
                          className={
                            favoriteBusinesses.has(business.id)
                              ? "text-sm min-w-[120px] bg-red-600 hover:bg-red-700 border-red-600"
                              : "text-sm min-w-[120px] border-red-600 text-red-600 hover:bg-red-50"
                          }
                        >
                          {savingStates[business.id] ? (
                            <>
                              <Image src="/loader.svg" alt="Saving..." width={16} height={16} className="mr-1" />
                              Saving...
                            </>
                          ) : favoriteBusinesses.has(business.id) ? (
                            <>
                              <HeartHandshake className="h-4 w-4 mr-1" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Heart className="h-4 w-4 mr-1" />
                              Save Card
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewsClick(business)}
                          className="text-sm min-w-[120px]"
                        >
                          Ratings
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleProfileClick(business)}
                          className="text-sm min-w-[120px]"
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-amber-800 mb-2">
              {userZipCode
                ? `No Real Estate Professionals Found in ${userZipCode} Area`
                : "No Real Estate Professionals Found"}
            </h3>
            <p className="text-amber-700 mb-4">
              {userZipCode
                ? `We're building our network of real estate professionals in the ${userZipCode} area.`
                : "We're building our network of real estate professionals in your area."}
            </p>
            <div className="bg-white rounded border border-amber-100 p-4">
              <p className="text-gray-700 font-medium">Are you a real estate professional?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to showcase your services and connect with clients in your area.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Business</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to save businesses to your favorites. Please log in to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsLoginDialogOpen(false)}>
              Cancel
            </Button>
            <Button asChild>
              <a href="/user-login">Login</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={
            selectedProvider.displayName ||
            selectedProvider.adDesignData?.businessInfo?.businessName ||
            selectedProvider.businessName
          }
          businessId={selectedProvider.id}
          reviews={selectedProvider.reviews || []}
        />
      )}

      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
          businessName={
            selectedProvider.displayName ||
            selectedProvider.adDesignData?.businessInfo?.businessName ||
            selectedProvider.businessName
          }
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
