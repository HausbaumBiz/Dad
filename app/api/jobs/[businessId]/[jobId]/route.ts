import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@/lib/redis"

export async function GET(request: NextRequest, { params }: { params: { businessId: string; jobId: string } }) {
  try {
    const { businessId, jobId } = params

    if (!businessId || !jobId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log(`API: Fetching job details for business: ${businessId}, job: ${jobId}`)

    // Fetch the job from Redis
    const jobKey = `job:${businessId}:${jobId}`
    const jobData = await kv.get(jobKey)

    if (!jobData) {
      console.log(`API: Job not found at key: ${jobKey}`)
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Parse the job data if it's a string
    let job
    if (typeof jobData === "string") {
      try {
        job = JSON.parse(jobData)
      } catch (parseError) {
        console.error("API: Error parsing job data:", parseError)
        return NextResponse.json({ error: "Invalid job data format" }, { status: 500 })
      }
    } else {
      job = jobData
    }

    console.log(`API: Successfully retrieved job: ${job.jobTitle}`)
    return NextResponse.json({ job })
  } catch (error) {
    console.error("API: Error fetching job:", error)
    return NextResponse.json(
      { error: `Failed to fetch job details: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
