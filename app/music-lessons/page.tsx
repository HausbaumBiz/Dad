"use client"

import type React from "react"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useEffect, useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"

// Define the business type
interface Business {
  id: string
  businessName: string
  firstName?: string
  lastName?: string
  email?: string
  zipCode?: string
  category?: string
  description?: string
  services?: string[]
  rating?: number
  reviewCount?: number
  location?: string
  reviews?: any[]
}

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
  const [selectedProvider, setSelectedProvider] = useState<Business | null>(null)

  // State for business profile dialog
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProfileBusiness, setSelectedProfileBusiness] = useState<Business | null>(null)

  // State for businesses
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch businesses from the API
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setLoading(true)
        // Fetch businesses for the music-lessons page
        const response = await fetch("/api/businesses/by-page?page=music-lessons")

        if (!response.ok) {
          throw new Error(`Failed to fetch businesses: ${response.status}`)
        }

        const data = await response.json()

        // Process the businesses data
        const processedBusinesses = data.businesses.map((business: Business) => ({
          ...business,
          // Add default values for missing fields
          rating: business.rating || 4.5,
          reviewCount: business.reviewCount || Math.floor(Math.random() * 50) + 5,
          location: business.location || (business.zipCode ? `${business.zipCode}` : "Location not specified"),
          services: business.services || [business.category || "Music Lessons"],
        }))

        setBusinesses(processedBusinesses)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError(err instanceof Error ? err.message : "Failed to load businesses")
        // Show error toast
        toast({
          title: "Error loading businesses",
          description: "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [toast])

  const handleOpenReviews = (provider: Business) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  const handleOpenProfile = (provider: Business, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Special handling for the problematic business
    if (provider.id === "1744c078-461b-45bc-903e-e0999ac2aa87") {
      console.log("Opening profile dialog for business 1744c078-461b-45bc-903e-e0999ac2aa87")

      // Show a toast to confirm the action
      toast({
        title: "Opening business profile",
        description: `Loading profile for ${provider.businessName}...`,
        duration: 3000,
      })
    }

    setSelectedProfileBusiness(provider)
    setIsProfileDialogOpen(true)
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
              <li>Verified and experienced music instructors</li>
              <li>Read reviews from other students</li>
              <li>Compare rates and availability</li>
              <li>Find lessons for all skill levels</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      <div className="space-y-6">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div className="w-full">
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-32 mb-3" />
                    <Skeleton className="h-4 w-24 mb-4" />
                    <div className="mt-3">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-32 rounded-full" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Skeleton className="h-10 w-24 mb-2" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          // Error state
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <p className="text-gray-600">Please try again later or contact support if the problem persists.</p>
          </div>
        ) : businesses.length === 0 ? (
          // Empty state
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Music Lesson Providers Found</h3>
            <p className="text-gray-600 mb-4">There are currently no music lesson providers listed in this category.</p>
            <p className="text-gray-600">
              Are you a music teacher or instrument service provider?
              <Link href="/business-register" className="text-primary font-medium ml-1">
                Register your business
              </Link>
            </p>
          </div>
        ) : (
          // Businesses list
          businesses.map((provider) => (
            <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{provider.businessName}</h3>
                    <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

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
                        {provider.rating} ({provider.reviewCount} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Services:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {provider.services &&
                          provider.services.map((service, idx) => (
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
                    {/* IMPORTANT: Removed Link component and using only Button with onClick */}
                    <Button
                      variant="outline"
                      className="mt-2 w-full md:w-auto"
                      onClick={(e) => handleOpenProfile(provider, e)}
                      data-business-id={provider.id}
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
      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.businessName}
          reviews={selectedProvider.reviews || []}
        />
      )}

      {/* Business Profile Dialog */}
      {selectedProfileBusiness && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProfileBusiness.id}
          businessName={selectedProfileBusiness.businessName}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
