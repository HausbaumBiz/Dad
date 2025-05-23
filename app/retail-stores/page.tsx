"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { Loader2 } from "lucide-react"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"

export default function RetailStoresPage() {
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
    businessData: any
  } | null>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // State for providers
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch businesses
  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/businesses/by-page?page=retail-stores")
        if (response.ok) {
          const data = await response.json()
          if (data.businesses && data.businesses.length > 0) {
            console.log(`Found ${data.businesses.length} businesses for retail-stores page`)

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
                rating: business.rating || (Math.random() * 1 + 4).toFixed(1), // Random rating between 4.0 and 5.0
                reviews: business.reviewCount || Math.floor(Math.random() * 50) + 10, // Random review count
                location: business.city ? `${business.city}, ${business.state || "OH"}` : "Ohio",
                reviewsData: business.reviews || [], // Use actual reviews if available
                businessData: business, // Store the full business data
              }
            })

            setProviders(businessDetails)
          } else {
            console.log("No businesses found for retail-stores page")
            setProviders([])
          }
        } else {
          console.error("Error fetching businesses:", response.statusText)
          setError("Failed to load businesses. Please try again later.")
          setProviders([])
        }
      } catch (error) {
        console.error("Error fetching businesses:", error)
        setError("An unexpected error occurred. Please try again later.")
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
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
              <li>Discover local and independent retailers</li>
              <li>Read customer reviews before shopping</li>
              <li>Find special offers and promotions</li>
              <li>Support businesses in your community</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading retail stores...</span>
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-4">No retail stores found in your area.</p>
          <p className="text-gray-500 mb-6">Be the first to list your retail business!</p>
          <Button onClick={() => (window.location.href = "/business-register")}>Register Your Business</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((provider) => (
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
                            className={`w-4 h-4 ${i < Math.floor(Number(provider.rating)) ? "text-yellow-400" : "text-gray-300"}`}
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
                      <p className="text-sm font-medium text-gray-700">Store Type:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {provider.services.slice(0, 3).map((service: string, idx: number) => (
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
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleOpenProfile(provider)}
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
        <>
          <ReviewsDialog
            isOpen={isReviewsDialogOpen}
            onClose={() => setIsReviewsDialogOpen(false)}
            providerName={selectedProvider.name}
            reviews={selectedProvider.reviewsData || []}
          />

          {isProfileDialogOpen && (
            <BusinessProfileDialog
              isOpen={isProfileDialogOpen}
              onClose={() => setIsProfileDialogOpen(false)}
              business={selectedProvider.businessData}
            />
          )}
        </>
      )}

      <Toaster />
    </CategoryLayout>
  )
}
