"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { rebuildPageMappings } from "@/app/actions/category-actions"
import Link from "next/link"

export default function RebuildPageMappingsClient() {
  const [isRebuilding, setIsRebuilding] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  const handleRebuild = async () => {
    setIsRebuilding(true)
    setResult(null)
    setProgress(0)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 500)

      const rebuildResult = await rebuildPageMappings()

      clearInterval(progressInterval)
      setProgress(100)
      setResult(rebuildResult)
    } catch (error) {
      console.error("Error rebuilding page mappings:", error)
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsRebuilding(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Rebuild Page Mappings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Complete Page Mapping Rebuild</CardTitle>
            <CardDescription>
              This will completely rebuild all business-to-page mappings using the new clean system. All businesses will
              be removed from their current pages and re-mapped based on their selected categories.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-medium text-yellow-800 mb-2">What this does:</h3>
                <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                  <li>Removes all businesses from all existing page mappings</li>
                  <li>Re-analyzes each business's selected categories</li>
                  <li>Maps businesses only to pages that match their categories</li>
                  <li>Ensures businesses appear only on relevant category pages</li>
                  <li>Cleans up any orphaned or incorrect mappings</li>
                </ul>
              </div>

              {isRebuilding && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Rebuilding page mappings...</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>
                </div>
              )}

              <Button onClick={handleRebuild} disabled={isRebuilding} className="w-full">
                {isRebuilding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rebuilding...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start Rebuild
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                If you're experiencing issues with page mappings, use these diagnostic tools to investigate and fix
                specific problems.
              </p>

              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/page-mapping-diagnostics">Page Mapping Diagnostics</Link>
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/admin/diagnose-business-page-mapping">Business Page Mapping Diagnosis</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Rebuild Results</CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">
                  <div className="space-y-2">
                    <p>{result.message}</p>
                    <div className="text-sm">
                      <p>
                        <strong>Businesses processed:</strong> {result.processed}
                      </p>
                      <p>
                        <strong>Successfully mapped:</strong> {result.successfullyMapped}
                      </p>
                      <p>
                        <strong>Errors:</strong> {result.errors}
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            <div className="mt-4 flex gap-4">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
              <Button asChild>
                <a href="/admin/businesses" target="_blank" rel="noopener noreferrer">
                  View Businesses
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Testing Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Run the rebuild process above</li>
            <li>
              <Link href="/admin/page-mapping-diagnostics" className="text-blue-600 hover:underline">
                Use the diagnostics tool
              </Link>{" "}
              to check if businesses are correctly mapped to pages
            </li>
            <li>
              Visit a category page (e.g.,
              <Link href="/automotive-services" className="text-blue-600 hover:underline mx-1">
                automotive-services
              </Link>
              ) to verify businesses are showing up
            </li>
            <li>
              Log in as a business and go to the
              <Link href="/business-focus" className="text-blue-600 hover:underline mx-1">
                business-focus
              </Link>
              page to test category selection
            </li>
            <li>After selecting categories, verify the business appears on the correct pages</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
