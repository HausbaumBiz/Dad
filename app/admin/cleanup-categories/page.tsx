"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, AlertTriangle, CheckCircle, Search, Database } from "lucide-react"
import { analyzeCategoryData, cleanupCategories, type AnalysisResult } from "./actions"

export default function CleanupCategoriesPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [showCleanupDialog, setShowCleanupDialog] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cleanupResult, setCleanupResult] = useState<{
    success: boolean
    message: string
    details: string[]
  } | null>(null)

  const runAnalysis = async () => {
    setAnalyzing(true)
    setProgress(0)
    setAnalysisResult(null)
    setCleanupResult(null)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const result = await analyzeCategoryData()

      clearInterval(progressInterval)
      setProgress(100)
      setAnalysisResult(result)
    } catch (error) {
      console.error("Analysis failed:", error)
      setAnalysisResult({
        totalCategoryKeys: 0,
        corruptedKeys: [],
        validKeys: [],
        businessCategories: [],
        orphanedKeys: [],
        recommendations: [`Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`],
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleCleanup = async () => {
    if (!analysisResult) return

    setCleaning(true)
    setShowCleanupDialog(false)
    setProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 95))
      }, 100)

      const result = await cleanupCategories()

      clearInterval(progressInterval)
      setProgress(100)
      setCleanupResult(result)

      // Re-run analysis to show updated state
      setTimeout(() => {
        runAnalysis()
      }, 1000)
    } catch (error) {
      setCleanupResult({
        success: false,
        message: "Cleanup failed",
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
          <h1 className="text-3xl font-bold">Category Data Cleanup</h1>
          <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
            Back to Admin
          </Button>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              About Category Cleanup
            </CardTitle>
            <CardDescription>
              This tool fixes the "t.map is not a function" errors in your Redis database by cleaning up corrupted
              category data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>What this tool does:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Identifies corrupted category indexes causing "t.map is not a function" errors</li>
                  <li>Removes all corrupted category data from Redis</li>
                  <li>Rebuilds category indexes using only valid data from business records</li>
                  <li>Preserves all business data - only cleans category indexes</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Analysis Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Step 1: Analyze Category Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runAnalysis} disabled={analyzing || cleaning} className="flex items-center gap-2">
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Analyze Categories
                </>
              )}
            </Button>

            {analyzing && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">Scanning Redis for category data... {progress}%</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysisResult.totalCategoryKeys}</div>
                      <div className="text-sm text-gray-600">Total Category Keys</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">{analysisResult.corruptedKeys.length}</div>
                      <div className="text-sm text-gray-600">Corrupted Keys</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{analysisResult.validKeys.length}</div>
                      <div className="text-sm text-gray-600">Valid Keys</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">{analysisResult.orphanedKeys.length}</div>
                      <div className="text-sm text-gray-600">Orphaned Keys</div>
                    </CardContent>
                  </Card>
                </div>

                {analysisResult.corruptedKeys.length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-red-800">Corrupted Category Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {analysisResult.corruptedKeys.slice(0, 10).map((key, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="destructive" className="font-mono text-xs">
                              {key.key}
                            </Badge>
                            <span className="text-sm text-red-700">{key.error}</span>
                          </div>
                        ))}
                        {analysisResult.corruptedKeys.length > 10 && (
                          <p className="text-sm text-red-600">
                            ... and {analysisResult.corruptedKeys.length - 10} more corrupted keys
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {analysisResult.businessCategories.length > 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-800">Valid Categories from Businesses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.businessCategories.slice(0, 20).map((category, index) => (
                          <Badge key={index} variant="outline" className="text-green-700">
                            {category}
                          </Badge>
                        ))}
                        {analysisResult.businessCategories.length > 20 && (
                          <Badge variant="secondary">+{analysisResult.businessCategories.length - 20} more</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cleanup Section */}
        {analysisResult && analysisResult.corruptedKeys.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Step 2: Clean Up Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>This will:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Delete {analysisResult.corruptedKeys.length} corrupted category keys</li>
                    <li>Remove {analysisResult.orphanedKeys.length} orphaned category keys</li>
                    <li>
                      Rebuild category indexes from {analysisResult.businessCategories.length} valid business categories
                    </li>
                    <li>Fix all "t.map is not a function" errors</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => setShowCleanupDialog(true)}
                disabled={analyzing || cleaning}
                variant="destructive"
                className="flex items-center gap-2"
              >
                {cleaning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Cleaning...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Clean Up Categories
                  </>
                )}
              </Button>

              {cleaning && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">Cleaning up category data... {progress}%</p>
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
                          <ul className="list-disc list-inside mt-1">
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

        {/* Cleanup Confirmation Dialog */}
        <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Confirm Category Cleanup
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>This will permanently clean up corrupted category data in your Redis database.</p>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <p className="text-sm font-medium text-yellow-800">What will happen:</p>
                  <ul className="text-sm text-yellow-700 list-disc list-inside mt-1">
                    <li>Delete all corrupted category keys</li>
                    <li>Remove orphaned category data</li>
                    <li>Rebuild category indexes from business data</li>
                    <li>Fix "t.map is not a function" errors</li>
                  </ul>
                </div>
                <p className="text-sm text-gray-600">
                  <strong>Note:</strong> This operation is safe and will not affect your business data.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCleanup} className="bg-red-600 hover:bg-red-700">
                Clean Up Categories
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
