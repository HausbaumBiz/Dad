"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { PhotoCarousel } from "@/components/photo-carousel"
import { StarRating } from "@/components/star-rating"
import {
  Heart,
  HeartHandshake,
  Loader2,
  MapPin,
  Phone,
  Bug,
  ChevronDown,
  ChevronUp,
  Search,
  Wrench,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import type { Business } from "@/lib/definitions"

// Debug interface
interface DebugInfo {
  timestamp: string
  step: string
  data: any
  error?: string
}

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
  const [providers, setProviders] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // State for filtering
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // State for dialogs
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)
  const [selectedProviderName, setSelectedProviderName] = useState<string | null>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // User and favorites state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [favoriteProviders, setFavoriteProviders] = useState(new Set<string>())
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const { toast } = useToast()

  // Debug state
  const [debugInfo, setDebugInfo] = useState<DebugInfo[]>([])
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [businessIdToCheck, setBusinessIdToCheck] = useState("0b86ff43-36e5-4c44-9b1b-3ddb07ba8795")

  // Ref to track fetch requests to prevent race conditions
  const fetchIdRef = useRef(0)

  // Debug helper function
  const addDebugInfo = (step: string, data: any, error?: string) => {
    const debugEntry: DebugInfo = {
      timestamp: new Date().toISOString(),
      step,
      data,
      error,
    }
    console.log(`[DEBUG] ${step}:`, data, error ? `Error: ${error}` : "")
    setDebugInfo((prev) => [...prev, debugEntry])
  }

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
      addDebugInfo("User Zip Code Loaded", { zipCode: savedZipCode })
    } else {
      addDebugInfo("No User Zip Code", { message: "No zip code found in localStorage" })
    }
  }, [])

  // Check user session using API route
  useEffect(() => {
    async function checkUserSession() {
      try {
        const response = await fetch("/api/user/session")
        const result = await response.json()

        if (result.success && result.user) {
          setCurrentUser(result.user)
          addDebugInfo("User Session Check", { user: "Logged in" })
        } else {
          setCurrentUser(null)
          addDebugInfo("User Session Check", { user: "Not logged in" })
        }
      } catch (error) {
        addDebugInfo("User Session Check", null, `Error checking user session: ${error}`)
        setCurrentUser(null)
      }
    }
    checkUserSession()
  }, [])

  // Load user's favorite providers using API route
  useEffect(() => {
    async function loadFavorites() {
      if (!currentUser?.id) return

      try {
        const favoriteIds = new Set<string>()

        // Check each provider to see if it's a favorite
        for (const provider of providers) {
          try {
            const response = await fetch("/api/user/favorites/check", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ businessId: provider.id }),
            })
            const result = await response.json()

            if (result.success && result.isFavorite) {
              favoriteIds.add(provider.id)
            }
          } catch (error) {
            console.error(`Error checking favorite status for ${provider.id}:`, error)
          }
        }

        setFavoriteProviders(favoriteIds)
        addDebugInfo("Favorites Loaded", { count: favoriteIds.size })
      } catch (error) {
        addDebugInfo("Favorites Loading", null, `Error loading favorites: ${error}`)
      }
    }

    if (providers.length > 0) {
      loadFavorites()
    }
  }, [currentUser, providers])

  // Handler for filter changes
  const handleFilterChange = (filterId: string, checked: boolean) => {
    addDebugInfo("Filter Change", { filterId, checked })
    if (checked) {
      setSelectedFilters((prev) => [...prev, filterId])
    } else {
      setSelectedFilters((prev) => prev.filter((id) => id !== filterId))
    }
  }

  // Clear all filters
  const clearFilters = () => {
    addDebugInfo("Clear Filters", { previousFilters: selectedFilters })
    setSelectedFilters([])
  }

  // Handler for adding provider to favorites using API route
  const handleAddToFavorites = async (provider: Business) => {
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

      const response = await fetch("/api/user/favorites/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(providerData),
      })

      const result = await response.json()

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
      console.error("[Lawn Garden] Error adding favorite provider:", error)
      toast({
        title: "Error",
        description: "Failed to save business card. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingStates((prev) => ({ ...prev, [provider.id]: false }))
    }
  }

  // Create test business function
  const createTestBusiness = async () => {
    try {
      addDebugInfo("Creating Test Business", { action: "start" })

      const response = await fetch("/api/debug/populate-lawn-garden-test-data", {
        method: "POST",
      })

      const result = await response.json()
      addDebugInfo("Test Business Creation Result", result)

      if (result.success) {
        toast({
          title: "Test Business Created",
          description: "A test lawn care business has been created. Refreshing data...",
          variant: "default",
        })

        // Refresh the data
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create test business",
          variant: "destructive",
        })
      }
    } catch (error) {
      addDebugInfo("Test Business Creation", null, `Error: ${error}`)
      toast({
        title: "Error",
        description: "Failed to create test business",
        variant: "destructive",
      })
    }
  }

  // Check business indexing
  const checkBusinessIndexing = async () => {
    try {
      addDebugInfo("Checking Business Indexing", { businessId: businessIdToCheck })

      const response = await fetch(`/api/debug/check-business-indexing/${businessIdToCheck}`)
      const result = await response.json()

      addDebugInfo("Business Indexing Check Result", result)

      if (result.success) {
        toast({
          title: "Indexing Check Complete",
          description: "Check the debug panel for detailed results.",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to check business indexing",
          variant: "destructive",
        })
      }
    } catch (error) {
      addDebugInfo("Business Indexing Check", null, `Error: ${error}`)
      toast({
        title: "Error",
        description: "Failed to check business indexing",
        variant: "destructive",
      })
    }
  }

  // Fix business indexing
  const fixBusinessIndexing = async () => {
    try {
      addDebugInfo("Fixing Business Indexing", { businessId: businessIdToCheck })

      const response = await fetch(`/api/debug/check-business-indexing/${businessIdToCheck}`, {
        method: "POST",
      })
      const result = await response.json()

      addDebugInfo("Business Indexing Fix Result", result)

      if (result.success) {
        toast({
          title: "Indexing Fixed",
          description: "Business indexing has been updated. Refreshing data...",
          variant: "default",
        })

        // Refresh the data
        setTimeout(() => window.location.reload(), 1000)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fix business indexing",
          variant: "destructive",
        })
      }
    } catch (error) {
      addDebugInfo("Business Indexing Fix", null, `Error: ${error}`)
      toast({
        title: "Error",
        description: "Failed to fix business indexing",
        variant: "destructive",
      })
    }
  }

  // Run diagnosis
  const runDiagnosis = async () => {
    try {
      addDebugInfo("Running Diagnosis", { path: "/home-improvement/lawn-garden" })

      const response = await fetch("/api/debug/category-page-diagnosis/home-improvement/lawn-garden")
      const result = await response.json()

      addDebugInfo("Diagnosis Result", result)

      if (result.success) {
        toast({
          title: "Diagnosis Complete",
          description: "Check the debug panel for detailed results.",
          variant: "default",
        })
      } else {
        toast({
          title: "Diagnosis Error",
          description: result.error || "Failed to run diagnosis",
          variant: "destructive",
        })
      }
    } catch (error) {
      addDebugInfo("Diagnosis", null, `Error: ${error}`)
      toast({
        title: "Error",
        description: "Failed to run diagnosis",
        variant: "destructive",
      })
    }
  }

  // Main fetch function - now using API routes instead of direct server action calls
  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      addDebugInfo("Fetch Start", { fetchId: currentFetchId, timestamp: new Date().toISOString() })

      try {
        setLoading(true)
        setError(null)

        // Step 1: Call API route
        addDebugInfo("API Call", { url: "/api/businesses/by-category-page/home-improvement/lawn-garden" })
        const response = await fetch("/api/businesses/by-category-page/home-improvement/lawn-garden")

        if (!response.ok) {
          const errorMsg = `API request failed: ${response.status} ${response.statusText}`
          addDebugInfo("API Response Error", { status: response.status, statusText: response.statusText })
          throw new Error(errorMsg)
        }

        const apiResult = await response.json()
        addDebugInfo("API Response", {
          success: apiResult.success,
          businessCount: apiResult.businesses?.length || 0,
          error: apiResult.error,
        })

        if (!apiResult.success) {
          throw new Error(apiResult.error || "Failed to fetch businesses from API")
        }

        let businesses = apiResult.businesses || []

        // Filter out any demo businesses with "Green Thumb Lawn Care" in the name
        businesses = businesses.filter((business: Business) => {
          const businessName = business.displayName || business.businessName || ""
          const isDemo = businessName.toLowerCase().includes("green thumb lawn care")
          if (isDemo) {
            addDebugInfo("Filtered Demo Business", {
              businessId: business.id,
              businessName: businessName,
            })
          }
          return !isDemo
        })

        addDebugInfo("Raw Businesses (after demo filter)", {
          count: businesses.length,
          businessIds: businesses.map((b: Business) => b.id),
          businessNames: businesses.map((b: Business) => b.displayName || b.businessName),
        })

        // Step 2: Load photos and ratings concurrently for each business using API routes
        addDebugInfo("Loading Photos and Ratings", { businessCount: businesses.length })

        const businessesWithPhotosAndReviews = await Promise.all(
          businesses.map(async (business: Business, index: number) => {
            try {
              addDebugInfo(`Processing Business ${index + 1}`, {
                businessId: business.id,
                name: business.displayName || business.businessName,
              })

              // Load photos and rating data concurrently using API routes
              const [photosResponse, ratingResponse] = await Promise.all([
                fetch(`/api/business/${business.id}/photos`).catch(() => ({ ok: false })),
                fetch(`/api/business/${business.id}/rating`).catch(() => ({ ok: false })),
              ])

              let photos = []
              let ratingData = { rating: 0, reviewCount: 0 }

              if (photosResponse.ok) {
                const photosResult = await photosResponse.json()
                if (photosResult.success) {
                  photos = photosResult.photos
                }
              }

              if (ratingResponse.ok) {
                const ratingResult = await ratingResponse.json()
                if (ratingResult.success) {
                  ratingData = {
                    rating: ratingResult.rating,
                    reviewCount: ratingResult.reviewCount,
                  }
                }
              }

              const enhancedBusiness = {
                ...business,
                photos,
                rating: ratingData.rating,
                reviewCount: ratingData.reviewCount,
              }

              addDebugInfo(`Enhanced Business ${index + 1}`, {
                businessId: business.id,
                name: enhancedBusiness.displayName || enhancedBusiness.businessName,
                rating: enhancedBusiness.rating,
                reviewCount: enhancedBusiness.reviewCount,
                photoCount: enhancedBusiness.photos?.length || 0,
              })

              return enhancedBusiness
            } catch (error) {
              addDebugInfo(`Business Processing Error`, { businessId: business.id }, `${error}`)
              // Return business with default values if individual business fails
              return {
                ...business,
                photos: [],
                rating: 0,
                reviewCount: 0,
              }
            }
          }),
        )

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          addDebugInfo("Stale Request", { fetchId: currentFetchId, currentId: fetchIdRef.current })
          return
        }

        addDebugInfo("Enhanced Businesses", {
          count: businessesWithPhotosAndReviews.length,
          withRatings: businessesWithPhotosAndReviews.filter((b) => b.rating > 0).length,
          withPhotos: businessesWithPhotosAndReviews.filter((b) => b.photos?.length > 0).length,
        })

        // Step 3: Filter by user's zip code if available
        let filteredProviders = businessesWithPhotosAndReviews

        if (userZipCode) {
          addDebugInfo("Zip Code Filtering Start", {
            userZipCode,
            totalBusinesses: businessesWithPhotosAndReviews.length,
          })
          filteredProviders = []

          for (const provider of businessesWithPhotosAndReviews) {
            try {
              const response = await fetch(`/api/admin/business/${provider.id}/service-area`)
              if (response.ok) {
                const serviceAreaData = await response.json()

                addDebugInfo(`Service Area Check`, {
                  businessId: provider.id,
                  businessName: provider.displayName,
                  zipCount: serviceAreaData.zipCodes?.length || 0,
                  isNationwide: serviceAreaData.isNationwide,
                })

                // Check if provider is nationwide
                if (serviceAreaData.isNationwide) {
                  addDebugInfo(`Nationwide Provider`, { businessId: provider.id, businessName: provider.displayName })
                  filteredProviders.push(provider)
                  continue
                }

                // Check if the user's zip code is in the provider's service area
                if (serviceAreaData.zipCodes && Array.isArray(serviceAreaData.zipCodes)) {
                  const servicesUserZip = serviceAreaData.zipCodes.some((zipData: any) => {
                    // Handle both string and object formats
                    const zipCode = typeof zipData === "string" ? zipData : zipData?.zip
                    return zipCode === userZipCode
                  })

                  if (servicesUserZip) {
                    addDebugInfo(`Zip Match Found`, {
                      businessId: provider.id,
                      businessName: provider.displayName,
                      userZipCode,
                    })
                    filteredProviders.push(provider)
                  } else {
                    addDebugInfo(`No Zip Match`, {
                      businessId: provider.id,
                      businessName: provider.displayName,
                      userZipCode,
                      availableZips: serviceAreaData.zipCodes
                        .slice(0, 5)
                        .map((z: any) => (typeof z === "string" ? z : z?.zip)),
                    })
                  }
                } else {
                  addDebugInfo(`No Service Area Data`, { businessId: provider.id, businessName: provider.displayName })
                  filteredProviders.push(provider)
                }
              } else {
                addDebugInfo(`Service Area API Error`, { businessId: provider.id, status: response.status })
                filteredProviders.push(provider)
              }
            } catch (error) {
              addDebugInfo(`Service Area Check Error`, { businessId: provider.id }, `${error}`)
              filteredProviders.push(provider)
            }
          }

          addDebugInfo("Zip Code Filtering Complete", {
            originalCount: businessesWithPhotosAndReviews.length,
            filteredCount: filteredProviders.length,
            userZipCode,
          })
        } else {
          addDebugInfo("No Zip Code Filter", { message: "Showing all providers" })
        }

        addDebugInfo("Final Result", { providerCount: filteredProviders.length })
        setProviders(filteredProviders)
      } catch (err) {
        const errorMsg = `${err}`
        addDebugInfo("Fetch Error", null, errorMsg)
        setError("Failed to load providers. Please try again.")
      } finally {
        setLoading(false)
        addDebugInfo("Fetch Complete", { fetchId: currentFetchId })
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  // Define the function before it's used
  const getAllTerminalSubcategories = (subcategories: any[]) => {
    if (!Array.isArray(subcategories)) return []

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
        return terminalService
      })
      .filter(Boolean) // Remove nulls
      .filter((value, index, self) => self.indexOf(value) === index) // Remove duplicates

    return allServices
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
          const providerServices = getAllTerminalSubcategories(provider.subcategories || [])

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

  // Handler for opening reviews dialog
  const handleOpenReviews = (provider: Business) => {
    setSelectedProviderId(provider.id)
    setSelectedProviderName(provider.displayName)
    setIsReviewsDialogOpen(true)
  }

  // Handler for opening profile dialog
  const handleViewProfile = (provider: Business) => {
    setSelectedProviderId(provider.id)
    setSelectedProviderName(provider.displayName)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Lawn and Garden Services" backLink="/home-improvement" backText="Home Improvement">
      {/* Debug Panel Toggle */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="flex items-center gap-2"
            >
              <Bug className="h-4 w-4" />
              Debug Panel
              {showDebugPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={createTestBusiness}>
              Create Test Business
            </Button>
            <Button variant="outline" size="sm" onClick={runDiagnosis}>
              <Search className="h-4 w-4 mr-1" />
              Run Diagnosis
            </Button>
          </div>
        </div>

        {/* Business ID Input and Actions */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Business ID to check/fix"
            value={businessIdToCheck}
            onChange={(e) => setBusinessIdToCheck(e.target.value)}
            className="max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={checkBusinessIndexing}>
            <Search className="h-4 w-4 mr-1" />
            Check Indexing
          </Button>
          <Button variant="outline" size="sm" onClick={fixBusinessIndexing}>
            <Wrench className="h-4 w-4 mr-1" />
            Fix Indexing
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      <Collapsible open={showDebugPanel} onOpenChange={setShowDebugPanel}>
        <CollapsibleContent>
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-orange-800">Debug Information</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDebugInfo([])}
                    className="text-orange-700 border-orange-300"
                  >
                    Clear Debug Log
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">Current State</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>Providers: {providers.length}</li>
                      <li>Filtered: {filteredProviders.length}</li>
                      <li>Loading: {loading ? "Yes" : "No"}</li>
                      <li>User Zip: {userZipCode || "None"}</li>
                      <li>Filters: {selectedFilters.length}</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">API Status</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>Path: /home-improvement/lawn-garden</li>
                      <li>Category: "Lawn, Garden and Snow Removal"</li>
                      <li>Error: {error || "None"}</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded border">
                    <h4 className="font-medium text-gray-700 mb-2">Debug Entries</h4>
                    <p className="text-gray-600">{debugInfo.length} log entries</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Last: {debugInfo[debugInfo.length - 1]?.timestamp.split("T")[1]?.split(".")[0] || "None"}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                  <h4 className="font-medium text-gray-700 mb-2">Debug Log</h4>
                  <div className="space-y-2 text-xs font-mono">
                    {debugInfo.map((info, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${info.error ? "bg-red-50 border border-red-200" : "bg-gray-50"}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-700">{info.step}</span>
                          <span className="text-gray-500">{info.timestamp.split("T")[1]?.split(".")[0]}</span>
                        </div>
                        {info.error && <div className="text-red-600 mb-1">Error: {info.error}</div>}
                        <div className="text-gray-600">
                          {typeof info.data === "object" ? JSON.stringify(info.data, null, 2) : info.data}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

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
          <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
            Try Again
          </Button>
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
            <div className="space-y-2">
              <Button className="bg-green-600 hover:bg-green-700">Register Your Business</Button>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={createTestBusiness}>
                  Create Test Business
                </Button>
                <Button variant="outline" onClick={runDiagnosis}>
                  Run Diagnosis
                </Button>
              </div>
            </div>
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

                    {/* Rating Display - positioned below business name */}
                    <div className="flex items-center gap-2 mb-3">
                      {provider.rating && provider.rating > 0 ? (
                        <>
                          <StarRating rating={provider.rating} size="sm" />
                          <span className="text-sm font-medium text-gray-700">{provider.rating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">({provider.reviewCount || 0} reviews)</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No reviews yet</span>
                      )}
                    </div>

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

                    {/* Services */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Services ({getAllTerminalSubcategories(provider.subcategories || []).length}):
                      </p>
                      <div
                        className={`flex flex-wrap gap-2 ${getAllTerminalSubcategories(provider.subcategories || []).length > 8 ? "max-h-32 overflow-y-auto" : ""}`}
                      >
                        {getAllTerminalSubcategories(provider.subcategories || []).map((service, idx) => (
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
                      {getAllTerminalSubcategories(provider.subcategories || []).length > 8 && (
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
                        photos={provider.photos || []}
                        onLoadPhotos={() => {}} // Photos already loaded in fetchBusinesses
                        showMultiple={true}
                        photosPerView={5}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-32">
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
        reviews={[]} // Reviews will be loaded by the dialog component
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
