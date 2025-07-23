"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForSubcategory } from "@/lib/business-category-service"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { getBusinessReviews } from "@/app/actions/review-actions"
import { StarRating } from "@/components/star-rating"
import { Heart, HeartHandshake, Loader2, MapPin, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function LawnGardenPage() {
  const filterOptions = [
    { id: "lawn1", label: "Lawn Care", value: "Lawn Care" },
    { id: "lawn2", label: "Tree Service", value: "Tree Service" },
    { id: "lawn3", label: "Landscaping", value: "Landscaping" },
    { id: "lawn4", label: "Snow Removal", value: "Snow Removal" },
    { id: "lawn5", label: "Irrigation Systems", value: "Irrigation Systems" },
    { id: "lawn6", label: "Garden Design", value: "Garden Design" },
    { id: "lawn7", label: "Hardscaping", value: "Hardscaping" },
    { id: "lawn8", label: "Pest Control (Outdoor)", value: "Pest Control (Outdoor)" },
    { id: "lawn9", label: "Fertilization", value: "Fertilization" },
    { id: "lawn10", label: "Mulching", value: "Mulching" },
    { id: "lawn11", label: "Pruning", value: "Pruning" },
    { id: "lawn12", label: "Other Lawn and Garden", value: "Other Lawn and Garden" },
  ]

  // State for providers
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // State for filtering
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // State for dialogs
  const [selectedProviderId, setSelectedProviderId] = useState(null)
  const [selectedProviderName, setSelectedProviderName] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // State for photos
  const [providerPhotos, setProviderPhotos] = useState<Record<string, any[]>>({})

  // State for ratings and reviews
  const [providerRatings, setProviderRatings] = useState<Record<string, number>>({})
  const [providerReviews, setProviderReviews] = useState<Record<string, any[]>>({})

  // User and favorites state
  const [currentUser, setCurrentUser] = useState(null)
  const [favoriteProviders, setFavoriteProviders] = useState(new Set())
  const [savingStates, setSavingStates] = useState({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const { toast } = useToast()

  // Function to load photos for a specific provider
  const loadPhotosForProvider = async (providerId: string) => {
    if (providerPhotos[providerId]) return // Already loaded

    try {
      const photos = await loadBusinessPhotos(providerId)
      setProviderPhotos((prev) => ({
        ...prev,
        [providerId]: photos,
      }))
    } catch (error) {
      console.error(`Failed to load photos for provider ${providerId}:`, error)
      setProviderPhotos((prev) => ({
        ...prev,
        [providerId]: [],
      }))
    }
  }

  // Function to load reviews and calculate rating for a provider
  const loadProviderReviews = async (providerId: string) => {
    if (providerReviews[providerId]) return // Already loaded

    try {
      const reviews = await getBusinessReviews(providerId)
      setProviderReviews((prev) => ({
        ...prev,
        [providerId]: reviews,
      }))

      // Calculate average rating
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.overallRating, 0)
        const averageRating = totalRating / reviews.length
        setProviderRatings((prev) => ({
          ...prev,
          [providerId]: averageRating,
        }))
      }
    } catch (error) {
      console.error(`Failed to load reviews for provider ${providerId}:`, error)
      setProviderReviews((prev) => ({
        ...prev,
        [providerId]: [],
      }))
    }
  }

  // The subcategory path to search for
  const subcategoryPath = "Home, Lawn, and Manual Labor > Lawn and Garden"

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
      console.log(`User zip code loaded: ${savedZipCode}`)
    } else {
      console.log("No user zip code found in localStorage")
    }
  }, [])

  // Check user session
  useEffect(() => {
    async function checkUserSession() {
      try {
        const user = await getUserSession()
        setCurrentUser(user)
      } catch (error) {
        console.error("Error checking user session:", error)
      }
    }
    checkUserSession()
  }, [])

  // Load user's favorite providers
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser?.id) return

      try {
        const favoriteIds = new Set()
        for (const provider of providers) {
          const isFavorite = await checkIfBusinessIsFavorite(provider.id)
          if (isFavorite) {
            favoriteIds.add(provider.id)
          }
        }
        setFavoriteProviders(favoriteIds)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (providers.length > 0) {
      loadFavorites()
    }
  }, [currentUser, providers])

  // Handler for filter changes
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

  // Handler for adding provider to favorites
  const handleAddToFavorites = async (provider) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteProviders.has(provider.id)) {
      toast({
        title: "Already Saved",
        description: "This provider is already in your favorites.",
        variant: "default",
      })
      return
    }

    setSavingStates((prev) => ({ ...prev, [provider.id]: true }))

    try {
      const providerData = {
        id: provider.id,
        businessName: provider.businessName,
        displayName: provider.displayName,
        phone: provider.displayPhone,
        email: provider.email,
        address: provider.displayLocation,
        zipCode: provider.zipCode,
      }

      const result = await addFavoriteBusiness(providerData)

      if (result.success) {
        setFavoriteProviders((prev) => new Set([...prev, provider.id]))
        toast({
          title: "Business Card Saved!",
          description: "Business card has been added to your favorites.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save business card.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding favorite provider:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [provider.id]: false }))
    }
  }

  useEffect(() => {
    async function fetchProviders() {
      try {
        setLoading(true)
        console.log(`Fetching providers for ${subcategoryPath} subcategory with zip code filtering...`)

        const allProviders = await getBusinessesForSubcategory(subcategoryPath)
        console.log(`Found ${allProviders.length} total providers for base path: ${subcategoryPath}`)

        let filteredProviders = allProviders

        // Filter by user's zip code if available
        if (userZipCode) {
          console.log(`Filtering providers that service zip code: ${userZipCode}`)
          filteredProviders = []

          for (const provider of allProviders) {
            try {
              const response = await fetch(`/api/admin/business/${provider.id}/service-area`)
              if (response.ok) {
                const serviceAreaData = await response.json()
                console.log(`Service area data for ${provider.displayName}:`, {
                  zipCount: serviceAreaData.zipCodes?.length || 0,
                  isNationwide: serviceAreaData.isNationwide,
                  businessId: serviceAreaData.businessId,
                })

                // Check if provider is nationwide
                if (serviceAreaData.isNationwide) {
                  console.log(`✅ ${provider.displayName} services nationwide (including ${userZipCode})`)
                  filteredProviders.push(provider)
                  continue
                }

                // Check if the user's zip code is in the provider's service area
                if (serviceAreaData.zipCodes && Array.isArray(serviceAreaData.zipCodes)) {
                  const servicesUserZip = serviceAreaData.zipCodes.some((zipData) => {
                    // Handle both string and object formats
                    const zipCode = typeof zipData === "string" ? zipData : zipData?.zip
                    return zipCode === userZipCode
                  })

                  if (servicesUserZip) {
                    console.log(`✅ ${provider.displayName} services zip code ${userZipCode}`)
                    filteredProviders.push(provider)
                  } else {
                    console.log(`❌ ${provider.displayName} does not service zip code ${userZipCode}`)
                    console.log(
                      `Available zip codes:`,
                      serviceAreaData.zipCodes.slice(0, 10).map((z) => (typeof z === "string" ? z : z?.zip)),
                    )
                  }
                } else {
                  console.log(`⚠️ ${provider.displayName} has no service area data, including by default`)
                  filteredProviders.push(provider)
                }
              } else {
                console.log(`⚠️ Could not fetch service area for ${provider.displayName}, including by default`)
                filteredProviders.push(provider)
              }
            } catch (error) {
              console.error(`Error checking service area for ${provider.displayName}:`, error)
              filteredProviders.push(provider)
            }
          }
          console.log(`After zip code filtering: ${filteredProviders.length} providers service ${userZipCode}`)
        } else {
          console.log("No user zip code available, showing all providers")
        }

        console.log(`Enhanced ${filteredProviders.length} providers with ad design data`)
        setProviders(filteredProviders)
      } catch (err) {
        console.error("Error fetching providers:", err)
        setError("Failed to load providers")
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [subcategoryPath, userZipCode])

  // Define the function before it's used
  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    console.log("Processing subcategories for display:", subcategories)

    const allServices = subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        // Extract the specific service name (last part after the last >)
        const parts = path.split(" > ")

        // Skip if it's just a top-level category
        if (parts.length < 2) return null

        // Get the terminal subcategory (most specific service)
        const terminalService = parts[parts.length - 1]
        console.log("Extracted terminal service:", terminalService)
        return terminalService
      })
      .filter(Boolean) // Remove nulls
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

    console.log(`Found ${allServices.length} unique services:`, allServices)
    return allServices // Remove the .slice(0, 4) limit to show ALL services
  }

  // Helper function to check if a service matches selected filters
  const isServiceHighlighted = (service: string) => {
    if (selectedFilters.length === 0) return false

    return selectedFilters.some((filterId) => {
      const filterOption = filterOptions.find((opt) => opt.id === filterId)
      if (!filterOption) return false

      const filterValue = filterOption.value.toLowerCase()
      const serviceLower = service.toLowerCase()

      return serviceLower.includes(filterValue) || filterValue.includes(serviceLower)
    })
  }

  // Filter providers based on selected filters
  const filteredProviders =
    selectedFilters.length === 0
      ? providers
      : providers.filter((provider) => {
          const providerServices = getAllTerminalSubcategories(provider.subcategories)

          return selectedFilters.some((filterId) => {
            const filterOption = filterOptions.find((opt) => opt.id === filterId)
            if (!filterOption) return false

            const filterValue = filterOption.value.toLowerCase()

            return providerServices.some((service) => {
              const serviceLower = service.toLowerCase()
              return serviceLower.includes(filterValue) || filterValue.includes(serviceLower)
            })
          })
        })

  // Load reviews for all providers when they change
  useEffect(() => {
    const loadAllReviews = async () => {
      for (const provider of filteredProviders) {
        await loadProviderReviews(provider.id)
      }
    }

    if (filteredProviders.length > 0) {
      loadAllReviews()
    }
  }, [filteredProviders])

  // Handler for opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProviderId(provider.id)
    setSelectedProviderName(provider.displayName)
    setIsReviewsDialogOpen(true)
  }

  // Handler for opening profile dialog
  const handleViewProfile = (provider) => {
    console.log(`Opening profile for provider: ${provider.id} - ${provider.displayName}`)
    setSelectedProviderId(provider.id)
    setSelectedProviderName(provider.displayName)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Lawn and Garden Services" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Filter Status */}
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Filtering by {selectedFilters.length} service{selectedFilters.length !== 1 ? "s" : ""}:{" "}
                {selectedFilters
                  .map((filterId) => {
                    const option = filterOptions.find((opt) => opt.id === filterId)
                    return option?.label
                  })
                  .join(", ")}
              </p>
              <p className="text-sm text-blue-700">
                Showing {filteredProviders.length} of {providers.length} providers
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
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">Showing providers that service: {userZipCode}</p>
              <p className="text-sm text-green-700">Only providers available in your area are displayed</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lawn & Garden Services Found</h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `We're currently building our network of lawn and garden professionals in the ${userZipCode} area.`
                : "We're currently building our network of lawn and garden professionals in your area."}
            </p>
            <Button className="bg-green-600 hover:bg-green-700">Register Your Business</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Provider Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{provider.displayName}</h3>

                    {/* Contact Info Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-primary" />
                        <span>{provider.displayLocation}</span>
                      </div>
                      {provider.displayPhone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1 text-primary" />
                          <a href={`tel:${provider.displayPhone}`} className="hover:text-primary transition-colors">
                            {provider.displayPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Rating Display */}
                    <div className="flex items-center gap-2">
                      {providerRatings[provider.id] ? (
                        <>
                          <StarRating rating={providerRatings[provider.id]} size="sm" />
                          <span className="text-sm font-medium text-gray-700">
                            {providerRatings[provider.id].toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({providerReviews[provider.id]?.length || 0} reviews)
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No reviews yet</span>
                      )}
                    </div>

                    {/* Services */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Services ({getAllTerminalSubcategories(provider.subcategories).length}):
                      </p>
                      <div
                        className={`flex flex-wrap gap-2 ${getAllTerminalSubcategories(provider.subcategories).length > 8 ? "max-h-32 overflow-y-auto" : ""}`}
                      >
                        {getAllTerminalSubcategories(provider.subcategories).map((service, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              isServiceHighlighted(service)
                                ? "bg-green-100 text-green-800 ring-2 ring-green-300"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                      {getAllTerminalSubcategories(provider.subcategories).length > 8 && (
                        <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
                      )}
                    </div>
                  </div>

                  {/* Photo Carousel and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Photo Carousel */}
                    <div className="flex-1">
                      <PhotoCarousel
                        businessId={provider.id}
                        photos={providerPhotos[provider.id] || []}
                        onLoadPhotos={() => loadPhotosForProvider(provider.id)}
                        showMultiple={true}
                        photosPerView={5}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:w-32">
                      <Button
                        variant={favoriteProviders.has(provider.id) ? "default" : "outline"}
                        className={
                          favoriteProviders.has(provider.id)
                            ? "flex-1 lg:flex-none bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "flex-1 lg:flex-none border-red-600 text-red-600 hover:bg-red-50"
                        }
                        onClick={() => handleAddToFavorites(provider)}
                        disabled={savingStates[provider.id]}
                      >
                        {savingStates[provider.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : favoriteProviders.has(provider.id) ? (
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
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProviderName}
        businessId={selectedProviderId}
        reviews={selectedProviderId ? providerReviews[selectedProviderId] || [] : []}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedProviderId}
        businessName={selectedProviderName}
      />

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Please log in to save business cards to your favorites.</p>
            <div className="flex gap-2">
              <Button asChild className="flex-1">
                <a href="/user-login">Login</a>
              </Button>
              <Button variant="outline" asChild className="flex-1 bg-transparent">
                <a href="/user-register">Sign Up</a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </CategoryLayout>
  )
}
