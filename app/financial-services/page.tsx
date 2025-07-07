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
import { PhotoCarousel } from "@/components/photo-carousel"
import { Loader2, MapPin, Phone } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

interface Business {
  id: string
  displayName: string
  businessName: string
  displayLocation: string
  displayPhone: string
  allSubcategories?: any[] // Changed to any[] to handle both strings and objects
  subcategory?: string | { category: string; subcategory: string; fullPath: string }
  rating?: number
  reviews?: number
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
  subcategories?: any[] // Changed to any[] to handle both strings and objects
}

// Helper function to extract string value from subcategory (whether it's a string or object)
function getSubcategoryString(sub: any): string {
  if (typeof sub === "string") {
    return sub
  }

  if (sub && typeof sub === "object") {
    // If it's an object with subcategory property, use that
    if (sub.subcategory) {
      return sub.subcategory
    }
    // Otherwise try fullPath
    if (sub.fullPath) {
      return sub.fullPath
    }
  }

  // Fallback
  return "Financial Services"
}

export default function FinancialServicesPage() {
  const { toast } = useToast()
  const filterOptions = [
    { id: "finance1", label: "Accountants", value: "Accountants" },
    { id: "finance2", label: "Insurance", value: "Insurance" },
    { id: "finance3", label: "Advertising", value: "Advertising" },
    { id: "finance4", label: "Marketing", value: "Marketing" },
    { id: "finance5", label: "Financial and Investment Advisers", value: "Financial and Investment Advisers" },
    { id: "finance6", label: "Debt Consolidators", value: "Debt Consolidators" },
    { id: "finance7", label: "Cryptocurrency", value: "Cryptocurrency" },
  ]

  const [selectedProvider, setSelectedProvider] = useState<Business | null>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

  // Photo state
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  // Use a ref to track the current fetch request
  const fetchIdRef = useRef<number>(0)

  // Get user's zip code from localStorage only once on mount
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
      console.log(`User zip code loaded: ${savedZipCode}`)
    } else {
      console.log("No user zip code found in localStorage")
    }
  }, [])

  const businessServesZipCode = (business: Business, targetZipCode: string): boolean => {
    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`  - ${business.displayName}: serves nationwide, matches=true`)
      return true
    }

    // Check if target zip code is in the service area (direct array)
    if (business.serviceArea && Array.isArray(business.serviceArea) && business.serviceArea.length > 0) {
      const matches = business.serviceArea.includes(targetZipCode)
      console.log(
        `  - ${business.displayName}: serviceArea=[${business.serviceArea.join(", ")}], userZip="${targetZipCode}", matches=${matches}`,
      )
      return matches
    }

    // Fall back to checking primary zip code
    const businessZip = business.zipCode || ""
    const matches = businessZip === targetZipCode
    console.log(
      `  - ${business.displayName}: primaryZip="${businessZip}", userZip="${targetZipCode}", matches=${matches}`,
    )
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

  // Separate useEffect for fetching businesses to avoid race conditions
  useEffect(() => {
    // Create a unique ID for this fetch request
    const fetchId = ++fetchIdRef.current

    async function fetchBusinesses() {
      // If this isn't the latest fetch request, don't proceed
      if (fetchId !== fetchIdRef.current) return

      setIsLoading(true)
      try {
        const requestTime = new Date().toISOString()
        console.log(`[${requestTime}] Fetching businesses for /financial-services (request #${fetchId})`)

        const result = await getBusinessesForCategoryPage("/financial-services")

        // If this isn't the latest fetch request, don't update state
        if (fetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${fetchId}`)
          return
        }

        console.log(`[${new Date().toISOString()}] Retrieved ${result.length} total businesses (request #${fetchId})`)

        // Log subcategory types to help debug
        result.forEach((business) => {
          if (business.allSubcategories && business.allSubcategories.length > 0) {
            console.log(
              `Business ${business.displayName} subcategory types:`,
              business.allSubcategories.map((sub) => (typeof sub === "object" ? "object" : typeof sub)),
            )
          }
        })

        let filteredResult = result

        if (userZipCode) {
          console.log(`[${new Date().toISOString()}] Filtering by user zip code: ${userZipCode} (request #${fetchId})`)
          filteredResult = result.filter((business) => businessServesZipCode(business, userZipCode))
          console.log(
            `[${new Date().toISOString()}] After filtering: ${filteredResult.length} businesses (request #${fetchId})`,
          )
        }

        setBusinesses(filteredResult)
        setAllBusinesses(filteredResult)
        setFilteredBusinesses(filteredResult)
      } catch (error) {
        // Only show error for the latest request
        if (fetchId === fetchIdRef.current) {
          console.error(`[${new Date().toISOString()}] Error fetching businesses (request #${fetchId}):`, error)
          toast({
            title: "Error loading businesses",
            description: "There was a problem loading businesses. Please try again later.",
            variant: "destructive",
          })
        }
      } finally {
        // Only update loading state for the latest request
        if (fetchId === fetchIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchBusinesses()

    // Cleanup function to handle component unmount
    return () => {
      // This will prevent any in-flight requests from updating state
      fetchIdRef.current = fetchId + 1
    }
  }, [toast, userZipCode]) // Only re-run when toast or userZipCode changes

  // Helper function to check if business has exact subcategory match
  const hasExactSubcategoryMatch = (business: Business, filterValue: string): boolean => {
    // Check allSubcategories array
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      return business.allSubcategories.some((sub) => {
        const subString = getSubcategoryString(sub)
        return subString === filterValue
      })
    }

    // Check subcategories array
    if (business.subcategories && Array.isArray(business.subcategories)) {
      return business.subcategories.some((sub) => {
        const subString = getSubcategoryString(sub)
        return subString === filterValue
      })
    }

    // Check single subcategory field
    if (business.subcategory) {
      const subString = getSubcategoryString(business.subcategory)
      return subString === filterValue
    }

    return false
  }

  // Filter functions
  const handleFilterChange = (value: string) => {
    setSelectedFilters((prev) => (prev.includes(value) ? prev.filter((f) => f !== value) : [...prev, value]))
  }

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All businesses:", allBusinesses)

    if (selectedFilters.length === 0) {
      setFilteredBusinesses(allBusinesses)
      setAppliedFilters([])
      toast({
        title: "Filters cleared",
        description: `Showing all ${allBusinesses.length} financial service providers.`,
      })
      return
    }

    const filtered = allBusinesses.filter((business) => {
      const hasMatch = selectedFilters.some((filter) => hasExactSubcategoryMatch(business, filter))
      console.log(
        `Business ${business.displayName} subcategories:`,
        business.allSubcategories || business.subcategories || [business.subcategory],
      )
      console.log(`Filter "${selectedFilters.join(", ")}" matches business: ${hasMatch}`)
      return hasMatch
    })

    console.log("Filtered results:", filtered)
    setFilteredBusinesses(filtered)
    setAppliedFilters([...selectedFilters])

    toast({
      title: "Filters applied",
      description: `Found ${filtered.length} financial service providers matching your criteria.`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses(allBusinesses)

    toast({
      title: "Filters cleared",
      description: `Showing all ${allBusinesses.length} financial service providers.`,
    })
  }

  const handleOpenReviews = (provider: Business) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: Business) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Insurance, Finance, Debt and Sales" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/accountant-bVMbHmjmeZbti2lNIRrbCdjJnJJDKX.png"
            alt="Financial Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified financial professionals in your area. Browse services below or use filters to narrow your
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
                onChange={() => handleFilterChange(option.value)}
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
                Showing {filteredBusinesses.length} of {allBusinesses.length} financial service providers
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

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading financial service providers...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Photo Carousel */}
                  <div className="lg:w-40 flex-shrink-0">
                    <PhotoCarousel
                      businessId={business.id}
                      photos={businessPhotos[business.id] || []}
                      onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                      className="w-40 h-30"
                    />
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold">{business.displayName}</h3>

                    {business.displayLocation && (
                      <div className="flex items-center mt-2 text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{business.displayLocation}</span>
                      </div>
                    )}

                    {business.displayPhone && (
                      <div className="flex items-center mt-1 text-gray-600">
                        <Phone className="h-4 w-4 mr-1" />
                        <a href={`tel:${business.displayPhone}`} className="text-sm hover:text-primary">
                          {business.displayPhone}
                        </a>
                      </div>
                    )}

                    {/* Service Area Indicator */}
                    {userZipCode && (
                      <div className="flex items-center mt-1 text-blue-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-xs">
                          {business.isNationwide
                            ? "Serves nationwide"
                            : business.serviceArea?.includes(userZipCode)
                              ? `Serves ${userZipCode} and surrounding areas`
                              : `Primary location: ${business.zipCode}`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => {
                          // Only show yellow stars if business has reviews AND a rating
                          const hasReviews = business.reviews && business.reviews > 0
                          const rating = hasReviews ? business.rating || 0 : 0

                          return (
                            <svg
                              key={i}
                              className={`w-4 h-4 ${i < Math.floor(rating) ? "text-yellow-400" : "text-gray-300"}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )
                        })}
                      </div>
                      {business.reviews && business.reviews > 0 ? (
                        <span className="text-sm text-gray-600 ml-2">
                          {business.rating || 0} ({business.reviews} reviews)
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600 ml-2">No reviews yet</span>
                      )}
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {business.allSubcategories && business.allSubcategories.length > 0 ? (
                          business.allSubcategories.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(service)}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {getSubcategoryString(business.subcategory) || "Financial Services"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="lg:w-32 flex flex-row lg:flex-col gap-2 lg:justify-start">
                    <Button className="flex-1 lg:flex-none lg:w-full" onClick={() => handleOpenReviews(business)}>
                      Reviews
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
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-emerald-800 mb-2">No Financial Service Providers Found</h3>
            <p className="text-emerald-700 mb-4">
              {userZipCode
                ? `We're building our network of licensed financial professionals in the ${userZipCode} area.`
                : "We're building our network of licensed financial professionals in your area."}
            </p>
            <div className="bg-white rounded border border-emerald-100 p-4">
              <p className="text-gray-700 font-medium">Are you a financial professional?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to connect with clients who need your financial expertise and services.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Financial Business</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.displayName || selectedProvider.businessName}
          businessId={selectedProvider.id}
          reviews={[]}
        />
      )}

      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
          businessName={selectedProvider.displayName || selectedProvider.businessName}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
