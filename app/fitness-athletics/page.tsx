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
import { MapPin, Phone, Loader2 } from "lucide-react"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useRef } from "react"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

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
    isNationwide?: boolean
    displayLocation?: string
    adDesignData?: {
      businessInfo?: {
        phone?: string
        city?: string
        state?: string
      }
      photoAlbum?: any[]
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
    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`  - ${business.displayName}: serves nationwide, matches=true`)
      return true
    }

    // Check if target zip code is in the service area (direct array)
    if (business.serviceArea && Array.isArray(business.serviceArea) && business.serviceArea.length > 0) {
      const matches = business.serviceArea.includes(zipCode)
      console.log(
        `  - ${business.displayName}: serviceArea=[${business.serviceArea.join(", ")}], userZip="${zipCode}", matches=${matches}`,
      )
      return matches
    }

    // Fall back to checking primary zip code
    const businessZip = business.zipCode || ""
    const matches = businessZip === zipCode
    console.log(`  - ${business.displayName}: primaryZip="${businessZip}", userZip="${zipCode}", matches=${matches}`)
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
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/baseball-WpgfS7MciTxGMJwNZTzlAFewS1DPX0.png"
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
                onChange={(e) => handleFilterChange(option.id, e.target.checked)}
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
                Showing {filteredProviders.length} of {allProviders.length} fitness & athletics providers
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-sm font-medium text-green-800">Showing businesses that service: {userZipCode}</p>
                <p className="text-sm text-green-700">Includes businesses with {userZipCode} in their service area</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("savedZipCode")
                setUserZipCode(null)
              }}
              className="text-green-700 border-green-300 hover:bg-green-50"
            >
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading fitness & athletics providers...</p>
        </div>
      ) : filteredProviders.length > 0 ? (
        <div className="space-y-6">
          {filteredProviders.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{business.displayName || business.name}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {business.displayLocation && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{business.displayLocation}</span>
                        </div>
                      )}
                      {(business.adDesignData?.businessInfo?.phone || business.displayPhone || business.phone) && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          <a
                            href={`tel:${business.adDesignData?.businessInfo?.phone || business.displayPhone || business.phone}`}
                            className="hover:text-primary"
                          >
                            {formatPhoneNumber(
                              business.adDesignData?.businessInfo?.phone || business.displayPhone || business.phone,
                            )}
                          </a>
                        </div>
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
                            Fitness Services
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Photo Carousel and Buttons Row - Updated for mobile centering */}
                  <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start">
                    {/* Photo Carousel - Centered on mobile */}
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

                    {/* Action Buttons - Centered on mobile */}
                    <div className="lg:w-32 flex flex-row lg:flex-col gap-2 lg:justify-start justify-center w-full lg:w-auto">
                      <Button
                        className="flex-1 lg:flex-none lg:w-full"
                        onClick={() => handleOpenReviews(business.displayName || business.name)}
                      >
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
      ) : (
        <div className="text-center py-12">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-emerald-800 mb-2">No Fitness & Athletics Providers Found</h3>
            <p className="text-emerald-700 mb-4">
              {userZipCode
                ? `We're building our network of fitness and athletics providers in the ${userZipCode} area.`
                : "We're building our network of fitness and athletics providers in your area."}
            </p>
            <div className="bg-white rounded border border-emerald-100 p-4">
              <p className="text-gray-700 font-medium">Are you a fitness professional?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to connect with clients who need your fitness and athletic services.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Fitness Business</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsOpen}
          onClose={() => setIsReviewsOpen(false)}
          providerName={selectedProvider || ""}
          businessId=""
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
