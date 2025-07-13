"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Phone, MapPin, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"
import { Card, CardContent } from "@/components/ui/card"

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
  services?: any[]
  subcategories?: any[]
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
  businessDescription?: string
  displayLocation?: string
  reviewCount?: number
}

// Photo Carousel Component - displays 5 photos in landscape format
interface PhotoCarouselProps {
  photos: string[]
  businessName: string
}

function PhotoCarousel({ photos, businessName }: PhotoCarouselProps) {
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

export default function TechITServicesPage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "computers1", label: "Computer Network Specialists", value: "Computer Network Specialists" },
    { id: "computers2", label: "Database Administrators", value: "Database Administrators" },
    { id: "computers3", label: "Database Architects", value: "Database Architects" },
    { id: "computers4", label: "Computer Programmers", value: "Computer Programmers" },
    { id: "computers5", label: "Software Developers", value: "Software Developers" },
    { id: "computers6", label: "Website Developers", value: "Website Developers" },
    { id: "computers7", label: "Computer Security", value: "Computer Security" },
    { id: "computers8", label: "Blockchain and Crypto", value: "Blockchain and Crypto" },
    { id: "computers9", label: "Technology Consultants", value: "Technology Consultants" },
  ]

  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<{ id: string; name: string } | null>(null)
  const [providers, setProviders] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Business[]>([])
  const [showFiltered, setShowFiltered] = useState(false)

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

  // Helper function to check if business serves a zip code
  const businessServesZipCode = (business: Business, zipCode: string): boolean => {
    console.log(
      `[Tech Services] Checking if business ${business.displayName || business.businessName} serves ${zipCode}:`,
      {
        isNationwide: business.isNationwide,
        serviceArea: business.serviceArea,
        primaryZip: business.zipCode,
      },
    )

    // Check if business serves nationwide
    if (business.isNationwide) {
      console.log(`[Tech Services] Business serves nationwide`)
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
      console.log(`[Tech Services] Service area check result: ${serves}`)
      if (serves) return true
    }

    // Fall back to primary zip code comparison
    const primaryMatch = business.zipCode === zipCode
    console.log(`[Tech Services] Primary zip code match: ${primaryMatch}`)
    return primaryMatch
  }

  // Phone number formatting function
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

  // Location formatting function
  const getLocation = (provider: Business): string => {
    // First priority: city and state from ad design data
    const adDesignCity = provider.adDesignData?.businessInfo?.city
    const adDesignState = provider.adDesignData?.businessInfo?.state

    if (adDesignCity && adDesignState) {
      return `${adDesignCity}, ${adDesignState}`
    }

    // Second priority: display city and state from centralized system
    if (provider.displayCity && provider.displayState) {
      return `${provider.displayCity}, ${provider.displayState}`
    }

    // Third priority: original business city and state
    if (provider.city && provider.state) {
      return `${provider.city}, ${provider.state}`
    }

    // Fourth priority: ZIP code if available
    if (provider.zipCode) {
      return provider.zipCode
    }

    // Final fallback
    return "Location not specified"
  }

  // Clear zip code filter
  const clearZipCodeFilter = () => {
    setUserZipCode(null)
    localStorage.removeItem("savedZipCode")
  }

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  useEffect(() => {
    async function fetchProviders() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[Tech Services] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

      try {
        setLoading(true)
        setError(null)

        // Use the centralized system
        const businesses = await getBusinessesForCategoryPage("/tech-it-services")

        // Load photos for each business using public Cloudflare URLs
        const businessesWithPhotos = await Promise.all(
          businesses.map(async (business: Business) => {
            const photos = await loadBusinessPhotos(business.id)
            return { ...business, photos }
          }),
        )

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Tech Services] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Tech Services] Fetch ${currentFetchId} completed, got ${businesses.length} businesses`)

        // Ensure each business has a services array
        const processedBusinesses = businessesWithPhotos.map((business: any) => ({
          ...business,
          services: business.services || business.subcategories || [],
          reviews: business.reviews || [],
          rating: business.rating || 0,
          allSubcategories: Array.from(new Set([...(business.subcategories || []), ...(business.services || [])])),
        }))

        // Filter by zip code if available
        if (userZipCode) {
          console.log(`[Tech Services] Filtering by zip code: ${userZipCode}`)
          const filteredByZip = processedBusinesses.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Tech Services] Business ${business.displayName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              business,
            )
            return serves
          })
          console.log(`[Tech Services] After filtering: ${filteredByZip.length} businesses`)
          setProviders(filteredByZip)
        } else {
          setProviders(processedBusinesses)
        }
      } catch (err) {
        // Only update error state if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error("Error fetching tech providers:", err)
          setError("Failed to load providers")
          toast({
            title: "Error loading businesses",
            description: "There was a problem loading tech service providers. Please try again later.",
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

    fetchProviders()
  }, [userZipCode])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider({
      ...provider,
      name: provider.displayName || provider.name,
      reviews: provider.reviews || [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedBusinessProfile({
      id: provider.id,
      name: provider.displayName || provider.name,
    })
    setIsProfileDialogOpen(true)
  }

  // Custom filter component with apply functionality
  const TechServicesFilter = () => {
    const handleFilterChange = (filterId: string, checked: boolean) => {
      setSelectedFilters((prev) => {
        if (checked) {
          return [...prev, filterId]
        } else {
          return prev.filter((id) => id !== filterId)
        }
      })
    }

    const handleApplyFilters = () => {
      if (selectedFilters.length === 0) {
        setShowFiltered(false)
        return
      }

      const filtered = providers.filter((provider) => {
        // Check if provider has any of the selected subcategories
        const providerSubcategories = provider.allSubcategories || provider.subcategories || []

        return selectedFilters.some((selectedFilter) => {
          return providerSubcategories.some((subcategory) => {
            // Get string value from subcategory
            const subcategoryStr = getSubcategoryString(subcategory)

            // Normalize both strings for comparison
            const normalizedSubcategory = subcategoryStr.toLowerCase().trim()
            const normalizedFilter = selectedFilter.toLowerCase().trim()

            // Check for exact match or partial match
            return normalizedSubcategory.includes(normalizedFilter) || normalizedFilter.includes(normalizedSubcategory)
          })
        })
      })

      setFilteredProviders(filtered)
      setShowFiltered(true)

      toast({
        title: "Filters Applied",
        description: `Found ${filtered.length} businesses matching your criteria.`,
      })
    }

    const handleClearFilters = () => {
      setSelectedFilters([])
      setShowFiltered(false)
      setFilteredProviders([])
    }

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Filter by Services</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes(option.value)}
                onChange={(e) => handleFilterChange(option.value, e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleApplyFilters}
            disabled={selectedFilters.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            Apply Filters ({selectedFilters.length})
          </Button>

          {(selectedFilters.length > 0 || showFiltered) && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {showFiltered && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Active Filters:</strong> {selectedFilters.join(", ")}
              <br />
              <strong>Results:</strong> {filteredProviders.length} businesses found
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <CategoryLayout title="Tech & IT Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/computer-KPP5QpYvz9S9ORgJKtPMWS2q7tYAGS.png"
            alt="Tech and IT Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified technology professionals in your area. Browse services below or use filters to narrow your
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

      <TechServicesFilter />

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

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Loading tech providers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (showFiltered ? filteredProviders : providers).length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 002 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showFiltered
                  ? `No Tech Providers Match Your Filters`
                  : userZipCode
                    ? `No Tech Providers in ${userZipCode}`
                    : "No Tech Providers Yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {showFiltered
                  ? "Try adjusting your filter criteria or clearing filters to see more results."
                  : userZipCode
                    ? `We're building our network of technology professionals in the ${userZipCode} area.`
                    : "Be the first technology professional to join our platform and connect with clients in your area."}
              </p>
              {showFiltered ? (
                <Button variant="outline" onClick={() => setShowFiltered(false)}>
                  Show All Providers
                </Button>
              ) : (
                <Button className="bg-blue-600 hover:bg-blue-700">Register Your Business</Button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Tech & IT Service Providers ({(showFiltered ? filteredProviders : providers).length})
            </h2>
            <div className="grid gap-6">
              {(showFiltered ? filteredProviders : providers).map((provider) => (
                <Card key={provider.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      {/* Business Name and Description */}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {provider.displayName || provider.businessName}
                        </h3>
                        {provider.businessDescription && (
                          <p className="text-gray-600 text-sm leading-relaxed">{provider.businessDescription}</p>
                        )}
                      </div>

                      {/* Main content area with contact info, photos, and buttons */}
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Left side - Contact and Location Info */}
                        <div className="lg:w-64 space-y-2 flex-shrink-0">
                          {/* Location Display */}
                          <div className="flex items-center text-gray-600 text-sm">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{getLocation(provider)}</span>
                          </div>

                          {/* Phone Number Display */}
                          {(provider.adDesignData?.businessInfo?.phone || provider.displayPhone || provider.phone) && (
                            <div className="flex items-center text-gray-600 text-sm">
                              <Phone className="w-4 h-4 mr-1" />
                              <span>
                                {formatPhoneNumber(
                                  provider.adDesignData?.businessInfo?.phone ||
                                    provider.displayPhone ||
                                    provider.phone ||
                                    "",
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Middle - Photo Carousel (desktop only) */}
                        <div className="flex-1 flex justify-center">
                          <PhotoCarousel
                            photos={provider.photos || []}
                            businessName={provider.displayName || provider.businessName}
                          />
                        </div>

                        {/* Right side - Action Buttons */}
                        <div className="flex flex-col gap-2 lg:items-end lg:w-24 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReviews(provider)}
                            className="text-sm min-w-[100px]"
                          >
                            Ratings
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleOpenProfile(provider)}
                            className="text-sm min-w-[100px]"
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>

                      {/* Services */}
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {provider.services && Array.isArray(provider.services) ? (
                            provider.services.map((service, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                              >
                                {getSubcategoryString(service)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">No services listed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          businessId={selectedProvider.id}
          reviews={selectedProvider?.reviews || []}
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

      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />

      <Toaster />
    </CategoryLayout>
  )
}
