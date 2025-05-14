import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"

export async function GET(request: Request) {
  try {
    // Hardcode the specific business ID that needs cleanup
    const businessId = "1744c078-461b-45bc-903e-e0999ac2aa87"

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
        if (
          job.jobTitle &&
          (job.jobTitle === "Funeral Director Assistant" ||
            job.jobTitle === "Mortuary Technician" ||
            job.jobTitle.includes("Demo") ||
            job.jobTitle.includes("Test") ||
            job.jobTitle.includes("Sample"))
        ) {
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
    console.error("Error in cleanup specific business jobs endpoint:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
