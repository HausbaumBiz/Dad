"use client"

import { useState, useEffect, useRef } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2, MapPin, Phone } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useUserZipCode } from "@/hooks/use-user-zipcode"
import { ZipCodeFilterIndicator } from "@/components/zip-code-filter-indicator"

interface Business {
  id: string
  displayName: string
  businessName: string
  displayLocation: string
  displayPhone: string
  allSubcategories?: string[]
  subcategory?: string
  rating?: number
  reviews?: number
}

export default function FinancialServicesPage() {
  const { toast } = useToast()
  const { zipCode, hasZipCode } = useUserZipCode()

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

  // Use refs to track the current request and prevent race conditions
  const abortControllerRef = useRef<AbortController | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Skip the first render if zipCode is null (initial state)
    if (isInitialMount.current && zipCode === null) {
      console.log("[PAGE] Skipping initial fetch with null zipCode")
      isInitialMount.current = false
      setIsLoading(false)
      return
    }

    isInitialMount.current = false

    async function fetchBusinesses() {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      setIsLoading(true)

      try {
        console.log(`[PAGE] Fetching businesses with zipCode: "${zipCode}", hasZipCode: ${hasZipCode}`)

        // Only pass zipCode if it exists and is not empty
        const zipCodeToUse = hasZipCode && zipCode && zipCode.trim() !== "" ? zipCode : undefined
        console.log(`[PAGE] Using zipCode for API call: "${zipCodeToUse}"`)

        const result = await getBusinessesForCategoryPage("/financial-services", zipCodeToUse)

        // Check if request was aborted
        if (signal.aborted) {
          console.log("[PAGE] Request was aborted")
          return
        }

        console.log(`[PAGE] API returned ${result.length} businesses`)
        setBusinesses(result)
      } catch (error) {
        if (signal.aborted) {
          console.log("[PAGE] Request was aborted during error handling")
          return
        }
        console.error("[PAGE] Error fetching businesses:", error)
        toast({
          title: "Error loading businesses",
          description: "There was a problem loading businesses. Please try again later.",
          variant: "destructive",
        })
      } finally {
        if (!signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchBusinesses()

    // Cleanup function to abort request on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [zipCode, hasZipCode, toast])

  const filteredBusinesses = selectedFilter
    ? businesses.filter((business) => {
        if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
          return business.allSubcategories.some((sub: string) =>
            sub.toLowerCase().includes(selectedFilter.toLowerCase()),
          )
        }
        if (business.subcategory) {
          return business.subcategory.toLowerCase().includes(selectedFilter.toLowerCase())
        }
        return false
      })
    : businesses

  const handleOpenReviews = (provider: Business) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: Business) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value === selectedFilter ? null : value)
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

      <ZipCodeFilterIndicator businessCount={filteredBusinesses.length} />

      <CategoryFilter options={filterOptions} selectedValue={selectedFilter} onChange={handleFilterChange} />

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
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
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

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(business.rating || 4.5) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {business.rating || 4.5} ({business.reviews || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {business.allSubcategories && business.allSubcategories.length > 0 ? (
                          business.allSubcategories.map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {business.subcategory || "Financial Services"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(business)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
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
            <h3 className="text-xl font-medium text-emerald-800 mb-2">
              {hasZipCode
                ? `No Financial Service Providers Found in ${zipCode}`
                : "No Financial Service Providers Found"}
            </h3>
            <p className="text-emerald-700 mb-4">
              {hasZipCode
                ? `We're building our network of licensed financial professionals in the ${zipCode} area.`
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
