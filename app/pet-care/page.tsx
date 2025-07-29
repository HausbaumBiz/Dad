"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useToast } from "@/components/ui/use-toast"
import { Phone, MapPin } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { PhotoCarousel } from "@/components/photo-carousel"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Heart, HeartHandshake } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StarRating } from "@/components/star-rating"
import { getBusinessRating } from "@/app/actions/review-actions"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

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
  reviewCount?: number
  services?: any[]
  subcategories?: any[]
  allSubcategories?: any[]
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
  description?: string
  displayLocation?: string
  email?: string
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

// Helper function for exact subcategory matching
const hasExactSubcategoryMatch = (business: Business, filters: string[]): boolean => {
  if (filters.length === 0) return true

  console.log(`[Pet Care] Checking business ${business.displayName || business.businessName} subcategories:`, {
    subcategories: business.subcategories,
    allSubcategories: business.allSubcategories,
    services: business.services,
    filters,
  })

  // Collect all subcategory strings from all sources
  const allSubcategoryStrings: string[] = []

  // Check allSubcategories first (this seems to be the main field)
  if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
    business.allSubcategories.forEach((sub) => {
      const subStr = getSubcategoryString(sub)
      if (subStr !== "Unknown Service" && subStr.trim() !== "") {
        allSubcategoryStrings.push(subStr)
      }
    })
  }

  // Check subcategories as fallback
  if (business.subcategories && Array.isArray(business.subcategories)) {
    business.subcategories.forEach((sub) => {
      const subStr = getSubcategoryString(sub)
      if (subStr !== "Unknown Service" && subStr.trim() !== "") {
        allSubcategoryStrings.push(subStr)
      }
    })
  }

  // Check services as fallback
  if (business.services && Array.isArray(business.services)) {
    business.services.forEach((service) => {
      const serviceStr = getSubcategoryString(service)
      if (serviceStr !== "Unknown Service" && serviceStr.trim() !== "") {
        allSubcategoryStrings.push(serviceStr)
      }
    })
  }

  // Remove duplicates
  const uniqueSubcategories = [...new Set(allSubcategoryStrings)]

  console.log(
    `[Pet Care] Business ${business.displayName || business.businessName} subcategory strings:`,
    uniqueSubcategories,
  )

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
      console.log(
        `[Pet Care] ✅ Found match for filter "${filter}" in business ${business.displayName || business.businessName}`,
      )
    }

    return match
  })

  console.log(`[Pet Care] Business ${business.displayName || business.businessName} matches filters: ${hasMatch}`)
  return hasMatch
}

