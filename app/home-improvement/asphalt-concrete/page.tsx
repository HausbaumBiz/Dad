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
import { getBusinessAdDesign } from "@/app/actions/business-actions"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { Phone } from "lucide-react"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { Heart, HeartHandshake, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { StarRating } from "@/components/star-rating"
import { getBusinessReviews } from "@/app/actions/review-actions"

export default function AsphaltConcretePage() {
  const filterOptions = [
    { id: "asphalt1", label: "Concrete Driveways", value: "Concrete Driveways" },
    { id: "asphalt2", label: "Asphalt Driveways", value: "Asphalt Driveways" },
    { id: "asphalt3", label: "Other Driveways", value: "Other Driveways" },
    { id: "asphalt4", label: "Stone & Gravel", value: "Stone & Gravel" },
    { id: "asphalt5", label: "Stamped Concrete", value: "Stamped Concrete" },
    { id: "asphalt6", label: "Concrete Repair", value: "Concrete Repair" },
    {
      id: "asphalt7",
      label: "Other Asphalt, Concrete, Stone and Gravel",
      value: "Other Asphalt, Concrete, Stone and Gravel",
    },
  ]

  // State for businesses
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined) // Start as undefined

  // State for filtering
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // State for photos
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: any[] }>({})

  // User and favorites state
  const [currentUser, setCurrentUser] = useState(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState(new Set())
  const [savingStates, setSavingStates] = useState({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  const [businessRatings, setBusinessRatings] = useState<Record<string, number>>({})
  const [businessReviews, setBusinessReviews] = useState<Record<string, any[]>>({})

  // Toast hook
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

  // Function to load reviews and calculate rating for a specific business
  const loadBusinessReviews = async (businessId: string) => {
    if (businessRatings[businessId] !== undefined) return // Already loaded

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
          [businessId]: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        }))
      } else {
        setBusinessRatings((prev) => ({
          ...prev,
          [businessId]: 0,
        }))
      }
    } catch (error) {
      console.error(`Failed to load reviews for business ${businessId}:`, error)
      setBusinessRatings((prev) => ({
        ...prev,
        [businessId]: 0,
      }))
      setBusinessReviews((prev) => ({
        ...prev,
        [businessId]: [],
      }))
    }
  }

  // Helper to extract service names from full paths - moved to top to avoid initialization errors
  const getAllTerminalSubcategories = (subcategories) => {
    if (!subcategories || !Array.isArray(subcategories)) return []

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

    console.log(`Found ${services.length} unique terminal subcategories`)
    return services
  }

  // Filter handlers
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

  // Filter businesses based on selected filters
  const filteredBusinesses =
    selectedFilters.length === 0
      ? businesses
      : businesses.filter((business) => {
          const businessServices = getAllTerminalSubcategories(business.subcategories)

          return selectedFilters.some((filterId) => {
            // Find the filter option that matches this filterId
            const filterOption = filterOptions.find((option) => option.id === filterId)
            if (!filterOption) return false

            const filterValue = filterOption.value.toLowerCase()

            // Check if any business service matches this filter
            return businessServices.some((service) => {
              const serviceLower = service.toLowerCase()
              // Fuzzy matching - check if service contains filter or filter contains service
              return serviceLower.includes(filterValue) || filterValue.includes(serviceLower)
            })
          })
        })

  // State for dialogs
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [selectedBusinessName, setSelectedBusinessName] = useState("")
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // The subcategory path to search for
  const subcategoryPath = "Home, Lawn, and Manual Labor > Asphalt, Concrete, Stone and Gravel"

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
      let filteredBusinesses = [] // Declare filteredBusinesses here
      try {
        setLoading(true)
        console.log(`Fetching businesses for ${subcategoryPath} subcategory with zip code filtering...`)

        const result = await getBusinessesForSubcategory(subcategoryPath)
        console.log(`Found ${result.length} total businesses for base path: ${subcategoryPath}`)

        filteredBusinesses = result

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
                    // Do NOT add this business to filteredBusinesses since it doesn't service the user's ZIP
                  }
                } else {
                  console.log(`⚠️ ${business.displayName} has no service area data, excluding by default`)
                  // Changed: Don't include businesses with no service area data when filtering by ZIP
                }
              } else {
                console.log(`⚠️ Could not fetch service area for ${business.displayName}, excluding by default`)
                // Changed: Don't include businesses with service area fetch errors when filtering by ZIP
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName}:`, error)
              // Changed: Don't include businesses with service area errors when filtering by ZIP
            }
          }
        }
        console.log(`After ZIP code filtering: ${filteredBusinesses.length} businesses match ${userZipCode}`)

        // Enhance businesses with ad design data to get phone numbers
        const enhancedBusinesses = await Promise.all(
          filteredBusinesses.map(async (business) => {
            try {
              // Fetch ad design data for this business
              console.log(`Fetching ad design data for business: ${business.id}`)
              const adDesignData = await getBusinessAdDesign(business.id)

              // Extract phone number from ad design data if available
              let displayPhone = null
              if (adDesignData?.businessInfo?.phone) {
                displayPhone = adDesignData.businessInfo.phone
                console.log(`Found phone from ad design: ${displayPhone}`)
              } else if (business.phone) {
                displayPhone = business.phone
                console.log(`Using business registration phone: ${displayPhone}`)
              } else {
                console.log(`No phone number found for business: ${business.id}`)
              }

              // Determine display name (prefer ad design name over registration name)
              const displayName =
                adDesignData?.businessInfo?.businessName || business.businessName || "Unknown Business"

              // Determine display location
              const displayLocation = business.displayLocation || `Zip: ${business.zipCode}`

              return {
                ...business,
                displayName,
                displayLocation,
                displayPhone,
                adDesignData,
              }
            } catch (err) {
              console.error(`Error enhancing business ${business.id}:`, err)
              return {
                ...business,
                displayName: business.businessName || "Unknown Business",
                displayLocation: business.displayLocation || `Zip: ${business.zipCode}`,
                displayPhone: business.phone || null,
              }
            }
          }),
        )

        setBusinesses(enhancedBusinesses)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses")
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if we have loaded the userZipCode state (even if it's null)
    // This prevents the race condition
    if (userZipCode !== undefined) {
      fetchBusinesses()
    }
  }, [subcategoryPath, userZipCode])

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

  // Load user's favorite businesses
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser) return

      try {
        const favorites = new Set()
        for (const business of filteredBusinesses) {
          const isFavorite = await checkIfBusinessIsFavorite(business.id)
          if (isFavorite) {
            favorites.add(business.id)
          }
        }
        setFavoriteBusinesses(favorites)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (currentUser && filteredBusinesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, filteredBusinesses])

  // Load ratings for all businesses
  useEffect(() => {
    if (filteredBusinesses.length > 0) {
      filteredBusinesses.forEach((business) => {
        loadBusinessReviews(business.id)
      })
    }
  }, [filteredBusinesses])

  // Handler for opening reviews dialog
  const handleOpenReviews = (business) => {
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.displayName)
    setIsReviewsDialogOpen(true)
  }

  // Handler for opening profile dialog
  const handleViewProfile = (business) => {
    console.log("Opening profile for:", business.id, business.displayName)
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.displayName)
    setIsProfileDialogOpen(true)
  }

  // Handle adding business to favorites
  const handleAddToFavorites = async (business) => {
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

      const result = await addFavoriteBusiness(businessData)

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, business.id]))
        toast({
          title: "Business Card Saved!",
          description: `${business.displayName} has been added to your favorites.`,
          variant: "default",
        })
      } else {
        throw new Error(result.error || "Failed to save business card")
      }
    } catch (error) {
      console.error("Error adding favorite business:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [business.id]: false }))
    }
  }

  return (
    <CategoryLayout
      title="Asphalt, Concrete, Stone and Gravel"
      backLink="/home-improvement"
      backText="Home Improvement"
    >
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Filter Status Indicator */}
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
                />
              </svg>
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
                  Showing {filteredBusinesses.length} of {businesses.length} businesses
                </p>
              </div>
            </div>
            <button onClick={clearFilters} className="text-sm text-green-600 hover:text-green-800 font-medium">
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
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Asphalt & Concrete Services Found</h3>
          <p className="text-gray-600 mb-4">
            {userZipCode
              ? `We're currently building our network of asphalt & concrete professionals in the ${userZipCode} area.`
              : "Be the first contractor to join our platform!"}
          </p>
          <Button>Register Your Business</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Business Info Section - Compact */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{business.displayName}</h3>

                    {/* Contact Info Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>{business.displayLocation}</span>
                      {business.displayPhone && (
                        <div className="flex items-center">
                          <Phone className="h-3.5 w-3.5 mr-1" />
                          <span>{business.displayPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Rating Display */}
                    {businessRatings[business.id] !== undefined && (
                      <div className="flex items-center gap-2">
                        <StarRating rating={businessRatings[business.id]} size="sm" />
                        <span className="text-sm text-gray-600">
                          {businessRatings[business.id] > 0 ? (
                            <>
                              {businessRatings[business.id]} ({businessReviews[business.id]?.length || 0} reviews)
                            </>
                          ) : (
                            "No reviews yet"
                          )}
                        </span>
                      </div>
                    )}

                    {/* Services Tags - All services displayed in scrollable container */}
                    <div className="max-h-32 overflow-y-auto">
                      <div className="flex flex-wrap gap-2">
                        {getAllTerminalSubcategories(business.subcategories).map((service, idx) => {
                          // Check if this service matches any selected filter
                          const isHighlighted = selectedFilters.some((filterId) => {
                            const filterOption = filterOptions.find((option) => option.id === filterId)
                            if (!filterOption) return false

                            const filterValue = filterOption.value.toLowerCase()
                            const serviceLower = service.toLowerCase()
                            return serviceLower.includes(filterValue) || filterValue.includes(serviceLower)
                          })

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
                        <p className="text-xs text-gray-500 mt-2">Scroll to see more services</p>
                      )}
                    </div>
                  </div>

                  {/* Photo Carousel and Buttons Row */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Photo Carousel */}
                    <div className="flex-1">
                      <PhotoCarousel
                        businessId={business.id}
                        photos={businessPhotos[business.id] || []}
                        onLoadPhotos={() => loadPhotosForBusiness(business.id)}
                        showMultiple={true}
                        photosPerView={5}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:w-32">
                      {/* Save Card Button */}
                      <Button
                        variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                        className={`flex-1 lg:flex-none ${
                          favoriteBusinesses.has(business.id)
                            ? "bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "border-red-600 text-red-600 hover:bg-red-50"
                        }`}
                        onClick={() => handleAddToFavorites(business)}
                        disabled={savingStates[business.id]}
                      >
                        {savingStates[business.id] ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : favoriteBusinesses.has(business.id) ? (
                          <>
                            <HeartHandshake className="h-4 w-4 mr-2" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Heart className="h-4 w-4 mr-2" />
                            Save Card
                          </>
                        )}
                      </Button>
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
        providerName={selectedBusinessName}
        businessId={selectedBusinessId}
        reviews={selectedBusinessId ? businessReviews[selectedBusinessId] || [] : []}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusinessId}
        businessName={selectedBusinessName}
      />

      {/* Login Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>You need to be logged in to save business cards to your favorites.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-4">
            <Button asChild className="flex-1">
              <a href="/user-login">Login</a>
            </Button>
            <Button variant="outline" asChild className="flex-1 bg-transparent">
              <a href="/user-register">Sign Up</a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </CategoryLayout>
  )
}
