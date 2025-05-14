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
import { getBusinessesByCategory } from "@/app/actions/business-actions"
import { Badge } from "@/components/ui/badge"

export default function FuneralServicesPage() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [debugDetails, setDebugDetails] = useState<any>(null)

  useEffect(() => {
    async function loadBusinesses() {
      try {
        setLoading(true)

        // Try both category formats to be sure
        const businesses = await getBusinessesByCategory("Mortuary Services")
        console.log(`Loaded ${businesses.length} mortuary services businesses`)

        // Store debug information
        setDebugDetails({
          totalBusinesses: businesses.length,
          businesses: businesses.map((b) => ({
            id: b.id,
            name: b.businessName,
            category: b.category,
            zipCode: b.zipCode,
            city: b.city,
            state: b.state,
            allSubcategories: b.allSubcategories || [],
          })),
        })

        // Get categories for each business
        const formattedBusinesses = await Promise.all(
          businesses.map(async (business) => {
            // Use the city and state from the business record
            const city = business.city || "Unknown City"
            const state = business.state || "OH"

            // First check if business has allSubcategories field
            let services: string[] = []

            if (
              business.allSubcategories &&
              Array.isArray(business.allSubcategories) &&
              business.allSubcategories.length > 0
            ) {
              // Use allSubcategories directly
              services = business.allSubcategories
              console.log(`Using allSubcategories for ${business.businessName}:`, services)
            } else {
              // Fallback to fetching from API
              try {
                const response = await fetch(`/api/admin/business/${business.id}/categories`)
                if (response.ok) {
                  const categoriesData = await response.json()
                  console.log(`Categories for ${business.businessName}:`, categoriesData)

                  // The API returns the categories directly as an array
                  if (Array.isArray(categoriesData) && categoriesData.length > 0) {
                    services = categoriesData.map((cat) => {
                      // Extract the name from the category object
                      if (typeof cat === "string") {
                        return cat
                      } else if (cat && typeof cat === "object") {
                        return cat.name || cat.id || "Funeral Service"
                      }
                      return "Funeral Service"
                    })
                  }
                }
              } catch (error) {
                console.error(`Error fetching categories for business ${business.id}:`, error)
              }
            }

            // If we still don't have any services, use default
            if (services.length === 0) {
              services = ["Funeral Services"]
            }

            return {
              id: business.id,
              name: business.businessName,
              services: services,
              rating: business.rating || 4.5,
              reviews: business.reviews || Math.floor(Math.random() * 50) + 10,
              location: `${city}, ${state}`,
              zipCode: business.zipCode || "Not specified",
              serviceArea: business.serviceArea || [],
              reviewsData: business.reviewsData || [],
            }
          }),
        )

        setProviders(formattedBusinesses)
        setDebugInfo(`Found ${businesses.length} funeral businesses in the database.`)

        if (formattedBusinesses.length === 0) {
          console.log("No mortuary services businesses found")
          setDebugInfo(
            "No funeral businesses found in the database. You may want to add some from the admin panel or fix the category indexing at /admin/fix-categories.",
          )
        }
      } catch (error) {
        console.error("Error loading funeral service businesses:", error)
        setDebugInfo(`Error: ${error instanceof Error ? error.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    loadBusinesses()
  }, [])

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
              <li>Respectful and professional service providers</li>
              <li>Read reviews from other families</li>
              <li>Compare services and options</li>
              <li>Find the right support during difficult times</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      {/* Debug information - only visible in development */}
      {process.env.NODE_ENV !== "production" && debugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-6">
          <h4 className="font-medium text-yellow-800">Debug Information:</h4>
          <p className="text-sm text-yellow-700">{debugInfo}</p>

          {debugDetails && (
            <div className="mt-2">
              <details>
                <summary className="cursor-pointer text-sm font-medium text-yellow-800">Show Details</summary>
                <pre className="mt-2 bg-yellow-100 p-2 rounded text-xs overflow-auto">
                  {JSON.stringify(debugDetails, null, 2)}
                </pre>
              </details>
            </div>
          )}

          <div className="mt-2">
            <Button variant="outline" size="sm" onClick={() => (window.location.href = "/admin/fix-categories")}>
              Go to Category Fix Tool
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-700">No funeral service providers found</h3>
            <p className="mt-2 text-gray-500">
              There are currently no funeral service providers registered in this category.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => (window.location.href = "/business-register")}>
                Register Your Funeral Service Business
              </Button>
              {process.env.NODE_ENV !== "production" && (
                <Button
                  variant="outline"
                  className="ml-2"
                  onClick={() => (window.location.href = "/admin/fix-categories")}
                >
                  Fix Category Indexing
                </Button>
              )}
            </div>
          </div>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{provider.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

                    {/* ZIP Code Information */}
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Primary ZIP Code:</p>
                      <Badge variant="outline" className="mt-1">
                        {provider.zipCode}
                      </Badge>
                    </div>

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
                        {provider.services.map((service, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider.name)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleOpenProfile(provider.id, provider.name)}
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
        reviews={selectedProvider && providers.length > 0 ? [] : []}
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
