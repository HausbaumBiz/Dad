import { NextResponse } from "next/server"
import { kv } from "@/lib/redis"
import { listBusinessesWithJobs, listAllJobKeys, getBusinessJobs } from "@/app/actions/job-actions"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    if (action === "list-keys") {
      // List all job-related keys
      const jobKeys = await listAllJobKeys()
      return NextResponse.json({ jobKeys })
    } else if (action === "list-businesses") {
      // List all businesses with jobs
      const businessIds = await listBusinessesWithJobs()

      // Also get the number of jobs for each business
      const businessJobs = await Promise.all(
        businessIds.map(async (id) => {
          const jobs = await getBusinessJobs(id)
          return {
            businessId: id,
            jobCount: jobs.length,
          }
        }),
      )

      return NextResponse.json({ businessIds, businessJobs })
    } else if (action === "fix-job-lists") {
      // This will scan all job keys and rebuild the jobs:businessId lists
      const jobKeys = await kv.keys("job:*")

      // Group by business ID
      const businessJobs: Record<string, string[]> = {}

      for (const key of jobKeys) {
        // key format is job:businessId:jobId
        const parts = key.split(":")
        if (parts.length !== 3) continue

        const businessId = parts[1]
        const jobId = parts[2]

        if (!businessJobs[businessId]) {
          businessJobs[businessId] = []
        }

        businessJobs[businessId].push(jobId)
      }

      // Update each business's jobs list
      for (const [businessId, jobIds] of Object.entries(businessJobs)) {
        await kv.set(`jobs:${businessId}`, jobIds)
      }

      return NextResponse.json({
        success: true,
        message: "Job lists rebuilt",
        businessCount: Object.keys(businessJobs).length,
        businesses: Object.keys(businessJobs),
        jobCounts: Object.fromEntries(Object.entries(businessJobs).map(([id, jobs]) => [id, jobs.length])),
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Error in fix-jobs endpoint:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
