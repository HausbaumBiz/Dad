"use client"

import { useState, useEffect } from "react"
import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Loader2, Phone } from "lucide-react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { useUserZipCode } from "@/hooks/use-user-zipcode"
import { ZipCodeFilterIndicator } from "@/components/zip-code-filter-indicator"

export default function FitnessAthleticsPage() {
  const { toast } = useToast()
  const { zipCode } = useUserZipCode()

  // Add phone number formatting function
  const formatPhoneNumber = (phone: string | null | undefined): string => {
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

  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchBusinesses() {
      // Skip fetch if no zip code is set
      if (!zipCode) {
        console.log("No zipCode set, skipping fetch")
        return
      }

      console.log(`Fetching fitness-athletics businesses for zipCode: ${zipCode}`)
      setIsLoading(true)

      try {
        const result = await getBusinessesForCategoryPage("/fitness-athletics", zipCode)

        // Check if request was aborted
        if (controller.signal.aborted) {
          console.log("Request was aborted")
          return
        }

        console.log(`Found ${result.length} fitness-athletics businesses for zipCode: ${zipCode}`)
        setBusinesses(result)
      } catch (error) {
        if (controller.signal.aborted) {
          console.log("Request was aborted during error handling")
          return
        }

        console.error("Error fetching businesses:", error)
        toast({
          title: "Error loading businesses",
          description: "There was a problem loading businesses. Please try again later.",
          variant: "destructive",
        })
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchBusinesses()

    // Cleanup function to abort the request if component unmounts or zipCode changes
    return () => {
      controller.abort()
    }
  }, [zipCode, toast])

  const filteredBusinesses = selectedFilter
    ? businesses.filter((business) => {
        if (business.subcategories && Array.isArray(business.subcategories)) {
          return business.subcategories.some((sub: string) => sub.toLowerCase().includes(selectedFilter.toLowerCase()))
        }
        return false
      })
    : businesses

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value === selectedFilter ? null : value)
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
              <li>Read reviews from other customers</li>
              <li>View business videos showcasing work and staff</li>
              <li>Access exclusive coupons directly on each business listing</li>
              <li>Discover job openings from businesses you'd trust to hire yourself</li>
            </ul>
          </div>
        </div>
      </div>

      <ZipCodeFilterIndicator />

      <CategoryFilter options={filterOptions} selectedValue={selectedFilter} onChange={handleFilterChange} />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading businesses...</p>
        </div>
      ) : filteredBusinesses.length > 0 ? (
        <div className="space-y-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{business.displayName || business.businessName}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {business.displayLocation ||
                        (business.displayCity && business.displayState
                          ? `${business.displayCity}, ${business.displayState}`
                          : business.city && business.state
                            ? `${business.city}, ${business.state}`
                            : business.displayCity ||
                              business.city ||
                              business.displayState ||
                              business.state ||
                              `Zip: ${business.zipCode}`)}
                    </p>

                    {/* Add phone number display */}
                    {(business.displayPhone || business.phone) && (
                      <div className="flex items-center mt-1">
                        <Phone className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-gray-600 text-sm">
                          {formatPhoneNumber(business.displayPhone || business.phone)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(business.rating || 4.5) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {business.rating || 4.5} ({business.reviews || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {business.subcategories && business.subcategories.length > 0 ? (
                          business.subcategories.map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Fitness & Athletics
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(business)}>
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
        <div className="text-center py-12">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-orange-800 mb-2">No Fitness & Athletics Providers Found</h3>
            <p className="text-orange-700 mb-4">
              We're building our network of certified fitness professionals and athletic instructors in your area.
            </p>
            <div className="bg-white rounded border border-orange-100 p-4">
              <p className="text-gray-700 font-medium">Are you a fitness professional or athletic instructor?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to connect with clients who need your fitness expertise and training services.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Fitness Business</a>
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.displayName || selectedProvider.businessName || selectedProvider.name}
          businessId={selectedProvider.id}
          reviews={[]}
        />
      )}

      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
