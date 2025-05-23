"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function WeddingsEventsPage() {
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: number
    name: string
    rating: number
    reviews: number
  } | null>(null)

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

  const providers = [] // Mock data, replace with actual data fetching

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
              <li>Experienced and professional event vendors</li>
              <li>Read reviews from other clients</li>
              <li>Compare services and rates</li>
              <li>Find everything you need for your special day in one place</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      {providers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No wedding and event service businesses found.</p>
          <p className="text-gray-600 mb-6">Be the first to register your business in this category!</p>
          <Button variant="default" asChild>
            <a href="/business-register">Register Your Business</a>
          </Button>
        </div>
      ) : (
        // existing providers mapping code
        <div className="mt-8 p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <h3 className="text-xl font-medium text-gray-700 mb-2">Providers will be displayed here</h3>
          <p className="text-gray-600">This section will display the list of providers.</p>
        </div>
      )}

      <Toaster />
    </CategoryLayout>
  )
}
