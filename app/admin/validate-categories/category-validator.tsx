"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { CheckCircle, XCircle, AlertTriangle, Search, RefreshCw, FileCheck, AlertCircle, Wrench } from "lucide-react"
import { validateCategoryIntegrity, fixCategoryIssues, type ValidationResult } from "./actions"

export function CategoryValidator() {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [validating, setValidating] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [showFixDialog, setShowFixDialog] = useState(false)
  const [progress, setProgress] = useState(0)

  const runValidation = async () => {
    setValidating(true)
    setProgress(0)
    setValidationResult(null)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const result = await validateCategoryIntegrity()

      clearInterval(progressInterval)
      setProgress(100)
      setValidationResult(result)
    } catch (error) {
      console.error("Validation failed:", error)
      setValidationResult({
        isValid: false,
        summary: {
          totalBusinesses: 0,
          businessesWithCategories: 0,
          totalCategoryIndexes: 0,
          validIndexes: 0,
          corruptedIndexes: 0,
          orphanedIndexes: 0,
          missingIndexes: 0,
          inconsistentBusinesses: 0,
        },
        issues: [
          {
            type: "critical",
            category: "validation",
            description: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            businessId: null,
            details: {},
          },
        ],
        recommendations: ["Re-run the validation after checking Redis connectivity"],
      })
    } finally {
      setValidating(false)
    }
  }

  const handleFixIssues = async () => {
    if (!validationResult || validationResult.issues.length === 0) return

    setFixing(true)
    setShowFixDialog(false)

    try {
      const result = await fixCategoryIssues()

      // Re-run validation to see the results
      await runValidation()

      // Show success message or updated results
      console.log("Fix completed:", result)
    } catch (error) {
      console.error("Fix failed:", error)
    } finally {
      setFixing(false)
    }
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "info":
        return <AlertCircle className="h-4 w-4 text-blue-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getIssueColor = (type: string) => {
    switch (type) {
      case "critical":
        return "border-red-200 bg-red-50"
      case "warning":
        return "border-yellow-200 bg-yellow-50"
      case "info":
        return "border-blue-200 bg-blue-50"
      default:
        return "border-gray-200 bg-gray-50"
    }
  }

  const getSummaryColor = (isValid: boolean) => {
    return isValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Category Data Integrity Validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This tool validates the integrity and consistency of category data across your Redis database. It checks for
            corrupted indexes, orphaned data, missing references, and inconsistencies.
          </p>

          <div className="flex gap-4">
            <Button onClick={runValidation} disabled={validating || fixing} className="flex items-center gap-2">
              {validating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Validating...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Run Validation
                </>
              )}
            </Button>

            {validationResult && !validationResult.isValid && validationResult.issues.length > 0 && (
              <Button
                onClick={() => setShowFixDialog(true)}
                disabled={validating || fixing}
                variant="outline"
                className="flex items-center gap-2"
              >
                {fixing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4" />
                    Fix Issues
                  </>
                )}
              </Button>
            )}
          </div>

          {validating && (
            <div className="mt-4">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-gray-600 mt-2">Validating category data... {progress}%</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <>
          {/* Summary */}
          <Card className={getSummaryColor(validationResult.isValid)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                Validation Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{validationResult.summary.totalBusinesses}</div>
                  <div className="text-sm text-gray-600">Total Businesses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {validationResult.summary.businessesWithCategories}
                  </div>
                  <div className="text-sm text-gray-600">With Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {validationResult.summary.totalCategoryIndexes}
                  </div>
                  <div className="text-sm text-gray-600">Category Indexes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{validationResult.issues.length}</div>
                  <div className="text-sm text-gray-600">Issues Found</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded border">
                  <div className="text-lg font-semibold text-green-600">{validationResult.summary.validIndexes}</div>
                  <div className="text-xs text-gray-600">Valid Indexes</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-lg font-semibold text-red-600">{validationResult.summary.corruptedIndexes}</div>
                  <div className="text-xs text-gray-600">Corrupted</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-lg font-semibold text-yellow-600">
                    {validationResult.summary.orphanedIndexes}
                  </div>
                  <div className="text-xs text-gray-600">Orphaned</div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-lg font-semibold text-orange-600">{validationResult.summary.missingIndexes}</div>
                  <div className="text-xs text-gray-600">Missing</div>
                </div>
              </div>

              {validationResult.isValid ? (
                <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded">
                  <p className="text-green-800 font-medium">✅ All category data is valid and consistent!</p>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded">
                  <p className="text-red-800 font-medium">❌ Issues found in category data integrity</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issues */}
          {validationResult.issues.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Issues Found ({validationResult.issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {validationResult.issues.map((issue, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${getIssueColor(issue.type)}`}>
                      <div className="flex items-start gap-3">
                        {getIssueIcon(issue.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {issue.type.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {issue.category}
                            </Badge>
                            {issue.businessId && (
                              <Badge variant="outline" className="text-xs font-mono">
                                {issue.businessId}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium mb-2">{issue.description}</p>
                          {Object.keys(issue.details).length > 0 && (
                            <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(issue.details, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {validationResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {validationResult.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Fix Confirmation Dialog */}
      <AlertDialog open={showFixDialog} onOpenChange={setShowFixDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-blue-600" />
              Fix Category Issues
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This will attempt to automatically fix the identified category issues:</p>
              <ul className="text-sm list-disc list-inside space-y-1 text-gray-600">
                <li>Remove corrupted category indexes</li>
                <li>Delete orphaned category data</li>
                <li>Rebuild missing category indexes</li>
                <li>Fix inconsistent business category references</li>
              </ul>
              <p className="text-amber-600 font-medium">
                ⚠️ This operation will modify your Redis database. Make sure you have a backup if needed.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleFixIssues} className="bg-blue-600 hover:bg-blue-700">
              Fix Issues
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
