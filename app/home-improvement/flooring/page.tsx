"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { getBusinessReviews } from "@/app/actions/review-actions"
import { StarRating } from "@/components/star-rating"
import { Heart, HeartHandshake, Loader2, MapPin, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FlooringPage() {
  const { toast } = useToast()

  const filterOptions = [
    { id: "flooring1", label: "Hardwood Flooring", value: "Hardwood Flooring" },
    { id: "flooring2", label: "Laminate Flooring", value: "Laminate Flooring" },
    { id: "flooring3", label: "Tile Installation", value: "Tile Installation" },
    { id: "flooring4", label: "Carpet Installation", value: "Carpet Installation" },
    { id: "flooring5", label: "Vinyl Flooring", value: "Vinyl Flooring" },
    { id: "flooring6", label: "Floor Refinishing", value: "Floor Refinishing" },
    { id: "flooring7", label: "Other Flooring Services", value: "Other Flooring Services" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // State for business profile dialog
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // State for business photos
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: string[] }>({})

  // State for favorites functionality
  const [currentUser, setCurrentUser] = useState(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<{ [key: string]: boolean }>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  // State for ratings functionality
  const [businessRatings, setBusinessRatings] = useState<{ [key: string]: number }>({})
  const [businessReviews, setBusinessReviews] = useState<{ [key: string]: any[] }>({})

  // Function to load reviews and calculate ratings for a business
  const loadBusinessReviews = async (businessId: string) => {
    if (businessReviews[businessId]) return // Already loaded

    try {
      const reviews = await getBusinessReviews(businessId)
      setBusinessReviews((prev) => ({
        ...prev,
        [businessId]: reviews,
      }))

      // Calculate average rating
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + (review.overallRating || review.rating || 0), 0)
        const averageRating = totalRating / reviews.length
        setBusinessRatings((prev) => ({
          ...prev,
          [businessId]: averageRating,
        }))
      }
    } catch (error) {
      console.error(`Failed to load reviews for business ${businessId}:`, error)
      setBusinessReviews((prev) => ({
        ...prev,
        [businessId]: [],
      }))
    }
  }

  // Function to load photos for a specific business
  const loadPhotosForBusiness = async (businessId: string) => {
    if (businessPhotos[businessId]) return // Already loaded

    try {
      const photos = await loadBusinessPhotos(businessId)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: photos,
      }))
    } catch (error) {
      console.error(`Failed to load photos for business ${businessId}:`, error)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: [],
      }))
    }
  }

  // Check user session
  useEffect(() => {
    async function checkUserSession() {
      try {
        const user = await getUserSession()
        setCurrentUser(user)
      } catch (error) {
        console.error("Error checking user session:", error)
        setCurrentUser(null)
      }
    }
    checkUserSession()
  }, [])

  // Load user's favorite businesses
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser?.id) return

      try {
        // Check which businesses are favorites for this user
        const favoriteIds = new Set<string>()

        for (const business of businesses) {
          const isFavorite = await checkIfBusinessIsFavorite(currentUser.id, business.id)
          if (isFavorite) {
            favoriteIds.add(business.id)
          }
        }

        setFavoriteBusinesses(favoriteIds)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (businesses.length > 0 && currentUser?.id) {
      loadFavorites()
    }
  }, [businesses, currentUser])

  // Load reviews for all businesses when they're loaded
  useEffect(() => {
    if (businesses.length > 0) {
      businesses.forEach((business) => {
        loadBusinessReviews(business.id)
      })
    }
  }, [businesses])

  // Function to handle adding business to favorites
  const handleAddToFavorites = async (business: any) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    // Check if already saved
    if (favoriteBusinesses.has(business.id)) {
      toast({
        title: "Already Saved",
        description: "This business card is already in your favorites.",
        variant: "default",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [business.id]: true }))

    try {
      const businessData = {
        id: business.id,
        businessName: business.businessName,
        displayName: business.displayName,
        phone: business.displayPhone,
        email: business.email,
        address: business.displayLocation,
        zipCode: business.zipCode,
      }

      await addFavoriteBusiness(currentUser.id, businessData)

      setFavoriteBusinesses((prev) => new Set([...prev, business.id]))

      toast({
        title: "Business Card Saved!",
        description: `${business.displayName} has been added to your favorites.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error saving business to favorites:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [business.id]: false }))
    }
  }

  // Load user zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
      console.log(`User zip code loaded: ${savedZipCode}`)
    } else {
      console.log("No user zip code found in localStorage")
      setUserZipCode(null)
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      if (userZipCode === undefined) return // Wait until zip code is loaded (even if null)

      setLoading(true)
      try {
        console.log("Fetching businesses for Flooring subcategory...")
        const result = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Flooring")
        console.log(`Found ${result.length} total businesses for flooring`)

        // If we have a zip code, filter by service area
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          const filteredBusinesses = []

          for (const business of result) {
            try {
              const response = await fetch(`/api/admin/business/${business.id}/service-area`)
              if (response.ok) {
                const serviceAreaData = await response.json()
                console.log(`Service area data for ${business.displayName}:`, {
                  zipCount: serviceAreaData.zipCodes?.length || 0,
                  isNationwide: serviceAreaData.isNationwide,
                  businessId: serviceAreaData.businessId,
                })

                // Check if business is nationwide
                if (serviceAreaData.isNationwide) {
                  console.log(`✅ ${business.displayName} services nationwide (including ${userZipCode})`)
                  filteredBusinesses.push(business)
                  continue
                }

                // Check if the user's zip code is in the business's service area
                if (serviceAreaData.zipCodes && Array.isArray(serviceAreaData.zipCodes)) {
                  const servicesUserZip = serviceAreaData.zipCodes.some((zipData) => {
                    // Handle both string and object formats
                    const zipCode = typeof zipData === "string" ? zipData : zipData?.zip
                    return zipCode === userZipCode
                  })

                  if (servicesUserZip) {
                    console.log(`✅ ${business.displayName} services zip code ${userZipCode}`)
                    filteredBusinesses.push(business)
                  } else {
                    console.log(`❌ ${business.displayName} does not service zip code ${userZipCode}`)
                  }
                } else {
                  console.log(`⚠️ ${business.displayName} has no service area data, including by default`)
                  filteredBusinesses.push(business)
                }
              } else {
                console.log(`⚠️ Could not fetch service area for ${business.displayName}, including by default`)
                filteredBusinesses.push(business)
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName}:`, error)
              filteredBusinesses.push(business)
            }
          }

          console.log(`After zip code filtering: ${filteredBusinesses.length} businesses service ${userZipCode}`)
          setBusinesses(filteredBusinesses)
        } else {
          console.log("No user zip code available, showing all businesses")
          setBusinesses(result)
        }
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
    setSelectedProvider({
      ...provider,
      reviews: businessReviews[provider.id] || [],
      rating: businessRatings[provider.id] || 0,
    })
    setIsReviewsDialogOpen(true)
  }

  // Function to handle opening business profile dialog
  const handleViewProfile = (business) => {
    setSelectedBusiness(business)
    setIsProfileDialogOpen(true)
  }

  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
    if (checked) {
      setSelectedFilters((prev) => [...prev, filterId])
    } else {
      setSelectedFilters((prev) => prev.filter((id) => id !== filterId))
    }
  }

  const clearFilters = () => {
    setSelectedFilters([])
  }

  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    const allSubcategories = subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        const parts = path.split(" > ")
        if (parts.length < 2) return null

        return parts[parts.length - 1].trim()
      })
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)

    console.log(`Processing ${subcategories.length} subcategories for service extraction`)
    return allSubcategories
  }

  const filteredBusinesses =
    selectedFilters.length === 0
      ? businesses
      : businesses.filter((business) => {
          const businessServices = getAllTerminalSubcategories(business.subcategories)

          const filterValues = selectedFilters.map((filterId) => {
            const option = filterOptions.find((opt) => opt.id === filterId)
            return option?.value || filterId
          })

          console.log(`Business ${business.displayName} services:`, businessServices)
          console.log(`Looking for filter values:`, filterValues)

          return filterValues.some((filterValue) =>
            businessServices.some(
              (service) =>
                service.toLowerCase().includes(filterValue.toLowerCase()) ||
                filterValue.toLowerCase().includes(service.toLowerCase()),
            ),
          )
        })

  console.log(`Applied filters: ${JSON.stringify(selectedFilters)}`)
  console.log(`Showing ${filteredBusinesses.length} of ${businesses.length} businesses`)

  return (
    <CategoryLayout title="Flooring" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">
                Filtering by {selectedFilters.length} service{selectedFilters.length > 1 ? "s" : ""}:{" "}
                {selectedFilters
                  .map((filterId) => {
                    const option = filterOptions.find((opt) => opt.id === filterId)
                    return option?.label || filterId
                  })
                  .join(", ")}
              </p>
              <p className="text-sm text-green-700">
                Showing {filteredBusinesses.length} of {businesses.length} businesses
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}

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
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Flooring Services Found</h3>
            <p className="text-gray-600 mb-6">
              {userZipCode
                ? `We're currently building our network of flooring specialists in the ${userZipCode} area.`
                : "Be the first flooring specialist to join our platform and help local customers with their flooring needs!"}
            </p>
            <Button>Register Your Flooring Business</Button>
          </div>
        ) : (
          filteredBusinesses.map((business) => {
            const allServices = getAllTerminalSubcategories(business.subcategories)
            const isFavorite = favoriteBusinesses.has(business.id)
            const isSaving = savingStates[business.id] || false
            const businessRating = businessRatings[business.id]
            const businessReviewList = businessReviews[business.id] || []

            return (
              <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Business Info */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{business.displayName}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {business.displayLocation && (
                          <span className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {business.displayLocation}
                          </span>
                        )}
                        {business.displayPhone && (
                          <span className="flex items-center">
                            <Phone className="w-4 h-4 mr-1" />
                            {business.displayPhone}
                          </span>
                        )}
                      </div>

                      {/* Rating Display */}
                      {businessRating && businessReviewList.length > 0 && (
                        <div className="flex items-center gap-2">
                          <StarRating rating={businessRating} />
                          <span className="text-sm text-gray-600">
                            {businessRating.toFixed(1)} ({businessReviewList.length} review
                            {businessReviewList.length !== 1 ? "s" : ""})
                          </span>
                        </div>
                      )}

                      {allServices.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700">Services ({allServices.length}):</p>
                          <div className="max-h-32 overflow-y-auto">
                            <div className="flex flex-wrap gap-2 mt-1">
                              {allServices.map((service, idx) => {
                                const filterValues = selectedFilters.map((filterId) => {
                                  const option = filterOptions.find((opt) => opt.id === filterId)
                                  return option?.value || filterId
                                })

                                const isHighlighted =
                                  selectedFilters.length > 0 &&
                                  filterValues.some(
                                    (filterValue) =>
                                      service.toLowerCase().includes(filterValue.toLowerCase()) ||
                                      filterValue.toLowerCase().includes(service.toLowerCase()),
                                  )

                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                      isHighlighted
                                        ? "bg-green-100 text-green-800 ring-2 ring-green-300"
                                        : "bg-primary/10 text-primary"
                                    }`}
                                  >
                                    {service}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                          {allServices.length > 8 && (
                            <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Photo Carousel and Buttons */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Photo Carousel */}
                      <div className="flex-1">
                        <PhotoCarousel
                          businessId={business.id}
                          photos={businessPhotos[business.id] || []}
                          onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                          showMultiple={true}
                          photosPerView={5}
                          className="w-full"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-32">
                        <Button className="flex-1 lg:w-full" onClick={() => handleOpenReviews(business)}>
                          Ratings
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 lg:w-full bg-transparent"
                          onClick={() => handleViewProfile(business)}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant={isFavorite ? "default" : "outline"}
                          className={`flex-1 lg:w-full ${
                            isFavorite
                              ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                              : "border-red-600 text-red-600 hover:bg-red-50"
                          }`}
                          onClick={() => handleAddToFavorites(business)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : isFavorite ? (
                            <>
                              <HeartHandshake className="w-4 h-4 mr-2" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Heart className="w-4 h-4 mr-2" />
                              Save Card
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.displayName}
        businessId={selectedProvider?.id}
        reviews={selectedProvider?.reviews || []}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusiness?.id}
        businessName={selectedBusiness?.displayName}
      />

      {/* Login Dialog */}
      <ReviewLoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user)
          setIsLoginDialogOpen(false)
        }}
      />

      <Toaster />
    </CategoryLayout>
  )
}
