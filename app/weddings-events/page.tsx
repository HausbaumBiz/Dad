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
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Business {
  id: string
  name: string
  businessName?: string
  description?: string
  category?: string
  subcategory?: string
  allCategories?: string[]
  allSubcategories?: string[]
  address?: string
  city?: string
  state?: string
  zipCode?: string
  phone?: string
  email?: string
  website?: string
  rating?: number
  reviews?: number
  services?: string[]
  location?: string
}

export default function WeddingsEventsPage() {
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Business | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const { toast } = useToast()

  const filterOptions = [
    { id: "weddings1", label: "Event Halls", value: "Event Halls" },
    { id: "weddings2", label: "Tent and Chair Rentals", value: "Tent and Chair Rentals" },
    { id: "weddings3", label: "Wedding Planners", value: "Wedding Planners" },
    { id: "weddings4", label: "Food Caterers", value: "Food Caterers" },
    { id: "weddings5", label: "Bartenders", value: "Bartenders" },
    { id: "weddings6", label: "Live Music Entertainment", value: "Live Music Entertainment" },
    { id: "weddings7", label: "DJs", value: "DJs" },
    { id: "weddings8", label: "Performers", value: "Performers" },
    { id: "weddings9", label: "Tuxedo Rentals", value: "Tuxedo Rentals" },
    { id: "weddings10", label: "Limousine Services", value: "Limousine Services" },
    { id: "weddings11", label: "Tailors and Seamstresses", value: "Tailors and Seamstresses" },
    { id: "weddings12", label: "Wedding Dresses", value: "Wedding Dresses" },
    { id: "weddings13", label: "Wedding Photographers", value: "Wedding Photographers" },
    { id: "weddings14", label: "Florists", value: "Florists" },
    { id: "weddings15", label: "Wedding Cakes", value: "Wedding Cakes" },
    { id: "weddings16", label: "Marriage Officiants", value: "Marriage Officiants" },
    { id: "weddings17", label: "Other Weddings and Special Events", value: "Other Weddings and Special Events" },
  ]

  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/businesses/by-category?category=weddings-events`)
        if (!response.ok) {
          throw new Error("Failed to fetch businesses")
        }
        const data = await response.json()
        console.log("Fetched businesses data:", data.businesses)

        // Process businesses to add services array based on subcategories
        const processedBusinesses = data.businesses.map((business: Business) => {
          // Extract services from subcategories
          const services = business.allSubcategories || []

          // Add location string
          const location =
            business.city && business.state
              ? `${business.city}, ${business.state}`
              : business.city || business.state || "Location not specified"

          // Ensure business has a name (use businessName as fallback)
          const name = business.name || business.businessName || "Unnamed Business"

          return {
            ...business,
            name,
            services,
            location,
            rating: business.rating || 4.5, // Default rating if not provided
            reviews: business.reviews || 0, // Default reviews count if not provided
          }
        })

        console.log("Processed businesses:", processedBusinesses)
        setBusinesses(processedBusinesses)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load wedding and event businesses. Please try again later.")
        toast({
          title: "Error",
          description: "Failed to load businesses. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [toast])

  // Filter businesses based on selected filter
  const filteredBusinesses = activeFilter
    ? businesses.filter((business) =>
        business.services?.some((service) => service.toLowerCase() === activeFilter.toLowerCase()),
      )
    : businesses

  const handleOpenReviews = (provider: Business) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: Business) => {
    console.log("Opening profile for:", provider)
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  const handleFilterChange = (value: string | null) => {
    setActiveFilter(value)
  }

  return (
    <CategoryLayout title="Weddings and Special Events" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/bride-70qH10P5dCi9LToSGdSHJrq7uHD40e.png"
            alt="Weddings and Events"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified wedding and event professionals in your area. Browse services below or use filters to narrow
            your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Experienced and professional event vendors</li>
              <li>Read reviews from other clients</li>
              <li>Compare services and rates</li>
              <li>Find everything you need for your special day in one place</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} activeFilter={activeFilter} />

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading wedding and event professionals...</span>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <h3 className="text-xl font-medium text-red-600 mb-2">Error</h3>
            <p className="text-gray-700">{error}</p>
          </div>
        ) : filteredBusinesses.length > 0 ? (
          filteredBusinesses.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {provider.name || provider.businessName || "Unnamed Business"}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

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
                        {provider.rating || 0} ({provider.reviews || 0} reviews)
                      </span>
                    </div>

                    {provider.services && provider.services.length > 0 && (
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
                    )}
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button
                      className="w-full md:w-auto"
                      onClick={() => handleOpenReviews(provider)}
                      disabled={!provider.reviews || provider.reviews === 0}
                    >
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
          ))
        ) : (
          <div className="text-center py-10">
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              {activeFilter
                ? `No wedding or event providers found for "${activeFilter}"`
                : "No wedding or event providers listed yet"}
            </h3>
            <p className="text-gray-500">
              {activeFilter
                ? "Try selecting a different filter or check back later."
                : "Check back soon for wedding and event professionals in your area."}
            </p>
          </div>
        )}
      </div>

      {selectedProvider && (
        <>
          <ReviewsDialog
            isOpen={isReviewsDialogOpen}
            onClose={() => setIsReviewsDialogOpen(false)}
            providerName={selectedProvider.name || selectedProvider.businessName || "Unnamed Business"}
            reviews={[]} // We'll need to fetch reviews from an API in a real implementation
          />

          <BusinessProfileDialog
            isOpen={isProfileDialogOpen}
            onClose={() => setIsProfileDialogOpen(false)}
            businessId={selectedProvider.id}
            businessName={selectedProvider.name || selectedProvider.businessName || "Unnamed Business"}
          />
        </>
      )}

      <Toaster />
    </CategoryLayout>
  )
}
