"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone, MapPin } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { ReviewTroubleshooter } from "@/components/review-troubleshooter"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { Card, CardContent } from "@/components/ui/card"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Heart, HeartHandshake, Loader2, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { getBusinessReviews, preloadBusinessReviews, getBusinessRating } from "@/app/actions/review-actions"
import { StarRating } from "@/components/star-rating"
import { ReviewSystemError } from "@/lib/review-error-handler"

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
  email?: string
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

export default function PetCarePage() {
  // Add fetchIdRef for race condition prevention
  const fetchIdRef = useRef(0)

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [isTroubleshooterOpen, setIsTroubleshooterOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: string
    name: string
    rating: number
    reviews: number
  } | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [businessPhotos, setBusinessPhotos] = useState<{ [businessId: string]: string[] }>({})

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

  // User and favorites state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<{ [businessId: string]: boolean }>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const { toast } = useToast()

  // Enhanced review handling with troubleshooting
  const [cachedReviews, setCachedReviews] = useState<Record<string, any[]>>({})
  const [reviewLoadingStates, setReviewLoadingStates] = useState<Record<string, boolean>>({})
  const [reviewErrors, setReviewErrors] = useState<Record<string, any>>({})
  const [troubleshootingData, setTroubleshootingData] = useState<any>(null)

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

  // Generate session ID for troubleshooting
  useEffect(() => {
    if (typeof window !== "undefined" && !sessionStorage.getItem("sessionId")) {
      sessionStorage.setItem("sessionId", `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [])

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  // Check user session
  useEffect(() => {
    async function checkUserSession() {
      try {
        const session = await getUserSession()
        setCurrentUser(session?.user || null)
      } catch (error) {
        console.error("Error checking user session:", error)
      }
    }
    checkUserSession()
  }, [])

  // Load user's favorite businesses
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser?.id) return

      try {
        const favoriteChecks = await Promise.all(
          allBusinesses.map(async (business: Business) => {
            const isFavorite = await checkIfBusinessIsFavorite(business.id)
            return { businessId: business.id, isFavorite }
          }),
        )

        const favoriteSet = new Set<string>()
        favoriteChecks.forEach(({ businessId, isFavorite }) => {
          if (isFavorite) {
            favoriteSet.add(businessId)
          }
        })

        setFavoriteBusinesses(favoriteSet)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (allBusinesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, allBusinesses])

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

  const loadPhotosForBusiness = async (businessId: string) => {
    if (businessPhotos[businessId]) {
      return // Already loaded
    }

    try {
      const photos = await loadBusinessPhotos(businessId)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: photos,
      }))
    } catch (error) {
      console.error(`Error loading photos for business ${businessId}:`, error)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: [],
      }))
    }
  }

  const handleAddToFavorites = async (business: Business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    // Prevent duplicate saves
    if (favoriteBusinesses.has(business.id)) {
      toast({
        title: "Already Saved",
        description: "This business card is already in your favorites.",
        variant: "default",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [business.id]: true }))

    try {
      const result = await addFavoriteBusiness({
        id: business.id,
        businessName: business.businessName || "",
        displayName: business.displayName || business.businessName || "",
        phone: business.displayPhone || "",
        email: business.email || "",
        address: business.displayLocation || "",
        zipCode: business.zipCode || "",
      })

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, business.id]))
        toast({
          title: "Business Card Saved!",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save business card",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding to favorites:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [business.id]: false }))
    }
  }

  // Fetch businesses with race condition prevention and enhanced error handling - ENHANCED WITH RATINGS
  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[Pet Care] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

      try {
        setLoading(true)
        setError(null)
        const result = await getBusinessesForCategoryPage("/pet-care")
        console.log(`[Pet Care] Raw businesses from API:`, result)

        // Load photos and ratings concurrently for each business
        const businessesWithPhotosAndReviews = await Promise.all(
          result.map(async (business: Business) => {
            try {
              console.log(
                `[Pet Care] Processing business ${business.id}: ${business.displayName || business.businessName}`,
              )

              // Load photos and rating data concurrently
              const [photos, ratingData] = await Promise.all([
                loadBusinessPhotos(business.id || ""),
                getBusinessRating(business.id || "").catch((error) => {
                  console.error(`Failed to get rating for business ${business.id}:`, error)
                  return { rating: 0, reviewCount: 0 }
                }),
              ])

              console.log(`[Pet Care] Rating data for business ${business.id}:`, ratingData)

              const enhancedBusiness = {
                ...business,
                photos,
                rating: ratingData.rating,
                reviewCount: ratingData.reviewCount,
              }

              console.log(`[Pet Care] Enhanced business ${business.id}:`, {
                name: enhancedBusiness.displayName || enhancedBusiness.businessName,
                rating: enhancedBusiness.rating,
                reviewCount: enhancedBusiness.reviewCount,
                photos: enhancedBusiness.photos?.length || 0,
              })

              return enhancedBusiness
            } catch (error) {
              console.error(`Error loading data for business ${business.id}:`, error)
              // Return business with default values if individual business fails
              return {
                ...business,
                photos: [],
                rating: 0,
                reviewCount: 0,
              }
            }
          }),
        )

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Pet Care] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Pet Care] Fetch ${currentFetchId} completed, got ${result.length} businesses`)
        console.log(
          `[Pet Care] Businesses with ratings:`,
          businessesWithPhotosAndReviews.map((b) => ({
            name: b.displayName || b.businessName,
            rating: b.rating,
            reviewCount: b.reviewCount,
          })),
        )

        // Filter businesses by zip code if userZipCode is available
        let finalBusinesses = businessesWithPhotosAndReviews
        if (userZipCode) {
          const originalCount = businessesWithPhotosAndReviews.length
          const filteredBusinesses = businessesWithPhotosAndReviews.filter((business: Business) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[Pet Care] Filtered from ${originalCount} to ${filteredBusinesses.length} businesses for zip ${userZipCode}`,
          )
          finalBusinesses = filteredBusinesses
        }

        setBusinesses(finalBusinesses)
        setAllBusinesses(finalBusinesses)
        setFilteredBusinesses(finalBusinesses)

        // Preload reviews for visible businesses (first 10)
        const businessIds = finalBusinesses.slice(0, 10).map((b) => b.id)
        if (businessIds.length > 0) {
          console.log(`[Pet Care] Preloading reviews for ${businessIds.length} businesses`)
          // Don't await this - let it run in background
          preloadBusinessReviews(businessIds).catch((error) => {
            console.warn("[Pet Care] Review preloading failed:", error)
          })
        }
      } catch (error) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Pet Care] Fetch ${currentFetchId} error:`, error)
          setError(error instanceof Error ? error.message : "Failed to load businesses")
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

  // Enhanced review loading with comprehensive error handling
  const loadReviewsForBusiness = async (businessId: string) => {
    // Return cached reviews if available
    if (cachedReviews[businessId]) {
      return cachedReviews[businessId]
    }

    // Check if already loading
    if (reviewLoadingStates[businessId]) {
      return []
    }

    setReviewLoadingStates((prev) => ({ ...prev, [businessId]: true }))
    setReviewErrors((prev) => ({ ...prev, [businessId]: null }))

    try {
      console.log(`Loading reviews for business ${businessId}`)
      const reviews = await getBusinessReviews(businessId)

      // Cache the reviews (even if empty)
      setCachedReviews((prev) => ({
        ...prev,
        [businessId]: reviews,
      }))

      return reviews
    } catch (error) {
      console.error(`Error loading reviews for business ${businessId}:`, error)

      // Handle ReviewSystemError with troubleshooting data
      if (error instanceof ReviewSystemError) {
        setReviewErrors((prev) => ({
          ...prev,
          [businessId]: error.troubleshootingData,
        }))

        // Show specific error message based on error type
        let errorMessage = "Unable to load reviews at this time."
        if (error.troubleshootingData?.errorType === "RATE_LIMIT") {
          errorMessage = "Too many requests. Please wait a moment and try again."
        } else if (error.troubleshootingData?.errorType === "TIMEOUT") {
          errorMessage = "Request timed out. Please check your connection and try again."
        }

        toast({
          title: "Reviews Unavailable",
          description: errorMessage,
          variant: "default",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTroubleshootingData(error.troubleshootingData)
                setIsTroubleshooterOpen(true)
              }}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Troubleshoot
            </Button>
          ),
        })
      } else {
        // Handle other errors
        setReviewErrors((prev) => ({
          ...prev,
          [businessId]: {
            timestamp: new Date().toISOString(),
            businessId,
            errorType: "UNKNOWN_ERROR",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
            retryAttempts: 0,
            lastAttemptTime: new Date().toISOString(),
            redisStatus: "unknown",
            cacheHit: false,
            userAgent: navigator.userAgent,
            sessionId: sessionStorage.getItem("sessionId") || "unknown",
          },
        }))

        toast({
          title: "Reviews Unavailable",
          description: "Unable to load reviews at this time. Please try again later.",
          variant: "default",
        })
      }

      // Cache empty array to prevent repeated failed requests
      setCachedReviews((prev) => ({
        ...prev,
        [businessId]: [],
      }))

      return []
    } finally {
      setReviewLoadingStates((prev) => ({ ...prev, [businessId]: false }))
    }
  }

  const handleViewReviews = async (business: Business) => {
    // Show loading state immediately
    setSelectedProvider({
      id: business.id,
      name: business.displayName || business.businessName || "Pet Care Provider",
      rating: business.rating || 0,
      reviews: business.reviewCount || 0,
    })
    setSelectedBusinessId(business.id)
    setIsReviewsDialogOpen(true)

    // Load reviews in background
    const reviews = await loadReviewsForBusiness(business.id)

    // Calculate rating from reviews if not already available
    let rating = business.rating || 0
    if (reviews.length > 0 && !business.rating) {
      const totalRating = reviews.reduce((sum, review) => sum + (review.overallRating || review.rating || 0), 0)
      rating = totalRating / reviews.length
    }

    // Update provider data with loaded reviews
    setSelectedProvider({
      id: business.id,
      name: business.displayName || business.businessName || "Pet Care Provider",
      rating: rating,
      reviews: reviews.length,
    })
  }

  const handleViewProfile = (business: Business) => {
    console.log("Opening profile for business:", business.id, business.businessName)
    setSelectedBusinessId(business.id || "")
    setSelectedBusinessName(business.displayName || business.businessName || "Pet Care Provider")
    setIsProfileDialogOpen(true)
  }

  const handleRetryReviews = async () => {
    if (!selectedBusinessId) return

    // Clear cached data and error state
    setCachedReviews((prev) => {
      const newCache = { ...prev }
      delete newCache[selectedBusinessId]
      return newCache
    })
    setReviewErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[selectedBusinessId]
      return newErrors
    })

    // Retry loading reviews
    await loadReviewsForBusiness(selectedBusinessId)
  }

  if (error) {
    return (
      <CategoryLayout title="Pet Care Services" backLink="/" backText="Categories">
        <div className="mt-8 p-8 text-center">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p className="text-lg font-semibold">Error Loading Pet Care Services</p>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </CategoryLayout>
    )
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
      ) : (
        <div className="space-y-6">
          {filteredBusinesses.map((business: Business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {business.displayName || business.businessName || "Pet Care Provider"}
                    </h3>

                    {/* Enhanced Star Rating Display - Integrated from Redis */}
                    <div className="flex items-center gap-2">
                      <StarRating rating={business.rating || 0} size="md" />
                      <span className="text-sm text-gray-600 font-medium">
                        {business.rating ? business.rating.toFixed(1) : "0.0"}
                      </span>
                      {business.reviewCount && business.reviewCount > 0 ? (
                        <span className="text-sm text-gray-500">
                          ({business.reviewCount} {business.reviewCount === 1 ? "review" : "reviews"})
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">No reviews yet</span>
                      )}
                    </div>

                    {business.businessDescription && (
                      <p className="text-gray-600 text-sm leading-relaxed">{business.businessDescription}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {business.displayPhone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          <a href={`tel:${business.displayPhone}`} className="hover:text-primary">
                            {business.displayPhone}
                          </a>
                        </div>
                      )}
                      {business.displayLocation && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{business.displayLocation}</span>
                        </div>
                      )}
                    </div>

                    {/* Service Area Indicator */}
                    {userZipCode && (
                      <div className="text-xs text-green-600">
                        {business.isNationwide ? (
                          <span>✓ Serves nationwide</span>
                        ) : business.serviceArea?.includes(userZipCode) ? (
                          <span>✓ Serves {userZipCode} and surrounding areas</span>
                        ) : business.zipCode === userZipCode ? (
                          <span>✓ Located in {userZipCode}</span>
                        ) : null}
                      </div>
                    )}

                    {/* Services */}
                    {business.subcategories && business.subcategories.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {business.subcategories.map((subcategory: any, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(subcategory)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo Carousel and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start">
                    {/* Photo Carousel */}
                    <div className="flex-1 w-full flex justify-center lg:justify-start">
                      <div className="w-full max-w-md lg:max-w-none">
                        <PhotoCarousel
                          businessId={business.id}
                          photos={business.photos || []}
                          onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                          showMultiple={true}
                          photosPerView={5}
                          size="medium"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="lg:w-32 flex flex-row lg:flex-col gap-2 justify-center lg:justify-start w-full lg:w-auto">
                      {/* Save Card Button */}
                      <Button
                        variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                        className={
                          favoriteBusinesses.has(business.id)
                            ? "flex-1 lg:flex-none lg:w-full bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "flex-1 lg:flex-none lg:w-full bg-transparent border-red-600 text-red-600 hover:bg-red-50"
                        }
                        onClick={() => handleAddToFavorites(business)}
                        disabled={savingStates[business.id]}
                      >
                        {savingStates[business.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : favoriteBusinesses.has(business.id) ? (
                          <>
                            <HeartHandshake className="h-4 w-4 mr-2" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Heart className="h-4 w-4 mr-2" />
                            Save Card
                          </>
                        )}
                      </Button>

                      {/* Ratings Button with Error Indicator */}
                      <Button
                        className={`flex-1 lg:flex-none lg:w-full ${
                          reviewErrors[business.id] ? "border-yellow-500 text-yellow-700" : ""
                        }`}
                        onClick={() => handleViewReviews(business)}
                        disabled={reviewLoadingStates[business.id]}
                        variant={reviewErrors[business.id] ? "outline" : "default"}
                      >
                        {reviewLoadingStates[business.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : reviewErrors[business.id] ? (
                          <>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Ratings
                          </>
                        ) : (
                          "Ratings"
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        className="flex-1 lg:flex-none lg:w-full bg-transparent"
                        onClick={() => handleViewProfile(business)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name || ""}
        businessId={selectedProvider?.id || ""}
        reviews={cachedReviews[selectedBusinessId] || []} // Use cached reviews
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusinessId}
        businessName={selectedBusinessName}
      />

      {/* Review Troubleshooter Dialog */}
      <ReviewTroubleshooter
        isOpen={isTroubleshooterOpen}
        onClose={() => setIsTroubleshooterOpen(false)}
        businessId={selectedBusinessId}
        businessName={selectedBusinessName}
        errorData={troubleshootingData}
        onRetry={handleRetryReviews}
      />

      {/* Login Dialog */}
      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />

      <Toaster />
    </CategoryLayout>
  )
}
