"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { fixCategoryMismatches } from "@/app/actions/fix-category-mismatches"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function FixCategoryMismatchesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [businessId, setBusinessId] = useState("")
  const [specificLoading, setSpecificLoading] = useState(false)

  const handleFixAll = async () => {
    setLoading(true)
    try {
      const result = await fixCategoryMismatches()
      setResult(result)
    } catch (error) {
      console.error("Error fixing category mismatches:", error)
      setResult({
        success: false,
        message: "An error occurred while fixing category mismatches",
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFixSpecific = async () => {
    if (!businessId) return

    setSpecificLoading(true)
    try {
      const result = await fixCategoryMismatches(businessId)
      setResult(result)
    } catch (error) {
      console.error(`Error fixing category for business ${businessId}:`, error)
      setResult({
        success: false,
        message: `An error occurred while fixing category for business ${businessId}`,
        error: error.message,
      })
    } finally {
      setSpecificLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Fix Category Mismatches</h1>
      <p className="text-gray-600 mb-6">
        This tool fixes businesses that are incorrectly categorized, particularly automotive businesses showing up in
        the arts & entertainment category.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fix All Businesses</CardTitle>
            <CardDescription>Scan all businesses and fix any category mismatches.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This operation will scan all businesses in the database and fix any that are incorrectly categorized,
              particularly automotive businesses showing up in the arts & entertainment category.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleFixAll} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                "Run Fix"
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fix Specific Business</CardTitle>
            <CardDescription>Fix category mismatches for a specific business.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="businessId" className="text-sm font-medium">
                  Business ID
                </label>
                <Input
                  id="businessId"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder="Enter business ID"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleFixSpecific} disabled={specificLoading || !businessId}>
              {specificLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                "Fix Business"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`font-medium ${result.success ? "text-green-700" : "text-red-700"}`}>{result.message}</p>

              {result.error && <p className="mt-2 text-sm text-red-600">{result.error}</p>}

              {result.details && result.details.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Details:</h3>
                  <div className="max-h-96 overflow-y-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Business
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.details.map((detail, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{detail.name || "Unknown"}</div>
                              <div className="text-xs text-gray-500">{detail.id}</div>
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              {detail.error ? (
                                <Badge variant="destructive">Error: {detail.error}</Badge>
                              ) : (
                                <Badge variant="default">{detail.action}</Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
