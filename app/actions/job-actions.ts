"use server"

import { revalidatePath } from "next/cache"
import { kv } from "@/lib/redis"
import { put } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"

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

  // Categories
  categories: string[]

  // Benefits
  benefits: Record<string, JobBenefit>
}

export async function saveJobListing(
  formData: FormData,
  businessId: string,
): Promise<{ success: boolean; message: string; jobId?: string }> {
  try {
    // Generate a unique ID for the job listing
    const jobId = uuidv4()

    // Parse form data
    const jobData = JSON.parse(formData.get("jobData") as string) as Omit<
      JobListing,
      "id" | "businessId" | "createdAt" | "updatedAt" | "logoUrl"
    >

    // Handle logo upload
    let logoUrl = undefined
    const logoFile = formData.get("logo") as File

    if (logoFile && logoFile.size > 0) {
      try {
        // Upload to Vercel Blob
        const { url } = await put(`job-logos/${businessId}/${jobId}.${getFileExtension(logoFile.name)}`, logoFile, {
          access: "public",
        })
        logoUrl = url
      } catch (error) {
        console.error("Error uploading logo:", error)
      }
    }

    // Create the job listing object
    const jobListing: JobListing = {
      id: jobId,
      businessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logoUrl,
      ...jobData,
    }

    // Save to Redis
    const key = `job:${businessId}:${jobId}`
    await kv.set(key, JSON.stringify(jobListing))

    // Save to job index for this business
    const jobsKey = `jobs:${businessId}`
    const existingJobs = (await kv.get<string[]>(jobsKey)) || []
    await kv.set(jobsKey, [...existingJobs, jobId])

    // Revalidate paths that might display this job
    revalidatePath("/job-listings")
    revalidatePath("/ad-design/customize")

    return {
      success: true,
      message: "Job listing saved successfully!",
      jobId,
    }
  } catch (error) {
    console.error("Error saving job listing:", error)
    return {
      success: false,
      message: "Failed to save job listing. Please try again.",
    }
  }
}

export async function getBusinessJobs(businessId: string): Promise<JobListing[]> {
  try {
    // Get all job IDs for this business
    const jobsKey = `jobs:${businessId}`
    const jobIds = (await kv.get<string[]>(jobsKey)) || []

    if (jobIds.length === 0) {
      return []
    }

    // Fetch each job
    const jobs: JobListing[] = []

    for (const jobId of jobIds) {
      const key = `job:${businessId}:${jobId}`
      const jobData = await kv.get(key) // Remove the type constraint to handle both string and object

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

          // Ensure the job has an id field
          if (!job.id) {
            job.id = jobId
          }

          jobs.push(job)
        } catch (error) {
          console.error(`Error processing job data for ${jobId}:`, error)
        }
      }
    }

    // Sort by creation date (newest first)
    return jobs.sort((a, b) => {
      // Handle missing createdAt fields
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  } catch (error) {
    console.error("Error fetching business jobs:", error)
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
    // Get the key for the specific job
    const jobKey = `job:${businessId}:${jobId}`

    // Delete the job from Redis
    await kv.del(jobKey)

    // Update the job index for this business
    const jobsKey = `jobs:${businessId}`
    const existingJobs = (await kv.get<string[]>(jobsKey)) || []
    const updatedJobs = existingJobs.filter((id) => id !== jobId)
    await kv.set(jobsKey, updatedJobs)

    // Revalidate paths that might display this job
    revalidatePath("/job-listings")
    revalidatePath("/ad-design/customize")
    revalidatePath("/statistics")

    return {
      success: true,
      message: "Job listing removed successfully!",
    }
  } catch (error) {
    console.error("Error removing job listing:", error)
    return {
      success: false,
      message: "Failed to remove job listing. Please try again.",
    }
  }
}
