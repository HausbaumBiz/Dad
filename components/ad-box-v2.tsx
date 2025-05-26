"use client"

import React from "react"
import type { Business } from "@/types"
import { getActiveBusinessJobs } from "@/app/actions/job-actions"

interface AdBoxV2Props {
  business: Business
}

const AdBoxV2: React.FC<AdBoxV2Props> = async ({ business }) => {
  const [jobs, setJobs] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    const loadBusinessJobs = async () => {
      try {
        const jobsData = await getActiveBusinessJobs(business.id)
        setJobs(jobsData)
        setLoading(false)
      } catch (error) {
        console.error("Failed to load jobs:", error)
        setLoading(false)
      }
    }

    loadBusinessJobs()
  }, [business.id])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="border p-4 rounded-md shadow-sm">
      <h3 className="text-lg font-semibold mb-2">{business.companyName}</h3>
      <p className="text-gray-600 mb-2">{business.description}</p>
      {jobs.length > 0 ? (
        <ul>
          {jobs.map((job) => (
            <li key={job.id} className="mb-1">
              {job.title} - {job.location}
            </li>
          ))}
        </ul>
      ) : (
        <p>No active jobs available.</p>
      )}
    </div>
  )
}

export default AdBoxV2
