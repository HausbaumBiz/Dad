"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Search, Database, Zap } from "lucide-react"
import { scanAutomotiveCategories, performAggressiveAutomotiveCleanup, type AutomotiveCleanupAnalysis } from "./actions"

export default function AggressiveAutomotiveCleanupPage() {
  const [analysis, setAnalysis] = useState<AutomotiveCleanupAnalysis | null>(null)
  const [scanning, setScanning] = useState(false)
  const [cleaning, setCleaning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [cleanupResult, setCleanupResult] = useState<{
    success: boolean
    message: string
    details: string[]
    removedBusinesses: Array<{ id: string; name: string; reason: string }>
  } | null>(null)

  const runScan = async () => {
    setScanning(true)
    setProgress(0)
    setAnalysis(null)
    setCleanupResult(null)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90))
      }, 100)

      const result = await scanAutomotiveCategories()

      clearInterval(progressInterval)
      setProgress(100)
      setAnalysis(result)
    } catch (error) {
      console.error("Scan failed:", error)
      setAnalysis({
        totalAutomotiveKeys: 0,
        totalBusinessesFound: 0,
        businessesInAutomotive: [],
        suspiciousBusinesses: [],
        automotiveKeys: [],
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setScanning(false)
    }
  }

  const handleAggressiveCleanup = async () => {
    if (!analysis) return

    setCleaning(true)
    setProgress(0)
    setCleanupResult(null)

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 3, 95))
      }, 50)

      const result = await performAggressiveAutomotiveCleanup()

      clearInterval(progressInterval)
      setProgress(100)
      setCleanupResult(result)

      // Re-run scan to show updated state
      if (result.success) {
        setTimeout(() => {
          runScan()
        }, 1000)
      }
    } catch (error) {
      setCleanupResult({
        success: false,
        message: "Aggressive cleanup operation failed",
        details: [error instanceof Error ? error.message : "Unknown error"],
        removedBusinesses: [],
      })
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Aggressive Automotive Cleanup</h1>
          <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
            Back to Admin
          </Button>
        </div>

        {/* Warning Card */}
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <Zap className="h-5 w-5" />
              Aggressive Cleanup Tool
            </CardTitle>
            <CardDescription className="text-red-700">
              This tool performs an extremely thorough cleanup of automotive categories, removing ALL non-automotive
              businesses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>
                  This tool will aggressively remove businesses that don't belong in automotive categories:
                </strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Scans ALL possible automotive category keys</li>
                  <li>Identifies businesses with non-automotive names</li>
                  <li>Removes them from ALL automotive-related indexes</li>
                  <li>Updates business records to remove automotive categories</li>
                  <li>Uses keyword matching to identify misplaced businesses</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Scan Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Step 1: Scan Automotive Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runScan} disabled={scanning || cleaning} className="flex items-center gap-2">
              {scanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Scan All Automotive Categories
                </>
              )}
            </Button>

            {scanning && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">Scanning automotive categories... {progress}%</p>
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
                Scan Results
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.error ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Error during scan: {analysis.error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{analysis.totalAutomotiveKeys}</div>
                      <div className="text-sm text-gray-600">Automotive Keys Found</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{analysis.totalBusinessesFound}</div>
                      <div className="text-sm text-gray-600">Total Businesses</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{analysis.suspiciousBusinesses.length}</div>
                      <div className="text-sm text-gray-600">Suspicious Businesses</div>
                    </div>
                  </div>

                  {/* Automotive Keys */}
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-blue-800">Automotive Category Keys</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysis.automotiveKeys.map((key, index) => (
                          <Badge key={index} variant="outline" className="text-blue-700 border-blue-300">
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* All Businesses in Automotive */}
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-orange-800">All Businesses in Automotive Categories</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysis.businessesInAutomotive.length > 0 ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {analysis.businessesInAutomotive.map((business, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                              <div>
                                <span className="font-medium">{business.name}</span>
                                <span className="text-sm text-gray-500 ml-2">({business.id})</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {business.categories.map((cat, catIndex) => (
                                  <Badge key={catIndex} variant="outline" className="text-xs">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-orange-700">No businesses found in automotive categories</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Suspicious Businesses */}
                  {analysis.suspiciousBusinesses.length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-red-800 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          Suspicious Non-Automotive Businesses
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {analysis.suspiciousBusinesses.map((business, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-white rounded border border-red-200"
                            >
                              <div>
                                <span className="font-medium text-red-800">{business.name}</span>
                                <span className="text-sm text-gray-500 ml-2">({business.id})</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <Badge variant="destructive" className="text-xs">
                                  {business.reason}
                                </Badge>
                                {business.categories.map((cat, catIndex) => (
                                  <Badge key={catIndex} variant="outline" className="text-xs">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Aggressive Cleanup Section */}
        {analysis && !analysis.error && analysis.suspiciousBusinesses.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Step 2: Perform Aggressive Cleanup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>
                    WARNING: This will remove {analysis.suspiciousBusinesses.length} businesses from ALL automotive
                    categories!
                  </strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Remove businesses with health, medical, pest, food, or other non-automotive keywords</li>
                    <li>Clean ALL automotive category indexes</li>
                    <li>Update business records to remove automotive categories</li>
                    <li>This action cannot be easily undone</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleAggressiveCleanup}
                disabled={scanning || cleaning}
                variant="destructive"
                className="flex items-center gap-2"
              >
                {cleaning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Performing Aggressive Cleanup...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Perform Aggressive Cleanup
                  </>
                )}
              </Button>

              {cleaning && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">Performing aggressive cleanup... {progress}%</p>
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

                      {cleanupResult.removedBusinesses.length > 0 && (
                        <div>
                          <strong>Removed Businesses:</strong>
                          <div className="mt-2 max-h-40 overflow-y-auto">
                            {cleanupResult.removedBusinesses.map((business, index) => (
                              <div key={index} className="text-sm p-2 bg-gray-100 rounded mb-1">
                                <span className="font-medium">{business.name}</span>
                                <span className="text-gray-500 ml-2">- {business.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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
