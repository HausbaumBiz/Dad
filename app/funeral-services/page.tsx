"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useState, useEffect } from "react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useToast } from "@/components/ui/use-toast"
import { Phone } from "lucide-react"
import { useUserZipCode } from "@/hooks/use-user-zipcode"
import { ZipCodeFilterIndicator } from "@/components/zip-code-filter-indicator"

// Format phone number for display
function formatPhoneNumber(phone: string): string {
  if (!phone) return "No phone provided"

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "")

  // Check if it's a valid 10-digit US phone number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  // Return original if not a standard format
  return phone
}

export default function FuneralServicesPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [debugDetails, setDebugDetails] = useState<any>(null)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const { zipCode, isLoading: zipCodeLoading } = useUserZipCode()

  useEffect(() => {
    const controller = new AbortController()

    async function fetchBusinesses() {
      // Skip fetch if zip code is still loading
      if (zipCodeLoading) {
        console.log("Zip code still loading, skipping fetch")
        return
      }

      // Skip fetch if no zip code is set
      if (!zipCode) {
        console.log("No zipCode set, skipping fetch")
        setBusinesses([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        console.log(`Fetching funeral-services businesses for zipCode: ${zipCode}`)

        const result = await getBusinessesForCategoryPage("/funeral-services", zipCode)

        // Check if request was aborted
        if (controller.signal.aborted) {
          console.log("Request was aborted")
          return
        }

        console.log(`Found ${result.length} funeral-services businesses for zipCode: ${zipCode}`)
        setBusinesses(result)
      } catch (error) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted")
          return
        }
        console.error("Error fetching businesses:", error)
        toast({
          title: "Error loading businesses",
          description: "There was a problem loading businesses. Please try again later.",
          variant: "destructive",
        })
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchBusinesses()

    return () => {
      controller.abort()
    }
  }, [zipCode, zipCodeLoading, toast])

  const handleOpenReviews = (providerName: string) => {
    setSelectedProvider(providerName)
    setIsReviewsOpen(true)
  }

  const handleOpenProfile = (providerId: string, providerName: string) => {
    console.log(`Opening profile for business ID: ${providerId}, name: ${providerName}`)
    setSelectedProviderId(providerId)
    setSelectedProvider(providerName)
    setIsProfileOpen(true)
  }

  const filterOptions = [
    { id: "funeral1", label: "Funeral Homes", value: "Funeral Homes" },
    { id: "funeral2", label: "Cemeteries", value: "Cemeteries" },
    { id: "funeral3", label: "Florists", value: "Florists" },
    { id: "funeral4", label: "Headstones/Monuments", value: "Headstones/Monuments" },
    { id: "funeral5", label: "Caskets and Urns", value: "Caskets and Urns" },
  ]

  return (
    <CategoryLayout title="Funeral Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/funeral-d3jRmRhs8rBZ2YN1inIrZFWmBn3SPi.png"
            alt="Funeral Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
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
              <li>Read reviews from other customers</li>
              <li>View business videos showcasing work and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you'd trust to hire yourself</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      <ZipCodeFilterIndicator businessCount={businesses.length} />

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : !zipCode ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-700">Set Your Location</h3>
            <p className="mt-2 text-gray-500">
              Please set your zip code to see funeral service providers in your area.
            </p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-700">No funeral service providers found</h3>
            <p className="mt-2 text-gray-500">
              There are currently no funeral service providers that service zip code {zipCode}.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => (window.location.href = "/business-register")}>
                Register Your Funeral Service Business
              </Button>
            </div>
          </div>
        ) : (
          businesses.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{provider.displayName || provider.businessName}</h3>

                    {/* City and State Information */}
                    <p className="text-gray-600 text-sm mt-1">
                      {provider.displayLocation || `${provider.city}, ${provider.state}`}
                    </p>

                    {/* Phone Number */}
                    {(provider.displayPhone || provider.phone) && (
                      <div className="flex items-center mt-1">
                        <Phone className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-600 text-sm">
                          {formatPhoneNumber(provider.displayPhone || provider.phone)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(provider.rating || 4.5) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating || 4.5} ({provider.reviews || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {provider.subcategories && provider.subcategories.length > 0 ? (
                          provider.subcategories.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Funeral Services
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button
                      className="w-full md:w-auto"
                      onClick={() => handleOpenReviews(provider.displayName || provider.businessName)}
                    >
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleOpenProfile(provider.id, provider.displayName || provider.businessName)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <ReviewsDialog
        isOpen={isReviewsOpen}
        onClose={() => setIsReviewsOpen(false)}
        providerName={selectedProvider || ""}
        businessId={selectedProviderId || ""}
        reviews={[]}
      />

      <BusinessProfileDialog
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        businessId={selectedProviderId || ""}
        businessName={selectedProvider || ""}
      />

      <Toaster />
    </CategoryLayout>
  )
}
