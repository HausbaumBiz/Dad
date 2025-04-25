"use client"

import { CategoryLayout } from "@/components/category-layout"
import { CategoryFilter } from "@/components/category-filter"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import { useState } from "react"
import Image from "next/image"

// Import the ReviewsDialog component
import { ReviewsDialog } from "@/components/reviews-dialog"
import { ReviewLoginDialog } from "@/components/review-login-dialog"

export default function TechITServicesPage() {
  const filterOptions = [
    { id: "computers1", label: "Computer Network Specialists", value: "Computer Network Specialists" },
    { id: "computers2", label: "Database Administrators", value: "Database Administrators" },
    { id: "computers3", label: "Database Architects", value: "Database Architects" },
    { id: "computers4", label: "Computer Programmers", value: "Computer Programmers" },
    { id: "computers5", label: "Software Developers", value: "Software Developers" },
    { id: "computers6", label: "Website Developers", value: "Website Developers" },
    { id: "computers7", label: "Computer Security", value: "Computer Security" },
    { id: "computers8", label: "Blockchain and Crypto", value: "Blockchain and Crypto" },
    { id: "computers9", label: "Technology Consultants", value: "Technology Consultants" },
  ]

  // Add state variables for tracking the selected provider and dialog open state
  const [isReviewsDialogOpen, setIsReviewsDialogOpen] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<any>(null)

  // Mock service providers - in a real app, these would come from an API
  const [providers] = useState([
    {
      id: 1,
      name: "Digital Solutions Group",
      services: ["Website Developers", "Software Developers"],
      rating: 4.9,
      reviews: 87,
      location: "North Canton, OH",
    },
    {
      id: 2,
      name: "Secure IT Consulting",
      services: ["Computer Security", "Computer Network Specialists"],
      rating: 4.8,
      reviews: 64,
      location: "Canton, OH",
    },
    {
      id: 3,
      name: "Data Management Experts",
      services: ["Database Administrators", "Database Architects"],
      rating: 4.7,
      reviews: 52,
      location: "Akron, OH",
    },
  ])

  // Add mock reviews data specific to tech and IT services
  const mockReviews = [
    {
      id: 1,
      providerName: "Digital Solutions Group",
      reviews: [
        {
          id: 101,
          username: "TechStartup",
          rating: 5,
          date: "2023-11-18",
          comment:
            "Exceptional web development work! They built our company website from scratch and it exceeded all our expectations. Fast, responsive, and very professional team.",
        },
        {
          id: 102,
          username: "SmallBizOwner",
          rating: 5,
          date: "2023-10-25",
          comment:
            "They developed a custom software solution for our inventory management that has saved us countless hours. Their team was communicative throughout the entire process.",
        },
        {
          id: 103,
          username: "E-commerceManager",
          rating: 4,
          date: "2023-09-20",
          comment:
            "Great work on our e-commerce platform. The site is fast, secure, and user-friendly. Only reason for 4 stars is that the project took a bit longer than initially estimated.",
        },
      ],
    },
    {
      id: 2,
      providerName: "Secure IT Consulting",
      reviews: [
        {
          id: 201,
          username: "NetworkAdmin",
          rating: 5,
          date: "2023-11-12",
          comment:
            "Top-notch security audit and implementation. They identified several vulnerabilities in our network that we weren't aware of and provided clear solutions to address them.",
        },
        {
          id: 202,
          username: "FinanceCFO",
          rating: 5,
          date: "2023-10-08",
          comment:
            "After experiencing a security breach, we hired them to secure our systems. Their response was quick, thorough, and effective. We now have them on retainer for all our security needs.",
        },
        {
          id: 203,
          username: "HealthcareIT",
          rating: 4,
          date: "2023-09-15",
          comment:
            "They set up our entire network infrastructure with security as the priority. Very knowledgeable about HIPAA compliance requirements, which was essential for our medical practice.",
        },
      ],
    },
    {
      id: 3,
      providerName: "Data Management Experts",
      reviews: [
        {
          id: 301,
          username: "DataScientist",
          rating: 5,
          date: "2023-11-22",
          comment:
            "Excellent database architecture work. They redesigned our database structure, which significantly improved query performance and reduced our storage costs.",
        },
        {
          id: 302,
          username: "ResearchDirector",
          rating: 4,
          date: "2023-10-18",
          comment:
            "They helped us migrate our legacy database to a modern cloud solution. The process was smooth with minimal downtime. Their documentation was thorough and helpful.",
        },
        {
          id: 303,
          username: "BusinessAnalyst",
          rating: 5,
          date: "2023-09-08",
          comment:
            "Their database administrators are true experts. They optimized our data warehouse which has made our business intelligence reporting much faster and more reliable.",
        },
      ],
    },
  ]

  // Add a handler function for opening the reviews dialog
  const handleOpenReviews = (provider: any) => {
    setSelectedProvider(provider)
    setIsReviewsDialogOpen(true)
  }

  return (
    <CategoryLayout title="Tech & IT Services" backLink="/" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/computer-KPP5QpYvz9S9ORgJKtPMWS2q7tYAGS.png"
            alt="Tech and IT Services"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified technology professionals in your area. Browse services below or use filters to narrow your
            search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Experienced and certified IT professionals</li>
              <li>Read reviews from other clients</li>
              <li>Compare services and rates</li>
              <li>Find the right tech solution for your specific needs</li>
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
          reviews={mockReviews.find((p) => p.providerName === selectedProvider.name)?.reviews || []}
        />
      )}

      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />

      <Toaster />
    </CategoryLayout>
  )
}
