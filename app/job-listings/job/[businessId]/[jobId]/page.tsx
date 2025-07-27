"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import {
  ChevronLeft,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Building,
  Mail,
  User,
  CheckCircle,
  XCircle,
  Loader2,
  Bookmark,
  BookmarkCheck,
} from "lucide-react"
import { addFavoriteJob, checkIfJobIsFavorite } from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"

export default function JobDetailPage() {
  const { toast } = useToast()
  const params = useParams()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isJobSaved, setIsJobSaved] = useState(false)
  const [savingJob, setSavingJob] = useState(false)
  const [checkingUser, setCheckingUser] = useState(true)

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

  // Check user session and job save status
  useEffect(() => {
    async function loadUserData() {
      try {
        setCheckingUser(true)
        const session = await getUserSession()
        setCurrentUser(session?.user || null)

        // If user is logged in and we have a job, check if it's saved
        if (session?.user && job?.id) {
          const isSaved = await checkIfJobIsFavorite(job.id)
          setIsJobSaved(isSaved)
        } else {
          setIsJobSaved(false)
        }
      } catch (error) {
        console.error("Error loading user data:", error)
        setCurrentUser(null)
        setIsJobSaved(false)
      } finally {
        setCheckingUser(false)
      }
    }

    if (job) {
      loadUserData()
    }
  }, [job])

  // Handle saving a job to favorites
  const handleSaveJob = async () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "Please log in to save job listings to your bookmarks",
        variant: "destructive",
      })
      return
    }

    if (!job) {
      toast({
        title: "Error",
        description: "Job data not available",
        variant: "destructive",
      })
      return
    }

    if (isJobSaved) {
      toast({
        title: "Already Saved",
        description: "This job is already in your bookmarked jobs",
      })
      return
    }

    setSavingJob(true)

    try {
      const result = await addFavoriteJob({
        id: job.id,
        businessId: job.businessId,
        jobTitle: job.jobTitle,
        businessName: job.businessName,
        payType: job.payType,
        hourlyMin: job.hourlyMin,
        hourlyMax: job.hourlyMax,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        otherPay: job.otherPay,
        workHours: job.workHours,
        categories: job.categories,
        contactName: job.contactName,
        contactEmail: job.contactEmail,
        businessAddress: job.businessAddress,
      })

      if (result.success) {
        setIsJobSaved(true)
        toast({
          title: "Job Saved!",
          description: `${job.jobTitle} has been added to your bookmarked jobs`,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving job:", error)
      toast({
        title: "Error",
        description: "Failed to save job listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingJob(false)
    }
  }

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
                <div className="items-start gap-4">
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

            {/* Mobile Save Button - Show on small screens */}
            <div className="lg:hidden">
              {!checkingUser && currentUser && (
                <Card>
                  <CardContent className="p-4">
                    <Button
                      variant={isJobSaved ? "default" : "outline"}
                      onClick={handleSaveJob}
                      disabled={savingJob}
                      className="w-full flex items-center justify-center gap-2"
                      size="lg"
                    >
                      {savingJob ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isJobSaved ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                      {isJobSaved ? "Saved to Bookmarks" : "Save Job"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
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

            {/* Desktop Save Button - Show below Contact Information on large screens */}
            {!checkingUser && currentUser && (
              <div className="hidden lg:block">
                <Card>
                  <CardContent className="p-6">
                    <Button
                      variant={isJobSaved ? "default" : "outline"}
                      onClick={handleSaveJob}
                      disabled={savingJob}
                      className="w-full flex items-center justify-center gap-2"
                      size="lg"
                    >
                      {savingJob ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isJobSaved ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                      {isJobSaved ? "Saved to Bookmarks" : "Save Job"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Login prompt for non-authenticated users */}
            {!checkingUser && !currentUser && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Bookmark className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-900 mb-2">Save This Job</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Log in to save this job to your bookmarks and access it later
                  </p>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href="/user-login">Log In to Save</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
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

      <Toaster />
    </div>
  )
}
