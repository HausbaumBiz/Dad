"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useEffect } from "react"
import { getBusinessesForCategoryPage } from "@/app/actions/simplified-category-actions"
import { Phone } from "lucide-react"

export default function MedicalPractitionersPage() {
  const filterOptions = [
    { id: "medical1", label: "Chiropractors", value: "Chiropractors" },
    { id: "medical2", label: "Dentists", value: "Dentists" },
    { id: "medical3", label: "Orthodontists", value: "Orthodontists" },
    { id: "medical4", label: "Optometrists", value: "Optometrists" },
    { id: "medical5", label: "Podiatrists", value: "Podiatrists" },
    { id: "medical6", label: "Audiologists", value: "Audiologists" },
    { id: "medical7", label: "Dietitians and Nutritionists", value: "Dietitians and Nutritionists" },
    { id: "medical8", label: "Naturopaths", value: "Naturopaths" },
    { id: "medical9", label: "Herbalists", value: "Herbalists" },
    { id: "medical10", label: "Acupuncturist", value: "Acupuncturist" },
    { id: "medical11", label: "Orthotists and Prosthetists", value: "Orthotists and Prosthetists" },
    { id: "medical12", label: "Midwives and Doulas", value: "Midwives and Doulas" },
  ]

  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProviders() {
      try {
        setLoading(true)

        // Use the centralized system
        const result = await getBusinessesForCategoryPage("/medical-practitioners")

        if (result && result.length > 0) {
          // Transform the business data to match the expected provider format
          const transformedProviders = result.map((business) => ({
            id: business.id,
            name: business.displayName || business.businessName,
            location:
              business.displayLocation ||
              `${business.displayCity || ""}, ${business.displayState || ""}`.trim() ||
              `Zip: ${business.zipCode}`,
            rating: 4.5, // Default rating - you can enhance this later
            reviews: 12, // Default review count - you can enhance this later
            services: business.subcategories || ["General Practice"],
            // Get phone from ad design data if available, otherwise use registration phone
            phone: business.adDesignData?.businessInfo?.phone || business.phone || "No phone provided",
            address: business.address,
            adDesignData: business.adDesignData,
          }))

          console.log("Transformed providers with phone numbers:", transformedProviders)
          setProviders(transformedProviders)
        } else {
          setProviders([])
        }
      } catch (err) {
        console.error("Error fetching medical practitioners:", err)
        setError("Failed to load providers")
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // Handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider({
      ...provider,
      reviews: provider.reviews || [],
    })
    setIsReviewsDialogOpen(true)
  }

  // Handle opening profile dialog
  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "No phone provided"

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "")

    // Check if we have a 10-digit number
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }

    // Return original if not a standard format
    return phone
  }

  return (
    <CategoryLayout title="Medical Practitioners (non MD/DO)" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/dentists-Yk2J0P7JAsffashXwMR6wGx202Gf6v.png"
            alt="Medical Practitioners"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified healthcare professionals in your area. Browse practitioners below or use filters to narrow
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

      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading medical practitioners...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Practitioners Yet</h3>
              <p className="text-gray-600 mb-4">
                Be the first healthcare professional to join our platform and connect with patients in your area.
              </p>
              <Button className="bg-green-600 hover:bg-green-700">Register Your Practice</Button>
            </div>
          </div>
        ) : (
          providers.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

                    {/* Phone number display */}
                    <div className="flex items-center mt-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-1" />
                      <span>{formatPhoneNumber(provider.phone)}</span>
                    </div>

                    <div className="flex items-center mt-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(provider.rating) ? "text-yellow-400" : "text-gray-300"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {provider.rating} ({provider.reviews} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {provider.services.map((service, idx) => (
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
                    <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(provider)}>
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
          ))
        )}
      </div>

      {/* Reviews Dialog */}
      <ReviewsDialog
        isOpen={isReviewsDialogOpen}
        onClose={() => setIsReviewsDialogOpen(false)}
        providerName={selectedProvider?.name}
        reviews={selectedProvider?.reviews || []}
      />

      {/* Business Profile Dialog */}
      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
          businessName={selectedProvider.name}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
