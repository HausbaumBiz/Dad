"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { Phone, X, Tag } from "lucide-react"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useToast } from "@/components/ui/use-toast"
import { PhotoCarousel } from "@/components/photo-carousel"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Heart, HeartHandshake, Loader2 } from "lucide-react"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
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
  serviceArea?: string[] // Array of ZIP codes the business serves
  isNationwide?: boolean
  rating?: number
  reviews?: number
  businessDescription?: string
  adDesignData?: any
  phone?: string
  city?: string
  state?: string
  subcategories?: any[]
  allSubcategories?: any[]
  subcategory?: string
  email?: string
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

// Helper function to extract string value from subcategory object or string
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

export default function TravelVacationPage() {
  const fetchIdRef = useRef(0)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)
  const [providers, setProviders] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const { toast } = useToast()

  // Add state for profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<{ id: string; name: string }>({
    id: "",
    name: "",
  })

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState<Business[]>([])

  // Add photo state management
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  // Add state for favorites functionality
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  // Add rating state management
  const [businessRatings, setBusinessRatings] = useState<Record<string, number>>({})
  const [businessReviews, setBusinessReviews] = useState<Record<string, any[]>>({})

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
        const favoriteChecks = await Promise.all(
          providers.map(async (provider) => {
            const isFavorite = await checkIfBusinessIsFavorite(provider.id)
            return { id: provider.id, isFavorite }
          }),
        )

        const favoriteIds = favoriteChecks.filter((check) => check.isFavorite).map((check) => check.id)
        setFavoriteBusinesses(new Set(favoriteIds))
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (providers.length > 0) {
      loadFavorites()
    }
  }, [currentUser, providers])

  // Load reviews for all businesses when providers change
  useEffect(() => {
    if (providers.length > 0) {
      providers.forEach((provider) => {
        loadBusinessReviews(provider.id)
      })
    }
  }, [providers])

  // FIXED: Helper function to check if a business serves a specific zip code
  const businessServesZipCode = (business: Business, targetZipCode: string): boolean => {
    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`  - ${business.displayName || business.businessName}: nationwide=true, matches=true`)
      return true
    }

    // FIXED: Check if zip code is in service area (the main fix)
    if (business.serviceArea && business.serviceArea.length > 0) {
      const matches = business.serviceArea.includes(targetZipCode)
      console.log(
        `  - ${business.displayName || business.businessName}: serviceArea=[${business.serviceArea.join(", ")}], userZip="${targetZipCode}", matches=${matches}`,
      )
      return matches
    }

    // Fall back to primary zip code only if no service area is defined
    const matches = business.zipCode === targetZipCode
    console.log(
      `  - ${business.displayName || business.businessName}: primaryZip="${business.zipCode}", userZip="${targetZipCode}", matches=${matches} (fallback)`,
    )
    return matches
  }

  useEffect(() => {
    async function fetchProviders() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[${new Date().toISOString()}] Fetching businesses for /travel-vacation (request #${currentFetchId})`)

      try {
        setLoading(true)
        setError(null)

        // Use the centralized system
        const businesses = await getBusinessesForCategoryPage("/travel-vacation")
        console.log(
          `[${new Date().toISOString()}] Retrieved ${businesses.length} total businesses (request #${currentFetchId})`,
        )

        // Check if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${currentFetchId}`)
          return
        }

        businesses.forEach((business: Business) => {
          // FIXED: Log the service area information properly
          const serviceAreaZips = business.serviceArea || []
          const isNationwide = business.isNationwide || false
          console.log(
            `  - ${business.id}: "${business.displayName || business.businessName}" (zipCode: ${business.zipCode}, serviceArea: [${serviceAreaZips.join(", ")}], nationwide: ${isNationwide})`,
          )

          // Log subcategories for debugging
          const subcategories = business.subcategories || business.allSubcategories || []
          console.log(`  - Subcategories: [${subcategories.join(", ")}]`)
        })

        // Filter by zip code if available
        let filteredBusinesses = businesses
        if (userZipCode) {
          console.log(
            `[${new Date().toISOString()}] Filtering by user zip code: ${userZipCode} (request #${currentFetchId})`,
          )
          filteredBusinesses = businesses.filter((business: Business) => businessServesZipCode(business, userZipCode))
          console.log(
            `[${new Date().toISOString()}] After filtering: ${filteredBusinesses.length} businesses (request #${currentFetchId})`,
          )
        }

        setProviders(filteredBusinesses)
        setAllProviders(filteredBusinesses) // Store all providers
      } catch (err) {
        console.error("Error fetching providers:", err)
        if (currentFetchId === fetchIdRef.current) {
          setError("Failed to load providers")
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchProviders()
  }, [userZipCode])

  const filterOptions = [
    { id: "travel1", label: "Tour and Travel Guides", value: "Tour and Travel Guides" },
    { id: "travel2", label: "Travel Agents", value: "Travel Agents" },
    { id: "travel3", label: "Car Rental", value: "Car Rental" },
    { id: "travel4", label: "Boat Rental", value: "Boat Rental" },
    { id: "travel5", label: "RV Rental", value: "RV Rental" },
    { id: "travel6", label: "Airport Pick-up and Drop-off Services", value: "Airport Pick-up and Drop-off Services" },
    { id: "travel7", label: "Hotels, Motels, and Resorts", value: "Hotels, Motels, and Resorts" },
    { id: "travel8", label: "Bed and Breakfast", value: "Bed and Breakfast" },
    { id: "travel9", label: "Airbnb", value: "Airbnb" },
    { id: "travel10", label: "Camp Grounds and Cabins", value: "Camp Grounds and Cabins" },
  ]

  const handleOpenReviews = (provider: Business) => {
    setSelectedProvider(provider.displayName || provider.businessName || "Business")
    setSelectedBusinessId(provider.id)
    setIsReviewsOpen(true)
    // Ensure reviews are loaded
    if (!businessReviews[provider.id]) {
      loadBusinessReviews(provider.id)
    }
  }

  // Add handler for opening profile dialog
  const handleOpenProfile = (provider: Business) => {
    setSelectedBusinessProfile({
      id: provider.id,
      name: provider.displayName || provider.businessName || "Business",
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
      getSubcategoryString(business.subcategory) === filterValue
    )
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

    console.log(`Filtered results: ${filtered.length} providers`)
    setProviders(filtered)
    setAppliedFilters([...selectedFilters])

    toast({
      title: "Filters Applied",
      description: `Showing ${filtered.length} of ${allProviders.length} travel services`,
    })

    setSelectedFilters([])
  }

  // Clear filters
  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setProviders(allProviders)

    toast({
      title: "Filters Cleared",
      description: `Showing all ${allProviders.length} travel services`,
    })
  }

  // Handle adding business to favorites
  const handleAddToFavorites = async (provider: Business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(provider.id)) {
      toast({
        title: "Already Saved",
        description: "This business card is already in your favorites",
        variant: "default",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [provider.id]: true }))

    try {
      const result = await addFavoriteBusiness({
        id: provider.id,
        businessName: provider.businessName,
        displayName: provider.displayName,
        phone: provider.displayPhone,
        email: provider.email,
        address: provider.displayLocation,
        zipCode: provider.zipCode,
      })

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, provider.id]))
        toast({
          title: "Business Card Saved!",
          description: result.message,
          variant: "default",
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
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [provider.id]: false }))
    }
  }

  return (
    <CategoryLayout title="Travel & Vacation Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/travel%20agent-2swsPk7s1rFb3Cehv2GXYkYhwXFXwd.png"
            alt="Travel and Vacation"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified travel and vacation professionals in your area. Browse services below or use filters to
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
              Showing {providers.length} of {allProviders.length} providers
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
      ) : providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {appliedFilters.length > 0
                ? "No matching travel services found"
                : userZipCode
                  ? `No Travel Services Found in ${userZipCode}`
                  : "No Travel Services Found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {appliedFilters.length > 0
                ? "Try selecting different filters or clear filters to see all travel services."
                : userZipCode
                  ? `No travel services found serving ZIP code ${userZipCode}. Try clearing the filter to see all providers.`
                  : "We're currently building our network of travel and vacation service professionals in your area."}
            </p>
            {appliedFilters.length > 0 ? (
              <Button onClick={clearFilters} className="bg-blue-600 hover:bg-blue-700">
                Clear Filters
              </Button>
            ) : (
              <Button className="bg-blue-600 hover:bg-blue-700">Register Your Business</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {provider.displayName || provider.businessName || "Business Name"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>
                        {provider.displayLocation ||
                          `${provider.city || ""}, ${provider.state || ""}`.trim().replace(/^,|,$/, "") ||
                          "Location not specified"}
                      </span>

                      {(provider.adDesignData?.businessInfo?.phone || provider.phone) && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          <span>{formatPhoneNumber(provider.adDesignData?.businessInfo?.phone || provider.phone)}</span>
                        </div>
                      )}

                      {/* Rating Display */}
                      <div className="flex items-center gap-2">
                        <StarRating
                          rating={businessRatings[provider.id] || 0}
                          size="sm"
                          showNumber={true}
                          onLoadReviews={() => loadBusinessReviews(provider.id)}
                        />
                        {businessReviews[provider.id] && businessReviews[provider.id].length > 0 && (
                          <span className="text-sm text-gray-600">
                            ({businessReviews[provider.id].length} review
                            {businessReviews[provider.id].length !== 1 ? "s" : ""})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Display Business Subcategories - Limited to 4 */}
                    {getBusinessSubcategories(provider).length > 0 && (
                      <div>
                        <div className="flex items-center mb-1">
                          <Tag className="w-4 h-4 text-gray-500 mr-1" />
                          <span className="text-xs font-medium text-gray-600">Services Offered:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {getBusinessSubcategories(provider).map((subcategory, index) => (
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

                    {provider.businessDescription && (
                      <p className="text-sm text-gray-700 line-clamp-2">{provider.businessDescription}</p>
                    )}
                  </div>

                  {/* Photo Carousel and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start">
                    {/* Photo Carousel */}
                    <div className="flex-1 flex justify-center lg:justify-start">
                      <div className="w-full max-w-md lg:max-w-none">
                        <PhotoCarousel
                          businessId={provider.id}
                          photos={businessPhotos[provider.id] || []}
                          onLoadPhotos={() => loadPhotosForBusiness(provider.id)}
                          showMultiple={true}
                          photosPerView={5}
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-32 justify-center lg:justify-start w-full lg:w-auto">
                      {/* Save Card Button */}
                      <Button
                        variant={favoriteBusinesses.has(provider.id) ? "default" : "outline"}
                        className={`flex-1 lg:flex-none lg:w-full ${
                          favoriteBusinesses.has(provider.id)
                            ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                        }`}
                        onClick={() => handleAddToFavorites(provider)}
                        disabled={savingStates[provider.id]}
                      >
                        {savingStates[provider.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : favoriteBusinesses.has(provider.id) ? (
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

                      <Button className="flex-1 lg:flex-none lg:w-full" onClick={() => handleOpenReviews(provider)}>
                        Ratings
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 lg:flex-none lg:w-full bg-transparent"
                        onClick={() => handleOpenProfile(provider)}
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

      <ReviewsDialog
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        providerName={selectedProvider || ""}
        businessId={selectedBusinessId}
        reviews={selectedBusinessId ? businessReviews[selectedBusinessId] || [] : []}
      />

      {/* Add BusinessProfileDialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusinessProfile.id}
        businessName={selectedBusinessProfile.name}
      />

      {/* Login Dialog */}
      <ReviewLoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onSuccess={() => {
          setIsLoginDialogOpen(false)
          // Refresh user session after successful login
          getUserSession().then((session) => {
            setCurrentUser(session?.user || null)
          })
        }}
      />

      <Toaster />
    </CategoryLayout>
  )
}
