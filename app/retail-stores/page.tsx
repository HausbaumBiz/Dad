"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { getBusinessesByCategory } from "@/app/actions/business-actions"
import { useEffect } from "react"

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
  } | null>(null)

  // Remove the mock providers state and replace with real data fetching
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        setError(null)

        // Try multiple category formats to find businesses
        const categoryVariants = ["Retail Stores", "retail-stores", "Shopping", "Retail"]

        let allBusinesses: any[] = []

        for (const category of categoryVariants) {
          try {
            const businesses = await getBusinessesByCategory(category)
            if (businesses && businesses.length > 0) {
              allBusinesses = [...allBusinesses, ...businesses]
            }
          } catch (err) {
            console.log(`No businesses found for category: ${category}`)
          }
        }

        // Remove duplicates based on business ID
        const uniqueBusinesses = allBusinesses.filter(
          (business, index, self) => index === self.findIndex((b) => b.id === business.id),
        )

        setProviders(uniqueBusinesses)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses")
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
              <li>Read reviews from other customers</li>
              <li>View business videos showcasing work and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you frequent yourself</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading retail stores...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Retail Stores Yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first retail store to join our platform and connect with local customers in your area.
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700">Register Your Store</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.location || "Location not specified"}</p>

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(provider.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating || 0} ({provider.reviewCount || 0} reviews)
                      </span>
                    </div>

                    {provider.services && provider.services.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Store Type:</p>
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
                    )}
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider)}>
                      Reviews
                    </Button>
                    <Button variant="outline" className="mt-2 w-full md:w-auto">
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
          reviews={selectedProvider.reviewsData}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
