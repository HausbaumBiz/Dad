"use client"

import { CategoryLayout } from "@/components/category-layout"
import type { FilterOption } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Phone, MapPin, Loader2 } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { Checkbox } from "@/components/ui/checkbox"

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
  displayLocation?: string
  displayPhone?: string
  phone?: string
  rating?: number
  reviews?: number
  subcategories?: any[] // Changed from string[] to any[]
  businessDescription?: string
  adDesignData?: {
    businessInfo?: {
      phone?: string
      city?: string
      state?: string
    }
  }
  serviceArea?: string[]
  isNationwide?: boolean
}

export default function MusicLessonsPage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "music1", label: "Piano Lessons", value: "Piano Lessons" },
    { id: "music2", label: "Guitar Lessons", value: "Guitar Lessons" },
    { id: "music3", label: "Violin Lessons", value: "Violin Lessons" },
    { id: "music4", label: "Cello Lessons", value: "Cello Lessons" },
    { id: "music5", label: "Trumpet Lessons", value: "Trumpet Lessons" },
    { id: "music6", label: "Other Instrument Lessons", value: "Other Instrument Lessons" },
    { id: "music7", label: "Instrument Repair", value: "Instrument Repair" },
    { id: "music8", label: "Used and New Instruments for Sale", value: "Used and New Instruments for Sale" },
    { id: "music9", label: "Other Music", value: "Other Music" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    reviews: any[]
  } | null>(null)

  // State for business profile dialog
  const [isBusinessProfileOpen, setIsBusinessProfileOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")

  // State for providers
  const [providers, setProviders] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state management
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState<Business[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Business[]>([])

  // Helper function to check if business serves a zip code
  const businessServesZipCode = (business: Business, zipCode: string): boolean => {
    console.log(
      `[Music Lessons] Checking if business ${business.displayName || business.businessName} serves ${zipCode}:`,
      {
        isNationwide: business.isNationwide,
        serviceArea: business.serviceArea,
        primaryZip: business.zipCode,
      },
    )

    // Check if business serves nationwide
    if (business.isNationwide) {
      console.log(`[Music Lessons] Business serves nationwide`)
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
      console.log(`[Music Lessons] Service area check result: ${serves}`)
      if (serves) return true
    }

    // Fall back to primary zip code comparison
    const primaryMatch = business.zipCode === zipCode
    console.log(`[Music Lessons] Primary zip code match: ${primaryMatch}`)
    return primaryMatch
  }

  // Clear zip code filter
  const clearZipCodeFilter = () => {
    setUserZipCode(null)
    localStorage.removeItem("savedZipCode")
  }

  // Function to check if business has exact subcategory match
  const hasExactSubcategory = (business: Business, filter: string) => {
    return business.subcategories?.some(
      (subcategory) => getSubcategoryString(subcategory).toLowerCase() === filter.toLowerCase(),
    )
  }

  // Filter handlers
  const handleFilterChange = (filter: string) => {
    setSelectedFilters((prev) => {
      if (prev.includes(filter)) {
        return prev.filter((f) => f !== filter)
      } else {
        return [...prev, filter]
      }
    })
  }

  const handleApplyFilters = () => {
    setAppliedFilters([...selectedFilters])
    let filtered = [...allProviders]

    if (selectedFilters.length > 0) {
      filtered = allProviders.filter((business) => {
        return selectedFilters.every((filter) => hasExactSubcategory(business, filter))
      })
    }

    setFilteredProviders(filtered)

    toast({
      title: "Filters Applied",
      description: `Showing businesses with ${selectedFilters.length} selected service${selectedFilters.length !== 1 ? "s" : ""}`,
    })
  }

  const handleClearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredProviders([...allProviders])

    toast({
      title: "Filters Cleared",
      description: "Showing all music lesson providers",
    })
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
      console.log(`[Music Lessons] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

      try {
        setLoading(true)
        setError(null)

        console.log("Fetching music lesson businesses...")
        let businesses = await getBusinessesForCategoryPage("/music-lessons")

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Music Lessons] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Music Lessons] Fetch ${currentFetchId} completed, got ${businesses.length} businesses`)

        // Filter by zip code if available
        if (userZipCode) {
          console.log(`[Music Lessons] Filtering by zip code: ${userZipCode}`)
          businesses = businesses.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Music Lessons] Business ${business.displayName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              business,
            )
            return serves
          })
          console.log(`[Music Lessons] After filtering: ${businesses.length} businesses`)
        }

        console.log("Fetched music lesson businesses:", businesses)
        setAllProviders(businesses)
        setFilteredProviders(businesses)
      } catch (error) {
        // Only update error state if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error("Error fetching music lesson providers:", error)
          setError("Failed to load providers")
          toast({
            title: "Error loading businesses",
            description: "There was a problem loading music lesson providers. Please try again later.",
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

  const handleViewProfile = (business: Business) => {
    console.log("Opening profile for business:", business)
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.displayName || business.businessName || "Music Instructor")
    setIsBusinessProfileOpen(true)
  }

  const handleViewReviews = (business: Business) => {
    setSelectedProvider({
      id: Number.parseInt(business.id),
      name: business.displayName || business.businessName || "Music Instructor",
      reviews: [],
    })
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Music Lessons & Instrument Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/music%20lesson-VcAdpdYV65QHk4izPaeiVUsKQZwn9Q.png"
            alt="Music Lessons"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified music teachers and instrument services in your area. Browse options below or use filters to
            narrow your search.
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

      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Filter by Service Type</h4>
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
          {filterOptions.map((option: FilterOption) => (
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
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
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
            <p>Loading music lesson providers...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {userZipCode ? `No Music Lesson Providers in ${userZipCode}` : "No Music Lesson Providers Found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `We're building our network of music instructors in the ${userZipCode} area.`
                : "We're currently building our network of music instructors in your area."}
            </p>
            <p className="text-sm text-gray-500">
              Are you a music instructor?{" "}
              <a href="/business-register" className="text-primary hover:underline">
                Register your business
              </a>{" "}
              to be featured here.
            </p>
          </div>
        ) : (
          <>
            {filteredProviders.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Found {filteredProviders.length} Music Lesson Provider{filteredProviders.length !== 1 ? "s" : ""}
                </h2>
              </div>
            )}

            {filteredProviders.map((business: Business) => (
              <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {business.displayName || business.businessName || "Music Instructor"}
                      </h3>

                      {/* Service Area Indicator */}
                      {business.isNationwide ? (
                        <div className="text-xs text-green-600 font-medium mb-1">✓ Serves nationwide</div>
                      ) : userZipCode && business.serviceArea?.includes(userZipCode) ? (
                        <div className="text-xs text-green-600 font-medium mb-1">
                          ✓ Serves {userZipCode} and surrounding areas
                        </div>
                      ) : null}

                      {business.businessDescription && (
                        <p className="text-gray-600 text-sm mt-1">{business.businessDescription}</p>
                      )}

                      <div className="mt-3 space-y-2">
                        {/* Location Display */}
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-primary" />
                          <span>{business.displayLocation || "Location not specified"}</span>
                        </div>

                        {/* Phone Display */}
                        {business.displayPhone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2 text-primary" />
                            <a href={`tel:${business.displayPhone}`} className="hover:text-primary transition-colors">
                              {business.displayPhone}
                            </a>
                          </div>
                        )}
                      </div>

                      {business.subcategories && business.subcategories.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
                          <div className="flex flex-wrap gap-2">
                            {business.subcategories.map((subcategory: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {getSubcategoryString(subcategory)}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                      <Button className="min-w-[120px]" onClick={() => handleViewReviews(business)}>
                        Reviews
                      </Button>
                      <Button variant="outline" className="min-w-[120px]" onClick={() => handleViewProfile(business)}>
                        View Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name || ""}
          businessId={selectedProvider.id?.toString() || ""}
          reviews={[]}
        />
      )}

      {selectedBusinessId && (
        <BusinessProfileDialog
          businessId={selectedBusinessId}
          businessName={selectedBusinessName}
          isOpen={isBusinessProfileOpen}
          onClose={() => setIsBusinessProfileOpen(false)}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
