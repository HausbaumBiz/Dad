"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Phone, ChevronLeft, ChevronRight } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"

// PhotoCarousel Component
interface PhotoCarouselProps {
  photos: string[]
  businessName: string
}

function PhotoCarousel({ photos, businessName }: PhotoCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const photosPerPage = 5
  const totalPages = Math.ceil(photos.length / photosPerPage)

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const startIndex = currentPage * photosPerPage
  const endIndex = Math.min(startIndex + photosPerPage, photos.length)
  const currentPhotos = photos.slice(startIndex, endIndex)

  // Fill empty slots to always show 5 slots
  const displayPhotos = [...currentPhotos]
  while (displayPhotos.length < photosPerPage) {
    displayPhotos.push("")
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-5 gap-2">
        {displayPhotos.map((photo, index) => (
          <div key={index} className="w-40 h-30 bg-gray-100 rounded-lg overflow-hidden">
            {photo ? (
              <Image
                src={photo || "/placeholder.svg"}
                alt={`${businessName} photo ${startIndex + index + 1}`}
                width={160}
                height={120}
                className="w-full h-full object-cover"
                sizes="160px"
                onError={(e) => {
                  console.error(`Failed to load image: ${photo}`)
                  e.currentTarget.src = "/placeholder.svg?height=120&width=160&text=No+Image"
                }}
              />
            ) : (
              <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-400">No photo</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation arrows */}
      {totalPages > 1 && (
        <>
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-1 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-1 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </>
      )}

      {/* Photo counter */}
      {photos.length > photosPerPage && (
        <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {startIndex + 1}-{endIndex} of {photos.length}
        </div>
      )}

      {/* Pagination dots */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-2 space-x-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-1.5 h-1.5 rounded-full ${i === currentPage ? "bg-primary" : "bg-gray-300"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Function to load business photos from Cloudflare
async function loadBusinessPhotos(business: any): Promise<string[]> {
  try {
    console.log(`Loading photos for business: ${business.displayName || business.businessName}`, business)

    const photos: string[] = []

    // Check photoAlbum field
    if (business.photoAlbum && Array.isArray(business.photoAlbum)) {
      console.log("Found photoAlbum array:", business.photoAlbum)
      business.photoAlbum.forEach((photo: any) => {
        if (typeof photo === "string") {
          // If it's already a URL, use it; otherwise generate Cloudflare URL
          if (photo.startsWith("http")) {
            photos.push(photo)
          } else {
            photos.push(getCloudflareImageUrl(photo, "public"))
          }
        } else if (photo && typeof photo === "object") {
          // Handle object format
          const imageId = photo.id || photo.imageId || photo.url
          if (imageId) {
            if (imageId.startsWith("http")) {
              photos.push(imageId)
            } else {
              photos.push(getCloudflareImageUrl(imageId, "public"))
            }
          }
        }
      })
    }

    // Check media.photoAlbum field
    if (business.media && business.media.photoAlbum && Array.isArray(business.media.photoAlbum)) {
      console.log("Found media.photoAlbum array:", business.media.photoAlbum)
      business.media.photoAlbum.forEach((photo: any) => {
        if (typeof photo === "string") {
          if (photo.startsWith("http")) {
            photos.push(photo)
          } else {
            photos.push(getCloudflareImageUrl(photo, "public"))
          }
        } else if (photo && typeof photo === "object") {
          const imageId = photo.id || photo.imageId || photo.url
          if (imageId) {
            if (imageId.startsWith("http")) {
              photos.push(imageId)
            } else {
              photos.push(getCloudflareImageUrl(imageId, "public"))
            }
          }
        }
      })
    }

    // Check adDesign.photoAlbum field
    if (business.adDesign && business.adDesign.photoAlbum && Array.isArray(business.adDesign.photoAlbum)) {
      console.log("Found adDesign.photoAlbum array:", business.adDesign.photoAlbum)
      business.adDesign.photoAlbum.forEach((photo: any) => {
        if (typeof photo === "string") {
          if (photo.startsWith("http")) {
            photos.push(photo)
          } else {
            photos.push(getCloudflareImageUrl(photo, "public"))
          }
        } else if (photo && typeof photo === "object") {
          const imageId = photo.id || photo.imageId || photo.url
          if (imageId) {
            if (imageId.startsWith("http")) {
              photos.push(imageId)
            } else {
              photos.push(getCloudflareImageUrl(imageId, "public"))
            }
          }
        }
      })
    }

    console.log(`Total photos found for ${business.displayName || business.businessName}:`, photos.length)
    return photos
  } catch (error) {
    console.error("Error loading business photos:", error)
    return []
  }
}

export default function RealEstatePage() {
  const filterOptions = [
    { id: "home1", label: "Real Estate Agent", value: "Real Estate Agent" },
    { id: "home2", label: "Real Estate Appraising", value: "Real Estate Appraising" },
    { id: "home3", label: "Home Staging", value: "Home Staging" },
    { id: "home4", label: "Home Inspection", value: "Home Inspection" },
    { id: "home5", label: "Home Energy Audit", value: "Home Energy Audit" },
    { id: "home6", label: "Other Home Buying and Selling", value: "Other Home Buying and Selling" },
  ]

  // Helper function to safely extract string from subcategory data
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

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    reviews: any[]
  } | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<{
    id: string
    name: string
  } | null>(null)

  // Add fetchIdRef for race condition prevention
  const fetchIdRef = useRef(0)

  // Enhanced Business interface
  interface Business {
    id: string
    displayName?: string
    businessName?: string
    displayLocation?: string
    zipCode?: string
    displayPhone?: string
    rating?: number
    reviews?: number
    subcategories?: any[] // Changed from string[] to any[]
    serviceArea?: string[]
    isNationwide?: boolean
    allSubcategories?: any[] // Changed from string[] to any[]
    subcategory?: string
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

  // State for businesses
  const [providers, setProviders] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState<Business[]>([])
  const [filteredProviders, setFilteredProviders] = useState<Business[]>([])

  // State for business photos
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: string[] }>({})

  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  // Helper function to check if business has exact subcategory match
  const hasExactSubcategoryMatch = (business: Business, filterValue: string): boolean => {
    // Check subcategories array
    if (business.subcategories && Array.isArray(business.subcategories)) {
      if (business.subcategories.some((subcat) => getSubcategoryString(subcat) === filterValue)) return true
    }

    // Check allSubcategories array
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      if (business.allSubcategories.some((subcat) => getSubcategoryString(subcat) === filterValue)) return true
    }

    // Check subcategory field
    if (business.subcategory === filterValue) return true

    return false
  }

  const handleFilterChange = (filterValue: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filterValue) ? prev.filter((f) => f !== filterValue) : [...prev, filterValue],
    )
  }

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All providers:", allProviders)

    if (selectedFilters.length === 0) {
      setFilteredProviders(allProviders)
      setAppliedFilters([])
      return
    }

    const filtered = allProviders.filter((business) => {
      console.log(`Business ${business.displayName || business.businessName} subcategories:`, business.subcategories)

      const hasMatch = selectedFilters.some((filter) => {
        const matches = hasExactSubcategoryMatch(business, filter)
        console.log(`Filter "${filter}" matches business: ${matches}`)
        return matches
      })

      console.log(`Business ${business.displayName || business.businessName} has match: ${hasMatch}`)
      return hasMatch
    })

    console.log("Filtered results:", filtered)
    setFilteredProviders(filtered)
    setAppliedFilters([...selectedFilters])
    setSelectedFilters([])
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredProviders(allProviders)
  }

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[RealEstate] Starting fetch ${currentFetchId} for zip code:`, userZipCode)

      try {
        setLoading(true)
        setError(null)
        let fetchedBusinesses = await getBusinessesForCategoryPage("/real-estate")

        // Only update if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(`[RealEstate] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`)
          return
        }

        console.log(`[RealEstate] Fetch ${currentFetchId} got ${fetchedBusinesses.length} businesses`)

        // Filter by zip code if available
        if (userZipCode) {
          const originalCount = fetchedBusinesses.length
          fetchedBusinesses = fetchedBusinesses.filter((business: Business) =>
            businessServesZipCode(business, userZipCode),
          )
          console.log(
            `[RealEstate] Filtered from ${originalCount} to ${fetchedBusinesses.length} businesses for zip ${userZipCode}`,
          )
        }

        setProviders(fetchedBusinesses)
        setAllProviders(fetchedBusinesses)
        setFilteredProviders(fetchedBusinesses)

        // Load photos for all businesses
        const photoPromises = fetchedBusinesses.map(async (business: any) => {
          const photos = await loadBusinessPhotos(business)
          return { businessId: business.id, photos }
        })

        const photoResults = await Promise.all(photoPromises)
        const photoMap: { [key: string]: string[] } = {}
        photoResults.forEach(({ businessId, photos }) => {
          photoMap[businessId] = photos
        })
        setBusinessPhotos(photoMap)
      } catch (err) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[RealEstate] Fetch ${currentFetchId} error:`, err)
          setError("Failed to load businesses")
        }
      } finally {
        // Only update loading if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider({
      id: provider.id,
      name: provider.displayName || provider.businessName || "Real Estate Professional",
      reviews: provider.reviewsData || [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (provider: any) => {
    setSelectedBusiness({
      id: provider.id,
      name: provider.displayName || provider.businessName || "Real Estate Professional",
    })
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Home Buying and Selling" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/realestate002-uC3LlRrHqFBnFoowNNyWGD4WLtnTXj.png"
            alt="Real Estate Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified real estate professionals to help with buying or selling your home. Browse services below or
            use filters to narrow your search.
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

      {/* Enhanced Filter Interface */}
      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Filter by Services</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedFilters.includes(option.value)}
                onChange={() => handleFilterChange(option.value)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            {selectedFilters.length} filter{selectedFilters.length !== 1 ? "s" : ""} selected
          </span>
          <div className="space-x-2">
            <Button onClick={applyFilters} disabled={selectedFilters.length === 0} size="sm">
              Apply Filters
            </Button>
            {appliedFilters.length > 0 && (
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {appliedFilters.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 mb-2">
            <span className="font-medium">Active filters:</span> {appliedFilters.join(", ")}
          </p>
          <p className="text-xs text-blue-600">
            Showing {filteredProviders.length} of {allProviders.length} businesses
          </p>
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

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading real estate professionals...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Real Estate Professionals Yet</h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `Be the first real estate professional to join our platform and connect with potential clients in the ${userZipCode} area.`
                : "Be the first real estate professional to join our platform and connect with potential clients in your area."}
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">Register Your Business</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProviders.map((provider: any) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left: Business Information */}
                  <div className="lg:w-56 flex-shrink-0">
                    <h3 className="text-xl font-semibold">
                      {provider.displayName || provider.businessName || "Real Estate Professional"}
                    </h3>

                    {/* Service Area Indicator */}
                    {userZipCode && (
                      <div className="text-xs text-green-600 mt-1">
                        {provider.isNationwide ? (
                          <span>✓ Serves nationwide</span>
                        ) : provider.serviceArea?.includes(userZipCode) ? (
                          <span>✓ Serves {userZipCode} and surrounding areas</span>
                        ) : provider.zipCode === userZipCode ? (
                          <span>✓ Located in {userZipCode}</span>
                        ) : null}
                      </div>
                    )}

                    <p className="text-gray-600 text-sm mt-2">{provider.displayLocation || "Location not specified"}</p>

                    {provider.displayPhone && (
                      <div className="flex items-center mt-2">
                        <Phone className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          <a href={`tel:${provider.displayPhone}`} className="hover:text-blue-600 hover:underline">
                            {provider.displayPhone}
                          </a>
                        </span>
                      </div>
                    )}

                    {provider.subcategories && provider.subcategories.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {provider.subcategories.slice(0, 3).map((subcategory: any, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {getSubcategoryString(subcategory)}
                            </span>
                          ))}
                          {provider.subcategories.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{provider.subcategories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Center: Photo Carousel (Desktop Only) */}
                  <div className="hidden lg:block flex-1">
                    {businessPhotos[provider.id] && businessPhotos[provider.id].length > 0 ? (
                      <PhotoCarousel
                        photos={businessPhotos[provider.id]}
                        businessName={provider.displayName || provider.businessName || "Real Estate Professional"}
                      />
                    ) : (
                      <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 5 }, (_, index) => (
                          <div
                            key={index}
                            className="w-40 h-30 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
                          >
                            <span className="text-xs text-gray-400">No photo</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="lg:w-28 flex flex-col gap-2 lg:items-end">
                    <Button className="w-full lg:w-auto min-w-[110px]" onClick={() => handleOpenReviews(provider)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full lg:w-auto min-w-[110px] bg-transparent"
                      onClick={() => handleViewProfile(provider)}
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
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          reviews={selectedProvider.reviews}
        />
      )}

      {selectedBusiness && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedBusiness.id}
          businessName={selectedBusiness.name}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
