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

export default function OutsideMaintenancePage() {
  const filterOptions = [
    { id: "outside1", label: "Roofing", value: "Roofing" },
    { id: "outside2", label: "Masonry Stone and Brick", value: "Masonry Stone and Brick" },
    { id: "outside3", label: "Glass Block", value: "Glass Block" },
    { id: "outside4", label: "Siding", value: "Siding" },
    { id: "outside5", label: "Deck Cleaning/Refinishing", value: "Deck Cleaning/Refinishing" },
    { id: "outside6", label: "Garage Doors", value: "Garage Doors" },
    { id: "outside7", label: "House Painting", value: "House Painting" },
    { id: "outside8", label: "Pressure Washing", value: "Pressure Washing" },
    { id: "outside9", label: "Foundation Repair", value: "Foundation Repair" },
    { id: "outside10", label: "Gutter Cleaning/Repair", value: "Gutter Cleaning/Repair" },
    { id: "outside11", label: "Septic Tank Service", value: "Septic Tank Service" },
    { id: "outside12", label: "Well & Water Pump Repair", value: "Well & Water Pump Repair" },
    { id: "outside13", label: "Other Outside Home Maintenance", value: "Other Outside Home Maintenance" },
  ]

  // State for businesses
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // State for filtering
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // State for dialogs
  const [selectedBusinessId, setSelectedBusinessId] = useState(null)
  const [selectedBusinessName, setSelectedBusinessName] = useState(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // State for photos
  const [businessPhotos, setBusinessPhotos] = useState<Record<string, any[]>>({})

  // State for ratings and reviews
  const [businessRatings, setBusinessRatings] = useState<Record<string, number>>({})
  const [businessReviews, setBusinessReviews] = useState<Record<string, any[]>>({})

  // User and favorites state
  const [currentUser, setCurrentUser] = useState(null)
  const [favoriteBusinesses, setFavoriteBusinesses] = useState(new Set())
  const [savingStates, setSavingStates] = useState({})
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
      console.error(`Failed to load photos for business ${businessId}:`, error)
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

  // The subcategory path to search for
  const subcategoryPath = "Home, Lawn, and Manual Labor > Outside Home Maintenance and Repair"

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

  // Load user's favorite businesses
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser?.id) return

      try {
        const favoriteIds = new Set()
        for (const business of businesses) {
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

    if (businesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, businesses])

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

  // Handler for adding business to favorites
  const handleAddToFavorites = async (business) => {
    if (!currentUser) {
      setIsLoginDialogOpen(true)
      return
    }

    if (favoriteBusinesses.has(business.id)) {
      toast({
        title: "Already Saved",
        description: "This business is already in your favorites.",
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

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        console.log(`Fetching businesses for ${subcategoryPath} subcategory with zip code filtering...`)

        const allBusinesses = await getBusinessesForSubcategory(subcategoryPath)
        console.log(`Found ${allBusinesses.length} total businesses for base path: ${subcategoryPath}`)

        let filteredBusinesses = allBusinesses

        // Filter by user's zip code if available
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          filteredBusinesses = []

          for (const business of allBusinesses) {
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

        console.log(`Enhanced ${filteredBusinesses.length} businesses with ad design data`)
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

  // Filter businesses based on selected filters
  const filteredBusinesses =
    selectedFilters.length === 0
      ? businesses
      : businesses.filter((business) => {
          const businessServices = getAllTerminalSubcategories(business.subcategories)

          return selectedFilters.some((filterId) => {
            const filterOption = filterOptions.find((opt) => opt.id === filterId)
            if (!filterOption) return false

            const filterValue = filterOption.value.toLowerCase()

            return businessServices.some((service) => {
              const serviceLower = service.toLowerCase()
              return serviceLower.includes(filterValue) || filterValue.includes(serviceLower)
            })
          })
        })

  // Load reviews for all businesses when they change
  useEffect(() => {
    const loadAllReviews = async () => {
      for (const business of filteredBusinesses) {
        await loadBusinessReviews(business.id)
      }
    }

    if (filteredBusinesses.length > 0) {
      loadAllReviews()
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
    console.log(`Opening profile for business: ${business.id} - ${business.displayName}`)
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.displayName)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout
      title="Outside Home Maintenance and Repair"
      backLink="/home-improvement"
      backText="Home Improvement"
    >
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
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-orange-800">Showing businesses that service: {userZipCode}</p>
              <p className="text-sm text-orange-700">Only businesses available in your area are displayed</p>
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
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Outside Maintenance Services Found</h3>
            <p className="text-gray-600 mb-4">
              {userZipCode
                ? `We're currently building our network of exterior home maintenance and repair professionals in the ${userZipCode} area.`
                : "We're currently building our network of exterior home maintenance and repair professionals in your area."}
            </p>
            <Button className="bg-orange-600 hover:bg-orange-700">Register Your Business</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Compact Business Info */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{business.displayName}</h3>

                    {/* Contact Info Row */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-primary" />
                        <span>{business.displayLocation}</span>
                      </div>
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
                    <div className="flex items-center gap-2">
                      {businessRatings[business.id] ? (
                        <>
                          <StarRating rating={businessRatings[business.id]} size="sm" />
                          <span className="text-sm font-medium text-gray-700">
                            {businessRatings[business.id].toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({businessReviews[business.id]?.length || 0} reviews)
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No reviews yet</span>
                      )}
                    </div>

                    {/* Services */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Services ({getAllTerminalSubcategories(business.subcategories).length}):
                      </p>
                      <div
                        className={`flex flex-wrap gap-2 ${getAllTerminalSubcategories(business.subcategories).length > 8 ? "max-h-32 overflow-y-auto" : ""}`}
                      >
                        {getAllTerminalSubcategories(business.subcategories).map((service, idx) => (
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
                      {getAllTerminalSubcategories(business.subcategories).length > 8 && (
                        <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
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
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-32">
                      <Button
                        variant={favoriteBusinesses.has(business.id) ? "default" : "outline"}
                        className={
                          favoriteBusinesses.has(business.id)
                            ? "flex-1 lg:flex-none bg-red-600 hover:bg-red-700 text-white border-red-600"
                            : "flex-1 lg:flex-none border-red-600 text-red-600 hover:bg-red-50"
                        }
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
