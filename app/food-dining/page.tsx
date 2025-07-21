"use client"

import { useState, useEffect, useRef } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { PhotoCarousel } from "@/components/photo-carousel"
import { Loader2, Phone, MapPin, ChevronLeft, ChevronRight, Heart, HeartHandshake } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { ReviewLoginDialog } from "@/components/review-login-dialog"

// Enhanced Business interface
interface Business {
  id: string
  businessName?: string
  displayName?: string
  displayPhone?: string
  displayCity?: string
  displayState?: string
  city?: string
  state?: string
  phone?: string
  rating?: number
  reviews?: any[]
  description?: string
  subcategory?: string
  subcategories?: string[]
  allSubcategories?: string[]
  services?: string[]
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
  photos?: string[]
  adDesignData?: {
    businessInfo?: {
      businessName?: string
      phone?: string
      city?: string
      state?: string
    }
  }
  email?: string
}

// Desktop Photo Carousel Component - displays 5 photos in square format
interface DesktopPhotoCarouselProps {
  photos: string[]
  businessName: string
}

function DesktopPhotoCarousel({ photos, businessName }: DesktopPhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!photos || photos.length === 0) {
    return null // Don't show anything if no photos
  }

  const photosPerView = 5
  const maxIndex = Math.max(0, photos.length - photosPerView)

  const nextPhotos = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const prevPhotos = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const visiblePhotos = photos.slice(currentIndex, currentIndex + photosPerView)

  return (
    <div className="hidden lg:block w-full">
      <div className="relative group w-full">
        <div className="flex gap-2 justify-center w-full">
          {visiblePhotos.map((photo, index) => (
            <div
              key={currentIndex + index}
              className="w-[220px] h-[220px] bg-gray-100 rounded-lg overflow-hidden flex-shrink-0"
            >
              <Image
                src={photo || "/placeholder.svg"}
                alt={`${businessName} photo ${currentIndex + index + 1}`}
                width={220}
                height={220}
                className="w-full h-full object-cover"
                sizes="220px"
              />
            </div>
          ))}

          {/* Fill empty slots if less than 5 photos visible */}
          {visiblePhotos.length < photosPerView && (
            <>
              {Array.from({ length: photosPerView - visiblePhotos.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="w-[220px] h-[220px] bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex-shrink-0"
                ></div>
              ))}
            </>
          )}
        </div>

        {/* Navigation arrows - only show if there are more than 5 photos */}
        {photos.length > photosPerView && (
          <>
            <button
              onClick={prevPhotos}
              disabled={currentIndex === 0}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed z-10"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={nextPhotos}
              disabled={currentIndex >= maxIndex}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed z-10"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Photo counter */}
        {photos.length > photosPerView && (
          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {Math.min(currentIndex + photosPerView, photos.length)} of {photos.length}
          </div>
        )}
      </div>

      {/* Pagination dots - only show if there are more than 5 photos */}
      {photos.length > photosPerView && (
        <div className="flex justify-center mt-2 space-x-1">
          {Array.from({ length: Math.ceil(photos.length / photosPerView) }).map((_, index) => {
            const pageStartIndex = index * photosPerView
            const isActive = currentIndex >= pageStartIndex && currentIndex < pageStartIndex + photosPerView
            return (
              <button
                key={index}
                onClick={() => setCurrentIndex(pageStartIndex)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? "bg-blue-500" : "bg-gray-300"}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

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

// Helper function to check if business serves a zip code
const businessServesZipCode = (business: Business, zipCode: string): boolean => {
  console.log(`[Food Dining] Checking if business serves ${zipCode}:`, {
    businessName: business.displayName || business.businessName,
    isNationwide: business.isNationwide,
    serviceArea: business.serviceArea,
    primaryZip: business.zipCode,
  })

  // Check if business serves nationwide
  if (business.isNationwide) {
    console.log(`[Food Dining] Business serves nationwide`)
    return true
  }

  // Check if the zip code is in the business's service area
  if (business.serviceArea && Array.isArray(business.serviceArea) && business.serviceArea.length > 0) {
    const serves = business.serviceArea.includes(zipCode)
    console.log(`[Food Dining] Service area check: ${serves}`)
    return serves
  }

  // Fall back to primary zip code comparison
  const primaryMatch = business.zipCode === zipCode
  console.log(`[Food Dining] Primary zip code check: ${primaryMatch}`)
  return primaryMatch
}

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(phoneNumberString: string) {
  if (!phoneNumberString) return "No phone provided"

  // Strip all non-numeric characters
  const cleaned = phoneNumberString.replace(/\D/g, "")

  // Check if the number is valid
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }

  // If the format doesn't match, return the original
  return phoneNumberString
}

export default function FoodDiningPage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "restaurant1", label: "Asian", value: "Asian" },
    { id: "restaurant2", label: "Indian", value: "Indian" },
    { id: "restaurant3", label: "Middle Eastern", value: "Middle Eastern" },
    { id: "restaurant4", label: "Mexican", value: "Mexican" },
    { id: "restaurant5", label: "Italian", value: "Italian" },
    { id: "restaurant6", label: "American", value: "American" },
    { id: "restaurant7", label: "Greek", value: "Greek" },
    { id: "restaurant8", label: "Other Ethnic Foods", value: "Other Ethnic Foods" },
    { id: "restaurant9", label: "Upscale", value: "Upscale" },
    { id: "restaurant10", label: "Casual", value: "Casual" },
    { id: "restaurant11", label: "Coffee and Tea Shops", value: "Coffee and Tea Shops" },
    { id: "restaurant12", label: "Ice Cream, Confectionery and Cakes", value: "Ice Cream, Confectionery and Cakes" },
    { id: "restaurant13", label: "Pizzeria", value: "Pizzeria" },
    { id: "restaurant14", label: "Bars/Pubs/Taverns", value: "Bars/Pubs/Taverns" },
    {
      id: "restaurant15",
      label: "Organic/Vegetarian",
      value: "Organic/Vegetarian",
    },
    { id: "restaurant16", label: "Fast Food", value: "Fast Food" },
    { id: "restaurant17", label: "Catering", value: "Catering" },
    { id: "restaurant18", label: "Buffet", value: "Buffet" },
    { id: "restaurant19", label: "Bakery/Bagels/Donuts", value: "Bakery/Bagels/Donuts" },
    { id: "restaurant20", label: "Breakfast", value: "Breakfast" },
    { id: "restaurant21", label: "24 hour/Open Late", value: "24 hour/Open Late" },
    { id: "restaurant22", label: "Carts/Stands/Trucks", value: "Carts/Stands/Trucks" },
    { id: "restaurant23", label: "Dinner Theater", value: "Dinner Theater" },
    { id: "restaurant24", label: "Sandwich Shops", value: "Sandwich Shops" },
    { id: "restaurant25", label: "Drive-Ins", value: "Drive-Ins" },
    { id: "restaurant26", label: "Seafood", value: "Seafood" },
    { id: "restaurant27", label: "Steak House", value: "Steak House" },
    { id: "restaurant28", label: "Sushi", value: "Sushi" },
    { id: "restaurant29", label: "Cafeteria", value: "Cafeteria" },
  ]

  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  const fetchBusinesses = async () => {
    const currentFetchId = ++fetchIdRef.current

    try {
      setIsLoading(true)

      console.log(`[Food Dining] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

      const result = await getBusinessesForCategoryPage("/food-dining")

      // Load photos for each business using public Cloudflare URLs
      const businessesWithPhotos = await Promise.all(
        result.map(async (business: Business) => {
          const photos = await loadBusinessPhotos(business.id)
          return { ...business, photos }
        }),
      )

      // Check if this is still the current request
      if (currentFetchId !== fetchIdRef.current) {
        console.log(`[Food Dining] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
        return
      }

      console.log(`[Food Dining] Fetch ${currentFetchId} completed, got ${result.length} businesses`)

      // Filter by zip code if available
      let filteredResult = businessesWithPhotos
      if (userZipCode) {
        console.log(`[Food Dining] Filtering by zip code: ${userZipCode}`)
        filteredResult = businessesWithPhotos.filter((business: Business) => {
          const serves = businessServesZipCode(business, userZipCode)
          console.log(
            `[Food Dining] Business ${business.displayName || business.adDesignData?.businessInfo?.businessName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
            {
              serviceArea: business.serviceArea,
              primaryZip: business.zipCode,
              isNationwide: business.isNationwide,
            },
          )
          return serves
        })
        console.log(`[Food Dining] After filtering: ${filteredResult.length} businesses`)
      }

      setBusinesses(filteredResult)
      setAllBusinesses(filteredResult)
    } catch (error) {
      // Only update error if this is still the current request
      if (currentFetchId === fetchIdRef.current) {
        console.error(`[Food Dining] Error in fetch ${currentFetchId}:`, error)
        toast({
          title: "Error loading businesses",
          description: "There was a problem loading businesses. Please try again later.",
          variant: "destructive",
        })
      }
    } finally {
      // Only update loading if this is still the current request
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchBusinesses()
  }, [userZipCode])

  // Check user session
  useEffect(() => {
    const checkUserSession = async () => {
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
    const loadFavorites = async () => {
      if (!currentUser?.id) {
        setFavoriteBusinesses(new Set())
        return
      }

      try {
        const favoriteIds = new Set<string>()

        // Check each business to see if it's favorited
        for (const business of allBusinesses) {
          const isFavorite = await checkIfBusinessIsFavorite(business.id)
          if (isFavorite) {
            favoriteIds.add(business.id)
          }
        }

        setFavoriteBusinesses(favoriteIds)
      } catch (error) {
        console.error("Error loading favorites:", error)
        setFavoriteBusinesses(new Set())
      }
    }

    if (currentUser && allBusinesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, allBusinesses])

  // Helper function to check if a business has a specific subcategory
  const hasExactSubcategoryMatch = (business: Business, subcategory: string): boolean => {
    // Check in subcategories array
    if (business.subcategories && Array.isArray(business.subcategories)) {
      if (
        business.subcategories.some((sub) => typeof sub === "string" && sub.toLowerCase() === subcategory.toLowerCase())
      ) {
        return true
      }
    }

    // Check in allSubcategories array
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      if (
        business.allSubcategories.some(
          (sub) => typeof sub === "string" && sub.toLowerCase() === subcategory.toLowerCase(),
        )
      ) {
        return true
      }
    }

    // Check in subcategory field
    if (business.subcategory && business.subcategory.toLowerCase() === subcategory.toLowerCase()) {
      return true
    }

    return false
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      } else {
        return [...prev, value]
      }
    })
  }

  const applyFilters = () => {
    if (selectedFilters.length === 0) {
      return
    }

    console.log("Applying filters:", selectedFilters)

    const filtered = allBusinesses.filter((business) => {
      // If no filters are selected, show all businesses
      if (selectedFilters.length === 0) return true

      // Check if business matches any of the selected filters
      return selectedFilters.some((filter) => hasExactSubcategoryMatch(business, filter))
    })

    setAppliedFilters([...selectedFilters])
    setBusinesses(filtered)

    toast({
      title: `Filter applied`,
      description: `Showing ${filtered.length} restaurants matching your criteria.`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setBusinesses(allBusinesses)

    toast({
      title: "Filters cleared",
      description: "Showing all restaurants.",
    })
  }

  // The businesses state now holds the filtered businesses directly
  const filteredBusinesses = businesses

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
    // Helper function to extract string from subcategory object
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

    // First try to get from subcategories (which should contain the full category objects)
    if (business.subcategories && business.subcategories.length > 0) {
      return business.subcategories.map(getSubcategoryString).filter((s) => s !== "Unknown Service")
    }

    // Then try allSubcategories
    if (business.allSubcategories && business.allSubcategories.length > 0) {
      return business.allSubcategories.map(getSubcategoryString).filter((s) => s !== "Unknown Service")
    }

    // Fall back to services if available
    if (business.services && business.services.length > 0) {
      return business.services.map(getSubcategoryString).filter((s) => s !== "Unknown Service")
    }

    return ["Restaurant"]
  }

  const handleReviewsClick = (provider: Business) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleProfileClick = (provider: Business) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  const clearZipCodeFilter = () => {
    localStorage.removeItem("savedZipCode")
    setUserZipCode(null)
  }

  // Handle photo loading for mobile PhotoCarousel
  const handleLoadPhotos = () => {
    // Photos are already loaded in the useEffect hook
  }

  const handleAddToFavorites = async (business: Business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    // Prevent duplicate saves
    if (favoriteBusinesses.has(business.id)) {
      toast({
        title: "Already saved",
        description: "This business card is already in your favorites.",
        variant: "default",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [business.id]: true }))

    try {
      const result = await addFavoriteBusiness({
        id: business.id,
        businessName: business.businessName || "Restaurant",
        displayName:
          business.displayName ||
          business.adDesignData?.businessInfo?.businessName ||
          business.businessName ||
          "Restaurant",
        phone: getPhoneNumber(business) || "",
        email: business.email || "",
        address: getLocation(business),
        zipCode: business.zipCode || "",
      })

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, business.id]))
        toast({
          title: "Business card saved!",
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

  return (
    <CategoryLayout title="Food & Dining" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/food%20service-Dz8Ysy9mwKkqz0nqDYzsqbRGOGvEFy.png"
            alt="Food and Dining"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find restaurants and dining options in your area. Browse options below or use filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read reviews from other customers</li>
              <li>View business videos showcasing work and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you frequent yourself</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Filter by Cuisine Type</h3>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filterOptions.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={option.id}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={selectedFilters.includes(option.value)}
                  onChange={() => handleFilterChange(option.value)}
                />
                <label htmlFor={option.id} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={applyFilters} disabled={selectedFilters.length === 0} className="text-sm">
              Apply Filters {selectedFilters.length > 0 && `(${selectedFilters.length})`}
            </Button>

            {appliedFilters.length > 0 && (
              <Button variant="outline" onClick={clearFilters} className="text-sm bg-transparent">
                Clear Filters
              </Button>
            )}

            {appliedFilters.length > 0 && (
              <span className="text-sm text-gray-500">
                Showing {filteredBusinesses.length} of {businesses.length} restaurants
              </span>
            )}
          </div>

          {appliedFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {appliedFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {filter}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Showing restaurants for zip code:</span> {userZipCode}
              <span className="text-xs block mt-1">(Includes businesses with {userZipCode} in their service area)</span>
            </p>
            <Button variant="outline" size="sm" onClick={clearZipCodeFilter} className="text-xs bg-transparent">
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading restaurants...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Restaurants ({filteredBusinesses.length})</h2>
          <div className="grid gap-6">
            {filteredBusinesses.map((business: Business) => (
              <div key={business.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex flex-col space-y-4">
                  {/* Business Name and Description */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {business.displayName ||
                        business.adDesignData?.businessInfo?.businessName ||
                        business.businessName}
                    </h3>
                    {business.description && (
                      <p className="text-gray-600 text-sm leading-relaxed">{business.description}</p>
                    )}
                  </div>

                  {/* Mobile Layout */}
                  <div className="lg:hidden space-y-4">
                    {/* Contact Info */}
                    <div className="space-y-2">
                      {getPhoneNumber(business) && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`tel:${getPhoneNumber(business)}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            {formatPhoneNumber(getPhoneNumber(business)!)}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{getLocation(business)}</span>
                      </div>

                      {userZipCode && (
                        <div className="text-xs text-green-600 mt-1">
                          {business.isNationwide ? (
                            <span>✓ Serves nationwide</span>
                          ) : business.serviceArea?.includes(userZipCode) ? (
                            <span>✓ Serves {userZipCode} and surrounding areas</span>
                          ) : business.zipCode === userZipCode ? (
                            <span>✓ Located in {userZipCode}</span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Cuisine Types */}
                    {getSubcategories(business).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Cuisine:</h4>
                        <div className="flex flex-wrap gap-2">
                          {getSubcategories(business).map((subcategory: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {typeof subcategory === "string" ? subcategory : subcategory.name || "Unknown"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mobile Photo Carousel */}
                    <PhotoCarousel
                      businessId={business.id}
                      photos={business.photos || []}
                      onLoadPhotos={handleLoadPhotos}
                      showMultiple={true}
                      photosPerView={2}
                      size="small"
                    />

                    {/* Mobile Action Buttons */}
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewsClick(business)}
                        className="text-sm"
                      >
                        Reviews
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleProfileClick(business)}
                        className="text-sm"
                      >
                        View Profile
                      </Button>
                      <Button
                        variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleAddToFavorites(business)}
                        disabled={savingStates[business.id]}
                        className={
                          favoriteBusinesses.has(business.id)
                            ? "text-sm bg-red-600 hover:bg-red-700 border-red-600"
                            : "text-sm border-red-600 text-red-600 hover:bg-red-50"
                        }
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

                  {/* Desktop Layout */}
                  <div className="hidden lg:flex flex-col space-y-4">
                    {/* Main content area with contact info and buttons */}
                    <div className="flex items-start justify-between">
                      {/* Left side - Contact and Location Info */}
                      <div className="space-y-2 flex-shrink-0">
                        {/* Phone Number */}
                        {getPhoneNumber(business) && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <a
                              href={`tel:${getPhoneNumber(business)}`}
                              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                            >
                              {formatPhoneNumber(getPhoneNumber(business)!)}
                            </a>
                          </div>
                        )}

                        {/* Location */}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{getLocation(business)}</span>
                        </div>

                        {/* Service Area Indicator */}
                        {userZipCode && (
                          <div className="text-xs text-green-600 mt-1">
                            {business.isNationwide ? (
                              <span>✓ Serves nationwide</span>
                            ) : business.serviceArea?.includes(userZipCode) ? (
                              <span>✓ Serves {userZipCode} and surrounding areas</span>
                            ) : business.zipCode === userZipCode ? (
                              <span>✓ Located in {userZipCode}</span>
                            ) : null}
                          </div>
                        )}
                      </div>

                      {/* Right side - Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReviewsClick(business)}
                          className="text-sm min-w-[100px]"
                        >
                          Reviews
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleProfileClick(business)}
                          className="text-sm min-w-[100px]"
                        >
                          View Profile
                        </Button>
                        <Button
                          variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleAddToFavorites(business)}
                          disabled={savingStates[business.id]}
                          className={
                            favoriteBusinesses.has(business.id)
                              ? "text-sm min-w-[100px] bg-red-600 hover:bg-red-700 border-red-600"
                              : "text-sm min-w-[100px] border-red-600 text-red-600 hover:bg-red-50"
                          }
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

                    {/* Subcategories/Cuisine Types */}
                    {getSubcategories(business).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Cuisine:</h4>
                        <div className="flex flex-wrap gap-2">
                          {getSubcategories(business).map((subcategory: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {typeof subcategory === "string" ? subcategory : subcategory.name || "Unknown"}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Desktop Photo Carousel */}
                    <DesktopPhotoCarousel
                      photos={business.photos || []}
                      businessName={
                        business.displayName ||
                        business.adDesignData?.businessInfo?.businessName ||
                        business.businessName ||
                        "Restaurant"
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-amber-800 mb-2">
              {userZipCode ? `No Restaurants Found in ${userZipCode} Area` : "No Restaurants Found"}
            </h3>
            <p className="text-amber-700 mb-4">
              {userZipCode
                ? `We're building our network of restaurants and dining options in the ${userZipCode} area.`
                : "We're building our network of restaurants and dining options in your area."}
            </p>
            <div className="bg-white rounded border border-amber-100 p-4">
              <p className="text-gray-700 font-medium">Are you a restaurant owner?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to showcase your restaurant and connect with diners in your area.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Restaurant</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={
            selectedProvider.displayName ||
            selectedProvider.adDesignData?.businessInfo?.businessName ||
            selectedProvider.businessName
          }
          businessId={selectedProvider.id}
          reviews={selectedProvider.reviews || []}
        />
      )}

      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
          businessName={
            selectedProvider.displayName ||
            selectedProvider.adDesignData?.businessInfo?.businessName ||
            selectedProvider.businessName
          }
        />
      )}

      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />

      <Toaster />
    </CategoryLayout>
  )
}
