"use client"

import { useState, useEffect } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2 } from "lucide-react"

export default function EducationTutoringPage() {
  const filterOptions = [
    { id: "language1", label: "Spanish", value: "Spanish" },
    { id: "language2", label: "French", value: "French" },
    { id: "language3", label: "Chinese", value: "Chinese" },
    { id: "language4", label: "American Sign Language", value: "American Sign Language" },
    { id: "language5", label: "English as a Second Language", value: "English as a Second Language" },
    { id: "language6", label: "Other Language", value: "Other Language" },
    { id: "language7", label: "Math - Elementary", value: "Math - Elementary" },
    { id: "language8", label: "Math - High School", value: "Math - High School" },
    { id: "language9", label: "Reading Tutors (Adult and Children)", value: "Reading Tutors (Adult and Children)" },
    { id: "language10", label: "Test Prep", value: "Test Prep" },
    { id: "language11", label: "Other Subjects", value: "Other Subjects" },
  ]

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
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")

  // State for businesses
  const [providers, setProviders] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Fetch businesses on component mount
  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/businesses/by-category?category=education-tutoring`)
        if (!response.ok) {
          throw new Error(`Failed to fetch businesses: ${response.status}`)
        }
        const data = await response.json()
        console.log("Fetched education-tutoring businesses:", data)
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
  }, [])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (business: any) => {
    console.log("Opening profile for business:", business)
    if (!business || !business.id) {
      console.error("Cannot open profile: Missing business ID")
      toast({
        title: "Error",
        description: "Cannot open business profile. Missing business ID.",
        variant: "destructive",
      })
      return
    }

    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.name || business.businessName || "Business")
    setIsProfileDialogOpen(true)
  }

  const handleFilterChange = (values: string[]) => {
    setActiveFilters(values)
  }

  // Filter businesses based on active filters
  const filteredProviders =
    activeFilters.length > 0
      ? providers.filter((provider) => {
          // Check if provider has any of the selected services/subcategories
          return (
            provider.allSubcategories?.some((sub: string) =>
              activeFilters.some((filter) => sub.toLowerCase() === filter.toLowerCase()),
            ) ||
            // Also check services array if it exists
            provider.services?.some((service: string) =>
              activeFilters.some((filter) => service.toLowerCase() === filter.toLowerCase()),
            )
          )
        })
      : providers

  return (
    <CategoryLayout title="Language Lessons & School Subject Tutoring" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/tutor-oUQE3gdqYse3GcFicrOH9B9CAeaRVb.png"
            alt="Education and Tutoring"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified tutors and language instructors in your area. Browse options below or use filters to narrow
            your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Experienced and qualified educators</li>
              <li>Read reviews from other students</li>
              <li>Compare rates and teaching styles</li>
              <li>Find tutors for all ages and skill levels</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} onFilterChange={handleFilterChange} activeFilters={activeFilters} />

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading education and tutoring providers...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-red-600 mb-2">Error loading providers</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      ) : filteredProviders.length > 0 ? (
        <div className="space-y-6">
          {filteredProviders.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {provider.name || provider.businessName || "Education Provider"}
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
                        {provider.rating || "No rating"} ({provider.reviews || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(provider.services || provider.allSubcategories || []).map((service: string, idx: number) => (
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
                      disabled={!provider.reviewsData || provider.reviewsData.length === 0}
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
          <h3 className="text-xl font-medium text-gray-900 mb-2">No education or tutoring providers found</h3>
          <p className="text-gray-500">
            {activeFilters.length > 0
              ? "Try adjusting your filters to see more results."
              : "Check back soon or be the first to list your services!"}
          </p>
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name || selectedProvider.businessName || "Provider"}
          reviews={selectedProvider.reviewsData || []}
        />
      )}

      {selectedBusinessId && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedBusinessId}
          businessName={selectedBusinessName}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
