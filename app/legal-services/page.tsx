"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState, useEffect } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"
import { AdBox } from "@/components/ad-box"
import { getBusinessesBySelectedCategories, getBusinessAdDesignData } from "@/app/actions/business-category-fetcher"
import type { Business } from "@/lib/definitions"

export default function LegalServicesPage() {
  const filterOptions = [
    { id: "lawyer1", label: "Family Lawyer", value: "Family Lawyer" },
    { id: "lawyer2", label: "Criminal Defense Lawyer", value: "Criminal Defense Lawyer" },
    { id: "lawyer3", label: "Personal Injury Lawyer", value: "Personal Injury Lawyer" },
    { id: "lawyer4", label: "Corporate Lawyer", value: "Corporate Lawyer" },
    { id: "lawyer5", label: "Immigration Lawyer", value: "Immigration Lawyer" },
    { id: "lawyer6", label: "Intellectual Property Lawyer", value: "Intellectual Property Lawyer" },
    { id: "lawyer7", label: "Estate Planning Lawyer", value: "Estate Planning Lawyer" },
    { id: "lawyer8", label: "Bankruptcy Lawyer", value: "Bankruptcy Lawyer" },
    { id: "lawyer9", label: "Civil Litigation Lawyer", value: "Civil Litigation Lawyer" },
    { id: "lawyer10", label: "Real Estate Lawyer", value: "Real Estate Lawyer" },
    { id: "lawyer11", label: "Entertainment Lawyer", value: "Entertainment Lawyer" },
    { id: "lawyer12", label: "Tax Lawyer", value: "Tax Lawyer" },
    { id: "lawyer13", label: "Employment Lawyer", value: "Employment Lawyer" },
    { id: "lawyer14", label: "Social Security Disability Lawyer", value: "Social Security Disability Lawyer" },
    { id: "lawyer15", label: "Workers' Compensation Lawyer", value: "Workers' Compensation Lawyer" },
  ]

  // State for reviews dialog
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<{
    id: string
    name: string
    reviews: any[]
  } | null>(null)

  // State for businesses and ad designs
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [businessAdDesigns, setBusinessAdDesigns] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBusinesses() {
      try {
        setLoading(true)
        setError(null)

        // Fetch businesses that have selected "lawyers" category
        const matchingBusinesses = await getBusinessesBySelectedCategories("/legal-services")
        setBusinesses(matchingBusinesses)

        // Fetch ad design data for each business
        const adDesigns: Record<string, any> = {}
        for (const business of matchingBusinesses) {
          const adDesign = await getBusinessAdDesignData(business.id)
          if (adDesign) {
            adDesigns[business.id] = adDesign
          }
        }
        setBusinessAdDesigns(adDesigns)
      } catch (err) {
        console.error("Error fetching businesses:", err)
        setError("Failed to load legal services")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinesses()
  }, [])

  const handleOpenReviews = (business: Business) => {
    setSelectedProvider({
      id: business.id,
      name: business.businessName,
      reviews: business.reviewsData || [],
    })
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Legal Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/lawyer001-5xlajuHkD91HvXOM2zWdKrtS2HONn3.png"
            alt="Legal Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified legal professionals in your area. Browse services below or use filters to narrow your search.
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading legal professionals...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : businesses.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Legal Professionals Yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first legal professional to join our platform and connect with potential clients in your area.
            </p>
            <Button className="bg-slate-600 hover:bg-slate-700">Register Your Practice</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {businesses.map((business) => {
            const adDesign = businessAdDesigns[business.id]

            return (
              <div key={business.id} className="space-y-4">
                {/* Business AdBox */}
                {adDesign && (
                  <AdBox
                    title={adDesign.businessInfo?.businessName || business.businessName}
                    description={adDesign.businessInfo?.freeText || "Professional legal services"}
                    businessName={business.businessName}
                    businessId={business.id}
                    phoneNumber={adDesign.businessInfo?.phone || business.phone}
                    address={
                      adDesign.businessInfo?.streetAddress
                        ? `${adDesign.businessInfo.streetAddress}, ${adDesign.businessInfo.city || ""}, ${adDesign.businessInfo.state || ""} ${adDesign.businessInfo.zipCode || ""}`.trim()
                        : undefined
                    }
                  />
                )}

                {/* Business Card */}
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{business.businessName}</h3>
                        <p className="text-gray-600 text-sm mt-1">
                          {business.city && business.state
                            ? `${business.city}, ${business.state}`
                            : `Zip: ${business.zipCode}`}
                        </p>

                        <div className="flex items-center mt-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < Math.floor(business.rating || 0) ? "text-yellow-400" : "text-gray-300"}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600 ml-2">
                            {business.rating || 0} ({business.reviews || 0} reviews)
                          </span>
                        </div>

                        {business.services && business.services.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm font-medium text-gray-700">Specialties:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {business.services.map((service, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                >
                                  {service}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end justify-between">
                        <Button className="w-full md:w-auto" onClick={() => handleOpenReviews(business)}>
                          Reviews
                        </Button>
                        <Button variant="outline" className="mt-2 w-full md:w-auto">
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          businessId={selectedProvider.id}
          reviews={selectedProvider.reviews}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
