"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { batchDiagnoseBusinesses, batchFixBusinesses } from "../actions/diagnose-page-mapping-actions"
import { Progress } from "@/components/ui/progress"

interface DiagnosisResult {
  businessId: string
  businessName: string
  category: string
  expectedPage: string
  hasIssues: boolean
  issues: string[]
}

export default function BatchDiagnosis() {
  const [isRunning, setIsRunning] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<DiagnosisResult[]>([])
  const [fixResults, setFixResults] = useState<any>(null)

  const handleRunBatchDiagnosis = async () => {
    setIsRunning(true)
    setProgress(0)
    setResults([])
    setFixResults(null)

    try {
      const batchResults = await batchDiagnoseBusinesses((currentProgress) => {
        setProgress(currentProgress)
      })
      setResults(batchResults)
    } catch (error) {
      console.error("Error running batch diagnosis:", error)
    } finally {
      setIsRunning(false)
      setProgress(100)
    }
  }

  const handleFixIssues = async () => {
    if (results.length === 0) return

    setIsFixing(true)
    setProgress(0)
    setFixResults(null)

    try {
      const businessesWithIssues = results.filter((result) => result.hasIssues).map((result) => result.businessId)

      const fixResults = await batchFixBusinesses(businessesWithIssues, (currentProgress) => {
        setProgress(currentProgress)
      })
      setFixResults(fixResults)

      // Re-run diagnosis to update results
      const updatedResults = await batchDiagnoseBusinesses(() => {})
      setResults(updatedResults)
    } catch (error) {
      console.error("Error fixing issues:", error)
    } finally {
      setIsFixing(false)
      setProgress(100)
    }
  }

  const businessesWithIssues = results.filter((result) => result.hasIssues)
  const businessesWithoutIssues = results.filter((result) => !result.hasIssues)

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Batch Diagnosis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={handleRunBatchDiagnosis} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Batch Diagnosis...
                </>
              ) : (
                "Run Batch Diagnosis"
              )}
            </Button>
            {results.length > 0 && businessesWithIssues.length > 0 && (
              <Button onClick={handleFixIssues} disabled={isFixing}>
                {isFixing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fixing Issues...
                  </>
                ) : (
                  `Fix All Issues (${businessesWithIssues.length})`
                )}
              </Button>
            )}
          </div>

          {(isRunning || isFixing) && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-500 text-center">{progress}% Complete</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertTitle className="text-red-800">Businesses with Issues</AlertTitle>
                    <AlertDescription className="text-red-700">
                      {businessesWithIssues.length} businesses have page mapping issues
                    </AlertDescription>
                  </Alert>
                </div>
                <div className="flex-1">
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Businesses without Issues</AlertTitle>
                    <AlertDescription className="text-green-700">
                      {businessesWithoutIssues.length} businesses have correct page mappings
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              {businessesWithIssues.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-2">Businesses with Issues</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Business Name
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Category
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Expected Page
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Issues
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {businessesWithIssues.map((result) => (
                          <tr key={result.businessId}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{result.businessName}</div>
                              <div className="text-xs text-gray-500">{result.businessId}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.category}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.expectedPage || "Unknown"}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <ul className="list-disc list-inside">
                                {result.issues.map((issue, index) => (
                                  <li key={index} className="text-xs">
                                    {issue}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {fixResults && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Fix Results</AlertTitle>
              <AlertDescription className="text-green-700">
                <p>{fixResults.message}</p>
                <p>Successfully fixed: {fixResults.successCount} businesses</p>
                {fixResults.failedCount > 0 && <p>Failed to fix: {fixResults.failedCount} businesses</p>}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
