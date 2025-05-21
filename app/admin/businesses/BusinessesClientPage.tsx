"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { CopyToClipboard } from "@/components/copy-to-clipboard"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Trash2 } from "lucide-react"
import type { Business } from "@/lib/definitions"
import { getBusinesses, deleteBusiness } from "@/app/actions/business-actions"

export default function BusinessesClientPage() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [businessToDelete, setBusinessToDelete] = useState<Business | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null)
  const [showResultMessage, setShowResultMessage] = useState(false)

  useEffect(() => {
    loadBusinesses()
  }, [])

  async function loadBusinesses() {
    try {
      setIsLoading(true)
      console.log("Fetching businesses...")
      const data = await getBusinesses()
      console.log(`Fetched ${data.length} businesses`)
      setBusinesses(data)
      setError(null)
    } catch (err) {
      console.error("Error loading businesses:", err)
      setError("Failed to load businesses. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (business: Business) => {
    setBusinessToDelete(business)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!businessToDelete) return

    try {
      setIsDeleting(true)
      const result = await deleteBusiness(businessToDelete.id)
      setDeleteResult(result)
      setShowResultMessage(true)

      if (result.success) {
        // Remove the business from the list
        setBusinesses(businesses.filter((b) => b.id !== businessToDelete.id))
      }
    } catch (error) {
      console.error("Error deleting business:", error)
      setDeleteResult({
        success: false,
        message: "An unexpected error occurred while deleting the business.",
      })
      setShowResultMessage(true)
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setBusinessToDelete(null)

      // Hide result message after 5 seconds
      setTimeout(() => {
        setShowResultMessage(false)
        setDeleteResult(null)
      }, 5000)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading businesses...</div>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative my-4" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Business Management</h1>

      {/* Result message */}
      {showResultMessage && deleteResult && (
        <div
          className={`mb-4 p-4 rounded ${deleteResult.success ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}
          role="alert"
        >
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{deleteResult.message}</span>
          </div>
        </div>
      )}

      {businesses.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No businesses registered yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zip Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Verified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {businesses.map((business) => (
                  <tr key={business.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/admin/businesses/${business.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {business.businessName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-mono">{business.id}</span>
                        <CopyToClipboard text={business.id} className="ml-2 text-gray-400 hover:text-gray-600" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {business.firstName} {business.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{business.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{business.zipCode}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {business.isEmailVerified ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {business.createdAt
                        ? formatDistanceToNow(new Date(business.createdAt), { addSuffix: true })
                        : "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/admin/businesses/${business.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(business)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          aria-label={`Delete ${business.businessName}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the business <strong>{businessToDelete?.businessName}</strong>?
              <br />
              <span className="mt-2 block text-red-600 font-medium">This action cannot be undone.</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Business"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
