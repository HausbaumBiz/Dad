"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { getBusinessesBySelectedCategories } from "@/app/actions/business-category-fetcher"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { Phone } from "lucide-react"

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

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    reviews: any[]
  } | null>(null)

  // State for providers - will be fetched from database
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch real music lesson providers from database
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true)
        console.log("Fetching music lesson businesses...")

        const businesses = await getBusinessesBySelectedCategories("/music-lessons")
        console.log("Fetched music lesson businesses:", businesses)

        setProviders(businesses)
      } catch (error) {
        console.error("Error fetching music lesson providers:", error)
        setProviders([])
      } finally {
        setLoading(false)
      }
    }

    fetchProviders()
  }, [])

  // Add helper functions after the useEffect:
  const getPhoneNumber = (business: any) => {
    return business?.phone || business?.adDesign?.businessInfo?.phone || ""
  }

  const getLocation = (business: any) => {
    const address = business?.address || business?.adDesign?.businessInfo?.streetAddress || ""
    const city = business?.city || business?.adDesign?.businessInfo?.city || ""
    const state = business?.state || business?.adDesign?.businessInfo?.state || ""

    const parts = []
    if (address) parts.push(address)
    if (city && state) {
      parts.push(`${city}, ${state}`)
    } else if (city) {
      parts.push(city)
    } else if (state) {
      parts.push(state)
    }

    return parts.join(", ")
  }

  const getSubcategories = (business: any) => {
    if (business?.subcategories && business.subcategories.length > 0) {
      return business.subcategories
    }
    if (business?.services && business.services.length > 0) {
      return business.services
    }
    if (business?.category) {
      return [business.category]
    }
    return []
  }

  // Add state for business profile dialog:
  const [isBusinessProfileOpen, setIsBusinessProfileOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>("")
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")

  // Update the handleViewProfile function:
  const handleViewProfile = (business: any) => {
    console.log("Opening profile for business:", business)
    setSelectedBusinessId(business.id)
    setSelectedBusinessName(business.businessName || "Music Instructor")
    setIsBusinessProfileOpen(true)
  }

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleViewReviews = (business: any) => {
    setSelectedProvider({
      id: business.id,
      name: business.businessName || "Music Instructor",
      reviews: [],
    })
    setIsReviewsDialogOpen(true)
  }

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
            <p className="text-gray-600">Loading music lesson providers...</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Music Lesson Providers Found</h3>
            <p className="text-gray-600 mb-4">
              We're currently building our network of music instructors in your area.
            </p>
            <p className="text-sm text-gray-500">
              Are you a music instructor?{" "}
              <a href="/business-register" className="text-primary hover:underline">
                Register your business
              </a>{" "}
              to be featured here.
            </p>
          </div>
        ) : (
          <>
            {providers.length > 0 && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Found {providers.length} Music Lesson Provider{providers.length !== 1 ? "s" : ""}
                </h2>
              </div>
            )}

            {providers.map((business: any) => {
              const phone = getPhoneNumber(business)
              const location = getLocation(business)
              const subcategories = getSubcategories(business)

              return (
                <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {business.businessName || "Music Instructor"}
                        </h3>

                        {business.description && <p className="text-gray-600 text-sm mt-1">{business.description}</p>}

                        <div className="mt-3 space-y-2">
                          {phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2 text-primary" />
                              <a href={`tel:${phone}`} className="hover:text-primary transition-colors">
                                {phone}
                              </a>
                            </div>
                          )}

                          {location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <span className="text-primary mr-2">📍</span>
                              <span>{location}</span>
                            </div>
                          )}
                        </div>

                        {subcategories.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Specialties:</p>
                            <div className="flex flex-wrap gap-2">
                              {subcategories.map((subcategory: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {subcategory}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 md:mt-0 md:ml-6 flex flex-col space-y-2">
                        <Button className="min-w-[120px]" onClick={() => handleViewReviews(business)}>
                          Reviews
                        </Button>
                        <Button variant="outline" className="min-w-[120px]" onClick={() => handleViewProfile(business)}>
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </>
        )}
      </div>

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name || ""}
          businessId={selectedProvider.id?.toString() || ""}
          reviews={[]}
        />
      )}

      {selectedBusinessId && (
        <BusinessProfileDialog
          businessId={selectedBusinessId}
          businessName={selectedBusinessName}
          isOpen={isBusinessProfileOpen}
          onClose={() => setIsBusinessProfileOpen(false)}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
