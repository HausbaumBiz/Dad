"use client"

import { useState, useEffect } from "react"
import { MediaLibrary } from "@/components/media-library"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { getUserSession } from "@/app/actions/user-actions"

export default function MediaLibraryPage() {
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [manualBusinessId, setManualBusinessId] = useState("")
  const router = useRouter()

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getUserSession()
        if (session?.user?.businessId) {
          setBusinessId(session.user.businessId)
        }
      } catch (error) {
        console.error("Error fetching session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [])

  const handleManualEntry = () => {
    if (manualBusinessId.trim()) {
      setBusinessId(manualBusinessId.trim())
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!businessId) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6">Media Library</h1>
          <p className="mb-4 text-gray-600">Please enter your business ID to access your media library.</p>

          <div className="space-y-4">
            <div>
              <label htmlFor="businessId" className="block text-sm font-medium text-gray-700 mb-1">
                Business ID
              </label>
              <Input
                id="businessId"
                value={manualBusinessId}
                onChange={(e) => setManualBusinessId(e.target.value)}
                placeholder="Enter your business ID"
              />
            </div>

            <div className="flex gap-4">
              <Button onClick={handleManualEntry} className="flex-1">
                Continue
              </Button>
              <Button variant="outline" onClick={() => router.push("/business-login")} className="flex-1">
                Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <MediaLibrary businessId={businessId} />
    </div>
  )
}
