"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, Trash2, ArrowLeft } from "lucide-react"
import { getBusinessJobs, cleanupDemoJobs } from "@/app/actions/job-actions"
import type { JobListing } from "@/app/actions/job-actions"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"

interface BusinessJobsDialogProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
  businessName: string
}

export function BusinessJobsDialog({ isOpen, onClose, businessId, businessName }: BusinessJobsDialogProps) {
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [cleaningUp, setCleaningUp] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)

  useEffect(() => {
    if (isOpen && businessId) {
      loadBusinessJobs()
    }
  }, [isOpen, businessId])

  const loadBusinessJobs = async () => {
    try {
      setLoading(true)
      setError(null)

      // Log the business ID we're using
      console.log(`Loading jobs for business ID: ${businessId}`)
      setDebugInfo(`Attempting to load jobs for business ID: ${businessId}`)

      // Only load jobs for the provided business ID, no fallback to demo-business
      const jobsData = await getBusinessJobs(businessId)

      console.log(`Found ${jobsData?.length || 0} jobs for business ID: ${businessId}`)

      if (jobsData && jobsData.length > 0) {
        console.log(`Loaded ${jobsData.length} jobs:`, jobsData)
        setDebugInfo((prevInfo) => `${prevInfo}\nSuccessfully loaded ${jobsData.length} jobs`)
        setJobs(jobsData)
      } else {
        setJobs([])
        console.log("No jobs found for this business")
        setDebugInfo((prevInfo) => `${prevInfo}\nNo jobs found for business ID: ${businessId}`)
        setError("No job listings found for this business")
      }
    } catch (err) {
      console.error("Error loading business jobs:", err)
      setDebugInfo((prevInfo) => `${prevInfo}\nError: ${err instanceof Error ? err.message : String(err)}`)
      setError(`Failed to load job listings: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await loadBusinessJobs()
    toast({
      title: "Refreshed",
      description: "Job listings have been refreshed",
    })
  }

  // Add a new function to clean up demo jobs
  const handleCleanupDemoJobs = async () => {
    try {
      setCleaningUp(true)
      const result = await cleanupDemoJobs(businessId)

      if (result.success) {
        toast({
          title: "Cleanup Successful",
          description: result.message,
        })
        // Reload the jobs after cleanup
        await loadBusinessJobs()
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error cleaning up demo jobs:", error)
      toast({
        title: "Error",
        description: `Failed to clean up demo jobs: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setCleaningUp(false)
    }
  }

  // Format pay range for display
  const formatPayRange = (job: JobListing) => {
    if (job.payType === "hourly" && (job.hourlyMin || job.hourlyMax)) {
      if (job.hourlyMin && job.hourlyMax) {
        return `$${job.hourlyMin} - $${job.hourlyMax}/hour`
      } else if (job.hourlyMin) {
        return `$${job.hourlyMin}/hour`
      } else if (job.hourlyMax) {
        return `Up to $${job.hourlyMax}/hour`
      }
    } else if (job.payType === "salary" && (job.salaryMin || job.salaryMax)) {
      if (job.salaryMin && job.salaryMax) {
        return `$${job.salaryMin} - $${job.salaryMax}/year`
      } else if (job.salaryMin) {
        return `$${job.salaryMin}/year`
      } else if (job.salaryMax) {
        return `Up to $${job.salaryMax}/year`
      }
    } else if (job.payType === "other" && job.otherPay) {
      return job.otherPay
    }
    return "Not specified"
  }

  // Get active benefits
  const getActiveBenefits = (job: JobListing) => {
    if (!job.benefits) return []

    return Object.entries(job.benefits)
      .filter(([_, benefit]) => benefit.enabled)
      .map(([key, benefit]) => {
        // Format the benefit key for display
        const formatted = key
          .replace(/([A-Z])/g, " $1") // Add space before capital letters
          .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter

        return benefit.details ? `${formatted} (${benefit.details})` : formatted
      })
  }

  // View full job details
  const viewFullJob = (job: JobListing) => {
    setSelectedJob(job)
  }

  // Back to job listings
  const backToJobListings = () => {
    setSelectedJob(null)
  }

  // Render job details view
  const renderJobDetails = () => {
    if (!selectedJob) return null

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={backToJobListings} className="flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to listings
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center justify-center">
            {selectedJob.logoUrl ? (
              <div className="relative h-32 w-32 rounded-md overflow-hidden border">
                <Image
                  src={selectedJob.logoUrl || "/placeholder.svg"}
                  alt={`${selectedJob.businessName} logo`}
                  width={128}
                  height={128}
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="h-32 w-32 bg-gray-100 rounded-md flex items-center justify-center">
                <span className="text-gray-400 text-sm text-center">No logo</span>
              </div>
            )}
          </div>

          {/* Job header */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{selectedJob.jobTitle}</h2>
            <p className="text-lg text-gray-600">{selectedJob.businessName}</p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Pay</h3>
                <p className="text-base">{formatPayRange(selectedJob)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700">Hours</h3>
                <p className="text-base">{selectedJob.workHours || "Not specified"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        {selectedJob.categories && selectedJob.categories.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {selectedJob.categories.map((category, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary/10 text-primary"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {selectedJob.benefits && Object.keys(selectedJob.benefits).length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Benefits</h3>
            <div className="flex flex-wrap gap-2">
              {getActiveBenefits(selectedJob).map((benefit, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-50 text-green-700"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job description */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Job Description</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="whitespace-pre-wrap">{selectedJob.jobDescription}</p>
          </div>
        </div>

        {/* Qualifications */}
        {selectedJob.qualifications && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Qualifications</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{selectedJob.qualifications}</p>
            </div>
          </div>
        )}

        {/* Business description */}
        {selectedJob.businessDescription && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">About {selectedJob.businessName}</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{selectedJob.businessDescription}</p>
            </div>
          </div>
        )}

        {/* Contact information */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Contact Information</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p>
              <span className="font-medium">Contact:</span> {selectedJob.contactName}
            </p>
            <p>
              <span className="font-medium">Email:</span> {selectedJob.contactEmail}
            </p>
            {selectedJob.businessAddress && (
              <p>
                <span className="font-medium">Address:</span> {selectedJob.businessAddress}
              </p>
            )}
          </div>
        </div>

        {/* External link section has been removed */}
      </div>
    )
  }

  // Render job listings view
  const renderJobListings = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading job listings...</span>
        </div>
      )
    }

    if (error && jobs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>{error}</p>
          {process.env.NODE_ENV !== "production" && debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-left">
              <p className="font-medium">Debug Information:</p>
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              Try Again
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )
    }

    if (jobs.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <p>No job listings available for this business.</p>
          {process.env.NODE_ENV !== "production" && debugInfo && (
            <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs text-left">
              <p className="font-medium">Debug Information:</p>
              <pre className="whitespace-pre-wrap">{debugInfo}</pre>
            </div>
          )}
          <Button variant="outline" className="mt-4" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {jobs.map((job) => (
          <Card key={job.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Logo */}
                <div className="flex-shrink-0 flex items-center justify-center">
                  {job.logoUrl ? (
                    <div className="relative h-24 w-24 rounded-md overflow-hidden border">
                      <Image
                        src={job.logoUrl || "/placeholder.svg"}
                        alt={`${job.businessName} logo`}
                        width={96}
                        height={96}
                        className="object-contain"
                        unoptimized // Use the direct Cloudflare URL
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 bg-gray-100 rounded-md flex items-center justify-center">
                      <span className="text-gray-400 text-xs text-center">No logo</span>
                    </div>
                  )}
                </div>

                {/* Job details */}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{job.jobTitle}</h3>
                  <p className="text-gray-600 text-sm">{job.businessName}</p>

                  <div className="mt-3 space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700">Pay: </span>
                      <span className="text-sm">{formatPayRange(job)}</span>
                    </div>

                    <div>
                      <span className="text-sm font-medium text-gray-700">Hours: </span>
                      <span className="text-sm">{job.workHours || "Not specified"}</span>
                    </div>

                    {job.categories && job.categories.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Categories: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {job.categories.map((category, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefits */}
                    {job.benefits && Object.keys(job.benefits).length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Benefits: </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getActiveBenefits(job).map((benefit, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Job description preview */}
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 line-clamp-2">{job.jobDescription}</p>
                  </div>
                </div>
              </div>

              {/* View full job button */}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => viewFullJob(job)}
                >
                  View Full Job
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {process.env.NODE_ENV !== "production" && debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 rounded-md text-xs">
            <details>
              <summary className="cursor-pointer font-medium">Debug Information</summary>
              <pre className="mt-2 whitespace-pre-wrap">{debugInfo}</pre>
            </details>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            {selectedJob ? `${selectedJob.jobTitle} - ${businessName}` : `${businessName} - Job Opportunities`}
          </DialogTitle>
          <div className="flex gap-2">
            {!selectedJob && process.env.NODE_ENV !== "production" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/debug/business-jobs?businessId=${businessId}`, "_blank")}
                  title="Debug job data"
                >
                  Debug
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCleanupDemoJobs}
                  disabled={cleaningUp || loading}
                  title="Remove demo jobs"
                  className="flex items-center gap-1"
                >
                  <Trash2 className={`h-4 w-4 ${cleaningUp ? "animate-spin" : ""}`} />
                  {cleaningUp ? "Cleaning..." : "Remove Demo Jobs"}
                </Button>
              </>
            )}
            {!selectedJob && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={loading}
                title="Refresh job listings"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </DialogHeader>

        {selectedJob ? renderJobDetails() : renderJobListings()}
      </DialogContent>
    </Dialog>
  )
}
