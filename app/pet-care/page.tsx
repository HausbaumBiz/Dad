"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Star } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"

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
  subcategories?: string[]
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
}

export default function PetCarePage() {
  // Add fetchIdRef for race condition prevention
  const fetchIdRef = useRef(0)

  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    rating: number
    reviews: number
  } | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

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
      const hasMatch = filters.some((filter) => business.subcategories!.includes(filter))
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

  // Fetch businesses with race condition prevention
  useEffect(() => {
    async function loadBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[PetCare] Starting fetch ${currentFetchId} for zip code:`, userZipCode)

      try {
        setLoading(true)
        const fetchedBusinesses = await getBusinessesForCategoryPage("/pet-care")

        // Only update if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[PetCare] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[PetCare] Fetch ${currentFetchId} got ${fetchedBusinesses.length} businesses`)

        // Filter businesses by zip code if userZipCode is available
        if (userZipCode) {
          const originalCount = fetchedBusinesses.length
          const filteredBusinesses = fetchedBusinesses.filter((business: Business) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[PetCare] Filtered from ${originalCount} to ${filteredBusinesses.length} businesses for zip ${userZipCode}`,
          )
          setBusinesses(filteredBusinesses)
          setAllBusinesses(filteredBusinesses)
          setFilteredBusinesses(filteredBusinesses)
        } else {
          setBusinesses(fetchedBusinesses)
          setAllBusinesses(fetchedBusinesses)
          setFilteredBusinesses(fetchedBusinesses)
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
      id: Number.parseInt(business.id || "0"),
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
            <Button variant="outline" onClick={clearFilters} className="min-w-[120px]">
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
      ) : filteredBusinesses.length > 0 ? (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Pet Care Providers ({filteredBusinesses.length})</h2>
          <div className="grid gap-6">
            {filteredBusinesses.map((business: Business) => (
              <div key={business.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex flex-col space-y-4">
                  {/* Business Name and Description */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {business.displayName || business.businessName || "Pet Care Provider"}
                    </h3>
                    {business.businessDescription && (
                      <p className="text-gray-600 text-sm leading-relaxed">{business.businessDescription}</p>
                    )}
                  </div>

                  {/* Contact and Location Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      {/* Phone */}
                      {business.displayPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <a
                            href={`tel:${business.displayPhone}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {business.displayPhone}
                          </a>
                        </div>
                      )}

                      {/* Location */}
                      {business.displayLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700 text-sm">{business.displayLocation}</span>
                        </div>
                      )}

                      {/* Service Area Indicator */}
                      {userZipCode && (
                        <div className="text-xs text-green-600 mt-1">
                          {business.isNationwide ? (
                            <span>✓ Serves nationwide</span>
                          ) : business.serviceArea?.includes(userZipCode) ? (
                            <span>✓ Serves {userZipCode} area</span>
                          ) : business.zipCode === userZipCode ? (
                            <span>✓ Located in {userZipCode}</span>
                          ) : null}
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (business.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {business.rating?.toFixed(1) || "0.0"} ({business.reviewCount || 0} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReviews(business)}
                        className="text-sm"
                      >
                        Reviews
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewProfile(business)}
                        className="text-sm"
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>

                  {/* Subcategories/Specialties */}
                  {business.subcategories && business.subcategories.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Specialties:</h4>
                      <div className="flex flex-wrap gap-2">
                        {business.subcategories.map((subcategory: string, index: number) => (
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
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Pet Care Providers Found</h3>
          <p className="text-gray-600">
            {userZipCode
              ? `No pet care providers found that serve the ${userZipCode} area.`
              : "Enter your zip code to find pet care providers in your area."}
          </p>
        </div>
      )}

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name || ""}
        businessId={selectedProvider?.id.toString() || ""}
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
