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
import { StarRating } from "@/components/star-rating"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { getBusinessReviews } from "@/app/actions/review-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { useToast } from "@/hooks/use-toast"
import { Heart, HeartHandshake, Loader2, MapPin, Phone } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function InsideMaintenancePage() {
  const { toast } = useToast()

  const filterOptions = [
    { id: "inside1", label: "Electricians", value: "Electricians" },
    { id: "inside2", label: "Plumbers", value: "Plumbers" },
    {
      id: "inside3",
      label: "Heating, Ventilation, and Air Conditioning Services",
      value: "Heating, Ventilation, and Air Conditioning Services",
    },
    {
      id: "inside4",
      label: "Appliance Repair and Installation",
      value: "Appliance Repair and Installation",
    },
    { id: "inside5", label: "Indoor Painting", value: "Indoor Painting" },
    { id: "inside6", label: "Drywalling and Repair", value: "Drywalling and Repair" },
    { id: "inside7", label: "Marble & Granite", value: "Marble & Granite" },
    { id: "inside8", label: "Water Softeners", value: "Water Softeners" },
    { id: "inside9", label: "Water Heaters", value: "Water Heaters" },
    { id: "inside10", label: "Insulation", value: "Insulation" },
    { id: "inside11", label: "Air Duct Cleaning", value: "Air Duct Cleaning" },
    { id: "inside12", label: "Dryer Duct Cleaning", value: "Dryer Duct Cleaning" },
    { id: "inside13", label: "Central Vacuum Cleaning", value: "Central Vacuum Cleaning" },
    { id: "inside14", label: "Mold Removal", value: "Mold Removal" },
    { id: "inside15", label: "Plaster Work", value: "Plaster Work" },
    { id: "inside16", label: "Water Damage Repair", value: "Water Damage Repair" },
    { id: "inside17", label: "Basement Waterproofing", value: "Basement Waterproofing" },
    {
      id: "inside18",
      label: "Wallpaper Hanging and Removing",
      value: "Wallpaper Hanging and Removing",
    },
    { id: "inside19", label: "Countertop Installation", value: "Countertop Installation" },
    { id: "inside20", label: "Ceiling Fan Installation", value: "Ceiling Fan Installation" },
    { id: "inside21", label: "Bathtub Refinishing", value: "Bathtub Refinishing" },
    { id: "inside22", label: "Cabinet Resurfacing", value: "Cabinet Resurfacing" },
    { id: "inside23", label: "Cabinet Makers", value: "Cabinet Makers" },
    { id: "inside24", label: "Tile Installation", value: "Tile Installation" },
    {
      id: "inside25",
      label: "Other Inside Home Maintenance and Repair",
      value: "Other Inside Home Maintenance and Repair",
    },
  ]

  // Function to extract terminal subcategories (defined at the top to avoid initialization errors)
  const getAllTerminalSubcategories = (subcategories) => {
    if (!Array.isArray(subcategories)) return []

    const allServices = subcategories
      .map((subcat) => {
        const path = typeof subcat === "string" ? subcat : subcat?.fullPath
        if (!path) return null

        // Extract the specific service name (last part after the last >)
        const parts = path.split(" > ")

        // Get the terminal subcategory (most specific service)
        return parts[parts.length - 1].trim()
      })
      .filter(Boolean) // Remove nulls
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

    console.log(`Found ${allServices.length} unique services for business`)
    return allServices
  }

  // Function to extract main zip code from business data
  const getMainZipCode = (business) => {
    // Try to get zip code from various possible fields
    if (business.zipCode) return business.zipCode
    if (business.mainZipCode) return business.mainZipCode
    if (business.primaryZipCode) return business.primaryZipCode

    // Try to extract from displayLocation if it contains a zip code pattern
    if (business.displayLocation) {
      const zipMatch = business.displayLocation.match(/\b\d{5}(-\d{4})?\b/)
      if (zipMatch) return zipMatch[0]
    }

    // Try to extract from address if available
    if (business.address) {
      const zipMatch = business.address.match(/\b\d{5}(-\d{4})?\b/)
      if (zipMatch) return zipMatch[0]
    }

    return null
  }

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // State for business profile dialog
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // State for businesses and filtering
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // State for business photos
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, string[]>>({})

  // Rating state
  const [businessRatings, setBusinessRatings] = useState<Record<string, { rating: number; count: number }>>({})
  const [businessReviews, setBusinessReviews] = useState<Record<string, any[]>>({})

  // State for favorites functionality
  const [currentUser, setCurrentUser] = useState(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<Set<string>>(new Set())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  const subcategoryPath = "Home, Lawn, and Manual Labor > Inside Home Maintenance and Repair"

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
          [businessId]: {
            rating: averageRating,
            count: reviews.length,
          },
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

  // Check user session and load favorites
  useEffect(() => {
    async function checkUserAndLoadFavorites() {
      try {
        const user = await getUserSession()
        if (user) {
          setCurrentUser(user)
          // Load user's favorite businesses
          const favorites = new Set<string>()
          for (const business of businesses) {
            const isFavorite = await checkIfBusinessIsFavorite(business.id)
            if (isFavorite) {
              favorites.add(business.id)
            }
          }
          setFavoriteBusinesses(favorites)
        }
      } catch (error) {
        console.error("Error checking user session:", error)
      }
    }

    if (businesses.length > 0) {
      checkUserAndLoadFavorites()
    }
  }, [businesses])

  // Load reviews for all businesses when they're loaded
  useEffect(() => {
    async function loadAllReviews() {
      for (const business of businesses) {
        await loadBusinessReviews(business.id)
      }
    }

    if (businesses.length > 0) {
      loadAllReviews()
    }
  }, [businesses])

  // Function to handle adding business to favorites
  const handleAddToFavorites = async (business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(business.id)) {
      toast({
        title: "Already Saved",
        description: "This business card is already in your favorites.",
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
        zipCode: getMainZipCode(business),
      }

      const result = await addFavoriteBusiness(businessData)

      if (result.success) {
        setFavoriteBusinesses((prev) => new Set([...prev, business.id]))
        toast({
          title: "Business Card Saved!",
          description: `${business.displayName} has been added to your favorites.`,
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

  // Get filter values from filter IDs
  const getFilterValues = () => {
    return selectedFilters.map((filterId) => {
      const option = filterOptions.find((opt) => opt.id === filterId)
      return option ? option.value : filterId
    })
  }

  // Filter businesses based on selected filters
  const filteredBusinesses = businesses.filter((business) => {
    // If no filters selected, show all businesses
    if (selectedFilters.length === 0) return true

    // Get the terminal subcategories for this business
    const businessServices = getAllTerminalSubcategories(business.subcategories)

    // Get the filter values (not IDs)
    const filterValues = getFilterValues()

    // Check if any of the business services match any of the selected filters
    return businessServices.some((service) =>
      filterValues.some(
        (filter) =>
          service.toLowerCase().includes(filter.toLowerCase()) || filter.toLowerCase().includes(service.toLowerCase()),
      ),
    )
  })

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

        const result = await getBusinessesForSubcategory(subcategoryPath)
        console.log(`Found ${result.length} total businesses for base path: ${subcategoryPath}`)

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
  }, [subcategoryPath, userZipCode])

  // Log applied filters
  useEffect(() => {
    console.log("Applied filters:", selectedFilters)
    console.log(`Showing ${filteredBusinesses.length} of ${businesses.length} businesses`)
  }, [selectedFilters, filteredBusinesses.length, businesses.length])

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider) => {
    setSelectedProvider({
      ...provider,
      reviews: businessReviews[provider.id] || [],
    })
    setIsReviewsDialogOpen(true)
  }

  // Function to handle opening business profile dialog
  const handleViewProfile = (business) => {
    setSelectedBusiness(business)
    setIsProfileDialogOpen(true)
  }

  // Check if a service matches any of the selected filters
  const isServiceMatching = (service) => {
    if (selectedFilters.length === 0) return false

    const filterValues = getFilterValues()

    return filterValues.some(
      (filter) =>
        service.toLowerCase().includes(filter.toLowerCase()) || filter.toLowerCase().includes(service.toLowerCase()),
    )
  }

  return (
    <CategoryLayout title="Inside Home Maintenance and Repair" backLink="/home-improvement" backText="Home Improvement">
      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} selectedFilters={selectedFilters} />

      {/* Filter Status */}
      {selectedFilters.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-blue-800">
                Filtering by {selectedFilters.length} {selectedFilters.length === 1 ? "service" : "services"}:{" "}
                {getFilterValues().join(", ")}
              </p>
              <p className="text-sm text-blue-700">
                Showing {filteredBusinesses.length} of {businesses.length} businesses
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-blue-600 border-blue-300 hover:bg-blue-50 bg-transparent"
            >
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
            <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 002-2H5a2 2 0 00-2-2v0"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedFilters.length > 0 ? "No matching services found" : "No Inside Maintenance Services Found"}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedFilters.length > 0
                ? "Try selecting different service filters or clear the current filters."
                : userZipCode
                  ? `We're currently building our network of home maintenance professionals in the ${userZipCode} area.`
                  : "Be the first home maintenance professional to join our platform!"}
            </p>
            {selectedFilters.length > 0 && <Button onClick={clearFilters}>Clear Filters</Button>}
            {selectedFilters.length === 0 && <Button>Register Your Business</Button>}
          </div>
        ) : (
          filteredBusinesses.map((business) => {
            const rating = businessRatings[business.id]
            return (
              <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Business Info Section */}
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">{business.displayName}</h3>

                      {/* Contact Info Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {getMainZipCode(business) && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-primary" />
                            <span>{getMainZipCode(business)}</span>
                          </div>
                        )}
                        {business.displayPhone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1 text-primary" />
                            <a href={`tel:${business.displayPhone}`} className="hover:text-primary transition-colors">
                              {business.displayPhone}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Rating Display */}
                      {rating && rating.count > 0 && (
                        <div className="flex items-center gap-2">
                          <StarRating rating={rating.rating} />
                          <span className="text-sm text-gray-600">
                            {rating.rating.toFixed(1)} ({rating.count} review{rating.count !== 1 ? "s" : ""})
                          </span>
                        </div>
                      )}

                      {business.subcategories && getAllTerminalSubcategories(business.subcategories).length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Services ({getAllTerminalSubcategories(business.subcategories).length}):
                          </p>
                          <div className="max-h-32 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              {getAllTerminalSubcategories(business.subcategories).map((service, idx) => (
                                <span
                                  key={idx}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
                                  ${
                                    isServiceMatching(service)
                                      ? "bg-green-100 text-green-800 ring-1 ring-green-400"
                                      : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                            {getAllTerminalSubcategories(business.subcategories).length > 8 && (
                              <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Photo Carousel and Buttons Section */}
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
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-32">
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
                          variant="outline"
                          className={`flex-1 lg:flex-none ${
                            favoriteBusinesses.has(business.id)
                              ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                              : "text-red-600 border-red-600 hover:bg-red-50 bg-transparent"
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
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              You need to be logged in to save business cards to your favorites. Please log in to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsLoginDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => (window.location.href = "/user-login")}>Go to Login</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </CategoryLayout>
  )
}
