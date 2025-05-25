"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { debugBusinessCategories } from "./actions"

export default function DebugBusinessCategoriesPage() {
  const [businessId, setBusinessId] = useState("c205f900-0ea1-4462-9f7c-dff8fa73ee9e")
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleDebug = async () => {
    if (!businessId.trim()) return

    setLoading(true)
    try {
      const result = await debugBusinessCategories(businessId)
      setDebugData(result)
    } catch (error) {
      console.error("Debug error:", error)
      setDebugData({ error: "Failed to debug business categories" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Debug Business Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Business ID"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleDebug} disabled={loading}>
              {loading ? "Debugging..." : "Debug"}
            </Button>
          </div>

          {debugData && (
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Debug Results:</h3>
                <pre className="text-sm overflow-auto max-h-96">{JSON.stringify(debugData, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
