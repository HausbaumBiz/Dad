"use client"

import { useState, useEffect, useRef } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2, Phone, Star } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"

// Enhanced Business interface
interface Business {
  id: string
  businessName?: string
  displayName?: string
  displayPhone?: string
  displayCity?: string
  displayState?: string
  city?: string
  state?: string
  phone?: string
  rating?: number
  reviews?: any[]
  description?: string
  subcategory?: string
  subcategories?: string[]
  allSubcategories?: string[]
  services?: string[]
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
  adDesignData?: {
    businessInfo?: {
      businessName?: string
      phone?: string
      city?: string
      state?: string
    }
  }
}

// Helper function to check if business serves a zip code
const businessServesZipCode = (business: Business, zipCode: string): boolean => {
  console.log(`[Food Dining] Checking if business serves ${zipCode}:`, {
    businessName: business.displayName || business.businessName,
    isNationwide: business.isNationwide,
    serviceArea: business.serviceArea,
    primaryZip: business.zipCode,
  })

  // Check if business serves nationwide
  if (business.isNationwide) {
    console.log(`[Food Dining] Business serves nationwide`)
    return true
  }

  // Check if the zip code is in the business's service area
  if (business.serviceArea && Array.isArray(business.serviceArea) && business.serviceArea.length > 0) {
    const serves = business.serviceArea.includes(zipCode)
    console.log(`[Food Dining] Service area check: ${serves}`)
    return serves
  }

  // Fall back to primary zip code comparison
  const primaryMatch = business.zipCode === zipCode
  console.log(`[Food Dining] Primary zip code check: ${primaryMatch}`)
  return primaryMatch
}

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
  const fetchIdRef = useRef(0)

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
    { id: "restaurant16", label: "Fast Food", value: "Fast Food" },
    { id: "restaurant17", label: "Catering", value: "Catering" },
    { id: "restaurant18", label: "Buffet", value: "Buffet" },
    { id: "restaurant19", label: "Bakery/Bagels/Donuts", value: "Bakery/Bagels/Donuts" },
    { id: "restaurant20", label: "Breakfast", value: "Breakfast" },
    { id: "restaurant21", label: "24 hour/Open Late", value: "24 hour/Open Late" },
    { id: "restaurant22", label: "Carts/Stands/Trucks", value: "Carts/Stands/Trucks" },
    { id: "restaurant23", label: "Dinner Theater", value: "Dinner Theater" },
    { id: "restaurant24", label: "Sandwich Shops", value: "Sandwich Shops" },
    { id: "restaurant25", label: "Drive-Ins", value: "Drive-Ins" },
    { id: "restaurant26", label: "Seafood", value: "Seafood" },
    { id: "restaurant27", label: "Steak House", value: "Steak House" },
    { id: "restaurant28", label: "Sushi", value: "Sushi" },
    { id: "restaurant29", label: "Cafeteria", value: "Cafeteria" },
  ]

  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  const fetchBusinesses = async () => {
    const currentFetchId = ++fetchIdRef.current

    try {
      setIsLoading(true)

      console.log(`[Food Dining] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

      const result = await getBusinessesForCategoryPage("/food-dining")

      // Check if this is still the current request
      if (currentFetchId !== fetchIdRef.current) {
        console.log(`[Food Dining] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
        return
      }

      console.log(`[Food Dining] Fetch ${currentFetchId} completed, got ${result.length} businesses`)

      // Filter by zip code if available
      let filteredResult = result
      if (userZipCode) {
        console.log(`[Food Dining] Filtering by zip code: ${userZipCode}`)
        filteredResult = result.filter((business: Business) => {
          const serves = businessServesZipCode(business, userZipCode)
          console.log(
            `[Food Dining] Business ${business.displayName || business.adDesignData?.businessInfo?.businessName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
            {
              serviceArea: business.serviceArea,
              primaryZip: business.zipCode,
              isNationwide: business.isNationwide,
            },
          )
          return serves
        })
        console.log(`[Food Dining] After filtering: ${filteredResult.length} businesses`)
      }

      setBusinesses(filteredResult)
      setAllBusinesses(filteredResult)
    } catch (error) {
      // Only update error if this is still the current request
      if (currentFetchId === fetchIdRef.current) {
        console.error(`[Food Dining] Error in fetch ${currentFetchId}:`, error)
        toast({
          title: "Error loading businesses",
          description: "There was a problem loading businesses. Please try again later.",
          variant: "destructive",
        })
      }
    } finally {
      // Only update loading if this is still the current request
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchBusinesses()
  }, [userZipCode])

  // Helper function to check if a business has a specific subcategory
  const hasExactSubcategoryMatch = (business: Business, subcategory: string): boolean => {
    // Check in subcategories array
    if (business.subcategories && Array.isArray(business.subcategories)) {
      if (
        business.subcategories.some((sub) => typeof sub === "string" && sub.toLowerCase() === subcategory.toLowerCase())
      ) {
        return true
      }
    }

    // Check in allSubcategories array
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      if (
        business.allSubcategories.some(
          (sub) => typeof sub === "string" && sub.toLowerCase() === subcategory.toLowerCase(),
        )
      ) {
        return true
      }
    }

    // Check in subcategory field
    if (business.subcategory && business.subcategory.toLowerCase() === subcategory.toLowerCase()) {
      return true
    }

    return false
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilters((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      } else {
        return [...prev, value]
      }
    })
  }

  const applyFilters = () => {
    if (selectedFilters.length === 0) {
      return
    }

    console.log("Applying filters:", selectedFilters)

    const filtered = allBusinesses.filter((business) => {
      // If no filters are selected, show all businesses
      if (selectedFilters.length === 0) return true

      // Check if business matches any of the selected filters
      return selectedFilters.some((filter) => hasExactSubcategoryMatch(business, filter))
    })

    setAppliedFilters([...selectedFilters])
    setBusinesses(filtered)

    toast({
      title: `Filter applied`,
      description: `Showing ${filtered.length} restaurants matching your criteria.`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setBusinesses(allBusinesses)

    toast({
      title: "Filters cleared",
      description: "Showing all restaurants.",
    })
  }

  // The businesses state now holds the filtered businesses directly
  const filteredBusinesses = businesses

  // Helper function to get phone number from business data
  const getPhoneNumber = (business: Business) => {
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
  const getLocation = (business: Business) => {
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
  const getSubcategories = (business: Business) => {
    // Helper function to extract string from subcategory object
    const getSubcategoryString = (subcategory: any): string => {
      if (typeof subcategory === "string") {
        return subcategory
      }

      if (subcategory && typeof subcategory === "object") {
        // Try to get the subcategory field first, then category, then fullPath
        return subcategory.subcategory || subcategory.category || subcategory.fullPath || "Unknown Service"
      }

      return "Unknown Service"
    }

    // First try to get from subcategories (which should contain the full category objects)
    if (business.subcategories && business.subcategories.length > 0) {
      return business.subcategories.map(getSubcategoryString).filter((s) => s !== "Unknown Service")
    }

    // Then try allSubcategories
    if (business.allSubcategories && business.allSubcategories.length > 0) {
      return business.allSubcategories.map(getSubcategoryString).filter((s) => s !== "Unknown Service")
    }

    // Fall back to services if available
    if (business.services && business.services.length > 0) {
      return business.services.map(getSubcategoryString).filter((s) => s !== "Unknown Service")
    }

    return ["Restaurant"]
  }

  const handleReviewsClick = (provider: Business) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleProfileClick = (provider: Business) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  const clearZipCodeFilter = () => {
    localStorage.removeItem("savedZipCode")
    setUserZipCode(null)
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

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Filter by Cuisine Type</h3>
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filterOptions.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={option.id}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={selectedFilters.includes(option.value)}
                  onChange={() => handleFilterChange(option.value)}
                />
                <label htmlFor={option.id} className="ml-2 text-sm text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={applyFilters} disabled={selectedFilters.length === 0} className="text-sm">
              Apply Filters {selectedFilters.length > 0 && `(${selectedFilters.length})`}
            </Button>

            {appliedFilters.length > 0 && (
              <Button variant="outline" onClick={clearFilters} className="text-sm">
                Clear Filters
              </Button>
            )}

            {appliedFilters.length > 0 && (
              <span className="text-sm text-gray-500">
                Showing {filteredBusinesses.length} of {businesses.length} restaurants
              </span>
            )}
          </div>

          {appliedFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {appliedFilters.map((filter) => (
                <span
                  key={filter}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {filter}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Showing restaurants for zip code:</span> {userZipCode}
              <span className="text-xs block mt-1">(Includes businesses with {userZipCode} in their service area)</span>
            </p>
            <Button variant="outline" size="sm" onClick={clearZipCodeFilter} className="text-xs">
              Clear Filter
            </Button>
          </div>
        </div>
      )}

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
                        <span className="text-gray-600 text-sm">{formatPhoneNumber(getPhoneNumber(business)!)}</span>
                      </div>
                    )}

                    {/* Service Area Indicator */}
                    {(business.isNationwide || (business.serviceArea && business.serviceArea.length > 0)) && (
                      <div className="flex items-center mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                          {business.isNationwide ? "Serves nationwide" : `Serves ${userZipCode} area`}
                        </span>
                      </div>
                    )}

                    {/* Rating Stars */}
                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              business.reviews && business.reviews.length > 0 && i < Math.floor(business.rating || 0)
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {business.reviews && business.reviews.length > 0
                          ? `${business.rating} (${business.reviews.length} ${business.reviews.length === 1 ? "review" : "reviews"})`
                          : "No reviews yet"}
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
            <h3 className="text-xl font-medium text-amber-800 mb-2">
              {userZipCode ? `No Restaurants Found in ${userZipCode} Area` : "No Restaurants Found"}
            </h3>
            <p className="text-amber-700 mb-4">
              {userZipCode
                ? `We're building our network of restaurants and dining options in the ${userZipCode} area.`
                : "We're building our network of restaurants and dining options in your area."}
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
