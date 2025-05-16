"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { fixCategoryMismatches } from "@/app/actions/fix-category-mismatches"

export default function DiagnoseBusinessPage() {
  const [businessId, setBusinessId] = useState("")
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const [fixResult, setFixResult] = useState<any>(null)

  const handleDiagnose = async () => {
    if (!businessId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/debug/business-categories?businessId=${businessId}`)
      const data = await response.json()
      setDiagnosticData(data)
    } catch (error) {
      console.error("Error diagnosing business:", error)
      setDiagnosticData({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const handleFix = async () => {
    if (!businessId) return

    setFixing(true)
    try {
      const result = await fixCategoryMismatches(businessId)
      setFixResult(result)

      // Refresh diagnostic data
      await handleDiagnose()
    } catch (error) {
      console.error("Error fixing business:", error)
      setFixResult({
        success: false,
        message: "An error occurred while fixing the business",
        error: error.message,
      })
    } finally {
      setFixing(false)
    }
  }

  // Helper function to determine if business is in a category
  const isInCategory = (categoryType) => {
    if (!diagnosticData?.categoryIndexes?.[categoryType]) return false

    const categoryChecks = diagnosticData.categoryIndexes[categoryType]
    return Object.values(categoryChecks).some((value) => value === true)
  }

  const isInArtsCategory = isInCategory("arts")
  const isInAutomotiveCategory = isInCategory("automotive")

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Diagnose Business Categories</h1>
      <p className="text-gray-600 mb-6">
        This tool helps diagnose and fix issues with business categories, particularly when a business is showing up in
        the wrong category.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Diagnose Business</CardTitle>
          <CardDescription>Enter a business ID to diagnose its category assignments.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              value={businessId}
              onChange={(e) => setBusinessId(e.target.value)}
              placeholder="Enter business ID"
              className="flex-1"
            />
            <Button onClick={handleDiagnose} disabled={loading || !businessId}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Diagnosing...
                </>
              ) : (
                "Diagnose"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {diagnosticData && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent>
            {diagnosticData.error ? (
              <div className="p-4 bg-red-50 rounded-md">
                <p className="text-red-700">{diagnosticData.error}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Business Information</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p>
                      <strong>ID:</strong> {diagnosticData.business?.id}
                    </p>
                    <p>
                      <strong>Name:</strong> {diagnosticData.business?.name}
                    </p>
                    <p>
                      <strong>Primary Category:</strong> {diagnosticData.business?.category}
                    </p>
                    <p>
                      <strong>Primary Subcategory:</strong> {diagnosticData.business?.subcategory}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Category Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-md ${isInArtsCategory ? "bg-yellow-50 border border-yellow-200" : "bg-gray-50"}`}
                    >
                      <h4 className="font-medium mb-2">Arts & Entertainment Category</h4>
                      <p>
                        {isInArtsCategory ? "✓ Business is in this category" : "✗ Business is not in this category"}
                      </p>
                    </div>

                    <div
                      className={`p-4 rounded-md ${isInAutomotiveCategory ? "bg-green-50 border border-green-200" : "bg-gray-50"}`}
                    >
                      <h4 className="font-medium mb-2">Automotive Category</h4>
                      <p>
                        {isInAutomotiveCategory
                          ? "✓ Business is in this category"
                          : "✗ Business is not in this category"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">All Categories</h3>
                  <div className="bg-gray-50 p-4 rounded-md max-h-40 overflow-y-auto">
                    <pre className="text-xs">{JSON.stringify(diagnosticData.allCategories, null, 2)}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">All Subcategories</h3>
                  <div className="bg-gray-50 p-4 rounded-md max-h-40 overflow-y-auto">
                    <pre className="text-xs">{JSON.stringify(diagnosticData.allSubcategories, null, 2)}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Category Indexes</h3>
                  <div className="bg-gray-50 p-4 rounded-md max-h-60 overflow-y-auto">
                    <pre className="text-xs">{JSON.stringify(diagnosticData.categoryIndexes, null, 2)}</pre>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-2">Fix Issues</h3>
                  <p className="mb-4 text-sm text-gray-600">
                    If this business is showing in the wrong category, you can fix it by clicking the button below. This
                    will ensure the business is properly categorized based on its subcategories.
                  </p>
                  <Button onClick={handleFix} disabled={fixing}>
                    {fixing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      "Fix Category Issues"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {fixResult && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Fix Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`p-4 rounded-md ${fixResult.success ? "bg-green-50" : "bg-red-50"}`}>
              <p className={`font-medium ${fixResult.success ? "text-green-700" : "text-red-700"}`}>
                {fixResult.message}
              </p>

              {fixResult.error && <p className="mt-2 text-sm text-red-600">{fixResult.error}</p>}

              {fixResult.details && fixResult.details.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Details:</h3>
                  <pre className="text-xs bg-white p-2 rounded border max-h-40 overflow-y-auto">
                    {JSON.stringify(fixResult.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
