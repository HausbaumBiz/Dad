"use client"

import { useState } from "react"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, CheckCircle, XCircle } from "lucide-react"
import { categoryIdToPageMapping, getRouteForCategoryName, getCategoryPageInfo } from "@/lib/category-route-mapping"

interface TestResult {
  categoryName: string
  expectedPage: string
  actualPage: string | null
  isMatch: boolean
}

export default function TestCategoryMappingPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const testCategories = [
    // Main categories
    "Legal Services",
    "Automotive Services",
    "Beauty and Wellness",
    "Fitness and Athletics",
    "Home Improvement",
    "Art, Design and Entertainment",
    "Physical Rehabilitation",
    "Financial Services",
    "Weddings and Events",
    "Education and Tutoring",
    "Real Estate",
    "Care Services",
    "Personal Assistants",
    "Funeral Services",
    "Tailoring and Clothing",
    "Food and Dining",
    "Tech and IT Services",
    "Mental Health",
    "Medical Practitioners",
    "Music Lessons",
    "Pet Care",
    "Retail Stores",
    "Travel and Vacation",
    "Child Care",
    "Elder Care",
    // Home improvement subcategories
    "Asphalt and Concrete",
    "Audio Visual and Security",
    "Construction and Design",
    "Fireplaces and Chimneys",
    "Flooring",
    "Handymen",
    "Hazard Mitigation",
    "Cleaning",
    "Inside Maintenance",
    "Lawn and Garden",
    "Movers",
    "Outdoor Structures",
    "Outside Maintenance",
    "Pest Control",
    "Pool Services",
    "Trash and Cleanup",
    "Windows and Doors",
  ]

  const runTests = async () => {
    setIsLoading(true)
    const results: TestResult[] = []

    // Get expected mappings from our data
    const expectedMappings: Record<string, string> = {}
    Object.values(categoryIdToPageMapping).forEach(({ name, page }) => {
      expectedMappings[name] = page
    })

    // Test each category
    testCategories.forEach((categoryName) => {
      const expectedPage = expectedMappings[categoryName] || "NOT_FOUND"
      const actualPage = getRouteForCategoryName(categoryName)
      const isMatch = expectedPage === actualPage

      results.push({
        categoryName,
        expectedPage,
        actualPage,
        isMatch,
      })
    })

    setTestResults(results)
    setIsLoading(false)
  }

  const testCategoryPageInfo = (categoryName: string) => {
    const info = getCategoryPageInfo(categoryName)
    console.log(`Category: ${categoryName}`, info)
    return info
  }

  const successCount = testResults.filter((r) => r.isMatch).length
  const failureCount = testResults.filter((r) => !r.isMatch).length

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Category Mapping Test</h1>
            <p className="text-gray-600">Testing category name to page URL mapping for the Finalize & Submit dialog</p>
          </div>

          <div className="mb-6 flex gap-4 justify-center">
            <Button onClick={runTests} disabled={isLoading} className="px-6 py-2">
              {isLoading ? "Running Tests..." : "Run Category Mapping Tests"}
            </Button>
          </div>

          {testResults.length > 0 && (
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-4">
                    Test Results Summary
                    <div className="flex gap-2">
                      <Badge variant="default" className="bg-green-500">
                        ✓ {successCount} Passed
                      </Badge>
                      <Badge variant="destructive">✗ {failureCount} Failed</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    <p>Total categories tested: {testResults.length}</p>
                    <p>Success rate: {((successCount / testResults.length) * 100).toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid gap-4">
            {testResults.map((result, index) => (
              <Card key={index} className={`border-l-4 ${result.isMatch ? "border-l-green-500" : "border-l-red-500"}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {result.isMatch ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <h3 className="font-medium">{result.categoryName}</h3>
                      </div>

                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Expected:</span>
                          <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">{result.expectedPage}</code>
                        </p>
                        <p>
                          <span className="font-medium">Actual:</span>
                          <code className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
                            {result.actualPage || "null"}
                          </code>
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {result.actualPage && (
                        <Button variant="outline" size="sm" onClick={() => window.open(result.actualPage!, "_blank")}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => testCategoryPageInfo(result.categoryName)}>
                        Debug
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {testResults.length > 0 && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Available Category Mappings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    {Object.values(categoryIdToPageMapping).map(({ name, page }, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{name}</span>
                        <code className="text-xs text-blue-600">{page}</code>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <MainFooter />
    </div>
  )
}
