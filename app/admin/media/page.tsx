"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { listBusinessBlobs, deleteAllBusinessMedia } from "@/app/actions/media-actions"
import { toast } from "@/components/ui/use-toast"

// Note: Image processing is handled server-side via API routes

export default function AdminMediaPage() {
  const [businessId, setBusinessId] = useState("")
  const [blobs, setBlobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSearch = async () => {
    if (!businessId.trim()) {
      toast({
        title: "Business ID required",
        description: "Please enter a business ID to search for media.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await listBusinessBlobs(businessId)

      if (result.success) {
        setBlobs(result.blobs)

        if (result.blobs.length === 0) {
          toast({
            title: "No media found",
            description: "No media files found for this business ID.",
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to list media files.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAll = async () => {
    if (!businessId.trim()) {
      toast({
        title: "Business ID required",
        description: "Please enter a business ID to delete media.",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Are you sure you want to delete ALL media for this business? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteAllBusinessMedia(businessId)

      if (result.success) {
        setBlobs([])
        toast({
          title: "Media deleted",
          description: "All media files for this business have been deleted.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete media files.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Media Management</h1>

      <Card className="p-6 mb-8">
        <div className="space-y-4">
          <div>
            <Label htmlFor="businessId">Business ID</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="businessId"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                placeholder="Enter business ID"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>

          {blobs.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Media Files ({blobs.length})</h2>
                <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete All Media"}
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filename
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blobs.map((blob) => (
                      <tr key={blob.url}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <a
                            href={blob.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {blob.pathname.split("/").pop()}
                          </a>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatSize(blob.size)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{blob.contentType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(blob.uploadedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
