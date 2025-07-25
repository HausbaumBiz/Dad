"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { useState } from "react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useEffect } from "react"
import { MapPin, Phone, X, Heart, HeartHandshake, Loader2, LogIn } from "lucide-react"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useRef } from "react"
import { PhotoCarousel } from "@/components/photo-carousel"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getBusinessReviews } from "@/app/actions/review-actions"
import { StarRating } from "@/components/star-rating"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

// Enhanced Business interface with service area
interface Business {
  id: string
  displayName?: string
  businessName: string
  displayLocation?: string
  displayPhone?: string
  zipCode: string
  email?: string
  serviceArea?: string[] // Array of ZIP codes the business serves
  isNationwide?: boolean // Whether the business serves nationwide
  subcategories?: any[] // Changed from string[] to any[] to handle objects
  allSubcategories?: any[] // Changed from string[] to any[] to handle objects
  rating?: number
  reviewCount?: number
  subcategory?: string | any // Can be string or object
}

// Helper function to extract string value from subcategory object
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

export default function PersonalAssistantsPage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "assistants1", label: "Personal Drivers", value: "Personal Drivers" },
    { id: "assistants2", label: "Personal Assistants", value: "Personal Assistants" },
    { id: "assistants3", label: "Companions", value: "Companions" },
    { id: "assistants4", label: "Personal Secretaries", value: "Personal Secretaries" },
    { id: "assistants5", label: "Personal Shoppers", value: "Personal Shoppers" },
  ]

  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])

  // Photo state
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  // Function to load photos for a specific business
  const loadPhotosForBusiness = async (businessId: string) => {
    if (businessPhotos[businessId]) return // Already loaded

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

  // Check user session
  useEffect(() => {
    async function checkUserSession() {
      try {
        const session = await getUserSession()
        if (session?.user) {
          setCurrentUser(session.user)
        }
      } catch (error) {
        console.error("Error checking user session:", error)
      }
    }
    checkUserSession()
  }, [])

  // Load favorite businesses for current user
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser) return

      try {
        const favoriteIds = new Set<string>()
        for (const business of businesses) {
          const isFavorite = await checkIfBusinessIsFavorite(business.id)
          if (isFavorite) {
            favoriteIds.add(business.id)
          }
        }
        setFavoriteBusinesses(favoriteIds)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (businesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, businesses])

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
    console.log(`Checking service area for ${business.displayName || business.businessName}:`)
    console.log(`  - Primary ZIP: ${business.zipCode}`)
    console.log(`  - Service Area: [${business.serviceArea?.join(", ") || "none"}]`)
    console.log(`  - Nationwide: ${business.isNationwide || false}`)
    console.log(`  - Target ZIP: ${targetZipCode}`)

    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`  - ${business.displayName || business.businessName}: nationwide=true, matches=true`)
      return true
    }

    // Check if zip code is in service area
    if (business.serviceArea && Array.isArray(business.serviceArea) && business.serviceArea.length > 0) {
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

  // Fetch businesses in this category
  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(
        `[${new Date().toISOString()}] Fetching businesses for /personal-assistants (request #${currentFetchId})`,
      )

      try {
        setIsLoading(true)
        setError(null)

        const result = await getBusinessesForCategoryPage("/personal-assistants")
        console.log(
          `[${new Date().toISOString()}] Retrieved ${result.length} total businesses (request #${currentFetchId})`,
        )

        // Check if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${currentFetchId}`)
          return
        }

        result.forEach((business: Business) => {
          console.log(
            `  - ${business.id}: "${business.displayName || business.businessName}" (zipCode: ${business.zipCode})`,
          )
        })

        // Load photos and reviews concurrently for each business
        const businessesWithRatings = await Promise.all(
          result.map(async (business: Business) => {
            try {
              // Load photos and reviews concurrently
              const [photos, reviews] = await Promise.all([
                loadBusinessPhotos(business.id).catch((error) => {
                  console.error(`Failed to load photos for business ${business.id}:`, error)
                  return []
                }),
                getBusinessReviews(business.id).catch((error) => {
                  console.error(`Failed to load reviews for business ${business.id}:`, error)
                  return []
                }),
              ])

              // Store photos
              setBusinessPhotos((prev) => ({
                ...prev,
                [business.id]: photos,
              }))

              // Calculate rating and review count
              let rating = 0
              let reviewCount = 0

              if (Array.isArray(reviews) && reviews.length > 0) {
                const totalRating = reviews.reduce((sum: number, review: any) => {
                  const reviewRating = review.overallRating || review.rating || 0
                  return sum + (typeof reviewRating === "number" ? reviewRating : 0)
                }, 0)
                rating = totalRating / reviews.length
                reviewCount = reviews.length
              }

              // Ensure rating is a valid number between 0 and 5
              rating = Math.max(0, Math.min(5, isNaN(rating) ? 0 : rating))
              reviewCount = Math.max(0, isNaN(reviewCount) ? 0 : reviewCount)

              return {
                ...business,
                rating,
                reviewCount,
              }
            } catch (error) {
              console.error(`Error processing business ${business.id}:`, error)
              return {
                ...business,
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

        // Filter by zip code if available
        let filteredResult = businessesWithRatings
        if (userZipCode) {
          console.log(
            `[${new Date().toISOString()}] Filtering by user zip code: ${userZipCode} (request #${currentFetchId})`,
          )
          filteredResult = businessesWithRatings.filter((business: Business) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[${new Date().toISOString()}] After filtering: ${filteredResult.length} businesses (request #${currentFetchId})`,
          )
        }

        setBusinesses(filteredResult)
        setAllBusinesses(filteredResult) // Store all businesses
      } catch (error) {
        console.error("Error fetching businesses:", error)
        if (currentFetchId === fetchIdRef.current) {
          setError("Failed to load businesses")
          toast({
            title: "Error loading businesses",
            description: "There was a problem loading businesses. Please try again later.",
            variant: "destructive",
          })
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [toast, userZipCode])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setSelectedBusinessId(provider.id)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    console.log("Opening profile for business:", provider.id, provider.businessName)
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  // Handle adding business to favorites
  const handleAddToFavorites = async (business: Business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    // Set loading state
    setSavingStates((prev) => ({ ...prev, [business.id]: true }))

    try {
      const result = await addFavoriteBusiness({
        id: business.id,
        businessName: business.businessName,
        displayName: business.displayName,
        phone: business.displayPhone,
        email: business.email,
        address: business.displayLocation,
        zipCode: business.zipCode,
      })

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, business.id]))
        toast({
          title: "Business Card Saved!",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding to favorites:", error)
      toast({
        title: "Error",
        description: "Failed to save business card",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [business.id]: false }))
    }
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

    // Check subcategories array
    for (const subcategory of subcategories) {
      const subcategoryStr = getSubcategoryString(subcategory)
      if (subcategoryStr === filterValue) {
        return true
      }
    }

    // Check allSubcategories array
    for (const subcategory of allSubcategories) {
      const subcategoryStr = getSubcategoryString(subcategory)
      if (subcategoryStr === filterValue) {
        return true
      }
    }

    // Check business.subcategory field
    if (business.subcategory) {
      const subcategoryStr = getSubcategoryString(business.subcategory)
      if (subcategoryStr === filterValue) {
        return true
      }
    }

    return false
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
      setBusinesses(allBusinesses)
      setAppliedFilters([])
      return
    }

    const filtered = allBusinesses.filter((business) => {
      return selectedFilters.some((filter) => hasExactSubcategoryMatch(business, filter))
    })

    console.log(`Filtered results: ${filtered.length} businesses`)
    setBusinesses(filtered)
    setAppliedFilters([...selectedFilters])
    setSelectedFilters([])
  }

  // Clear filters
  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setBusinesses(allBusinesses)
  }

  return (
    <CategoryLayout title="Personal Assistants" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/assistant-YGJCy1KrgYFG9a6r1XgV5abefXkzCB.png"
            alt="Personal Assistants"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find reliable personal assistants and support professionals in your area. Browse services below or use
            filters to narrow your search.
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

      {/* Enhanced Filter Interface */}
      <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Filter by Service Type</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes(option.value)}
                onChange={(e) => handleFilterChange(option.id, option.value, e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={applyFilters}
              disabled={selectedFilters.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              Apply Filters ({selectedFilters.length})
            </Button>

            {appliedFilters.length > 0 && (
              <Button
                onClick={clearFilters}
                variant="outline"
                className="text-gray-600 hover:text-gray-800 bg-transparent"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {appliedFilters.length > 0 && (
            <div className="text-sm text-gray-600">
              Showing {businesses.length} of {allBusinesses.length} businesses
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {appliedFilters.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {appliedFilters.map((filter, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-sm font-medium text-blue-800">Showing businesses that service: {userZipCode}</p>
                <p className="text-sm text-blue-700">Including businesses with this ZIP code in their service area</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearZipCode}
              className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading businesses...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : businesses.length > 0 ? (
        <div className="space-y-6">
          {businesses.map((business) => {
            const isFavorite = favoriteBusinesses.has(business.id)
            const isSaving = savingStates[business.id]

            return (
              <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    {/* Business Name */}
                    <h3 className="text-xl font-semibold">{business.displayName || business.businessName}</h3>

                    {/* Star Rating below business name */}
                    <div className="flex items-center gap-2">
                      <StarRating rating={business.rating || 0} size="sm" />
                      <span className="text-sm text-gray-600">
                        {business.rating ? business.rating.toFixed(1) : "0.0"}
                      </span>
                      {business.reviewCount && business.reviewCount > 0 && (
                        <span className="text-sm text-gray-500">
                          ({business.reviewCount} review{business.reviewCount !== 1 ? "s" : ""})
                        </span>
                      )}
                    </div>

                    {/* Contact Info Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {/* Location */}
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-primary" />
                        <span>{business.displayLocation}</span>
                      </div>

                      {/* Phone */}
                      {business.displayPhone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-primary" />
                          <a href={`tel:${business.displayPhone}`} className="hover:text-primary transition-colors">
                            {business.displayPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Services */}
                    {business.subcategories && business.subcategories.length > 0 && (
                      <div>
                        <div className="flex flex-wrap gap-2">
                          {business.subcategories.map((service: any, idx: number) => (
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

                  {/* Photo Carousel and Buttons Row */}
                  <div className="mt-4 flex flex-col lg:flex-row gap-4">
                    {/* Photo Carousel */}
                    <div className="flex-1">
                      <PhotoCarousel
                        businessId={business.id}
                        photos={businessPhotos[business.id] || []}
                        onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                        showMultiple={true}
                        photosPerView={5}
                        className="w-full"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-40">
                      <Button className="flex-1 lg:flex-none min-w-[120px]" onClick={() => handleOpenReviews(business)}>
                        Ratings
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 lg:flex-none min-w-[120px] bg-transparent"
                        onClick={() => handleOpenProfile(business)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant={isFavorite ? "default" : "outline"}
                        className={`flex-1 lg:flex-none min-w-[120px] ${
                          isFavorite
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-transparent border-red-500 text-red-500 hover:bg-red-50"
                        }`}
                        onClick={() => handleAddToFavorites(business)}
                        disabled={isFavorite || isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Saving...
                          </>
                        ) : isFavorite ? (
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-blue-800 mb-2">
              {userZipCode ? `No Personal Assistants Found in ${userZipCode}` : "No Personal Assistants Found"}
            </h3>
            <p className="text-blue-700 mb-4">
              {userZipCode
                ? `No personal assistant services found serving ZIP code ${userZipCode}. Try clearing the filter to see all providers.`
                : "We're building our network of personal assistant services in your area."}
            </p>
            <div className="bg-white rounded border border-blue-100 p-4">
              <p className="text-gray-700 font-medium">Are you a personal assistant or support professional?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to showcase your services and connect with clients in your area.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Service</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Login Required
            </DialogTitle>
            <DialogDescription>You need to be logged in to save business cards to your favorites.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button asChild className="flex-1">
              <a href="/user-login">Login</a>
            </Button>
            <Button variant="outline" asChild className="flex-1 bg-transparent">
              <a href="/user-register">Sign Up</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reviews Dialog */}
      {selectedProvider && selectedBusinessId && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.displayName || selectedProvider.businessName || selectedProvider.name}
          businessId={selectedBusinessId}
          reviews={[]} // Reviews are now loaded in the main component
        />
      )}

      {/* Business Profile Dialog */}
      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
          businessName={selectedProvider.displayName || selectedProvider.businessName}
          searchZipCode={userZipCode}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
