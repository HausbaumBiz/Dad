"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Trash2, AlertTriangle, CheckCircle } from "lucide-react"
import { removeAllCategoriesFromAllBusinesses } from "./actions"

export default function RemoveCategoriesPage() {
  const [isRemoving, setIsRemoving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    processed: number
    errors: number
    details?: string[]
  } | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleRemoveCategories = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsRemoving(true)
    setProgress(0)
    setResult(null)
    setShowConfirmation(false)

    try {
      const response = await removeAllCategoriesFromAllBusinesses()
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to remove categories",
        processed: 0,
        errors: 1,
        details: [error instanceof Error ? error.message : "Unknown error"],
      })
    } finally {
      setIsRemoving(false)
      setProgress(100)
    }
  }

  const resetConfirmation = () => {
    setShowConfirmation(false)
    setResult(null)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Remove All Categories</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Category Removal Utility
            </CardTitle>
            <CardDescription>
              This utility will remove all category data from all businesses in the database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning:</strong> This action will permanently remove all category assignments from all
                businesses. This includes:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Primary category and subcategory fields</li>
                  <li>All categories and subcategories arrays</li>
                  <li>Category-specific Redis keys and indexes</li>
                  <li>Business-to-category mappings</li>
                </ul>
                This action cannot be undone.
              </AlertDescription>
            </Alert>

            {!showConfirmation && !result && (
              <Button onClick={handleRemoveCategories} variant="destructive" disabled={isRemoving}>
                <Trash2 className="h-4 w-4 mr-2" />
                Remove All Categories
              </Button>
            )}

            {showConfirmation && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Final Confirmation:</strong> Are you absolutely sure you want to remove all categories from
                    all businesses? This action is irreversible.
                  </AlertDescription>
                </Alert>
                <div className="flex gap-2">
                  <Button onClick={handleRemoveCategories} variant="destructive" disabled={isRemoving}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Yes, Remove All Categories
                  </Button>
                  <Button onClick={resetConfirmation} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {isRemoving && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                  <span>Removing categories from all businesses...</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <AlertDescription>
                  <div className="space-y-2">
                    <p>
                      <strong>{result.success ? "Success" : "Error"}:</strong> {result.message}
                    </p>
                    <p>
                      <strong>Processed:</strong> {result.processed} businesses
                    </p>
                    {result.errors > 0 && (
                      <p>
                        <strong>Errors:</strong> {result.errors}
                      </p>
                    )}
                    {result.details && result.details.length > 0 && (
                      <div>
                        <strong>Details:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {result.details.slice(0, 10).map((detail, index) => (
                            <li key={index} className="text-sm">
                              {detail}
                            </li>
                          ))}
                          {result.details.length > 10 && (
                            <li className="text-sm text-gray-500">... and {result.details.length - 10} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {result && result.success && (
              <div className="mt-4">
                <Button onClick={() => window.location.reload()} variant="outline">
                  Refresh Page
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What This Tool Does</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p>This utility performs the following operations for each business:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Removes the primary <code>category</code> and <code>subcategory</code> fields
                </li>
                <li>
                  Clears the <code>allCategories</code> and <code>allSubcategories</code> arrays
                </li>
                <li>
                  Resets the <code>categoriesCount</code> to 0
                </li>
                <li>
                  Deletes category-specific Redis keys like <code>business:id:categories</code>
                </li>
                <li>Removes the business from all category indexes</li>
                <li>Updates the business record with the cleaned data</li>
              </ol>
              <p className="text-gray-600 mt-3">
                <strong>Note:</strong> This operation preserves all other business data including contact information,
                service areas, media, and other non-category related data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
