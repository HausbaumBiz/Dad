"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trash2, AlertTriangle, CheckCircle, Search, Database } from "lucide-react"
import { analyzeBusinessCategories, fixBusinessCategories, type BusinessCategoryAnalysis } from "./actions"

export default function FixBusinessCategoriesPage() {
  const [businessId, setBusinessId] = useState("1744c078-461b-45bc-903e-e0999ac2aa87")
  const [analysis, setAnalysis] = useState<BusinessCategoryAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [fixResult, setFixResult] = useState<{
    success: boolean
    message: string
    details: string[]
  } | null>(null)

  const runAnalysis = async () => {
    if (!businessId.trim()) return

    setAnalyzing(true)
    setProgress(0)
    setAnalysis(null)
    setFixResult(null)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const result = await analyzeBusinessCategories(businessId.trim())

      clearInterval(progressInterval)
      setProgress(100)
      setAnalysis(result)
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalysis({
        businessId: businessId.trim(),
        businessFound: false,
        businessData: null,
        corruptedKeys: [],
        validKeys: [],
        totalErrors: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleFix = async () => {
    if (!analysis || !businessId.trim()) return

    setFixing(true)
    setProgress(0)
    setFixResult(null)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 95))
      }, 50)

      const result = await fixBusinessCategories(businessId.trim())

      clearInterval(progressInterval)
      setProgress(100)
      setFixResult(result)

      // Re-run analysis to show updated state
      if (result.success) {
        setTimeout(() => {
          runAnalysis()
        }, 1000)
      }
    } catch (error) {
      setFixResult({
        success: false,
        message: "Fix operation failed",
        details: [error instanceof Error ? error.message : "Unknown error"],
      })
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Fix Business Category Errors</h1>
          <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
            Back to Admin
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Fix "t.map is not a function" Errors
            </CardTitle>
            <CardDescription>
              This tool identifies and fixes corrupted category data for a specific business that's causing Redis
              errors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>What this tool does:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Scans all Redis keys related to the business for corruption</li>
                  <li>Identifies keys causing "t.map is not a function" errors</li>
                  <li>Safely removes corrupted category data</li>
                  <li>Preserves valid business data and rebuilds clean category references</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Business Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Step 1: Select Business
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessId">Business ID</Label>
              <div className="flex gap-2">
                <Input
                  id="businessId"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder="Enter business ID..."
                  className="flex-1 font-mono"
                />
                <Button onClick={runAnalysis} disabled={analyzing || fixing || !businessId.trim()}>
                  {analyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </div>

            {analyzing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">Scanning Redis keys for business... {progress}%</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!analysis.businessFound ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Business not found or error occurred: {analysis.error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Business Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <strong>Business Name:</strong> {analysis.businessData?.businessName || "N/A"}
                    </div>
                    <div>
                      <strong>Email:</strong> {analysis.businessData?.email || "N/A"}
                    </div>
                    <div>
                      <strong>City:</strong> {analysis.businessData?.city || "N/A"}
                    </div>
                    <div>
                      <strong>State:</strong> {analysis.businessData?.state || "N/A"}
                    </div>
                  </div>

                  {/* Error Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-red-600">{analysis.totalErrors}</div>
                        <div className="text-sm text-red-700">Total Errors</div>
                      </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-red-600">{analysis.corruptedKeys.length}</div>
                        <div className="text-sm text-red-700">Corrupted Keys</div>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-3xl font-bold text-green-600">{analysis.validKeys.length}</div>
                        <div className="text-sm text-green-700">Valid Keys</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Corrupted Keys Details */}
                  {analysis.corruptedKeys.length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-red-800">Corrupted Keys Found</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {analysis.corruptedKeys.map((key, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 bg-white rounded border">
                              <Badge variant="destructive" className="font-mono text-xs flex-shrink-0">
                                {key.key}
                              </Badge>
                              <span className="text-sm text-red-700 break-all">{key.error}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Valid Keys */}
                  {analysis.validKeys.length > 0 && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-green-800">Valid Keys (Will be preserved)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analysis.validKeys.slice(0, 20).map((key, index) => (
                            <Badge key={index} variant="outline" className="font-mono text-xs text-green-700">
                              {key}
                            </Badge>
                          ))}
                          {analysis.validKeys.length > 20 && (
                            <Badge variant="secondary">+{analysis.validKeys.length - 20} more</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fix Section */}
        {analysis && analysis.businessFound && analysis.corruptedKeys.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Step 2: Fix Corrupted Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>This will:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Delete {analysis.corruptedKeys.length} corrupted Redis keys</li>
                    <li>Clean up all category references causing errors</li>
                    <li>Preserve {analysis.validKeys.length} valid keys</li>
                    <li>Rebuild clean category data from business record</li>
                    <li>Fix all "t.map is not a function" errors for this business</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleFix}
                disabled={analyzing || fixing}
                variant="destructive"
                className="flex items-center gap-2"
              >
                {fixing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Fixing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Fix Corrupted Categories
                  </>
                )}
              </Button>

              {fixing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">Cleaning up corrupted data... {progress}%</p>
                </div>
              )}

              {fixResult && (
                <Alert variant={fixResult.success ? "default" : "destructive"}>
                  {fixResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>
                        <strong>{fixResult.success ? "Success" : "Error"}:</strong> {fixResult.message}
                      </p>
                      {fixResult.details.length > 0 && (
                        <div>
                          <strong>Details:</strong>
                          <ul className="list-disc list-inside mt-1 max-h-40 overflow-y-auto">
                            {fixResult.details.map((detail, index) => (
                              <li key={index} className="text-sm">
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* No Issues Found */}
        {analysis && analysis.businessFound && analysis.corruptedKeys.length === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">No Issues Found</h3>
              <p className="text-green-700">
                This business has no corrupted category data. All Redis keys are working properly.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
