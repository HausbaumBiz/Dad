"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { FolderSyncIcon as Sync, AlertTriangle, CheckCircle, Search, Database, Trash2 } from "lucide-react"
import { analyzeBusinessCategorySync, syncBusinessCategories, type BusinessCategorySyncAnalysis } from "./actions"

export default function SyncBusinessCategoriesPage() {
  const [businessId, setBusinessId] = useState("1744c078-461b-45bc-903e-e0999ac2aa87")
  const [analysis, setAnalysis] = useState<BusinessCategorySyncAnalysis | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    message: string
    details: string[]
  } | null>(null)

  const runAnalysis = async () => {
    if (!businessId.trim()) return

    setAnalyzing(true)
    setProgress(0)
    setAnalysis(null)
    setSyncResult(null)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const result = await analyzeBusinessCategorySync(businessId.trim())

      clearInterval(progressInterval)
      setProgress(100)
      setAnalysis(result)
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalysis({
        businessId: businessId.trim(),
        businessFound: false,
        businessData: null,
        currentCategories: [],
        redisCategories: [],
        categoriesToRemove: [],
        categoriesToKeep: [],
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSync = async () => {
    if (!analysis || !businessId.trim()) return

    setSyncing(true)
    setProgress(0)
    setSyncResult(null)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 95))
      }, 50)

      const result = await syncBusinessCategories(businessId.trim())

      clearInterval(progressInterval)
      setProgress(100)
      setSyncResult(result)

      // Re-run analysis to show updated state
      if (result.success) {
        setTimeout(() => {
          runAnalysis()
        }, 1000)
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: "Sync operation failed",
        details: [error instanceof Error ? error.message : "Unknown error"],
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Sync Business Categories</h1>
          <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
            Back to Admin
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sync className="h-5 w-5" />
              Sync Categories with Business Focus Page
            </CardTitle>
            <CardDescription>
              This tool ensures that only the categories currently selected on the business-focus page are stored in
              Redis. All other categories will be removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>What this tool does:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Reads the current categories from the business record</li>
                  <li>Identifies which categories are stored in Redis category indexes</li>
                  <li>Removes the business from all category indexes except the currently selected ones</li>
                  <li>Cleans up the business record to only contain selected categories</li>
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
                <Button onClick={runAnalysis} disabled={analyzing || syncing || !businessId.trim()}>
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

                  {/* Current Categories (from business record) */}
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-blue-800">
                        Currently Selected Categories (Business Focus Page)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.currentCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {analysis.currentCategories.map((category, index) => (
                            <Badge key={index} variant="default" className="bg-blue-600">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-blue-700">No categories currently selected</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Redis Categories */}
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-orange-800">Categories Found in Redis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.redisCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {analysis.redisCategories.map((category, index) => (
                            <Badge key={index} variant="outline" className="text-orange-700 border-orange-300">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-orange-700">No categories found in Redis</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Categories to Remove */}
                  {analysis.categoriesToRemove.length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-red-800 flex items-center gap-2">
                          <Trash2 className="h-5 w-5" />
                          Categories to Remove
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analysis.categoriesToRemove.map((category, index) => (
                            <Badge key={index} variant="destructive">
                              {category}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-red-700 mt-2">
                          These categories will be removed from Redis as they are not currently selected.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Categories to Keep */}
                  {analysis.categoriesToKeep.length > 0 && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-green-800 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Categories to Keep
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {analysis.categoriesToKeep.map((category, index) => (
                            <Badge key={index} variant="outline" className="text-green-700 border-green-300">
                              {category}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-green-700 mt-2">
                          These categories match the current selection and will be preserved.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sync Section */}
        {analysis && analysis.businessFound && analysis.categoriesToRemove.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sync className="h-5 w-5" />
                Step 2: Sync Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>This will:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Remove business from {analysis.categoriesToRemove.length} category indexes in Redis</li>
                    <li>Keep business in {analysis.categoriesToKeep.length} category indexes</li>
                    <li>Update business record to only contain currently selected categories</li>
                    <li>Clean up category counts and references</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button onClick={handleSync} disabled={analyzing || syncing} className="flex items-center gap-2">
                {syncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Syncing...
                  </>
                ) : (
                  <>
                    <Sync className="h-4 w-4" />
                    Sync Categories
                  </>
                )}
              </Button>

              {syncing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">Syncing categories... {progress}%</p>
                </div>
              )}

              {syncResult && (
                <Alert variant={syncResult.success ? "default" : "destructive"}>
                  {syncResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>
                        <strong>{syncResult.success ? "Success" : "Error"}:</strong> {syncResult.message}
                      </p>
                      {syncResult.details.length > 0 && (
                        <div>
                          <strong>Details:</strong>
                          <ul className="list-disc list-inside mt-1 max-h-40 overflow-y-auto">
                            {syncResult.details.map((detail, index) => (
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

        {/* Already Synced */}
        {analysis && analysis.businessFound && analysis.categoriesToRemove.length === 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">Categories Already Synced</h3>
              <p className="text-green-700">
                The Redis categories already match the categories selected on the business-focus page. No changes
                needed.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
