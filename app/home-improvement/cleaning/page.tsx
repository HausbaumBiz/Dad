"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useEffect } from "react"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { StarRating } from "@/components/star-rating"
import { getBusinessReviews } from "@/app/actions/review-actions"
import { Heart, HeartHandshake, Loader2, MapPin, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const filterOptions = [
  { id: "cleaning1", label: "House Cleaning", value: "House Cleaning" },
  { id: "cleaning2", label: "Office Cleaning", value: "Office Cleaning" },
  { id: "cleaning3", label: "Window Cleaning", value: "Window Cleaning" },
  { id: "cleaning4", label: "Deep Carpet and Floor Cleaning", value: "Deep Carpet and Floor Cleaning" },
  { id: "cleaning5", label: "Other Home and Office Cleaning", value: "Other Home and Office Cleaning" },
]

export default function CleaningPage() {
  // Extract service tags from subcategories
  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    return subcategories
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
    // No slice limit to show all subcategories
  }

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
  const [allBusinesses, setAllBusinesses] = useState<any[]>([])

  // Photo state
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: any[] }>({})

  // State for ratings and reviews
  const [businessRatings, setBusinessRatings] = useState<{ [key: string]: number }>({})
  const [businessReviews, setBusinessReviews] = useState<{ [key: string]: any[] }>({})

  // Favorites state
  const [currentUser, setCurrentUser] = useState(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<{ [key: string]: boolean }>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const { toast } = useToast()

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

  // Handle filter changes
  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
    if (checked) {
      setSelectedFilters((prev) => [...prev, filterId])
    } else {
      setSelectedFilters((prev) => prev.filter((id) => id !== filterId))
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters([])
  }

  // Check user session and load favorites
  useEffect(() => {
    async function checkUserSession() {
      try {
        const session = await getUserSession()
        if (session?.user) {
          setCurrentUser(session.user)
          console.log("User session found:", session.user.email)
        } else {
          console.log("No user session found")
        }
      } catch (error) {
        console.error("Error checking user session:", error)
      }
    }

    checkUserSession()
  }, [])

  // Load favorites when user changes
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser) {
        setFavoriteBusinesses(new Set())
        return
      }

      try {
        // Check favorites for all current providers
        const favoriteChecks = await Promise.all(
          providers.map(async (provider) => {
            const isFavorite = await checkIfBusinessIsFavorite(provider.id)
            return { id: provider.id, isFavorite }
          }),
        )

        const favoriteIds = favoriteChecks.filter((check) => check.isFavorite).map((check) => check.id)
        setFavoriteBusinesses(new Set(favoriteIds))
        console.log("Loaded favorites:", favoriteIds)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (providers.length > 0) {
      loadFavorites()
    }
  }, [currentUser, providers])

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

      const result = await addFavoriteBusiness(businessData)

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, provider.id]))
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

  // Function to extract service tags from subcategories
  const getServiceTags = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    return subcategories
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
      .slice(0, 4) // Limit to 4 tags for display
  }

  useEffect(() => {
    async function fetchBusinesses() {
      if (userZipCode === undefined) return // Wait until zip code is loaded (even if null)

      setLoading(true)
      try {
        console.log("Fetching cleaning businesses with subcategory path...")
        const result = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Home and Office Cleaning")
        console.log(`Found ${result.length} total cleaning businesses`)

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

          setAllBusinesses(transformedProviders)
          setProviders(transformedProviders)

          // Load reviews for each business
          transformedProviders.forEach((provider) => {
            loadBusinessReviews(provider.id)
          })
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

          setAllBusinesses(transformedProviders)
          setProviders(transformedProviders)

          // Load reviews for each business
          transformedProviders.forEach((provider) => {
            loadBusinessReviews(provider.id)
          })
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

  // Filter businesses based on selected filters
  useEffect(() => {
    if (selectedFilters.length === 0) {
      // If no filters selected, show all businesses
      setProviders(allBusinesses)
      return
    }

    // Get the filter values from the filter IDs
    const filterValues = selectedFilters.map(
      (filterId) => filterOptions.find((option) => option.id === filterId)?.value || "",
    )
    console.log("Looking for filter values:", filterValues)

    // Filter businesses that have at least one matching service
    const filtered = allBusinesses.filter((provider) => {
      // Get all terminal subcategories for this business
      const businessServices = getAllTerminalSubcategories(provider.businessData.subcategories || [])
      console.log(`Business ${provider.name} services:`, businessServices)

      // Check if any of the business services match any of the selected filter values
      return businessServices.some((service) => {
        return filterValues.some((filterValue) => {
          console.log(`Comparing: "${service}" with "${filterValue}"`)
          return service === filterValue
        })
      })
    })

    console.log(`Applied filters: ${JSON.stringify(selectedFilters)}`)
    console.log(`Showing ${filtered.length} of ${allBusinesses.length} businesses`)
    setProviders(filtered)
  }, [selectedFilters, allBusinesses])

  // Function to handle opening reviews dialog
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

  // Check if a service matches any selected filter
  const isServiceMatched = (service) => {
    if (selectedFilters.length === 0) return false

    const filterValues = selectedFilters.map(
      (filterId) => filterOptions.find((option) => option.id === filterId)?.value || "",
    )

    return filterValues.some((filterValue) => service === filterValue)
  }

  return (
    <CategoryLayout title="Home and Office Cleaning" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Filter Status */}
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Filtering by {selectedFilters.length} service{selectedFilters.length > 1 ? "s" : ""}:{" "}
                {selectedFilters
                  .map((filterId) => filterOptions.find((option) => option.id === filterId)?.label)
                  .join(", ")}
              </p>
              <p className="text-sm text-blue-700">
                Showing {providers.length} of {allBusinesses.length} businesses
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
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedFilters.length > 0 ? "No Cleaning Services Match Your Filters" : "No Cleaning Services Found"}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedFilters.length > 0
                ? "Try selecting different filters or clear all filters to see all available cleaning services."
                : userZipCode
                  ? `We're currently building our network of cleaning services in the ${userZipCode} area.`
                  : "Be the first cleaning service to join our platform and help local customers keep their spaces spotless!"}
            </p>
            {selectedFilters.length > 0 ? (
              <Button onClick={clearFilters}>Clear All Filters</Button>
            ) : (
              <Button>Register Your Cleaning Business</Button>
            )}
          </div>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{provider.name}</h3>

                    {/* Contact Info Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {/* Location */}
                      {provider.location && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-primary" />
                          <span>{provider.location}</span>
                        </div>
                      )}

                      {/* Phone */}
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
                      <div className="flex items-center gap-2">
                        <StarRating rating={businessRatings[provider.id]} />
                        <span className="text-sm text-gray-600">
                          {businessRatings[provider.id].toFixed(1)} ({businessReviews[provider.id]?.length || 0}{" "}
                          reviews)
                        </span>
                      </div>
                    )}

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        Services ({getAllTerminalSubcategories(provider.businessData.subcategories).length}):
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto">
                        {getAllTerminalSubcategories(provider.businessData.subcategories).length > 0 ? (
                          getAllTerminalSubcategories(provider.businessData.subcategories).map((service, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                                ${
                                  isServiceMatched(service)
                                    ? "bg-green-100 text-green-800 ring-1 ring-green-400"
                                    : "bg-primary/10 text-primary"
                                }`}
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Cleaning Services
                          </span>
                        )}
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

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-32">
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
                        variant={favoriteBusinesses.has(provider.id) ? "default" : "outline"}
                        className={`flex-1 lg:flex-none ${
                          favoriteBusinesses.has(provider.id)
                            ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "border-red-600 text-red-600 hover:bg-red-50"
                        }`}
                        onClick={() => handleAddToFavorites(provider)}
                        disabled={savingStates[provider.id]}
                      >
                        {savingStates[provider.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : favoriteBusinesses.has(provider.id) ? (
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
          ))
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
        onSuccess={() => {
          setIsLoginDialogOpen(false)
          // Refresh user session after successful login
          getUserSession().then((session) => {
            if (session?.user) {
              setCurrentUser(session.user)
            }
          })
        }}
      />

      <Toaster />
    </CategoryLayout>
  )
}
