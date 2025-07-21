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
import { MapPin, Phone, Camera, ChevronLeft, ChevronRight } from "lucide-react"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useRef } from "react"
import { getBusinessMedia, type MediaItem } from "@/app/actions/media-actions"
import { PhotoCarousel } from "@/components/photo-carousel"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Heart, HeartHandshake, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

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

export default function PersonalAssistantsPage() {
  const { toast } = useToast()
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)

  // State for profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<{ id: string; name: string } | null>(null)

  // State for filtering
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState([])
  const [filteredProviders, setFilteredProviders] = useState([])

  // State for media/photos
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, MediaItem[]>>({})
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({})

  // State for carousel navigation
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({})

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Remove the mock providers state and replace with real data fetching
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Add after existing state declarations:
  const fetchIdRef = useRef(0)

  // State for favorites functionality
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  // Enhanced Business interface
  interface Business {
    id: string
    name?: string
    displayName?: string
    displayPhone?: string
    displayCity?: string
    displayState?: string
    city?: string
    state?: string
    phone?: string
    rating?: number
    reviewCount?: number
    services?: any[]
    subcategories?: any[]
    allSubcategories?: any[]
    zipCode?: string
    serviceArea?: string[]
    adDesignData?: {
      businessInfo?: {
        phone?: string
        city?: string
        state?: string
      }
    }
    email?: string
    displayLocation?: string
  }

  // Helper function to check if business serves a zip code
  const businessServesZipCode = (business: Business, zipCode: string): boolean => {
    // If business has no service area defined, fall back to primary zip code
    if (!business.serviceArea || business.serviceArea.length === 0) {
      return business.zipCode === zipCode
    }

    // Check if business serves nationwide (indicated by having "nationwide" in service area)
    if (business.serviceArea.some((area) => area.toLowerCase().includes("nationwide"))) {
      return true
    }

    // Check if the zip code is in the business's service area
    return business.serviceArea.includes(zipCode)
  }

  // Function to load photos for a business
  const loadBusinessPhotos = async (businessId: string) => {
    if (loadingPhotos[businessId] || businessPhotos[businessId]) {
      return // Already loading or loaded
    }

    setLoadingPhotos((prev) => ({ ...prev, [businessId]: true }))

    try {
      const mediaData = await getBusinessMedia(businessId)
      const photos = mediaData?.photoAlbum || []

      setBusinessPhotos((prev) => ({ ...prev, [businessId]: photos }))
      setCarouselIndex((prev) => ({ ...prev, [businessId]: 0 }))
    } catch (error) {
      console.error(`Error loading photos for business ${businessId}:`, error)
      setBusinessPhotos((prev) => ({ ...prev, [businessId]: [] }))
    } finally {
      setLoadingPhotos((prev) => ({ ...prev, [businessId]: false }))
    }
  }

  // Carousel navigation functions
  const handlePrevious = (businessId: string) => {
    const photos = businessPhotos[businessId] || []
    const currentIndex = carouselIndex[businessId] || 0
    const newIndex = currentIndex > 0 ? currentIndex - 1 : Math.max(0, photos.length - 5)
    setCarouselIndex((prev) => ({ ...prev, [businessId]: newIndex }))
  }

  const handleNext = (businessId: string) => {
    const photos = businessPhotos[businessId] || []
    const currentIndex = carouselIndex[businessId] || 0
    const maxIndex = Math.max(0, photos.length - 5)
    const newIndex = currentIndex < maxIndex ? currentIndex + 1 : 0
    setCarouselIndex((prev) => ({ ...prev, [businessId]: newIndex }))
  }

  // Function to format phone numbers
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "No phone provided"

    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "")

    // Check if it's a valid 10-digit US phone number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }

    // Return original if not a standard format
    return phone
  }

  // Filter handling functions
  const handleFilterChange = (filterId: string, checked: boolean) => {
    const filterOption = filterOptions.find((option) => option.id === filterId)
    if (!filterOption) return

    setSelectedFilters((prev) => {
      if (checked) {
        return [...prev, filterOption.value]
      } else {
        return prev.filter((filter) => filter !== filterOption.value)
      }
    })
  }

  const hasExactSubcategoryMatch = (businessSubcategories: any[], filter: string): boolean => {
    return businessSubcategories.some((subcategory) => {
      // Use helper function to get string value
      const subcatNormalized = getSubcategoryString(subcategory).trim().toLowerCase()
      const filterNormalized = filter.trim().toLowerCase()

      // Only exact matches
      return subcatNormalized === filterNormalized
    })
  }

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All providers:", allProviders)

    setAppliedFilters([...selectedFilters])

    if (selectedFilters.length === 0) {
      setFilteredProviders(allProviders)
      return
    }

    const filtered = allProviders.filter((business: Business) => {
      // Get all subcategories for this business
      const businessSubcategories = [...(business.allSubcategories || []), ...(business.subcategories || [])]

      console.log(`Business ${business.displayName || business.name} subcategories:`, businessSubcategories)

      // Check if any selected filter matches any business subcategory
      const hasMatch = selectedFilters.some((filter) => {
        // Use strict matching
        const filterMatch = hasExactSubcategoryMatch(businessSubcategories, filter)
        console.log(`Filter "${filter}" matches business: ${filterMatch}`)
        return filterMatch
      })

      console.log(`Business ${business.displayName || business.name} has match: ${hasMatch}`)
      return hasMatch
    })

    console.log("Filtered results:", filtered)
    setFilteredProviders(filtered)

    // Show toast notification
    toast({
      title: filtered.length > 0 ? "Filters Applied" : "No Matches Found",
      description:
        filtered.length > 0
          ? `Showing ${filtered.length} of ${allProviders.length} businesses`
          : "No businesses match your selected filters",
      duration: 3000,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredProviders(allProviders)

    toast({
      title: "Filters Cleared",
      description: `Showing all ${allProviders.length} businesses`,
      duration: 3000,
    })
  }

  const filterOptions = [
    { id: "assistants1", label: "Personal Drivers", value: "Personal Drivers" },
    { id: "assistants2", label: "Personal Assistants", value: "Personal Assistants" },
    { id: "assistants3", label: "Companions", value: "Companions" },
    { id: "assistants4", label: "Personal Secretaries", value: "Personal Secretaries" },
    { id: "assistants5", label: "Personal Shoppers", value: "Personal Shoppers" },
  ]

  // Replace the useEffect:
  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current

      try {
        setLoading(true)
        setError(null)

        console.log(`[Personal Assistants] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

        const businesses = await getBusinessesForCategoryPage("/personal-assistants")

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(
            `[Personal Assistants] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`,
          )
          return
        }

        console.log(`[Personal Assistants] Fetch ${currentFetchId} completed, got ${businesses.length} businesses`)
        console.log("Sample business data:", businesses[0]) // Debug log

        // Filter by zip code if available
        let filteredBusinesses = businesses
        if (userZipCode) {
          console.log(`[Personal Assistants] Filtering by zip code: ${userZipCode}`)
          filteredBusinesses = businesses.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Personal Assistants] Business ${business.displayName || business.name} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              {
                serviceArea: business.serviceArea,
                primaryZip: business.zipCode,
              },
            )
            return serves
          })
          console.log(`[Personal Assistants] After filtering: ${filteredBusinesses.length} businesses`)
        }

        // Use businesses as-is without adding default subcategories
        setAllProviders(filteredBusinesses)
        setFilteredProviders(filteredBusinesses)

        // Load photos for each business
        filteredBusinesses.forEach((business: Business) => {
          loadBusinessPhotos(business.id)
        })
      } catch (err) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Personal Assistants] Error in fetch ${currentFetchId}:`, err)
          setError("Failed to load businesses")
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

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
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
          filteredProviders.map(async (provider: Business) => {
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

    if (filteredProviders.length > 0) {
      loadFavorites()
    }
  }, [currentUser, filteredProviders])

  const handleOpenReviews = (provider: string) => {
    setSelectedProvider(provider)
    setIsReviewsOpen(true)
  }

  const handleOpenProfile = (provider: Business) => {
    setSelectedBusinessProfile({ id: provider.id, name: provider.displayName || provider.name })
    setIsProfileDialogOpen(true)
  }

  const handleAddToFavorites = async (provider: Business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(provider.id)) {
      toast({
        title: "Already Saved",
        description: `${provider.displayName || provider.name} is already in your favorites`,
        duration: 3000,
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [provider.id]: true }))

    try {
      const result = await addFavoriteBusiness({
        id: provider.id,
        businessName: provider.name || "",
        displayName: provider.displayName || provider.name || "",
        phone: provider.displayPhone || provider.phone || "",
        email: provider.email || "",
        address: provider.displayLocation || "",
        zipCode: provider.zipCode || "",
      })

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, provider.id]))
        toast({
          title: "Business Card Saved!",
          description: result.message,
          duration: 3000,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error adding to favorites:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [provider.id]: false }))
    }
  }

  const mockReviews = {
    "Personal Assistant 1": [
      { id: 1, rating: 5, comment: "Great service!" },
      { id: 2, rating: 4, comment: "Good, but could be better." },
    ],
    "Personal Assistant 2": [
      { id: 3, rating: 3, comment: "Average service." },
      { id: 4, rating: 5, comment: "Excellent!" },
    ],
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

      {/* Enhanced Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-wrap gap-4 mb-4">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                id={option.id}
                checked={selectedFilters.includes(option.value)}
                onChange={(e) => handleFilterChange(option.id, e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={applyFilters} disabled={selectedFilters.length === 0} size="sm">
              Apply Filters ({selectedFilters.length})
            </Button>
            {appliedFilters.length > 0 && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            )}
          </div>
          {selectedFilters.length > 0 && (
            <span className="text-sm text-gray-600">
              {selectedFilters.length} filter{selectedFilters.length !== 1 ? "s" : ""} selected
            </span>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {appliedFilters.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Active filters:</span> {appliedFilters.join(", ")}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Showing {filteredProviders.length} of {allProviders.length} businesses
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs bg-transparent">
              Clear
            </Button>
          </div>
        </div>
      )}

      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Showing personal assistants for zip code:</span> {userZipCode}
              <span className="text-xs block mt-1">(Includes businesses with {userZipCode} in their service area)</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("savedZipCode")
                setUserZipCode(null)
              }}
              className="text-xs"
            >
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading personal assistants...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {appliedFilters.length > 0
                ? "No Personal Assistants Match Your Filters"
                : userZipCode
                  ? `No Personal Assistants in ${userZipCode} Area`
                  : "No Personal Assistants Yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {appliedFilters.length > 0
                ? `No businesses found matching: ${appliedFilters.join(", ")}. Try adjusting your filters.`
                : userZipCode
                  ? `We're building our network of personal assistant services in the ${userZipCode} area.`
                  : "Be the first personal assistant service to join our platform and connect with clients in your area."}
            </p>
            {appliedFilters.length > 0 ? (
              <Button onClick={clearFilters} className="bg-indigo-600 hover:bg-indigo-700">
                Clear Filters
              </Button>
            ) : (
              <Button className="bg-indigo-600 hover:bg-indigo-700">Register Your Service</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  {/* Left: Business Info - Made wider */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {provider.displayName || provider.name}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>
                          {provider.adDesignData?.businessInfo?.city && provider.adDesignData?.businessInfo?.state
                            ? `${provider.adDesignData.businessInfo.city}, ${provider.adDesignData.businessInfo.state}`
                            : provider.displayCity && provider.displayState
                              ? `${provider.displayCity}, ${provider.displayState}`
                              : provider.city && provider.state
                                ? `${provider.city}, ${provider.state}`
                                : provider.zipCode
                                  ? `ZIP: ${provider.zipCode}`
                                  : "Location not specified"}
                        </span>
                      </div>
                      {(provider.adDesignData?.businessInfo?.phone || provider.displayPhone || provider.phone) && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>
                            {formatPhoneNumber(
                              provider.adDesignData?.businessInfo?.phone || provider.displayPhone || provider.phone,
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {provider.allSubcategories && provider.allSubcategories.length > 0 ? (
                          provider.allSubcategories.map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(service)}
                            </span>
                          ))
                        ) : provider.subcategories && provider.subcategories.length > 0 ? (
                          provider.subcategories.map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(service)}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Personal Services
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex flex-col space-y-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-3 py-1 h-7 bg-transparent"
                      onClick={() => handleOpenReviews(provider.displayName || provider.name)}
                    >
                      Ratings
                    </Button>
                    <Button size="sm" className="text-xs px-3 py-1 h-7" onClick={() => handleOpenProfile(provider)}>
                      View Profile
                    </Button>
                    <Button
                      variant={favoriteBusinesses.has(provider.id) ? "default" : "outline"}
                      size="sm"
                      className={`text-xs px-3 py-1 h-7 ${
                        favoriteBusinesses.has(provider.id)
                          ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                          : "bg-transparent border-red-600 text-red-600 hover:bg-red-50"
                      }`}
                      onClick={() => handleAddToFavorites(provider)}
                      disabled={savingStates[provider.id]}
                    >
                      {savingStates[provider.id] ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : favoriteBusinesses.has(provider.id) ? (
                        <>
                          <HeartHandshake className="w-3 h-3 mr-1" />
                          Saved
                        </>
                      ) : (
                        <>
                          <Heart className="w-3 h-3 mr-1" />
                          Save Card
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Photo Gallery at Bottom - Updated to 220px × 220px photos */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  {/* Mobile: Use PhotoCarousel component */}
                  <div className="block md:hidden">
                    {businessPhotos[provider.id] && businessPhotos[provider.id].length > 0 ? (
                      <PhotoCarousel
                        businessId={provider.id}
                        photos={businessPhotos[provider.id].map((photo) => {
                          // Handle both cloudflare and regular URLs
                          if (photo.cloudflareImageId) {
                            return `https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID}/${photo.cloudflareImageId}/public`
                          }
                          return photo.url || "/placeholder.svg"
                        })}
                        onLoadPhotos={() => loadBusinessPhotos(provider.id)}
                        showMultiple={true}
                        photosPerView={2}
                        size="medium"
                        className="h-48"
                      />
                    ) : loadingPhotos[provider.id] ? (
                      <div className="flex items-center justify-center w-full h-48 bg-gray-100 rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full h-48 bg-gray-100 rounded-lg">
                        <div className="text-center">
                          <Camera className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                          <span className="text-gray-500 text-sm">No photos available</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Desktop: Keep existing carousel */}
                  <div className="hidden md:block">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrevious(provider.id)}
                        disabled={!businessPhotos[provider.id] || businessPhotos[provider.id].length <= 5}
                        className="h-8 w-8 p-0 flex-shrink-0 bg-transparent"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex space-x-2 overflow-hidden flex-1">
                        {loadingPhotos[provider.id] ? (
                          <div className="flex items-center justify-center w-full h-[220px]">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          </div>
                        ) : businessPhotos[provider.id] && businessPhotos[provider.id].length > 0 ? (
                          businessPhotos[provider.id]
                            .slice(carouselIndex[provider.id] || 0, (carouselIndex[provider.id] || 0) + 5)
                            .map((photo, index) => (
                              <div key={photo.id} className="flex-shrink-0 w-[220px] h-[220px]">
                                <Image
                                  src={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID}/${photo.cloudflareImageId}/public`}
                                  alt={photo.filename || `Photo ${index + 1}`}
                                  width={220}
                                  height={220}
                                  className="w-full h-full object-cover rounded-lg"
                                  onError={(e) => {
                                    // Fallback to original URL if Cloudflare fails
                                    e.currentTarget.src = photo.url || "/placeholder.svg"
                                  }}
                                />
                              </div>
                            ))
                        ) : (
                          <div className="flex items-center justify-center w-full h-[220px] bg-gray-100 rounded-lg">
                            <div className="text-center">
                              <Camera className="w-8 h-8 mx-auto text-gray-400 mb-1" />
                              <span className="text-gray-500 text-sm">No photos available</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleNext(provider.id)}
                        disabled={
                          !businessPhotos[provider.id] ||
                          businessPhotos[provider.id].length <= 5 ||
                          (carouselIndex[provider.id] || 0) >= businessPhotos[provider.id].length - 5
                        }
                        className="h-8 w-8 p-0 flex-shrink-0"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {businessPhotos[provider.id] && businessPhotos[provider.id].length > 5 && (
                      <div className="text-center mt-2">
                        <span className="text-xs text-gray-500">
                          {(carouselIndex[provider.id] || 0) + 1}-
                          {Math.min((carouselIndex[provider.id] || 0) + 5, businessPhotos[provider.id].length)} of{" "}
                          {businessPhotos[provider.id].length} photos
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsOpen}
          onClose={() => setIsReviewsOpen(false)}
          providerName={selectedProvider || ""}
          reviews={mockReviews[selectedProvider] || []}
        />
      )}

      {selectedBusinessProfile && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedBusinessProfile.id}
          businessName={selectedBusinessProfile.name}
        />
      )}

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>You need to be logged in to save business cards to your favorites.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => {
                setIsLoginDialogOpen(false)
                window.location.href = "/user-login"
              }}
              className="w-full"
            >
              Login to Your Account
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsLoginDialogOpen(false)
                window.location.href = "/user-register"
              }}
              className="w-full"
            >
              Create New Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </CategoryLayout>
  )
}
