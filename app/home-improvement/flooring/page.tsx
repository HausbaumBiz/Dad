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
import { Heart, HeartHandshake, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FlooringPage() {
  const { toast } = useToast()

  const filterOptions = [
    { id: "floor1", label: "Carpet Installation", value: "Carpet Installation" },
    { id: "floor2", label: "Hardwood Floor Installation", value: "Hardwood Floor Installation" },
    { id: "floor3", label: "Epoxy Flooring", value: "Epoxy Flooring" },
    { id: "floor4", label: "Tile Flooring", value: "Tile Flooring" },
    { id: "floor5", label: "Laminate Flooring", value: "Laminate Flooring" },
    { id: "floor6", label: "Carpet Cleaning", value: "Carpet Cleaning" },
    { id: "floor7", label: "Floor Buffing and Cleaning", value: "Floor Buffing and Cleaning" },
    { id: "floor8", label: "Oriental Rug Cleaning", value: "Oriental Rug Cleaning" },
    {
      id: "floor9",
      label: "Other Floor/Carpet Care and Installation",
      value: "Other Floor/Carpet Care and Installation",
    },
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
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // Photo state
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: string[] }>({})

  // Favorites state
  const [currentUser, setCurrentUser] = useState(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<{ [key: string]: boolean }>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  const subcategoryPath = "Home, Lawn, and Manual Labor > Floor/Carpet Care and Installation"

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

  // Function to extract terminal subcategories
  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    const services = subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        // Always split by " > " and take the last part (terminal subcategory)
        const parts = path.split(" > ")
        return parts[parts.length - 1].trim()
      })
      .filter(Boolean) // Remove nulls
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

    console.log(`Found ${services.length} unique services for business`)
    return services
  }

  // Filter handling functions
  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
    setSelectedFilters((prev) => {
      if (checked) {
        return [...prev, filterId]
      } else {
        return prev.filter((id) => id !== filterId)
      }
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
  }

  // Filter businesses based on selected filters
  const filteredBusinesses =
    selectedFilters.length === 0
      ? businesses
      : businesses.filter((business) => {
          const businessServices = getAllTerminalSubcategories(business.subcategories)

          // Map filter IDs to their values
          const filterValues = selectedFilters.map((filterId) => {
            const option = filterOptions.find((opt) => opt.id === filterId)
            return option?.value || filterId
          })

          console.log(`Business ${business.displayName} services:`, businessServices)
          console.log(`Looking for filter values:`, filterValues)

          // Check if any business service matches any selected filter
          const hasMatch = businessServices.some((service) =>
            filterValues.some(
              (filterValue) =>
                service.toLowerCase().includes(filterValue.toLowerCase()) ||
                filterValue.toLowerCase().includes(service.toLowerCase()),
            ),
          )

          console.log(`Business ${business.displayName} matches filters:`, hasMatch)
          return hasMatch
        })

  console.log(`Applied filters:`, selectedFilters)
  console.log(`Showing ${filteredBusinesses.length} of ${businesses.length} businesses`)

  // Check user session and load favorites
  useEffect(() => {
    async function checkUserSession() {
      try {
        const user = await getUserSession()
        setCurrentUser(user)
        console.log("Current user:", user)
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
        const favorites = new Set<string>()

        // Check each business to see if it's favorited
        for (const business of businesses) {
          const isFavorite = await checkIfBusinessIsFavorite(currentUser.id, business.id)
          if (isFavorite) {
            favorites.add(business.id)
          }
        }

        setFavoriteBusinesses(favorites)
        console.log(`Loaded ${favorites.size} favorite businesses for user ${currentUser.id}`)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (businesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, businesses])

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

      console.log(`Added business ${business.displayName} to favorites for user ${currentUser.id}`)
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
      try {
        setLoading(true)
        console.log(`Fetching businesses for ${subcategoryPath} subcategory with zip code filtering...`)

        const result = await getBusinessesForSubcategory(
          "Home, Lawn, and Manual Labor > Floor/Carpet Care and Installation",
        )
        console.log(`Found ${result.length} total businesses for base path: Floor/Carpet Care and Installation`)

        let filteredBusinesses = result

        // Filter by user's zip code if available
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          filteredBusinesses = []

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
                    console.log(
                      `Available zip codes:`,
                      serviceAreaData.zipCodes.slice(0, 10).map((z) => (typeof z === "string" ? z : z?.zip)),
                    )
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
        } else {
          console.log("No user zip code available, showing all businesses")
        }

        setBusinesses(filteredBusinesses)
      } catch (err) {
        console.error("Error fetching businesses:", err)
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

  return (
    <CategoryLayout title="Floor/Carpet Care and Installation" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Filter Status */}
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Filtering by {selectedFilters.length} service{selectedFilters.length > 1 ? "s" : ""}:{" "}
                {selectedFilters
                  .map((filterId) => {
                    const option = filterOptions.find((opt) => opt.id === filterId)
                    return option?.value || filterId
                  })
                  .join(", ")}
              </p>
              <p className="text-sm text-blue-700">
                Showing {filteredBusinesses.length} of {businesses.length} businesses
              </p>
            </div>
            <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-800 underline">
              Clear Filters
            </button>
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
            <div className="mx-auto w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Flooring Services Found</h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `We're currently building our network of flooring specialists in the ${userZipCode} area.`
                : "Be the first flooring specialist to join our platform!"}
            </p>
            <Button>Register Your Business</Button>
          </div>
        ) : (
          filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{business.displayName}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {business.displayLocation && (
                        <span className="flex items-center">📍 {business.displayLocation}</span>
                      )}
                      {business.displayPhone && <span className="flex items-center">📞 {business.displayPhone}</span>}
                    </div>
                    {business.subcategories && getAllTerminalSubcategories(business.subcategories).length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Services ({getAllTerminalSubcategories(business.subcategories).length}):
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto">
                          {getAllTerminalSubcategories(business.subcategories).map((service, idx) => {
                            // Check if this service matches any selected filter
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
                        {getAllTerminalSubcategories(business.subcategories).length > 8 && (
                          <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Photo Carousel and Buttons */}
                  <div className="flex flex-col lg:flex-row gap-4">
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
                    <div className="flex flex-row lg:flex-col gap-2 lg:w-32">
                      <Button className="flex-1 lg:flex-none" onClick={() => handleOpenReviews(business)}>
                        Ratings
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 lg:flex-none bg-transparent"
                        onClick={() => handleViewProfile(business)}
                      >
                        View Profile
                      </Button>
                      <Button
                        variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                        className={`flex-1 lg:flex-none ${
                          favoriteBusinesses.has(business.id)
                            ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "border-red-600 text-red-600 hover:bg-red-50 bg-transparent"
                        }`}
                        onClick={() => handleAddToFavorites(business)}
                        disabled={savingStates[business.id]}
                      >
                        {savingStates[business.id] ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : favoriteBusinesses.has(business.id) ? (
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
        providerName={selectedProvider?.displayName}
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
