import type React from "react"
import type { Business } from "@/types"
import { getActiveBusinessJobs } from "@/app/actions/job-actions"

interface AdBoxProps {
  business: Business
}

const AdBox: React.FC<AdBoxProps> = async ({ business }) => {
  const loadBusinessJobs = async (business: Business) => {
    try {
      const jobsData = await getActiveBusinessJobs(business.id)
      return jobsData
    } catch (error) {
      console.error("Error loading jobs:", error)
      return []
    }
  }

  const jobs = await loadBusinessJobs(business)

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">{business.name}</h3>
      <p className="text-gray-600">{business.description}</p>
      <p className="text-sm text-gray-500 mt-2">{jobs.length} active job postings</p>
    </div>
  )
}

export { AdBox }
