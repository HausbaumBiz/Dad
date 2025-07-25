"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MapPin } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Heart, HeartHandshake, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { StarRating } from "@/components/star-rating"
import { getBusinessReviews } from "@/app/actions/review-actions"

// Helper function to safely extract string from subcategory data
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

export default function WeddingsEventsPage() {
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: string
    name: string
    rating: number
    reviews: number
  } | null>(null)

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<{
    id: string
    name: string
  } | null>(null)

  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Add filter state variables after existing state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [filteredProviders, setFilteredProviders] = useState([])

  // Add favorites functionality state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  // Add toast hook
  const { toast } = useToast()

  // Add fetchIdRef for race condition prevention
  const fetchIdRef = useRef(0)

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
        console.error(`Error loading photos for business ${businessId}:`, error)
        setBusinessPhotos((prev) => ({
          ...prev,
          [businessId]: [],
        }))
      }
    }
  }

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

  // Add exact subcategory matching function and filter handlers
  const exactSubcategoryMatch = (business: Business, filters: string[]): boolean => {
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

  const handleApplyFilters = () => {
    setAppliedFilters([...selectedFilters])
    toast({
      title: "Filters Applied",
      description: `Showing businesses with ${selectedFilters.length} selected service${selectedFilters.length !== 1 ? "s" : ""}`,
    })
  }

  const handleClearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    toast({
      title: "Filters Cleared",
      description: "Showing all wedding and event providers",
    })
  }

  const handleFilterChange = (filterValue: string) => {
    setSelectedFilters((prevFilters) =>
      prevFilters.includes(filterValue) ? prevFilters.filter((f) => f !== filterValue) : [...prevFilters, filterValue],
    )
  }

  const handleAddToFavorites = async (provider: any) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(provider.id)) {
      toast({
        title: "Already Saved",
        description: "This business is already in your favorites.",
        variant: "default",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [provider.id]: true }))

    try {
      const businessData = {
        id: provider.id,
        businessName: provider.businessName,
        displayName: provider.displayName,
        phone: provider.displayPhone,
        email: provider.email,
        address: provider.displayLocation,
        zipCode: provider.zipCode,
      }

      const result = await addFavoriteBusiness(businessData)

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, provider.id]))
        toast({
          title: "Business Saved!",
          description: "Business card has been added to your favorites.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save business card.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding favorite business:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [provider.id]: false }))
    }
  }

  // Replace the useEffect for fetching businesses with enhanced rating loading:
  useEffect(() => {
    const fetchProviders = async () => {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[Weddings] Starting fetch ${currentFetchId} for zip code:`, userZipCode)

      try {
        setLoading(true)
        let businesses = await getBusinessesForCategoryPage("/weddings-events")

        // Load photos and reviews for each business to get ratings immediately
        const businessesWithPhotosAndReviews = await Promise.all(
          businesses.map(async (business: Business) => {
            try {
              const photos = await loadBusinessPhotos(business.id)
              const reviews = await getBusinessReviews(business.id)

              let rating = 0
              let reviewCount = 0

              if (reviews && Array.isArray(reviews) && reviews.length > 0) {
                reviewCount = reviews.length
                rating = reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0) / reviews.length
              }

              return {
                ...business,
                photos,
                rating: Math.round(rating * 10) / 10, // Round to 1 decimal place
                reviewCount,
              }
            } catch (error) {
              console.error(`Error loading data for business ${business.id}:`, error)
              return {
                ...business,
                photos: [],
                rating: 0,
                reviewCount: 0,
              }
            }
          }),
        )

        // Only update if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Weddings] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Weddings] Fetch ${currentFetchId} got ${businesses.length} businesses`)

        // Filter by zip code if available
        if (userZipCode) {
          const originalCount = businessesWithPhotosAndReviews.length
          businesses = businessesWithPhotosAndReviews.filter((business: Business) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[Weddings] Filtered from ${originalCount} to ${businesses.length} businesses for zip ${userZipCode}`,
          )
        } else {
          businesses = businessesWithPhotosAndReviews
        }

        setProviders(businesses)
        // Add this line to store all providers for filtering
        if (currentFetchId === fetchIdRef.current) {
          setFilteredProviders(businesses)
        }
      } catch (error) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Weddings] Fetch ${currentFetchId} error:`, error)
          setProviders([])
        }
      } finally {
        // Only update loading if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchProviders()
  }, [userZipCode])

  useEffect(() => {
    // Apply filters whenever providers or appliedFilters change
    const applyFilters = () => {
      let filtered = providers
      if (appliedFilters.length > 0) {
        filtered = providers.filter((provider: Business) => exactSubcategoryMatch(provider, appliedFilters))
      }
      setFilteredProviders(filtered)
    }

    applyFilters()
  }, [providers, appliedFilters])

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  // Check user session
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

  // Load user's favorite businesses
  useEffect(() => {
    const loadFavorites = async () => {
      if (currentUser?.id && filteredProviders.length > 0) {
        try {
          const favoriteChecks = await Promise.all(
            filteredProviders.map(async (provider: any) => {
              const isFavorite = await checkIfBusinessIsFavorite(provider.id)
              return { id: provider.id, isFavorite }
            }),
          )

          const favoriteIds = new Set(favoriteChecks.filter((check) => check.isFavorite).map((check) => check.id))
          setFavoriteBusinesses(favoriteIds)
        } catch (error) {
          console.error("Error loading favorites:", error)
        }
      }
    }
    loadFavorites()
  }, [currentUser, filteredProviders])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider({
      id: provider.id,
      name: provider.displayName || provider.businessName || "Wedding Professional",
      rating: provider.rating || 0,
      reviews: provider.reviewCount || 0,
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (provider: any) => {
    setSelectedBusiness({
      id: provider.id,
      name: provider.displayName || provider.businessName || "Wedding Professional",
    })
    setIsProfileDialogOpen(true)
  }

  const filterOptions = [
    { id: "weddings1", label: "Event Halls", value: "Event Halls" },
    { id: "weddings2", label: "Tent and Chair Rentals", value: "Tent and Chair Rentals" },
    { id: "weddings3", label: "Wedding Planners", value: "Wedding Planners" },
    { id: "weddings4", label: "Food Caterers", value: "Food Caterers" },
    { id: "weddings5", label: "Bartenders", value: "Bartenders" },
    { id: "weddings6", label: "Live Music Entertainment", value: "Live Music Entertainment" },
    { id: "weddings7", label: "DJs", value: "DJs" },
    { id: "weddings8", label: "Performers", value: "Performers" },
    { id: "weddings9", label: "Tuxedo Rentals", value: "Tuxedo Rentals" },
    { id: "weddings10", label: "Limousine Services", value: "Limousine Services" },
    { id: "weddings11", label: "Tailors and Seamstresses", value: "Tailors and Seamstresses" },
    { id: "weddings12", label: "Wedding Dresses", value: "Wedding Dresses" },
    { id: "weddings13", label: "Wedding Photographers", value: "Wedding Photographers" },
    { id: "weddings14", label: "Florists", value: "Florists" },
    { id: "weddings15", label: "Wedding Cakes", value: "Wedding Cakes" },
    { id: "weddings16", label: "Marriage Officiants", value: "Marriage Officiants" },
    { id: "weddings17", label: "Other Weddings and Special Events", value: "Other Weddings and Special Events" },
  ]

  return (
    <CategoryLayout title="Weddings and Special Events" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/bride-70qH10P5dCi9LToSGdSHJrq7uHD40e.png"
            alt="Weddings and Events"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified wedding and event professionals in your area. Browse services below or use filters to narrow
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

      {/* Filter Section with Apply/Clear Buttons */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold">Filter by Service:</h4>
          <div className="flex gap-2">
            <Button
              onClick={handleApplyFilters}
              disabled={selectedFilters.length === 0}
              size="sm"
              className="min-w-[100px]"
            >
              Apply Filters {selectedFilters.length > 0 && `(${selectedFilters.length})`}
            </Button>
            {appliedFilters.length > 0 && (
              <Button onClick={handleClearFilters} variant="outline" size="sm" className="min-w-[100px] bg-transparent">
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {appliedFilters.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700 font-medium">Active Filters: {appliedFilters.join(", ")}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filterOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center space-x-2 bg-white rounded-md shadow-sm p-2 border border-gray-200 hover:border-primary-300 transition-colors cursor-pointer"
            >
              <Checkbox
                id={option.id}
                value={option.value}
                checked={selectedFilters.includes(option.value)}
                onCheckedChange={() => handleFilterChange(option.value)}
              />
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

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

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading wedding and event providers...</p>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="mt-8 p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Event Providers Found</h3>
          <p className="text-gray-600">
            {userZipCode
              ? `Enter your zip code to find wedding and event professionals that serve the ${userZipCode} area.`
              : "Enter your zip code to find wedding and event professionals in your area."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProviders.map((provider: any) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info - MODIFIED: Star rating moved below business name */}
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 leading-tight">
                        {provider.displayName || provider.businessName || "Wedding Professional"}
                      </h3>

                      {/* Star Rating Display - MOVED below business name */}
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={provider.rating || 0} size="sm" />
                        <span className="text-sm text-gray-600">
                          ({provider.reviewCount || 0} review{(provider.reviewCount || 0) !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>

                    {provider.businessDescription && (
                      <p className="text-gray-600 text-sm line-clamp-2">{provider.businessDescription}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {/* Location Display */}
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-primary" />
                        <span className="truncate">{provider.displayLocation || "Location not specified"}</span>
                      </div>

                      {/* Phone Display */}
                      {provider.displayPhone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-primary" />
                          <a href={`tel:${provider.displayPhone}`} className="hover:text-primary transition-colors">
                            {provider.displayPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {provider.subcategories && provider.subcategories.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {provider.subcategories.map((subcategory: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
                            >
                              {getSubcategoryString(subcategory)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photos and Buttons on same line - Updated for mobile centering */}
                  <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start">
                    {/* Photo Carousel - takes most of the width - Centered on mobile */}
                    <div className="flex-1 min-w-0 flex justify-center lg:justify-start">
                      <div className="w-full max-w-md lg:max-w-none">
                        <PhotoCarousel
                          businessId={provider.id}
                          photos={provider.photos || []}
                          onLoadPhotos={() => loadPhotosForBusiness(provider.id)}
                          showMultiple={true}
                          photosPerView={5}
                        />
                      </div>
                    </div>

                    {/* Action Buttons - fixed width on the right - Centered on mobile */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:w-32 flex-shrink-0 justify-center lg:justify-start w-full lg:w-auto">
                      <Button className="flex-1 lg:w-full" onClick={() => handleOpenReviews(provider)}>
                        Ratings
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 lg:w-full bg-transparent"
                        onClick={() => handleViewProfile(provider)}
                      >
                        View Profile
                      </Button>
                      <Button
                        onClick={() => handleAddToFavorites(provider)}
                        disabled={savingStates[provider.id]}
                        variant="outline"
                        className={
                          favoriteBusinesses.has(provider.id)
                            ? "flex-1 lg:w-full bg-red-500 text-white border-red-500 hover:bg-red-600"
                            : "flex-1 lg:w-full border-red-500 text-red-500 hover:bg-red-50 bg-transparent"
                        }
                      >
                        {savingStates[provider.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : favoriteBusinesses.has(provider.id) ? (
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          businessId={selectedProvider.id.toString()}
          reviews={[]}
        />
      )}

      {selectedBusiness && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedBusiness.id}
          businessName={selectedBusiness.name}
        />
      )}

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>You need to be logged in to save business cards to your favorites.</DialogDescription>
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
            <Button variant="outline" onClick={() => setIsLoginDialogOpen(false)} className="flex-1 bg-transparent">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </CategoryLayout>
  )
}
