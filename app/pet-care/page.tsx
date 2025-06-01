"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Star } from "lucide-react"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"

export default function PetCarePage() {
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    rating: number
    reviews: number
  } | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")

  const filterOptions = [
    { id: "pet1", label: "Veterinarians", value: "Veterinarians" },
    { id: "pet2", label: "Pet Hospitals", value: "Pet Hospitals" },
    { id: "pet3", label: "Dog Fencing/Invisible Fence", value: "Dog Fencing/Invisible Fence" },
    { id: "pet4", label: "Pet Groomers", value: "Pet Groomers" },
    { id: "pet5", label: "Pet Trainers", value: "Pet Trainers" },
    { id: "pet6", label: "Pet Walkers", value: "Pet Walkers" },
    { id: "pet7", label: "Pet Sitters", value: "Pet Sitters" },
    { id: "pet8", label: "Pet Boarders", value: "Pet Boarders" },
    { id: "pet9", label: "Pet Breeders", value: "Pet Breeders" },
    { id: "pet10", label: "Pet Shops", value: "Pet Shops" },
    { id: "pet11", label: "Pet Rescues", value: "Pet Rescues" },
    { id: "pet12", label: "Aquariums/Pet Enclosures", value: "Aquariums/Pet Enclosures" },
    { id: "pet13", label: "Pet Poop Pickup", value: "Pet Poop Pickup" },
    { id: "pet14", label: "Other Pet Care", value: "Other Pet Care" },
  ]

  useEffect(() => {
    async function loadBusinesses() {
      try {
        setLoading(true)
        const fetchedBusinesses = await getBusinessesForCategoryPage("/pet-care")
        console.log("Fetched pet care businesses:", fetchedBusinesses)
        setBusinesses(fetchedBusinesses)
      } catch (error) {
        console.error("Error loading pet care businesses:", error)
      } finally {
        setLoading(false)
      }
    }

    loadBusinesses()
  }, [])

  const handleViewReviews = (business: any) => {
    setSelectedProvider({
      id: Number.parseInt(business.id || "0"),
      name: business.displayName || business.businessName || "Pet Care Provider",
      rating: business.rating || 0,
      reviews: business.reviewCount || 0,
    })
    setIsReviewsDialogOpen(true)
  }

  const handleViewProfile = (business: any) => {
    console.log("Opening profile for business:", business.id, business.businessName)
    setSelectedBusinessId(business.id || "")
    setSelectedBusinessName(business.displayName || business.businessName || "Pet Care Provider")
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Pet Care Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/cat%20and%20dog-7hvR8Ytt6JBV7PFG8N6uigZg80K6xP.png"
            alt="Pet Care Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified pet care professionals in your area. Browse services below or use filters to narrow your
            search.
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
        <div className="mt-8 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pet care providers...</p>
        </div>
      ) : businesses.length > 0 ? (
        <div className="mt-8 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Pet Care Providers ({businesses.length})</h2>
          <div className="grid gap-6">
            {businesses.map((business: any) => (
              <div key={business.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex flex-col space-y-4">
                  {/* Business Name and Description */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {business.displayName || business.businessName || "Pet Care Provider"}
                    </h3>
                    {business.businessDescription && (
                      <p className="text-gray-600 text-sm leading-relaxed">{business.businessDescription}</p>
                    )}
                  </div>

                  {/* Contact and Location Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                      {/* Phone */}
                      {business.displayPhone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <a
                            href={`tel:${business.displayPhone}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {business.displayPhone}
                          </a>
                        </div>
                      )}

                      {/* Location */}
                      {business.displayLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700 text-sm">{business.displayLocation}</span>
                        </div>
                      )}

                      {/* Rating */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (business.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {business.rating?.toFixed(1) || "0.0"} ({business.reviewCount || 0} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReviews(business)}
                        className="text-sm"
                      >
                        Reviews
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleViewProfile(business)}
                        className="text-sm"
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>

                  {/* Subcategories/Specialties */}
                  {business.subcategories && business.subcategories.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Specialties:</h4>
                      <div className="flex flex-wrap gap-2">
                        {business.subcategories.map((subcategory: string, index: number) => (
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
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Pet Care Providers Found</h3>
          <p className="text-gray-600">Enter your zip code to find pet care providers in your area.</p>
        </div>
      )}

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name || ""}
        businessId={selectedProvider?.id.toString() || ""}
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
