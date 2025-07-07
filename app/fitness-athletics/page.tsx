"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

// Enhanced Business interface
interface Business {
  id: string
  displayName?: string
  businessName: string
  displayLocation?: string
  displayPhone?: string
  rating?: number
  reviews?: number
  subcategories?: string[]
  businessDescription?: string
  zipCode?: string
  serviceArea?: string[]
  isNationwide?: boolean
  adDesignData?: any
  photoAlbum?: any[]
  media?: {
    photoAlbum?: any[]
  }
}

// PhotoCarousel Component
function PhotoCarousel({ photos }: { photos: string[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const photosPerPage = 5
  const totalPages = Math.ceil(photos.length / photosPerPage)

  const nextPage = () => {
    if (currentIndex + photosPerPage < photos.length) {
      setCurrentIndex(currentIndex + photosPerPage)
    }
  }

  const prevPage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(Math.max(0, currentIndex - photosPerPage))
    }
  }

  const currentPhotos = photos.slice(currentIndex, currentIndex + photosPerPage)
  const emptySlots = Math.max(0, photosPerPage - currentPhotos.length)

  if (photos.length === 0) {
    return (
      <div className="hidden lg:flex items-center justify-center w-full h-30 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-sm">No photos available</p>
      </div>
    )
  }

  return (
    <div className="hidden lg:block relative">
      <div className="flex gap-2">
        {currentPhotos.map((photo, index) => (
          <div key={index} className="w-40 h-30 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={photo || "/placeholder.svg"}
              alt={`Business photo ${currentIndex + index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=120&width=160&text=No+Image"
              }}
            />
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="w-40 h-30 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex-shrink-0"
          />
        ))}
      </div>

      {/* Navigation arrows */}
      {photos.length > photosPerPage && (
        <>
          <button
            onClick={prevPage}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 bg-white rounded-full p-1 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            onClick={nextPage}
            disabled={currentIndex + photosPerPage >= photos.length}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-3 bg-white rounded-full p-1 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </>
      )}

      {/* Photo counter */}
      {photos.length > photosPerPage && (
        <div className="absolute top-1 right-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {Math.min(currentIndex + photosPerPage, photos.length)} of {photos.length}
        </div>
      )}

      {/* Pagination dots */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-2 gap-1">
          {Array.from({ length: totalPages }).map((_, pageIndex) => (
            <button
              key={pageIndex}
              onClick={() => setCurrentIndex(pageIndex * photosPerPage)}
              className={`w-1.5 h-1.5 rounded-full ${
                Math.floor(currentIndex / photosPerPage) === pageIndex ? "bg-blue-500" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Function to load business photos from Cloudflare
async function loadBusinessPhotos(business: Business): Promise<string[]> {
  const photos: string[] = []

  try {
    // Check photoAlbum array
    if (business.photoAlbum && Array.isArray(business.photoAlbum)) {
      business.photoAlbum.forEach((photo) => {
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

    // Check media.photoAlbum
    if (business.media?.photoAlbum && Array.isArray(business.media.photoAlbum)) {
      business.media.photoAlbum.forEach((photo) => {
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

    // Check adDesign.photoAlbum
    if (business.adDesignData?.photoAlbum && Array.isArray(business.adDesignData.photoAlbum)) {
      business.adDesignData.photoAlbum.forEach((photo) => {
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

    console.log(`Loaded ${photos.length} photos for business ${business.businessName}:`, photos)
    return photos
  } catch (error) {
    console.error(`Error loading photos for business ${business.businessName}:`, error)
    return []
  }
}

// Add a helper function to extract subcategory strings
function getSubcategoryString(subcategory: any): string {
  if (typeof subcategory === "string") {
    return subcategory
  }

  // Handle object format with various possible properties
  if (typeof subcategory === "object" && subcategory !== null) {
    // Return the most specific value available
    return (
      subcategory.subcategory || subcategory.name || subcategory.fullPath || subcategory.category || "Unknown Service"
    )
  }

  return "Unknown Service"
}

export default function FitnessAthleticsPage() {
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

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // State for business profile dialog
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  const [businesses, setBusinesses] = useState([])
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // Load user zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
      console.log(`User zip code loaded: ${savedZipCode}`)
    } else {
      console.log("No user zip code found in localStorage")
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      setLoading(true)
      try {
        const result = await getBusinessesForCategoryPage("/fitness-athletics")
        setBusinesses(result)

        // Load photos for all businesses
        const photoPromises = result.map(async (business) => {
          const photos = await loadBusinessPhotos(business)
          return { businessId: business.id, photos }
        })

        const photoResults = await Promise.all(photoPromises)
        const photoMap = {}
        photoResults.forEach(({ businessId, photos }) => {
          photoMap[businessId] = photos
        })
        setBusinessPhotos(photoMap)
      } catch (error) {
        console.error("Error fetching businesses:", error)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  // Function to handle opening business profile dialog
  const handleViewProfile = (business) => {
    setSelectedBusiness(business)
    setIsProfileDialogOpen(true)
  }

  // Function to check if a service matches any selected filter
  const isServiceMatched = (service) => {
    if (selectedFilters.length === 0) return false

    const serviceStr = typeof service === "string" ? service : getSubcategoryString(service)

    return selectedFilters.some((filterId) => {
      const filterOption = filterOptions.find((opt) => opt.id === filterId)
      if (!filterOption) return false

      return filterOption.value === serviceStr || serviceStr.includes(filterOption.value)
    })
  }

  return (
    <CategoryLayout title="Athletics, Fitness & Dance Instruction" backLink="/" backText="Categories">
      <CategoryFilter options={filterOptions} />

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Showing businesses that service: {userZipCode}</p>
              <p className="text-sm text-blue-700">Only businesses available in your area are displayed</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Fitness & Athletics Services Found</h3>
            <p className="text-gray-600 mb-4">
              We're currently building our network of fitness professionals and athletic instructors in your area.
            </p>
            <Button>Register Your Business</Button>
          </div>
        ) : (
          businesses.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Left: Business Information */}
                  <div className="lg:w-56 flex-shrink-0">
                    <h3 className="text-xl font-semibold mb-2">
                      {provider.displayName || provider.businessName || provider.name || "Business Name"}
                    </h3>

                    {/* Service Area Indicators */}
                    <div className="mb-3">
                      {provider.isNationwide ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Nationwide Service
                        </span>
                      ) : provider.zipCode ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Services {provider.zipCode}
                        </span>
                      ) : null}
                    </div>

                    {/* Business Description */}
                    {provider.businessDescription && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-3">{provider.businessDescription}</p>
                    )}

                    {/* Contact Information */}
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      {provider.displayLocation && (
                        <p>
                          <span className="font-medium">Location:</span> {provider.displayLocation}
                        </p>
                      )}
                      {provider.displayPhone && (
                        <p>
                          <span className="font-medium">Phone:</span> {provider.displayPhone}
                        </p>
                      )}
                    </div>

                    {/* Display subcategories/specialties */}
                    {provider.subcategories && provider.subcategories.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">Specialties:</p>
                        <div className="flex flex-wrap gap-1">
                          {provider.subcategories.slice(0, 3).map((subcategory, idx) => {
                            const subcategoryText = getSubcategoryString(subcategory)
                            return (
                              <span
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  isServiceMatched(subcategoryText)
                                    ? "bg-blue-100 text-blue-800 font-medium"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {subcategoryText}
                              </span>
                            )
                          })}
                          {provider.subcategories.length > 3 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                              +{provider.subcategories.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Center: Photo Carousel */}
                  <div className="flex-1">
                    <PhotoCarousel photos={businessPhotos[provider.id] || []} />
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="lg:w-28 flex flex-col justify-start gap-2 flex-shrink-0">
                    <Button className="w-full min-w-[110px]" onClick={() => handleOpenReviews(provider)}>
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full min-w-[110px] bg-transparent"
                      onClick={() => handleViewProfile(provider)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name}
        reviews={selectedProvider?.reviews || []}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusiness?.id}
        businessName={selectedBusiness?.name}
      />

      <Toaster />
    </CategoryLayout>
  )
}
