"use client"

import type React from "react"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2 } from "lucide-react"

interface Business {
  id: string
  businessName: string
  services: string[]
  rating: number
  reviews: number
  location: string
  reviewsData?: any[]
}

export default function FoodDiningPage() {
  const { toast } = useToast()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<Business | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProfileBusiness, setSelectedProfileBusiness] = useState<Business | null>(null)

  const filterOptions = [
    { id: "restaurant1", label: "Asian", value: "Asian" },
    { id: "restaurant2", label: "Indian", value: "Indian" },
    { id: "restaurant3", label: "Middle Eastern", value: "Middle Eastern" },
    { id: "restaurant4", label: "Mexican", value: "Mexican" },
    { id: "restaurant5", label: "Italian", value: "Italian" },
    { id: "restaurant6", label: "American", value: "American" },
    { id: "restaurant7", label: "Greek", value: "Greek" },
    { id: "restaurant8", label: "Other Ethnic Foods", value: "Other Ethnic Foods" },
    { id: "restaurant9", label: "Upscale", value: "Upscale" },
    { id: "restaurant10", label: "Casual", value: "Casual" },
    { id: "restaurant11", label: "Coffee and Tea Shops", value: "Coffee and Tea Shops" },
    { id: "restaurant12", label: "Ice Cream, Confectionery and Cakes", value: "Ice Cream, Confectionery and Cakes" },
    { id: "restaurant13", label: "Pizzeria", value: "Pizzeria" },
    { id: "restaurant14", label: "Bars/Pubs/Taverns", value: "Bars/Pubs/Taverns" },
    {
      id: "restaurant15",
      label: "Organic/Vegan/Vegetarian/Farm to table",
      value: "Organic/Vegan/Vegetarian/Farm to table",
    },
  ]

  // Fetch businesses from the API
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch("/api/businesses/by-page?page=food-dining")

        if (!response.ok) {
          throw new Error(`Failed to fetch businesses: ${response.status}`)
        }

        const data = await response.json()

        if (data.success && data.businesses) {
          setBusinesses(data.businesses)
        } else {
          console.warn("No businesses found for food-dining page")
          setBusinesses([])
        }
      } catch (error) {
        console.error("Error fetching businesses:", error)
        setError(error instanceof Error ? error.message : "Failed to load businesses")

        toast({
          title: "Error loading businesses",
          description: "Failed to load food and dining businesses. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [toast])

  const handleOpenReviews = (provider: Business) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: Business, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setSelectedProfileBusiness(provider)
    setIsProfileDialogOpen(true)
  }

  const retryFetch = () => {
    setError(null)
    // Re-trigger the useEffect
    window.location.reload()
  }

  if (loading) {
    return (
      <CategoryLayout title="Food & Dining" backLink="/" backText="Categories">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="flex justify-center">
            <Image
              src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/food%20service-Dz8Ysy9mwKkqz0nqDYzsqbRGOGvEFy.png"
              alt="Food and Dining"
              width={500}
              height={500}
              className="rounded-lg shadow-lg max-w-full h-auto"
            />
          </div>

          <div className="space-y-6">
            <p className="text-lg text-gray-700">
              Find restaurants and dining options in your area. Browse options below or use filters to narrow your
              search.
            </p>

            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Discover local restaurants and dining options</li>
                <li>Read reviews from other diners</li>
                <li>Browse menus and special offers</li>
                <li>Find the perfect dining experience for any occasion</li>
              </ul>
            </div>
          </div>
        </div>

        <CategoryFilter options={filterOptions} />

        {/* Loading skeletons */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded mb-2 w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2 w-1/2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-2/3 animate-pulse"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col gap-2">
                    <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Toaster />
      </CategoryLayout>
    )
  }

  if (error) {
    return (
      <CategoryLayout title="Food & Dining" backLink="/" backText="Categories">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="flex justify-center">
            <Image
              src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/food%20service-Dz8Ysy9mwKkqz0nqDYzsqbRGOGvEFy.png"
              alt="Food and Dining"
              width={500}
              height={500}
              className="rounded-lg shadow-lg max-w-full h-auto"
            />
          </div>

          <div className="space-y-6">
            <p className="text-lg text-gray-700">
              Find restaurants and dining options in your area. Browse options below or use filters to narrow your
              search.
            </p>

            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Discover local restaurants and dining options</li>
                <li>Read reviews from other diners</li>
                <li>Browse menus and special offers</li>
                <li>Find the perfect dining experience for any occasion</li>
              </ul>
            </div>
          </div>
        </div>

        <CategoryFilter options={filterOptions} />

        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <p className="text-lg font-semibold">Error loading businesses</p>
            <p className="text-sm">{error}</p>
          </div>
          <Button onClick={retryFetch} variant="outline">
            <Loader2 className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>

        <Toaster />
      </CategoryLayout>
    )
  }

  return (
    <CategoryLayout title="Food & Dining" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/food%20service-Dz8Ysy9mwKkqz0nqDYzsqbRGOGvEFy.png"
            alt="Food and Dining"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find restaurants and dining options in your area. Browse options below or use filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Discover local restaurants and dining options</li>
              <li>Read reviews from other diners</li>
              <li>Browse menus and special offers</li>
              <li>Find the perfect dining experience for any occasion</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      {businesses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-600 mb-4">
            <p className="text-lg font-semibold">No food and dining businesses found</p>
            <p className="text-sm">Be the first to register your restaurant or food business!</p>
          </div>
          <Button variant="default" onClick={() => window.open("/business-register", "_blank")}>
            Register Your Business
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {businesses.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.businessName}</h3>
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

                    {provider.services && provider.services.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Categories:</p>
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
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={(e) => handleOpenProfile(provider, e)}
                      data-business-id={provider.id}
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

      {/* Reviews Dialog */}
      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.businessName}
          businessId={selectedProvider.id}
          reviews={selectedProvider.reviewsData || []}
        />
      )}

      {/* Business Profile Dialog */}
      {selectedProfileBusiness && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProfileBusiness.id}
          businessName={selectedProfileBusiness.businessName}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