export default function PetCarePage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "pet1", label: "Veterinary Services", value: "Veterinary Services" },
    { id: "pet2", label: "Pet Grooming", value: "Pet Grooming" },
    { id: "pet3", label: "Pet Boarding", value: "Pet Boarding" },
    { id: "pet4", label: "Pet Training", value: "Pet Training" },
    { id: "pet5", label: "Pet Sitting", value: "Pet Sitting" },
    { id: "pet6", label: "Dog Walking", value: "Dog Walking" },
    { id: "pet7", label: "Pet Daycare", value: "Pet Daycare" },
    { id: "pet8", label: "Pet Photography", value: "Pet Photography" },
    { id: "pet9", label: "Pet Supplies", value: "Pet Supplies" },
    { id: "pet10", label: "Pet Food & Nutrition", value: "Pet Food & Nutrition" },
    { id: "pet11", label: "Pet Insurance", value: "Pet Insurance" },
    { id: "pet12", label: "Pet Transportation", value: "Pet Transportation" },
    { id: "pet13", label: "Pet Waste Removal", value: "Pet Waste Removal" },
    { id: "pet14", label: "Pet Behavioral Services", value: "Pet Behavioral Services" },
    { id: "pet15", label: "Emergency Pet Care", value: "Emergency Pet Care" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{ name: string; id: string } | null>(null)

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

  // Favorites functionality state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  // Filter handlers
  const handleFilterChange = (filterValue: string, checked: boolean) => {
    setSelectedFilters((prev) => (checked ? [...prev, filterValue] : prev.filter((f) => f !== filterValue)))
  }

  const applyFilters = () => {
    console.log("[Pet Care] Applying filters:", selectedFilters)
    console.log("[Pet Care] All businesses:", allBusinesses)

    if (selectedFilters.length === 0) {
      setFilteredBusinesses(allBusinesses)
      setAppliedFilters([])
    } else {
      const filtered = allBusinesses.filter((business) => hasExactSubcategoryMatch(business, selectedFilters))
      console.log("[Pet Care] Filtered results:", filtered)
      setFilteredBusinesses(filtered)
      setAppliedFilters([...selectedFilters])
    }

    toast({
      title: "Filters Applied",
      description: `${selectedFilters.length === 0 ? "Showing all" : `Found ${filteredBusinesses.length}`} pet care providers`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses(allBusinesses)
    toast({
      title: "Filters Cleared",
      description: "Showing all pet care providers",
    })
  }

  // Helper function to check if business serves a zip code
  const businessServesZipCode = (business: Business, zipCode: string): boolean => {
    console.log(`[Pet Care] Checking if business ${business.displayName || business.businessName} serves ${zipCode}:`, {
      isNationwide: business.isNationwide,
      serviceArea: business.serviceArea,
      primaryZip: business.zipCode,
    })

    // Check if business serves nationwide
    if (business.isNationwide) {
      console.log(`[Pet Care] Business serves nationwide`)
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
      console.log(`[Pet Care] Service area check result: ${serves}`)
      if (serves) return true
    }

    // Fall back to primary zip code comparison
    const primaryMatch = business.zipCode === zipCode
    console.log(`[Pet Care] Primary zip code match: ${primaryMatch}`)
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

              // Load photos and rating data concurrently using the existing actions
              const [photos, ratingData] = await Promise.all([
                loadBusinessPhotos(business.id || "").catch((error) => {
                  console.error(`[Pet Care] Failed to load photos for business ${business.id}:`, error)
                  return []
                }),
                getBusinessRating(business.id || "").catch((error) => {
                  console.error(`[Pet Care] Failed to get rating for business ${business.id}:`, error)
                  return { rating: 0, reviewCount: 0 }
                }),
              ])

              console.log(`[Pet Care] Rating data for business ${business.id}:`, ratingData)
              console.log(`[Pet Care] Photos loaded for business ${business.id}:`, photos.length)

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
              console.error(`[Pet Care] Error loading data for business ${business.id}:`, error)
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
        if (userZipCode) {
          console.log(`[Pet Care] Filtering by zip code: ${userZipCode}`)
          const filteredBusinesses = businessesWithPhotosAndReviews.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Pet Care] Business ${business.displayName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              business,
            )
            return serves
          })
          console.log(`[Pet Care] After filtering: ${filteredBusinesses.length} businesses`)
          setBusinesses(filteredBusinesses)
          setAllBusinesses(filteredBusinesses)
          setFilteredBusinesses(filteredBusinesses)
        } else {
          setBusinesses(businessesWithPhotosAndReviews)
          setAllBusinesses(businessesWithPhotosAndReviews)
          setFilteredBusinesses(businessesWithPhotosAndReviews)
        }
      } catch (error) {
        // Only update error state if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error("[Pet Care] Error fetching businesses:", error)
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

  // Check user session
  useEffect(() => {
    async function checkUserSession() {
      try {
        const user = await getUserSession()
        setCurrentUser(user)
      } catch (error) {
        console.error("[Pet Care] Error checking user session:", error)
      }
    }
    checkUserSession()
  }, [])

  // Load user's favorite businesses
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser?.id) return

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
        console.error("[Pet Care] Error loading favorites:", error)
      }
    }

    if (currentUser && allBusinesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, allBusinesses])

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
    console.log(`[Pet Care] Getting subcategories for business ${business.displayName || business.businessName}:`, {
      subcategories: business.subcategories,
      allSubcategories: business.allSubcategories,
      services: business.services,
    })

    // Collect all subcategories from different sources
    const allSubcategoryStrings: string[] = []

    // Check allSubcategories first (this seems to be the main field)
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      business.allSubcategories.forEach((sub) => {
        const subStr = getSubcategoryString(sub)
        if (subStr !== "Unknown Service" && subStr.trim() !== "") {
          allSubcategoryStrings.push(subStr)
        }
      })
    }

    // Check subcategories as fallback
    if (business.subcategories && Array.isArray(business.subcategories)) {
      business.subcategories.forEach((sub) => {
        const subStr = getSubcategoryString(sub)
        if (subStr !== "Unknown Service" && subStr.trim() !== "") {
          allSubcategoryStrings.push(subStr)
        }
      })
    }

    // Check services as fallback
    if (business.services && Array.isArray(business.services)) {
      business.services.forEach((service) => {
        const serviceStr = getSubcategoryString(service)
        if (serviceStr !== "Unknown Service" && serviceStr.trim() !== "") {
          allSubcategoryStrings.push(serviceStr)
        }
      })
    }

    // Remove duplicates
    const uniqueSubcategories = [...new Set(allSubcategoryStrings)]

    console.log(
      `[Pet Care] Final subcategories for ${business.displayName || business.businessName}:`,
      uniqueSubcategories,
    )

    return uniqueSubcategories.length > 0 ? uniqueSubcategories : ["Pet Care Services"]
  }

  // Handle adding business to favorites
  const handleAddToFavorites = async (business: Business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(business.id)) {
      toast({
        title: "Already Saved",
        description: "This business is already in your favorites.",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [business.id]: true }))

    try {
      const businessData = {
        id: business.id,
        businessName: business.businessName,
        displayName: business.displayName,
        phone: getPhoneNumber(business),
        email: business.email,
        address: getLocation(business),
        zipCode: business.zipCode || "",
      }

      const result = await addFavoriteBusiness(businessData)

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, business.id]))
        toast({
          title: "Business Saved!",
          description: `${business.displayName || business.businessName} has been added to your favorites.`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save business card.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Pet Care] Error adding favorite business:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [business.id]: false }))
    }
  }

  const handleViewReviews = (business: Business) => {
    console.log("[Pet Care] Opening reviews for business:", business)
    setSelectedProvider({
      name: business.displayName || business.businessName,
      id: business.id || "",
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: Business) => {
    console.log("[Pet Care] Opening profile for business:", business)
    setSelectedBusinessId(business.id || "")
    setSelectedBusinessName(business.displayName || business.businessName)
    setIsProfileDialogOpen(true)
  }

  // No-op function for photo loading since photos are already loaded
  const handleLoadPhotos = () => {
    // Photos are already loaded in the useEffect, so this is a no-op
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
            Find trusted pet care professionals in your area. From veterinary services to grooming and boarding, connect
            with qualified providers who care for your furry family members.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read reviews from other pet owners</li>
              <li>View business videos showcasing facilities and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you'd trust with your pets</li>
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

      {/* Business Listings */}
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-8 w-8 animate-spin text-primary"></div>
            <span className="ml-2">Loading pet care providers...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : filteredBusinesses.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">Pet Care Providers ({filteredBusinesses.length})</h2>

            <div className="grid gap-6">
              {filteredBusinesses.map((business) => (
                <Card key={business.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      {/* Business Name and Star Rating */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {business.displayName || business.businessName}
                          </h3>
                          {/* Star Rating directly below business name */}
                          <div className="flex items-center">
                            <StarRating rating={business.rating || 0} size="sm" className="mr-2" />
                            <span className="text-sm text-gray-600">
                              {business.rating ? business.rating.toFixed(1) : "0.0"}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                              ({business.reviewCount || 0} {business.reviewCount === 1 ? "review" : "reviews"})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info - Compact Layout */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2 text-sm text-gray-600 mb-3">
                        {getPhoneNumber(business) && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-primary" />
                            <a href={`tel:${getPhoneNumber(business)}`} className="text-blue-600 hover:underline">
                              {formatPhoneNumber(getPhoneNumber(business)!)}
                            </a>
                          </div>
                        )}

                        {getLocation(business) && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            <span>{getLocation(business)}</span>
                          </div>
                        )}
                      </div>

                      {/* Service Area Indicator */}
                      {business.isNationwide ? (
                        <div className="text-xs text-green-600 font-medium mb-3">✓ Serves nationwide</div>
                      ) : userZipCode && business.serviceArea?.includes(userZipCode) ? (
                        <div className="text-xs text-green-600 font-medium mb-3">
                          ✓ Serves {userZipCode} and surrounding areas
                        </div>
                      ) : null}

                      {/* Description */}
                      {(business.description || business.businessDescription) && (
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                          {business.description || business.businessDescription}
                        </p>
                      )}

                      {/* Subcategories/Specialties */}
                      {getSubcategories(business).length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Specializes in:</h4>
                          <div className="flex flex-wrap gap-2">
                            {getSubcategories(business).map((subcategory, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {subcategory}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Desktop: Original layout with photos on the right */}
                      <div className="hidden lg:flex lg:items-start gap-4">
                        {/* Photo Carousel - Desktop */}
                        <div className="flex-1 flex justify-center">
                          <PhotoCarousel
                            businessId={business.id}
                            photos={business.photos || []}
                            onLoadPhotos={handleLoadPhotos}
                            showMultiple={true}
                            photosPerView={5}
                            size="medium"
                          />
                        </div>

                        {/* Action Buttons - Desktop */}
                        <div className="flex flex-col items-end justify-start space-y-2 w-28 flex-shrink-0">
                          <Button
                            variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                            className={
                              favoriteBusinesses.has(business.id)
                                ? "w-full min-w-[110px] bg-red-600 hover:bg-red-700 text-white"
                                : "w-full min-w-[110px] bg-transparent border-red-600 text-red-600 hover:bg-red-50"
                            }
                            onClick={() => handleAddToFavorites(business)}
                            disabled={savingStates[business.id]}
                          >
                            {savingStates[business.id] ? (
                              <>
                                <div className="h-4 w-4 mr-2 animate-spin"></div>
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
                          <Button className="w-full min-w-[110px]" onClick={() => handleViewReviews(business)}>
                            Reviews
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full min-w-[110px] bg-transparent"
                            onClick={() => handleViewProfile(business)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>

                      {/* Mobile: Photos below services, buttons below photos */}
                      <div className="lg:hidden">
                        {/* Photo Carousel - Mobile */}
                        {business.photos && business.photos.length > 0 && (
                          <div className="mb-4">
                            <PhotoCarousel
                              businessId={business.id}
                              photos={business.photos}
                              onLoadPhotos={handleLoadPhotos}
                              showMultiple={true}
                              photosPerView={2}
                              size="small"
                            />
                          </div>
                        )}

                        {/* Action Buttons - Mobile */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                            className={
                              favoriteBusinesses.has(business.id)
                                ? "flex-1 bg-red-600 hover:bg-red-700 text-white"
                                : "flex-1 bg-transparent border-red-600 text-red-600 hover:bg-red-50"
                            }
                            onClick={() => handleAddToFavorites(business)}
                            disabled={savingStates[business.id]}
                          >
                            {savingStates[business.id] ? (
                              <>
                                <div className="h-4 w-4 mr-2 animate-spin"></div>
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
                          <Button className="flex-1" onClick={() => handleViewReviews(business)}>
                            Reviews
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
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
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-medium text-blue-800 mb-2">
                {userZipCode ? `No Pet Care Services in ${userZipCode}` : "No Pet Care Services Found"}
              </h3>
              <p className="text-blue-700 mb-4">
                {userZipCode
                  ? `We're building our network of pet care professionals in the ${userZipCode} area.`
                  : "Enter your zip code to find pet care services in your area."}
              </p>
              <div className="bg-white rounded border border-blue-100 p-4">
                <p className="text-gray-700 font-medium">Are you a pet care professional?</p>
                <p className="text-gray-600 mt-1">
                  Join Hausbaum to showcase your services and connect with pet owners in your area.
                </p>
                <Button className="mt-3" asChild>
                  <a href="/business-register">Register Your Pet Care Business</a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name || ""}
        businessId={selectedProvider?.id || ""}
        reviews={[]}
      />

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
              You need to be logged in to save business cards to your favorites. Please log in to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button asChild className="flex-1">
              <a href="/user-login">Login</a>
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent" asChild>
              <a href="/user-register">Sign Up</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </CategoryLayout>
  )
}
