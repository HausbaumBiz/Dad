"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  fixAutomotiveEtcCategories,
  fixSpecificAutomotiveEtcBusiness,
} from "@/app/actions/fix-automotive-etc-categories"
import { Loader2 } from "lucide-react"

export default function FixAutomotiveEtcPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [businessId, setBusinessId] = useState("")
  const [specificLoading, setSpecificLoading] = useState(false)
  const [specificResult, setSpecificResult] = useState<any>(null)

  const handleFixAll = async () => {
    setLoading(true)
    try {
      const result = await fixAutomotiveEtcCategories()
      setResult(result)
    } catch (error) {
      console.error("Error fixing automotive etc categories:", error)
      setResult({
        success: false,
        message: "An error occurred while fixing automotive etc categories",
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
      const result = await fixSpecificAutomotiveEtcBusiness(businessId)
      setSpecificResult(result)
    } catch (error) {
      console.error(`Error fixing automotive etc category for business ${businessId}:`, error)
      setSpecificResult({
        success: false,
        message: `An error occurred while fixing automotive etc category for business ${businessId}`,
        error: error.message,
      })
    } finally {
      setSpecificLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Fix Automotive/Motorcycle/RV, etc Categories</h1>
      <p className="text-gray-600 mb-6">
        This tool specifically fixes businesses with the "Automotive/Motorcycle/RV, etc" category format that aren't
        showing up on the automotive-services page.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fix All Businesses</CardTitle>
            <CardDescription>
              Scan all businesses and fix those with the "Automotive/Motorcycle/RV, etc" category format.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              This operation will scan all businesses in the database and ensure that any with the
              "Automotive/Motorcycle/RV, etc" category format are properly indexed under all automotive category
              formats.
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
            <CardDescription>Fix a specific business with the automotive etc category format.</CardDescription>
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
                  <h3 className="font-medium mb-2">Fixed Businesses:</h3>
                  <div className="max-h-96 overflow-y-auto border rounded-md">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Business
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subcategories
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
                              <div className="text-sm text-gray-900">{detail.category || "None"}</div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="text-sm text-gray-900">
                                {detail.allSubcategories && detail.allSubcategories.length > 0
                                  ? detail.allSubcategories.join(", ")
                                  : detail.subcategory || "None"}
                              </div>
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

              {specificResult.details && (
                <div className="mt-4 bg-white p-4 rounded border">
                  <h3 className="font-medium mb-2">Business Details:</h3>
                  <p>
                    <strong>Name:</strong> {specificResult.details.name}
                  </p>
                  <p>
                    <strong>ID:</strong> {specificResult.details.id}
                  </p>
                  <p>
                    <strong>Category:</strong> {specificResult.details.category || "None"}
                  </p>
                  <p>
                    <strong>Subcategory:</strong> {specificResult.details.subcategory || "None"}
                  </p>
                  {specificResult.details.allSubcategories && (
                    <p>
                      <strong>All Subcategories:</strong> {specificResult.details.allSubcategories.join(", ") || "None"}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
