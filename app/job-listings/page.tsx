"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, Search, MapPin, Briefcase, Loader2 } from "lucide-react"
import { ZipCodeDialog } from "@/components/zip-code-dialog"
import { JobListingCard } from "@/components/job-listing-card"
import { searchJobsByZipCodeAndCategory } from "@/app/actions/job-actions"

export default function JobListingsPage() {
  const [zipCode, setZipCode] = useState("")
  const [savedZipCode, setSavedZipCode] = useState("")
  const [isZipDialogOpen, setIsZipDialogOpen] = useState(false)
  const [selectedCategoryHref, setSelectedCategoryHref] = useState("")
  const [jobs, setJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)

  useEffect(() => {
    const savedZip = localStorage.getItem("jobSearchZipCode")
    if (savedZip) {
      setSavedZipCode(savedZip)
      setZipCode(savedZip)
      // Fetch jobs if we have a saved zip code
      fetchJobs(savedZip)
    }
  }, [])

  const fetchJobs = async (zipCodeToSearch: string) => {
    if (!zipCodeToSearch) return

    setIsLoading(true)
    try {
      const jobsData = await searchJobsByZipCodeAndCategory(zipCodeToSearch)
      setJobs(jobsData)
      setSearchPerformed(true)
    } catch (error) {
      console.error("Error fetching jobs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleZipSubmit = () => {
    if (zipCode) {
      localStorage.setItem("jobSearchZipCode", zipCode)
      setSavedZipCode(zipCode)
      fetchJobs(zipCode)
    } else {
      alert("Please enter a Zip Code.")
    }
  }

  const handleCategoryClick = (href: string, categoryTitle: string, e: React.MouseEvent) => {
    if (!savedZipCode) {
      e.preventDefault()
      setSelectedCategoryHref(href)
      // Store the category title for later use
      sessionStorage.setItem("selectedCategoryTitle", categoryTitle)
      setIsZipDialogOpen(true)
    }
  }

  const handleZipDialogSubmit = (zipCodeValue: string) => {
    setZipCode(zipCodeValue)
    localStorage.setItem("jobSearchZipCode", zipCodeValue)
    setSavedZipCode(zipCodeValue)

    // If there was a selected category, navigate to it after setting the zip code
    if (selectedCategoryHref) {
      window.location.href = selectedCategoryHref
    }
  }

  // Add a clearSearch function after the handleZipDialogSubmit function
  const clearSearch = () => {
    // Clear the zip code input
    setZipCode("")
    // Remove from localStorage
    localStorage.removeItem("jobSearchZipCode")
    // Clear the saved zip code
    setSavedZipCode("")
    // Clear the jobs list
    setJobs([])
    // Reset search state
    setSearchPerformed(false)
  }

  const jobCategories = [
    {
      title: "Office Work",
      description: "Administrative, clerical, customer service, and other office-based positions",
      icon: "📊",
      href: "/job-listings/office-work",
      color: "bg-blue-100",
    },
    {
      title: "Factory Work",
      description: "Manufacturing, assembly line, production, and warehouse positions",
      icon: "🏭",
      href: "/job-listings/factory-work",
      color: "bg-yellow-100",
    },
    {
      title: "Manual Labor",
      description: "Construction, landscaping, moving, and other physical labor positions",
      icon: "🔨",
      href: "/job-listings/manual-labor",
      color: "bg-orange-100",
    },
    {
      title: "Medical",
      description: "Healthcare, nursing, medical administration, and other healthcare positions",
      icon: "🏥",
      href: "/job-listings/medical",
      color: "bg-red-100",
    },
    {
      title: "Non-Medical Care Givers",
      description: "Elderly care, childcare, companion care, and other non-medical caregiving roles",
      icon: "👨‍👩‍👧",
      href: "/job-listings/non-medical-care",
      color: "bg-pink-100",
    },
    {
      title: "Food Service",
      description: "Restaurant, catering, food preparation, and hospitality positions",
      icon: "🍽️",
      href: "/job-listings/food-service",
      color: "bg-green-100",
    },
    {
      title: "Retail",
      description: "Sales, cashier, merchandising, and customer-facing retail positions",
      icon: "🛍️",
      href: "/job-listings/retail",
      color: "bg-purple-100",
    },
    {
      title: "Transportation",
      description: "Driving, delivery, logistics, and transportation-related positions",
      icon: "🚚",
      href: "/job-listings/transportation",
      color: "bg-indigo-100",
    },
    {
      title: "Education",
      description: "Teaching, tutoring, administration, and other education-related positions",
      icon: "🎓",
      href: "/job-listings/education",
      color: "bg-teal-100",
    },
    {
      title: "Technology",
      description: "IT, software development, technical support, and other tech positions",
      icon: "💻",
      href: "/job-listings/technology",
      color: "bg-cyan-100",
    },
    {
      title: "Professional Services",
      description: "Legal, accounting, consulting, and other professional service positions",
      icon: "👔",
      href: "/job-listings/professional-services",
      color: "bg-pink-100",
    },
    {
      title: "Skilled Trades",
      description: "Electrician, plumber, carpenter, and other skilled trade positions",
      icon: "🔧",
      href: "/job-listings/skilled-trades",
      color: "bg-amber-100",
    },
    {
      title: "Arts & Entertainment",
      description: "Performing arts, music, design, media production, and creative positions",
      icon: "🎭",
      href: "/job-listings/arts-entertainment",
      color: "bg-fuchsia-100",
    },
    {
      title: "Protection Services",
      description: "Security, law enforcement, fire protection, and safety-related positions",
      icon: "🛡️",
      href: "/job-listings/protection-services",
      color: "bg-slate-100",
    },
    {
      title: "Agriculture & Animal Care",
      description: "Farming, livestock, veterinary assistance, and animal handling positions",
      icon: "🌱",
      href: "/job-listings/agriculture-animal-care",
      color: "bg-lime-100",
    },
    {
      title: "Charity Services",
      description: "Non-profit, volunteer coordination, fundraising, and community outreach roles",
      icon: "🤝",
      href: "/job-listings/charity-services",
      color: "bg-rose-100",
    },
    {
      title: "Part-Time & Seasonal",
      description: "Temporary, seasonal, and part-time positions across various industries",
      icon: "⏱️",
      href: "/job-listings/part-time-seasonal",
      color: "bg-lime-100",
    },
  ]

  // Helper function to find category info by job category
  const getCategoryInfo = (jobCategory: string) => {
    const category = jobCategories.find(
      (cat) =>
        cat.title.toLowerCase() === jobCategory.toLowerCase() ||
        jobCategory.toLowerCase().includes(cat.title.toLowerCase()),
    )

    return (
      category || {
        icon: "💼",
        color: "bg-gray-100",
        title: jobCategory,
      }
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/">
              <Image
                src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/hausbaumbiz03-pppfkt6a4UyL8TdkxntO73GQrsTeeU.png"
                alt="Hausbaum Logo"
                width={600}
                height={300}
                className="h-64 w-auto"
              />
            </Link>
          </div>

          <div className="flex space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/contact-us">Contact Us</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/" className="flex items-center text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="relative overflow-hidden rounded-xl mb-10 bg-gradient-to-r from-primary to-primary/80">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "url('/texture0079.png')",
              backgroundRepeat: "repeat",
              mixBlendMode: "multiply",
            }}
          ></div>
          <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
            <div className="text-center text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Next Job</h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Browse job listings from local businesses and employers in your area
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto mb-10 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">Search Jobs by Location</h2>
            {savedZipCode && (
              <div className="mb-4 flex items-center text-primary font-medium">
                <MapPin className="mr-2 h-5 w-5" />
                <span>You are searching in area code: {savedZipCode}</span>
              </div>
            )}

            <div className="w-full flex space-x-2 items-center">
              <div className="flex-grow">
                <Input
                  type="text"
                  placeholder="Enter your zip code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={handleZipSubmit} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Search
              </Button>
              {savedZipCode && (
                <Button variant="outline" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Job Results Section */}
        {searchPerformed && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">
              {jobs.length > 0
                ? `Found ${jobs.length} Job${jobs.length === 1 ? "" : "s"} in ${savedZipCode}`
                : `No jobs found in ${savedZipCode}`}
            </h2>

            {jobs.length > 0 && (
              <div className="space-y-6">
                {jobs.map((job) => (
                  <div key={job.id} className="flex items-start gap-4 mb-4">
                    {/* Category Icon */}
                    {job.categories && job.categories.length > 0 && (
                      <div className={`${getCategoryInfo(job.categories[0]).color} p-3 rounded-lg flex-shrink-0`}>
                        <div className="text-2xl">{getCategoryInfo(job.categories[0]).icon}</div>
                      </div>
                    )}

                    {/* Job Card */}
                    <div className="flex-grow">
                      <JobListingCard
                        job={{
                          id: job.id,
                          businessId: job.businessId, // Pass businessId separately
                          title: job.jobTitle,
                          company: job.businessName,
                          location: job.businessAddress || "Location varies",
                          salary:
                            job.payType === "hourly"
                              ? `$${job.hourlyMin || ""}${job.hourlyMax ? "-$" + job.hourlyMax : ""}/hr`
                              : job.payType === "salary"
                                ? `$${job.salaryMin || ""}${job.salaryMax ? "-$" + job.salaryMax : ""}/yr`
                                : job.otherPay || "Compensation details upon inquiry",
                          type: job.workHours || "Not specified",
                          posted: new Date(job.createdAt).toLocaleDateString(),
                          description: job.jobDescription,
                          logo: job.logoUrl,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Browse Jobs by Category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobCategories.map((category, index) => (
              <Card
                key={index}
                className={`overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 ${category.color} border-none`}
              >
                <Link
                  href={category.href}
                  onClick={(e) => handleCategoryClick(category.href, category.title, e)}
                  className="block h-full"
                >
                  <CardContent className="p-6 h-full flex flex-col">
                    <div className="text-4xl mb-4">{category.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                    <p className="text-gray-600 text-sm flex-grow">{category.description}</p>
                    <div className="flex items-center mt-4 text-primary font-medium">
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>View Jobs</span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <footer className="bg-primary text-white py-8 relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url('/texture0079.png')",
            backgroundRepeat: "repeat",
            mixBlendMode: "multiply",
          }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Hausbaum</h2>
              <p className="text-sm mt-2">© {new Date().getFullYear()} Hausbaum. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Zip Code Dialog */}
      <ZipCodeDialog
        isOpen={isZipDialogOpen}
        onClose={() => setIsZipDialogOpen(false)}
        onSubmit={handleZipDialogSubmit}
      />
    </div>
  )
}
