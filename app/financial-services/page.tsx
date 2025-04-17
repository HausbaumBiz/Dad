"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"
import { ReviewsDialog } from "@/components/reviews-dialog"

export default function FinancialServicesPage() {
  const filterOptions = [
    { id: "finance1", label: "Accountants", value: "Accountants" },
    { id: "finance2", label: "Insurance", value: "Insurance" },
    { id: "finance3", label: "Advertising", value: "Advertising" },
    { id: "finance4", label: "Marketing", value: "Marketing" },
    { id: "finance5", label: "Financial and Investment Advisers", value: "Financial and Investment Advisers" },
    { id: "finance6", label: "Debt Consolidators", value: "Debt Consolidators" },
    { id: "finance7", label: "Cryptocurrency", value: "Cryptocurrency" },
  ]

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Financial Freedom Advisors",
      services: ["Financial and Investment Advisers", "Debt Consolidators"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Tax Solutions Group",
      services: ["Accountants"],
      rating: 4.8,
      reviews: 64,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Secure Insurance Agency",
      services: ["Insurance"],
      rating: 4.7,
      reviews: 52,
      location: "Akron, OH",
    },
  ])

  // State for reviews dialog
  const [selectedProvider, setSelectedProvider] = useState<any>(null)
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)

  // Mock reviews data
  const mockReviews = {
    "Financial Freedom Advisors": [
      {
        id: 1,
        userName: "FutureSecured",
        rating: 5,
        comment:
          "Working with Financial Freedom Advisors completely transformed my retirement planning. Their personalized approach helped me understand my options and make confident decisions.",
        date: "May 15, 2023",
      },
      {
        id: 2,
        userName: "DebtFreeLiving",
        rating: 5,
        comment:
          "I was drowning in debt until I found Financial Freedom Advisors. Their debt consolidation plan was realistic and manageable. I'm now on track to be debt-free in 3 years!",
        date: "April 2, 2023",
      },
      {
        id: 3,
        userName: "InvestmentNewbie",
        rating: 4,
        comment:
          "As someone new to investing, I appreciated how they explained everything in simple terms. They took the time to educate me rather than just telling me what to do.",
        date: "March 18, 2023",
      },
    ],
    "Tax Solutions Group": [
      {
        id: 1,
        userName: "BusinessOwner2023",
        rating: 5,
        comment:
          "Tax Solutions Group has handled my small business taxes for 3 years now. They've saved me thousands and keep me compliant with all regulations. Worth every penny!",
        date: "April 20, 2023",
      },
      {
        id: 2,
        userName: "TaxRefundHappy",
        rating: 5,
        comment:
          "I was amazed at how much more I got back on my refund compared to when I used to file myself. They found deductions I never knew existed.",
        date: "February 28, 2023",
      },
      {
        id: 3,
        userName: "AuditSurvivor",
        rating: 4,
        comment:
          "When I got audited, Tax Solutions was there every step of the way. They represented me professionally and resolved everything with minimal stress on my part.",
        date: "January 15, 2023",
      },
    ],
    "Secure Insurance Agency": [
      {
        id: 1,
        userName: "HomeownerProtected",
        rating: 5,
        comment:
          "After a severe storm damaged our roof, Secure Insurance made the claims process incredibly smooth. They were responsive and got us a fair settlement quickly.",
        date: "June 10, 2023",
      },
      {
        id: 2,
        userName: "SafeDriver",
        rating: 4,
        comment:
          "I've been with Secure Insurance for auto coverage for 5 years. Their rates are competitive and they've always been helpful when I've had questions.",
        date: "May 5, 2023",
      },
      {
        id: 3,
        userName: "SmallBizOwner",
        rating: 5,
        comment:
          "Finding the right business insurance was overwhelming until I met with Secure Insurance. They customized a package that perfectly fits my company's needs and budget.",
        date: "April 12, 2023",
      },
    ],
  }

  // Function to handle opening reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Insurance, Finance, Debt and Sales" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="/accountant.png"
            alt="Financial Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified financial professionals in your area. Browse services below or use filters to narrow your
            search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Licensed and experienced financial professionals</li>
              <li>Read reviews from other clients</li>
              <li>Compare services and rates</li>
              <li>Find the right financial guidance for your specific needs</li>
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
          reviews={mockReviews[selectedProvider.name] || []}
        />
      )}

      <Toaster />
    </CategoryLayout>
  )
}
