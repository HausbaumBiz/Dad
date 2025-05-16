"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { fixBusinessCategories } from "../actions/fix-category-indexes"

export default function FixSpecificBusinessPage() {
  const [businessId, setBusinessId] = useState("1744c078-461b-45bc-903e-e0999ac2aa87")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFix = async () => {
    if (!businessId) return

    setLoading(true)
    try {
      const result = await fixBusinessCategories(businessId)
      setResult(result)
    } catch (error) {
      console.error("Error fixing business categories:", error)
      setResult({
        success: false,
        message: `An error occurred: ${error.message}`,
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Fix Specific Business Categories</h1>
      <p className="text-gray-600 mb-6">
        This tool helps fix a specific business that may be showing up in incorrect categories.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Fix Business Categories</CardTitle>
          <CardDescription>Enter a business ID to fix its category assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="Enter business ID"
              className="flex-1"
            />
            <Button onClick={handleFix} disabled={loading || !businessId}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                "Fix Categories"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Fix Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`font-medium ${result.success ? "text-green-700" : "text-red-700"}`}>{result.message}</p>

              {result.businessInfo && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Business Information:</h3>
                  <pre className="text-xs bg-white p-2 rounded border max-h-40 overflow-y-auto">
                    {JSON.stringify(result.businessInfo, null, 2)}
                  </pre>
                </div>
              )}

              {result.categoryIndexesBefore && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Category Indexes Before Fix:</h3>
                  <pre className="text-xs bg-white p-2 rounded border max-h-60 overflow-y-auto">
                    {JSON.stringify(result.categoryIndexesBefore, null, 2)}
                  </pre>
                </div>
              )}

              {result.error && <p className="mt-2 text-sm text-red-600">{result.error}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
