"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useToast } from "@/components/ui/use-toast"
import { Phone, Loader2, MapPin } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"
import { PhotoCarousel } from "@/components/photo-carousel"

// Enhanced Business interface with service area support
interface Business {
  id: string
  businessName: string
  displayName?: string
  city?: string
  state?: string
  zipCode?: string
  displayCity?: string
  displayState?: string
  displayPhone?: string
  phone?: string
  rating?: number
  reviews?: number
  services?: any[]
  subcategories?: any[]
  allSubcategories?: any[]
  reviewsData?: any[]
  adDesignData?: {
    businessInfo?: {
      phone?: string
      city?: string
      state?: string
      streetAddress?: string
      zipCode?: string
      businessName?: string
      freeText?: string
    }
  }
  serviceArea?: string[]
  isNationwide?: boolean
  photos?: string[]
  businessDescription?: string
  description?: string
  displayLocation?: string
}

// Function to load business photos from Cloudflare using public URLs
const loadBusinessPhotos = async (businessId: string): Promise<string[]> => {
  try {
    console.log(`Loading photos for business ${businessId}`)

    // Fetch business media data from the updated API
    const response = await fetch(`/api/businesses/${businessId}`)
    if (!response.ok) {
      console.error(`Failed to fetch business data: ${response.status} ${response.statusText}`)
      return []
    }

    const businessData = await response.json()
    console.log(`Business data for ${businessId}:`, businessData)

    // Try multiple possible locations for photo data
    let photoAlbum = null

    // Check direct photos property first
    if (businessData.photos && Array.isArray(businessData.photos)) {
      photoAlbum = businessData.photos
    }
    // Check direct photoAlbum property
    else if (businessData.photoAlbum && Array.isArray(businessData.photoAlbum)) {
      photoAlbum = businessData.photoAlbum
    }
    // Check nested media.photos
    else if (businessData.media?.photos && Array.isArray(businessData.media.photos)) {
      photoAlbum = businessData.media.photos
    }
    // Check nested media.photoAlbum
    else if (businessData.media?.photoAlbum && Array.isArray(businessData.media.photoAlbum)) {
      photoAlbum = businessData.media.photoAlbum
    }
    // Check adDesign.photos
    else if (businessData.adDesign?.photos && Array.isArray(businessData.adDesign.photos)) {
      photoAlbum = businessData.adDesign.photos
    }
    // Check adDesign.photoAlbum
    else if (businessData.adDesign?.photoAlbum && Array.isArray(businessData.adDesign.photoAlbum)) {
      photoAlbum = businessData.adDesign.photoAlbum
    }

    if (!photoAlbum || !Array.isArray(photoAlbum)) {
      console.log(`No photo album found for business ${businessId}`)
      return []
    }

    console.log(`Found ${photoAlbum.length} photos in album for business ${businessId}`)

    // Convert Cloudflare image IDs to public URLs
    const photoUrls = photoAlbum
      .map((photo: any, index: number) => {
        // Handle different photo data structures
        let imageId = null

        if (typeof photo === "string") {
          // If photo is just a string, check if it's already a URL or an image ID
          if (photo.startsWith("http") || photo.startsWith("https")) {
            console.log(`Photo ${index} already has full URL: ${photo}`)
            return photo
          }
          imageId = photo
        } else if (photo && typeof photo === "object") {
          // If photo is an object, try to extract the image ID or URL
          const url = photo.url || photo.src || photo.imageUrl
          if (url && (url.startsWith("http") || url.startsWith("https"))) {
            console.log(`Photo ${index} already has full URL: ${url}`)
            return url
          }

          imageId = photo.imageId || photo.id || photo.cloudflareId || photo.key || url
        }

        if (!imageId) {
          console.warn(`No image ID found for photo ${index}:`, photo)
          return null
        }

        // Generate public Cloudflare URL
        try {
          const publicUrl = getCloudflareImageUrl(imageId, "public")
          console.log(`Generated URL for image ${imageId}: ${publicUrl}`)
          return publicUrl
        } catch (error) {
          console.error(`Error generating URL for image ${imageId}:`, error)
          return null
        }
      })
      .filter(Boolean) // Remove null/undefined URLs

    console.log(`Successfully loaded ${photoUrls.length} photos for business ${businessId}`)
    return photoUrls
  } catch (error) {
    console.error(`Error loading photos for business ${businessId}:`, error)
    return []
  }
}

// Format phone number for display
function formatPhoneNumber(phone: string): string {
  if (!phone) return "No phone provided"

  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "")

  // Check if we have a valid 10-digit US phone number
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }

  // Return original if not a standard format
  return phone
}

