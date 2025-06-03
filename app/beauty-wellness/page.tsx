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
import { getBusinessesForCategoryPage } from "@/lib/business-category-service"

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(phoneNumberString: string) {
  if (!phoneNumberString) return "No phone provided"

  // Strip all non-numeric characters
  const cleaned = phoneNumberString.replace(/\D/g, "")

  // Check if the number is valid
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`
  }

  // If the format doesn't match, return the original
  return phoneNumberString
}

export default function BeautyWellnessPage() {
  const { toast } = useToast()
  const filterOptions = [
    { id: "beauty1", label: "Barbers", value: "Barbers" },
    {
      id: "beauty2",
      label: "Hairdressers, Hairstylists, and Cosmetologists",
      value: "Hairdressers, Hairstylists, and Cosmetologists",
    },
    { id: "beauty3", label: "Manicurists and Pedicurists", value: "Manicurists and Pedicurists" },
    { id: "beauty4", label: "Skincare Specialists", value: "Skincare Specialists" },
    { id: "beauty5", label: "Hair Removal", value: "Hair Removal" },
    { id: "beauty6", label: "Body Sculpting", value: "Body Sculpting" },
    { id: "beauty7", label: "Spas", value: "Spas" },
    { id: "beauty8", label: "Tanning", value: "Tanning" },
    { id: "beauty9", label: "Tattoo and Scar Removal Services", value: "Tattoo and Scar Removal Services" },
    { id: "beauty10", label: "Hair Wigs and Weaves", value: "Hair Wigs and Weaves" },
    { id: "beauty11", label: "Beauty Products", value: "Beauty Products" },
    {
      id: "beauty12",
      label: "Miscellaneous Personal Appearance Workers",
      value: "Miscellaneous Personal Appearance Workers",
    },
  ]

  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true)
      try {
        // Use the simplified business category service
        const result = await getBusinessesForCategoryPage("/beauty-wellness")
        setBusinesses(result)
      } catch (error) {
        console.error("Error fetching businesses:", error)
        toast({
          title: "Error loading businesses",
          description: "There was a problem loading businesses. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinesses()
  }, [toast])

  const filteredBusinesses = selectedFilter
    ? businesses.filter((business) => {
        if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
          return business.allSubcategories.some((sub: string) =>
            sub.toLowerCase().includes(selectedFilter.toLowerCase()),
          )
        }
        if (business.subcategory) {
          return business.subcategory.toLowerCase().includes(selectedFilter.toLowerCase())
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
    <CategoryLayout title="Beauty & Wellness Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/haircutting-qs8Z2Gv5npSVzpYZ19uRHdGRK94bFP.png"
            alt="Beauty and Wellness"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified beauty and wellness professionals in your area. Browse services below or use filters to
            narrow your search.
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
                        (business.city && business.state
                          ? `${business.city}, ${business.state}`
                          : business.city || business.state || business.zipCode)}
                    </p>
                    <p className="text-gray-600 text-sm mt-1 flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {formatPhoneNumber(business.adDesignData?.businessInfo?.phone || business.phone || "")}
                    </p>

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
                        {business.allSubcategories && business.allSubcategories.length > 0 ? (
                          business.allSubcategories.map((service: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {business.subcategory || "Beauty & Wellness"}
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
          <div className="bg-pink-50 border border-pink-200 rounded-lg p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-medium text-pink-800 mb-2">No Beauty & Wellness Providers Found</h3>
            <p className="text-pink-700 mb-4">
              We're building our network of beauty and wellness professionals in your area.
            </p>
            <div className="bg-white rounded border border-pink-100 p-4">
              <p className="text-gray-700 font-medium">Are you a beauty or wellness professional?</p>
              <p className="text-gray-600 mt-1">
                Join Hausbaum to showcase your services and connect with clients in your area.
              </p>
              <Button className="mt-3" asChild>
                <a href="/business-register">Register Your Beauty Business</a>
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
