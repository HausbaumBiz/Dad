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
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { getBusinessesByCategory } from "@/app/actions/business-actions"
import { Loader2 } from "lucide-react"

export default function ArtsEntertainmentPage() {
  const { toast } = useToast()
  const filterOptions = [
    {
      id: "arts1",
      label: "Fine Artists, Including Painters, Sculptors, and Illustrators",
      value: "Fine Artists, Including Painters, Sculptors, and Illustrators",
    },
    { id: "arts2", label: "Craft Artists", value: "Craft Artists" },
    { id: "arts3", label: "Musicians and Singers", value: "Musicians and Singers" },
    { id: "arts4", label: "Recording Studios", value: "Recording Studios" },
    { id: "arts5", label: "Art Galleries", value: "Art Galleries" },
    { id: "arts6", label: "Concert Venues", value: "Concert Venues" },
    { id: "arts7", label: "Fashion Designers", value: "Fashion Designers" },
    { id: "arts8", label: "Interior Designers", value: "Interior Designers" },
    { id: "arts9", label: "Photographers and Videographers", value: "Photographers and Videographers" },
    { id: "arts10", label: "Floral Designers", value: "Floral Designers" },
    { id: "arts11", label: "Graphic Designers", value: "Graphic Designers" },
    { id: "arts12", label: "All Entertainers and Talent", value: "All Entertainers and Talent" },
    { id: "arts13", label: "Talent Agent", value: "Talent Agent" },
    { id: "arts14", label: "Models", value: "Models" },
  ]

  // Add state variables for tracking the selected provider and dialog open state
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Fetch businesses in this category
  useEffect(() => {
    async function fetchBusinesses() {
      setIsLoading(true)
      try {
        // Try multiple category formats to ensure we find all relevant businesses
        const categoryFormats = [
          "artDesignEntertainment",
          "Art, Design and Entertainment",
          "arts-entertainment",
          "Arts & Entertainment",
          "art-design-entertainment",
          "art-design-and-entertainment",
          "arts-&-entertainment",
        ]

        let allBusinesses: any[] = []
        const debugResults: Record<string, any> = {}

        // Fetch businesses for each category format
        for (const format of categoryFormats) {
          console.log(`Fetching businesses for category format: ${format}`)
          try {
            const result = await getBusinessesByCategory(format)
            debugResults[format] = {
              count: result?.length || 0,
              businesses: result?.map((b) => ({ id: b.id, name: b.businessName })) || [],
            }

            if (result && result.length > 0) {
              console.log(`Found ${result.length} businesses for format: ${format}`)
              allBusinesses = [...allBusinesses, ...result]
            }
          } catch (error) {
            console.error(`Error fetching businesses for format ${format}:`, error)
            debugResults[format] = { error: error.message }
          }
        }

        // Also try to fetch businesses directly from the Redis set
        try {
          const directResult = await fetch("/api/debug/arts-businesses")
          const directData = await directResult.json()
          debugResults["direct_redis"] = directData

          if (directData.businesses && directData.businesses.length > 0) {
            allBusinesses = [...allBusinesses, ...directData.businesses]
          }
        } catch (error) {
          console.error("Error fetching businesses directly:", error)
          debugResults["direct_redis"] = { error: error.message }
        }

        // Remove duplicates by ID
        const uniqueBusinesses = allBusinesses.filter(
          (business, index, self) => index === self.findIndex((b) => b.id === business.id),
        )

        setDebugInfo({
          categoryFormats,
          results: debugResults,
          totalFound: allBusinesses.length,
          uniqueCount: uniqueBusinesses.length,
        })

        if (uniqueBusinesses.length === 0) {
          toast({
            title: "No businesses found",
            description:
              "We couldn't find any businesses in the Arts & Entertainment category. This might be a technical issue.",
            variant: "destructive",
          })
        }

        setBusinesses(uniqueBusinesses)
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

  // Filter businesses based on selected subcategory
  const filteredBusinesses = selectedFilter
    ? businesses.filter((business) => {
        // Check if business has categories with the selected subcategory
        if (business.allSubcategories && Array.isArray(business.allSubcategories)) {
          return business.allSubcategories.some((sub: string) =>
            sub.toLowerCase().includes(selectedFilter.toLowerCase()),
          )
        }
        // Also check the subcategory field
        if (business.subcategory) {
          return business.subcategory.toLowerCase().includes(selectedFilter.toLowerCase())
        }
        return false
      })
    : businesses

  // Add mock reviews data specific to arts and entertainment services
  const mockReviews = [
    {
      id: 1,
      providerName: "Creative Visions Studio",
      reviews: [
        {
          id: 101,
          username: "ArtLover42",
          rating: 5,
          date: "2023-11-15",
          comment:
            "Absolutely stunning photography work! They captured our family portraits with such creativity and attention to detail. The graphic design work they did for our business cards was equally impressive.",
        },
        {
          id: 102,
          username: "DesignEnthusiast",
          rating: 5,
          date: "2023-10-22",
          comment:
            "Professional, creative, and a pleasure to work with. Their photography perfectly captured the essence of our event, and the edited photos were delivered ahead of schedule.",
        },
        {
          id: 103,
          username: "MarketingPro",
          rating: 4,
          date: "2023-09-18",
          comment:
            "Great graphic design work for our company rebrand. They really understood our vision and translated it beautifully into our new logo and marketing materials.",
        },
      ],
    },
    {
      id: 2,
      providerName: "Harmony Music Productions",
      reviews: [
        {
          id: 201,
          username: "MusicFan88",
          rating: 5,
          date: "2023-11-10",
          comment:
            "The musicians they provided for our wedding were exceptional! They learned our special request songs and performed them beautifully. The recording studio is also top-notch.",
        },
        {
          id: 202,
          username: "BandMember23",
          rating: 4,
          date: "2023-10-05",
          comment:
            "Great recording studio with professional sound engineers. They helped us get the perfect sound for our EP. The equipment is high quality and the space is comfortable.",
        },
        {
          id: 203,
          username: "EventPlanner",
          rating: 5,
          date: "2023-09-12",
          comment:
            "Hired their musicians for a corporate event and they were fantastic! Very professional, on time, and their performance created the perfect atmosphere.",
        },
      ],
    },
    {
      id: 3,
      providerName: "Modern Space Interiors",
      reviews: [
        {
          id: 301,
          username: "HomeOwner2023",
          rating: 5,
          date: "2023-11-20",
          comment:
            "Transformed our living space completely! Their interior design vision was exactly what we needed. They worked within our budget and the results exceeded our expectations.",
        },
        {
          id: 302,
          username: "BusinessOwner",
          rating: 4,
          date: "2023-10-15",
          comment:
            "Hired them to redesign our office space and they did a fantastic job. The space is now both functional and beautiful. Our clients always comment on how nice it looks.",
        },
        {
          id: 303,
          username: "RenovationQueen",
          rating: 5,
          date: "2023-09-05",
          comment:
            "Amazing attention to detail and they really listen to what you want. They helped me select the perfect colors, furniture, and accessories for my home renovation.",
        },
      ],
    },
  ]

  // Add a handler function for opening the reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  // Add a handler function for opening the profile dialog
  const handleOpenProfile = (provider: any) => {
    setSelectedProvider(provider)
    setIsProfileDialogOpen(true)
  }

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value === selectedFilter ? null : value)
  }

  return (
    <CategoryLayout title="Arts & Entertainment" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/clown-xZLibLvsgZ7U7sWOXy9eokr8IyyUZy.png"
            alt="Arts and Entertainment"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find creative professionals and entertainment services in your area. Browse options below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Talented and experienced creative professionals</li>
              <li>Read reviews from other clients</li>
              <li>Compare portfolios and services</li>
              <li>Find the perfect match for your creative needs</li>
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
                    <h3 className="text-xl font-semibold">{business.businessName}</h3>
                    <p className="text-gray-600 text-sm mt-1">{business.city || business.zipCode}</p>

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
                        {business.rating || 4.5} ({business.reviews || 12} reviews)
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
                            {business.subcategory || "Arts & Entertainment"}
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
          <p className="text-gray-500">No businesses found in this category. Check back later!</p>

          {/* Debug information - only visible in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 p-4 border border-gray-300 rounded text-left bg-gray-50">
              <h3 className="font-bold mb-2">Debug Information:</h3>
              <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.businessName || selectedProvider.name}
          businessId={selectedProvider.id}
          reviews={mockReviews.find((p) => p.providerName === selectedProvider.businessName)?.reviews || []}
        />
      )}

      {selectedProvider && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          businessId={selectedProvider.id}
        />
      )}

      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />

      <Toaster />
    </CategoryLayout>
  )
}
