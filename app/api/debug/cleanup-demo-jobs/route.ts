import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"

// List of known demo job titles to remove
const DEMO_JOB_TITLES = [
  "Funeral Director Assistant",
  "Mortuary Technician",
  // Add any other known demo job titles here
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get("businessId")

    if (!businessId) {
      return NextResponse.json({ error: "No business ID provided" }, { status: 400 })
    }

    // Get all job IDs for this business
    const jobsKey = `jobs:${businessId}`
    const jobIds = (await kv.get<string[]>(jobsKey)) || []

    if (jobIds.length === 0) {
      return NextResponse.json({ message: "No jobs found for this business ID", businessId })
    }

    // Track which jobs were removed
    const removedJobs = []
    const remainingJobIds = []

    // Check each job
    for (const jobId of jobIds) {
      const key = `job:${businessId}:${jobId}`
      const jobData = await kv.get(key)

      if (jobData) {
        let job

        if (typeof jobData === "string") {
          job = JSON.parse(jobData)
        } else {
          job = jobData
        }

        // Check if this is a demo job by title
        if (job.jobTitle && DEMO_JOB_TITLES.includes(job.jobTitle)) {
          // This is a demo job - delete it
          await kv.del(key)
          removedJobs.push({
            id: jobId,
            title: job.jobTitle,
          })
        } else {
          // Keep this job
          remainingJobIds.push(jobId)
        }
      }
    }

    // Update the jobs list for this business
    await kv.set(jobsKey, remainingJobIds)

    // Revalidate paths
    revalidatePath("/job-listings")
    revalidatePath("/ad-design/customize")
    revalidatePath(`/business/${businessId}`)
    revalidatePath("/funeral-services")

    return NextResponse.json({
      success: true,
      businessId,
      removedJobs,
      remainingJobCount: remainingJobIds.length,
      message: `Removed ${removedJobs.length} demo jobs for business ID: ${businessId}`,
    })
  } catch (error) {
    console.error("Error in cleanup demo jobs endpoint:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
