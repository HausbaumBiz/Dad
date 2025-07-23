"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { PhotoCarousel } from "@/components/photo-carousel"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { Heart, HeartHandshake, Loader2, MapPin, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { StarRating } from "@/components/star-rating"
import { getBusinessReviews } from "@/app/actions/review-actions"

const filterOptions = [
  { id: "fireplace1", label: "Chimney Sweep", value: "Chimney Sweep" },
  { id: "fireplace2", label: "Chimney and Chimney Cap Repair", value: "Chimney and Chimney Cap Repair" },
  { id: "fireplace3", label: "Gas Fireplace Repair", value: "Gas Fireplace Repair" },
  { id: "fireplace4", label: "Fireplace Services", value: "Fireplace Services" },
  { id: "fireplace5", label: "Firewood Suppliers", value: "Firewood Suppliers" },
  { id: "fireplace6", label: "Heating Oil Suppliers", value: "Heating Oil Suppliers" },
  { id: "fireplace7", label: "Other Fireplaces and Chimneys", value: "Other Fireplaces and Chimneys" },
]

export default function FireplacesChimneysPage() {
  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined)

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<any[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([])

  // Photo state
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: any[] }>({})

  // Favorites functionality state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<{ [key: string]: boolean }>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const { toast } = useToast()

  // Rating state management
  const [businessRatings, setBusinessRatings] = useState<{ [key: string]: { rating: number; reviewCount: number } }>({})
  const [businessReviews, setBusinessReviews] = useState<{ [key: string]: any[] }>({})

  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    return subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        const parts = path.split(" > ")
        if (parts.length < 2) return null

        return parts[parts.length - 1]
      })
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index)
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

  // Load user session
  useEffect(() => {
    async function loadUserSession() {
      try {
        const session = await getUserSession()
        setCurrentUser(session?.user || null)
      } catch (error) {
        console.error("Error loading user session:", error)
        setCurrentUser(null)
      }
    }
    loadUserSession()
  }, [])

  // Load user's favorite businesses
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser?.id) return

      try {
        const favoriteIds = new Set<string>()

        for (const business of allBusinesses) {
          const isFavorite = await checkIfBusinessIsFavorite(business.id)
          if (isFavorite) {
            favoriteIds.add(business.id)
          }
        }

        setFavoriteBusinesses(favoriteIds)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (allBusinesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, allBusinesses])

  // Load reviews and ratings for all businesses
  useEffect(() => {
    async function loadAllReviews() {
      for (const business of allBusinesses) {
        await loadBusinessReviews(business.id)
      }
    }

    if (allBusinesses.length > 0) {
      loadAllReviews()
    }
  }, [allBusinesses])

  // Function to load reviews and ratings for a specific business
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
        const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0)
        const averageRating = totalRating / reviews.length
        setBusinessRatings((prev) => ({
          ...prev,
          [businessId]: {
            rating: Math.round(averageRating * 10) / 10,
            reviewCount: reviews.length,
          },
        }))
      } else {
        setBusinessRatings((prev) => ({
          ...prev,
          [businessId]: {
            rating: 0,
            reviewCount: 0,
          },
        }))
      }
    } catch (error) {
      console.error(`Failed to load reviews for business ${businessId}:`, error)
      setBusinessReviews((prev) => ({
        ...prev,
        [businessId]: [],
      }))
      setBusinessRatings((prev) => ({
        ...prev,
        [businessId]: {
          rating: 0,
          reviewCount: 0,
        },
      }))
    }
  }

  // Handle adding business to favorites
  const handleAddToFavorites = async (business: any) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

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
        businessName: business.businessData.businessName,
        displayName: business.businessData.displayName,
        phone: business.businessData.displayPhone,
        email: business.businessData.email,
        address: business.businessData.displayLocation,
        zipCode: business.businessData.zipCode,
      }

      const result = await addFavoriteBusiness(businessData)

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, business.id]))

        toast({
          title: "Business Card Saved!",
          description: result.message,
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding to favorites:", error)
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
        console.log("Fetching fireplaces and chimneys businesses with subcategory path...")
        const result = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Fireplaces and Chimneys")
        console.log(`Found ${result.length} total fireplaces and chimneys businesses`)

        // If we have a zip code, filter by service area
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          const filteredBusinesses = []

          for (const business of result) {
            try {
              const response = await fetch(`/api/admin/business/${business.id}/service-area`)
              if (response.ok) {
                const serviceAreaData = await response.json()
                console.log(`Service area data for ${business.displayName || business.businessName}:`, {
                  zipCount: serviceAreaData.zipCodes?.length || 0,
                  isNationwide: serviceAreaData.isNationwide,
                  businessId: serviceAreaData.businessId,
                })

                // Check if business is nationwide
                if (serviceAreaData.isNationwide) {
                  console.log(
                    `✅ ${business.displayName || business.businessName} services nationwide (including ${userZipCode})`,
                  )
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
                    console.log(`✅ ${business.displayName || business.businessName} services zip code ${userZipCode}`)
                    filteredBusinesses.push(business)
                  } else {
                    console.log(
                      `❌ ${business.displayName || business.businessName} does not service zip code ${userZipCode}`,
                    )
                  }
                } else {
                  console.log(
                    `⚠️ ${business.displayName || business.businessName} has no service area data, including by default`,
                  )
                  filteredBusinesses.push(business)
                }
              } else {
                console.log(
                  `⚠️ Could not fetch service area for ${business.displayName || business.businessName}, including by default`,
                )
                filteredBusinesses.push(business)
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName || business.businessName}:`, error)
              filteredBusinesses.push(business)
            }
          }

          console.log(`After zip code filtering: ${filteredBusinesses.length} businesses service ${userZipCode}`)

          // Transform the data for display
          const transformedProviders = filteredBusinesses.map((business) => {
            // Extract service tags from subcategories
            const serviceTags = getServiceTags(business.subcategories || [])

            return {
              id: business.id,
              name: business.displayName || business.businessName,
              location: business.displayLocation || `${business.city || ""}, ${business.state || ""}`,
              phone: business.displayPhone || business.phone,
              rating: business.rating || 0,
              reviews: business.reviewCount || 0,
              services: serviceTags,
              // Keep the original business data for the profile dialog
              businessData: business,
            }
          })

          setProviders(transformedProviders)
          setAllBusinesses(transformedProviders)
        } else {
          console.log("No user zip code available, showing all businesses")

          // Transform the data for display
          const transformedProviders = result.map((business) => {
            // Extract service tags from subcategories
            const serviceTags = getServiceTags(business.subcategories || [])

            return {
              id: business.id,
              name: business.displayName || business.businessName,
              location: business.displayLocation || `${business.city || ""}, ${business.state || ""}`,
              phone: business.displayPhone || business.phone,
              rating: business.rating || 0,
              reviews: business.reviewCount || 0,
              services: serviceTags,
              // Keep the original business data for the profile dialog
              businessData: business,
            }
          })

          setProviders(transformedProviders)
          setAllBusinesses(transformedProviders)
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

  useEffect(() => {
    if (selectedFilters.length === 0) {
      setFilteredBusinesses(allBusinesses)
      return
    }

    const filterValues = selectedFilters
      .map((filterId) => {
        const option = filterOptions.find((opt) => opt.id === filterId)
        return option?.value
      })
      .filter(Boolean)

    console.log("Looking for filter values:", filterValues)

    const filtered = allBusinesses.filter((business) => {
      const businessServices = getAllTerminalSubcategories(business.businessData.subcategories)

      return filterValues.some((filterValue) => businessServices.some((service) => service === filterValue))
    })

    setFilteredBusinesses(filtered)
  }, [selectedFilters, allBusinesses])

  // Function to load photos for a business
  const loadPhotosForBusiness = async (businessId: string) => {
    if (businessPhotos[businessId]) return // Already loaded

    try {
      const photos = await loadBusinessPhotos(businessId)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: photos,
      }))
    } catch (error) {
      console.error(`Error loading photos for business ${businessId}:`, error)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: [],
      }))
    }
  }

  // Replace the getServiceTags function with this improved version that shows all terminal subcategories

  // Replace this function:
  const getServiceTags = (subcategories) => {
    return subcategories
      .filter((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        return path && path.includes("Fireplaces and Chimneys")
      })
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return "Fireplace Services"

        const parts = path.split(" > ")
        return parts[parts.length - 1] // Get just the service name
      })
      .slice(0, 3) // Limit to 3 for display
  }

  // With this improved version:

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    const providerWithReviews = {
      ...provider,
      reviews: businessReviews[provider.id] || [],
      rating: businessRatings[provider.id]?.rating || 0,
      reviewCount: businessRatings[provider.id]?.reviewCount || 0,
    }
    setSelectedProvider(providerWithReviews)
    setIsReviewsDialogOpen(true)
  }

  // Handle opening profile dialog
  const handleViewProfile = (provider) => {
    setSelectedBusiness(provider.businessData)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Fireplaces and Chimneys" backLink="/home-improvement" backText="Home Improvement">
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
                    return option?.label
                  })
                  .join(", ")}
              </p>
              <p className="text-sm text-green-700">
                Showing {filteredBusinesses.length} of {allBusinesses.length} businesses
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
        ) : filteredBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Fireplace & Chimney Services Found</h3>
            <p className="text-gray-600 mb-6">
              {userZipCode
                ? `We're currently building our network of fireplace and chimney services in the ${userZipCode} area.`
                : "Be the first fireplace and chimney service to join our platform and help local homeowners!"}
            </p>
            <Button>Register Your Fireplace Business</Button>
          </div>
        ) : (
          filteredBusinesses.map((provider) => {
            const businessRating = businessRatings[provider.id]
            const isFavorite = favoriteBusinesses.has(provider.id)
            const isSaving = savingStates[provider.id]

            return (
              <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Business Info */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{provider.name}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {provider.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-primary" />
                            <span>{provider.location}</span>
                          </div>
                        )}
                        {provider.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1 text-primary" />
                            <a href={`tel:${provider.phone}`} className="hover:text-primary transition-colors">
                              {provider.phone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Rating Display */}
                      {businessRating && businessRating.reviewCount > 0 && (
                        <div className="flex items-center gap-2">
                          <StarRating rating={businessRating.rating} size="sm" />
                          <span className="text-sm text-gray-600">
                            {businessRating.rating.toFixed(1)} ({businessRating.reviewCount}{" "}
                            {businessRating.reviewCount === 1 ? "review" : "reviews"})
                          </span>
                        </div>
                      )}

                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700">
                          Services ({getAllTerminalSubcategories(provider.businessData.subcategories).length}):
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto">
                          {getAllTerminalSubcategories(provider.businessData.subcategories).map((service, idx) => {
                            const filterValues = selectedFilters
                              .map((filterId) => {
                                const option = filterOptions.find((opt) => opt.id === filterId)
                                return option?.value
                              })
                              .filter(Boolean)

                            const isHighlighted = filterValues.includes(service)

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
                        {getAllTerminalSubcategories(provider.businessData.subcategories).length > 8 && (
                          <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
                        )}
                      </div>
                    </div>

                    {/* Photo Carousel and Buttons */}
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="flex-1">
                        <PhotoCarousel
                          businessId={provider.id}
                          photos={businessPhotos[provider.id] || []}
                          onLoadPhotos={() => loadPhotosForBusiness(provider.id)}
                          showMultiple={true}
                          photosPerView={5}
                        />
                      </div>
                      <div className="flex flex-row lg:flex-col gap-2 lg:w-32">
                        <Button className="flex-1 lg:flex-none" onClick={() => handleOpenReviews(provider)}>
                          Ratings
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 lg:flex-none bg-transparent"
                          onClick={() => handleViewProfile(provider)}
                        >
                          View Profile
                        </Button>
                        <Button
                          variant={isFavorite ? "default" : "outline"}
                          className={`flex-1 lg:flex-none ${
                            isFavorite
                              ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                              : "border-red-600 text-red-600 hover:bg-red-50"
                          }`}
                          onClick={() => handleAddToFavorites(provider)}
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
        providerName={selectedProvider?.name}
        businessId={selectedProvider?.id}
        reviews={selectedProvider?.reviews || []}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusiness?.id}
        businessName={selectedBusiness?.displayName || selectedBusiness?.businessName}
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
