"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, X } from "lucide-react"
import { getBusinessJobs } from "@/app/actions/job-actions"
import type { JobListing } from "@/app/actions/job-actions"
import Image from "next/image"

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

      // Only load jobs for the provided business ID
      const jobsData = await getBusinessJobs(businessId)

      if (jobsData && jobsData.length > 0) {
        setJobs(jobsData)
      } else {
        setJobs([])
        setError("No job listings found for this business")
      }
    } catch (err) {
      console.error("Error loading business jobs:", err)
      setError(`Failed to load job listings: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  // Format pay range for display
  const formatPayRange = (job: JobListing) => {
    if (job.payType === "hourly" && (job.hourlyMin || job.hourlyMax)) {
      if (job.hourlyMin && job.hourlyMax) {
        return `$${job.hourlyMin} - $${job.hourlyMax}/hr`
      } else if (job.hourlyMin) {
        return `$${job.hourlyMin}/hr`
      } else if (job.hourlyMax) {
        return `Up to $${job.hourlyMax}/hr`
      }
    } else if (job.payType === "salary" && (job.salaryMin || job.salaryMax)) {
      if (job.salaryMin && job.salaryMax) {
        return `$${job.salaryMin} - $${job.salaryMax}/yr`
      } else if (job.salaryMin) {
        return `$${job.salaryMin}/yr`
      } else if (job.salaryMax) {
        return `Up to $${job.salaryMax}/yr`
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
      <div className="space-y-2 w-full max-w-full">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={backToJobListings}
            className="flex items-center gap-1 job-action-button back-button"
          >
            <ArrowLeft className="h-3 w-3" />
            Back
          </Button>
        </div>

        <div className="flex flex-col gap-2 job-details-container w-full max-w-full">
          {/* Logo - Updated for better aspect ratio */}
          <div className="flex items-center justify-start w-full">
            <div className="flex-shrink-0 flex items-center justify-center">
              {selectedJob.logoUrl ? (
                <div className="relative w-10 h-10 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-md overflow-hidden border flex items-center justify-center bg-white job-logo-container">
                  <Image
                    src={selectedJob.logoUrl || "/placeholder.svg"}
                    alt={`${selectedJob.businessName} logo`}
                    className="object-contain max-w-full max-h-full w-auto h-auto"
                    width={64}
                    height={64}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-16 sm:h-16 md:w-24 md:h-24 bg-gray-100 rounded-md flex items-center justify-center job-logo-container">
                  <span className="text-gray-400 text-xs text-center">No logo</span>
                </div>
              )}

              {/* Job header - moved next to logo */}
              <div className="flex-1 job-content ml-3">
                <h2 className="text-base sm:text-lg md:text-xl font-bold job-title">{selectedJob.jobTitle}</h2>
                <p className="text-xs sm:text-sm md:text-base text-gray-600">{selectedJob.businessName}</p>
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-2">
            <div>
              <h3 className="text-xs font-medium text-gray-700">Pay</h3>
              <p className="text-xs sm:text-sm">{formatPayRange(selectedJob)}</p>
            </div>

            <div>
              <h3 className="text-xs font-medium text-gray-700">Hours</h3>
              <p className="text-xs sm:text-sm">{selectedJob.workHours || "Not specified"}</p>
            </div>
          </div>
        </div>

        {/* Categories */}
        {selectedJob.categories && selectedJob.categories.length > 0 && (
          <div className="mt-2 job-details-section w-full">
            <h3 className="text-xs font-medium text-gray-700 mb-1">Categories</h3>
            <div className="flex flex-wrap gap-1 job-categories-container">
              {selectedJob.categories.map((category, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {selectedJob.benefits && Object.keys(selectedJob.benefits).length > 0 && (
          <div className="mt-2 job-details-section w-full">
            <h3 className="text-xs font-medium text-gray-700 mb-1">Benefits</h3>
            <div className="flex flex-wrap gap-1 job-benefits-container">
              {getActiveBenefits(selectedJob).map((benefit, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Job description */}
        <div className="mt-2 job-details-section w-full">
          <h3 className="text-xs font-medium text-gray-700 mb-1">Job Description</h3>
          <div className="bg-gray-50 p-2 rounded-md job-description-container">
            <p className="whitespace-pre-line job-description text-xs">{selectedJob.jobDescription}</p>
          </div>
        </div>

        {/* Qualifications */}
        {selectedJob.qualifications && (
          <div className="mt-2 job-details-section w-full">
            <h3 className="text-xs font-medium text-gray-700 mb-1">Qualifications</h3>
            <div className="bg-gray-50 p-2 rounded-md job-description-container">
              <p className="whitespace-pre-line job-qualifications text-xs">{selectedJob.qualifications}</p>
            </div>
          </div>
        )}

        {/* Business description */}
        {selectedJob.businessDescription && (
          <div className="mt-2 job-details-section w-full">
            <h3 className="text-xs font-medium text-gray-700 mb-1">About {selectedJob.businessName}</h3>
            <div className="bg-gray-50 p-2 rounded-md job-description-container">
              <p className="whitespace-pre-line job-business-description text-xs">{selectedJob.businessDescription}</p>
            </div>
          </div>
        )}

        {/* Contact information */}
        <div className="mt-2 job-details-section w-full">
          <h3 className="text-xs font-medium text-gray-700 mb-1">Contact</h3>
          <div className="bg-gray-50 p-2 rounded-md job-description-container">
            <p className="text-xs">
              <span className="font-medium">Name:</span> {selectedJob.contactName}
            </p>
            <p className="text-xs">
              <span className="font-medium">Email:</span> {selectedJob.contactEmail}
            </p>
            {selectedJob.businessAddress && (
              <p className="text-xs">
                <span className="font-medium">Address:</span> {selectedJob.businessAddress}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Render job listings view
  const renderJobListings = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-4 w-full">
          <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-primary" />
          <span className="ml-2 text-xs">Loading jobs...</span>
        </div>
      )
    }

    if (error && jobs.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 text-xs w-full">
          <p>{error}</p>
        </div>
      )
    }

    if (jobs.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 text-xs w-full">
          <p>No job listings available for this business.</p>
        </div>
      )
    }

    return (
      <div className="space-y-2 w-full">
        {jobs.map((job) => (
          <Card key={job.id} className="overflow-hidden w-full">
            <CardContent className="p-2 job-card">
              <div className="flex flex-row gap-2 w-full">
                {/* Logo - Updated for better aspect ratio */}
                <div className="flex-shrink-0 flex items-center justify-center">
                  {job.logoUrl ? (
                    <div className="relative w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-md overflow-hidden border flex items-center justify-center bg-white job-logo-container">
                      <Image
                        src={job.logoUrl || "/placeholder.svg"}
                        alt={`${job.businessName} logo`}
                        className="object-contain max-w-full max-h-full w-auto h-auto"
                        width={32}
                        height={32}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gray-100 rounded-md flex items-center justify-center job-logo-container">
                      <span className="text-gray-400 text-[8px] text-center">No logo</span>
                    </div>
                  )}
                </div>

                {/* Job details */}
                <div className="flex-1 job-content overflow-hidden">
                  <h3 className="text-sm sm:text-base font-semibold truncate">{job.jobTitle}</h3>
                  <p className="text-gray-600 text-xs truncate">{job.businessName}</p>

                  <div className="mt-1 space-y-0.5">
                    <div className="flex flex-wrap items-center">
                      <span className="text-xs font-medium text-gray-700">Pay: </span>
                      <span className="text-xs ml-1">{formatPayRange(job)}</span>
                    </div>

                    <div className="flex flex-wrap items-center">
                      <span className="text-xs font-medium text-gray-700">Hours: </span>
                      <span className="text-xs ml-1 truncate">{job.workHours || "Not specified"}</span>
                    </div>

                    {job.categories && job.categories.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-700">Categories: </span>
                        <div className="flex flex-wrap gap-0.5 mt-0.5 job-categories-container">
                          {job.categories.slice(0, 1).map((category, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-1 py-0 rounded-full text-[10px] font-medium bg-primary/10 text-primary"
                            >
                              {category}
                            </span>
                          ))}
                          {job.categories.length > 1 && (
                            <span className="inline-flex items-center px-1 py-0 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                              +{job.categories.length - 1}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* View full job button */}
              <div className="mt-1.5 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-0.5 job-action-button text-xs h-6 px-1.5"
                  onClick={() => viewFullJob(job)}
                >
                  View Job
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="jobs-dialog jobs-dialog-content w-full p-0 m-0" closeButton={false}>
        {/* Custom close button that matches photo album style */}
        <div className="absolute right-1 top-1 z-10">
          <DialogClose className="rounded-full p-1 bg-white hover:bg-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-3 w-3" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <DialogHeader className="pr-5 jobs-dialog-header mb-1 p-2 w-full">
          <DialogTitle className="text-sm sm:text-base font-semibold truncate dialog-title">
            {selectedJob ? `${selectedJob.jobTitle}` : `${businessName} - Jobs`}
          </DialogTitle>
        </DialogHeader>

        <div className="jobs-dialog-scrollable w-full p-2 overflow-hidden overflow-y-auto">
          {selectedJob ? renderJobDetails() : renderJobListings()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
