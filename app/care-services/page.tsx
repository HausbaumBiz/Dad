"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function CareServicesPage() {
  const filterOptions = [
    { id: "homecare1", label: "Non-Medical Elder Care", value: "Non-Medical Elder Care" },
    { id: "homecare2", label: "Non-Medical Special Needs Adult Care", value: "Non-Medical Special Needs Adult Care" },
    { id: "childcare1", label: "Babysitting (18+ Sitters only)", value: "Babysitting (18+ Sitters only)" },
    { id: "homecare3", label: "Other Home Care", value: "Other Home Care" },
    { id: "childcare2", label: "Childcare Centers", value: "Childcare Centers" },
    { id: "homecare4", label: "Adult Day Services", value: "Adult Day Services" },
    { id: "homecare5", label: "Rehab/Nursing/Respite and Memory Care", value: "Rehab/Nursing/Respite and Memory Care" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [providers, setProviders] = useState([]) // Assuming providers are fetched and stored here

  return (
    <CategoryLayout title="Elder and Child Care Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/home%20health-zJyA419byhmD7tyJa0Ebmegg0XzFN3.png"
            alt="Elder and Child Care Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find compassionate and professional care services for elders and children in your area. Browse providers
            below or use filters to narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Verified and background-checked caregivers</li>
              <li>Detailed provider profiles with qualifications</li>
              <li>Read reviews from families like yours</li>
              <li>Find care options that fit your specific needs</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      {providers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No elder and child care service businesses found.</p>
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
