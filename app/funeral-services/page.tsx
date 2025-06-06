"use client"

import { useState, useEffect, useRef } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"
import { Phone, MapPin, Tag } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { toast } from "@/components/ui/use-toast"

// Enhanced Business interface
interface Business {
  id: string
  businessName?: string
  displayName?: string
  displayPhone?: string
  displayLocation?: string
  rating?: number
  reviews?: number
  subcategories?: string[]
  businessDescription?: string
  zipCode?: string
  serviceArea?: string[]
  adDesignData?: {
    businessInfo?: {
      phone?: string
      city?: string
      state?: string
    }
  }
  allSubcategories?: string[]
  subcategory?: string
}

// Helper function to check if business serves a zip code
const businessServesZipCode = (business: Business, zipCode: string): boolean => {
  // If business has no service area defined, fall back to primary zip code
  if (!business.serviceArea || business.serviceArea.length === 0) {
    return business.zipCode === zipCode
  }

  // Check if business serves nationwide (indicated by having "nationwide" in service area)
  if (business.serviceArea.some((area) => area.toLowerCase().includes("nationwide"))) {
    return true
  }

  // Check if the zip code is in the business's service area
  return business.serviceArea.includes(zipCode)
}

export default function FuneralServicesPage() {
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "funeral1", label: "Funeral Homes", value: "Funeral Homes" },
    { id: "funeral2", label: "Cremation Services", value: "Cremation Services" },
    { id: "funeral3", label: "Memorial Services", value: "Memorial Services" },
    { id: "funeral4", label: "Burial Services", value: "Burial Services" },
    { id: "funeral5", label: "Pre-Planning Services", value: "Pre-Planning Services" },
    { id: "funeral6", label: "Grief Counseling", value: "Grief Counseling" },
    { id: "funeral7", label: "Cemetery Services", value: "Cemetery Services" },
    { id: "funeral8", label: "Monument & Headstone Services", value: "Monument & Headstone Services" },
    { id: "funeral9", label: "Florists", value: "Florists" },
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
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])

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

        console.log(`[Funeral Services] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

        const fetchedBusinesses = await getBusinessesForCategoryPage("/funeral-services")

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Funeral Services] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Funeral Services] Fetch ${currentFetchId} completed, got ${fetchedBusinesses.length} businesses`)

        // Filter by zip code if available
        let filteredBusinesses = fetchedBusinesses
        if (userZipCode) {
          console.log(`[Funeral Services] Filtering by zip code: ${userZipCode}`)
          filteredBusinesses = fetchedBusinesses.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Funeral Services] Business ${business.displayName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              {
                serviceArea: business.serviceArea,
                primaryZip: business.zipCode,
              },
            )
            return serves
          })
          console.log(`[Funeral Services] After filtering: ${filteredBusinesses.length} businesses`)
        }

        setBusinesses(filteredBusinesses)
        setAllBusinesses(filteredBusinesses)
      } catch (err) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Funeral Services] Error in fetch ${currentFetchId}:`, err)
          setError("Failed to load funeral services")
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

  const handleOpenReviews = (business: Business) => {
    setSelectedProvider({
      id: business.id,
      name: business.displayName || business.businessName || "Funeral Service Provider",
      reviews: business.reviews ? [business.reviews] : [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: Business) => {
    setSelectedBusiness({
      id: business.id,
      name: business.displayName || business.businessName || "Funeral Service Provider",
    })
    setIsProfileDialogOpen(true)
  }

  const hasExactSubcategoryMatch = (business: Business, filterValue: string): boolean => {
    const subcategories = business.subcategories || []
    const allSubcategories = business.allSubcategories || []
    const subcategory = business.subcategory || ""

    const allSubs = [...subcategories, ...allSubcategories, subcategory].filter(Boolean)

    return allSubs.some((sub) => sub.toLowerCase().trim() === filterValue.toLowerCase().trim())
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
        description: `Showing all ${allBusinesses.length} funeral service providers`,
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
      description: `Found ${filtered.length} funeral service providers matching your criteria`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setBusinesses(allBusinesses)
    toast({
      title: "Filters cleared",
      description: `Showing all ${allBusinesses.length} funeral service providers`,
    })
  }

  return (
    <CategoryLayout title="Funeral Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/funeral02-ucBlsKFT249wL1nxpps7j52TtTVUcy.png"
            alt="Funeral Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
            onError={(e) => {
              // Fallback to a placeholder if image fails to load
              e.currentTarget.src = "/placeholder.svg?height=500&width=500&text=Funeral+Services"
            }}
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find compassionate funeral service providers in your area. Browse services below or use filters to narrow
            your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read reviews from other families</li>
              <li>View business videos showcasing facilities and staff</li>
              <li>Access information directly on each business listing</li>
              <li>Connect with trusted funeral service providers</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Filter by Services</h3>
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
                Showing {businesses.length} of {allBusinesses.length} funeral service providers
              </p>
            </div>
          </div>
        </div>
      )}

      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Showing funeral services for zip code:</span> {userZipCode}
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
          <p className="mt-2 text-gray-600">Loading funeral service providers...</p>
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userZipCode ? `No Funeral Services in ${userZipCode} Area` : "No Funeral Service Providers Yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `We're building our network of funeral service providers in the ${userZipCode} area.`
                : "Be the first funeral service provider to join our platform and connect with families in your area."}
            </p>
            <Button className="bg-slate-600 hover:bg-slate-700">Register Your Funeral Home</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {businesses.map((provider: Business) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {provider.displayName || provider.businessName || "Funeral Service Provider"}
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

                    {provider.serviceArea && provider.serviceArea.length > 0 && (
                      <div className="flex items-center text-gray-600 text-xs mb-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                          {provider.serviceArea.some((area) => area.toLowerCase().includes("nationwide"))
                            ? "Serves nationwide"
                            : `Serves ${userZipCode} area`}
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
                          <span className="text-sm font-medium text-gray-700">Services:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {provider.subcategories.map((subcategory: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              {subcategory}
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
