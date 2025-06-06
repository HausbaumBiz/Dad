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
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { Checkbox } from "@/components/ui/checkbox"

// Add fetchIdRef for race condition prevention

// Enhanced Business interface
interface Business {
  id: string
  displayName?: string
  businessName?: string
  displayLocation?: string
  city?: string
  state?: string
  zipCode?: string
  displayPhone?: string
  phone?: string
  rating?: number
  reviews?: number
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

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(phoneNumberString: string | undefined | null): string {
  if (!phoneNumberString) return "No phone provided"

  // Strip all non-numeric characters
  const cleaned = phoneNumberString.replace(/\D/g, "")

  // Check if it's a valid 10-digit number
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6, 10)}`
  }

  // Return original if not 10 digits
  return phoneNumberString
}

export default function EducationTutoringPage() {
  const { toast } = useToast()
  const filterOptions = [
    { id: "language1", label: "Spanish", value: "Spanish" },
    { id: "language2", label: "French", value: "French" },
    { id: "language3", label: "Chinese", value: "Chinese" },
    { id: "language4", label: "American Sign Language", value: "American Sign Language" },
    { id: "language5", label: "English as a Second Language", value: "English as a Second Language" },
    { id: "language6", label: "Other Language", value: "Other Language" },
    { id: "language7", label: "Math - Elementary", value: "Math - Elementary" },
    { id: "language8", label: "Math - High School", value: "Math - High School" },
    { id: "language9", label: "Reading Tutors (Adult and Children)", value: "Reading Tutors (Adult and Children)" },
    { id: "language10", label: "Test Prep", value: "Test Prep" },
    { id: "language11", label: "Other Subjects", value: "Other Subjects" },
  ]

  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const fetchIdRef = useRef(0)

  // Filter State Variables
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[Education] Starting fetch ${currentFetchId} for zip code:`, userZipCode)

      setIsLoading(true)
      try {
        let result = await getBusinessesForCategoryPage("/education-tutoring")

        // Only update if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Education] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Education] Fetch ${currentFetchId} got ${result.length} businesses`)

        // Filter by zip code if available
        if (userZipCode) {
          const originalCount = result.length
          result = result.filter((business: Business) => businessServesZipCode(business, userZipCode))
          console.log(
            `[Education] Filtered from ${originalCount} to ${result.length} businesses for zip ${userZipCode}`,
          )
        }

        setBusinesses(result)
        setAllBusinesses(result)
        setFilteredBusinesses(result)
      } catch (error) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Education] Fetch ${currentFetchId} error:`, error)
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

  // Function to check if business has exact subcategory match
  const hasExactSubcategoryMatch = (business: Business, subcategory: string): boolean => {
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      return business.allSubcategories.some((sub) => sub.toLowerCase() === subcategory.toLowerCase())
    }
    return false
  }

  // Filter handlers
  const handleFilterChange = (subcategory: string) => {
    setSelectedFilters((prev) =>
      prev.includes(subcategory) ? prev.filter((f) => f !== subcategory) : [...prev, subcategory],
    )
  }

  const handleApplyFilters = () => {
    setAppliedFilters([...selectedFilters])

    let filtered = [...allBusinesses]
    if (selectedFilters.length > 0) {
      filtered = allBusinesses.filter((business) =>
        selectedFilters.every((filter) => hasExactSubcategoryMatch(business, filter)),
      )
    }

    setFilteredBusinesses(filtered)

    toast({
      title: "Filters Applied",
      description: `Showing businesses with ${selectedFilters.length} selected subject${selectedFilters.length !== 1 ? "s" : ""}`,
    })
  }

  const handleClearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses([...allBusinesses])

    toast({
      title: "Filters Cleared",
      description: "Showing all education & tutoring businesses",
    })
  }

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Language Lessons & School Subject Tutoring" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/tutor-oUQE3gdqYse3GcFicrOH9B9CAeaRVb.png"
            alt="Education and Tutoring"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified tutors and language instructors in your area. Browse options below or use filters to narrow
            your search.
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
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Filter by Subject</h4>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilters} disabled={selectedFilters.length === 0} size="sm">
              Apply Filters {selectedFilters.length > 0 && `(${selectedFilters.length})`}
            </Button>
            {appliedFilters.length > 0 && (
              <Button onClick={handleClearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filterOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center space-x-2 bg-gray-50 rounded-md border border-gray-200 px-3 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Checkbox
                id={option.id}
                checked={selectedFilters.includes(option.value)}
                onCheckedChange={() => handleFilterChange(option.value)}
              />
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {appliedFilters.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">Active Filters: {appliedFilters.join(", ")}</p>
        </div>
      )}

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
                        (business.city && business.state
                          ? `${business.city}, ${business.state}`
                          : business.city || business.state || `Zip: ${business.zipCode}`)}
                    </p>

                    {(business.displayPhone || business.phone) && (
                      <div className="flex items-center text-gray-600 text-sm mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        <span>{formatPhoneNumber(business.displayPhone || business.phone)}</span>
                      </div>
                    )}

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
                        {business.allSubcategories && business.allSubcategories.length > 0 ? (
                          business.allSubcategories.map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {business.subcategory || "Education & Tutoring"}
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
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-purple-800 mb-2">No Education & Tutoring Providers Found</h3>
            <p className="text-purple-700 mb-4">
              {userZipCode
                ? `We're building our network of qualified tutors and language instructors that serve the ${userZipCode} area.`
                : "We're building our network of qualified tutors and language instructors in your area."}
            </p>
            <div className="bg-white rounded border border-purple-100 p-4">
              <p className="text-gray-700 font-medium">Are you a tutor or language instructor?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to connect with students in your area who need your expertise.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Tutoring Business</a>
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
