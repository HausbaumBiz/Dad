import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"

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

    // Get all keys in Redis that match the pattern job:businessId:*
    const keys = await kv.keys(`job:${businessId}:*`)

    // Get all jobs for this business
    const jobs = []
    for (const key of keys) {
      const jobData = await kv.get(key)
      jobs.push({
        key,
        data: jobData,
      })
    }

    // Get all business IDs that have jobs
    const businessKeys = await kv.keys("jobs:*")
    const businessesWithJobs = businessKeys.map((key) => key.replace("jobs:", ""))

    return NextResponse.json({
      businessId,
      jobsKey,
      jobIds,
      jobKeys: keys,
      jobs,
      businessesWithJobs,
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
