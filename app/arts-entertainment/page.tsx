"use client"

import { useState, useEffect, useRef } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2, MapPin, Phone, X } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"

// Enhanced Business interface with service area
interface Business {
  id: string
  displayName?: string
  businessName: string
  displayLocation?: string
  displayPhone?: string
  zipCode: string
  serviceArea?: string[] // Array of ZIP codes the business serves
  isNationwide?: boolean // Whether the business serves nationwide
  subcategories?: any[] // Changed from string[] to any[] to handle objects
  allSubcategories?: any[] // Changed from string[] to any[] to handle objects
  rating?: number
  reviews?: number
  subcategory?: string | any // Can be string or object
}

// Helper function to extract string value from subcategory object
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

export default function ArtsEntertainmentPage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

  const filterOptions = [
    {
      id: "arts1",
      label: "Fine Artists, Including Painters, Sculptors, and Illustrators",
      value: "Fine Artists, Including Painters, Sculptors, and Illustrators",
    },
    { id: "arts2", label: "Craft Artists", value: "Craft Artists" },
    { id: "arts3", label: "Musicians and Singers", value: "Musicians and Singers" },
    { id: "arts4", label: "Recording Studios", value: "Recording Studios" },
    { id: "arts5", label: "Art Galleries", value: "Art Galleries" },
    { id: "arts6", label: "Concert Venues", value: "Concert Venues" },
    { id: "arts7", label: "Fashion Designers", value: "Fashion Designers" },
    { id: "arts8", label: "Interior Designers", value: "Interior Designers" },
    { id: "arts9", label: "Photographers and Videographers", value: "Photographers and Videographers" },
    { id: "arts10", label: "Floral Designers", value: "Floral Designers" },
    { id: "arts11", label: "Graphic Designers", value: "Graphic Designers" },
    { id: "arts12", label: "All Entertainers and Talent", value: "All Entertainers and Talent" },
    { id: "arts13", label: "Talent Agent", value: "Talent Agent" },
    { id: "arts14", label: "Models", value: "Models" },
  ]

  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])

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
    console.log(`Checking service area for ${business.displayName || business.businessName}:`)
    console.log(`  - Primary ZIP: ${business.zipCode}`)
    console.log(`  - Service Area: [${business.serviceArea?.join(", ") || "none"}]`)
    console.log(`  - Nationwide: ${business.isNationwide || false}`)
    console.log(`  - Target ZIP: ${targetZipCode}`)

    // Check if business is nationwide
    if (business.isNationwide) {
      console.log(`  - ${business.displayName || business.businessName}: nationwide=true, matches=true`)
      return true
    }

    // Check if zip code is in service area
    if (business.serviceArea && Array.isArray(business.serviceArea) && business.serviceArea.length > 0) {
      const matches = business.serviceArea.includes(targetZipCode)
      console.log(
        `  - ${business.displayName || business.businessName}: serviceArea=[${business.serviceArea.join(", ")}], userZip="${targetZipCode}", matches=${matches}`,
      )
      return matches
    }

    // Fall back to primary zip code
    const matches = business.zipCode === targetZipCode
    console.log(
      `  - ${business.displayName || business.businessName}: primaryZip="${business.zipCode}", userZip="${targetZipCode}", matches=${matches}`,
    )
    return matches
  }

  // Fetch businesses in this category
  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(
        `[${new Date().toISOString()}] Fetching businesses for /arts-entertainment (request #${currentFetchId})`,
      )

      try {
        setIsLoading(true)
        setError(null)

        const result = await getBusinessesForCategoryPage("/arts-entertainment")
        console.log(
          `[${new Date().toISOString()}] Retrieved ${result.length} total businesses (request #${currentFetchId})`,
        )

        // Check if this is still the latest request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[${new Date().toISOString()}] Ignoring stale response for request #${currentFetchId}`)
          return
        }

        result.forEach((business: Business) => {
          console.log(
            `  - ${business.id}: "${business.displayName || business.businessName}" (zipCode: ${business.zipCode})`,
          )
        })

        // Filter by zip code if available
        let filteredResult = result
        if (userZipCode) {
          console.log(
            `[${new Date().toISOString()}] Filtering by user zip code: ${userZipCode} (request #${currentFetchId})`,
          )
          filteredResult = result.filter((business: Business) => businessServesZipCode(business, userZipCode))
          console.log(
            `[${new Date().toISOString()}] After filtering: ${filteredResult.length} businesses (request #${currentFetchId})`,
          )
        }

        setBusinesses(filteredResult)
        setAllBusinesses(filteredResult) // Store all businesses
      } catch (error) {
        console.error("Error fetching businesses:", error)
        if (currentFetchId === fetchIdRef.current) {
          setError("Failed to load businesses")
          toast({
            title: "Error loading businesses",
            description: "There was a problem loading businesses. Please try again later.",
            variant: "destructive",
          })
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [toast, userZipCode])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
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

    // Check subcategories array
    for (const subcategory of subcategories) {
      const subcategoryStr = getSubcategoryString(subcategory)
      if (subcategoryStr === filterValue) {
        return true
      }
    }

    // Check allSubcategories array
    for (const subcategory of allSubcategories) {
      const subcategoryStr = getSubcategoryString(subcategory)
      if (subcategoryStr === filterValue) {
        return true
      }
    }

    // Check business.subcategory field
    if (business.subcategory) {
      const subcategoryStr = getSubcategoryString(business.subcategory)
      if (subcategoryStr === filterValue) {
        return true
      }
    }

    return false
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
      setBusinesses(allBusinesses)
      setAppliedFilters([])
      return
    }

    const filtered = allBusinesses.filter((business) => {
      return selectedFilters.some((filter) => hasExactSubcategoryMatch(business, filter))
    })

    console.log(`Filtered results: ${filtered.length} businesses`)
    setBusinesses(filtered)
    setAppliedFilters([...selectedFilters])
    setSelectedFilters([])
  }

  // Clear filters
  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setBusinesses(allBusinesses)
  }

  return (
    <CategoryLayout title="Arts & Entertainment" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/clown-xZLibLvsgZ7U7sWOXy9eokr8IyyUZy.png"
            alt="Arts and Entertainment"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find creative professionals and entertainment services in your area. Browse options below or use filters to
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

      {/* Enhanced Filter Interface */}
      <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Filter by Service Type</h3>

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
              <Button onClick={clearFilters} variant="outline" className="text-gray-600 hover:text-gray-800">
                Clear Filters
              </Button>
            )}
          </div>

          {appliedFilters.length > 0 && (
            <div className="text-sm text-gray-600">
              Showing {businesses.length} of {allBusinesses.length} businesses
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

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading businesses...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : businesses.length > 0 ? (
        <div className="space-y-6">
          {businesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{business.displayName || business.businessName}</h3>

                    {/* Location Display */}
                    <div className="flex items-center mt-2 text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-sm">{business.displayLocation}</span>
                    </div>

                    {/* Phone Display */}
                    {business.displayPhone && (
                      <div className="flex items-center mt-1 text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-primary" />
                        <a
                          href={`tel:${business.displayPhone}`}
                          className="text-sm hover:text-primary transition-colors"
                        >
                          {business.displayPhone}
                        </a>
                      </div>
                    )}

                    {/* Service Area Indicator */}
                    {userZipCode && (
                      <div className="mt-2">
                        {business.isNationwide ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Serves nationwide
                          </span>
                        ) : business.serviceArea && business.serviceArea.includes(userZipCode) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Serves {userZipCode} and surrounding areas
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Primary location: {business.zipCode}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center mt-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${(business.reviews || 0) > 0 && i < Math.floor(business.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {(business.reviews || 0) > 0
                          ? `${business.rating || 0} (${business.reviews} reviews)`
                          : "No reviews yet"}
                      </span>
                    </div>

                    {business.subcategories && business.subcategories.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {business.subcategories.map((service: any, idx: number) => (
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

                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                    <Button className="min-w-[120px]" onClick={() => handleOpenReviews(business)}>
                      Reviews
                    </Button>
                    <Button variant="outline" className="min-w-[120px]" onClick={() => handleOpenProfile(business)}>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-blue-800 mb-2">
              {userZipCode
                ? `No Arts & Entertainment Providers Found in ${userZipCode}`
                : "No Arts & Entertainment Providers Found"}
            </h3>
            <p className="text-blue-700 mb-4">
              {userZipCode
                ? `No creative professionals found serving ZIP code ${userZipCode}. Try clearing the filter to see all providers.`
                : "We're building our network of creative professionals and entertainers in your area."}
            </p>
            <div className="bg-white rounded border border-blue-100 p-4">
              <p className="text-gray-700 font-medium">Are you a creative professional or entertainer?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to showcase your talents and connect with clients in your area.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Creative Business</a>
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

      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />

      <Toaster />
    </CategoryLayout>
  )
}
