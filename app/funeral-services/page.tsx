"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone, Tag } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { Heart, HeartHandshake, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { getUserSession } from "@/app/actions/user-actions"
import { checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { addFavoriteBusiness } from "@/app/actions/favorite-actions"
import { getBusinessReviews } from "@/app/actions/review-actions"
import { StarRating } from "@/components/star-rating"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

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
  email?: string
  averageRating?: number
  reviewsCount?: number
}

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

// Helper function to get all subcategories for a business
const getBusinessSubcategories = (business: Business): string[] => {
  const subcategories = business.subcategories || []
  const allSubcategories = business.allSubcategories || []

  // Combine and deduplicate subcategories
  const allCategories = [...new Set([...subcategories, ...allSubcategories])]

  // Filter out empty strings and undefined values
  return allCategories.filter(Boolean).map(getSubcategoryString)
}

export default function FuneralServicesPage() {
  const fetchIdRef = useRef(0)
  const { toast } = useToast()

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
    id: string
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

  // User and favorites state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<{ [key: string]: boolean }>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [businessRatings, setBusinessRatings] = useState<{ [key: string]: { rating: number; count: number } }>({})
  const [loadingRatings, setLoadingRatings] = useState<{ [key: string]: boolean }>({})

  // Add photo state management
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  const loadPhotosForBusiness = async (businessId: string) => {
    if (!businessPhotos[businessId]) {
      try {
        const photos = await loadBusinessPhotos(businessId)
        setBusinessPhotos((prev) => ({
          ...prev,
          [businessId]: photos,
        }))
      } catch (error) {
        console.error(`Failed to load photos for business ${businessId}:`, error)
        setBusinessPhotos((prev) => ({
          ...prev,
          [businessId]: [],
        }))
      }
    }
  }

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  // Check user session on component mount
  useEffect(() => {
    async function checkUserSession() {
      try {
        const user = await getUserSession()
        setCurrentUser(user)
      } catch (error) {
        console.error("Error checking user session:", error)
      }
    }
    checkUserSession()
  }, [])

  // Load user's favorite businesses
  useEffect(() => {
    async function loadFavorites() {
      if (currentUser?.id) {
        try {
          const favorites = new Set<string>()
          for (const business of allBusinesses) {
            const isFavorite = await checkIfBusinessIsFavorite(business.id)
            if (isFavorite) {
              favorites.add(business.id)
            }
          }
          setFavoriteBusinesses(favorites)
        } catch (error) {
          console.error("Error loading favorites:", error)
        }
      }
    }

    if (allBusinesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, allBusinesses])

  // Load ratings for all businesses
  useEffect(() => {
    async function loadBusinessRatings() {
      const newRatings: { [key: string]: { rating: number; count: number } } = {}
      const newLoadingStates: { [key: string]: boolean } = {}

      for (const business of filteredBusinesses) {
        newLoadingStates[business.id] = true
      }

      setLoadingRatings(newLoadingStates)

      for (const business of filteredBusinesses) {
        try {
          const reviews = await getBusinessReviews(business.id)

          if (reviews && reviews.length > 0) {
            const totalRating = reviews.reduce((sum, review) => {
              // Use overallRating if available, otherwise use rating
              const reviewRating = review.overallRating || (review as any).rating || 0
              return sum + reviewRating
            }, 0)

            const averageRating = totalRating / reviews.length
            newRatings[business.id] = {
              rating: averageRating,
              count: reviews.length,
            }

            // Update the business object with the rating data
            business.averageRating = averageRating
            business.reviewsCount = reviews.length
          } else {
            newRatings[business.id] = { rating: 0, count: 0 }
            business.averageRating = 0
            business.reviewsCount = 0
          }
        } catch (error) {
          console.error(`Error loading ratings for business ${business.id}:`, error)
          newRatings[business.id] = { rating: 0, count: 0 }
        } finally {
          newLoadingStates[business.id] = false
        }
      }

      setBusinessRatings(newRatings)
      setLoadingRatings(newLoadingStates)
    }

    if (filteredBusinesses.length > 0) {
      loadBusinessRatings()
    }
  }, [filteredBusinesses])

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

  const handleAddToFavorites = async (business: Business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(business.id)) {
      toast({
        title: "Already saved",
        description: "This business is already in your favorites",
        variant: "default",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [business.id]: true }))

    try {
      const businessCard = {
        id: business.id,
        businessName: business.businessName,
        displayName: business.displayName,
        phone: business.displayPhone,
        email: business.email,
        address: business.displayLocation,
        zipCode: business.zipCode,
      }

      const result = await addFavoriteBusiness(businessCard)
      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, business.id]))
        toast({
          title: "Business saved!",
          description:
            result.message || `${business.displayName || business.businessName} has been added to your favorites`,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to save business to favorites",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding to favorites:", error)
      toast({
        title: "Error",
        description: "Failed to save business to favorites",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [business.id]: false }))
    }
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

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Funeral Services] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Funeral Services] Fetch ${currentFetchId} completed, got ${fetchedBusinesses.length} businesses`)

        // Filter by zip code if available
        let filteredBusinesses = fetchedBusinesses
        if (userZipCode) {
          console.log(`[Funeral Services] Filtering by zip code: ${userZipCode}`)
          filteredBusinesses = fetchedBusinesses.filter((business: Business) => {
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
      id: business.id,
      name: business.displayName || business.businessName || "Funeral Service Provider",
      rating: business.averageRating || business.rating || 0,
      reviews: business.reviewsCount || business.reviewCount || business.reviews || 0,
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
                <div className="space-y-3">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {business.displayName || business.businessName || "Funeral Service Provider"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>
                        {business.displayLocation ||
                          `${business.adDesignData?.businessInfo?.city || ""}, ${business.adDesignData?.businessInfo?.state || ""}`
                            .trim()
                            .replace(/^,|,$/, "") ||
                          "Location not specified"}
                      </span>

                      {(business.adDesignData?.businessInfo?.phone || business.displayPhone) && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          <span>
                            {formatPhoneNumber(business.adDesignData?.businessInfo?.phone || business.displayPhone)}
                          </span>
                        </div>
                      )}

                      {/* Rating Display */}
                      <div className="flex items-center gap-2">
                        {loadingRatings[business.id] ? (
                          <div className="flex items-center">
                            <div className="w-4 h-4 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                            <span className="text-sm text-gray-500">Loading ratings...</span>
                          </div>
                        ) : (
                          <>
                            <StarRating
                              rating={business.averageRating || business.rating || 0}
                              size="sm"
                              showNumber={true}
                              onLoadReviews={() => {}}
                            />
                            {businessRatings[business.id] && businessRatings[business.id].count > 0 && (
                              <span className="text-sm text-gray-600">
                                ({businessRatings[business.id].count} review
                                {businessRatings[business.id].count !== 1 ? "s" : ""})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Display Business Subcategories */}
                    {getBusinessSubcategories(business).length > 0 && (
                      <div>
                        <div className="flex items-center mb-1">
                          <Tag className="w-4 h-4 text-gray-500 mr-1" />
                          <span className="text-xs font-medium text-gray-600">Services Offered:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {getBusinessSubcategories(business).map((subcategory, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {subcategory}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {business.businessDescription && (
                      <p className="text-sm text-gray-700 line-clamp-2">{business.businessDescription}</p>
                    )}
                  </div>

                  {/* Photo Carousel and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start">
                    {/* Photo Carousel */}
                    <div className="flex-1 flex justify-center lg:justify-start">
                      <div className="w-full max-w-md lg:max-w-none">
                        <PhotoCarousel
                          businessId={business.id}
                          photos={businessPhotos[business.id] || []}
                          onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                          showMultiple={true}
                          photosPerView={5}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:w-32 justify-center lg:justify-start w-full lg:w-auto">
                      {/* Save Card Button */}
                      <Button
                        variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                        className={`flex-1 lg:flex-none lg:w-full ${
                          favoriteBusinesses.has(business.id)
                            ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                        }`}
                        onClick={() => handleAddToFavorites(business)}
                        disabled={savingStates[business.id]}
                      >
                        {savingStates[business.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : favoriteBusinesses.has(business.id) ? (
                          <>
                            <HeartHandshake className="w-4 h-4 mr-2" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Heart className="w-4 h-4 mr-2" />
                            Save Card
                          </>
                        )}
                      </Button>

                      <Button className="flex-1 lg:flex-none lg:w-full" onClick={() => handleOpenReviews(business)}>
                        Ratings
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Dialog */}
      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          businessId={selectedProvider.id}
        />
      )}

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusinessId}
        businessName={selectedBusinessName}
      />

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to save businesses to your favorites. Please log in to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-4">
            <Button
              onClick={() => {
                setIsLoginDialogOpen(false)
                window.location.href = "/user-login"
              }}
              className="flex-1"
            >
              Login
            </Button>
            <Button variant="outline" onClick={() => setIsLoginDialogOpen(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </CategoryLayout>
  )
}
