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

export default function FitnessAthleticsPage() {
  const filterOptions = [
    { id: "athletics1", label: "Baseball/Softball", value: "Baseball/Softball" },
    { id: "athletics2", label: "Golf", value: "Golf" },
    { id: "athletics3", label: "Tennis", value: "Tennis" },
    { id: "athletics4", label: "Basketball", value: "Basketball" },
    { id: "athletics5", label: "Football", value: "Football" },
    { id: "athletics6", label: "Soccer", value: "Soccer" },
    { id: "athletics7", label: "Ice Skating", value: "Ice Skating" },
    { id: "athletics8", label: "Gymnastics", value: "Gymnastics" },
    { id: "athletics9", label: "Pickleball", value: "Pickleball" },
    { id: "athletics10", label: "Table Tennis", value: "Table Tennis" },
    { id: "athletics11", label: "Dance", value: "Dance" },
    { id: "athletics12", label: "Personal Trainers", value: "Personal Trainers" },
    { id: "athletics13", label: "Group Fitness Classes", value: "Group Fitness Classes" },
    { id: "athletics14", label: "Other Athletics & Fitness", value: "Other Athletics & Fitness" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: string | number
    name: string
    reviews: any[]
  } | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")

  // State for businesses
  const [businesses, setBusinesses] = useState<any[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Fetch businesses on component mount
  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/businesses/by-category?category=fitness-athletics`)
        if (!response.ok) {
          throw new Error(`Failed to fetch businesses: ${response.status}`)
        }
        const data = await response.json()
        console.log("Fetched fitness-athletics businesses:", data.businesses)
        setBusinesses(data.businesses || [])
        setFilteredBusinesses(data.businesses || [])
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load businesses. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  // Handle filter changes
  const handleFilterChange = (selectedFilters: string[]) => {
    setActiveFilters(selectedFilters)

    if (selectedFilters.length === 0) {
      setFilteredBusinesses(businesses)
      return
    }

    const filtered = businesses.filter((business) => {
      // Check if business has any of the selected subcategories
      return selectedFilters.some((filter) => {
        const subcategory = filterOptions.find((option) => option.id === filter)?.value
        return (
          business.allSubcategories?.includes(subcategory) ||
          business.subcategories?.includes(subcategory) ||
          business.services?.includes(subcategory)
        )
      })
    })

    setFilteredBusinesses(filtered)
  }

  const handleOpenReviews = (provider: any) => {
    console.log("Opening reviews for provider:", provider)
    setSelectedProvider({
      id: provider.id,
      name: provider.name || provider.businessName || "Business",
      reviews: provider.reviews || [],
    })
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (business: any) => {
    console.log("Opening profile for business:", business)

    if (!business || !business.id) {
      console.error("Cannot open profile: Business ID is missing")
      toast({
        title: "Error",
        description: "Could not open business profile. Business ID is missing.",
        variant: "destructive",
      })
      return
    }

    // Set the business ID and name for the dialog
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.name || business.businessName || "Business")

    // Open the dialog
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Athletics, Fitness & Dance Instruction" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/baseball-WpgfS7MciTxGMJwNZTzlAFewS1DPX0.png"
            alt="Athletics and Fitness"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified coaches, trainers, and fitness professionals in your area. Browse options below or use
            filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Certified and experienced fitness professionals</li>
              <li>Read reviews from other clients</li>
              <li>Compare rates and availability</li>
              <li>Find options for all skill and fitness levels</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} onChange={handleFilterChange} activeFilters={activeFilters} />

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading fitness and athletics providers...</span>
        </div>
      ) : error ? (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {business.name || business.businessName || "Fitness Business"}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {business.location || (business.city && business.state)
                        ? `${business.city}, ${business.state}`
                        : "Location not specified"}
                    </p>

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(business.rating || 0) ? "text-yellow-400" : "text-gray-300"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {business.rating || "No rating"} ({business.reviews?.length || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(business.services || business.allSubcategories || [])
                          .slice(0, 3)
                          .map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {service}
                            </span>
                          ))}
                        {(business.services || business.allSubcategories || []).length > 3 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{(business.services || business.allSubcategories || []).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button
                      className="w-full md:w-auto"
                      onClick={() => handleOpenReviews(business)}
                      disabled={!business.reviews || business.reviews.length === 0}
                    >
                      Reviews
                    </Button>
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={() => handleOpenProfile(business)}
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
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No fitness or athletics providers listed yet</h3>
          <p className="text-gray-500">
            {activeFilters.length > 0
              ? "No providers match your selected filters. Try adjusting your filters or check back later."
              : "Check back soon for fitness trainers, coaches, and athletic programs in your area."}
          </p>
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

      {/* BusinessProfileDialog with correct props */}
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
