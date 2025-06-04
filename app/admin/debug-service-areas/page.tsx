"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { debugServiceAreas, expandServiceAreaForBusiness } from "@/app/actions/debug-service-areas"

export default function DebugServiceAreasPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [businessId, setBusinessId] = useState("1af77ee9-e673-4942-a4a8-8764f183f19d")
  const [zipCode, setZipCode] = useState("44718")

  const handleDebug = async () => {
    setLoading(true)
    try {
      const result = await debugServiceAreas()
      setResult(result)
      console.log("Debug complete - check browser console for details")
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleExpandServiceArea = async () => {
    setLoading(true)
    try {
      const result = await expandServiceAreaForBusiness(businessId, zipCode)
      setResult(result)
    } catch (error) {
      setResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Service Areas</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug All Service Areas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This will check all businesses and their service areas. Check the browser console for detailed output.
            </p>
            <Button onClick={handleDebug} disabled={loading}>
              {loading ? "Debugging..." : "Debug Service Areas"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expand Service Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Business ID</label>
                <Input
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder="Enter business ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code to Add</label>
                <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Enter ZIP code" />
              </div>
              <Button onClick={handleExpandServiceArea} disabled={loading}>
                {loading ? "Expanding..." : "Add ZIP Code to Service Area"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
