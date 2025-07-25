"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Loader2 } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useToast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"
import { PhotoCarousel } from "@/components/photo-carousel"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Heart, HeartHandshake } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { StarRating } from "@/components/star-rating"
import { getBusinessRating } from "@/app/actions/review-actions"

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

// Enhanced Business interface with service area support
interface Business {
  id?: string
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
  description?: string
  adDesignData?: {
    businessInfo?: {
      phone?: string
      city?: string
      state?: string
    }
  }
  serviceArea?: string[]
  isNationwide?: boolean
  allSubcategories?: any[]
  photos?: string[]
  email?: string
}

export default function CareServicesPage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{ name: string; id: string } | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

  // User and favorites state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  const filterOptions = [
    { id: "homecare1", label: "Non-Medical Elder Care", value: "Non-Medical Elder Care" },
    { id: "homecare2", label: "Non-Medical Special Needs Adult Care", value: "Non-Medical Special Needs Adult Care" },
    { id: "childcare1", label: "Babysitting (18+ Sitters only)", value: "Babysitting (18+ Sitters only)" },
    { id: "homecare3", label: "Other Home Care", value: "Other Home Care" },
    { id: "childcare2", label: "Childcare Centers", value: "Childcare Centers" },
    { id: "homecare4", label: "Adult Day Services", value: "Adult Day Services" },
    { id: "homecare5", label: "Rehab/Nursing/Respite and Memory Care", value: "Rehab/Nursing/Respite and Memory Care" },
  ]

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

  // Helper function to check if business serves a zip code
  const businessServesZipCode = (business: Business, zipCode: string): boolean => {
    console.log(
      `[Care Services] Checking if business ${business.displayName || business.businessName} serves ${zipCode}:`,
      {
        isNationwide: business.isNationwide,
        serviceArea: business.serviceArea,
        primaryZip: business.zipCode,
      },
    )

    // Check if business serves nationwide
    if (business.isNationwide) {
      console.log(`[Care Services] Business serves nationwide`)
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
      console.log(`[Care Services] Service area check result: ${serves}`)
      if (serves) return true
    }

    // Fall back to primary zip code comparison
    const primaryMatch = business.zipCode === zipCode
    console.log(`[Care Services] Primary zip code match: ${primaryMatch}`)
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

  // Helper function for exact subcategory matching
  const hasExactSubcategoryMatch = (business: Business, filters: string[]): boolean => {
    if (filters.length === 0) return true

    console.log(
      `[Care Services] Checking if business ${business.displayName || business.businessName} matches filters:`,
      {
        filters,
        businessSubcategories: business.subcategories,
        businessAllSubcategories: business.allSubcategories,
        businessServices: business.services,
      },
    )

    // Get all subcategories as strings
    const allSubcategoryStrings: string[] = []

    // Check subcategories array
    if (business.subcategories && Array.isArray(business.subcategories)) {
      business.subcategories.forEach((sub) => {
        const subStr = getSubcategoryString(sub)
        if (subStr !== "Unknown Service") {
          allSubcategoryStrings.push(subStr)
        }
      })
    }

    // Check allSubcategories array
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      business.allSubcategories.forEach((sub) => {
        const subStr = getSubcategoryString(sub)
        if (subStr !== "Unknown Service") {
          allSubcategoryStrings.push(subStr)
        }
      })
    }

    // Check services array
    if (business.services && Array.isArray(business.services)) {
      business.services.forEach((service) => {
        const serviceStr = getSubcategoryString(service)
        if (serviceStr !== "Unknown Service") {
          allSubcategoryStrings.push(serviceStr)
        }
      })
    }

    console.log(
      `[Care Services] All subcategory strings for ${business.displayName || business.businessName}:`,
      allSubcategoryStrings,
    )

    // Check if any filter matches any subcategory string
    // Use case-insensitive comparison and check for partial matches
    for (const filter of filters) {
      const filterLower = filter.toLowerCase()
      for (const subStr of allSubcategoryStrings) {
        const subStrLower = subStr.toLowerCase()

        // Check for exact match or if subcategory contains filter or filter contains subcategory
        if (subStrLower === filterLower || subStrLower.includes(filterLower) || filterLower.includes(subStrLower)) {
          console.log(`[Care Services] Match found! Filter "${filter}" matches subcategory "${subStr}"`)
          return true
        }
      }
    }

    console.log(`[Care Services] No match found for business ${business.displayName || business.businessName}`)
    return false
  }

  // Filter handlers
  const handleFilterChange = (filterValue: string, checked: boolean) => {
    setSelectedFilters((prev) => (checked ? [...prev, filterValue] : prev.filter((f) => f !== filterValue)))
  }

  const applyFilters = () => {
    console.log("[Care Services] Applying filters:", selectedFilters)
    console.log("[Care Services] All businesses:", allBusinesses)

    if (selectedFilters.length === 0) {
      setFilteredBusinesses(allBusinesses)
      setAppliedFilters([])
    } else {
      const filtered = allBusinesses.filter((business) => hasExactSubcategoryMatch(business, selectedFilters))
      console.log("[Care Services] Filtered results:", filtered)
      setFilteredBusinesses(filtered)
      setAppliedFilters([...selectedFilters])
    }

    toast({
      title: "Filters Applied",
      description: `${selectedFilters.length === 0 ? "Showing all" : `Found ${filteredBusinesses.length}`} care service providers`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses(allBusinesses)
    toast({
      title: "Filters Cleared",
      description: "Showing all care service providers",
    })
  }

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[Care Services] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

      try {
        setLoading(true)
        setError(null)

        const result = await getBusinessesForCategoryPage("/care-services")
        console.log(`[Care Services] Raw businesses from API:`, result)

        // Load photos and ratings concurrently for each business
        const businessesWithPhotosAndReviews = await Promise.all(
          result.map(async (business: Business) => {
            try {
              console.log(
                `[Care Services] Processing business ${business.id}: ${business.displayName || business.businessName}`,
              )

              // Load photos and rating data concurrently
              const [photos, ratingData] = await Promise.all([
                loadBusinessPhotos(business.id || ""),
                getBusinessRating(business.id || "").catch((error) => {
                  console.error(`Failed to get rating for business ${business.id}:`, error)
                  return { rating: 0, reviewCount: 0 }
                }),
              ])

              console.log(`[Care Services] Rating data for business ${business.id}:`, ratingData)

              const enhancedBusiness = {
                ...business,
                photos,
                rating: ratingData.rating,
                reviewCount: ratingData.reviewCount,
              }

              console.log(`[Care Services] Enhanced business ${business.id}:`, {
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
          console.log(`[Care Services] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Care Services] Fetch ${currentFetchId} completed, got ${result.length} businesses`)
        console.log(
          `[Care Services] Businesses with ratings:`,
          businessesWithPhotosAndReviews.map((b) => ({
            name: b.displayName || b.businessName,
            rating: b.rating,
            reviewCount: b.reviewCount,
          })),
        )

        // Filter businesses by zip code if userZipCode is available
        if (userZipCode) {
          console.log(`[Care Services] Filtering by zip code: ${userZipCode}`)
          const filteredBusinessesByZip = businessesWithPhotosAndReviews.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Care Services] Business ${business.displayName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
            )
            return serves
          })
          console.log(`[Care Services] After filtering: ${filteredBusinessesByZip.length} businesses`)
          setBusinesses(filteredBusinessesByZip)
          setAllBusinesses(filteredBusinessesByZip)
          setFilteredBusinesses(filteredBusinessesByZip)
        } else {
          setBusinesses(businessesWithPhotosAndReviews)
          setAllBusinesses(businessesWithPhotosAndReviews)
          setFilteredBusinesses(businessesWithPhotosAndReviews)
        }
      } catch (error) {
        // Only update error state if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error("Error fetching businesses:", error)
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
        const favorites = new Set<string>()
        for (const business of allBusinesses) {
          if (business.id) {
            const isFavorite = await checkIfBusinessIsFavorite(business.id)
            if (isFavorite) {
              favorites.add(business.id)
            }
          }
        }
        setFavoriteBusinesses(favorites)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (allBusinesses.length > 0) {
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

  // Add a formatPhoneNumber function for better display
  const formatPhoneNumber = (phoneNumberString: string | null | undefined) => {
    if (!phoneNumberString) return "No phone provided"

    // Strip all non-numeric characters
    const cleaned = phoneNumberString.replace(/\D/g, "")

    // Check if it's a valid 10-digit US phone number
    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`
    }

    // Return the original if not a standard format
    return phoneNumberString
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
    console.log(
      `[Care Services] Getting subcategories for business ${business.displayName || business.businessName}:`,
      {
        subcategories: business.subcategories,
        allSubcategories: business.allSubcategories,
        services: business.services,
      },
    )

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
      `[Care Services] Final subcategories for ${business.displayName || business.businessName}:`,
      uniqueSubcategories,
    )

    return uniqueSubcategories.length > 0 ? uniqueSubcategories : ["Care Services"]
  }

  const handleViewReviews = (business: Business) => {
    console.log("Opening reviews for business:", business)
    setSelectedProvider({
      name: business.displayName || business.businessName,
      id: business.id || "",
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: Business) => {
    console.log("Opening profile for business:", business)
    setSelectedBusinessId(business.id || "")
    setSelectedBusinessName(business.displayName || business.businessName)
    setIsProfileDialogOpen(true)
  }

  const handleAddToFavorites = async (business: Business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (!business.id) {
      toast({
        title: "Error",
        description: "Unable to save business card - missing business ID",
        variant: "destructive",
      })
      return
    }

    // Check if already saved
    if (favoriteBusinesses.has(business.id)) {
      toast({
        title: "Already Saved",
        description: "This business card is already in your favorites",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [business.id!]: true }))

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
        setFavoriteBusinesses((prev) => new Set([...prev, business.id!]))
        toast({
          title: "Business Card Saved!",
          description: `${business.displayName || business.businessName} has been added to your favorites`,
        })
      } else {
        throw new Error(result.error || "Failed to save business card")
      }
    } catch (error) {
      console.error("Error adding favorite business:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [business.id!]: false }))
    }
  }

  return (
    <CategoryLayout title="Elder and Child Care Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/home%20health-zJyA419byhmD7tyJa0Ebmegg0XzFN3.png"
            alt="Elder and Child Care Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find compassionate and professional care services for elders and children in your area. Browse providers
            below or use filters to narrow your search.
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
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading care service providers...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : filteredBusinesses.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Care Service Providers ({filteredBusinesses.length})
            </h2>

            <div className="grid gap-6">
              {filteredBusinesses.map((business) => {
                const isFavorite = favoriteBusinesses.has(business.id || "")
                const isSaving = savingStates[business.id || ""]

                console.log(`[Care Services] Rendering business ${business.id}:`, {
                  name: business.displayName || business.businessName,
                  rating: business.rating,
                  reviewCount: business.reviewCount,
                })

                return (
                  <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      {/* Compact Business Info */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold">{business.displayName || business.businessName}</h3>

                        {/* Star Rating */}
                        <div className="flex items-center gap-2">
                          <StarRating rating={business.rating || 0} size="sm" />
                          <span className="text-sm text-gray-600">
                            {business.rating && business.rating > 0 ? business.rating.toFixed(1) : "0.0"}
                          </span>
                          {business.reviewCount && business.reviewCount > 0 && (
                            <span className="text-sm text-gray-500">
                              ({business.reviewCount} review{business.reviewCount !== 1 ? "s" : ""})
                            </span>
                          )}
                          {(!business.reviewCount || business.reviewCount === 0) && (
                            <span className="text-sm text-gray-500">(No reviews yet)</span>
                          )}
                        </div>

                        {/* Contact Info Row */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          {/* Location */}
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-primary" />
                            <span>{getLocation(business)}</span>
                          </div>

                          {/* Phone */}
                          {getPhoneNumber(business) && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1 text-primary" />
                              <a
                                href={`tel:${getPhoneNumber(business)}`}
                                className="hover:text-primary transition-colors"
                              >
                                {formatPhoneNumber(getPhoneNumber(business))}
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Services */}
                        {getSubcategories(business).length > 0 && (
                          <div>
                            <div className="flex flex-wrap gap-2">
                              {getSubcategories(business).map((subcategory, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                >
                                  {subcategory}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Service Area Indicator */}
                        {business.isNationwide ? (
                          <div className="text-xs text-green-600 font-medium">✓ Serves nationwide</div>
                        ) : userZipCode && business.serviceArea?.includes(userZipCode) ? (
                          <div className="text-xs text-green-600 font-medium">
                            ✓ Serves {userZipCode} and surrounding areas
                          </div>
                        ) : null}
                      </div>

                      {/* Photo Carousel and Buttons Row */}
                      <div className="mt-4 flex flex-col lg:flex-row gap-4">
                        {/* Photo Carousel */}
                        <div className="flex-1">
                          <PhotoCarousel
                            businessId={business.id || ""}
                            photos={business.photos || []}
                            onLoadPhotos={() => {}} // No-op since photos are already loaded
                            showMultiple={true}
                            photosPerView={5}
                            className="w-full"
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-row lg:flex-col gap-2 lg:w-40">
                          <Button
                            className="flex-1 lg:flex-none min-w-[120px]"
                            onClick={() => handleViewReviews(business)}
                          >
                            Ratings
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 lg:flex-none min-w-[120px] bg-transparent"
                            onClick={() => handleViewProfile(business)}
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
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-medium text-blue-800 mb-2">
                {userZipCode ? `No Care Service Providers in ${userZipCode}` : "No Care Service Providers Found"}
              </h3>
              <p className="text-blue-700 mb-4">
                {userZipCode
                  ? `We're building our network of care service providers in the ${userZipCode} area.`
                  : "Enter your zip code to find care providers in your area."}
              </p>
              <div className="bg-white rounded border border-blue-100 p-4">
                <p className="text-gray-700 font-medium">Are you a care service provider?</p>
                <p className="text-gray-600 mt-1">
                  Join Hausbaum to showcase your services and connect with families in your area.
                </p>
                <Button className="mt-3" asChild>
                  <a href="/business-register">Register Your Care Business</a>
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
        searchZipCode={userZipCode}
      />

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>You need to be logged in to save business cards to your favorites.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsLoginDialogOpen(false)}>
              Cancel
            </Button>
            <Button asChild>
              <a href="/user-login">Login</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </CategoryLayout>
  )
}
