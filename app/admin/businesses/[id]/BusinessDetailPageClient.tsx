"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import type { Business } from "@/app/lib/definitions"
import DeleteBusinessButton from "./delete-business-button"

export default function BusinessDetailPageClient({ business }: { business: Business }) {
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
                  <p className="text-sm text-gray-500">Business ID</p>
                  <div className="flex items-center">
                    <p className="font-mono bg-gray-100 px-2 py-1 rounded">{business.id}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(business.id)
                        // You could add a toast notification here
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                      title="Copy ID"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
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
              {!business.isEmailVerified && (
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                  Verify Email
                </button>
              )}
              <DeleteBusinessButton id={business.id} businessName={business.businessName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
