"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { MapPin, Phone, X } from "lucide-react"
import Link from "next/link"
import type { Business } from "@/lib/definitions"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Heart, HeartHandshake, Loader2 } from "lucide-react"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { StarRating } from "@/components/star-rating"
import { getBusinessReviews } from "@/app/actions/review-actions"

// Enhanced Business interface with service area
interface EnhancedBusiness extends Business {
  serviceArea?: string[] // Array of ZIP codes
  isNationwide?: boolean // Nationwide flag
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

export default function TailoringClothingPage() {
  const fetchIdRef = useRef(0)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<EnhancedBusiness | null>(null)
  const [businesses, setBusinesses] = useState<EnhancedBusiness[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<EnhancedBusiness[]>([])

  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  // User and favorites state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  const [businessRatings, setBusinessRatings] = useState<Record<string, number>>({})
  const [businessReviews, setBusinessReviews] = useState<Record<string, any[]>>({})

  const { toast } = useToast()

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

  // Function to load reviews and calculate rating for a specific business
  const loadBusinessReviews = async (businessId: string) => {
    if (businessRatings[businessId] !== undefined) {
      return // Already loaded
    }

    try {
      const reviews = await getBusinessReviews(businessId)
      setBusinessReviews((prev) => ({
        ...prev,
        [businessId]: reviews,
      }))

      // Calculate average rating
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0)
        const averageRating = totalRating / reviews.length
        setBusinessRatings((prev) => ({
          ...prev,
          [businessId]: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        }))
      } else {
        setBusinessRatings((prev) => ({
          ...prev,
          [businessId]: 0,
        }))
      }
    } catch (error) {
      console.error(`Error loading reviews for business ${businessId}:`, error)
      setBusinessRatings((prev) => ({
        ...prev,
        [businessId]: 0,
      }))
      setBusinessReviews((prev) => ({
        ...prev,
        [businessId]: [],
      }))
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

  // Check user session
  useEffect(() => {
    async function checkUserSession() {
      try {
        const session = await getUserSession()
        setCurrentUser(session?.user || null)
      } catch (error) {
        console.error("Error checking user session:", error)
        setCurrentUser(null)
      }
    }
    checkUserSession()
  }, [])

  // Load user's favorite businesses
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser?.id) {
        setFavoriteBusinesses(new Set())
        return
      }

      try {
        const favoriteChecks = await Promise.all(businesses.map((business) => checkIfBusinessIsFavorite(business.id)))

        const favoriteIds = new Set<string>()
        businesses.forEach((business, index) => {
          if (favoriteChecks[index]) {
            favoriteIds.add(business.id)
          }
        })

        setFavoriteBusinesses(favoriteIds)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (businesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, businesses])

  // Load reviews for all businesses when businesses change
  useEffect(() => {
    if (businesses.length > 0) {
      businesses.forEach((business) => {
        loadBusinessReviews(business.id)
      })
    }
  }, [businesses])

  // Helper function to check if a business serves a specific zip code
  const businessServesZipCode = (business: EnhancedBusiness, targetZipCode: string): boolean => {
    console.log(`Checking if business serves ZIP ${targetZipCode}:`)
    console.log(`  Business: ${business.displayName || business.businessName}`)
    console.log(`  Primary ZIP: ${business.zipCode}`)
    console.log(`  Service Area: ${business.serviceArea ? `[${business.serviceArea.join(", ")}]` : "none"}`)
    console.log(`  Nationwide: ${business.isNationwide}`)

    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`  - ${business.displayName || business.businessName}: nationwide=true, matches=true`)
      return true
    }

