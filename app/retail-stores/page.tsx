"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Phone, X } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"

// Enhanced Business interface with service area
interface Business {
  id: string
  displayName?: string
  businessName: string
  displayLocation?: string
  displayPhone?: string
  zipCode: string
  serviceArea?: string[] // Direct array of ZIP codes
  isNationwide?: boolean // Direct boolean property
  subcategories?: any[] // Changed from string[] to any[]
  allSubcategories?: any[] // Changed from string[] to any[]
  rating?: number
  reviewCount?: number
  reviewsData?: any[]
  subcategory?: string
}

// Helper function to safely extract string from subcategory data
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

export default function RetailStoresPage() {
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "retail1", label: "Supermarkets/Grocery Stores", value: "Supermarkets/Grocery Stores" },
    { id: "retail2", label: "Department Store", value: "Department Store" },
    { id: "retail3", label: "Convenience Store", value: "Convenience Store" },
    { id: "retail4", label: "Clothing Boutique", value: "Clothing Boutique" },
    { id: "retail5", label: "Discount Store", value: "Discount Store" },
    { id: "retail6", label: "Warehouse Store", value: "Warehouse Store" },
    { id: "retail7", label: "Electronics Store", value: "Electronics Store" },
    { id: "retail8", label: "Bookstore", value: "Bookstore" },
    { id: "retail9", label: "Jewelry Store", value: "Jewelry Store" },
    { id: "retail10", label: "Toy Store", value: "Toy Store" },
    { id: "retail11", label: "Sporting Goods Store", value: "Sporting Goods Store" },
    { id: "retail12", label: "Furniture Store", value: "Furniture Store" },
    { id: "retail13", label: "Pet Store", value: "Pet Store" },
    { id: "retail14", label: "Shoe Store", value: "Shoe Store" },
    { id: "retail15", label: "Hardware Store", value: "Hardware Store" },
    { id: "retail16", label: "Stationery Store", value: "Stationery Store" },
    { id: "retail17", label: "Auto Parts Store", value: "Auto Parts Store" },
    { id: "retail18", label: "Health Food Store", value: "Health Food Store" },
    { id: "retail19", label: "Wine Shop/Alcohol Sales", value: "Wine Shop/Alcohol Sales" },
    { id: "retail20", label: "Antique Shop", value: "Antique Shop" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    reviews: any[]
  } | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<{
    id: string
    name: string
  } | null>(null)

  // State for businesses
  const [providers, setProviders] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState<Business[]>([])

  // State for business photos
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  // Function to load photos for a specific business
  const loadPhotosForBusiness = async (businessId: string) => {
    if (!businessPhotos[businessId]) {
      try {
        const photos = await loadBusinessPhotos(businessId)
        setBusinessPhotos((prev) => ({
          ...prev,
          [businessId]: photos,
        }))
      } catch (error) {
        console.error(`Failed to load photos for business ${businessId}:`, error)
        setBusinessPhotos((prev) => ({
          ...prev,
          [businessId]: [],
        }))
      }
    }
  }

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
      console.log(`User zip code loaded: ${savedZipCode}`)
    } else {
      console.log("No user zip code found in localStorage")
    }
  }, [])

  // Helper function to check if a business serves a specific zip code
  const businessServesZipCode = (business: Business, targetZipCode: string): boolean => {
    console.log(`  - Checking service area for ${business.displayName || business.businessName}:`)
    console.log(`    - Primary ZIP: ${business.zipCode}`)
    console.log(`    - Nationwide: ${business.isNationwide}`)
    console.log(`    - Service Area: ${business.serviceArea ? JSON.stringify(business.serviceArea) : "none"}`)
    console.log(`    - Target ZIP: ${targetZipCode}`)

    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`    - Result: MATCH (nationwide)`)
      return true
    }

    // Check if zip code is in service area array
    if (business.serviceArea && Array.isArray(business.serviceArea) && business.serviceArea.length > 0) {
      const matches = business.serviceArea.includes(targetZipCode)
      console.log(`    - Result: ${matches ? "MATCH" : "NO MATCH"} (service area check)`)
      return matches
    }

    // Fall back to primary zip code
    const matches = business.zipCode === targetZipCode
    console.log(`    - Result: ${matches ? "MATCH" : "NO MATCH"} (primary ZIP fallback)`)
    return matches
  }

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[${new Date().toISOString()}] Fetching businesses for /retail-stores (request #${currentFetchId})`)

      try {
        setLoading(true)
        setError(null)

        const fetchedBusinesses = await getBusinessesForCategoryPage("/retail-stores")
        console.log(
          `[${new Date().toISOString()}] Retrieved ${fetchedBusinesses.length} total businesses (request #${currentFetchId})`,
        )

        // Check if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${currentFetchId}`)
          return
        }

        fetchedBusinesses.forEach((business: Business) => {
          console.log(
            `  - ${business.id}: "${business.displayName || business.businessName}" (zipCode: ${business.zipCode})`,
          )
        })

        // Filter by zip code if available
        let filteredBusinesses = fetchedBusinesses
        if (userZipCode) {
          console.log(
            `[${new Date().toISOString()}] Filtering by user zip code: ${userZipCode} (request #${currentFetchId})`,
          )
          filteredBusinesses = fetchedBusinesses.filter((business: Business) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[${new Date().toISOString()}] After filtering: ${filteredBusinesses.length} businesses (request #${currentFetchId})`,
          )
        }

        setProviders(filteredBusinesses)
        setAllProviders(filteredBusinesses) // Store all providers
      } catch (err) {
        console.error("Error fetching businesses:", err)
        if (currentFetchId === fetchIdRef.current) {
          setError("Failed to load businesses")
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  const handleOpenReviews = (provider: Business) => {
    setSelectedProvider({
      id: Number.parseInt(provider.id),
      name: provider.displayName || provider.businessName || "Retail Store",
      reviews: provider.reviewsData || [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (provider: Business) => {
    setSelectedBusiness({
      id: provider.id,
      name: provider.displayName || provider.businessName || "Retail Store",
    })
    setIsProfileDialogOpen(true)
  }

  // Handle clearing zip code filter
  const handleClearZipCode = () => {
    localStorage.removeItem("savedZipCode")
    setUserZipCode(null)
  }

  // Function to check if business has exact subcategory match
  const hasExactSubcategoryMatch = (business: Business, filterValue: string): boolean => {
    const subcategories = business.subcategories || []
    const allSubcategories = business.allSubcategories || []

    return (
      subcategories.some((subcat) => getSubcategoryString(subcat) === filterValue) ||
      allSubcategories.some((subcat) => getSubcategoryString(subcat) === filterValue) ||
      (business as any).subcategory === filterValue
    )
  }

  // Handle filter selection
  const handleFilterChange = (filterId: string, filterValue: string, checked: boolean) => {
    if (checked) {
      setSelectedFilters((prev) => [...prev, filterValue])
    } else {
      setSelectedFilters((prev) => prev.filter((f) => f !== filterValue))
    }
  }

  // Apply filters
  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)

    if (selectedFilters.length === 0) {
      setProviders(allProviders)
      setAppliedFilters([])
      return
    }

    const filtered = allProviders.filter((business) => {
      return selectedFilters.some((filter) => hasExactSubcategoryMatch(business, filter))
    })

    console.log(`Filtered results: ${filtered.length} stores`)
    setProviders(filtered)
    setAppliedFilters([...selectedFilters])
    setSelectedFilters([])
  }

  // Clear filters
  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setProviders(allProviders)
  }

  return (
    <CategoryLayout title="Retail Stores" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/retail-LMdA5FnQ5i2okSiyh63eZFduC47jXp.png"
            alt="Retail Stores"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find local retail stores and shops in your area. Browse options below or use filters to narrow your search.
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

      {/* Enhanced Filter Interface */}
      <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Filter by Store Type</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes(option.value)}
                onChange={(e) => handleFilterChange(option.id, option.value, e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              onClick={applyFilters}
              disabled={selectedFilters.length === 0}
              className="bg-primary hover:bg-primary/90"
            >
              Apply Filters ({selectedFilters.length})
            </Button>

            {appliedFilters.length > 0 && (
              <Button
                onClick={clearFilters}
                variant="outline"
                className="text-gray-600 hover:text-gray-800 bg-transparent"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {appliedFilters.length > 0 && (
            <div className="text-sm text-gray-600">
              Showing {providers.length} of {allProviders.length} stores
            </div>
          )}
        </div>

        {/* Active Filters Display */}
        {appliedFilters.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {appliedFilters.map((filter, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <p className="text-sm font-medium text-blue-800">Showing businesses that service: {userZipCode}</p>
                <p className="text-sm text-blue-700">Including businesses with this ZIP code in their service area</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearZipCode}
              className="text-blue-700 hover:text-blue-900 hover:bg-blue-100"
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading retail stores...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userZipCode ? `No Retail Stores Found in ${userZipCode}` : "No Retail Stores Yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `No retail stores found serving ZIP code ${userZipCode}. Try clearing the filter to see all stores.`
                : "Be the first retail store to join our platform and connect with local customers in your area."}
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">Register Your Store</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((provider: Business) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {provider.displayName || provider.businessName || "Retail Store"}
                    </h3>

                    {/* Combined location and phone in one row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {provider.displayLocation && <span>{provider.displayLocation}</span>}
                      {provider.displayPhone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 mr-1" />
                          <a href={`tel:${provider.displayPhone}`} className="hover:text-blue-600 hover:underline">
                            {provider.displayPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Store Type Tags - Display ALL services */}
                    {provider.subcategories && provider.subcategories.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Store Type:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {provider.subcategories.map((subcategory: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(subcategory)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Photo Carousel and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* Photo Carousel */}
                    <div className="flex-1">
                      <PhotoCarousel
                        businessId={provider.id}
                        photos={businessPhotos[provider.id] || []}
                        onLoadPhotos={() => loadPhotosForBusiness(provider.id)}
                        showMultiple={true}
                        photosPerView={5}
                        className="w-full"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:w-32 w-full">
                      <Button className="flex-1 lg:flex-none lg:w-full" onClick={() => handleOpenReviews(provider)}>
                        Ratings
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 lg:flex-none lg:w-full bg-transparent"
                        onClick={() => handleViewProfile(provider)}
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

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          reviews={selectedProvider.reviews}
        />
      )}

      {selectedBusiness && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedBusiness.id}
          businessName={selectedBusiness.name}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
