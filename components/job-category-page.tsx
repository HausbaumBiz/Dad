"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Search, MapPin, Loader2 } from "lucide-react"
import { ZipCodeDialog } from "@/components/zip-code-dialog"
import { JobListingCard } from "@/components/job-listing-card"
import { searchJobsByZipCodeAndCategory } from "@/app/actions/job-actions"

interface JobCategoryPageProps {
  category: {
    title: string
    description: string
    icon: string
    color: string
  }
  categorySlug: string
}

export default function JobCategoryPage({ category, categorySlug }: JobCategoryPageProps) {
  const router = useRouter()
  const [zipCode, setZipCode] = useState("")
  const [savedZipCode, setSavedZipCode] = useState("")
  const [isZipDialogOpen, setIsZipDialogOpen] = useState(false)
  const [jobs, setJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchPerformed, setSearchPerformed] = useState(false)

  useEffect(() => {
    console.log(`JobCategoryPage mounted for category: ${category.title}`)
    const savedZip = localStorage.getItem("jobSearchZipCode")
    console.log(`Saved zip code: ${savedZip}`)

    if (savedZip) {
      setSavedZipCode(savedZip)
      setZipCode(savedZip)
      console.log(`Fetching jobs for category: ${category.title} in zip: ${savedZip}`)
      fetchJobs(savedZip)
    } else {
      console.log("No saved zip code, opening dialog")
      setIsZipDialogOpen(true)
    }
  }, [categorySlug, category.title])

  const fetchJobs = async (zipCodeToSearch: string) => {
    if (!zipCodeToSearch) {
      console.log("No zip code provided to fetchJobs")
      return
    }

    console.log(`Starting job fetch for category: "${category.title}" in zip: ${zipCodeToSearch}`)
    setIsLoading(true)

    try {
      const jobsData = await searchJobsByZipCodeAndCategory(zipCodeToSearch, category.title)
      console.log(`Fetch completed. Found ${jobsData.length} jobs for category "${category.title}"`)
      console.log("Jobs data:", jobsData)
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

  const handleZipDialogSubmit = (zipCodeValue: string) => {
    setZipCode(zipCodeValue)
    localStorage.setItem("jobSearchZipCode", zipCodeValue)
    setSavedZipCode(zipCodeValue)
    // Fetch jobs for this category and the new zip code
    fetchJobs(zipCodeValue)
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
        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/" className="flex items-center text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Home
            </Link>
          </Button>
          <span className="text-gray-500">/</span>
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/job-listings" className="flex items-center text-primary">
              Job Listings
            </Link>
          </Button>
        </div>

        <div className={`relative overflow-hidden rounded-xl mb-10 ${category.color}`}>
          <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
            <div className="text-center">
              <div className="text-6xl mb-4 mx-auto">{category.icon}</div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{category.title} Jobs</h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto">{category.description}</p>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto mb-10 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">Search {category.title} Jobs by Location</h2>
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
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>
              Searching for {category.title} jobs in {savedZipCode}...
            </p>
          </div>
        )}

        {/* Job Results Section */}
        {searchPerformed && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">
              {jobs.length > 0
                ? `Found ${jobs.length} ${category.title} Job${jobs.length === 1 ? "" : "s"} in ${savedZipCode}`
                : `No ${category.title} jobs found in ${savedZipCode}`}
            </h2>

            {jobs.length > 0 ? (
              <div className="space-y-6">
                {jobs.map((job) => (
                  <div key={job.id} className="mb-4">
                    <JobListingCard
                      job={{
                        id: job.id,
                        businessId: job.businessId,
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
                        categories: job.categories, // Add this line
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-medium mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any {category.title} jobs in the {savedZipCode} area.
                </p>
                <p className="text-gray-600">
                  Try searching in a different zip code or check back later as new jobs are added regularly.
                </p>
              </div>
            )}
          </div>
        )}
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
