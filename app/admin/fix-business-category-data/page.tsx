"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fixBusinessCategoryData } from "./actions"

export default function FixBusinessCategoryDataPage() {
  const [businessId, setBusinessId] = useState("c205f900-0ea1-4462-9f7c-dff8fa73ee9e")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFix = async () => {
    if (!businessId.trim()) return

    setLoading(true)
    try {
      const result = await fixBusinessCategoryData(businessId)
      setResult(result)
    } catch (error) {
      console.error("Fix error:", error)
      setResult({ success: false, message: "Failed to fix business category data" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Fix Business Category Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Business ID"
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleFix} disabled={loading}>
              {loading ? "Fixing..." : "Fix Category Data"}
            </Button>
          </div>

          {result && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${result.success ? "bg-green-100" : "bg-red-100"}`}>
                <h3 className="font-semibold mb-2">{result.success ? "✅ Success" : "❌ Error"}</h3>
                <p>{result.message}</p>

                {result.data && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Fixed Data:</h4>
                    <pre className="text-sm bg-white p-2 rounded border overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