// Helper function to safely extract string from subcategory data
const getSubcategoryString = (subcategory: any): string => {
  if (typeof subcategory === "string") {
    return subcategory
  }

  if (subcategory && typeof subcategory === "object") {
    // Try to get the subcategory field first, then category, then fullPath
    return subcategory.subcategory || subcategory.category || subcategory.fullPath || "Unknown Service"
  }

  return "Unknown Service"
}

// Helper function for exact subcategory matching
const hasExactSubcategoryMatch = (business: Business, filters: string[]): boolean => {
  if (filters.length === 0) return true

  console.log(`Checking business ${business.displayName || business.businessName} subcategories:`, {
    subcategories: business.subcategories,
    allSubcategories: business.allSubcategories,
    services: business.services,
    filters,
  })

  // Collect all subcategory strings from all sources
  const allSubcategoryStrings: string[] = []

  // Check allSubcategories first (this seems to be the main field)
  if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
    business.allSubcategories.forEach((sub) => {
      const subStr = getSubcategoryString(sub)
      if (subStr !== "Unknown Service" && subStr.trim() !== "") {
        allSubcategoryStrings.push(subStr)
      }
    })
  }

  // Check subcategories as fallback
  if (business.subcategories && Array.isArray(business.subcategories)) {
    business.subcategories.forEach((sub) => {
      const subStr = getSubcategoryString(sub)
      if (subStr !== "Unknown Service" && subStr.trim() !== "") {
        allSubcategoryStrings.push(subStr)
      }
    })
  }

  // Check services as fallback
  if (business.services && Array.isArray(business.services)) {
    business.services.forEach((service) => {
      const serviceStr = getSubcategoryString(service)
      if (serviceStr !== "Unknown Service" && serviceStr.trim() !== "") {
        allSubcategoryStrings.push(serviceStr)
      }
    })
  }

  // Remove duplicates
  const uniqueSubcategories = [...new Set(allSubcategoryStrings)]

  console.log(`Business ${business.displayName || business.businessName} subcategory strings:`, uniqueSubcategories)

  // Check for matches using case-insensitive comparison
  const hasMatch = filters.some((filter) => {
    const filterLower = filter.toLowerCase().trim()
    const match = uniqueSubcategories.some((subcategory) => {
      const subcategoryLower = subcategory.toLowerCase().trim()
      // Check for exact match or partial match
      return (
        subcategoryLower === filterLower ||
        subcategoryLower.includes(filterLower) ||
        filterLower.includes(subcategoryLower)
      )
    })

    if (match) {
      console.log(`✅ Found match for filter "${filter}" in business ${business.displayName || business.businessName}`)
    }

    return match
  })

  console.log(`Business ${business.displayName || business.businessName} matches filters: ${hasMatch}`)
  return hasMatch
}

