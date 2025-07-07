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
import { Loader2, Phone, ChevronLeft, ChevronRight, MapPin } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { Checkbox } from "@/components/ui/checkbox"
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

// Add fetchIdRef for race condition prevention

// Enhanced Business interface
interface Business {
  id: string
  displayName?: string
  businessName?: string
  displayLocation?: string
  city?: string
  state?: string
  zipCode?: string
  displayPhone?: string
  phone?: string
  rating?: number
  reviews?: number
  allSubcategories?: any[] // Changed from string[] to any[]
  subcategory?: string
  serviceArea?: string[]
  isNationwide?: boolean
  businessDescription?: string
}

// Helper function to check if business serves the zip code
const businessServesZipCode = (business: Business, zipCode: string): boolean => {
  console.log(`Checking if business ${business.displayName || business.businessName} serves ${zipCode}:`, {
    isNationwide: business.isNationwide,
    serviceArea: business.serviceArea,
    primaryZip: business.zipCode,
  })

  // Check if business serves nationwide
  if (business.isNationwide) {
    console.log(`✓ Business serves nationwide`)
    return true
  }

  // Check if zip code is in service area
  if (business.serviceArea && Array.isArray(business.serviceArea)) {
    const serves = business.serviceArea.includes(zipCode)
    console.log(`${serves ? "✓" : "✗"} Service area check: ${business.serviceArea.join(", ")}`)
    return serves
  }

  // Fallback to primary zip code
  const matches = business.zipCode === zipCode
  console.log(`${matches ? "✓" : "✗"} Primary zip code check: ${business.zipCode}`)
  return matches
}

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(phoneNumberString: string | undefined | null): string {
  if (!phoneNumberString) return "No phone provided"

  // Strip all non-numeric characters
  const cleaned = phoneNumberString.replace(/\D/g, "")

  // Check if it's a valid 10-digit number
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`
  }

  // Return original if not 10 digits
  return phoneNumberString
}

// Photo Carousel Component - displays exactly 5 photos in landscape format
interface PhotoCarouselProps {
  photos: string[]
  businessName: string
}

function PhotoCarousel({ photos, businessName }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const photosPerView = 5
  const maxIndex = Math.max(0, photos.length - photosPerView)

  const nextPhotos = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex))
  }

  const prevPhotos = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  // Always show exactly 5 slots - smaller size to fit with buttons
  const visiblePhotos = photos.slice(currentIndex, currentIndex + photosPerView)
  const emptySlots = Math.max(0, photosPerView - visiblePhotos.length)

  return (
    <div className="hidden lg:block w-full">
      <div className="relative group w-full">
        <div className="flex gap-1.5 justify-center w-full">
          {/* Show actual photos - smaller size */}
          {visiblePhotos.map((photo, index) => (
            <div key={currentIndex + index} className="w-40 h-30 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={photo || "/placeholder.svg"}
                alt={`${businessName} photo ${currentIndex + index + 1}`}
                width={160}
                height={120}
                className="w-full h-full object-cover"
                sizes="160px"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = "/placeholder.svg"
                }}
              />
            </div>
          ))}

          {/* Fill empty slots to always show 5 total - smaller size */}
          {Array.from({ length: emptySlots }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-40 h-30 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex-shrink-0 flex items-center justify-center"
            >
              <span className="text-gray-400 text-xs">No Photo</span>
            </div>
          ))}
        </div>

        {/* Navigation arrows - only show if there are more than 5 photos */}
        {photos.length > photosPerView && (
          <>
            <button
              onClick={prevPhotos}
              disabled={currentIndex === 0}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed z-10"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={nextPhotos}
              disabled={currentIndex >= maxIndex}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed z-10"
            >
              <ChevronRight size={14} />
            </button>
          </>
        )}

        {/* Photo counter */}
        {photos.length > 0 && (
          <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
            {Math.min(currentIndex + Math.min(visiblePhotos.length, photosPerView), photos.length)} of {photos.length}
          </div>
        )}
      </div>

      {/* Pagination dots - only show if there are more than 5 photos */}
      {photos.length > photosPerView && (
        <div className="flex justify-center mt-1 space-x-1">
          {Array.from({ length: Math.ceil(photos.length / photosPerView) }).map((_, index) => {
            const pageStartIndex = index * photosPerView
            const isActive = currentIndex >= pageStartIndex && currentIndex < pageStartIndex + photosPerView
            return (
              <button
                key={index}
                onClick={() => setCurrentIndex(pageStartIndex)}
                className={`w-1 h-1 rounded-full transition-colors ${isActive ? "bg-blue-500" : "bg-gray-300"}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function EducationTutoringPage() {
  const { toast } = useToast()
  const filterOptions = [
    { id: "language1", label: "Spanish", value: "Spanish" },
    { id: "language2", label: "French", value: "French" },
    { id: "language3", label: "Chinese", value: "Chinese" },
    { id: "language4", label: "American Sign Language", value: "American Sign Language" },
    { id: "language5", label: "English as a Second Language", value: "English as a Second Language" },
    { id: "language6", label: "Other Language", value: "Other Language" },
    { id: "language7", label: "Math - Elementary", value: "Math - Elementary" },
    { id: "language8", label: "Math - High School", value: "Math - High School" },
    { id: "language9", label: "Reading Tutors (Adult and Children)", value: "Reading Tutors (Adult and Children)" },
    { id: "language10", label: "Test Prep", value: "Test Prep" },
    { id: "language11", label: "Other Subjects", value: "Other Subjects" },
  ]

  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  // Filter State Variables
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[Education] Starting fetch ${currentFetchId} for zip code:`, userZipCode)

      setIsLoading(true)
      try {
        let result = await getBusinessesForCategoryPage("/education-tutoring")

        // Only update if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Education] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Education] Fetch ${currentFetchId} completed, got ${result.length} businesses`)

        // Filter by zip code if available
        if (userZipCode) {
          const originalCount = result.length
          result = result.filter((business: Business) => businessServesZipCode(business, userZipCode))
          console.log(
            `[Education] Filtered from ${originalCount} to ${result.length} businesses for zip ${userZipCode}`,
          )
        }

        setBusinesses(result)
        setAllBusinesses(result)
        setFilteredBusinesses(result)
      } catch (error) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Education] Fetch ${currentFetchId} error:`, error)
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

    fetchBusinesses()
  }, [toast, userZipCode])

  // Load photos for all businesses after they're loaded
  useEffect(() => {
    if (filteredBusinesses.length > 0) {
      filteredBusinesses.forEach((business) => {
        loadPhotosForBusiness(business.id, business.displayName || business.businessName || "Education Provider")
      })
    }
  }, [filteredBusinesses])

  // Function to check if business has exact subcategory match
  const hasExactSubcategoryMatch = (business: Business, subcategory: string): boolean => {
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      return business.allSubcategories.some(
        (sub) => getSubcategoryString(sub).toLowerCase() === subcategory.toLowerCase(),
      )
    }
    return false
  }

  // Filter handlers
  const handleFilterChange = (subcategory: string) => {
    setSelectedFilters((prev) =>
      prev.includes(subcategory) ? prev.filter((f) => f !== subcategory) : [...prev, subcategory],
    )
  }

  const handleApplyFilters = () => {
    setAppliedFilters([...selectedFilters])

    let filtered = [...allBusinesses]
    if (selectedFilters.length > 0) {
      filtered = allBusinesses.filter((business) =>
        selectedFilters.every((filter) => hasExactSubcategoryMatch(business, filter)),
      )
    }

    setFilteredBusinesses(filtered)

    toast({
      title: "Filters Applied",
      description: `Showing businesses with ${selectedFilters.length} selected subject${selectedFilters.length !== 1 ? "s" : ""}`,
    })
  }

  const handleClearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses([...allBusinesses])

    toast({
      title: "Filters Cleared",
      description: "Showing all education & tutoring businesses",
    })
  }

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  // Function to load photos for a specific business
  const loadPhotosForBusiness = async (businessId: string, businessName: string) => {
    if (businessPhotos[businessId] || loadingPhotos[businessId]) {
      return // Already loaded or loading
    }

    setLoadingPhotos((prev) => ({ ...prev, [businessId]: true }))

    try {
      console.log(`Loading photos for business: ${businessName}`, { id: businessId })
      const photos = await loadBusinessPhotos(businessId)
      console.log(`Loaded ${photos.length} photos for business ${businessId}`)

      setBusinessPhotos((prev) => ({ ...prev, [businessId]: photos }))
    } catch (error) {
      console.error(`Error loading photos for business ${businessId}:`, error)
      setBusinessPhotos((prev) => ({ ...prev, [businessId]: [] }))
    } finally {
      setLoadingPhotos((prev) => ({ ...prev, [businessId]: false }))
    }
  }

  return (
    <CategoryLayout title="Language Lessons & School Subject Tutoring" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/tutor-oUQE3gdqYse3GcFicrOH9B9CAeaRVb.png"
            alt="Education and Tutoring"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified tutors and language instructors in your area. Browse options below or use filters to narrow
            your search.
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

      {/* Replace CategoryFilter with checkbox interface */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Filter by Subject</h4>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} disabled={selectedFilters.length === 0} size="sm">
              Apply Filters {selectedFilters.length > 0 && `(${selectedFilters.length})`}
            </Button>
            {appliedFilters.length > 0 && (
              <Button onClick={handleClearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filterOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center space-x-2 bg-gray-50 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Checkbox
                id={option.id}
                checked={selectedFilters.includes(option.value)}
                onCheckedChange={() => handleFilterChange(option.value)}
              />
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {appliedFilters.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">Active Filters: {appliedFilters.join(", ")}</p>
        </div>
      )}

      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Showing businesses that serve zip code:</span> {userZipCode}
            <span className="text-xs block mt-1">Includes businesses with {userZipCode} in their service area</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem("savedZipCode")
              setUserZipCode(null)
            }}
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            Clear Filter
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading businesses...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  {/* Business Name and Description */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {business.displayName || business.businessName}
                    </h3>
                    {business.businessDescription && (
                      <p className="text-gray-600 text-sm leading-relaxed">{business.businessDescription}</p>
                    )}
                  </div>

                  {/* Main content area with contact info, photos, and buttons */}
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Left side - Contact and Location Info */}
                    <div className="lg:w-56 space-y-2 flex-shrink-0">
                      {/* Phone */}
                      {(business.displayPhone || business.phone) && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <a
                            href={`tel:${business.displayPhone || business.phone}`}
                            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                          >
                            {formatPhoneNumber(business.displayPhone || business.phone)}
                          </a>
                        </div>
                      )}

                      {/* Location */}
                      {business.displayLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-gray-700 text-sm">{business.displayLocation}</span>
                        </div>
                      )}

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

                    {/* Middle - Photo Carousel (desktop only) - Now has more space */}
                    <div className="flex-1 flex justify-center">
                      {loadingPhotos[business.id] ? (
                        <div className="hidden lg:flex items-center justify-center w-full h-24 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span className="text-xs">Loading photos...</span>
                          </div>
                        </div>
                      ) : (
                        <PhotoCarousel
                          photos={businessPhotos[business.id] || []}
                          businessName={business.displayName || business.businessName || "Education Provider"}
                        />
                      )}
                    </div>

                    {/* Right side - Action Buttons */}
                    <div className="flex flex-col gap-2 lg:items-end lg:w-28 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReviews(business)}
                        className="text-xs min-w-[110px] h-8"
                      >
                        Reviews
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleOpenProfile(business)}
                        className="text-xs min-w-[110px] h-8"
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>

                  {/* Subcategories/Services */}
                  {business.allSubcategories && business.allSubcategories.length > 0 && (
                    <div className="w-full">
                      <div className="lg:w-64">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Services:</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full">
                        {business.allSubcategories.map((service: any, idx: number) => (
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-purple-800 mb-2">No Education & Tutoring Providers Found</h3>
            <p className="text-purple-700 mb-4">
              {userZipCode
                ? `We're building our network of qualified tutors and language instructors that serve the ${userZipCode} area.`
                : "We're building our network of qualified tutors and language instructors in your area."}
            </p>
            <div className="bg-white rounded border border-purple-100 p-4">
              <p className="text-gray-700 font-medium">Are you a tutor or language instructor?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to connect with students in your area who need your expertise.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Tutoring Business</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.displayName || selectedProvider.businessName || selectedProvider.name}
          businessId={selectedProvider.id}
          reviews={[]}
        />
      )}

      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
