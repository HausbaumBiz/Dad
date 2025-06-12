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

export interface ZipCodeData {
  zip: string
  city: string
  state: string
  latitude: string
  longitude: string
}

export interface JobServiceArea {
  isNationwide: boolean
  zipCodes: ZipCodeData[]
  centerZipCode?: string
  radiusMiles?: number
}

export interface JobListing {
  id: string
  businessId: string
  createdAt: string
  updatedAt: string
  expiresAt: string // Add expiration date
  isExpired: boolean // Add expiration status

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

  // Service Area (NEW)
  serviceArea: JobServiceArea
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
      "id" | "businessId" | "createdAt" | "updatedAt" | "logoUrl" | "expiresAt" | "isExpired"
    >

    // Ensure categories is always an array
    if (!jobData.categories || !Array.isArray(jobData.categories)) {
      console.warn("Categories not provided or not an array, setting to empty array")
      jobData.categories = []
    }

    console.log(`Job categories being saved:`, jobData.categories)

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
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 5) // 5 days from now
    expiresAt.setHours(23, 59, 59, 999) // Set to end of day like coupons

    const jobListing: JobListing = {
      id: jobId,
      businessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      isExpired: false,
      logoUrl,
      logoId,
      ...jobData,
    }

    // Save to Redis - store the full job listing
    const key = `job:${businessId}:${jobId}`
    console.log(`Saving job to Redis key: ${key}`)
    console.log(`Job listing data being saved:`, {
      id: jobListing.id,
      businessId: jobListing.businessId,
      jobTitle: jobListing.jobTitle,
      categories: jobListing.categories,
      serviceArea: jobListing.serviceArea,
    })
    await kv.set(key, JSON.stringify(jobListing))

    // Save to job index for this business - store the job ID in the list for this business
    const jobsKey = `jobs:${businessId}`
    console.log(`Adding job ID to business jobs list at key: ${jobsKey}`)

    const existingJobsData = await kv.get(jobsKey)
    let existingJobs: string[] = []

    // Handle case where the key doesn't exist yet or has unexpected data
    if (existingJobsData) {
      if (Array.isArray(existingJobsData)) {
        existingJobs = existingJobsData
      } else if (typeof existingJobsData === "string") {
        try {
          const parsed = JSON.parse(existingJobsData)
          if (Array.isArray(parsed)) {
            existingJobs = parsed
          } else {
            console.error(`Expected array but got: ${typeof parsed}`, parsed)
            existingJobs = []
          }
        } catch (parseError) {
          console.error("Error parsing existing jobs data:", parseError)
          existingJobs = []
        }
      } else {
        console.error(`Unexpected data type for existing jobs: ${typeof existingJobsData}`, existingJobsData)
        existingJobs = []
      }
    }

    // Add the job ID to the list and save back to Redis
    await kv.set(jobsKey, [...existingJobs, jobId])

    // NEW: Index job by service area for fast lookups
    if (jobListing.serviceArea.isNationwide) {
      // Add to nationwide jobs index
      await kv.sadd("jobs:nationwide", `${businessId}:${jobId}`)
      console.log(`Added job to nationwide index`)
    } else if (jobListing.serviceArea.zipCodes && jobListing.serviceArea.zipCodes.length > 0) {
      // Index job by each ZIP code it serves
      for (const zipData of jobListing.serviceArea.zipCodes) {
        await kv.sadd(`zipcode:${zipData.zip}:jobs`, `${businessId}:${jobId}`)
        console.log(`Indexed job under ZIP code: ${zipData.zip}`)
      }

      // Store job's ZIP codes for fast lookup
      await kv.set(`job:${businessId}:${jobId}:zipcodes`, JSON.stringify(jobListing.serviceArea.zipCodes))
    }

    // NEW: Index job by categories for fast category-based searches
    if (jobListing.categories && jobListing.categories.length > 0) {
      for (const category of jobListing.categories) {
        // Create a normalized category key (lowercase, no spaces)
        const categoryKey = category.toLowerCase().replace(/\s+/g, "-")
        await kv.sadd(`category:${categoryKey}:jobs`, `${businessId}:${jobId}`)
        console.log(`Indexed job under category: ${category} (key: ${categoryKey})`)
      }

      // Store job's categories for fast lookup
      await kv.set(`job:${businessId}:${jobId}:categories`, JSON.stringify(jobListing.categories))
    }

    // Store job service area metadata
    await kv.set(`job:${businessId}:${jobId}:servicearea`, JSON.stringify(jobListing.serviceArea))

    // Log the full job data for debugging
    console.log(`Job listing saved: `, {
      id: jobId,
      businessId,
      jobsKey,
      jobDataKeys: Object.keys(jobData),
      categories: jobListing.categories,
      serviceArea: jobListing.serviceArea,
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

    const jobIdsData = await kv.get(jobsKey)
    let jobIds: string[] = []

    console.log(`Raw jobIds result:`, jobIdsData, `Type: ${typeof jobIdsData}`)

    // Ensure we have a proper array
    if (jobIdsData) {
      if (Array.isArray(jobIdsData)) {
        jobIds = jobIdsData
      } else if (typeof jobIdsData === "string") {
        try {
          const parsed = JSON.parse(jobIdsData)
          if (Array.isArray(parsed)) {
            jobIds = parsed
          } else {
            console.error(`Expected array but got: ${typeof parsed}`, parsed)
            jobIds = []
          }
        } catch (parseError) {
          console.error("Error parsing job IDs data:", parseError)
          jobIds = []
        }
      } else {
        console.error(`Unexpected data type for job IDs: ${typeof jobIdsData}`, jobIdsData)
        jobIds = []
      }
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

          // Ensure categories is always an array
          if (!job.categories || !Array.isArray(job.categories)) {
            job.categories = []
          }

          // Handle jobs created before expiration system was added
          if (!job.expiresAt) {
            const createdDate = job.createdAt ? new Date(job.createdAt) : new Date()
            const expiresAt = new Date(createdDate)
            expiresAt.setDate(expiresAt.getDate() + 5)
            job.expiresAt = expiresAt.toISOString()
            job.isExpired = false

            // Update the job in Redis with the new expiration date
            const updatedJobKey = `job:${businessId}:${jobId}`
            await kv.set(updatedJobKey, JSON.stringify(job))
          }

          // Handle jobs created before service area system was added
          if (!job.serviceArea) {
            job.serviceArea = {
              isNationwide: false,
              zipCodes: [],
            }
          }

          // Don't automatically update expiration status here - let the UI calculate it dynamically

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

    // Clean up service area indexes before deleting the job
    if (job && job.serviceArea) {
      if (job.serviceArea.isNationwide) {
        // Remove from nationwide jobs index
        await kv.srem("jobs:nationwide", `${businessId}:${jobId}`)
        console.log(`Removed job from nationwide index`)
      } else if (job.serviceArea.zipCodes && job.serviceArea.zipCodes.length > 0) {
        // Remove from ZIP code indexes
        for (const zipData of job.serviceArea.zipCodes) {
          await kv.srem(`zipcode:${zipData.zip}:jobs`, `${businessId}:${jobId}`)
          console.log(`Removed job from ZIP code index: ${zipData.zip}`)
        }
      }

      // Clean up service area metadata
      await kv.del(`job:${businessId}:${jobId}:zipcodes`)
      await kv.del(`job:${businessId}:${jobId}:servicearea`)
    }

    // Clean up category indexes before deleting the job
    if (job && job.categories && job.categories.length > 0) {
      for (const category of job.categories) {
        const categoryKey = category.toLowerCase().replace(/\s+/g, "-")
        await kv.srem(`category:${categoryKey}:jobs`, `${businessId}:${jobId}`)
        console.log(`Removed job from category index: ${category} (key: ${categoryKey})`)
      }

      // Clean up category metadata
      await kv.del(`job:${businessId}:${jobId}:categories`)
    }

    // Delete the job from Redis
    console.log(`Deleting job from Redis key: ${jobKey}`)
    await kv.del(jobKey)

    // Update the job index for this business
    const jobsKey = `jobs:${businessId}`
    console.log(`Updating job index at key: ${jobsKey}`)

    const existingJobsData = await kv.get(jobsKey)
    let existingJobs: string[] = []

    // Ensure we have a proper array
    if (existingJobsData) {
      if (Array.isArray(existingJobsData)) {
        existingJobs = existingJobsData
      } else if (typeof existingJobsData === "string") {
        try {
          const parsed = JSON.parse(existingJobsData)
          if (Array.isArray(parsed)) {
            existingJobs = parsed
          } else {
            console.error(`Expected array but got: ${typeof parsed}`, parsed)
            existingJobs = []
          }
        } catch (parseError) {
          console.error("Error parsing existing jobs data:", parseError)
          existingJobs = []
        }
      } else {
        console.error(`Unexpected data type for jobs index: ${typeof existingJobsData}`, existingJobsData)
        existingJobs = []
      }
    }

    // Filter out the job ID we want to remove
    const updatedJobs = existingJobs.filter((id) => id !== jobId)

    // Log what we're doing for debugging
    console.log(`Before removal: ${existingJobs.length} jobs, After removal: ${updatedJobs.length} jobs`)
    console.log(`Existing jobs:`, existingJobs)
    console.log(`Updated jobs:`, updatedJobs)

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

// Helper function to check if a job is expired (using local timezone like coupons)
export async function isJobExpired(job: JobListing): Promise<boolean> {
  let expirationDate: Date

  if (job.expiresAt) {
    expirationDate = new Date(job.expiresAt)
  } else {
    // Calculate expiration from creation date if expiresAt is missing
    const createdDate = job.createdAt ? new Date(job.createdAt) : new Date()
    expirationDate = new Date(createdDate)
    expirationDate.setDate(expirationDate.getDate() + 5)
  }

  // Set expiration to END of day in local timezone
  expirationDate.setHours(23, 59, 59, 999)

  // Get today's date at start of day in local time
  const today = new Date()

  // Only expired if current time is after the end of expiration day
  return today > expirationDate
}

// Helper function to get days until expiration (using local timezone like coupons)
export async function getDaysUntilExpiration(job: JobListing): Promise<number> {
  let expirationDate: Date

  if (job.expiresAt) {
    expirationDate = new Date(job.expiresAt)
  } else {
    // Calculate expiration from creation date if expiresAt is missing
    const createdDate = job.createdAt ? new Date(job.createdAt) : new Date()
    expirationDate = new Date(createdDate)
    expirationDate.setDate(expirationDate.getDate() + 5)
  }

  // Get today's date at start of day in local time
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Set expiration date to start of day in local time for comparison
  const expDate = new Date(expirationDate)
  expDate.setHours(0, 0, 0, 0)

  // Calculate difference in days
  const diffTime = expDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Function to renew a job listing
export async function renewJobListing(
  businessId: string,
  jobId: string,
): Promise<{ success: boolean; message: string }> {
  try {
    if (!businessId || !jobId) {
      return {
        success: false,
        message: "Missing business ID or job ID",
      }
    }

    // Get the existing job
    const jobKey = `job:${businessId}:${jobId}`
    const jobData = await kv.get(jobKey)

    if (!jobData) {
      return {
        success: false,
        message: "Job listing not found",
      }
    }

    let job: JobListing
    if (typeof jobData === "string") {
      job = JSON.parse(jobData) as JobListing
    } else {
      job = jobData as JobListing
    }

    // Set new expiration date (5 days from now)
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 5)

    // Update the job
    const updatedJob: JobListing = {
      ...job,
      expiresAt: newExpiresAt.toISOString(),
      isExpired: false,
      updatedAt: new Date().toISOString(),
    }

    // Save back to Redis
    await kv.set(jobKey, JSON.stringify(updatedJob))

    // Revalidate paths
    revalidatePath("/job-listings")
    revalidatePath("/ad-design/customize")
    revalidatePath("/statistics")
    revalidatePath(`/business/${businessId}`)

    return {
      success: true,
      message: "Job listing renewed successfully! It will be active for another 5 days.",
    }
  } catch (error) {
    console.error("Error renewing job listing:", error)
    return {
      success: false,
      message: "Failed to renew job listing. Please try again.",
    }
  }
}

// Function to get active (non-expired) jobs for ad display
export async function getActiveBusinessJobs(businessId: string): Promise<JobListing[]> {
  try {
    const allJobs = await getBusinessJobs(businessId)

    // Filter out expired jobs and update their status
    const activeJobs: JobListing[] = []
    const expiredJobs: JobListing[] = []

    for (const job of allJobs) {
      const expired = await isJobExpired(job)
      if (expired) {
        // Mark as expired if not already
        if (!job.isExpired) {
          const updatedJob = { ...job, isExpired: true, updatedAt: new Date().toISOString() }
          const jobKey = `job:${businessId}:${job.id}`
          await kv.set(jobKey, JSON.stringify(updatedJob))
          expiredJobs.push(updatedJob)
        } else {
          expiredJobs.push(job)
        }
      } else {
        activeJobs.push(job)
      }
    }

    return activeJobs
  } catch (error) {
    console.error("Error getting active business jobs:", error)
    return []
  }
}

// NEW: Function to search jobs by ZIP code
export async function searchJobsByZipCode(zipCode: string): Promise<JobListing[]> {
  try {
    console.log(`=== searchJobsByZipCode called for zip: ${zipCode} ===`)
    const jobs: JobListing[] = []

    // Get jobs that serve this specific ZIP code
    const jobIds = await kv.smembers(`zipcode:${zipCode}:jobs`)
    console.log(`Found ${jobIds.length} job IDs for zip code ${zipCode}:`, jobIds)

    // Get nationwide jobs
    const nationwideJobIds = await kv.smembers("jobs:nationwide")
    console.log(`Found ${nationwideJobIds.length} nationwide job IDs:`, nationwideJobIds)

    // Combine all job IDs
    const allJobIds = [...new Set([...jobIds, ...nationwideJobIds])]
    console.log(`Total unique job IDs to process: ${allJobIds.length}`)

    for (const jobRef of allJobIds) {
      const [businessId, jobId] = jobRef.split(":")
      const jobKey = `job:${businessId}:${jobId}`
      console.log(`Fetching job data for key: ${jobKey}`)

      const jobData = await kv.get(jobKey)

      if (jobData) {
        try {
          let job: JobListing
          if (typeof jobData === "string") {
            job = JSON.parse(jobData) as JobListing
          } else {
            job = jobData as JobListing
          }

          // Ensure categories is always an array
          if (!job.categories || !Array.isArray(job.categories)) {
            job.categories = []
          }

          console.log(`Job "${job.jobTitle}" has categories: [${job.categories.join(", ")}]`)

          // Only include active (non-expired) jobs
          const expired = await isJobExpired(job)
          if (!expired) {
            jobs.push(job)
            console.log(`✅ Added active job: "${job.jobTitle}"`)
          } else {
            console.log(`❌ Skipped expired job: "${job.jobTitle}"`)
          }
        } catch (error) {
          console.error(`Error parsing job data for ${jobRef}:`, error)
        }
      } else {
        console.log(`❌ No job data found for key: ${jobKey}`)
      }
    }

    console.log(`=== searchJobsByZipCode completed: ${jobs.length} active jobs found ===`)
    return jobs.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  } catch (error) {
    console.error("Error searching jobs by ZIP code:", error)
    return []
  }
}

// Add this new function at the end of the file

// Function to search jobs by ZIP code and optional category
export async function searchJobsByZipCodeAndCategory(zipCode: string, category?: string): Promise<JobListing[]> {
  try {
    console.log(`=== searchJobsByZipCodeAndCategory called ===`)
    console.log(`Zip Code: ${zipCode}`)
    console.log(`Category: ${category}`)

    // First get all jobs for this ZIP code
    const jobs = await searchJobsByZipCode(zipCode)
    console.log(`Found ${jobs.length} total jobs in zip code ${zipCode}`)

    // If no category specified, return all jobs
    if (!category) {
      console.log("No category specified, returning all jobs")
      return jobs
    }

    console.log(`Filtering jobs by category: "${category}"`)

    // Log all job categories for debugging
    jobs.forEach((job, index) => {
      console.log(`Job ${index + 1}: "${job.jobTitle}" - Categories: [${job.categories?.join(", ") || "none"}]`)
    })

    // Filter by category if specified - use more flexible matching
    const filteredJobs = jobs.filter((job) => {
      // Check if job has categories and if the specified category is included
      if (!job.categories || !Array.isArray(job.categories)) {
        console.log(`Job "${job.jobTitle}" has no categories, skipping`)
        return false
      }

      const categoryMatch = job.categories.some((cat) => {
        const jobCat = cat.toLowerCase().trim()
        const searchCat = category.toLowerCase().trim()

        console.log(`Comparing job category "${jobCat}" with search category "${searchCat}"`)

        // Exact match
        if (jobCat === searchCat) {
          console.log(`✅ Exact match found: "${jobCat}" === "${searchCat}"`)
          return true
        }

        // Partial matches
        if (jobCat.includes(searchCat) || searchCat.includes(jobCat)) {
          console.log(`✅ Partial match found: "${jobCat}" includes "${searchCat}"`)
          return true
        }

        // Handle common category variations
        const categoryMappings: Record<string, string[]> = {
          "office work": ["administrative", "clerical", "customer service", "data entry", "receptionist"],
          "factory work": ["manufacturing", "assembly", "production", "warehouse", "packaging"],
          "manual labor": ["construction", "landscaping", "moving", "labor", "maintenance"],
          medical: ["healthcare", "nursing", "medical", "hospital", "clinic"],
          "non-medical care givers": ["childcare", "elderly care", "companion", "caregiver", "babysitter"],
          "food service": ["restaurant", "kitchen", "server", "cook", "food prep", "hospitality"],
          retail: ["sales", "cashier", "store", "customer service", "merchandising"],
          transportation: ["driver", "delivery", "logistics", "trucking", "courier"],
          technology: ["it", "software", "computer", "tech", "programming", "developer"],
          education: ["teacher", "tutor", "instructor", "education", "school"],
          "professional services": ["legal", "accounting", "consulting", "finance", "business"],
          "skilled trades": ["electrician", "plumber", "carpenter", "hvac", "mechanic"],
          "arts & entertainment": ["creative", "design", "music", "art", "media", "entertainment"],
          "protection services": ["security", "guard", "safety", "law enforcement"],
          "agriculture & animal care": ["farm", "veterinary", "animal", "agriculture", "livestock"],
          "charity services": ["nonprofit", "volunteer", "community", "social services"],
          "part-time & seasonal": ["temporary", "seasonal", "part-time", "contract"],
        }

        // Check if the search category has mapped keywords
        const mappedKeywords = categoryMappings[searchCat] || []
        if (mappedKeywords.some((keyword) => jobCat.includes(keyword))) {
          console.log(`✅ Keyword match found: "${jobCat}" matches keyword for "${searchCat}"`)
          return true
        }

        // Check reverse mapping
        for (const [key, keywords] of Object.entries(categoryMappings)) {
          if (keywords.includes(searchCat) && jobCat.includes(key)) {
            console.log(`✅ Reverse mapping match: "${jobCat}" includes "${key}" for search "${searchCat}"`)
            return true
          }
        }

        console.log(`❌ No match: "${jobCat}" vs "${searchCat}"`)
        return false
      })

      if (categoryMatch) {
        console.log(`✅ Job "${job.jobTitle}" matches category "${category}"`)
      } else {
        console.log(`❌ Job "${job.jobTitle}" does not match category "${category}"`)
      }

      return categoryMatch
    })

    console.log(`Final result: ${filteredJobs.length} jobs matching category "${category}" in zip ${zipCode}`)
    return filteredJobs
  } catch (error) {
    console.error("Error searching jobs by ZIP code and category:", error)
    return []
  }
}

// Function to get all job categories with counts
export async function getJobCategories(): Promise<{ category: string; count: number }[]> {
  try {
    // Get all business IDs with jobs
    const businessIds = await listBusinessesWithJobs()

    // Track categories and their counts
    const categoryMap = new Map<string, number>()

    // Process each business's jobs
    for (const businessId of businessIds) {
      const jobs = await getActiveBusinessJobs(businessId)

      // Count each category
      for (const job of jobs) {
        if (job.categories && Array.isArray(job.categories)) {
          for (const category of job.categories) {
            const currentCount = categoryMap.get(category) || 0
            categoryMap.set(category, currentCount + 1)
          }
        }
      }
    }

    // Convert map to array of objects
    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count) // Sort by count descending
  } catch (error) {
    console.error("Error getting job categories:", error)
    return []
  }
}

// Function to search jobs by category
export async function searchJobsByCategory(category: string): Promise<JobListing[]> {
  try {
    const jobs: JobListing[] = []
    const categoryKey = category.toLowerCase().replace(/\s+/g, "-")

    // Get jobs for this category
    const jobIds = await kv.smembers(`category:${categoryKey}:jobs`)

    for (const jobRef of jobIds) {
      const [businessId, jobId] = jobRef.split(":")
      const jobKey = `job:${businessId}:${jobId}`
      const jobData = await kv.get(jobKey)

      if (jobData) {
        try {
          let job: JobListing
          if (typeof jobData === "string") {
            job = JSON.parse(jobData) as JobListing
          } else {
            job = jobData as JobListing
          }

          // Ensure categories is always an array
          if (!job.categories || !Array.isArray(job.categories)) {
            job.categories = []
          }

          // Only include active (non-expired) jobs
          const expired = await isJobExpired(job)
          if (!expired) {
            jobs.push(job)
          }
        } catch (error) {
          console.error(`Error parsing job data for ${jobRef}:`, error)
        }
      }
    }

    return jobs.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  } catch (error) {
    console.error("Error searching jobs by category:", error)
    return []
  }
}