export default function AutomotiveServicesPage() {
  const { toast } = useToast()
  const fetchIdRef = useRef(0)

  const filterOptions = [
    { id: "auto1", label: "General Auto Repair", value: "General Auto Repair" },
    { id: "auto2", label: "Engine and Transmission", value: "Engine and Transmission" },
    { id: "auto3", label: "Body Shop", value: "Body Shop" },
    { id: "auto4", label: "Tire and Brakes", value: "Tire and Brakes" },
    { id: "auto5", label: "Mufflers", value: "Mufflers" },
    { id: "auto6", label: "Oil Change", value: "Oil Change" },
    { id: "auto7", label: "Windshield Repair", value: "Windshield Repair" },
    { id: "auto8", label: "Custom Paint", value: "Custom Paint" },
    { id: "auto9", label: "Detailing Services", value: "Detailing Services" },
    { id: "auto10", label: "Car Wash", value: "Car Wash" },
    { id: "auto11", label: "Auto Parts", value: "Auto Parts" },
    { id: "auto12", label: "ATV/Motorcycle Repair", value: "ATV/Motorcycle Repair" },
    { id: "auto13", label: "Utility Vehicle Repair", value: "Utility Vehicle Repair" },
    { id: "auto14", label: "RV Maintenance and Repair", value: "RV Maintenance and Repair" },
    { id: "auto15", label: "Other Automotive/Motorcycle/RV, etc", value: "Other Automotive/Motorcycle/RV, etc" },
    { id: "auto16", label: "Automotive Sales", value: "Automotive Sales" },
    { id: "auto17", label: "Motor Sport/Utility Vehicle/RV Sales", value: "Motor Sport/Utility Vehicle/RV Sales" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{ name: string; id: string } | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")

  // State for businesses
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Filter state
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])

  // Filter handlers
  const handleFilterChange = (filterValue: string, checked: boolean) => {
    setSelectedFilters((prev) => (checked ? [...prev, filterValue] : prev.filter((f) => f !== filterValue)))
  }

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All businesses:", allBusinesses)

    if (selectedFilters.length === 0) {
      setFilteredBusinesses(allBusinesses)
      setAppliedFilters([])
    } else {
      const filtered = allBusinesses.filter((business) => hasExactSubcategoryMatch(business, selectedFilters))
      console.log("Filtered results:", filtered)
      setFilteredBusinesses(filtered)
      setAppliedFilters([...selectedFilters])
    }

    toast({
      title: "Filters Applied",
      description: `${selectedFilters.length === 0 ? "Showing all" : `Found ${filteredBusinesses.length}`} automotive service providers`,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredBusinesses(allBusinesses)
    toast({
      title: "Filters Cleared",
      description: "Showing all automotive service providers",
    })
  }

  // Helper function to check if business serves a zip code
  const businessServesZipCode = (business: Business, zipCode: string): boolean => {
    console.log(
      `[Automotive Services] Checking if business ${business.displayName || business.businessName} serves ${zipCode}:`,
      {
        isNationwide: business.isNationwide,
        serviceArea: business.serviceArea,
        primaryZip: business.zipCode,
      },
    )

    // Check if business serves nationwide
    if (business.isNationwide) {
      console.log(`[Automotive Services] Business serves nationwide`)
      return true
    }

    // Check if business service area includes the zip code
    if (business.serviceArea && Array.isArray(business.serviceArea)) {
      const serves = business.serviceArea.some((area) => {
        if (typeof area === "string") {
          return area.toLowerCase().includes("nationwide") || area === zipCode
        }
        return false
      })
      console.log(`[Automotive Services] Service area check result: ${serves}`)
      if (serves) return true
    }

    // Fall back to primary zip code comparison
    const primaryMatch = business.zipCode === zipCode
    console.log(`[Automotive Services] Primary zip code match: ${primaryMatch}`)
    return primaryMatch
  }

  // Clear zip code filter
  const clearZipCodeFilter = () => {
    setUserZipCode(null)
    localStorage.removeItem("savedZipCode")
  }

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current
      console.log(`[Automotive Services] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

      try {
        setLoading(true)
        setError(null)

        const result = await getBusinessesForCategoryPage("/automotive-services")

        // Load photos for each business using public Cloudflare URLs
        const businessesWithPhotos = await Promise.all(
          result.map(async (business: Business) => {
            const photos = await loadBusinessPhotos(business.id)
            return { ...business, photos }
          }),
        )

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(
            `[Automotive Services] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`,
          )
          return
        }

        console.log(`[Automotive Services] Fetch ${currentFetchId} completed, got ${result.length} businesses`)

        // Filter businesses by zip code if userZipCode is available
        if (userZipCode) {
          console.log(`[Automotive Services] Filtering by zip code: ${userZipCode}`)
          const filteredBusinesses = businessesWithPhotos.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Automotive Services] Business ${business.displayName || business.businessName} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              business,
            )
            return serves
          })
          console.log(`[Automotive Services] After filtering: ${filteredBusinesses.length} businesses`)
          setBusinesses(filteredBusinesses)
          setAllBusinesses(filteredBusinesses)
          setFilteredBusinesses(filteredBusinesses)
        } else {
          setBusinesses(businessesWithPhotos)
          setAllBusinesses(businessesWithPhotos)
          setFilteredBusinesses(businessesWithPhotos)
        }
      } catch (error) {
        // Only update error state if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error("Error fetching businesses:", error)
          setError("Failed to load businesses")
          toast({
            title: "Error loading businesses",
            description: "There was a problem loading businesses. Please try again later.",
            variant: "destructive",
          })
        }
      } finally {
        // Only update loading state if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  // Helper function to get phone number from business data
  const getPhoneNumber = (business: Business) => {
    // First try to get phone from ad design data
    if (business.adDesignData?.businessInfo?.phone) {
      return business.adDesignData.businessInfo.phone
    }
    // Then try displayPhone which might be set by the centralized system
    if (business.displayPhone) {
      return business.displayPhone
    }
    // Fall back to the business registration phone
    if (business.phone) {
      return business.phone
    }
    return null
  }

  // Helper function to get location from business data
  const getLocation = (business: Business) => {
    // First try to get location from ad design data
    const adDesignCity = business.adDesignData?.businessInfo?.city
    const adDesignState = business.adDesignData?.businessInfo?.state

    // Then try displayCity/displayState which might be set by the centralized system
    const displayCity = business.displayCity
    const displayState = business.displayState

    // Finally fall back to registration data
    const registrationCity = business.city
    const registrationState = business.state

    // Build location string prioritizing ad design data
    const city = adDesignCity || displayCity || registrationCity
    const state = adDesignState || displayState || registrationState

    const parts = []
    if (city) parts.push(city)
    if (state) parts.push(state)

    if (parts.length > 0) {
      return parts.join(", ")
    }

    // If no city/state available, show zip code as fallback
    if (business.zipCode) {
      return `Zip: ${business.zipCode}`
    }

    return "Location not provided"
  }

  // Helper function to get subcategories
  const getSubcategories = (business: Business) => {
    console.log(
      `[Automotive Services] Getting subcategories for business ${business.displayName || business.businessName}:`,
      {
        subcategories: business.subcategories,
        allSubcategories: business.allSubcategories,
        services: business.services,
      },
    )

    // Collect all subcategories from different sources
    const allSubcategoryStrings: string[] = []

    // Check allSubcategories first (this seems to be the main field)
    if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
      business.allSubcategories.forEach((sub) => {
        const subStr = getSubcategoryString(sub)
        if (subStr !== "Unknown Service" && subStr.trim() !== "") {
          allSubcategoryStrings.push(subStr)
        }
      })
    }

    // Check subcategories as fallback
    if (business.subcategories && Array.isArray(business.subcategories)) {
      business.subcategories.forEach((sub) => {
        const subStr = getSubcategoryString(sub)
        if (subStr !== "Unknown Service" && subStr.trim() !== "") {
          allSubcategoryStrings.push(subStr)
        }
      })
    }

    // Check services as fallback
    if (business.services && Array.isArray(business.services)) {
      business.services.forEach((service) => {
        const serviceStr = getSubcategoryString(service)
        if (serviceStr !== "Unknown Service" && serviceStr.trim() !== "") {
          allSubcategoryStrings.push(serviceStr)
        }
      })
    }

    // Remove duplicates
    const uniqueSubcategories = [...new Set(allSubcategoryStrings)]

    console.log(
      `[Automotive Services] Final subcategories for ${business.displayName || business.businessName}:`,
      uniqueSubcategories,
    )

    return uniqueSubcategories.length > 0 ? uniqueSubcategories : ["Automotive Services"]
  }

  const handleViewReviews = (business: Business) => {
    console.log("Opening reviews for business:", business)
    setSelectedProvider({
      name: business.displayName || business.businessName,
      id: business.id || "",
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: Business) => {
    console.log("Opening profile for business:", business)
    setSelectedBusinessId(business.id || "")
    setSelectedBusinessName(business.displayName || business.businessName)
    setIsProfileDialogOpen(true)
  }

  // No-op function for photo loading since photos are already loaded
  const handleLoadPhotos = () => {
    // Photos are already loaded in the useEffect, so this is a no-op
  }

  return (
    <CategoryLayout title="Automotive Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/auto-mQWtZXyRogQgO5qlNVcR1OYcyDqe59.png"
            alt="Automotive Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find trusted automotive professionals in your area. From routine maintenance to major repairs, connect with
            qualified mechanics and service providers.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Read reviews from other customers</li>
              <li>View business videos showcasing work and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you'd trust to hire yourself</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Zip Code Status Indicator */}
      {userZipCode && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-800 text-sm">
                <strong>Showing results for ZIP code: {userZipCode}</strong>
                <br />
                <span className="text-blue-600">Including businesses that serve your area or operate nationwide.</span>
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearZipCodeFilter}
              className="text-blue-600 border-blue-300 hover:bg-blue-100 bg-transparent"
            >
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      {/* Enhanced Filter Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Filter by Service Type</h3>
          <div className="text-sm text-gray-600">
            {selectedFilters.length > 0 &&
              `${selectedFilters.length} filter${selectedFilters.length > 1 ? "s" : ""} selected`}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filterOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-primary/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedFilters.includes(option.value)}
                onCheckedChange={(checked) => handleFilterChange(option.value, checked as boolean)}
              />
              <span className="text-sm font-medium">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <Button onClick={applyFilters} disabled={selectedFilters.length === 0} className="min-w-[120px]">
            Apply Filters
          </Button>
          {appliedFilters.length > 0 && (
            <Button variant="outline" onClick={clearFilters} className="min-w-[120px] bg-transparent">
              Clear Filters
            </Button>
          )}
        </div>

        {appliedFilters.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Active filters:</strong> {appliedFilters.join(", ")}
              <br />
              <span className="text-blue-600">
                Showing {filteredBusinesses.length} of {allBusinesses.length} businesses
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Business Listings */}
      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading automotive service providers...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
          </div>
        ) : filteredBusinesses.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Automotive Service Providers ({filteredBusinesses.length})
            </h2>

            <div className="grid gap-6">
              {filteredBusinesses.map((business) => (
                <Card key={business.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col space-y-4">
                      {/* Business Name and Basic Info */}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {business.displayName || business.businessName}
                        </h3>

                        {/* Contact Info - Compact Layout */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-2 text-sm text-gray-600 mb-3">
                          {getPhoneNumber(business) && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-2 text-primary" />
                              <a href={`tel:${getPhoneNumber(business)}`} className="text-blue-600 hover:underline">
                                {formatPhoneNumber(getPhoneNumber(business)!)}
                              </a>
                            </div>
                          )}

                          {getLocation(business) && (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-primary" />
                              <span>{getLocation(business)}</span>
                            </div>
                          )}
                        </div>

                        {/* Service Area Indicator */}
                        {business.isNationwide ? (
                          <div className="text-xs text-green-600 font-medium mb-3">✓ Serves nationwide</div>
                        ) : userZipCode && business.serviceArea?.includes(userZipCode) ? (
                          <div className="text-xs text-green-600 font-medium mb-3">
                            ✓ Serves {userZipCode} and surrounding areas
                          </div>
                        ) : null}

                        {/* Description */}
                        {(business.description || business.businessDescription) && (
                          <p className="text-gray-600 text-sm leading-relaxed mb-3">
                            {business.description || business.businessDescription}
                          </p>
                        )}
                      </div>

                      {/* Subcategories/Specialties */}
                      {getSubcategories(business).length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Specializes in:</h4>
                          <div className="flex flex-wrap gap-2">
                            {getSubcategories(business).map((subcategory, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {subcategory}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Desktop: Original layout with photos on the right */}
                      <div className="hidden lg:flex lg:items-start gap-4">
                        {/* Photo Carousel - Desktop */}
                        <div className="flex-1 flex justify-center">
                          <PhotoCarousel
                            businessId={business.id}
                            photos={business.photos || []}
                            onLoadPhotos={handleLoadPhotos}
                            showMultiple={true}
                            photosPerView={5}
                            size="medium"
                          />
                        </div>

                        {/* Action Buttons - Desktop */}
                        <div className="flex flex-col items-end justify-start space-y-2 w-28 flex-shrink-0">
                          <Button className="w-full min-w-[110px]" onClick={() => handleViewReviews(business)}>
                            Reviews
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full min-w-[110px] bg-transparent"
                            onClick={() => handleViewProfile(business)}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>

                      {/* Mobile: Photos below services, buttons below photos */}
                      <div className="lg:hidden">
                        {/* Photo Carousel - Mobile */}
                        {business.photos && business.photos.length > 0 && (
                          <div className="mb-4">
                            <PhotoCarousel
                              businessId={business.id}
                              photos={business.photos}
                              onLoadPhotos={handleLoadPhotos}
                              showMultiple={true}
                              photosPerView={2}
                              size="small"
                            />
                          </div>
                        )}

                        {/* Action Buttons - Mobile */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button className="flex-1" onClick={() => handleViewReviews(business)}>
                            Reviews
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 bg-transparent"
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
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-2xl mx-auto">
              <h3 className="text-xl font-medium text-blue-800 mb-2">
                {userZipCode ? `No Automotive Services in ${userZipCode}` : "No Automotive Services Found"}
              </h3>
              <p className="text-blue-700 mb-4">
                {userZipCode
                  ? `We're building our network of automotive professionals in the ${userZipCode} area.`
                  : "Enter your zip code to find automotive services in your area."}
              </p>
              <div className="bg-white rounded border border-blue-100 p-4">
                <p className="text-gray-700 font-medium">Are you an automotive professional?</p>
                <p className="text-gray-600 mt-1">
                  Join Hausbaum to showcase your services and connect with vehicle owners in your area.
                </p>
                <Button className="mt-3" asChild>
                  <a href="/business-register">Register Your Automotive Business</a>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name || ""}
        businessId={selectedProvider?.id || ""}
        reviews={[]}
      />

      {/* Business Profile Dialog */}
      <BusinessProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
        businessId={selectedBusinessId}
        businessName={selectedBusinessName}
      />

      <Toaster />
    </CategoryLayout>
  )
}
