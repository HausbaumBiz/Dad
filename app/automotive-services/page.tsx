"use client"

import { useState, useEffect } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AutomotiveServicesPage() {
  const filterOptions = [
    { id: "auto1", label: "General Auto Repair", value: "General Auto Repair" },
    { id: "auto2", label: "Engine and Transmission", value: "Engine and Transmission" },
    { id: "auto3", label: "Body Shop", value: "Body Shop" },
    { id: "auto4", label: "Tire and Brakes", value: "Tire and Brakes" },
    { id: "auto5", label: "Mufflers", value: "Mufflers" },
    { id: "auto6", label: "Oil Change", value: "Oil Change" },
    { id: "auto7", label: "Windshield Repair", value: "Windshield Repair" },
    { id: "auto8", label: "Custom Paint", value: "Custom Paint" },
    { id: "auto9", label: "Detailing Services", value: "Detailing Services" },
    { id: "auto10", label: "Car Wash", value: "Car Wash" },
    { id: "auto11", label: "Auto Parts", value: "Auto Parts" },
    { id: "auto12", label: "ATV/Motorcycle Repair", value: "ATV/Motorcycle Repair" },
    { id: "auto13", label: "Utility Vehicle Repair", value: "Utility Vehicle Repair" },
    { id: "auto14", label: "RV Maintenance and Repair", value: "RV Maintenance and Repair" },
    { id: "auto15", label: "Other Automotive Services", value: "Other Automotive Services" },
  ]

  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState([])
  const [error, setError] = useState(null)
  const [debugInfo, setDebugInfo] = useState(null)
  const [showDebug, setShowDebug] = useState(false)

  // Update the useEffect hook that fetches businesses
  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        setError(null)

        // Use the new API endpoint with cache busting
        const timestamp = Date.now()
        const response = await fetch(`/api/businesses/by-page?page=automotive-services&debug=true&t=${timestamp}`)

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`)
        }

        const data = await response.json()
        console.log("API response:", data)

        if (data.businesses && data.businesses.length > 0) {
          // Process business details
          const businessDetails = data.businesses.map((business: any) => {
            // Extract services from subcategories or use default
            let services = []
            if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
              services = business.allSubcategories
            } else if (business.subcategory) {
              services = [business.subcategory]
            }

            return {
              id: business.id,
              name: business.businessName || business.name || "Unknown Business",
              services: services,
              rating: business.rating || 0,
              reviews: business.reviewCount || 0,
              location: business.city ? `${business.city}, ${business.state || "OH"}` : "Ohio",
              category: business.category,
              subcategory: business.subcategory,
              allCategories: business.allCategories,
              allSubcategories: business.allSubcategories,
            }
          })

          setProviders(businessDetails)
          setDebugInfo({
            source: "page:businesses API",
            totalFound: data.totalFound,
            realBusinesses: data.realBusinesses,
            timestamp: data.timestamp,
            debug: data.debug,
          })
        } else {
          setProviders([])
          setDebugInfo({
            source: "page:businesses API - no businesses found",
            message: data.message,
            timestamp: data.timestamp,
          })
        }
      } catch (error) {
        console.error("Error fetching automotive businesses:", error)
        setError("Failed to load automotive businesses. Please try again later.")
        setProviders([])
        setDebugInfo({
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  // Add a function to handle opening the reviews dialog
  const handleReviewsClick = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  // Add a function to handle opening the profile dialog
  const handleProfileClick = (providerId) => {
    setSelectedProvider(providerId)
    setIsProfileDialogOpen(true)
  }

  // Filter providers based on selected filters
  const filteredProviders =
    selectedFilters.length > 0
      ? providers.filter((provider) =>
          provider.services.some(
            (service) =>
              selectedFilters.includes(service) ||
              selectedFilters.some((filter) => service.toLowerCase().includes(filter.toLowerCase())),
          ),
        )
      : providers

  return (
    <CategoryLayout title="Automotive Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/auto-mQWtZXyRogQgO5qlNVcR1OYcyDqe59.png"
            alt="Automotive Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified automotive professionals for all your vehicle needs. Browse services below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Verified local mechanics and auto professionals</li>
              <li>Compare quotes from multiple service providers</li>
              <li>Read customer reviews before hiring</li>
              <li>Book appointments online</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} onFilterChange={(filters) => setSelectedFilters(filters)} />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading automotive service providers...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <p className="text-red-500 font-medium">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      ) : filteredProviders.length > 0 ? (
        <div className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700">
              Showing {filteredProviders.length} automotive service providers
              {selectedFilters.length > 0 ? ` matching your selected filters` : ""}
            </AlertDescription>
          </Alert>

          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(provider.rating) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-.181h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating} ({provider.reviews} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {provider.services.slice(0, 3).map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {service}
                          </span>
                        ))}
                        {provider.services.length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{provider.services.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleReviewsClick(provider)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleProfileClick(provider.id)}
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
        <div className="text-center py-12 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-medium text-amber-800 mb-2">No Automotive Businesses Found</h3>
            <p className="text-amber-700">
              There are currently no automotive service providers registered in this category.
            </p>
            <div className="mt-4 p-4 bg-white rounded border border-amber-100">
              <p className="text-gray-700 font-medium">Are you an automotive service provider?</p>
              <p className="text-gray-600 mt-1">
                Register your business on Hausbaum to reach more customers in your area.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Business</a>
              </Button>
            </div>
          </div>

          {selectedFilters.length > 0 && (
            <div>
              <p className="text-gray-500">No results match your selected filters.</p>
              <Button variant="outline" className="mt-2" onClick={() => setSelectedFilters([])}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="mt-8">
        <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)}>
          {showDebug ? "Hide Debug Info" : "Show Debug Info"}
        </Button>

        {showDebug && debugInfo && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border text-sm">
            <h4 className="font-medium mb-2">Debug Information:</h4>
            <pre className="whitespace-pre-wrap overflow-x-auto">{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        )}
      </div>

      {selectedProvider !== null && (
        <>
          <ReviewsDialog
            isOpen={isReviewsDialogOpen}
            onClose={() => setIsReviewsDialogOpen(false)}
            providerName={selectedProvider ? selectedProvider.name : ""}
            businessId={selectedProvider ? selectedProvider.id : ""}
            reviews={[]}
          />

          <BusinessProfileDialog
            isOpen={isProfileDialogOpen}
            onClose={() => setIsProfileDialogOpen(false)}
            businessId={selectedProvider}
            businessName={providers.find((p) => p.id === selectedProvider)?.name || ""}
          />
        </>
      )}

      <Toaster />
    </CategoryLayout>
  )
}
