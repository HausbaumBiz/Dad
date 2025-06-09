"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Phone, MapPin, Tag } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useToast } from "@/hooks/use-toast"

// Enhanced Business interface
interface Business {
  id: string
  businessName?: string
  displayName?: string
  displayPhone?: string
  displayLocation?: string
  rating?: number
  reviews?: number
  subcategories?: any[]
  businessDescription?: string
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
  adDesignData?: {
    businessInfo?: {
      phone?: string
      city?: string
      state?: string
    }
  }
  allSubcategories?: any[]
  subcategory?: string
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

// Helper function to check if business serves a zip code
const businessServesZipCode = (business: Business, zipCode: string): boolean => {
  console.log(`Checking if business serves ${zipCode}:`, {
    businessName: business.displayName || business.businessName,
    primaryZip: business.zipCode,
    serviceArea: business.serviceArea,
    isNationwide: business.isNationwide,
  })

  // Check if business serves nationwide
  if (business.isNationwide) {
    console.log(`Business serves nationwide`)
    return true
  }

  // If business has service area defined and it's an array, check it
  if (business.serviceArea && Array.isArray(business.serviceArea) && business.serviceArea.length > 0) {
    const serves = business.serviceArea.includes(zipCode)
    console.log(`Service area check: ${serves}`)
    return serves
  }

  // Fall back to primary zip code
  const primaryZipMatch = business.zipCode === zipCode
  console.log(`Primary zip check: ${primaryZipMatch}`)
  return primaryZipMatch
}

export default function LegalServicesPage() {
  const filterOptions = [
    { id: "lawyer1", label: "Family Lawyer", value: "Family Lawyer" },
    { id: "lawyer2", label: "Criminal Defense Lawyer", value: "Criminal Defense Lawyer" },
    { id: "lawyer3", label: "Personal Injury Lawyer", value: "Personal Injury Lawyer" },
    { id: "lawyer4", label: "Corporate Lawyer", value: "Corporate Lawyer" },
    { id: "lawyer5", label: "Immigration Lawyer", value: "Immigration Lawyer" },
    { id: "lawyer6", label: "Intellectual Property Lawyer", value: "Intellectual Property Lawyer" },
    { id: "lawyer7", label: "Estate Planning Lawyer", value: "Estate Planning Lawyer" },
    { id: "lawyer8", label: "Bankruptcy Lawyer", value: "Bankruptcy Lawyer" },
    { id: "lawyer9", label: "Civil Litigation Lawyer", value: "Civil Litigation Lawyer" },
    { id: "lawyer10", label: "Real Estate Lawyer", value: "Real Estate Lawyer" },
    { id: "lawyer11", label: "Entertainment Lawyer", value: "Entertainment Lawyer" },
    { id: "lawyer12", label: "Tax Lawyer", value: "Tax Lawyer" },
    { id: "lawyer13", label: "Employment Lawyer", value: "Employment Lawyer" },
    { id: "lawyer14", label: "Social Security Disability Lawyer", value: "Social Security Disability Lawyer" },
    { id: "lawyer15", label: "Workers' Compensation Lawyer", value: "Workers' Compensation Lawyer" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: string
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
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])

  const { toast } = useToast()

  const fetchIdRef = useRef(0)

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current

      try {
        setLoading(true)
        setError(null)

        console.log(`[Legal Services] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

        const fetchedBusinesses = await getBusinessesForCategoryPage("/legal-services")

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Legal Services] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Legal Services] Fetch ${currentFetchId} completed, got ${fetchedBusinesses.length} businesses`)

        // Filter by zip code if available
        let filteredBusinesses = fetchedBusinesses
        if (userZipCode) {
          console.log(`[Legal Services] Filtering by zip code: ${userZipCode}`)
          filteredBusinesses = fetchedBusinesses.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Legal Services] Business ${business.displayName || business.businessName} serves ${userZipCode}: ${serves}`,
            )
            return serves
          })
          console.log(`[Legal Services] After filtering: ${filteredBusinesses.length} businesses`)
        }

        setBusinesses(filteredBusinesses)
        setAllBusinesses(filteredBusinesses)
      } catch (err) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Legal Services] Error in fetch ${currentFetchId}:`, err)
          setError("Failed to load legal services")
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

  const handleOpenReviews = (business: any) => {
    setSelectedProvider({
      id: business.id,
      name: business.displayName || business.businessName || "Legal Professional",
      reviews: business.reviewsData || [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: any) => {
    setSelectedBusiness({
      id: business.id,
      name: business.displayName || business.businessName || "Legal Professional",
    })
    setIsProfileDialogOpen(true)
  }

  const hasExactSubcategoryMatch = (business: Business, filterValue: string): boolean => {
    const subcategories = business.subcategories || []
    const allSubcategories = business.allSubcategories || []
    const subcategory = business.subcategory || ""

    const allSubs = [...subcategories, ...allSubcategories, subcategory].filter(Boolean)

    return allSubs.some((sub) => getSubcategoryString(sub).toLowerCase().trim() === filterValue.toLowerCase().trim())
  }

  const handleFilterChange = (filterValue: string, checked: boolean) => {
    setSelectedFilters((prev) => (checked ? [...prev, filterValue] : prev.filter((f) => f !== filterValue)))
  }

  const applyFilters = () => {
    if (selectedFilters.length === 0) {
      setBusinesses(allBusinesses)
      setAppliedFilters([])
      toast({
        title: "Filters cleared",
        description: `Showing all ${allBusinesses.length} legal professionals`,
      })
      return
    }

    const filtered = allBusinesses.filter((business) =>
      selectedFilters.some((filter) => hasExactSubcategoryMatch(business, filter)),
    )

    setBusinesses(filtered)
    setAppliedFilters([...selectedFilters])
    toast({
      title: "Filters applied",
      description: `Found ${filtered.length} legal professionals matching your criteria`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setBusinesses(allBusinesses)
    toast({
      title: "Filters cleared",
      description: `Showing all ${allBusinesses.length} legal professionals`,
    })
  }

  return (
    <CategoryLayout title="Legal Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/lawyer001-5xlajuHkD91HvXOM2zWdKrtS2HONn3.png"
            alt="Legal Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified legal professionals in your area. Browse services below or use filters to narrow your search.
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

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter by Legal Specialties</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes(option.value)}
                onChange={(e) => handleFilterChange(option.value, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedFilters.length > 0 && (
              <span>
                {selectedFilters.length} filter{selectedFilters.length !== 1 ? "s" : ""} selected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={applyFilters} disabled={selectedFilters.length === 0} size="sm">
              Apply Filters
            </Button>
            {appliedFilters.length > 0 && (
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {appliedFilters.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Active filters:</span> {appliedFilters.join(", ")}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Showing {businesses.length} of {allBusinesses.length} legal professionals
              </p>
            </div>
          </div>
        </div>
      )}

      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Showing legal services for zip code:</span> {userZipCode}
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
          <p className="mt-2 text-gray-600">Loading legal professionals...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userZipCode ? `No Legal Professionals in ${userZipCode} Area` : "No Legal Professionals Yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `We're building our network of legal professionals in the ${userZipCode} area.`
                : "Be the first legal professional to join our platform and connect with potential clients in your area."}
            </p>
            <Button className="bg-slate-600 hover:bg-slate-700">Register Your Practice</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {businesses.map((provider: any) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {provider.displayName || provider.businessName || "Legal Professional"}
                    </h3>

                    {provider.businessDescription && (
                      <p className="text-gray-700 mb-3 leading-relaxed">{provider.businessDescription}</p>
                    )}

                    {provider.displayPhone && (
                      <div className="flex items-center mb-2">
                        <Phone className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          <a href={`tel:${provider.displayPhone}`} className="hover:text-blue-600 hover:underline">
                            {provider.displayPhone}
                          </a>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center mb-3">
                      <MapPin className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-600">
                        {provider.displayLocation || "Location not specified"}
                      </span>
                    </div>

                    {(provider.isNationwide || (provider.serviceArea && provider.serviceArea.length > 0)) && (
                      <div className="flex items-center text-gray-600 text-xs mt-1 mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                          {provider.isNationwide ? "Serves nationwide" : `Serves ${userZipCode} area`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(provider.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating || 0} ({provider.reviews || 0} reviews)
                      </span>
                    </div>

                    {provider.subcategories && provider.subcategories.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center mb-2">
                          <Tag className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium text-gray-700">Specialties:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {provider.subcategories.map((subcategory: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              {getSubcategoryString(subcategory)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-start md:items-end justify-start space-y-2">
                    <Button className="w-full md:w-auto min-w-[120px]" onClick={() => handleOpenReviews(provider)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full md:w-auto min-w-[120px]"
                      onClick={() => handleViewProfile(provider)}
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
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          businessId={selectedProvider.id}
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
