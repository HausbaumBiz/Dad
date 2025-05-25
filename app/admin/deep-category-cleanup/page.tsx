"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Trash2, AlertTriangle, CheckCircle, Search, Database, RefreshCw } from "lucide-react"
import { analyzeBusinessDeepCleanup, performDeepCategoryCleanup, type BusinessDeepCleanupAnalysis } from "./actions"

export default function DeepCategoryCleanupPage() {
  const [businessId, setBusinessId] = useState("213141c4-9616-416e-84ad-a58b81fe3f8c")
  const [analysis, setAnalysis] = useState<BusinessDeepCleanupAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cleanupResult, setCleanupResult] = useState<{
    success: boolean
    message: string
    details: string[]
  } | null>(null)

  const runAnalysis = async () => {
    if (!businessId.trim()) return

    setAnalyzing(true)
    setProgress(0)
    setAnalysis(null)
    setCleanupResult(null)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const result = await analyzeBusinessDeepCleanup(businessId.trim())

      clearInterval(progressInterval)
      setProgress(100)
      setAnalysis(result)
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalysis({
        businessId: businessId.trim(),
        businessFound: false,
        businessData: null,
        businessRecordCategories: [],
        redisIndexCategories: [],
        allCategoryKeys: [],
        problematicCategories: [],
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleDeepCleanup = async () => {
    if (!analysis || !businessId.trim()) return

    setCleaning(true)
    setProgress(0)
    setCleanupResult(null)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 95))
      }, 50)

      const result = await performDeepCategoryCleanup(businessId.trim())

      clearInterval(progressInterval)
      setProgress(100)
      setCleanupResult(result)

      // Re-run analysis to show updated state
      if (result.success) {
        setTimeout(() => {
          runAnalysis()
        }, 1000)
      }
    } catch (error) {
      setCleanupResult({
        success: false,
        message: "Deep cleanup operation failed",
        details: [error instanceof Error ? error.message : "Unknown error"],
      })
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Deep Category Cleanup</h1>
          <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
            Back to Admin
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Deep Category Cleanup Tool
            </CardTitle>
            <CardDescription>
              This tool performs a comprehensive cleanup of category data that keeps returning after removal. It cleans
              both Redis indexes AND the business record itself.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>This tool will:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Remove ALL category references from the business record</li>
                  <li>Remove the business from ALL Redis category indexes</li>
                  <li>Clear category-related fields in the business data</li>
                  <li>Prevent categories from being recreated automatically</li>
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
              Step 1: Analyze Business
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
                <Button onClick={runAnalysis} disabled={analyzing || cleaning || !businessId.trim()}>
                  {analyzing ? "Analyzing..." : "Analyze"}
                </Button>
              </div>
            </div>

            {analyzing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">Analyzing category data... {progress}%</p>
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
                Deep Analysis Results
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

                  {/* Categories in Business Record */}
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-blue-800">Categories in Business Record</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.businessRecordCategories.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {analysis.businessRecordCategories.map((category, index) => (
                              <Badge key={index} variant="default" className="bg-blue-600">
                                {category}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-blue-700">
                            These categories are stored in the business record fields (category, subcategory,
                            allCategories, etc.)
                          </p>
                        </div>
                      ) : (
                        <p className="text-blue-700">No categories found in business record</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Categories in Redis Indexes */}
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-orange-800">Redis Category Indexes Containing This Business</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.redisIndexCategories.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {analysis.redisIndexCategories.map((category, index) => (
                              <Badge key={index} variant="outline" className="text-orange-700 border-orange-300">
                                {category}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-orange-700">
                            These Redis category indexes currently contain this business ID
                          </p>
                        </div>
                      ) : (
                        <p className="text-orange-700">No Redis category indexes contain this business</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* All Category Keys Found */}
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="text-purple-800">All Category-Related Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.allCategoryKeys.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {analysis.allCategoryKeys.map((key, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-purple-700 border-purple-300 text-xs"
                              >
                                {key}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-purple-700">
                            All Redis keys that might contain category data for this business
                          </p>
                        </div>
                      ) : (
                        <p className="text-purple-700">No category-related keys found</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Problematic Categories */}
                  {analysis.problematicCategories.length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-red-800 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Problematic Categories (automotive-services, automotive)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {analysis.problematicCategories.map((category, index) => (
                              <Badge key={index} variant="destructive">
                                {category}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-red-700">
                            These are the specific categories that keep returning and will be completely removed
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Deep Cleanup Section */}
        {analysis && analysis.businessFound && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Step 2: Perform Deep Cleanup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>WARNING: This will completely remove ALL category data for this business!</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Clear all category fields in the business record</li>
                    <li>Remove business from ALL Redis category indexes</li>
                    <li>Delete any business-specific category keys</li>
                    <li>Reset category counts to zero</li>
                  </ul>
                  <p className="mt-2 font-semibold">
                    After this cleanup, you'll need to manually re-add any categories you want to keep via the
                    business-focus page.
                  </p>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleDeepCleanup}
                disabled={analyzing || cleaning}
                variant="destructive"
                className="flex items-center gap-2"
              >
                {cleaning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Performing Deep Cleanup...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Perform Deep Cleanup
                  </>
                )}
              </Button>

              {cleaning && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">Performing deep cleanup... {progress}%</p>
                </div>
              )}

              {cleanupResult && (
                <Alert variant={cleanupResult.success ? "default" : "destructive"}>
                  {cleanupResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>
                        <strong>{cleanupResult.success ? "Success" : "Error"}:</strong> {cleanupResult.message}
                      </p>
                      {cleanupResult.details.length > 0 && (
                        <div>
                          <strong>Details:</strong>
                          <ul className="list-disc list-inside mt-1 max-h-40 overflow-y-auto">
                            {cleanupResult.details.map((detail, index) => (
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
      </div>
    </div>
  )
}
