"use client"

import { useState, useEffect, useRef } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { PhotoCarousel } from "@/components/photo-carousel"
import { Loader2, MapPin, Phone } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Heart, HeartHandshake, LogIn } from "lucide-react"
import { StarRating } from "@/components/star-rating"
import { getBusinessReviews } from "@/app/actions/review-actions"

interface Business {
  id: string
  displayName: string
  businessName: string
  displayLocation: string
  displayPhone: string
  allSubcategories?: any[] // Changed to any[] to handle both strings and objects
  subcategory?: string | { category: string; subcategory: string; fullPath: string }
  rating?: number
  reviews?: number
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
  subcategories?: any[] // Changed to any[] to handle both strings and objects
  email?: string
}

// Helper function to extract string value from subcategory (whether it's a string or object)
function getSubcategoryString(sub: any): string {
  if (typeof sub === "string") {
    return sub
  }
  if (sub && typeof sub === "object") {
    // If it's an object with subcategory property, use that
    if (sub.subcategory) {
      return sub.subcategory
    }
    // Otherwise try fullPath
    if (sub.fullPath) {
      return sub.fullPath
    }
  }
  // Fallback
  return "Financial Services"
}

export default function FinancialServicesPage() {
  const { toast } = useToast()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

  // Photo state
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  // Dialog state
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  const [businessRatings, setBusinessRatings] = useState<Record<string, number>>({})
  const [businessReviews, setBusinessReviews] = useState<Record<string, any[]>>({})

  const filterOptions = [
    { id: "financial1", label: "Accountants", value: "Accountants" },
    { id: "financial2", label: "Tax Preparers", value: "Tax Preparers" },
    { id: "financial3", label: "Bookkeepers", value: "Bookkeepers" },
    { id: "financial4", label: "Financial Advisors", value: "Financial Advisors" },
    { id: "financial5", label: "Insurance Agents", value: "Insurance Agents" },
    { id: "financial6", label: "Loan Officers", value: "Loan Officers" },
    { id: "financial7", label: "Investment Advisors", value: "Investment Advisors" },
    { id: "financial8", label: "Estate Planners", value: "Estate Planners" },
    { id: "financial9", label: "Credit Counselors", value: "Credit Counselors" },
    { id: "financial10", label: "Mortgage Brokers", value: "Mortgage Brokers" },
  ]

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

  // Helper function to check if a business serves a specific zip code
  const businessServesZipCode = (business: Business, targetZipCode: string): boolean => {
    console.log(`Checking if business serves ZIP ${targetZipCode}:`)
    console.log(`  Business: ${business.displayName || business.businessName}`)
    console.log(`  Primary ZIP: ${business.zipCode}`)
    console.log(`  Is Nationwide: ${business.isNationwide}`)
    console.log(`  Service Area: ${business.serviceArea ? JSON.stringify(business.serviceArea) : "none"}`)

    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`  - ${business.displayName || business.businessName}: nationwide=true, matches=true`)
      return true
    }

    // Check if zip code is in service area
    if (business.serviceArea && Array.isArray(business.serviceArea)) {
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

  // Function to load photos for a specific business
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

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(
        `[${new Date().toISOString()}] Fetching businesses for /financial-services (request #${currentFetchId})`,
      )

      try {
        setLoading(true)

        let result = await getBusinessesForCategoryPage("/financial-services")
        console.log(
          `[${new Date().toISOString()}] Retrieved ${result.length} total businesses (request #${currentFetchId})`,
        )

        // Check if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${currentFetchId}`)
          return
        }

        result.forEach((business) => {
          console.log(
            `  - ${business.id}: "${business.displayName || business.businessName}" (zipCode: ${business.zipCode})`,
          )
          if (business.serviceArea) {
            console.log(
              `    Service area: ${Array.isArray(business.serviceArea) ? business.serviceArea.join(", ") : "unknown format"}`,
            )
          }
        })

        if (userZipCode) {
          console.log(
            `[${new Date().toISOString()}] Filtering by user zip code: ${userZipCode} (request #${currentFetchId})`,
          )
          result = result.filter((business) => businessServesZipCode(business, userZipCode))
          console.log(
            `[${new Date().toISOString()}] After filtering: ${result.length} businesses (request #${currentFetchId})`,
          )
        }

        setBusinesses(result)
        setAllBusinesses(result)
        setFilteredBusinesses(result)
      } catch (err) {
        console.error("Error fetching financial services:", err)
        if (currentFetchId === fetchIdRef.current) {
          setError("Failed to load financial services")
          setBusinesses([])
          setAllBusinesses([])
          setFilteredBusinesses([])
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  // Add this useEffect after the existing useEffect that fetches businesses
  useEffect(() => {
    // Load reviews for all businesses when they are loaded
    if (filteredBusinesses.length > 0) {
      filteredBusinesses.forEach((business) => {
        if (!businessRatings[business.id] && businessRatings[business.id] !== 0) {
          loadBusinessReviews(business.id)
        }
      })
    }
  }, [filteredBusinesses, businessRatings])

  // Helper function to check if business has exact subcategory match
  const hasExactSubcategoryMatch = (business: Business, filterValue: string): boolean => {
    // Check allSubcategories array
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      return business.allSubcategories.some((sub) => {
        const subString = getSubcategoryString(sub)
        return subString === filterValue
      })
    }

    // Check subcategories array
    if (business.subcategories && Array.isArray(business.subcategories)) {
      return business.subcategories.some((sub) => getSubcategoryString(sub) === filterValue)
    }

    // Check single subcategory field
    if (business.subcategory) {
      const subString = getSubcategoryString(business.subcategory)
      return subString === filterValue
    }

    return false
  }

  // Filter functions
  const handleFilterChange = (value: string) => {
    setSelectedFilters((prev) => (prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]))
  }

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All businesses:", allBusinesses)

    if (selectedFilters.length === 0) {
      setFilteredBusinesses(allBusinesses)
      setAppliedFilters([])
      toast({
        title: "Filters cleared",
        description: `Showing all ${allBusinesses.length} financial services.`,
      })
      return
    }

    const filtered = allBusinesses.filter((business) => {
      const hasMatch = selectedFilters.some((filter) => hasExactSubcategoryMatch(business, filter))
      console.log(`Business ${business.displayName} services:`, business.allSubcategories)
      console.log(`Filter "${selectedFilters.join(", ")}" matches business: ${hasMatch}`)
      return hasMatch
    })

    console.log("Filtered results:", filtered)
    setFilteredBusinesses(filtered)
    setAppliedFilters([...selectedFilters])

    toast({
      title: "Filters applied",
      description: `Found ${filtered.length} financial services matching your criteria.`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses(allBusinesses)

    toast({
      title: "Filters cleared",
      description: `Showing all ${allBusinesses.length} financial services.`,
    })
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

  // Handle opening reviews dialog
  const handleOpenReviews = (business: Business) => {
    setSelectedBusiness(business)
    setSelectedBusinessId(business.id)
    setIsReviewsDialogOpen(true)
    // Load reviews if not already loaded
    if (!businessReviews[business.id]) {
      loadBusinessReviews(business.id)
    }
  }

  // Handle opening profile dialog
  const handleOpenProfile = (business: Business) => {
    setSelectedBusiness(business)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Financial Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/finance-h3AEqR70f57VvskV1kdWeEl9KNMZma.png"
            alt="Financial Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find trusted financial professionals in your area. Browse services below or use filters to narrow your
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

      {/* Enhanced Filter Controls */}
      <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filter by Service Type</h3>
          <span className="text-sm text-gray-500">{selectedFilters.length} selected</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes(option.value)}
                onChange={() => handleFilterChange(option.value)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={applyFilters}
            disabled={selectedFilters.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            Apply Filters ({selectedFilters.length})
          </Button>

          {appliedFilters.length > 0 && (
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {appliedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Active filters: {appliedFilters.join(", ")}</p>
              <p className="text-sm text-blue-700">
                Showing {filteredBusinesses.length} of {allBusinesses.length} financial services
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading financial services...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Financial Services Found</h3>
            <p className="text-gray-600 mb-4">
              Be the first financial professional to join our platform and connect with clients in your area.
            </p>
            <Button className="bg-green-600 hover:bg-green-700">Register Your Business</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{business.displayName}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {business.displayLocation && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{business.displayLocation}</span>
                        </div>
                      )}

                      {business.displayPhone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          <a href={`tel:${business.displayPhone}`} className="hover:text-primary">
                            {business.displayPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Rating Display */}
                    <div className="flex items-center gap-2">
                      <StarRating rating={businessRatings[business.id] || 0} size="sm" />
                      {businessReviews[business.id] && businessReviews[business.id].length > 0 && (
                        <span className="text-sm text-gray-600">
                          ({businessReviews[business.id].length} review
                          {businessReviews[business.id].length !== 1 ? "s" : ""})
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {business.allSubcategories && business.allSubcategories.length > 0 ? (
                          business.allSubcategories.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(service)}
                            </span>
                          ))
                        ) : business.subcategories && business.subcategories.length > 0 ? (
                          business.subcategories.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(service)}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {getSubcategoryString(business.subcategory) || "Financial Services"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Photo Carousel and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start">
                    {/* Photo Carousel */}
                    <div className="flex-1 flex justify-center lg:justify-start max-w-md lg:max-w-none">
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
                    <div className="lg:w-32 flex flex-row lg:flex-col gap-2 justify-center lg:justify-start w-full lg:w-auto">
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
                      <Button
                        variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                        className={`flex-1 lg:flex-none lg:w-full ${
                          favoriteBusinesses.has(business.id)
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-transparent border-red-500 text-red-500 hover:bg-red-50"
                        }`}
                        onClick={() => handleAddToFavorites(business)}
                        disabled={favoriteBusinesses.has(business.id) || savingStates[business.id]}
                      >
                        {savingStates[business.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
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
        onClose={() => {
          setIsReviewsDialogOpen(false)
          setSelectedBusinessId(null)
        }}
        providerName={selectedBusiness?.displayName}
        businessId={selectedBusinessId}
        reviews={selectedBusinessId ? businessReviews[selectedBusinessId] || [] : []}
      />

      {/* Business Profile Dialog */}
      {selectedBusiness && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedBusiness.id}
          businessName={selectedBusiness.displayName}
        />
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

      <Toaster />
    </CategoryLayout>
  )
}
