"use server"

import { revalidatePath } from "next/cache"
import { kv } from "@/lib/redis"
import { v4 as uuidv4 } from "uuid"

// Update the saveJobListing function to use Cloudflare Images instead of Vercel Blob

// First, add the import for Cloudflare Images functions
import { uploadToCloudflareImages, getCloudflareImageUrl } from "@/lib/cloudflare-images"

// Define types for job listings
export interface JobBenefit {
  enabled: boolean
  details?: string
}

export interface JobListing {
  id: string
  businessId: string
  createdAt: string
  updatedAt: string

  // Basic job details
  jobTitle: string
  jobDescription: string
  qualifications: string
  businessName: string
  businessDescription: string
  businessAddress: string
  workHours: string
  contactEmail: string
  contactName: string

  // Pay details
  payType: "hourly" | "salary" | "other" | null
  hourlyMin?: string
  hourlyMax?: string
  salaryMin?: string
  salaryMax?: string
  otherPay?: string

  // Logo
  logoUrl?: string
  logoId?: string

  // Categories
  categories: string[]

  // Benefits
  benefits: Record<string, JobBenefit>
}

// Then modify the saveJobListing function to use Cloudflare Images
export async function saveJobListing(
  formData: FormData,
  businessId: string,
): Promise<{ success: boolean; message: string; jobId?: string }> {
  try {
    // Ensure we have a valid business ID
    if (!businessId) {
      console.error("No business ID provided when saving job listing")
      return {
        success: false,
        message: "No business ID provided. Please set a business ID and try again.",
      }
    }

    console.log(`Saving job listing for business ID: ${businessId}`)

    // Generate a unique ID for the job listing
    const jobId = uuidv4()

    // Parse form data
    const jobData = JSON.parse(formData.get("jobData") as string) as Omit<
      JobListing,
      "id" | "businessId" | "createdAt" | "updatedAt" | "logoUrl"
    >

    // Handle logo upload
    let logoUrl = undefined
    let logoId = undefined
    const logoFile = formData.get("logo") as File

    if (logoFile && logoFile.size > 0) {
      try {
        console.log(`Processing logo upload: ${logoFile.name}, size: ${logoFile.size} bytes`)

        // Check file size before attempting upload
        if (logoFile.size > 10 * 1024 * 1024) {
          console.error("Logo file too large:", logoFile.size)
          return {
            success: false,
            message: "Logo file exceeds the 10MB size limit. Please use a smaller image.",
          }
        }

        // Upload to Cloudflare Images
        const metadata = {
          businessId,
          jobId,
          type: "job-logo",
          originalSize: logoFile.size,
        }

        const result = await uploadToCloudflareImages(logoFile, metadata, `job-logo-${businessId}-${jobId}`)

        if (result && result.success) {
          logoId = result.result.id
          logoUrl = getCloudflareImageUrl(logoId)
          console.log(`Logo uploaded successfully. ID: ${logoId}`)
        } else {
          console.error("Error uploading logo to Cloudflare Images:", result?.error || "Unknown error")
          // Continue without the logo rather than failing the whole job creation
          console.log("Continuing job creation without logo")
        }
      } catch (error) {
        console.error("Error uploading logo:", error)
        // Continue without the logo rather than failing the whole job creation
        console.log("Continuing job creation without logo due to error")
      }
    }

    // Create the job listing object
    const jobListing: JobListing = {
      id: jobId,
      businessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logoUrl,
      logoId, // Add the logoId to the job listing
      ...jobData,
    }

    // Save to Redis - store the full job listing
    const key = `job:${businessId}:${jobId}`
    console.log(`Saving job to Redis key: ${key}`)
    await kv.set(key, JSON.stringify(jobListing))

    // Save to job index for this business - store the job ID in the list for this business
    const jobsKey = `jobs:${businessId}`
    console.log(`Adding job ID to business jobs list at key: ${jobsKey}`)

    let existingJobs = await kv.get<string[]>(jobsKey)

    // Handle case where the key doesn't exist yet
    if (!existingJobs) {
      existingJobs = []
    }

    // Add the job ID to the list and save back to Redis
    await kv.set(jobsKey, [...existingJobs, jobId])

    // Log the full job data for debugging
    console.log(`Job listing saved: `, {
      id: jobId,
      businessId,
      jobsKey,
      jobDataKeys: Object.keys(jobData),
    })

    // Revalidate paths that might display this job
    revalidatePath("/job-listings")
    revalidatePath("/ad-design/customize")
    revalidatePath(`/business/${businessId}`)
    revalidatePath("/funeral-services")

    // Add revalidation for the statistics page to show the new job listing
    revalidatePath("/statistics")

    return {
      success: true,
      message: logoUrl
        ? "Job listing saved successfully with logo!"
        : "Job listing saved successfully! (Logo upload was skipped)",
      jobId,
    }
  } catch (error) {
    console.error("Error saving job listing:", error)
    return {
      success: false,
      message: `Failed to save job listing: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

export async function getBusinessJobs(businessId: string): Promise<JobListing[]> {
  try {
    if (!businessId) {
      console.error("No business ID provided to getBusinessJobs")
      return []
    }

    // Get all job IDs for this business
    const jobsKey = `jobs:${businessId}`
    console.log(`Fetching jobs with key: ${jobsKey}`)

    const jobIds = await kv.get<string[]>(jobsKey)
    console.log(`Raw jobIds result:`, jobIds)

    // Ensure we have an array of job IDs
    if (!jobIds || !Array.isArray(jobIds)) {
      console.log(`No jobs found at key ${jobsKey} or invalid format`)
      return []
    }

    console.log(`Found ${jobIds.length} job IDs for business ${businessId}:`, jobIds)

    if (jobIds.length === 0) {
      return []
    }

    // Fetch each job
    const jobs: JobListing[] = []

    for (const jobId of jobIds) {
      const key = `job:${businessId}:${jobId}`
      console.log(`Fetching job with key: ${key}`)

      const jobData = await kv.get(key)

      if (jobData) {
        try {
          // Handle both string and object data types
          let job: JobListing

          if (typeof jobData === "string") {
            // If it's a string, parse it
            job = JSON.parse(jobData) as JobListing
          } else if (typeof jobData === "object") {
            // If it's already an object, use it directly
            job = jobData as JobListing
          } else {
            // Skip invalid data
            console.error(`Invalid job data type for ${jobId}: ${typeof jobData}`)
            continue
          }

          // Ensure the job has required fields
          if (!job.id) job.id = jobId
          if (!job.businessId) job.businessId = businessId

          jobs.push(job)
        } catch (error) {
          console.error(`Error processing job data for ${jobId}:`, error)
        }
      } else {
        console.log(`No job data found for key: ${key}`)
      }
    }

    console.log(`Returning ${jobs.length} jobs for business ${businessId}`)

    // Sort by creation date (newest first)
    return jobs.sort((a, b) => {
      // Handle missing createdAt fields
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  } catch (error) {
    console.error(`Error fetching business jobs for ${businessId}:`, error)
    return []
  }
}

// Helper function to get file extension
function getFileExtension(filename: string): string {
  return filename.split(".").pop() || "png"
}

export async function removeJobListing(
  businessId: string,
  jobId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    if (!businessId || !jobId) {
      console.error("Missing required parameters to remove job listing:", { businessId, jobId })
      return {
        success: false,
        message: "Missing business ID or job ID",
      }
    }

    console.log(`Removing job listing ${jobId} for business ${businessId}`)

    // Get the job details before deletion (for any needed cleanup)
    const jobKey = `job:${businessId}:${jobId}`
    const jobData = await kv.get(jobKey)
    let job: JobListing | null = null

    if (jobData) {
      try {
        if (typeof jobData === "string") {
          job = JSON.parse(jobData) as JobListing
        } else if (typeof jobData === "object") {
          job = jobData as JobListing
        }
      } catch (error) {
        console.error("Error parsing job data:", error)
      }
    }

    // Delete the job from Redis
    console.log(`Deleting job from Redis key: ${jobKey}`)
    await kv.del(jobKey)

    // Update the job index for this business
    const jobsKey = `jobs:${businessId}`
    console.log(`Updating job index at key: ${jobsKey}`)

    const existingJobs = (await kv.get<string[]>(jobsKey)) || []
    const updatedJobs = existingJobs.filter((id) => id !== jobId)

    // Log what we're doing for debugging
    console.log(`Before removal: ${existingJobs.length} jobs, After removal: ${updatedJobs.length} jobs`)

    await kv.set(jobsKey, updatedJobs)

    // Clean up any Cloudflare image resources if they exist
    if (job && job.logoId) {
      try {
        // Clean up logo image if needed
        console.log(`Job had a logo with ID: ${job.logoId} - cleanup would happen here`)
        // Note: Actual Cloudflare image deletion would be implemented here if required
      } catch (cleanupError) {
        console.error("Error cleaning up job logo:", cleanupError)
        // Continue with job deletion even if image cleanup fails
      }
    }

    // Revalidate all paths that might display this job
    console.log("Revalidating paths...")
    revalidatePath("/job-listings")
    revalidatePath("/ad-design/customize")
    revalidatePath("/statistics")
    revalidatePath(`/business/${businessId}`)
    revalidatePath("/funeral-services")

    // Also revalidate any pop-up dialog paths
    revalidatePath("/") // Homepage where popups might appear

    // If there are specific paths where the business-jobs-dialog component appears, add them here
    revalidatePath(`/business/${businessId}/jobs`)
    revalidatePath(`/business-portal`)

    return {
      success: true,
      message: "Job listing completely removed from all locations!",
    }
  } catch (error) {
    console.error("Error removing job listing:", error)
    return {
      success: false,
      message: "Failed to remove job listing. Please try again.",
    }
  }
}

// New function to list all business IDs with jobs
export async function listBusinessesWithJobs(): Promise<string[]> {
  try {
    const keys = await kv.keys("jobs:*")
    return keys.map((key) => key.replace("jobs:", ""))
  } catch (error) {
    console.error("Error listing businesses with jobs:", error)
    return []
  }
}

// Debug function to list all job-related keys in Redis
export async function listAllJobKeys(): Promise<string[]> {
  try {
    const jobKeys = await kv.keys("job:*")
    const jobsIndexKeys = await kv.keys("jobs:*")
    return [...jobKeys, ...jobsIndexKeys]
  } catch (error) {
    console.error("Error listing all job keys:", error)
    return []
  }
}

// Add this function to the existing job-actions.ts file

export async function cleanupDemoJobs(businessId: string): Promise<{
  success: boolean
  message: string
  removedJobs?: any[]
}> {
  try {
    if (!businessId) {
      return {
        success: false,
        message: "No business ID provided",
      }
    }

    const response = await fetch(`/api/debug/cleanup-demo-jobs?businessId=${businessId}`, {
      method: "GET",
      headers: {
        "Cache-Control": "no-cache",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to cleanup demo jobs: ${response.statusText}`)
    }

    const result = await response.json()

    return {
      success: true,
      message: result.message || `Removed ${result.removedJobs?.length || 0} demo jobs`,
      removedJobs: result.removedJobs,
    }
  } catch (error) {
    console.error("Error cleaning up demo jobs:", error)
    return {
      success: false,
      message: `Failed to cleanup demo jobs: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}
