"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, MapPin } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"

export default function WeddingsEventsPage() {
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    rating: number
    reviews: number
  } | null>(null)

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<{
    id: string
    name: string
  } | null>(null)

  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  const filterOptions = [
    { id: "weddings1", label: "Event Halls", value: "Event Halls" },
    { id: "weddings2", label: "Tent and Chair Rentals", value: "Tent and Chair Rentals" },
    { id: "weddings3", label: "Wedding Planners", value: "Wedding Planners" },
    { id: "weddings4", label: "Food Caterers", value: "Food Caterers" },
    { id: "weddings5", label: "Bartenders", value: "Bartenders" },
    { id: "weddings6", label: "Live Music Entertainment", value: "Live Music Entertainment" },
    { id: "weddings7", label: "DJs", value: "DJs" },
    { id: "weddings8", label: "Performers", value: "Performers" },
    { id: "weddings9", label: "Tuxedo Rentals", value: "Tuxedo Rentals" },
    { id: "weddings10", label: "Limousine Services", value: "Limousine Services" },
    { id: "weddings11", label: "Tailors and Seamstresses", value: "Tailors and Seamstresses" },
    { id: "weddings12", label: "Wedding Dresses", value: "Wedding Dresses" },
    { id: "weddings13", label: "Wedding Photographers", value: "Wedding Photographers" },
    { id: "weddings14", label: "Florists", value: "Florists" },
    { id: "weddings15", label: "Wedding Cakes", value: "Wedding Cakes" },
    { id: "weddings16", label: "Marriage Officiants", value: "Marriage Officiants" },
    { id: "weddings17", label: "Other Weddings and Special Events", value: "Other Weddings and Special Events" },
  ]

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true)
        const businesses = await getBusinessesForCategoryPage("/weddings-events")
        setProviders(businesses)
      } catch (error) {
        console.error("Error fetching wedding providers:", error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider({
      id: provider.id,
      name: provider.displayName || provider.businessName || "Wedding Professional",
      rating: provider.rating || 0,
      reviews: provider.reviewCount || 0,
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (provider: any) => {
    setSelectedBusiness({
      id: provider.id,
      name: provider.displayName || provider.businessName || "Wedding Professional",
    })
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Weddings and Special Events" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/bride-70qH10P5dCi9LToSGdSHJrq7uHD40e.png"
            alt="Weddings and Events"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified wedding and event professionals in your area. Browse services below or use filters to narrow
            your search.
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

      <CategoryFilter options={filterOptions} />

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading wedding and event providers...</p>
        </div>
      ) : providers.length === 0 ? (
        <div className="mt-8 p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Event Providers Found</h3>
          <p className="text-gray-600">Enter your zip code to find wedding and event professionals in your area.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {providers.map((provider: any) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {provider.displayName || provider.businessName || "Wedding Professional"}
                    </h3>

                    {provider.businessDescription && (
                      <p className="text-gray-600 text-sm mt-1">{provider.businessDescription}</p>
                    )}

                    <div className="mt-3 space-y-2">
                      {/* Location Display */}
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-primary" />
                        <span>{provider.displayLocation || "Location not specified"}</span>
                      </div>

                      {/* Phone Display */}
                      {provider.displayPhone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-primary" />
                          <a href={`tel:${provider.displayPhone}`} className="hover:text-primary transition-colors">
                            {provider.displayPhone}
                          </a>
                        </div>
                      )}
                    </div>

                    {provider.subcategories && provider.subcategories.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
                        <div className="flex flex-wrap gap-2">
                          {provider.subcategories.map((subcategory: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
                            >
                              {subcategory}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                    <Button className="min-w-[120px]" onClick={() => handleOpenReviews(provider)}>
                      Reviews
                    </Button>
                    <Button variant="outline" className="min-w-[120px]" onClick={() => handleViewProfile(provider)}>
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
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          businessId={selectedProvider.id.toString()}
          reviews={[]}
        />
      )}

      {selectedBusiness && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedBusiness.id}
          businessName={selectedBusiness.name}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