    // Check if zip code is in service area
    if (business.serviceArea && business.serviceArea.length > 0) {
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
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(
        `[${new Date().toISOString()}] Fetching businesses for /tailoring-clothing (request #${currentFetchId})`,
      )

      try {
        setLoading(true)
        setError(null)

        // Use the centralized system
        const fetchedBusinesses = await getBusinessesForCategoryPage("/tailoring-clothing")
        console.log(
          `[${new Date().toISOString()}] Retrieved ${fetchedBusinesses.length} total businesses (request #${currentFetchId})`,
        )

        // Check if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${currentFetchId}`)
          return
        }

        fetchedBusinesses.forEach((business: EnhancedBusiness) => {
          console.log(
            `  - ${business.id}: "${business.displayName || business.businessName}" (zipCode: ${business.zipCode})`,
          )
        })

        // Filter by zip code if available
        let filteredBusinesses = fetchedBusinesses
        if (userZipCode) {
          console.log(
            `[${new Date().toISOString()}] Filtering by user zip code: ${userZipCode} (request #${currentFetchId})`,
          )
          filteredBusinesses = fetchedBusinesses.filter((business: EnhancedBusiness) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[${new Date().toISOString()}] After filtering: ${filteredBusinesses.length} businesses (request #${currentFetchId})`,
          )
        }

        setBusinesses(filteredBusinesses)
        setAllBusinesses(filteredBusinesses) // Store all businesses
      } catch (err) {
        console.error("Error fetching tailoring businesses:", err)
        if (currentFetchId === fetchIdRef.current) {
          setError("Failed to load tailoring businesses")
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  const filterOptions = [
    {
      id: "tailors1",
      label: "Tailors, Dressmakers, and Custom Sewers",
      value: "Tailors, Dressmakers, and Custom Sewers",
    },
    { id: "tailors2", label: "Laundry and Dry-Cleaning", value: "Laundry and Dry-Cleaning" },
    { id: "tailors3", label: "Shoe and Leather Repair", value: "Shoe and Leather Repair" },
    { id: "tailors4", label: "Costume Makers", value: "Costume Makers" },
    { id: "tailors5", label: "Upholsterers", value: "Upholsterers" },
    {
      id: "tailors6",
      label: "Curtains, Drapes and Window Coverings Makers",
      value: "Curtains, Drapes and Window Coverings Makers",
    },
  ]

  const handleOpenReviews = (business: EnhancedBusiness) => {
    setSelectedProvider(business.displayName || business.businessName)
    setSelectedBusinessId(business.id)
    setIsReviewsOpen(true)
    // Load reviews if not already loaded
    if (!businessReviews[business.id]) {
      loadBusinessReviews(business.id)
    }
  }

  const handleOpenProfile = (business: EnhancedBusiness) => {
    setSelectedBusiness(business)
    setIsProfileOpen(true)
  }

  // Handle clearing zip code filter
  const handleClearZipCode = () => {
    localStorage.removeItem("savedZipCode")
    setUserZipCode(null)
  }

  const handleAddToFavorites = async (business: EnhancedBusiness) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(business.id)) {
      return // Already saved
    }

    setSavingStates((prev) => ({ ...prev, [business.id]: true }))

    try {
      const result = await addFavoriteBusiness({
        id: business.id,
        businessName: business.businessName,
        displayName: business.displayName || business.businessName,
        phone: business.displayPhone || business.phone || "",
        email: business.email || "",
        address: business.displayLocation || "",
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
      console.error("Error saving business card:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [business.id]: false }))
    }
  }

  // Function to check if business has exact subcategory match
  const hasExactSubcategoryMatch = (business: EnhancedBusiness, filterValue: string): boolean => {
    const subcategories = business.subcategories || []
    const allSubcategories = business.allSubcategories || []

    // Check subcategories array
    const subcategoryMatch = subcategories.some((subcategory: any) => {
      const subcategoryStr = getSubcategoryString(subcategory)
      return subcategoryStr === filterValue
    })

    // Check allSubcategories array
    const allSubcategoryMatch = allSubcategories.some((subcategory: any) => {
      const subcategoryStr = getSubcategoryString(subcategory)
      return subcategoryStr === filterValue
    })

    // Check direct subcategory property
    const directMatch = getSubcategoryString((business as any).subcategory) === filterValue

    return subcategoryMatch || allSubcategoryMatch || directMatch
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
    <CategoryLayout title="Tailoring & Clothing Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/tailor-SEwFHHQBnpiw9uz98ctBDGSaj1STGZ.png"
            alt="Tailoring and Clothing"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find skilled tailors and clothing service professionals in your area. Browse options below or use filters to
            narrow your search.
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

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {userZipCode ? `No Tailoring Services Found in ${userZipCode}` : "No Tailoring Services Found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `No tailoring services found serving ZIP code ${userZipCode}. Try clearing the filter to see all providers.`
                : "We're currently building our network of tailoring and clothing service professionals in your area."}
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">Register Your Business</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {businesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{business.displayName || business.businessName}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <p>{business.displayLocation || `Zip: ${business.zipCode}`}</p>
                      </div>

                      {(business.displayPhone || business.phone) && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          <Link
                            href={`tel:${(business.displayPhone || business.phone)?.replace(/\D/g, "")}`}
                            className="hover:text-primary"
                          >
                            {business.displayPhone || business.phone}
                          </Link>
                        </div>
                      )}

                      {/* Rating Display */}
                      <div className="flex items-center gap-2">
                        <StarRating
                          rating={businessRatings[business.id] || 0}
                          size="sm"
                          showNumber={true}
                          onLoadReviews={() => loadBusinessReviews(business.id)}
                        />
                        {businessReviews[business.id] && businessReviews[business.id].length > 0 && (
                          <span className="text-sm text-gray-600">
                            ({businessReviews[business.id].length} review
                            {businessReviews[business.id].length !== 1 ? "s" : ""})
                          </span>
                        )}
                      </div>

                      {business.subcategories && business.subcategories.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Services:</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {business.subcategories.map((service, idx) => (
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
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-32 w-full justify-center lg:justify-start lg:w-auto">
                      {/* Save Card Button */}
                      <Button
                        variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                        className={
                          favoriteBusinesses.has(business.id)
                            ? "flex-1 lg:flex-none lg:w-full bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "flex-1 lg:flex-none lg:w-full text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
                        }
                        onClick={() => handleAddToFavorites(business)}
                        disabled={savingStates[business.id] || favoriteBusinesses.has(business.id)}
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
                      <Button className="flex-1 lg:flex-none lg:w-full" onClick={() => handleOpenReviews(business)}>
                        Ratings
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 lg:flex-none lg:w-full bg-transparent"
                        onClick={() => handleOpenProfile(business)}
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
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        providerName={selectedProvider || ""}
        businessId={selectedBusinessId}
        reviews={selectedBusinessId ? businessReviews[selectedBusinessId] || [] : []}
      />

      {/* Business Profile Dialog */}
      {selectedBusiness && (
        <BusinessProfileDialog
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          businessId={selectedBusiness.id}
          businessName={selectedBusiness.displayName || selectedBusiness.businessName}
        />
      )}

      {/* Login Dialog */}
      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />

      <Toaster />
    </CategoryLayout>
  )
}
