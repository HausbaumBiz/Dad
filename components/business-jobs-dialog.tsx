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
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={backToJobListings}
            className="flex items-center gap-1 job-action-button back-button"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-3 job-details-container">
          {/* Logo - Updated for better aspect ratio */}
          <div className="flex-shrink-0 flex items-center justify-center">
            {selectedJob.logoUrl ? (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-md overflow-hidden border flex items-center justify-center bg-white job-logo-container">
                <Image
                  src={selectedJob.logoUrl || "/placeholder.svg"}
                  alt={`${selectedJob.businessName} logo`}
                  className="object-contain max-w-full max-h-full w-auto h-auto"
                  width={128}
                  height={128}
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-32 md:h-32 bg-gray-100 rounded-md flex items-center justify-center job-logo-container">
                <span className="text-gray-400 text-xs text-center">No logo</span>
              </div>
            )}
          </div>

          {/* Job header */}
          <div className="flex-1 job-content">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold job-title">{selectedJob.jobTitle}</h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600">{selectedJob.businessName}</p>

            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-700">Pay</h3>
                <p className="text-sm sm:text-base">{formatPayRange(selectedJob)}</p>
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-medium text-gray-700">Hours</h3>
                <p className="text-sm sm:text-base">{selectedJob.workHours || "Not specified"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        {selectedJob.categories && selectedJob.categories.length > 0 && (
          <div className="mt-3 job-details-section">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Categories</h3>
            <div className="flex flex-wrap gap-1 job-categories-container">
              {selectedJob.categories.map((category, idx) => (
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
        {selectedJob.benefits && Object.keys(selectedJob.benefits).length > 0 && (
          <div className="mt-3 job-details-section">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Benefits</h3>
            <div className="flex flex-wrap gap-1 job-benefits-container">
              {getActiveBenefits(selectedJob).map((benefit, idx) => (
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

        {/* Job description */}
        <div className="mt-3 job-details-section">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Job Description</h3>
          <div className="bg-gray-50 p-2 sm:p-3 rounded-md job-description-container">
            <p className="whitespace-pre-wrap job-description text-xs sm:text-sm">{selectedJob.jobDescription}</p>
          </div>
        </div>

        {/* Qualifications */}
        {selectedJob.qualifications && (
          <div className="mt-3 job-details-section">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Qualifications</h3>
            <div className="bg-gray-50 p-2 sm:p-3 rounded-md job-description-container">
              <p className="whitespace-pre-wrap job-qualifications text-xs sm:text-sm">{selectedJob.qualifications}</p>
            </div>
          </div>
        )}

        {/* Business description */}
        {selectedJob.businessDescription && (
          <div className="mt-3 job-details-section">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">About {selectedJob.businessName}</h3>
            <div className="bg-gray-50 p-2 sm:p-3 rounded-md job-description-container">
              <p className="whitespace-pre-wrap job-business-description text-xs sm:text-sm">
                {selectedJob.businessDescription}
              </p>
            </div>
          </div>
        )}

        {/* Contact information */}
        <div className="mt-3 job-details-section">
          <h3 className="text-xs sm:text-sm font-medium text-gray-700 mb-1">Contact Information</h3>
          <div className="bg-gray-50 p-2 sm:p-3 rounded-md job-description-container">
            <p className="text-xs sm:text-sm">
              <span className="font-medium">Contact:</span> {selectedJob.contactName}
            </p>
            <p className="text-xs sm:text-sm">
              <span className="font-medium">Email:</span> {selectedJob.contactEmail}
            </p>
            {selectedJob.businessAddress && (
              <p className="text-xs sm:text-sm">
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
        <div className="flex justify-center items-center py-6">
          <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm">Loading job listings...</span>
        </div>
      )
    }

    if (error && jobs.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>{error}</p>
          <div className="mt-3 flex justify-center gap-2">
            <Button variant="outline" onClick={onClose} size="sm">
              Close
            </Button>
          </div>
        </div>
      )
    }

    if (jobs.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500 text-sm">
          <p>No job listings available for this business.</p>
          <Button variant="outline" className="mt-3" onClick={onClose} size="sm">
            Close
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {jobs.map((job) => (
          <Card key={job.id} className="overflow-hidden">
            <CardContent className="p-2 sm:p-3 md:p-4 job-card">
              <div className="flex flex-row gap-2">
                {/* Logo - Updated for better aspect ratio */}
                <div className="flex-shrink-0 flex items-center justify-center">
                  {job.logoUrl ? (
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-md overflow-hidden border flex items-center justify-center bg-white job-logo-container">
                      <Image
                        src={job.logoUrl || "/placeholder.svg"}
                        alt={`${job.businessName} logo`}
                        className="object-contain max-w-full max-h-full w-auto h-auto"
                        width={80}
                        height={80}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gray-100 rounded-md flex items-center justify-center job-logo-container">
                      <span className="text-gray-400 text-xs text-center">No logo</span>
                    </div>
                  )}
                </div>

                {/* Job details */}
                <div className="flex-1 job-content">
                  <h3 className="text-base sm:text-lg font-semibold">{job.jobTitle}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">{job.businessName}</p>

                  <div className="mt-1 space-y-1">
                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Pay: </span>
                      <span className="text-xs sm:text-sm">{formatPayRange(job)}</span>
                    </div>

                    <div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Hours: </span>
                      <span className="text-xs sm:text-sm">{job.workHours || "Not specified"}</span>
                    </div>

                    {job.categories && job.categories.length > 0 && (
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Categories: </span>
                        <div className="flex flex-wrap gap-1 mt-1 job-categories-container">
                          {job.categories.slice(0, 2).map((category, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                            >
                              {category}
                            </span>
                          ))}
                          {job.categories.length > 2 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              +{job.categories.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Benefits - Limited to first 2 on mobile */}
                    {job.benefits && Object.keys(job.benefits).length > 0 && (
                      <div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">Benefits: </span>
                        <div className="flex flex-wrap gap-1 mt-1 job-benefits-container">
                          {getActiveBenefits(job)
                            .slice(0, 1)
                            .map((benefit, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700"
                              >
                                {benefit}
                              </span>
                            ))}
                          {getActiveBenefits(job).length > 1 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              +{getActiveBenefits(job).length - 1} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* View full job button */}
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 job-action-button text-xs h-8 px-2"
                  onClick={() => viewFullJob(job)}
                >
                  View Full Job
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
      <DialogContent className="jobs-dialog jobs-dialog-content">
        {/* Custom close button that matches photo album style */}
        <div className="absolute right-2 top-2 z-10">
          <DialogClose className="rounded-full p-1.5 bg-white hover:bg-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <DialogHeader className="pr-6 jobs-dialog-header mb-1">
          <DialogTitle className="text-base sm:text-lg font-semibold truncate dialog-title">
            {selectedJob ? `${selectedJob.jobTitle} - ${businessName}` : `${businessName} - Job Opportunities`}
          </DialogTitle>
        </DialogHeader>

        <div className="jobs-dialog-scrollable">{selectedJob ? renderJobDetails() : renderJobListings()}</div>
      </DialogContent>
    </Dialog>
  )
}
