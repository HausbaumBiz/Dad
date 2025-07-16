"use client"

import { useState, useEffect, useRef } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2, Phone } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/lib/business-category-service"
import { MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { PhotoCarousel } from "@/components/photo-carousel"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"

// Enhanced Business interface with service area support
interface Business {
  id: string
  businessName: string
  displayName?: string
  city?: string
  state?: string
  zipCode?: string
  displayCity?: string
  displayState?: string
  displayLocation?: string
  displayPhone?: string
  phone?: string
  rating?: number
  reviews?: number
  reviewCount?: number
  allSubcategories?: string[]
  subcategory?: string
  subcategories?: string[]
  businessDescription?: string
  adDesignData?: {
    businessInfo?: {
      phone?: string
      city?: string
      state?: string
    }
  }
  serviceArea?: string[]
  isNationwide?: boolean
  photos?: string[]
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

// Helper function to extract string value from subcategory (which might be an object)
function getSubcategoryString(subcategory: any): string {
  if (typeof subcategory === "string") {
    return subcategory
  }

  if (subcategory && typeof subcategory === "object") {
    // Extract the subcategory name from the object
    return subcategory.subcategory || subcategory.category || subcategory.fullPath || "Unknown Service"
  }

  return "Unknown Service"
}

// Now update the hasExactSubcategoryMatch function to use the helper
const hasExactSubcategoryMatch = (business: Business, filterValue: string): boolean => {
  // Check subcategories array
  if (business.subcategories && Array.isArray(business.subcategories)) {
    if (business.subcategories.some((sub) => getSubcategoryString(sub) === filterValue)) return true
  }

  // Check allSubcategories array
  if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
    if (business.allSubcategories.some((sub) => getSubcategoryString(sub) === filterValue)) return true
  }

  // Check subcategory field
  if (getSubcategoryString(business.subcategory) === filterValue) return true

  return false
}

export default function BeautyWellnessPage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "beauty1", label: "Barbers", value: "Barbers" },
    {
      id: "beauty2",
      label: "Hairdressers, Hairstylists, and Cosmetologists",
      value: "Hairdressers, Hairstylists, and Cosmetologists",
    },
    { id: "beauty3", label: "Manicurists and Pedicurists", value: "Manicurists and Pedicurists" },
    { id: "beauty4", label: "Skincare Specialists", value: "Skincare Specialists" },
    { id: "beauty5", label: "Hair Removal", value: "Hair Removal" },
    { id: "beauty6", label: "Body Sculpting", value: "Body Sculpting" },
    { id: "beauty7", label: "Spas", value: "Spas" },
    { id: "beauty8", label: "Tanning", value: "Tanning" },
    { id: "beauty9", label: "Tattoo and Scar Removal Services", value: "Tattoo and Scar Removal Services" },
    { id: "beauty10", label: "Hair Wigs and Weaves", value: "Hair Wigs and Weaves" },
    { id: "beauty11", label: "Beauty Products", value: "Beauty Products" },
    {
      id: "beauty12",
      label: "Miscellaneous Personal Appearance Workers",
      value: "Miscellaneous Personal Appearance Workers",
    },
  ]

  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filter state management
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])

  // Photo state
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  // Function to load business photos from Cloudflare using public URLs
  const loadBusinessPhotos = async (businessId: string): Promise<string[]> => {
    try {
      console.log(`Loading photos for business ${businessId}`)

      // Fetch business media data from the updated API
      const response = await fetch(`/api/businesses/${businessId}`)
      if (!response.ok) {
        console.error(`Failed to fetch business data: ${response.status} ${response.statusText}`)
        return []
      }

      const businessData = await response.json()
      console.log(`Business data for ${businessId}:`, businessData)

      // Try multiple possible locations for photo data
      let photoAlbum = null

      // Check direct photoAlbum property
      if (businessData.photoAlbum && Array.isArray(businessData.photoAlbum)) {
        photoAlbum = businessData.photoAlbum
      }
      // Check nested media.photoAlbum
      else if (businessData.media?.photoAlbum && Array.isArray(businessData.media.photoAlbum)) {
        photoAlbum = businessData.media.photoAlbum
      }
      // Check adDesign.photoAlbum
      else if (businessData.adDesign?.photoAlbum && Array.isArray(businessData.adDesign.photoAlbum)) {
        photoAlbum = businessData.adDesign.photoAlbum
      }

      if (!photoAlbum || !Array.isArray(photoAlbum)) {
        console.log(`No photo album found for business ${businessId}`)
        return []
      }

      console.log(`Found ${photoAlbum.length} photos in album for business ${businessId}`)

      // Convert Cloudflare image IDs to public URLs
      const photoUrls = photoAlbum
        .map((photo: any, index: number) => {
          // Handle different photo data structures
          let imageId = null

          if (typeof photo === "string") {
            // If photo is just a string (image ID)
            imageId = photo
          } else if (photo && typeof photo === "object") {
            // If photo is an object, try to extract the image ID
            imageId = photo.imageId || photo.id || photo.cloudflareId || photo.url

            // If it's already a full URL, return it as-is
            if (typeof imageId === "string" && (imageId.startsWith("http") || imageId.startsWith("https"))) {
              console.log(`Photo ${index} already has full URL: ${imageId}`)
              return imageId
            }
          }

          if (!imageId) {
            console.warn(`No image ID found for photo ${index}:`, photo)
            return null
          }

          // Generate public Cloudflare URL
          try {
            const publicUrl = getCloudflareImageUrl(imageId, "public")
            console.log(`Generated URL for image ${imageId}: ${publicUrl}`)
            return publicUrl
          } catch (error) {
            console.error(`Error generating URL for image ${imageId}:`, error)
            return null
          }
        })
        .filter(Boolean) // Remove null/undefined URLs

      console.log(`Successfully loaded ${photoUrls.length} photos for business ${businessId}`)
      return photoUrls
    } catch (error) {
      console.error(`Error loading photos for business ${businessId}:`, error)
      return []
    }
  }

  // Function to load photos for a business
  const loadPhotosForBusiness = async (businessId: string) => {
    const photos = await loadBusinessPhotos(businessId)
    setBusinessPhotos((prevPhotos) => ({
      ...prevPhotos,
      [businessId]: photos,
    }))
  }

  // Helper function to check if business serves a zip code
  const businessServesZipCode = (business: Business, zipCode: string): boolean => {
    console.log(
      `[Beauty Wellness] Checking if business ${business.displayName || business.businessName} serves ${zipCode}:`,
      {
        isNationwide: business.isNationwide,
        serviceArea: business.serviceArea,
        primaryZip: business.zipCode,
      },
    )

    // Check if business serves nationwide
    if (business.isNationwide) {
      console.log(`[Beauty Wellness] Business serves nationwide`)
      return true
    }

    // Check if business service area includes the zip code
    if (business.serviceArea && Array.isArray(business.serviceArea)) {
      const serves = business.serviceArea.some((area) => {
        if (typeof area === "string") {
          return area.toLowerCase().includes("nationwide") || area === zipCode
        }
        return false
      })
      console.log(`[Beauty Wellness] Service area check result: ${serves}`)
      if (serves) return true
    }

    // Fall back to primary zip code comparison
    const primaryMatch = business.zipCode === zipCode
    console.log(`[Beauty Wellness] Primary zip code match: ${primaryMatch}`)
    return primaryMatch
  }

  // Clear zip code filter
  const clearZipCodeFilter = () => {
    setUserZipCode(null)
    localStorage.removeItem("savedZipCode")
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
      console.log(`[Beauty Wellness] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

      try {
        setIsLoading(true)
        setError(null)

        // Use the simplified business category service
        const result = await getBusinessesForCategoryPage("/beauty-wellness")

        // Load photos for each business using public Cloudflare URLs
        const businessesWithPhotos = await Promise.all(
          result.map(async (business: Business) => {
            const photos = await loadBusinessPhotos(business.id)
            return { ...business, photos }
          }),
        )

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[Beauty Wellness] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[Beauty Wellness] Fetch ${currentFetchId} completed, got ${result.length} businesses`)

        // Filter by zip code if available
        if (userZipCode) {
          console.log(`[Beauty Wellness] Filtering by zip code: ${userZipCode}`)
          const filteredByZip = businessesWithPhotos.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Beauty Wellness] Business ${business.displayName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              business,
            )
            return serves
          })
          console.log(`[Beauty Wellness] After filtering: ${filteredByZip.length} businesses`)
          setBusinesses(filteredByZip)
          setAllBusinesses(filteredByZip)
        } else {
          setBusinesses(businessesWithPhotos)
          setAllBusinesses(businessesWithPhotos)
        }
      } catch (error) {
        // Only update error state if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error("Error fetching businesses:", error)
          setError("Failed to load businesses")
          toast({
            title: "Error loading businesses",
            description: "There was a problem loading businesses. Please try again later.",
            variant: "destructive",
          })
        }
      } finally {
        // Only update loading state if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          setIsLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All businesses:", allBusinesses)

    if (selectedFilters.length === 0) {
      setAppliedFilters([])
      return
    }

    const filtered = allBusinesses.filter((business) => {
      console.log(
        `Business ${business.displayName || business.businessName} subcategories:`,
        business.allSubcategories || business.subcategories || [business.subcategory],
      )

      const hasMatch = selectedFilters.some((filter) => {
        const matches = hasExactSubcategoryMatch(business, filter)
        console.log(`Filter "${filter}" matches business: ${matches}`)
        return matches
      })

      console.log(`Business ${business.displayName || business.businessName} has match: ${hasMatch}`)
      return hasMatch
    })

    console.log("Filtered results:", filtered)
    setAppliedFilters([...selectedFilters])

    toast({
      title: "Filters Applied",
      description: `Found ${filtered.length} businesses matching your criteria`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    toast({
      title: "Filters Cleared",
      description: `Showing all ${allBusinesses.length} businesses`,
    })
  }

  const filteredBusinesses =
    appliedFilters.length > 0
      ? businesses.filter((business) => {
          return appliedFilters.some((filter) => hasExactSubcategoryMatch(business, filter))
        })
      : businesses

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Beauty & Wellness Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/haircutting-qs8Z2Gv5npSVzpYZ19uRHdGRK94bFP.png"
            alt="Beauty and Wellness"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified beauty and wellness professionals in your area. Browse services below or use filters to
            narrow your search.
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

      {/* Enhanced Filter Controls */}
      <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Filter by Beauty & Wellness Services</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes(option.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedFilters([...selectedFilters, option.value])
                  } else {
                    setSelectedFilters(selectedFilters.filter((f) => f !== option.value))
                  }
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={applyFilters}
            disabled={selectedFilters.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            Apply Filters {selectedFilters.length > 0 && `(${selectedFilters.length})`}
          </Button>

          {appliedFilters.length > 0 && (
            <Button onClick={clearFilters} variant="outline" className="border-gray-300 bg-transparent">
              Clear Filters
            </Button>
          )}

          {selectedFilters.length > 0 && (
            <span className="text-sm text-gray-600">
              {selectedFilters.length} service{selectedFilters.length !== 1 ? "s" : ""} selected
            </span>
          )}
        </div>

        {appliedFilters.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Active filters:</strong> {appliedFilters.join(", ")}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              Showing {filteredBusinesses.length} of {allBusinesses.length} businesses
            </p>
          </div>
        )}
      </div>

      {userZipCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-800 text-sm">
                <strong>Showing results for ZIP code: {userZipCode}</strong>
                <br />
                <span className="text-blue-600">Including businesses that serve your area or operate nationwide.</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearZipCodeFilter}
              className="text-blue-600 border-blue-300 hover:bg-blue-100 bg-transparent"
            >
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading businesses...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="space-y-6">
          {filteredBusinesses.map((business: Business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">
                      {business.displayName || business.businessName || "Beauty & Wellness Provider"}
                    </h3>
                    {business.businessDescription && (
                      <p className="text-gray-600 text-sm leading-relaxed">{business.businessDescription}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {business.displayLocation && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{business.displayLocation}</span>
                        </div>
                      )}
                      {(business.displayPhone || business.adDesignData?.businessInfo?.phone || business.phone) && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          <a
                            href={`tel:${business.displayPhone || business.adDesignData?.businessInfo?.phone || business.phone}`}
                            className="hover:text-primary"
                          >
                            {formatPhoneNumber(
                              business.displayPhone ||
                                business.adDesignData?.businessInfo?.phone ||
                                business.phone ||
                                "",
                            )}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Service Area Indicator */}
                    {userZipCode && (
                      <div className="text-xs text-green-600">
                        {business.isNationwide ? (
                          <span>✓ Serves nationwide</span>
                        ) : business.serviceArea?.includes(userZipCode) ? (
                          <span>✓ Serves {userZipCode} and surrounding areas</span>
                        ) : business.zipCode === userZipCode ? (
                          <span>✓ Located in {userZipCode}</span>
                        ) : null}
                      </div>
                    )}

                    {/* Services */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {business.allSubcategories && business.allSubcategories.length > 0 ? (
                          business.allSubcategories.map((service: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(service)}
                            </span>
                          ))
                        ) : business.subcategories && business.subcategories.length > 0 ? (
                          business.subcategories.map((service: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(service)}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {getSubcategoryString(business.subcategory) || "Beauty & Wellness"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Photo Carousel and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4 items-start">
                    {/* Photo Carousel */}
                    <div className="flex-1">
                      <PhotoCarousel
                        businessId={business.id}
                        photos={business.photos || []}
                        onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                        showMultiple={true}
                        photosPerView={5}
                        className="w-full"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="lg:w-32 flex flex-row lg:flex-col gap-2 lg:justify-start">
                      <Button className="flex-1 lg:flex-none lg:w-full" onClick={() => handleOpenReviews(business)}>
                        Ratings
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 lg:flex-none lg:w-full bg-transparent"
                        onClick={() => handleOpenProfile(business)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-pink-800 mb-2">
              {userZipCode
                ? `No Beauty & Wellness Providers in ${userZipCode}`
                : "No Beauty & Wellness Providers Found"}
            </h3>
            <p className="text-pink-700 mb-4">
              {userZipCode
                ? `We're building our network of beauty and wellness professionals in the ${userZipCode} area.`
                : "We're building our network of beauty and wellness professionals in your area."}
            </p>
            <div className="bg-white rounded border border-pink-100 p-4">
              <p className="text-gray-700 font-medium">Are you a beauty or wellness professional?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to showcase your services and connect with clients in your area.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Beauty Business</a>
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
