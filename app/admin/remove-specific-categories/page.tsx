"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { removeSpecificCategoriesFromBusiness } from "./actions"

export default function RemoveSpecificCategoriesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const businessId = "c205f900-0ea1-4462-9f7c-dff8fa73ee9e"
  const categoriesToRemove = [
    "Personal Assistant > Virtual Assistant",
    "Home and Lawn Labor > Lawn and Garden",
    "Automotive/Motorcycle/RV > Auto Repair",
  ]

  const handleRemoveCategories = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await removeSpecificCategoriesFromBusiness(businessId, categoriesToRemove)
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: "Error removing categories",
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Remove Specific Categories</h1>
          <p className="text-muted-foreground">Remove specific categories from business {businessId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories to Remove</CardTitle>
          <CardDescription>The following categories will be removed from business {businessId}:</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">Categories to Remove:</h3>
            <ul className="space-y-1 text-red-700">
              {categoriesToRemove.map((category, index) => (
                <li key={index} className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  {category}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Business ID:</h3>
            <code className="text-blue-700 bg-blue-100 px-2 py-1 rounded">{businessId}</code>
          </div>

          <Button onClick={handleRemoveCategories} disabled={isLoading} variant="destructive" className="w-full">
            {isLoading ? "Removing Categories..." : "Remove Categories"}
          </Button>

          {result && (
            <div
              className={`p-4 rounded-lg border ${
                result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <h3 className="font-semibold mb-2">{result.success ? "✅ Success" : "❌ Error"}</h3>
              <p className="mb-2">{result.message}</p>

              {result.success && result.data && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Results:</h4>
                  <div className="bg-white bg-opacity-50 p-3 rounded border">
                    <p>
                      <strong>Categories Removed:</strong> {result.data.removedCount}
                    </p>
                    <p>
                      <strong>Remaining Categories:</strong> {result.data.remainingCount}
                    </p>
                    {result.data.remainingCategories && result.data.remainingCategories.length > 0 && (
                      <div className="mt-2">
                        <p>
                          <strong>Remaining Categories:</strong>
                        </p>
                        <ul className="list-disc list-inside ml-4">
                          {result.data.remainingCategories.map((cat: any, index: number) => (
                            <li key={index}>{cat.fullPath || `${cat.category} > ${cat.subcategory}`}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result.error && (
                <div className="mt-2">
                  <p>
                    <strong>Error Details:</strong>
                  </p>
                  <pre className="text-xs bg-white bg-opacity-50 p-2 rounded border overflow-auto">{result.error}</pre>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
