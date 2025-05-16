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
import { Loader2, AlertCircle } from "lucide-react"

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

  // Mock reviews data for when a real business is selected
  const mockReviews = [
    {
      id: 1,
      userName: "MikeT",
      rating: 5,
      comment: "Great service! They fixed my car quickly and at a fair price.",
      date: "2023-12-10",
    },
    {
      id: 2,
      userName: "SarahL",
      rating: 4,
      comment: "Good service overall. Professional and knowledgeable staff.",
      date: "2023-11-22",
    },
    {
      id: 3,
      userName: "DavidW",
      rating: 5,
      comment: "Excellent work! They diagnosed and fixed an issue that two other shops couldn't figure out.",
      date: "2023-10-15",
    },
  ]

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        setError(null)

        // Debug info to help diagnose issues
        const debugData = {
          categoryFormats: [],
          businessIdsByFormat: {},
          totalUniqueBusinessIds: 0,
          businessDetails: [],
        }

        // Fetch businesses from multiple category formats to ensure we get all automotive businesses
        const categoryFormats = [
          "automotive",
          "automotive-services",
          "automotiveServices",
          "Automotive Services",
          "Automotive/Motorcycle/RV",
          "automotive/motorcycle/rv",
          "automotive-motorcycle-rv",
          // Add the exact format with ", etc"
          "Automotive/Motorcycle/RV, etc",
          "automotive/motorcycle/rv, etc",
        ]

        debugData.categoryFormats = categoryFormats

        let allBusinessIds = []

        // Fetch business IDs from all category formats
        for (const format of categoryFormats) {
          try {
            console.log(`Fetching businesses for category format: ${format}`)
            const response = await fetch(`/api/businesses/by-category?category=${format}`)
            if (response.ok) {
              const data = await response.json()
              if (data.businesses && Array.isArray(data.businesses)) {
                debugData.businessIdsByFormat[format] = data.businesses.map((b) => b.id)
                allBusinessIds = [...allBusinessIds, ...data.businesses.map((b) => b.id)]
                console.log(`Found ${data.businesses.length} businesses for format ${format}`)
              } else {
                console.log(`No businesses found for format ${format}`)
                debugData.businessIdsByFormat[format] = []
              }
            } else {
              console.error(`Error response for format ${format}:`, response.status)
              debugData.businessIdsByFormat[format] = `Error: ${response.status}`
            }
          } catch (error) {
            console.error(`Error fetching businesses for category format ${format}:`, error)
            debugData.businessIdsByFormat[format] = `Error: ${error.message}`
          }
        }

        // Remove duplicates
        allBusinessIds = [...new Set(allBusinessIds)]
        debugData.totalUniqueBusinessIds = allBusinessIds.length
        console.log(`Total unique business IDs: ${allBusinessIds.length}`)

        if (allBusinessIds.length === 0) {
          // No businesses found - set empty array
          setProviders([])
          setDebugInfo(debugData)
        } else {
          // Fetch details for each business
          const businessDetailsPromises = allBusinessIds.map(async (id) => {
            try {
              console.log(`Fetching details for business ${id}`)
              const response = await fetch(`/api/businesses/${id}`)
              if (response.ok) {
                const business = await response.json()

                // Extract services from subcategories or use default
                let services = []
                if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
                  services = business.allSubcategories
                } else if (business.subcategory) {
                  services = [business.subcategory]
                }

                const businessDetail = {
                  id: business.id,
                  name: business.businessName || business.name || "Unknown Business",
                  services: services,
                  rating: business.rating || (Math.random() * 1 + 4).toFixed(1), // Random rating between 4.0 and 5.0
                  reviews: business.reviewCount || Math.floor(Math.random() * 150) + 50, // Random review count
                  location: business.city ? `${business.city}, ${business.state || "OH"}` : "Ohio",
                  category: business.category,
                  subcategory: business.subcategory,
                  allCategories: business.allCategories,
                  allSubcategories: business.allSubcategories,
                }

                debugData.businessDetails.push(businessDetail)
                return businessDetail
              }
              console.error(`Error response for business ${id}:`, response.status)
              return null
            } catch (error) {
              console.error(`Error fetching details for business ${id}:`, error)
              return null
            }
          })

          const businessDetails = await Promise.all(businessDetailsPromises)
          const validBusinesses = businessDetails.filter(Boolean)
          console.log(`Successfully fetched details for ${validBusinesses.length} businesses`)
          setProviders(validBusinesses)
          setDebugInfo(debugData)
        }
      } catch (error) {
        console.error("Error fetching automotive businesses:", error)
        setError("Failed to load automotive businesses. Please try again later.")
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  // Add a function to handle opening the reviews dialog
  const handleReviewsClick = (providerId) => {
    setSelectedProvider(providerId)
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
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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
                    <Button className="w-full md:w-auto" onClick={() => handleReviewsClick(provider.id)}>
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

          {/* Debug information for admins */}
          {debugInfo && (
            <details className="mt-8 text-left bg-gray-50 p-4 rounded-lg border">
              <summary className="font-medium cursor-pointer">Debug Information (Admin Only)</summary>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="font-medium">Category Formats Checked:</h4>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    {debugInfo.categoryFormats.map((format, index) => (
                      <li key={index}>{format}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Business IDs by Format:</h4>
                  <div className="mt-2 text-sm">
                    {Object.entries(debugInfo.businessIdsByFormat).map(([format, ids], index) => (
                      <div key={index} className="mb-2">
                        <strong>{format}:</strong>{" "}
                        {Array.isArray(ids) ? (ids.length > 0 ? ids.join(", ") : "No businesses found") : ids}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">Total Unique Business IDs: {debugInfo.totalUniqueBusinessIds}</h4>
                </div>

                {debugInfo.businessDetails.length > 0 && (
                  <div>
                    <h4 className="font-medium">Business Details:</h4>
                    <div className="mt-2 max-h-60 overflow-y-auto">
                      <pre className="text-xs whitespace-pre-wrap">
                        {JSON.stringify(debugInfo.businessDetails, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      )}

      {selectedProvider !== null && (
        <>
          <ReviewsDialog
            isOpen={isReviewsDialogOpen}
            onClose={() => setIsReviewsDialogOpen(false)}
            providerName={providers.find((p) => p.id === selectedProvider)?.name || ""}
            reviews={mockReviews}
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
