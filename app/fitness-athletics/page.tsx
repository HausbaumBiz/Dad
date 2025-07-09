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
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"

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

// Photo Carousel Component
const PhotoCarousel = ({ photos, businessName }: { photos: string[]; businessName: string }) => {
  const [currentPage, setCurrentPage] = useState(0)
  const photosPerPage = 5
  const totalPages = Math.ceil(photos.length / photosPerPage)

  const handlePrevious = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0))
  }

  const currentPhotos = photos.slice(currentPage * photosPerPage, (currentPage + 1) * photosPerPage)

  // Fill empty slots to always show 5 slots
  const displayPhotos = [...currentPhotos]
  while (displayPhotos.length < photosPerPage) {
    displayPhotos.push(null)
  }

  return (
    <div className="relative">
      {/* Navigation arrows */}
      {photos.length > photosPerPage && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous photos"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next photos"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </>
      )}

      {/* Photo counter */}
      {photos.length > photosPerPage && (
        <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded z-10">
          {currentPage * photosPerPage + 1}-{Math.min((currentPage + 1) * photosPerPage, photos.length)} of{" "}
          {photos.length}
        </div>
      )}

      {/* Photos grid */}
      <div className="flex gap-2">
        {displayPhotos.map((photo, index) => (
          <div key={index} className="w-40 h-30 flex-shrink-0">
            {photo ? (
              <Image
                src={photo || "/placeholder.svg"}
                alt={`${businessName} photo ${currentPage * photosPerPage + index + 1}`}
                width={160}
                height={120}
                className="w-full h-full object-cover rounded-lg"
                sizes="160px"
              />
            ) : (
              <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <Camera className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      {photos.length > photosPerPage && totalPages > 1 && (
        <div className="flex justify-center mt-2 gap-1">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                index === currentPage ? "bg-primary" : "bg-gray-300"
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function FitnessAthleticsPage() {
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

  // State for photos
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  const mockReviews = {
    "Elite Fitness Center": [
      {
        id: 1,
        username: "Sarah M.",
        rating: 5,
        comment:
          "Amazing facility with top-notch equipment and knowledgeable trainers. The group classes are fantastic!",
        date: "2023-12-10",
      },
      {
        id: 2,
        username: "Mike R.",
        rating: 4,
        comment: "Great gym with a welcoming atmosphere. The personal training sessions have been very helpful.",
        date: "2023-11-15",
      },
      {
        id: 3,
        username: "Jessica L.",
        rating: 5,
        comment:
          "Love the variety of classes offered. The instructors are motivating and the facility is always clean.",
        date: "2023-10-20",
      },
    ],
    "Athletic Performance Training": [
      {
        id: 1,
        username: "David K.",
        rating: 5,
        comment:
          "Excellent sports-specific training programs. My performance has improved significantly since joining.",
        date: "2023-12-05",
      },
      {
        id: 2,
        username: "Amanda T.",
        rating: 4,
        comment:
          "Professional trainers who really understand athletic development. Highly recommend for serious athletes.",
        date: "2023-11-08",
      },
      {
        id: 3,
        username: "Chris B.",
        rating: 5,
        comment:
          "The conditioning programs are intense but effective. Great for taking your fitness to the next level.",
        date: "2023-10-12",
      },
    ],
    "Yoga & Wellness Studio": [
      {
        id: 1,
        username: "Emily W.",
        rating: 5,
        comment:
          "Peaceful environment with experienced instructors. The yoga classes have improved my flexibility and mindfulness.",
        date: "2023-12-15",
      },
      {
        id: 2,
        username: "Robert H.",
        rating: 4,
        comment: "Great variety of yoga styles offered. The meditation sessions are particularly beneficial.",
        date: "2023-11-20",
      },
      {
        id: 3,
        username: "Lisa P.",
        rating: 5,
        comment:
          "Welcoming community and excellent instruction. The studio has a calming atmosphere perfect for practice.",
        date: "2023-10-25",
      },
    ],
    "CrossFit Box": [
      {
        id: 1,
        username: "Jake S.",
        rating: 5,
        comment: "Challenging workouts with supportive community. The coaches provide excellent form guidance.",
        date: "2023-12-08",
      },
      {
        id: 2,
        username: "Maria G.",
        rating: 4,
        comment: "High-intensity workouts that deliver results. The group atmosphere keeps me motivated.",
        date: "2023-11-12",
      },
      {
        id: 3,
        username: "Tom A.",
        rating: 5,
        comment: "Best CrossFit gym in the area. The programming is well-designed and the community is amazing.",
        date: "2023-10-18",
      },
    ],
  }

  const handleOpenReviews = (providerName: string) => {
    setSelectedProvider(providerName)
    setIsReviewsOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedBusinessProfile({
      id: provider.id,
      name: provider.displayName || provider.name,
    })
    setIsProfileDialogOpen(true)
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
    { id: "fitness1", label: "Personal Training", value: "Personal Training" },
    { id: "fitness2", label: "Group Fitness Classes", value: "Group Fitness Classes" },
    { id: "fitness3", label: "Yoga Studios", value: "Yoga Studios" },
    { id: "fitness4", label: "CrossFit", value: "CrossFit" },
    { id: "fitness5", label: "Martial Arts", value: "Martial Arts" },
    { id: "fitness6", label: "Dance Studios", value: "Dance Studios" },
    { id: "fitness7", label: "Swimming Instruction", value: "Swimming Instruction" },
    { id: "fitness8", label: "Sports Training", value: "Sports Training" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Remove the mock providers state and replace with real data fetching
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Add after existing state declarations:
  const fetchIdRef = useRef(0)

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
    photoAlbum?: any[]
    media?: {
      photoAlbum?: any[]
    }
    adDesign?: {
      photoAlbum?: any[]
    }
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

  // Function to load photos for businesses
  const loadBusinessPhotos = async (businesses: Business[]) => {
    console.log("[Fitness Athletics] Loading photos for businesses:", businesses.length)

    const photoPromises = businesses.map(async (business) => {
      try {
        // Get photos from multiple possible sources
        const photoSources = [
          ...(business.photoAlbum || []),
          ...(business.media?.photoAlbum || []),
          ...(business.adDesign?.photoAlbum || []),
        ]

        console.log(
          `[Fitness Athletics] Business ${business.displayName || business.name} photo sources:`,
          photoSources,
        )

        if (photoSources.length === 0) {
          return { businessId: business.id, photos: [] }
        }

        // Convert photo data to URLs
        const photoUrls = await Promise.all(
          photoSources.map(async (photo) => {
            try {
              // Handle different photo formats
              let photoId = null
              if (typeof photo === "string") {
                photoId = photo
              } else if (photo && typeof photo === "object") {
                photoId = photo.id || photo.imageId || photo.url
              }

              if (!photoId) {
                console.log(`[Fitness Athletics] No valid photo ID found for photo:`, photo)
                return null
              }

              // If it's already a URL, use it
              if (typeof photoId === "string" && photoId.startsWith("http")) {
                return photoId
              }

              // Generate Cloudflare URL
              const url = getCloudflareImageUrl(photoId, "public")
              console.log(`[Fitness Athletics] Generated URL for photo ${photoId}:`, url)
              return url
            } catch (error) {
              console.error(`[Fitness Athletics] Error processing photo:`, photo, error)
              return null
            }
          }),
        )

        // Filter out null URLs
        const validUrls = photoUrls.filter((url): url is string => url !== null)
        console.log(`[Fitness Athletics] Valid URLs for ${business.displayName || business.name}:`, validUrls)

        return { businessId: business.id, photos: validUrls }
      } catch (error) {
        console.error(`[Fitness Athletics] Error loading photos for business ${business.id}:`, error)
        return { businessId: business.id, photos: [] }
      }
    })

    const results = await Promise.all(photoPromises)
    const photosMap = results.reduce(
      (acc, { businessId, photos }) => {
        acc[businessId] = photos
        return acc
      },
      {} as Record<string, string[]>,
    )

    console.log("[Fitness Athletics] Final photos map:", photosMap)
    setBusinessPhotos(photosMap)
  }

  // Replace the useEffect:
  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current

      try {
        setLoading(true)
        setError(null)

        console.log(`[Fitness Athletics] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

        const businesses = await getBusinessesForCategoryPage("/fitness-athletics")

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Fitness Athletics] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Fitness Athletics] Fetch ${currentFetchId} completed, got ${businesses.length} businesses`)
        console.log("Sample business data:", businesses[0]) // Debug log

        // Filter by zip code if available
        let filteredBusinesses = businesses
        if (userZipCode) {
          console.log(`[Fitness Athletics] Filtering by zip code: ${userZipCode}`)
          filteredBusinesses = businesses.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Fitness Athletics] Business ${business.displayName || business.name} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              {
                serviceArea: business.serviceArea,
                primaryZip: business.zipCode,
              },
            )
            return serves
          })
          console.log(`[Fitness Athletics] After filtering: ${filteredBusinesses.length} businesses`)
        }

        // Use businesses as-is without adding default subcategories
        setAllProviders(filteredBusinesses)
        setFilteredProviders(filteredBusinesses)

        // Load photos for businesses
        await loadBusinessPhotos(filteredBusinesses)
      } catch (err) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Fitness Athletics] Error in fetch ${currentFetchId}:`, err)
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

  const handleOpenReviewsOld = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Fitness & Athletics" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/fitness-athletics-hero-YGJCy1KrgYFG9a6r1XgV5abefXkzCB.png"
            alt="Fitness & Athletics"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find fitness centers, personal trainers, and athletic programs in your area. Browse services below or use
            filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read reviews from other members</li>
              <li>View facility videos and training sessions</li>
              <li>Access exclusive membership deals and promotions</li>
              <li>Discover job openings at top fitness facilities</li>
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
              <span className="font-medium">Showing fitness & athletics for zip code:</span> {userZipCode}
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
          <p className="mt-2 text-gray-600">Loading fitness & athletics businesses...</p>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {appliedFilters.length > 0
                ? "No Fitness & Athletics Businesses Match Your Filters"
                : userZipCode
                  ? `No Fitness & Athletics Businesses in ${userZipCode} Area`
                  : "No Fitness & Athletics Businesses Yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {appliedFilters.length > 0
                ? `No businesses found matching: ${appliedFilters.join(", ")}. Try adjusting your filters.`
                : userZipCode
                  ? `We're building our network of fitness and athletics businesses in the ${userZipCode} area.`
                  : "Be the first fitness business to join our platform and connect with clients in your area."}
            </p>
            {appliedFilters.length > 0 ? (
              <Button onClick={clearFilters} className="bg-indigo-600 hover:bg-indigo-700">
                Clear Filters
              </Button>
            ) : (
              <Button className="bg-indigo-600 hover:bg-indigo-700">Register Your Business</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow group">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Left: Business Info */}
                  <div className="lg:w-56 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {provider.displayName || provider.name}
                    </h3>

                    {/* Service Area Indicator */}
                    {provider.serviceArea && provider.serviceArea.length > 0 && (
                      <div className="mb-2">
                        {provider.serviceArea.some((area) => area.toLowerCase().includes("nationwide")) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Serves Nationwide
                          </span>
                        ) : userZipCode && provider.serviceArea.includes(userZipCode) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Serves {userZipCode}
                          </span>
                        ) : null}
                      </div>
                    )}

                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      Professional fitness and athletics services to help you reach your health and performance goals.
                    </p>

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

                    {/* Specialties */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {provider.allSubcategories && provider.allSubcategories.length > 0 ? (
                          provider.allSubcategories.slice(0, 3).map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(service)}
                            </span>
                          ))
                        ) : provider.subcategories && provider.subcategories.length > 0 ? (
                          provider.subcategories.slice(0, 3).map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(service)}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Fitness Services
                          </span>
                        )}
                        {((provider.allSubcategories && provider.allSubcategories.length > 3) ||
                          (provider.subcategories && provider.subcategories.length > 3)) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{(provider.allSubcategories || provider.subcategories).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Center: Photo Carousel */}
                  <div className="hidden lg:block flex-1">
                    {businessPhotos[provider.id] && businessPhotos[provider.id].length > 0 ? (
                      <PhotoCarousel
                        photos={businessPhotos[provider.id]}
                        businessName={provider.displayName || provider.name}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-30 bg-gray-100 rounded-lg">
                        <div className="text-center">
                          <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <span className="text-gray-500 text-sm">No photos available</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="lg:w-28 flex flex-col justify-start space-y-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs px-3 py-1 h-7 min-w-[110px] bg-transparent"
                      onClick={() => handleOpenReviews(provider.displayName || provider.name)}
                    >
                      Reviews
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs px-3 py-1 h-7 min-w-[110px]"
                      onClick={() => handleOpenProfile(provider)}
                    >
                      View Profile
                    </Button>
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
          reviews={selectedProvider ? mockReviews[selectedProvider] || [] : []}
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

      <Toaster />
    </CategoryLayout>
  )
}
