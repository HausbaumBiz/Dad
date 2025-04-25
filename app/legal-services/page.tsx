"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

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
    id: number
    name: string
    reviews: any[]
  } | null>(null)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Johnson & Associates Law Firm",
      services: ["Family Lawyer", "Estate Planning Lawyer"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "Patricia M.",
          rating: 5,
          comment:
            "Attorney Johnson handled my divorce with compassion and professionalism. He was always available to answer my questions and guided me through a difficult time with expert advice.",
          date: "2023-04-10",
        },
        {
          id: 2,
          userName: "Robert S.",
          rating: 5,
          comment:
            "We had our estate plan created by this firm and were very impressed with their thoroughness. They explained complex legal concepts in ways we could understand and made sure all our concerns were addressed.",
          date: "2023-03-22",
        },
        {
          id: 3,
          userName: "Elizabeth J.",
          rating: 4,
          comment:
            "Good experience with their family law services. They were knowledgeable and efficient in handling my custody case. The only reason for 4 stars is that communication was occasionally delayed.",
          date: "2023-02-15",
        },
      ],
    },
    {
      id: 2,
      name: "Smith Legal Defense",
      services: ["Criminal Defense Lawyer", "Civil Litigation Lawyer"],
      rating: 4.8,
      reviews: 64,
      location: "Canton, OH",
      reviewsData: [
        {
          id: 1,
          userName: "James W.",
          rating: 5,
          comment:
            "Attorney Smith is exceptional. When I was facing serious charges, he worked tirelessly on my case and achieved an outcome I didn't think was possible. His courtroom presence is impressive.",
          date: "2023-04-05",
        },
        {
          id: 2,
          userName: "Maria L.",
          rating: 4,
          comment:
            "They represented me in a civil dispute and were very professional. Their legal strategy was effective and they kept me informed throughout the process.",
          date: "2023-03-18",
        },
        {
          id: 3,
          userName: "Thomas B.",
          rating: 5,
          comment:
            "I can't recommend Smith Legal Defense enough. They took on my case when other firms wouldn't, and their dedication and expertise resulted in all charges being dismissed.",
          date: "2023-02-27",
        },
      ],
    },
    {
      id: 3,
      name: "Injury Claims Experts",
      services: ["Personal Injury Lawyer", "Workers' Compensation Lawyer"],
      rating: 4.7,
      reviews: 112,
      location: "Akron, OH",
      reviewsData: [
        {
          id: 1,
          userName: "David H.",
          rating: 5,
          comment:
            "After my car accident, Injury Claims Experts handled everything while I focused on recovery. They negotiated a settlement far higher than the insurance company's initial offer.",
          date: "2023-04-12",
        },
        {
          id: 2,
          userName: "Sandra K.",
          rating: 4,
          comment:
            "They represented me in my workers' comp case effectively. The process took longer than expected, but they were persistent and ultimately successful.",
          date: "2023-03-30",
        },
        {
          id: 3,
          userName: "Michael P.",
          rating: 5,
          comment:
            "When I was injured on the job, I was overwhelmed by medical bills and unable to work. This firm took care of everything and secured compensation that covered all my expenses plus lost wages.",
          date: "2023-02-15",
        },
      ],
    },
  ])

  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
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
              <li>Licensed and experienced attorneys</li>
              <li>Read reviews from other clients</li>
              <li>Compare specialties and rates</li>
              <li>Find the right legal help for your specific needs</li>
            </ul>
          </div>
        </div>
      </div>

      <CategoryFilter options={filterOptions} />

      <div className="space-y-6">
        {providers.map((provider) => (
          <Card key={provider.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-xl font-semibold">{provider.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{provider.location}</p>

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
                    <p className="text-sm font-medium text-gray-700">Specialties:</p>
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
                  <Button variant="outline" className="mt-2 w-full md:w-auto">
                    View Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedProvider && (
        <ReviewsDialog
          isOpen={isReviewsDialogOpen}
          onClose={() => setIsReviewsDialogOpen(false)}
          providerName={selectedProvider.name}
          reviews={selectedProvider.reviewsData}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
