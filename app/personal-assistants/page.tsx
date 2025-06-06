"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { useState } from "react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useEffect } from "react"
import { MapPin, Phone } from "lucide-react"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useRef } from "react"

export default function PersonalAssistantsPage() {
  const { toast } = useToast()
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isReviewsOpen, setIsReviewsOpen] = useState(false)

  // State for profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState<{ id: string; name: string } | null>(null)

  // State for filtering
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<string[]>([])
  const [allProviders, setAllProviders] = useState([])
  const [filteredProviders, setFilteredProviders] = useState([])

  const mockReviews = {
    "Elite Personal Assistants": [
      {
        id: 1,
        username: "Jonathan M.",
        rating: 5,
        comment:
          "My assistant from Elite has been a game-changer for my busy schedule. Incredibly organized and proactive.",
        date: "2023-12-10",
      },
      {
        id: 2,
        username: "Rebecca S.",
        rating: 4,
        comment:
          "Professional service that has helped me reclaim hours in my week. My assistant anticipates my needs perfectly.",
        date: "2023-11-15",
      },
      {
        id: 3,
        username: "Andrew P.",
        rating: 5,
        comment:
          "The level of detail and efficiency is outstanding. My assistant handles everything from travel arrangements to personal errands flawlessly.",
        date: "2023-10-20",
      },
    ],
    "Executive Support Services": [
      {
        id: 1,
        username: "Victoria L.",
        rating: 5,
        comment:
          "Executive Support Services matched me with the perfect assistant who understands my business needs and personal preferences.",
        date: "2023-12-05",
      },
      {
        id: 2,
        username: "Daniel R.",
        rating: 4,
        comment:
          "Reliable and professional. My assistant has excellent communication skills and handles all tasks promptly.",
        date: "2023-11-08",
      },
      {
        id: 3,
        username: "Sophia T.",
        rating: 5,
        comment:
          "Having an assistant from Executive Support has transformed my productivity. Worth every penny for the time saved.",
        date: "2023-10-12",
      },
    ],
    "Concierge Assistants": [
      {
        id: 1,
        username: "Christopher B.",
        rating: 5,
        comment:
          "The concierge service is exceptional. My assistant handles everything from dinner reservations to gift shopping with style and efficiency.",
        date: "2023-12-15",
      },
      {
        id: 2,
        username: "Olivia W.",
        rating: 4,
        comment: "Very responsive and attentive to details. My assistant has made my life so much easier.",
        date: "2023-11-20",
      },
      {
        id: 3,
        username: "Matthew K.",
        rating: 5,
        comment: "Excellent service that goes above and beyond. My assistant anticipates my needs and always delivers.",
        date: "2023-10-25",
      },
    ],
    "Virtual Assistant Pro": [
      {
        id: 1,
        username: "Emma J.",
        rating: 5,
        comment:
          "My virtual assistant is incredibly efficient and has streamlined all my administrative tasks. Excellent communication.",
        date: "2023-12-08",
      },
      {
        id: 2,
        username: "Nathan F.",
        rating: 4,
        comment:
          "Great value for the service provided. My VA handles my email, scheduling, and research tasks perfectly.",
        date: "2023-11-12",
      },
      {
        id: 3,
        username: "Isabella M.",
        rating: 5,
        comment:
          "Working with my virtual assistant has been seamless. They're responsive, detail-oriented, and very professional.",
        date: "2023-10-18",
      },
    ],
  }

  const handleOpenReviews = (providerName: string) => {
    setSelectedProvider(providerName)
    setIsReviewsOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedBusinessProfile({
      id: provider.id,
      name: provider.displayName || provider.name,
    })
    setIsProfileDialogOpen(true)
  }

  // Function to format phone numbers
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return "No phone provided"

    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "")

    // Check if it's a valid 10-digit US phone number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }

    // Return original if not a standard format
    return phone
  }

  // Filter handling functions
  const handleFilterChange = (filterId: string, checked: boolean) => {
    const filterOption = filterOptions.find((option) => option.id === filterId)
    if (!filterOption) return

    setSelectedFilters((prev) => {
      if (checked) {
        return [...prev, filterOption.value]
      } else {
        return prev.filter((filter) => filter !== filterOption.value)
      }
    })
  }

  // Helper function for strict subcategory matching
  const hasExactSubcategoryMatch = (businessSubcategories: string[], filter: string): boolean => {
    return businessSubcategories.some((subcategory) => {
      // Normalize strings for comparison
      const subcatNormalized = subcategory.trim().toLowerCase()
      const filterNormalized = filter.trim().toLowerCase()

      // Only exact matches
      return subcatNormalized === filterNormalized
    })
  }

  const applyFilters = () => {
    console.log("Applying filters:", selectedFilters)
    console.log("All providers:", allProviders)

    setAppliedFilters([...selectedFilters])

    if (selectedFilters.length === 0) {
      setFilteredProviders(allProviders)
      return
    }

    const filtered = allProviders.filter((business: Business) => {
      // Get all subcategories for this business
      const businessSubcategories = [...(business.allSubcategories || []), ...(business.subcategories || [])]

      console.log(`Business ${business.displayName || business.name} subcategories:`, businessSubcategories)

      // Check if any selected filter matches any business subcategory
      const hasMatch = selectedFilters.some((filter) => {
        // Use strict matching
        const filterMatch = hasExactSubcategoryMatch(businessSubcategories, filter)
        console.log(`Filter "${filter}" matches business: ${filterMatch}`)
        return filterMatch
      })

      console.log(`Business ${business.displayName || business.name} has match: ${hasMatch}`)
      return hasMatch
    })

    console.log("Filtered results:", filtered)
    setFilteredProviders(filtered)

    // Show toast notification
    toast({
      title: filtered.length > 0 ? "Filters Applied" : "No Matches Found",
      description:
        filtered.length > 0
          ? `Showing ${filtered.length} of ${allProviders.length} businesses`
          : "No businesses match your selected filters",
      duration: 3000,
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
    setAppliedFilters([])
    setFilteredProviders(allProviders)

    toast({
      title: "Filters Cleared",
      description: `Showing all ${allProviders.length} businesses`,
      duration: 3000,
    })
  }

  const filterOptions = [
    { id: "assistants1", label: "Personal Drivers", value: "Personal Drivers" },
    { id: "assistants2", label: "Personal Assistants", value: "Personal Assistants" },
    { id: "assistants3", label: "Companions", value: "Companions" },
    { id: "assistants4", label: "Personal Secretaries", value: "Personal Secretaries" },
    { id: "assistants5", label: "Personal Shoppers", value: "Personal Shoppers" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Remove the mock providers state and replace with real data fetching
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userZipCode, setUserZipCode] = useState<string | null>(null)

  // Add after existing state declarations:
  const fetchIdRef = useRef(0)

  // Enhanced Business interface
  interface Business {
    id: string
    name?: string
    displayName?: string
    displayPhone?: string
    displayCity?: string
    displayState?: string
    city?: string
    state?: string
    phone?: string
    rating?: number
    reviewCount?: number
    services?: string[]
    subcategories?: string[]
    allSubcategories?: string[]
    zipCode?: string
    serviceArea?: string[]
    adDesignData?: {
      businessInfo?: {
        phone?: string
        city?: string
        state?: string
      }
    }
  }

  // Helper function to check if business serves a zip code
  const businessServesZipCode = (business: Business, zipCode: string): boolean => {
    // If business has no service area defined, fall back to primary zip code
    if (!business.serviceArea || business.serviceArea.length === 0) {
      return business.zipCode === zipCode
    }

    // Check if business serves nationwide (indicated by having "nationwide" in service area)
    if (business.serviceArea.some((area) => area.toLowerCase().includes("nationwide"))) {
      return true
    }

    // Check if the zip code is in the business's service area
    return business.serviceArea.includes(zipCode)
  }

  // Replace the useEffect:
  useEffect(() => {
    async function fetchBusinesses() {
      const currentFetchId = ++fetchIdRef.current

      try {
        setLoading(true)
        setError(null)

        console.log(`[Personal Assistants] Starting fetch ${currentFetchId} at ${new Date().toISOString()}`)

        const businesses = await getBusinessesForCategoryPage("/personal-assistants")

        // Check if this is still the current request
        if (currentFetchId !== fetchIdRef.current) {
          console.log(
            `[Personal Assistants] Ignoring stale response ${currentFetchId}, current is ${fetchIdRef.current}`,
          )
          return
        }

        console.log(`[Personal Assistants] Fetch ${currentFetchId} completed, got ${businesses.length} businesses`)
        console.log("Sample business data:", businesses[0]) // Debug log

        // Filter by zip code if available
        let filteredBusinesses = businesses
        if (userZipCode) {
          console.log(`[Personal Assistants] Filtering by zip code: ${userZipCode}`)
          filteredBusinesses = businesses.filter((business: Business) => {
            const serves = businessServesZipCode(business, userZipCode)
            console.log(
              `[Personal Assistants] Business ${business.displayName || business.name} (${business.zipCode}) serves ${userZipCode}: ${serves}`,
              {
                serviceArea: business.serviceArea,
                primaryZip: business.zipCode,
              },
            )
            return serves
          })
          console.log(`[Personal Assistants] After filtering: ${filteredBusinesses.length} businesses`)
        }

        // Use businesses as-is without adding default subcategories
        setAllProviders(filteredBusinesses)
        setFilteredProviders(filteredBusinesses)
      } catch (err) {
        // Only update error if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          console.error(`[Personal Assistants] Error in fetch ${currentFetchId}:`, err)
          setError("Failed to load businesses")
        }
      } finally {
        // Only update loading if this is still the current request
        if (currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchBusinesses()
  }, [userZipCode])

  // Get user's zip code from localStorage
  useEffect(() => {
    const savedZipCode = localStorage.getItem("savedZipCode")
    if (savedZipCode) {
      setUserZipCode(savedZipCode)
    }
  }, [])

  const handleOpenReviewsOld = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Personal Assistants" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/assistant-YGJCy1KrgYFG9a6r1XgV5abefXkzCB.png"
            alt="Personal Assistants"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find reliable personal assistants and support professionals in your area. Browse services below or use
            filters to narrow your search.
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

      {/* Remove the CategoryFilter component that appears after the hero section: */}

      {/* Enhanced Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-wrap gap-4 mb-4">
          {filterOptions.map((option) => (
            <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                id={option.id}
                checked={selectedFilters.includes(option.value)}
                onChange={(e) => handleFilterChange(option.id, e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-sm font-medium text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={applyFilters} disabled={selectedFilters.length === 0} size="sm">
              Apply Filters ({selectedFilters.length})
            </Button>
            {appliedFilters.length > 0 && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            )}
          </div>
          {selectedFilters.length > 0 && (
            <span className="text-sm text-gray-600">
              {selectedFilters.length} filter{selectedFilters.length !== 1 ? "s" : ""} selected
            </span>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {appliedFilters.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700">
                <span className="font-medium">Active filters:</span> {appliedFilters.join(", ")}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Showing {filteredProviders.length} of {allProviders.length} businesses
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs">
              Clear
            </Button>
          </div>
        </div>
      )}

      {userZipCode && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Showing personal assistants for zip code:</span> {userZipCode}
              <span className="text-xs block mt-1">(Includes businesses with {userZipCode} in their service area)</span>
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("savedZipCode")
                setUserZipCode(null)
              }}
              className="text-xs"
            >
              Clear Filter
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading personal assistants...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {appliedFilters.length > 0
                ? "No Personal Assistants Match Your Filters"
                : userZipCode
                  ? `No Personal Assistants in ${userZipCode} Area`
                  : "No Personal Assistants Yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {appliedFilters.length > 0
                ? `No businesses found matching: ${appliedFilters.join(", ")}. Try adjusting your filters.`
                : userZipCode
                  ? `We're building our network of personal assistant services in the ${userZipCode} area.`
                  : "Be the first personal assistant service to join our platform and connect with clients in your area."}
            </p>
            {appliedFilters.length > 0 ? (
              <Button onClick={clearFilters} className="bg-indigo-600 hover:bg-indigo-700">
                Clear Filters
              </Button>
            ) : (
              <Button className="bg-indigo-600 hover:bg-indigo-700">Register Your Service</Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.displayName || provider.name}</h3>
                    <div className="flex items-center text-gray-600 text-sm mt-1">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>
                        {provider.adDesignData?.businessInfo?.city && provider.adDesignData?.businessInfo?.state
                          ? `${provider.adDesignData.businessInfo.city}, ${provider.adDesignData.businessInfo.state}`
                          : provider.displayCity && provider.displayState
                            ? `${provider.displayCity}, ${provider.displayState}`
                            : provider.city && provider.state
                              ? `${provider.city}, ${provider.state}`
                              : provider.zipCode
                                ? `ZIP: ${provider.zipCode}`
                                : "Location not specified"}
                      </span>
                    </div>

                    {/* Phone Number Display */}
                    {(provider.adDesignData?.businessInfo?.phone || provider.displayPhone || provider.phone) && (
                      <div className="flex items-center text-gray-600 text-sm mt-1">
                        <Phone className="w-4 h-4 mr-1" />
                        <span>
                          {formatPhoneNumber(
                            provider.adDesignData?.businessInfo?.phone || provider.displayPhone || provider.phone,
                          )}
                        </span>
                      </div>
                    )}

                    {provider.serviceArea && provider.serviceArea.length > 0 && (
                      <div className="flex items-center text-gray-600 text-xs mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                          {provider.serviceArea.some((area) => area.toLowerCase().includes("nationwide"))
                            ? "Serves nationwide"
                            : `Serves ${userZipCode} area`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(provider.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating || 0} ({provider.reviewCount || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {provider.allSubcategories && provider.allSubcategories.length > 0 ? (
                        provider.allSubcategories.map((service: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {service}
                          </span>
                        ))
                      ) : provider.subcategories && provider.subcategories.length > 0 ? (
                        provider.subcategories.map((service: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {service}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          Personal Services
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button
                      className="w-full md:w-auto"
                      onClick={() => handleOpenReviews(provider.displayName || provider.name)}
                    >
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleOpenProfile(provider)}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsOpen}
          onClose={() => setIsReviewsOpen(false)}
          providerName={selectedProvider || ""}
          reviews={selectedProvider ? mockReviews[selectedProvider] || [] : []}
        />
      )}

      {selectedBusinessProfile && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedBusinessProfile.id}
          businessName={selectedBusinessProfile.name}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
