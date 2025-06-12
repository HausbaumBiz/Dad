"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ChevronLeft,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Briefcase,
  Building,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"

export default function JobDetailPage() {
  const params = useParams()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchJob() {
      try {
        const { businessId, jobId } = params

        if (!businessId || !jobId) {
          setError("Missing business ID or job ID")
          setLoading(false)
          return
        }

        console.log(`Fetching job details for business: ${businessId}, job: ${jobId}`)

        // Fetch the job directly from Redis using our API
        const response = await fetch(`/api/jobs/${businessId}/${jobId}`, {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch job details: ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.job) {
          setError("Job not found")
          setLoading(false)
          return
        }

        console.log("Job data retrieved:", data.job)
        setJob(data.job)
      } catch (err) {
        console.error("Error fetching job:", err)
        setError(`Failed to load job details: ${err instanceof Error ? err.message : "Unknown error"}`)
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [params])

  // Format benefits for display
  const formatBenefits = (benefits: Record<string, { enabled: boolean; details?: string }>) => {
    return Object.entries(benefits).map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
      enabled: value.enabled,
      details: value.details,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-4xl mb-4">😕</div>
        <h1 className="text-2xl font-bold mb-2">Job Not Found</h1>
        <p className="text-gray-600 mb-6">
          {error || "The job listing you're looking for doesn't exist or has been removed."}
        </p>
        <Button asChild>
          <Link href="/job-listings">Back to Job Listings</Link>
        </Button>
      </div>
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
              <Link href="/job-listings">Job Listings</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/job-listings" className="flex items-center text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Job Listings
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                    {job.logoUrl ? (
                      <img
                        src={job.logoUrl || "/placeholder.svg"}
                        alt={`${job.businessName} logo`}
                        className="max-w-full max-h-full p-2"
                      />
                    ) : (
                      <Briefcase className="h-8 w-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{job.jobTitle}</h1>
                    <p className="text-primary font-medium">{job.businessName}</p>

                    <div className="flex flex-wrap gap-y-2 gap-x-4 mt-3 text-sm text-gray-600">
                      {job.businessAddress && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{job.businessAddress}</span>
                        </div>
                      )}

                      {job.payType && (
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span>
                            {job.payType === "hourly"
                              ? `$${job.hourlyMin || ""}${job.hourlyMax ? "-$" + job.hourlyMax : ""}/hr`
                              : job.payType === "salary"
                                ? `$${job.salaryMin || ""}${job.salaryMax ? "-$" + job.salaryMax : ""}/yr`
                                : job.otherPay || "Compensation details upon inquiry"}
                          </span>
                        </div>
                      )}

                      {job.workHours && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{job.workHours}</span>
                        </div>
                      )}

                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Job Description</h2>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{job.jobDescription}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Qualifications</h2>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line">{job.qualifications}</p>
                </div>
              </CardContent>
            </Card>

            {job.benefits && Object.keys(job.benefits).length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Benefits</h2>
                  <ul className="space-y-3">
                    {formatBenefits(job.benefits).map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        {benefit.enabled ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mr-2 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className={benefit.enabled ? "font-medium" : "text-gray-500"}>{benefit.name}</span>
                          {benefit.enabled && benefit.details && (
                            <p className="text-sm text-gray-600 mt-1">{benefit.details}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About the Company</h2>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <Building className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium">Company</h3>
                      <p className="text-gray-600">{job.businessName}</p>
                    </div>
                  </div>

                  {job.businessDescription && (
                    <div>
                      <p className="text-gray-600">{job.businessDescription}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

                <div className="space-y-4">
                  {job.contactName && (
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Contact Person</h3>
                        <p className="text-gray-600">{job.contactName}</p>
                      </div>
                    </div>
                  )}

                  {job.contactEmail && (
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Email</h3>
                        <a href={`mailto:${job.contactEmail}`} className="text-primary hover:underline">
                          {job.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="sticky top-6">
              <Button className="w-full" size="lg">
                Apply for this Job
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-primary text-white py-8 mt-12 relative">
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
    </div>
  )
}
