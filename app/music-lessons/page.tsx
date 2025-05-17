"use client"

import { useState, useEffect } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2, X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function MusicLessonsPage() {
  const filterOptions = [
    { id: "music1", label: "Piano Lessons", value: "Piano Lessons" },
    { id: "music2", label: "Guitar Lessons", value: "Guitar Lessons" },
    { id: "music3", label: "Violin Lessons", value: "Violin Lessons" },
    { id: "music4", label: "Cello Lessons", value: "Cello Lessons" },
    { id: "music5", label: "Trumpet Lessons", value: "Trumpet Lessons" },
    { id: "music6", label: "Other Instrument Lessons", value: "Other Instrument Lessons" },
    { id: "music7", label: "Instrument Repair", value: "Instrument Repair" },
    { id: "music8", label: "Used and New Instruments for Sale", value: "Used and New Instruments for Sale" },
    { id: "music9", label: "Other Music", value: "Other Music" },
  ]

  // State for businesses
  const [providers, setProviders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number | string
    name: string
    reviews: any[]
  } | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [selectedBusinessName, setSelectedBusinessName] = useState<string | null>(null)

  // Fetch businesses only once when the component mounts
  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/businesses/by-category?category=music-lessons`)
        if (!response.ok) {
          throw new Error(`Error fetching businesses: ${response.status}`)
        }
        const data = await response.json()
        setProviders(data.businesses || [])
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses. Please try again later.")
        toast({
          title: "Error",
          description: "Failed to load businesses. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, []) // Only run once on mount

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider({
      id: provider.id || provider.businessId || "unknown",
      name: provider.name || provider.businessName || "Business",
      reviews: provider.reviewsData || provider.reviews || [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    if (!provider || (!provider.id && !provider.businessId)) {
      console.error("Cannot open profile: Missing business ID")
      toast({
        title: "Error",
        description: "Cannot open business profile due to missing information.",
        variant: "destructive",
      })
      return
    }

    const businessId = provider.id || provider.businessId
    const businessName = provider.name || provider.businessName || "Business"

    setSelectedBusinessId(businessId)
    setSelectedBusinessName(businessName)
    setIsProfileDialogOpen(true)
  }

  // Handle filter click directly in this component
  const handleFilterClick = (filterId: string) => {
    setSelectedFilters((prev) => {
      if (prev.includes(filterId)) {
        return prev.filter((id) => id !== filterId)
      } else {
        return [...prev, filterId]
      }
    })
  }

  const clearFilters = () => {
    setSelectedFilters([])
  }

  // Filter businesses based on selected filters
  const filteredProviders =
    selectedFilters.length === 0
      ? providers
      : providers.filter((business) => {
          return (
            business.allSubcategories &&
            business.allSubcategories.some((sub: string) =>
              selectedFilters.some((filterId) => {
                const option = filterOptions.find((opt) => opt.id === filterId)
                return option && sub.toLowerCase() === option.value.toLowerCase()
              }),
            )
          )
        })

  return (
    <CategoryLayout title="Music Lessons & Instrument Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/music%20lesson-VcAdpdYV65QHk4izPaeiVUsKQZwn9Q.png"
            alt="Music Lessons"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified music teachers and instrument services in your area. Browse options below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Verified and experienced music instructors</li>
              <li>Read reviews from other students</li>
              <li>Compare rates and availability</li>
              <li>Find lessons for all skill levels</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Inline filter component instead of using CategoryFilter */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Filter by Service</h2>
          {selectedFilters.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-sm text-gray-500">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
        <ScrollArea className="whitespace-nowrap pb-2 -mx-1 px-1">
          <div className="flex space-x-2">
            {filterOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedFilters.includes(option.id) ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterClick(option.id)}
                className="rounded-full"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-500">Loading music lesson providers...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-red-600 mb-2">Error</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      ) : filteredProviders.length > 0 ? (
        <div className="space-y-6">
          {filteredProviders.map((provider) => (
            <Card
              key={provider.id || provider.businessId}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {provider.name || provider.businessName || "Music Business"}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {provider.location || provider.address || "Location not specified"}
                    </p>

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(provider.rating || 0) ? "text-yellow-400" : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating || "0"} ({provider.reviews?.length || provider.reviewCount || "0"} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(
                          provider.services ||
                          provider.allSubcategories ||
                          provider.subcategories || ["Music Services"]
                        ).map((service: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button
                      className="w-full md:w-auto"
                      onClick={() => handleOpenReviews(provider)}
                      disabled={!provider.reviewsData && !provider.reviews}
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
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-900 mb-2">No music lesson providers found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later.</p>
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          reviews={selectedProvider.reviews || []}
        />
      )}

      {selectedBusinessId && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedBusinessId}
          businessName={selectedBusinessName || "Business"}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
