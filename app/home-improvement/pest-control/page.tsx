"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { StarRating } from "@/components/star-rating"
import { getBusinessReviews } from "@/app/actions/review-actions"
import { Heart, HeartHandshake, Loader2, MapPin, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function PestControlPage() {
  const { toast } = useToast()

  const filterOptions = [
    { id: "pest1", label: "Rodent/Small Animal Infestations", value: "Rodent/ Small Animal Infestations" },
    { id: "pest2", label: "Wildlife Removal", value: "Wildlife Removal" },
    { id: "pest3", label: "Insect and Bug Control", value: "Insect and Bug Control" },
    { id: "pest4", label: "Other Pest Control/Wildlife Removal", value: "Other Pest Control/Wildlife Removal" },
  ]

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Photo state
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: string[] }>({})

  // State for ratings and reviews
  const [businessRatings, setBusinessRatings] = useState<{ [key: string]: number }>({})
  const [businessReviews, setBusinessReviews] = useState<{ [key: string]: any[] }>({})

  // Favorites functionality state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<{ [key: string]: boolean }>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  // Load user session
  useEffect(() => {
    async function loadUserSession() {
      try {
        const user = await getUserSession()
        setCurrentUser(user)
      } catch (error) {
        console.error("Error loading user session:", error)
      }
    }
    loadUserSession()
  }, [])

  // Load user's favorite businesses
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser?.id) return

      try {
        const favorites = new Set<string>()
        for (const provider of providers) {
          const isFavorite = await checkIfBusinessIsFavorite(currentUser.id, provider.id)
          if (isFavorite) {
            favorites.add(provider.id)
          }
        }
        setFavoriteBusinesses(favorites)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (providers.length > 0) {
      loadFavorites()
    }
  }, [currentUser, providers])

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
      console.error(`Error loading photos for business ${businessId}:`, error)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: [],
      }))
    }
  }

  // Function to load reviews and calculate rating for a business
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

  // Handle adding business to favorites
  const handleAddToFavorites = async (provider: any) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(provider.id)) {
      toast({
        title: "Already Saved",
        description: "This business card is already in your favorites.",
        variant: "default",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [provider.id]: true }))

    try {
      const businessData = {
        id: provider.id,
        businessName: provider.businessData.businessName,
        displayName: provider.businessData.displayName,
        phone: provider.businessData.displayPhone,
        email: provider.businessData.email,
        address: provider.businessData.displayLocation,
        zipCode: provider.businessData.zipCode,
      }

      await addFavoriteBusiness(currentUser.id, businessData)

      setFavoriteBusinesses((prev) => new Set([...prev, provider.id]))

      toast({
        title: "Business Card Saved!",
        description: `${provider.name} has been added to your favorites.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error adding to favorites:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [provider.id]: false }))
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

  // Updated function to display ALL terminal subcategories
  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    const allSubcategories = subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        // Extract the specific service name (last part after the last >)
        const parts = path.split(" > ")

        // Skip if it's just a top-level category
        if (parts.length < 2) return null

        // Get the terminal subcategory (most specific service)
        return parts[parts.length - 1]
      })
      .filter(Boolean) // Remove nulls
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

    console.log(`Extracted ${allSubcategories.length} unique subcategories for display`)
    return allSubcategories
  }

  useEffect(() => {
    async function fetchBusinesses() {
      if (userZipCode === undefined) return // Wait until zip code is loaded (even if null)

      setLoading(true)
      try {
        console.log("Fetching pest control businesses...")

        // Use the more efficient category-based approach
        let result = []

        if (userZipCode) {
          // Fetch businesses by category and zip code efficiently
          console.log(`Fetching businesses for pest control category in zip code: ${userZipCode}`)

          // Try to get businesses using the category mapping system
          result = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Pest Control/Wildlife Removal")

          // Filter businesses that serve the user's zip code
          const filteredBusinesses = []

          for (const business of result) {
            // Check if business serves this zip code
            try {
              const response = await fetch(`/api/admin/business/${business.id}/service-area`)
              if (response.ok) {
                const serviceAreaData = await response.json()

                // Check if business is nationwide or serves the specific zip
                if (serviceAreaData.isNationwide) {
                  filteredBusinesses.push(business)
                } else if (serviceAreaData.zipCodes && Array.isArray(serviceAreaData.zipCodes)) {
                  const servicesUserZip = serviceAreaData.zipCodes.some((zipData) => {
                    const zipCode = typeof zipData === "string" ? zipData : zipData?.zip
                    return zipCode === userZipCode
                  })

                  if (servicesUserZip) {
                    filteredBusinesses.push(business)
                  }
                }
              } else {
                // If we can't check service area, include the business
                filteredBusinesses.push(business)
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName}:`, error)
              filteredBusinesses.push(business)
            }
          }

          result = filteredBusinesses
          console.log(`After filtering by zip code ${userZipCode}: ${result.length} businesses found`)
        } else {
          // No zip code, show all pest control businesses
          console.log("No user zip code, fetching all pest control businesses")
          result = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Pest Control/Wildlife Removal")
        }

        console.log(`Found ${result.length} total pest control businesses`)

        // Transform the data for display
        const transformedProviders = result.map((business) => {
          return {
            id: business.id,
            name: business.displayName || business.businessName,
            location:
              business.displayLocation ||
              `${business.city || ""}, ${business.state || ""}`.trim().replace(/^,|,$/g, "") ||
              "Location not specified",
            phone: business.displayPhone || business.phone,
            rating: business.rating || 0,
            reviews: business.reviewCount || 0,
            services: [],
            // Keep the original business data for the profile dialog
            businessData: business,
          }
        })

        setProviders(transformedProviders)

        // Load reviews for each business
        transformedProviders.forEach((provider) => {
          loadBusinessReviews(provider.id)
        })
      } catch (error) {
        console.error("Error fetching businesses:", error)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  // Handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider({
      ...provider,
      reviews: businessReviews[provider.id] || [],
      rating: businessRatings[provider.id] || 0,
    })
    setIsReviewsDialogOpen(true)
  }

  // Handle opening profile dialog
  const handleViewProfile = (provider) => {
    setSelectedBusiness(provider.businessData)
    setIsProfileDialogOpen(true)
  }

  // Filter businesses based on selected filters
  const filteredBusinesses =
    selectedFilters.length === 0
      ? providers
      : providers.filter((provider) => {
          const businessServices = getAllTerminalSubcategories(provider.businessData.subcategories)

          // Map filter IDs to their values
          const selectedFilterValues = selectedFilters.map((filterId) => {
            const option = filterOptions.find((opt) => opt.id === filterId)
            return option ? option.value : filterId
          })

          console.log(`Business ${provider.name} services:`, businessServices)
          console.log(`Looking for filter values:`, selectedFilterValues)

          // Check if any business service matches any selected filter
          return selectedFilterValues.some((filterValue) =>
            businessServices.some((service) => {
              console.log(`Comparing: "${service}" with "${filterValue}"`)
              return service === filterValue
            }),
          )
        })

  console.log(`Applied filters: ${JSON.stringify(selectedFilters)}`)
  console.log(`Showing ${filteredBusinesses.length} of ${providers.length} businesses`)

  return (
    <CategoryLayout title="Pest Control/Wildlife Removal" backLink="/home-improvement" backText="Home Improvement">
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
                    return option ? option.label : filterId
                  })
                  .join(", ")}
              </p>
              <p className="text-sm text-green-700">
                Showing {filteredBusinesses.length} of {providers.length} businesses
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
            {selectedFilters.length > 0 ? (
              <>
                <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Matching Services Found</h3>
                <p className="text-gray-600 mb-6">
                  No pest control businesses match your selected filters. Try selecting different services or clear the
                  filters to see all businesses.
                </p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </>
            ) : (
              <>
                <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pest Control Services Found</h3>
                <p className="text-gray-600 mb-6">
                  {userZipCode
                    ? `We're currently building our network of pest control services in the ${userZipCode} area.`
                    : "Be the first pest control service to join our platform and help local customers with their pest problems!"}
                </p>
                <Button>Register Your Pest Control Business</Button>
              </>
            )}
          </div>
        ) : (
          filteredBusinesses.map((provider) => {
            const allServices = getAllTerminalSubcategories(provider.businessData.subcategories)
            const isFavorite = favoriteBusinesses.has(provider.id)
            const isSaving = savingStates[provider.id]

            return (
              <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col space-y-2">
                    {/* Business Info */}
                    <div>
                      <h3 className="text-xl font-semibold">{provider.name}</h3>

                      {/* Contact Info Row */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-primary" />
                          <span>{provider.location}</span>
                        </div>
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
                      {businessRatings[provider.id] && (
                        <div className="flex items-center gap-2 mt-2">
                          <StarRating rating={businessRatings[provider.id]} />
                          <span className="text-sm text-gray-600">
                            {businessRatings[provider.id].toFixed(1)} ({businessReviews[provider.id]?.length || 0}{" "}
                            reviews)
                          </span>
                        </div>
                      )}

                      {allServices.length > 0 && (
                        <div className="mt-2">
                          <div className="max-h-32 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              {allServices.map((service, idx) => {
                                // Check if this service matches any selected filter
                                const selectedFilterValues = selectedFilters.map((filterId) => {
                                  const option = filterOptions.find((opt) => opt.id === filterId)
                                  return option ? option.value : filterId
                                })

                                const isHighlighted = selectedFilterValues.some(
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
                    <div className="flex flex-col lg:flex-row gap-4 mt-4">
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
