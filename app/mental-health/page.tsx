"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useToast } from "@/components/ui/use-toast"

export default function MentalHealthPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  const filterOptions = [
    { id: "counselors1", label: "Counselors", value: "Counselors" },
    {
      id: "counselors2",
      label: "Clinical and Counseling Psychologists",
      value: "Clinical and Counseling Psychologists",
    },
    { id: "counselors3", label: "Addiction Specialists", value: "Addiction Specialists" },
    { id: "counselors4", label: "Suboxone/Methadone Clinics", value: "Suboxone/Methadone Clinics" },
    { id: "counselors5", label: "Team Building", value: "Team Building" },
    {
      id: "counselors6",
      label: "Industrial-Organizational Psychologists",
      value: "Industrial-Organizational Psychologists",
    },
    { id: "counselors7", label: "Motivational Speakers", value: "Motivational Speakers" },
  ]

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/businesses/by-page?page=mental-health&timestamp=${Date.now()}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch businesses: ${response.status}`)
        }

        const data = await response.json()
        setBusinesses(data.businesses || [])
        setError(null)
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
  }, [toast])

  const handleOpenProfile = (business: any) => {
    setSelectedBusiness(business)
    setIsProfileDialogOpen(true)
  }

  return (
    <CategoryLayout title="Counselors, Psychologists & Addiction Specialists" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/couseling-4fgTKlpfTgyIe4nhlAyiC5v7PpaJcE.png"
            alt="Mental Health Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified mental health professionals in your area. Browse services below or use filters to narrow your
            search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Licensed and experienced mental health professionals</li>
              <li>Confidential and secure service connections</li>
              <li>Compare specialties and approaches</li>
              <li>Find the right support for your specific needs</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No mental health service businesses found.</p>
          <p className="text-gray-600 mb-6">Be the first to register your business in this category!</p>
          <Button variant="default" asChild>
            <a href="/business-register">Register Your Business</a>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {businesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{business.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {business.city}, {business.state}
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
                        {business.rating || "No ratings"} ({business.reviewCount || 0} reviews)
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700">Categories:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {business.categories?.map((category: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                    <Button className="w-full md:w-auto" onClick={() => handleOpenProfile(business)}>
                      View Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Business Profile Dialog */}
      {selectedBusiness && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => setIsProfileDialogOpen(false)}
          business={selectedBusiness}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
