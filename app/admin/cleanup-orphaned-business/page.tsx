"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { removeOrphanedBusiness, findAndCleanupOrphanedBusinesses } from "@/app/actions/cleanup-orphaned-business"

export default function CleanupOrphanedBusinessPage() {
  const [businessId, setBusinessId] = useState("1744c078-461b-45bc-903e-e0999ac2aa87")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)

  const handleRemoveSpecific = async () => {
    if (!businessId.trim()) {
      alert("Please enter a business ID")
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await removeOrphanedBusiness(businessId.trim())
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        removedFrom: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleScanAndCleanup = async () => {
    setScanLoading(true)
    setScanResult(null)

    try {
      const response = await findAndCleanupOrphanedBusinesses()
      setScanResult(response)
    } catch (error) {
      setScanResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        orphanedBusinesses: [],
        cleanedUp: [],
      })
    } finally {
      setScanLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Cleanup Orphaned Business Data</h1>

      <div className="grid gap-6">
        {/* Remove Specific Business */}
        <Card>
          <CardHeader>
            <CardTitle>Remove Specific Business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Business ID"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleRemoveSpecific} disabled={loading}>
                {loading ? "Removing..." : "Remove Business"}
              </Button>
            </div>

            {result && (
              <div
                className={`p-4 rounded-md ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
              >
                <p className="font-medium">{result.message}</p>
                {result.removedFrom && result.removedFrom.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Removed from:</p>
                    <ul className="text-sm list-disc list-inside">
                      {result.removedFrom.map((location: string, index: number) => (
                        <li key={index}>{location}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scan and Cleanup All */}
        <Card>
          <CardHeader>
            <CardTitle>Scan and Cleanup All Orphaned Businesses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleScanAndCleanup} disabled={scanLoading}>
              {scanLoading ? "Scanning..." : "Scan and Cleanup All"}
            </Button>

            {scanResult && (
              <div
                className={`p-4 rounded-md ${scanResult.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}
              >
                <p className="font-medium">{scanResult.message}</p>

                {scanResult.orphanedBusinesses && scanResult.orphanedBusinesses.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Orphaned Business IDs Found:</p>
                    <ul className="text-sm list-disc list-inside">
                      {scanResult.orphanedBusinesses.map((id: string, index: number) => (
                        <li key={index} className="font-mono">
                          {id}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {scanResult.cleanedUp && scanResult.cleanedUp.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Successfully Cleaned Up:</p>
                    <ul className="text-sm list-disc list-inside">
                      {scanResult.cleanedUp.map((id: string, index: number) => (
                        <li key={index} className="font-mono">
                          {id}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
