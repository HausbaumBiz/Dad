"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { diagnoseBusinessPageMapping, fixBusinessPageMapping } from "../actions/diagnose-page-mapping-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BusinessSearch from "./business-search"
import BatchDiagnosis from "./batch-diagnosis"

export default function DiagnoseBusinessPageMappingPage() {
  const [businessId, setBusinessId] = useState("1744c078-461b-45bc-903e-e0999ac2aa87")
  const [isLoading, setIsLoading] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null)
  const [fixResult, setFixResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("single")

  const handleDiagnose = async () => {
    if (!businessId) return

    setIsLoading(true)
    setDiagnosticResult(null)
    setFixResult(null)

    try {
      const result = await diagnoseBusinessPageMapping(businessId)
      setDiagnosticResult(result)
    } catch (error) {
      console.error("Error diagnosing business:", error)
      setDiagnosticResult({ success: false, message: "An error occurred during diagnosis" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFix = async () => {
    if (!businessId) return

    setIsFixing(true)
    setFixResult(null)

    try {
      const result = await fixBusinessPageMapping(businessId)
      setFixResult(result)

      // Re-run diagnosis to show updated state
      const updatedDiagnosis = await diagnoseBusinessPageMapping(businessId)
      setDiagnosticResult(updatedDiagnosis)
    } catch (error) {
      console.error("Error fixing business:", error)
      setFixResult({ success: false, message: "An error occurred while fixing" })
    } finally {
      setIsFixing(false)
    }
  }

  const handleSelectBusiness = (id: string) => {
    setBusinessId(id)
    setActiveTab("single")
    handleDiagnose()
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Diagnose Business Page Mapping</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Business</TabsTrigger>
          <TabsTrigger value="search">Search Businesses</TabsTrigger>
          <TabsTrigger value="batch">Batch Diagnosis</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Business ID</CardTitle>
              <CardDescription>Enter the business ID to diagnose its page mappings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder="Enter business ID"
                  className="flex-1"
                />
                <Button onClick={handleDiagnose} disabled={isLoading || !businessId}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Diagnosing...
                    </>
                  ) : (
                    "Diagnose"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search">
          <BusinessSearch onSelectBusiness={handleSelectBusiness} />
        </TabsContent>

        <TabsContent value="batch">
          <BatchDiagnosis />
        </TabsContent>
      </Tabs>

      {diagnosticResult && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!diagnosticResult.success ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{diagnosticResult.message}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Business Details</h3>
                      <div className="bg-muted p-4 rounded-md">
                        <p>
                          <strong>Name:</strong>{" "}
                          {diagnosticResult.business?.businessName || diagnosticResult.business?.name || "N/A"}
                        </p>
                        <p>
                          <strong>Primary Category:</strong> {diagnosticResult.business?.category || "N/A"}
                        </p>
                        <p>
                          <strong>Primary Subcategory:</strong> {diagnosticResult.business?.subcategory || "N/A"}
                        </p>
                        <p>
                          <strong>Categories Count:</strong> {diagnosticResult.business?.categoriesCount || 0}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Expected Page Mapping</h3>
                      <div className="bg-muted p-4 rounded-md">
                        <p>
                          <strong>Expected Page:</strong> {diagnosticResult.expectedPage || "N/A"}
                        </p>
                        <p>
                          <strong>Is Mapped Correctly:</strong>{" "}
                          {diagnosticResult.isCorrectlyMapped ? "Yes ✅" : "No ❌"}
                        </p>
                        {diagnosticResult.pageBusinesses !== undefined && (
                          <p>
                            <strong>Businesses on Page:</strong> {diagnosticResult.pageBusinesses}
                          </p>
                        )}
                        {diagnosticResult.businessPages && (
                          <div>
                            <p>
                              <strong>Business is mapped to:</strong>
                            </p>
                            <ul className="list-disc list-inside">
                              {Object.keys(diagnosticResult.businessPages).length > 0 ? (
                                Object.keys(diagnosticResult.businessPages).map((page) => <li key={page}>{page}</li>)
                              ) : (
                                <li className="text-red-500">No page mappings found</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">All Categories</h3>
                    {diagnosticResult.allCategories && diagnosticResult.allCategories.length > 0 ? (
                      <ul className="list-disc list-inside bg-muted p-4 rounded-md">
                        {diagnosticResult.allCategories.map((cat: string, index: number) => (
                          <li key={index}>{cat}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-red-500">No categories found</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Redis Keys</h3>
                    <div className="bg-muted p-4 rounded-md">
                      <p>
                        <strong>Business Key:</strong> {diagnosticResult.redisKeys?.businessKey || "N/A"}
                      </p>
                      <p>
                        <strong>Categories Key:</strong> {diagnosticResult.redisKeys?.categoriesKey || "N/A"}
                      </p>
                      <p>
                        <strong>Pages Key:</strong> {diagnosticResult.redisKeys?.pagesKey || "N/A"}
                      </p>
                      <p>
                        <strong>Page Businesses Key:</strong> {diagnosticResult.redisKeys?.pageBusinessesKey || "N/A"}
                      </p>
                    </div>
                  </div>

                  {diagnosticResult.issues && diagnosticResult.issues.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Issues Found</h3>
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Problems Detected</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside mt-2">
                            {diagnosticResult.issues.map((issue: string, index: number) => (
                              <li key={index}>{issue}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  {diagnosticResult.recommendations && diagnosticResult.recommendations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                      <Alert>
                        <AlertTitle>Suggested Actions</AlertTitle>
                        <AlertDescription>
                          <ul className="list-disc list-inside mt-2">
                            {diagnosticResult.recommendations.map((rec: string, index: number) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            {diagnosticResult.success && diagnosticResult.issues && diagnosticResult.issues.length > 0 && (
              <Button onClick={handleFix} disabled={isFixing}>
                {isFixing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  "Fix Issues"
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}

      {fixResult && (
        <Card>
          <CardHeader>
            <CardTitle>Fix Results</CardTitle>
          </CardHeader>
          <CardContent>
            {fixResult.success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">
                  {fixResult.message}
                  {fixResult.actions && fixResult.actions.length > 0 && (
                    <ul className="list-disc list-inside mt-2">
                      {fixResult.actions.map((action: string, index: number) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{fixResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <div className="flex gap-4">
              <Button variant="outline" onClick={handleDiagnose}>
                Re-run Diagnosis
              </Button>
              {diagnosticResult?.expectedPage && (
                <Button asChild>
                  <a
                    href={`/${diagnosticResult.expectedPage}?t=${Date.now()}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Test {diagnosticResult.expectedPage} Page
                  </a>
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
