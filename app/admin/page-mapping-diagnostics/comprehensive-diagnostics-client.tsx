"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"

interface DiagnosticResult {
  category: string
  status: "success" | "warning" | "error" | "info"
  message: string
  details?: any
  action?: string
}

export default function ComprehensiveDiagnosticsClient() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentCheck, setCurrentCheck] = useState("")

  const runComprehensiveDiagnostics = async () => {
    setLoading(true)
    setResults([])
    setProgress(0)
    setCurrentCheck("Starting diagnostics...")

    const diagnosticResults: DiagnosticResult[] = []

    try {
      // Check 1: Verify Redis connection
      setCurrentCheck("Checking Redis connection...")
      setProgress(10)

      try {
        const response = await fetch("/api/test-redis")
        const data = await response.json()

        if (data.success) {
          diagnosticResults.push({
            category: "Redis Connection",
            status: "success",
            message: "Redis connection is working",
            details: data,
          })
        } else {
          diagnosticResults.push({
            category: "Redis Connection",
            status: "error",
            message: "Redis connection failed",
            details: data,
            action: "Check Redis configuration",
          })
        }
      } catch (error) {
        diagnosticResults.push({
          category: "Redis Connection",
          status: "error",
          message: "Failed to test Redis connection",
          details: error instanceof Error ? error.message : String(error),
          action: "Check network connectivity and Redis service",
        })
      }

      // Check 2: Sample page business counts
      setCurrentCheck("Checking page business counts...")
      setProgress(25)

      const samplePages = [
        "automotive-services",
        "home-improvement",
        "beauty-wellness",
        "tech-it-services",
        "food-dining",
      ]

      for (const page of samplePages) {
        try {
          const response = await fetch(`/api/businesses/by-page?page=${page}&debug=true`)
          const data = await response.json()

          if (response.ok) {
            if (data.businesses && data.businesses.length > 0) {
              diagnosticResults.push({
                category: "Page Business Count",
                status: "success",
                message: `Page "${page}" has ${data.businesses.length} businesses`,
                details: {
                  totalFound: data.totalFound,
                  realBusinesses: data.realBusinesses,
                  page: data.page,
                },
              })
            } else {
              diagnosticResults.push({
                category: "Page Business Count",
                status: "warning",
                message: `Page "${page}" has no businesses`,
                details: data,
                action: "Check if businesses are properly mapped to this page",
              })
            }
          } else {
            diagnosticResults.push({
              category: "Page Business Count",
              status: "error",
              message: `Failed to fetch businesses for page "${page}"`,
              details: data,
              action: "Check API endpoint and page mapping",
            })
          }
        } catch (error) {
          diagnosticResults.push({
            category: "Page Business Count",
            status: "error",
            message: `Error checking page "${page}"`,
            details: error instanceof Error ? error.message : String(error),
            action: "Check network connectivity",
          })
        }
      }

      // Check 3: Business category consistency
      setCurrentCheck("Checking business category consistency...")
      setProgress(50)

      try {
        const response = await fetch("/api/debug/business-categories")
        const data = await response.json()

        if (response.ok && data.businesses) {
          const businessesWithCategories = data.businesses.filter((b: any) => b.categories && b.categories.length > 0)
          const businessesWithoutCategories = data.businesses.filter(
            (b: any) => !b.categories || b.categories.length === 0,
          )

          diagnosticResults.push({
            category: "Business Categories",
            status: businessesWithoutCategories.length > 0 ? "warning" : "success",
            message: `${businessesWithCategories.length} businesses have categories, ${businessesWithoutCategories.length} don't`,
            details: {
              withCategories: businessesWithCategories.length,
              withoutCategories: businessesWithoutCategories.length,
              total: data.businesses.length,
            },
            action: businessesWithoutCategories.length > 0 ? "Assign categories to businesses without them" : undefined,
          })

          // Check for businesses with page mappings
          const businessesWithPageMappings = data.businesses.filter(
            (b: any) => b.pageMappings && Object.keys(b.pageMappings).length > 0,
          )

          diagnosticResults.push({
            category: "Page Mappings",
            status: businessesWithPageMappings.length > 0 ? "success" : "error",
            message: `${businessesWithPageMappings.length} businesses have page mappings`,
            details: {
              withMappings: businessesWithPageMappings.length,
              withoutMappings: data.businesses.length - businessesWithPageMappings.length,
              total: data.businesses.length,
            },
            action: businessesWithPageMappings.length === 0 ? "Run page mapping rebuild" : undefined,
          })
        }
      } catch (error) {
        diagnosticResults.push({
          category: "Business Categories",
          status: "error",
          message: "Failed to check business categories",
          details: error instanceof Error ? error.message : String(error),
          action: "Check business categories API endpoint",
        })
      }

      // Check 4: Category page mapping configuration
      setCurrentCheck("Checking category page mapping configuration...")
      setProgress(75)

      const categoryMappings = {
        "Home, Lawn, and Manual Labor": "home-improvement",
        "Automotive/Motorcycle/RV, etc": "automotive-services",
        "Hair care, Beauty, Tattoo and Piercing": "beauty-wellness",
        "Computers and the Web": "tech-it-services",
        "Restaurant, Food and Drink": "food-dining",
      }

      for (const [category, expectedPage] of Object.entries(categoryMappings)) {
        diagnosticResults.push({
          category: "Category Mapping Config",
          status: "info",
          message: `Category "${category}" maps to page "${expectedPage}"`,
          details: { category, page: expectedPage },
        })
      }

      // Check 5: Sample business verification
      setCurrentCheck("Checking sample business mappings...")
      setProgress(90)

      try {
        const response = await fetch("/api/debug/business-categories")
        const data = await response.json()

        if (response.ok && data.businesses && data.businesses.length > 0) {
          // Take first 3 businesses for detailed checking
          const sampleBusinesses = data.businesses.slice(0, 3)

          for (const business of sampleBusinesses) {
            if (business.categories && business.categories.length > 0) {
              const hasPageMappings = business.pageMappings && Object.keys(business.pageMappings).length > 0

              diagnosticResults.push({
                category: "Sample Business Check",
                status: hasPageMappings ? "success" : "warning",
                message: `Business "${business.businessName || business.id}" ${hasPageMappings ? "has" : "missing"} page mappings`,
                details: {
                  businessId: business.id,
                  businessName: business.businessName,
                  categories: business.categories,
                  pageMappings: business.pageMappings || {},
                  categoriesCount: business.categories.length,
                  pageMappingsCount: hasPageMappings ? Object.keys(business.pageMappings).length : 0,
                },
                action: !hasPageMappings ? "Run category save for this business" : undefined,
              })
            }
          }
        }
      } catch (error) {
        diagnosticResults.push({
          category: "Sample Business Check",
          status: "error",
          message: "Failed to check sample businesses",
          details: error instanceof Error ? error.message : String(error),
          action: "Check business data API",
        })
      }

      setProgress(100)
      setCurrentCheck("Diagnostics complete!")
      setResults(diagnosticResults)
    } catch (error) {
      diagnosticResults.push({
        category: "Diagnostic Error",
        status: "error",
        message: "Failed to complete diagnostics",
        details: error instanceof Error ? error.message : String(error),
        action: "Check console for detailed error information",
      })
      setResults(diagnosticResults)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-50 border-green-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      case "error":
        return "bg-red-50 border-red-200"
      case "info":
        return "bg-blue-50 border-blue-200"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const groupedResults = results.reduce(
    (acc, result) => {
      if (!acc[result.category]) {
        acc[result.category] = []
      }
      acc[result.category].push(result)
      return acc
    },
    {} as Record<string, DiagnosticResult[]>,
  )

  const summary = {
    total: results.length,
    success: results.filter((r) => r.status === "success").length,
    warning: results.filter((r) => r.status === "warning").length,
    error: results.filter((r) => r.status === "error").length,
    info: results.filter((r) => r.status === "info").length,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comprehensive Page Mapping Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={runComprehensiveDiagnostics} disabled={loading} className="w-full">
              {loading ? "Running Diagnostics..." : "Run Comprehensive Diagnostics"}
            </Button>

            {loading && (
              <div className="space-y-2">
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">{currentCheck}</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.success}</div>
                  <div className="text-sm text-gray-600">Success</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{summary.warning}</div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.error}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.info}</div>
                  <div className="text-sm text-gray-600">Info</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Results</TabsTrigger>
            <TabsTrigger value="actions">Recommended Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <div className="space-y-4">
              {Object.entries(groupedResults).map(([category, categoryResults]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {category}
                      <Badge variant="outline">
                        {categoryResults.length} check{categoryResults.length !== 1 ? "s" : ""}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {categoryResults.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-md border ${getStatusColor(result.status)} flex items-start gap-3`}
                        >
                          {getStatusIcon(result.status)}
                          <div className="flex-1">
                            <p className="font-medium">{result.message}</p>
                            {result.action && (
                              <p className="text-sm text-gray-600 mt-1">
                                <strong>Action:</strong> {result.action}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="detailed">
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      {result.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="font-medium">{result.message}</p>

                      {result.action && (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Recommended Action:</strong> {result.action}
                          </AlertDescription>
                        </Alert>
                      )}

                      {result.details && (
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h4 className="font-medium mb-2">Details:</h4>
                          <pre className="text-sm overflow-x-auto">{JSON.stringify(result.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="actions">
            <div className="space-y-4">
              {results
                .filter((r) => r.action)
                .map((result, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>
                          <strong>{result.category}:</strong> {result.message}
                        </p>
                        <p>
                          <strong>Action:</strong> {result.action}
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}

              {results.filter((r) => r.action).length === 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    No immediate actions required. All checks passed or only informational items found.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
