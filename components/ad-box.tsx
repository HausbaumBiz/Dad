import type React from "react"
import { getActiveBusinessJobs } from "@/app/actions/job-actions"
import { getBusinessAdDesign } from "@/app/actions/business-actions"

// Update the interface to make properties optional and add proper types
interface AdBoxProps {
  business?: any
  title?: string
  description?: string
  businessName?: string
  businessId?: string
  phoneNumber?: string
  address?: string
}

// Update the component to safely handle undefined properties
const AdBox: React.FC<AdBoxProps> = async ({
  business,
  title,
  description,
  businessName,
  businessId,
  phoneNumber,
  address,
}) => {
  let jobs: any[] = []
  let adDesignData: any = null

  // Only try to load jobs and ad design if we have a business or businessId
  if (business?.id || businessId) {
    try {
      const id = business?.id || businessId
      jobs = await getActiveBusinessJobs(id)

      // Get ad design data to access the email from customize page
      adDesignData = await getBusinessAdDesign(id)
    } catch (error) {
      console.error("Error loading business data:", error)
      jobs = []
    }
  }

  // Use provided values or fallback to business object properties
  const displayTitle = title || business?.name || business?.businessName || businessName || "Business Name"
  const displayDescription = description || business?.description || "No description available"
  const displayPhone = phoneNumber || business?.phone || adDesignData?.businessInfo?.phone || ""
  const displayEmail = adDesignData?.businessInfo?.email || business?.email || ""
  const displayAddress = address || (business?.address ? `${business.address}` : "")

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
      <p className="text-gray-600">{displayDescription}</p>
      {displayPhone && <p className="text-sm text-gray-500 mt-2">Phone: {displayPhone}</p>}
      {displayEmail && <p className="text-sm text-gray-500">Email: {displayEmail}</p>}
      {displayAddress && <p className="text-sm text-gray-500">{displayAddress}</p>}
      <p className="text-sm text-gray-500 mt-2">{jobs.length} active job postings</p>
    </div>
  )
}

export { AdBox }
