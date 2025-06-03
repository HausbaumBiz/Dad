"use client"

import { useState, useEffect } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2, Phone, Star } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(phoneNumberString: string) {
  if (!phoneNumberString) return "No phone provided"

  // Strip all non-numeric characters
  const cleaned = phoneNumberString.replace(/\D/g, "")

  // Check if the number is valid
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }

  // If the format doesn't match, return the original
  return phoneNumberString
}

export default function FoodDiningPage() {
  const { toast } = useToast()
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

  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true)
      try {
        // Add timestamp for cache busting
        const timestamp = Date.now()
        console.log(`[Food Dining] Fetching businesses at ${timestamp}`)

        const result = await getBusinessesForCategoryPage("/food-dining")

        console.log(
          "Food dining businesses fetched:",
          result.map((b) => ({
            id: b.id,
            registrationName: b.businessName,
            displayName: b.displayName,
            adDesignName: b.adDesignData?.businessInfo?.businessName,
            source: b.adDesignData?.businessInfo?.businessName ? "ad-design" : "registration",
          })),
        )

        setBusinesses(result)
      } catch (error) {
        console.error("Error fetching businesses:", error)
        toast({
          title: "Error loading businesses",
          description: "There was a problem loading businesses. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [toast])

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

  // Helper function to get phone number from business data
  const getPhoneNumber = (business: any) => {
    // First try to get phone from ad design data
    if (business.adDesignData?.businessInfo?.phone) {
      return business.adDesignData.businessInfo.phone
    }
    // Then try displayPhone which might be set by the centralized system
    if (business.displayPhone) {
      return business.displayPhone
    }
    // Fall back to the business registration phone
    if (business.phone) {
      return business.phone
    }
    return null
  }

  // Helper function to get location from business data
  const getLocation = (business: any) => {
    // First try to get location from ad design data
    const adDesignCity = business.adDesignData?.businessInfo?.city
    const adDesignState = business.adDesignData?.businessInfo?.state

    // Then try displayCity/displayState which might be set by the centralized system
    const displayCity = business.displayCity
    const displayState = business.displayState

    // Finally fall back to registration data
    const registrationCity = business.city
    const registrationState = business.state

    // Build location string prioritizing ad design data
    const city = adDesignCity || displayCity || registrationCity
    const state = adDesignState || displayState || registrationState

    const parts = []
    if (city) parts.push(city)
    if (state) parts.push(state)

    if (parts.length > 0) {
      return parts.join(", ")
    }

    // If no city/state available, show zip code as fallback
    if (business.zipCode) {
      return `Zip: ${business.zipCode}`
    }

    return "Location not provided"
  }

  // Helper function to get subcategories
  const getSubcategories = (business: any) => {
    // Prioritize subcategories from Redis
    if (business.subcategories && business.subcategories.length > 0) {
      return business.subcategories
    }

    // Fall back to services if available
    if (business.services && business.services.length > 0) {
      return business.services
    }

    // Fall back to allSubcategories if available
    if (business.allSubcategories && business.allSubcategories.length > 0) {
      return business.allSubcategories
    }

    return []
  }

  const handleReviewsClick = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleProfileClick = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value === selectedFilter ? null : value)
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
              <li>Read reviews from other customers</li>
              <li>View business videos showcasing work and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you frequent yourself</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} selectedValue={selectedFilter} onChange={handleFilterChange} />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading restaurants...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="space-y-6 mt-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {business.displayName ||
                        business.adDesignData?.businessInfo?.businessName ||
                        business.businessName}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{getLocation(business)}</p>

                    {/* Phone Number */}
                    {getPhoneNumber(business) && (
                      <div className="flex items-center mt-1">
                        <Phone className="w-4 h-4 text-gray-500 mr-1" />
                        <span className="text-gray-600 text-sm">{formatPhoneNumber(getPhoneNumber(business))}</span>
                      </div>
                    )}

                    {/* Rating Stars */}
                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(business.rating || 4.5) ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {business.rating || 4.5} ({business.reviews?.length || 0} reviews)
                      </span>
                    </div>

                    {/* Description */}
                    {business.description && (
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{business.description}</p>
                    )}

                    {/* Subcategories/Cuisine Types */}
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Cuisine:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {getSubcategories(business).length > 0 ? (
                          getSubcategories(business).map((subcategory: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {typeof subcategory === "string" ? subcategory : subcategory.name || "Unknown"}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {business.subcategory || "Restaurant"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleReviewsClick(business)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleProfileClick(business)}
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-amber-800 mb-2">No Restaurants Found</h3>
            <p className="text-amber-700 mb-4">
              We're building our network of restaurants and dining options in your area.
            </p>
            <div className="bg-white rounded border border-amber-100 p-4">
              <p className="text-gray-700 font-medium">Are you a restaurant owner?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to showcase your restaurant and connect with diners in your area.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Restaurant</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={
            selectedProvider.displayName ||
            selectedProvider.adDesignData?.businessInfo?.businessName ||
            selectedProvider.businessName
          }
          businessId={selectedProvider.id}
          reviews={selectedProvider.reviews || []}
        />
      )}

      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
          businessName={
            selectedProvider.displayName ||
            selectedProvider.adDesignData?.businessInfo?.businessName ||
            selectedProvider.businessName
          }
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
