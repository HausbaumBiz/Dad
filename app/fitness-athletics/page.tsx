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
import { Loader2, Phone } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/lib/business-category-service"
import { Checkbox } from "@/components/ui/checkbox"

export default function FitnessAthleticsPage() {
  const { toast } = useToast()

  // Add fetchIdRef for race condition prevention
  const fetchIdRef = useRef(0)

  // Enhanced Business interface
  interface Business {
    id: string
    displayName?: string
    businessName?: string
    displayLocation?: string
    displayCity?: string
    displayState?: string
    city?: string
    state?: string
    zipCode?: string
    displayPhone?: string
    phone?: string
    rating?: number
    reviews?: number
    subcategories?: string[]
    allSubcategories?: string[]
    subcategory?: string
    serviceArea?: string[]
    isNationwide?: boolean
  }

  // Helper function to check if business serves the zip code
  const businessServesZipCode = (business: Business, zipCode: string): boolean => {
    console.log(`Checking if business ${business.displayName || business.businessName} serves ${zipCode}:`, {
      isNationwide: business.isNationwide,
      serviceArea: business.serviceArea,
      primaryZip: business.zipCode,
    })

    // Check if business serves nationwide
    if (business.isNationwide) {
      console.log(`✓ Business serves nationwide`)
      return true
    }

    // Check if zip code is in service area
    if (business.serviceArea && Array.isArray(business.serviceArea)) {
      const serves = business.serviceArea.includes(zipCode)
      console.log(`${serves ? "✓" : "✗"} Service area check: ${business.serviceArea.join(", ")}`)
      return serves
    }

    // Fallback to primary zip code
    const matches = business.zipCode === zipCode
    console.log(`${matches ? "✓" : "✗"} Primary zip code check: ${business.zipCode}`)
    return matches
  }

  // Add phone number formatting function
  const formatPhoneNumber = (phone: string | null | undefined): string => {
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

  const filterOptions = [
    { id: "athletics1", label: "Baseball/Softball", value: "Baseball/Softball" },
    { id: "athletics2", label: "Golf", value: "Golf" },
    { id: "athletics3", label: "Tennis", value: "Tennis" },
    { id: "athletics4", label: "Basketball", value: "Basketball" },
    { id: "athletics5", label: "Football", value: "Football" },
    { id: "athletics6", label: "Soccer", value: "Soccer" },
    { id: "athletics7", label: "Ice Skating", value: "Ice Skating" },
    { id: "athletics8", label: "Gymnastics", value: "Gymnastics" },
    { id: "athletics9", label: "Pickleball", value: "Pickleball" },
    { id: "athletics10", label: "Table Tennis", value: "Table Tennis" },
    { id: "athletics11", label: "Dance", value: "Dance" },
    { id: "athletics12", label: "Personal Trainers", value: "Personal Trainers" },
    { id: "athletics13", label: "Group Fitness Classes", value: "Group Fitness Classes" },
    { id: "athletics14", label: "Other Athletics & Fitness", value: "Other Athletics & Fitness" },
  ]

  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Add filter state variables after existing state
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])

  // Add exact subcategory matching function and filter handlers
  const isSubcategorySelected = (subcategory: string) => selectedSubcategories.includes(subcategory)

  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategories((prev) => {
      if (prev.includes(subcategory)) {
        return prev.filter((s) => s !== subcategory)
      } else {
        return [...prev, subcategory]
      }
    })
  }

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[Fitness] Starting fetch ${currentFetchId} for zip code:`, userZipCode)

      setIsLoading(true)
      try {
        let result = await getBusinessesForCategoryPage("/fitness-athletics")

        // Only update if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Fitness] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Fitness] Fetch ${currentFetchId} got ${result.length} businesses`)

        // Filter by zip code if available
        if (userZipCode) {
          const originalCount = result.length
          result = result.filter((business: Business) => businessServesZipCode(business, userZipCode))
          console.log(`[Fitness] Filtered from ${originalCount} to ${result.length} businesses for zip ${userZipCode}`)
        }

        setBusinesses(result)
        setError(null)
      } catch (err) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Fitness] Fetch ${currentFetchId} error:`, err)
          setError("Failed to load businesses")
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

    fetchBusinesses()
  }, [toast, userZipCode])

  // Update useEffect and rendering to use filteredBusinesses
  const filteredBusinesses = businesses.filter((business) => {
    if (selectedSubcategories.length === 0) {
      return true // Show all if no subcategories are selected
    }

    if (business.subcategories && Array.isArray(business.subcategories)) {
      return business.subcategories.some((sub) => selectedSubcategories.includes(sub))
    }

    return false // Don't show if no subcategories match
  })

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value === selectedFilter ? null : value)
  }

  return (
    <CategoryLayout title="Athletics, Fitness & Dance Instruction" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/baseball-WpgfS7MciTxGMJwNZTzlAFewS1DPX0.png"
            alt="Athletics and Fitness"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified coaches, trainers, and fitness professionals in your area. Browse options below or use
            filters to narrow your search.
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

      {/* Replace CategoryFilter with checkbox interface */}
      <div className="mb-4">
        <h4 className="text-lg font-semibold mb-2">Filter by Subcategory</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filterOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center space-x-2 bg-white rounded-md border border-gray-200 shadow-sm px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                id={option.id}
                checked={isSubcategorySelected(option.value)}
                onCheckedChange={() => handleSubcategoryChange(option.value)}
              />
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex justify-between items-center">
          <p className="text-sm text-blue-700">
            <span className="font-medium">Showing businesses that serve zip code:</span> {userZipCode}
            <span className="text-xs block mt-1">Includes businesses with {userZipCode} in their service area</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem("savedZipCode")
              setUserZipCode(null)
            }}
            className="text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            Clear Filter
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading businesses...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{business.displayName || business.businessName}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {business.displayLocation ||
                        (business.displayCity && business.displayState
                          ? `${business.displayCity}, ${business.displayState}`
                          : business.city && business.state
                            ? `${business.city}, ${business.state}`
                            : business.displayCity ||
                              business.city ||
                              business.displayState ||
                              business.state ||
                              `Zip: ${business.zipCode}`)}
                    </p>

                    {/* Service Area Indicator */}
                    {userZipCode && (
                      <div className="text-xs text-green-600 mt-1">
                        {business.isNationwide ? (
                          <span>✓ Serves nationwide</span>
                        ) : business.serviceArea?.includes(userZipCode) ? (
                          <span>✓ Serves {userZipCode} area</span>
                        ) : business.zipCode === userZipCode ? (
                          <span>✓ Located in {userZipCode}</span>
                        ) : null}
                      </div>
                    )}

                    {/* Add phone number display */}
                    {(business.displayPhone || business.phone) && (
                      <div className="flex items-center mt-1">
                        <Phone className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-600 text-sm">
                          {formatPhoneNumber(business.displayPhone || business.phone)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(business.rating || 4.5) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {business.rating || 4.5} ({business.reviews || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {business.subcategories && business.subcategories.length > 0 ? (
                          business.subcategories.map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Fitness & Athletics
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(business)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleOpenProfile(business)}
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-orange-800 mb-2">No Fitness & Athletics Providers Found</h3>
            <p className="text-orange-700 mb-4">
              {userZipCode
                ? `We're building our network of certified fitness professionals and athletic instructors that serve the ${userZipCode} area.`
                : "We're building our network of certified fitness professionals and athletic instructors in your area."}
            </p>
            <div className="bg-white rounded border border-orange-100 p-4">
              <p className="text-gray-700 font-medium">Are you a fitness professional or athletic instructor?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to connect with clients who need your fitness expertise and training services.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Fitness Business</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.displayName || selectedProvider.businessName || selectedProvider.name}
          businessId={selectedProvider.id}
          reviews={[]}
        />
      )}

      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
