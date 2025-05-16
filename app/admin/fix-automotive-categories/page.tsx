"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { fixAutomotiveCategories, fixSpecificAutomotiveBusiness } from "@/app/actions/fix-automotive-categories"
import { Loader2 } from "lucide-react"

export default function FixAutomotiveCategoriesPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [businessId, setBusinessId] = useState("")
  const [specificLoading, setSpecificLoading] = useState(false)
  const [specificResult, setSpecificResult] = useState<any>(null)

  const handleFixAll = async () => {
    setLoading(true)
    try {
      const result = await fixAutomotiveCategories()
      setResult(result)
    } catch (error) {
      console.error("Error fixing automotive categories:", error)
      setResult({
        success: false,
        message: "An error occurred while fixing automotive categories",
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
      const result = await fixSpecificAutomotiveBusiness(businessId)
      setSpecificResult(result)
    } catch (error) {
      console.error(`Error fixing automotive category for business ${businessId}:`, error)
      setSpecificResult({
        success: false,
        message: `An error occurred while fixing automotive category for business ${businessId}`,
        error: error.message,
      })
    } finally {
      setSpecificLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Fix Automotive Categories</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fix All Businesses</CardTitle>
            <CardDescription>
              Scan all businesses and add those with automotive-related categories or subcategories to the automotive
              indexes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This operation will scan all businesses in the database and ensure that any with automotive-related
              categories or subcategories are properly indexed under the automotive category.
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
            <CardDescription>Add a specific business to the automotive indexes.</CardDescription>
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
              {result.fixed !== undefined && (
                <p className="mt-2 text-sm">Fixed {result.fixed} businesses with automotive categories.</p>
              )}
              {result.errors !== undefined && result.errors > 0 && (
                <p className="mt-1 text-sm text-red-600">Encountered {result.errors} errors during processing.</p>
              )}
              {result.error && <p className="mt-2 text-sm text-red-600">{result.error}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {specificResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Specific Business Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md ${specificResult.success ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`font-medium ${specificResult.success ? "text-green-700" : "text-red-700"}`}>
                {specificResult.message}
              </p>
              {specificResult.error && <p className="mt-2 text-sm text-red-600">{specificResult.error}</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
