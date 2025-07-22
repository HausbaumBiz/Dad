"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { useEffect } from "react"
import { getBusinessesForSubcategory } from "@/app/actions/simplified-category-actions"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getZipCode } from "@/lib/zip-code-db"
import { PhotoCarousel } from "@/components/photo-carousel"
import { loadBusinessPhotos } from "@/app/actions/photo-actions"
import { addFavoriteBusiness, checkIfBusinessIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { Heart, HeartHandshake, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const filterOptions = [
  { id: "handymen1", label: "Odd Jobs and Repairs", value: "Odd Jobs and Repairs" },
  { id: "handymen2", label: "Product Assembly", value: "Product Assembly" },
  { id: "handymen3", label: "Other Handymen", value: "Other Handymen" },
]

export default function HandymenPage() {
  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Add after the reviews dialog state
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<any[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([])

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null | undefined>(undefined)

  // Add photo state management
  const [businessPhotos, setBusinessPhotos] = useState<{ [key: string]: string[] }>({})

  // Add favorites state management
  const [currentUser, setCurrentUser] = useState<any>(null)
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
      console.error(`Failed to load photos for business ${businessId}:`, error)
      setBusinessPhotos((prev) => ({
        ...prev,
        [businessId]: [],
      }))
    }
  }

  // Add this function:
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
  }

  const handleFilterChange = (filterId: string, checked: boolean) => {
    console.log(`Filter change: ${filterId} = ${checked}`)
    setSelectedFilters((prev) => (checked ? [...prev, filterId] : prev.filter((id) => id !== filterId)))
  }

  const clearFilters = () => {
    setSelectedFilters([])
  }

  // Check user session on component mount
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

  // Load favorites when user is available
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser) return

      try {
        // Check favorites for all businesses
        const favoriteChecks = await Promise.all(
          allBusinesses.map(async (business) => {
            const isFavorite = await checkIfBusinessIsFavorite(business.id)
            return { businessId: business.id, isFavorite }
          }),
        )

        const favoriteIds = favoriteChecks.filter((check) => check.isFavorite).map((check) => check.businessId)

        setFavoriteBusinesses(new Set(favoriteIds))
        console.log("Loaded favorites:", favoriteIds)
      } catch (error) {
        console.error("Error loading favorites:", error)
      }
    }

    if (allBusinesses.length > 0) {
      loadFavorites()
    }
  }, [currentUser, allBusinesses])

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
      const result = await addFavoriteBusiness({
        id: business.id,
        businessName: business.name,
        displayName: business.name,
        phone: business.phone || "",
        email: "",
        address: business.location || "",
        zipCode: business.zipCode || "",
      })

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

      try {
        setLoading(true)
        setError(null)

        console.log("Fetching businesses for subcategory: Home, Lawn, and Manual Labor > Handymen")
        const allBusinessesData = await getBusinessesForSubcategory("Home, Lawn, and Manual Labor > Handymen")
        console.log(`Found ${allBusinessesData.length} total handymen businesses`)

        // If we have a zip code, filter by service area
        if (userZipCode) {
          console.log(`Filtering businesses that service zip code: ${userZipCode}`)
          const filteredBusinessesByZip = []

          for (const business of allBusinessesData) {
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
                  filteredBusinessesByZip.push(business)
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
                    filteredBusinessesByZip.push(business)
                  } else {
                    console.log(
                      `❌ ${business.displayName || business.businessName} does not service zip code ${userZipCode}`,
                    )
                  }
                } else {
                  console.log(
                    `⚠️ ${business.displayName || business.businessName} has no service area data, including by default`,
                  )
                  filteredBusinessesByZip.push(business)
                }
              } else {
                console.log(
                  `⚠️ Could not fetch service area for ${business.displayName || business.businessName}, including by default`,
                )
                filteredBusinessesByZip.push(business)
              }
            } catch (error) {
              console.error(`Error checking service area for ${business.displayName || business.businessName}:`, error)
              filteredBusinessesByZip.push(business)
            }
          }

          console.log(`After zip code filtering: ${filteredBusinessesByZip.length} businesses service ${userZipCode}`)

          // Transform the data for display with city/state lookup
          const transformedBusinesses = await Promise.all(
            filteredBusinessesByZip.map(async (business: any) => {
              // Fetch city and state from ZIP code database
              let location = "Service Area"

              // First try to use ad design location if available
              if (business.adDesignData?.businessInfo?.city && business.adDesignData?.businessInfo?.state) {
                location = `${business.adDesignData.businessInfo.city}, ${business.adDesignData.businessInfo.state}`
              }
              // Otherwise, look up ZIP code in database
              else if (business.zipCode) {
                try {
                  console.log(`Looking up ZIP code ${business.zipCode} for business ${business.id}`)
                  const zipData = await getZipCode(business.zipCode)
                  if (zipData && zipData.city && zipData.state) {
                    location = `${zipData.city}, ${zipData.state}`
                    console.log(`Found location for ${business.zipCode}: ${location}`)
                  } else {
                    console.log(`No ZIP data found for ${business.zipCode}, using ZIP code as fallback`)
                    location = `Zip: ${business.zipCode}`
                  }
                } catch (zipError) {
                  console.error(`Error looking up ZIP code ${business.zipCode}:`, zipError)
                  location = `Zip: ${business.zipCode}`
                }
              }
              // Fallback to display location if available
              else if (business.displayLocation) {
                location = business.displayLocation
              }

              return {
                id: business.id,
                name:
                  business.displayName ||
                  business.adDesignData?.businessInfo?.businessName ||
                  business.businessName ||
                  "Business Name",
                location: location,
                rating: business.rating || 0,
                reviews: business.reviewCount || 0,
                services: business.subcategories,
                phone: business.displayPhone || business.adDesignData?.businessInfo?.phone || business.phone,
                zipCode: business.zipCode,
              }
            }),
          )

          setAllBusinesses(transformedBusinesses)
        } else {
          console.log("No user zip code available, showing all businesses")

          // Transform the data for display with city/state lookup
          const transformedBusinesses = await Promise.all(
            allBusinessesData.map(async (business: any) => {
              // Fetch city and state from ZIP code database
              let location = "Service Area"

              // First try to use ad design location if available
              if (business.adDesignData?.businessInfo?.city && business.adDesignData?.businessInfo?.state) {
                location = `${business.adDesignData.businessInfo.city}, ${business.adDesignData.businessInfo.state}`
              }
              // Otherwise, look up ZIP code in database
              else if (business.zipCode) {
                try {
                  console.log(`Looking up ZIP code ${business.zipCode} for business ${business.id}`)
                  const zipData = await getZipCode(business.zipCode)
                  if (zipData && zipData.city && zipData.state) {
                    location = `${zipData.city}, ${zipData.state}`
                    console.log(`Found location for ${business.zipCode}: ${location}`)
                  } else {
                    console.log(`No ZIP data found for ${business.zipCode}, using ZIP code as fallback`)
                    location = `Zip: ${business.zipCode}`
                  }
                } catch (zipError) {
                  console.error(`Error looking up ZIP code ${business.zipCode}:`, zipError)
                  location = `Zip: ${business.zipCode}`
                }
              }
              // Fallback to display location if available
              else if (business.displayLocation) {
                location = business.displayLocation
              }

              return {
                id: business.id,
                name:
                  business.displayName ||
                  business.adDesignData?.businessInfo?.businessName ||
                  business.businessName ||
                  "Business Name",
                location: location,
                rating: business.rating || 0,
                reviews: business.reviewCount || 0,
                services: business.subcategories,
                phone: business.displayPhone || business.adDesignData?.businessInfo?.phone || business.phone,
                zipCode: business.zipCode,
              }
            }),
          )

          setAllBusinesses(transformedBusinesses)
        }
      } catch (err) {
        console.error("Error fetching businesses:", err)
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
      setFilteredBusinesses(allBusinesses)
      return
    }

    // Convert filter IDs to filter values
    const filterValues = selectedFilters
      .map((filterId) => {
        const option = filterOptions.find((opt) => opt.id === filterId)
        return option?.value
      })
      .filter(Boolean)

    console.log("Looking for filter values:", filterValues)

    const filtered = allBusinesses.filter((business) => {
      const businessServices = getAllTerminalSubcategories(business.services || [])

      return filterValues.some((filterValue) => businessServices.some((service) => service === filterValue))
    })

    setFilteredBusinesses(filtered)
  }, [selectedFilters, allBusinesses])

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  // Function to handle opening profile dialog
  const handleViewProfile = (provider: any) => {
    console.log("Opening profile for business:", provider.id, provider.name)
    setSelectedBusinessId(provider.id)
    setSelectedBusinessName(provider.name)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Handymen" backLink="/home-improvement" backText="Home Improvement">
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
                    return option?.value
                  })
                  .join(", ")}
              </p>
              <p className="text-sm text-green-600">
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
            <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.586V5L8 4z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Handymen Found</h3>
            <p className="text-gray-600 mb-6">
              Be the first handyman to join our platform and connect with local customers!
            </p>
            <Button>Register Your Handyman Business</Button>
          </div>
        ) : (
          filteredBusinesses.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Business Info Section */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{provider.name}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>📍 {provider.location}</span>
                      {provider.phone && <span>📞 {provider.phone}</span>}
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">
                        Services ({getAllTerminalSubcategories(provider.services || []).length}):
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto">
                        {getAllTerminalSubcategories(provider.services || []).map((service, idx) => {
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
                      {getAllTerminalSubcategories(provider.services || []).length > 8 && (
                        <p className="text-xs text-gray-500 mt-1">Scroll to see more services</p>
                      )}
                    </div>
                  </div>

                  {/* Photo Carousel and Buttons Section */}
                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      <PhotoCarousel
                        businessId={provider.id}
                        photos={businessPhotos[provider.id] || []}
                        onLoadPhotos={() => loadPhotosForBusiness(provider.id)}
                        showMultiple={true}
                        photosPerView={5}
                        className="w-full"
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
        provider={selectedProvider}
        reviews={selectedProvider?.reviews || []}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusinessId}
        businessName={selectedBusinessName}
      />

      {/* Login Dialog */}
      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />

      <Toaster />
    </CategoryLayout>
  )
}
