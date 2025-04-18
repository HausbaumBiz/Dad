import { notFound } from "next/navigation"
import Link from "next/link"
import { getBusinessById } from "@/app/actions/business-actions"
import { formatDistanceToNow } from "date-fns"

export const metadata = {
  title: "Business Details",
  description: "View and manage business details",
}

export default async function BusinessDetailPage({ params }: { params: { id: string } }) {
  const business = await getBusinessById(params.id)

  if (!business) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/admin/businesses" className="text-blue-600 hover:text-blue-800 mr-4">
          ← Back to Businesses
        </Link>
        <h1 className="text-3xl font-bold">{business.businessName}</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Business Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Business Name</p>
                  <p className="font-medium">{business.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{business.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Zip Code</p>
                  <p className="font-medium">{business.zipCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Verification</p>
                  <p className="font-medium">
                    {business.isEmailVerified ? (
                      <span className="text-green-600">Verified</span>
                    ) : (
                      <span className="text-yellow-600">Pending Verification</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registered</p>
                  <p className="font-medium">
                    {formatDistanceToNow(new Date(business.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Owner Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">
                    {business.firstName} {business.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact Email</p>
                  <p className="font-medium">{business.email}</p>
                </div>
                {business.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{business.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                Edit Business
              </button>
              {!business.isEmailVerified && (
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                  Verify Email
                </button>
              )}
              <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                Delete Business
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
