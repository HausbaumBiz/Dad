"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone, MapPin } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { Card, CardContent } from "@/components/ui/card"

// Enhanced Business interface
interface Business {
  id: string
  displayName?: string
  businessName?: string
  businessDescription?: string
  displayLocation?: string
  displayPhone?: string
  rating?: number
  reviewCount?: number
  subcategories?: any[]
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
  photos?: string[]
}

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

export default function PetCarePage() {
  // Add fetchIdRef for race condition prevention
  const fetchIdRef = useRef(0)

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: string // Change from number to string
    name: string
    rating: number
    reviews: number
  } | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [businessPhotos, setBusinessPhotos] = useState<{ [businessId: string]: string[] }>({})

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

  const filterOptions = [
    { id: "pet1", label: "Veterinarians", value: "Veterinarians" },
    { id: "pet2", label: "Pet Hospitals", value: "Pet Hospitals" },
    { id: "pet3", label: "Dog Fencing/Invisible Fence", value: "Dog Fencing/Invisible Fence" },
    { id: "pet4", label: "Pet Groomers", value: "Pet Groomers" },
    { id: "pet5", label: "Pet Trainers", value: "Pet Trainers" },
    { id: "pet6", label: "Pet Walkers", value: "Pet Walkers" },
    { id: "pet7", label: "Pet Sitters", value: "Pet Sitters" },
    { id: "pet8", label: "Pet Boarders", value: "Pet Boarders" },
    { id: "pet9", label: "Pet Breeders", value: "Pet Breeders" },
    { id: "pet10", label: "Pet Shops", value: "Pet Shops" },
    { id: "pet11", label: "Pet Rescues", value: "Pet Rescues" },
    { id: "pet12", label: "Aquariums/Pet Enclosures", value: "Aquariums/Pet Enclosures" },
    { id: "pet13", label: "Pet Poop Pickup", value: "Pet Poop Pickup" },
    { id: "pet14", label: "Other Pet Care", value: "Other Pet Care" },
  ]

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

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

  // Helper function for exact subcategory matching
  const hasExactSubcategoryMatch = (business: Business, filters: string[]): boolean => {
    if (filters.length === 0) return true

    console.log(`Checking business ${business.displayName || business.businessName} subcategories:`, {
      subcategories: business.subcategories,
      filters,
    })

    // Check subcategories array
    if (business.subcategories && Array.isArray(business.subcategories)) {
      const hasMatch = filters.some((filter) =>
        business.subcategories!.some((subcat) => getSubcategoryString(subcat) === filter),
      )
      if (hasMatch) return true
    }

    return false
  }

  // Filter handlers
  const handleFilterChange = (filterValue: string, checked: boolean) => {
    setSelectedFilters((prev) => (checked ? [...prev, filterValue] : prev.filter((f) => f !== filterValue)))
  }

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All businesses:", allBusinesses)

    if (selectedFilters.length === 0) {
      setFilteredBusinesses(allBusinesses)
      setAppliedFilters([])
    } else {
      const filtered = allBusinesses.filter((business) => hasExactSubcategoryMatch(business, selectedFilters))
      console.log("Filtered results:", filtered)
      setFilteredBusinesses(filtered)
      setAppliedFilters([...selectedFilters])
    }
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses(allBusinesses)
  }

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

  // Fetch businesses with race condition prevention and enhanced error handling
  useEffect(() => {
    async function loadBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[PetCare] Starting fetch ${currentFetchId} for zip code:`, userZipCode)

      try {
        setLoading(true)
        const fetchedBusinesses = await getBusinessesForCategoryPage("/pet-care")

        // Load photos for each business using public Cloudflare URLs with enhanced error handling
        const businessesWithPhotos = await Promise.all(
          fetchedBusinesses.map(async (business: Business) => {
            try {
              const photos = await loadBusinessPhotos(business.id)
              return { ...business, photos }
            } catch (photoError) {
              console.error(`[PetCare] Error loading photos for business ${business.id}:`, photoError)
              return { ...business, photos: [] }
            }
          }),
        )

        // Only update if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[PetCare] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[PetCare] Fetch ${currentFetchId} got ${fetchedBusinesses.length} businesses`)

        // Filter businesses by zip code if userZipCode is available
        if (userZipCode) {
          const originalCount = businessesWithPhotos.length
          const filteredBusinesses = businessesWithPhotos.filter((business: Business) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[PetCare] Filtered from ${originalCount} to ${filteredBusinesses.length} businesses for zip ${userZipCode}`,
          )
          setBusinesses(filteredBusinesses)
          setAllBusinesses(filteredBusinesses)
          setFilteredBusinesses(filteredBusinesses)
        } else {
          setBusinesses(businessesWithPhotos)
          setAllBusinesses(businessesWithPhotos)
          setFilteredBusinesses(businessesWithPhotos)
        }
      } catch (error) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[PetCare] Fetch ${currentFetchId} error:`, error)
        }
      } finally {
        // Only update loading if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    loadBusinesses()
  }, [userZipCode])

  const handleViewReviews = (business: Business) => {
    setSelectedProvider({
      id: business.id || "0", // Keep as string, don't parse as number
      name: business.displayName || business.businessName || "Pet Care Provider",
      rating: business.rating || 0,
      reviews: business.reviewCount || 0,
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: Business) => {
    console.log("Opening profile for business:", business.id, business.businessName)
    setSelectedBusinessId(business.id || "")
    setSelectedBusinessName(business.displayName || business.businessName || "Pet Care Provider")
    setIsProfileDialogOpen(true)
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
            Find qualified pet care professionals in your area. Browse services below or use filters to narrow your
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

      {/* Zip Code Status Indicator */}
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

      {loading ? (
        <div className="mt-8 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pet care providers...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBusinesses.map((business: Business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {business.displayName || business.businessName || "Pet Care Provider"}
                    </h3>
                    {business.businessDescription && (
                      <p className="text-gray-600 text-sm leading-relaxed">{business.businessDescription}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {business.displayPhone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          <a href={`tel:${business.displayPhone}`} className="hover:text-primary">
                            {business.displayPhone}
                          </a>
                        </div>
                      )}
                      {business.displayLocation && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{business.displayLocation}</span>
                        </div>
                      )}
                    </div>

                    {/* Service Area Indicator */}
                    {userZipCode && (
                      <div className="text-xs text-green-600">
                        {business.isNationwide ? (
                          <span>✓ Serves nationwide</span>
                        ) : business.serviceArea?.includes(userZipCode) ? (
                          <span>✓ Serves {userZipCode} and surrounding areas</span>
                        ) : business.zipCode === userZipCode ? (
                          <span>✓ Located in {userZipCode}</span>
                        ) : null}
                      </div>
                    )}

                    {/* Services */}
                    {business.subcategories && business.subcategories.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Services:</p>
                        <div className="flex flex-wrap gap-1">
                          {business.subcategories.map((subcategory: any, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(subcategory)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo Carousel and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4 items-center lg:items-start">
                    {/* Photo Carousel */}
                    <div className="flex-1 w-full flex justify-center lg:justify-start">
                      <div className="w-full max-w-md lg:max-w-none">
                        <PhotoCarousel
                          businessId={business.id}
                          photos={business.photos || []}
                          onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                          showMultiple={true}
                          photosPerView={5}
                          size="medium"
                          className="w-full"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="lg:w-32 flex flex-row lg:flex-col gap-2 justify-center lg:justify-start w-full lg:w-auto">
                      <Button className="flex-1 lg:flex-none lg:w-full" onClick={() => handleViewReviews(business)}>
                        Ratings
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 lg:flex-none lg:w-full bg-transparent"
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
      )}

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name || ""}
        businessId={selectedProvider?.id || ""} // Remove .toString() since it's already a string
        reviews={[]}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusinessId}
        businessName={selectedBusinessName}
      />

      <Toaster />
    </CategoryLayout>
  )
}
