"use client"

import { CategoryLayout } from "@/components/category-layout"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"

export default function RealEstatePage() {
  const filterOptions = [
    { id: "home1", label: "Real Estate Agent", value: "Real Estate Agent" },
    { id: "home2", label: "Real Estate Appraising", value: "Real Estate Appraising" },
    { id: "home3", label: "Home Staging", value: "Home Staging" },
    { id: "home4", label: "Home Inspection", value: "Home Inspection" },
    { id: "home5", label: "Home Energy Audit", value: "Home Energy Audit" },
    { id: "home6", label: "Other Home Buying and Selling", value: "Other Home Buying and Selling" },
  ]

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

  // Add fetchIdRef for race condition prevention
  const fetchIdRef = useRef(0)

  // Enhanced Business interface
  interface Business {
    id: string
    displayName?: string
    businessName?: string
    displayLocation?: string
    zipCode?: string
    displayPhone?: string
    rating?: number
    reviews?: number
    subcategories?: any[] // Changed from string[] to any[]
    serviceArea?: string[]
    isNationwide?: boolean
    allSubcategories?: any[] // Changed from string[] to any[]
    subcategory?: string
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

  // State for businesses
  const [providers, setProviders] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState<Business[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Business[]>([])

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  // Helper function to check if business has exact subcategory match
  const hasExactSubcategoryMatch = (business: Business, filterValue: string): boolean => {
    // Check subcategories array
    if (business.subcategories && Array.isArray(business.subcategories)) {
      if (business.subcategories.some((subcat) => getSubcategoryString(subcat) === filterValue)) return true
    }

    // Check allSubcategories array
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      if (business.allSubcategories.some((subcat) => getSubcategoryString(subcat) === filterValue)) return true
    }

    // Check subcategory field
    if (business.subcategory === filterValue) return true

    return false
  }

  const handleFilterChange = (filterValue: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterValue) ? prev.filter((f) => f !== filterValue) : [...prev, filterValue],
    )
  }

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All providers:", allProviders)

    if (selectedFilters.length === 0) {
      setFilteredProviders(allProviders)
      setAppliedFilters([])
      return
    }

    const filtered = allProviders.filter((business) => {
      console.log(`Business ${business.displayName || business.businessName} subcategories:`, business.subcategories)

      const hasMatch = selectedFilters.some((filter) => {
        const matches = hasExactSubcategoryMatch(business, filter)
        console.log(`Filter "${filter}" matches business: ${matches}`)
        return matches
      })

      console.log(`Business ${business.displayName || business.businessName} has match: ${hasMatch}`)
      return hasMatch
    })

    console.log("Filtered results:", filtered)
    setFilteredProviders(filtered)
    setAppliedFilters([...selectedFilters])
    setSelectedFilters([])
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredProviders(allProviders)
  }

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[RealEstate] Starting fetch ${currentFetchId} for zip code:`, userZipCode)

      try {
        setLoading(true)
        setError(null)

        const fetchedBusinesses = await getBusinessesForCategoryPage("/real-estate")

        // Only update if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[RealEstate] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[RealEstate] Fetch ${currentFetchId} got ${fetchedBusinesses.length} businesses`)

        // Filter businesses by zip code if userZipCode is available
        if (userZipCode) {
          const originalCount = fetchedBusinesses.length
          const filteredBusinesses = fetchedBusinesses.filter((business: Business) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[RealEstate] Filtered from ${originalCount} to ${filteredBusinesses.length} businesses for zip ${userZipCode}`,
          )
          setProviders(filteredBusinesses)
          setAllProviders(filteredBusinesses)
          setFilteredProviders(filteredBusinesses)
        } else {
          setProviders(fetchedBusinesses)
          setAllProviders(fetchedBusinesses)
          setFilteredProviders(fetchedBusinesses)
        }
      } catch (error) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[RealEstate] Fetch ${currentFetchId} error:`, error)
          setError("Failed to load real estate professionals")
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

  const handleViewReviews = (business: Business) => {
    setSelectedProvider({
      id: Number.parseInt(business.id || "0"),
      name: business.displayName || business.businessName || "Real Estate Professional",
      reviews: [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: Business) => {
    console.log("Opening profile for business:", business.id, business.businessName)
    setSelectedBusiness({
      id: business.id || "",
      name: business.displayName || business.businessName || "Real Estate Professional",
    })
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Real Estate Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="/placeholder.svg?height=400&width=600&text=Real+Estate+Services"
            alt="Real Estate Services"
            width={600}
            height={400}
            className="rounded-lg shadow-md"
          />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Find Real Estate Professionals</h2>
          <p className="text-gray-600">
            Connect with experienced real estate agents, appraisers, home inspectors, and other professionals to help
            you buy, sell, or maintain your property.
          </p>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Our Services Include:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Real Estate Agents & Brokers</li>
              <li>Property Appraisals</li>
              <li>Home Inspections</li>
              <li>Home Staging Services</li>
              <li>Energy Audits</li>
              <li>Property Management</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Filter by Service Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes(option.value)}
                onChange={() => handleFilterChange(option.value)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={applyFilters}
            disabled={selectedFilters.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Apply Filters ({selectedFilters.length})
          </button>
          {appliedFilters.length > 0 && (
            <button onClick={clearFilters} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
              Clear Filters
            </button>
          )}
        </div>
        {appliedFilters.length > 0 && (
          <div className="mt-3">
            <span className="text-sm text-gray-600">Active filters: </span>
            {appliedFilters.map((filter, index) => (
              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                {filter}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Results Section */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading real estate professionals...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              {appliedFilters.length > 0 ? "Filtered Results" : "All Real Estate Professionals"}
              <span className="text-gray-500 ml-2">({filteredProviders.length})</span>
            </h3>
          </div>

          {filteredProviders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {appliedFilters.length > 0
                  ? "No real estate professionals found matching your filters. Try adjusting your criteria."
                  : "No real estate professionals found in your area."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProviders.map((business) => (
                <div key={business.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {business.displayName || business.businessName || "Real Estate Professional"}
                    </h4>
                    {business.rating && (
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-1 text-sm text-gray-600">{business.rating}</span>
                      </div>
                    )}
                  </div>

                  {business.displayLocation && <p className="text-gray-600 mb-2">📍 {business.displayLocation}</p>}

                  {business.displayPhone && <p className="text-gray-600 mb-2">📞 {business.displayPhone}</p>}

                  {(business.subcategories || business.allSubcategories) && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {(business.subcategories || business.allSubcategories || [])
                          .slice(0, 3)
                          .map((subcat, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {getSubcategoryString(subcat)}
                            </span>
                          ))}
                        {(business.subcategories || business.allSubcategories || []).length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{(business.subcategories || business.allSubcategories || []).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleViewProfile(business)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleViewReviews(business)}
                      className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
                    >
                      Reviews ({business.reviews || 0})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </CategoryLayout>
  )
}
