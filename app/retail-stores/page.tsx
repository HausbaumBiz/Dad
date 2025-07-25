"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Phone } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Heart, HeartHandshake, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StarRating } from "@/components/star-rating"
import { getBusinessReviews } from "@/app/actions/review-actions"

// Enhanced Business interface with service area
interface Business {
  id: string
  displayName?: string
  businessName: string
  displayLocation?: string
  displayPhone?: string
  zipCode: string
  serviceArea?: string[] // Direct array of ZIP codes
  isNationwide?: boolean // Direct boolean property
  subcategories?: any[] // Changed from string[] to any[]
  allSubcategories?: any[] // Changed from string[] to any[]
  rating?: number
  reviewCount?: number
  reviewsData?: any[]
  subcategory?: string
}

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

export default function RetailStoresPage() {
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "retail1", label: "Supermarkets/Grocery Stores", value: "Supermarkets/Grocery Stores" },
    { id: "retail2", label: "Department Store", value: "Department Store" },
    { id: "retail3", label: "Convenience Store", value: "Convenience Store" },
    { id: "retail4", label: "Clothing Boutique", value: "Clothing Boutique" },
    { id: "retail5", label: "Discount Store", value: "Discount Store" },
    { id: "retail6", label: "Warehouse Store", value: "Warehouse Store" },
    { id: "retail7", label: "Electronics Store", value: "Electronics Store" },
    { id: "retail8", label: "Bookstore", value: "Bookstore" },
    { id: "retail9", label: "Jewelry Store", value: "Jewelry Store" },
    { id: "retail10", label: "Toy Store", value: "Toy Store" },
    { id: "retail11", label: "Sporting Goods Store", value: "Sporting Goods Store" },
    { id: "retail12", label: "Furniture Store", value: "Furniture Store" },
    { id: "retail13", label: "Pet Store", value: "Pet Store" },
    { id: "retail14", label: "Shoe Store", value: "Shoe Store" },
    { id: "retail15", label: "Hardware Store", value: "Hardware Store" },
    { id: "retail16", label: "Stationery Store", value: "Stationery Store" },
    { id: "retail17", label: "Auto Parts Store", value: "Auto Parts Store" },
    { id: "retail18", label: "Health Food Store", value: "Health Food Store" },
    { id: "retail19", label: "Wine Shop/Alcohol Sales", value: "Wine Shop/Alcohol Sales" },
    { id: "retail20", label: "Antique Shop", value: "Antique Shop" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    reviews: any[]
  } | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<{
    id: string
    name: string
  } | null>(null)

  // State for businesses
  const [providers, setProviders] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState<Business[]>([])

  // State for business photos
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  // User and favorites state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  // Add toast hook
  const { toast } = useToast()

  // Function to load photos for a specific business
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

  // Get user's zip code from localStorage
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
    console.log(`  - Checking service area for ${business.displayName || business.businessName}:`)
    console.log(`    - Primary ZIP: ${business.zipCode}`)
    console.log(`    - Nationwide: ${business.isNationwide}`)
    console.log(`    - Service Area: ${business.serviceArea ? JSON.stringify(business.serviceArea) : "none"}`)
    console.log(`    - Target ZIP: ${targetZipCode}`)

    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`    - Result: MATCH (nationwide)`)
      return true
    }

    // Check if zip code is in service area array
    if (business.serviceArea && Array.isArray(business.serviceArea) && business.serviceArea.length > 0) {
      const matches = business.serviceArea.includes(targetZipCode)
      console.log(`    - Result: ${matches ? "MATCH" : "NO MATCH"} (service area check)`)
      return matches
    }

    // Fall back to primary zip code
    const matches = business.zipCode === targetZipCode
    console.log(`    - Result: ${matches ? "MATCH" : "NO MATCH"} (primary ZIP fallback)`)
    return matches
  }

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[${new Date().toISOString()}] Fetching businesses for /retail-stores (request #${currentFetchId})`)

      try {
        setLoading(true)
        setError(null)

        const fetchedBusinesses = await getBusinessesForCategoryPage("/retail-stores")
        console.log(
          `[${new Date().toISOString()}] Retrieved ${fetchedBusinesses.length} total businesses (request #${currentFetchId})`,
        )

        // Check if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${currentFetchId}`)
          return
        }

        // Load reviews for each business and calculate ratings
        const businessesWithData = await Promise.all(
          fetchedBusinesses.map(async (business: Business) => {
            try {
              // Load reviews for this business
              const reviews = await getBusinessReviews(business.id)

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
                reviewsData: reviews,
                rating: Number(rating.toFixed(1)) || 0,
                reviewCount: Number(reviewCount) || 0,
              }
            } catch (error) {
              console.error(`Error loading reviews for business ${business.id}:`, error)
              // Return business with default values if loading fails
              return {
                ...business,
                reviewsData: [],
                rating: 0,
                reviewCount: 0,
              }
            }
          }),
        )

        // Check again if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${currentFetchId}`)
          return
        }

        fetchedBusinesses.forEach((business: Business) => {
          console.log(
            `  - ${business.id}: "${business.displayName || business.businessName}" (zipCode: ${business.zipCode})`,
          )
        })

        // Filter by zip code if available
        let filteredBusinesses = businessesWithData
        if (userZipCode) {
          console.log(
            `[${new Date().toISOString()}] Filtering by user zip code: ${userZipCode} (request #${currentFetchId})`,
          )
          filteredBusinesses = businessesWithData.filter((business: Business) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[${new Date().toISOString()}] After filtering: ${filteredBusinesses.length} businesses (request #${currentFetchId})`,
          )
        }

        setProviders(filteredBusinesses)
        setAllProviders(filteredBusinesses) // Store all providers
      } catch (err) {
        console.error("Error fetching businesses:", err)
        if (currentFetchId === fetchIdRef.current) {
          setError("Failed to load businesses")
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  // Check user session
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
          for (const provider of providers) {
            const isFavorite = await checkIfBusinessIsFavorite(provider.id)
            if (isFavorite) {
              favorites.add(provider.id)
            }
          }
          setFavoriteBusinesses(favorites)
        } catch (error) {
          console.error("Error loading favorites:", error)
        }
      }
    }
    loadFavorites()
  }, [currentUser, providers])

  const handleOpenReviews = (provider: Business) => {
    setSelectedProvider({
      id: Number.parseInt(provider.id),
      name: provider.displayName || provider.businessName || "Retail Store",
      reviews: provider.reviewsData || [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (provider: Business) => {
    setSelectedBusiness({
      id: provider.id,
      name: provider.displayName || provider.businessName || "Retail Store",
    })
    setIsProfileDialogOpen(true)
  }

  // Handle clearing zip code filter
  const handleClearZipCode = () => {
    localStorage.removeItem("savedZipCode")
    setUserZipCode(null)
  }

  // Function to check if business has exact subcategory match
  const hasExactSubcategoryMatch = (business: Business, filterValue: string): boolean => {
    const subcategories = business.subcategories || []
    const allSubcategories = business.allSubcategories || []

    return (
      subcategories.some((subcat) => getSubcategoryString(subcat) === filterValue) ||
      allSubcategories.some((subcat) => getSubcategoryString(subcat) === filterValue) ||
      (business as any).subcategory === filterValue
    )
  }

  // Handle filter selection
  const handleFilterChange = (filterId: string, filterValue: string, checked: boolean) => {
    if (checked) {
      setSelectedFilters((prev) => [...prev, filterValue])
    } else {
      setSelectedFilters((prev) => prev.filter((f) => f !== filterValue))
    }
  }

  // Apply filters
  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)

    if (selectedFilters.length === 0) {
      setProviders(allProviders)
      setAppliedFilters([])
      return
    }

    const filtered = allProviders.filter((business) => {
      return selectedFilters.some((filter) => hasExactSubcategoryMatch(business, filter))
    })

    console.log(`Filtered results: ${filtered.length} stores`)
    setProviders(filtered)
    setAppliedFilters([...selectedFilters])
    setSelectedFilters([])
  }

  // Clear filters
  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setProviders(allProviders)
  }

  // Handle adding business to favorites
  const handleAddToFavorites = async (provider: Business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(provider.id)) {
      toast({
        title: "Already saved",
        description: "This business is already in your favorites.",
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
        email: (provider as any).email,
        address: provider.displayLocation,
        zipCode: provider.zipCode,
      }

      const result = await addFavoriteBusiness(businessData)

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, provider.id]))
        toast({
          title: "Business saved!",
          description: "Added to your favorites successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save business.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding favorite business:", error)
      toast({
        title: "Error",
        description: "Failed to save business. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [provider.id]: false }))
    }
  }

  return (
    <CategoryLayout title="Retail Stores" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/retail-LMdA5FnQ5i2okSiyh63eZFduC47jXp.png"
            alt="Retail Stores"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find local retail stores and shops in your area. Browse options below or use filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read reviews from other customers</li>
              <li>View store videos and product showcases</li>
              <li>Access exclusive coupons and deals</li>
              <li>Discover job openings at local retailers</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-lg font-semibold">Filter by Store Type:</h4>
          <div className="flex gap-2">
            <Button onClick={applyFilters} disabled={selectedFilters.length === 0} size="sm" className="min-w-[100px]">
              Apply Filters {selectedFilters.length > 0 && `(${selectedFilters.length})`}
            </Button>
            {appliedFilters.length > 0 && (
              <Button onClick={clearFilters} variant="outline" size="sm" className="min-w-[100px] bg-transparent">
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
              <input
                type="checkbox"
                checked={selectedFilters.includes(option.value)}
                onChange={(e) => handleFilterChange(option.id, option.value, e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Zip Code Filter Status */}
      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Showing stores that serve zip code:</span> {userZipCode}
            <span className="text-xs block mt-1">Includes stores with {userZipCode} in their service area</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearZipCode}
            className="text-blue-700 border-blue-300 hover:bg-blue-100 bg-transparent"
          >
            Clear Filter
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading retail stores...</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="mt-8 p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Retail Stores Found</h3>
          <p className="text-gray-600">
            {userZipCode
              ? `No retail stores found that serve the ${userZipCode} area.`
              : "Enter your zip code to find retail stores in your area."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-900 leading-tight flex-1 pr-4">
                        {provider.displayName || provider.businessName}
                      </h3>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <StarRating rating={provider.rating || 0} size="sm" />
                          <span className="text-sm text-gray-600">({provider.reviewCount || 0})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {/* Location Display */}
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-1 text-primary"
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

                    {/* Subcategories */}
                    {(provider.subcategories || provider.allSubcategories) && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {(provider.subcategories || provider.allSubcategories || []).map(
                            (subcategory: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {getSubcategoryString(subcategory)}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo Carousel and Buttons Row - Updated for mobile centering */}
                  <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start">
                    {/* Photo Carousel - Centered on mobile */}
                    <div className="flex-1 flex justify-center lg:justify-start">
                      <div className="w-full max-w-md lg:max-w-none">
                        <PhotoCarousel
                          businessId={provider.id}
                          photos={businessPhotos[provider.id] || []}
                          onLoadPhotos={() => loadPhotosForBusiness(provider.id)}
                          showMultiple={true}
                          photosPerView={5}
                          size="medium"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Action Buttons - Centered on mobile */}
                    <div className="lg:w-32 flex flex-row lg:flex-col gap-2 lg:justify-start justify-center w-full lg:w-auto">
                      <Button className="flex-1 lg:flex-none lg:w-full" onClick={() => handleOpenReviews(provider)}>
                        Ratings
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 lg:flex-none lg:w-full bg-transparent"
                        onClick={() => handleViewProfile(provider)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant="outline"
                        className={`flex-1 lg:flex-none lg:w-full ${
                          favoriteBusinesses.has(provider.id)
                            ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                            : "border-red-500 text-red-500 hover:bg-red-50 bg-transparent"
                        }`}
                        onClick={() => handleAddToFavorites(provider)}
                        disabled={savingStates[provider.id]}
                      >
                        {savingStates[provider.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : favoriteBusinesses.has(provider.id) ? (
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reviews Dialog */}
      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          businessId={selectedProvider.id.toString()}
          reviews={selectedProvider.reviews}
        />
      )}

      {/* Business Profile Dialog */}
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
            <DialogDescription>
              You need to be logged in to save businesses to your favorites. Please log in to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsLoginDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsLoginDialogOpen(false)
                window.location.href = "/user-login"
              }}
            >
              Go to Login
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </CategoryLayout>
  )
}
