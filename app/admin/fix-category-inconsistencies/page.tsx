"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fixCategoryInconsistencies, fixSpecificBusinessCategory } from "@/app/actions/fix-category-inconsistencies"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

export default function FixCategoryInconsistenciesPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [specificBusinessId, setSpecificBusinessId] = useState("")
  const [specificResult, setSpecificResult] = useState<any>(null)
  const [specificLoading, setSpecificLoading] = useState(false)

  const handleRunFix = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const fixResult = await fixCategoryInconsistencies()
      setResult(fixResult)
    } catch (error) {
      console.error("Error running fix:", error)
      setResult({ success: false, error: error.message })
    } finally {
      setIsRunning(false)
    }
  }

  const handleFixSpecificBusiness = async () => {
    if (!specificBusinessId) return

    setSpecificLoading(true)
    setSpecificResult(null)

    try {
      const fixResult = await fixSpecificBusinessCategory(specificBusinessId)
      setSpecificResult(fixResult)
    } catch (error) {
      console.error("Error fixing specific business:", error)
      setSpecificResult({ success: false, message: error.message })
    } finally {
      setSpecificLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Fix Category Inconsistencies</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fix Specific Business</CardTitle>
            <CardDescription>Fix a specific business by its ID</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="businessId">Business ID</Label>
                <Input
                  id="businessId"
                  value={specificBusinessId}
                  onChange={(e) => setSpecificBusinessId(e.target.value)}
                  placeholder="e.g., 1744c078-461b-45bc-903e-e0999ac2aa87"
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleFixSpecificBusiness} disabled={!specificBusinessId || specificLoading}>
                  {specificLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    "Fix Business"
                  )}
                </Button>
              </div>
            </div>

            {specificResult && (
              <div className="mt-4 p-4 border rounded-md bg-gray-50">
                <div className="flex items-center mb-2">
                  <Badge variant={specificResult.success ? "default" : "destructive"} className="mr-2">
                    {specificResult.success ? "Success" : "Error"}
                  </Badge>
                  <p>{specificResult.message}</p>
                </div>

                {specificResult.oldCategory && specificResult.newCategory && (
                  <div className="mt-2 text-sm">
                    <p>
                      Changed category from <strong>{specificResult.oldCategory}</strong> to{" "}
                      <strong>{specificResult.newCategory}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fix All Business Categories</CardTitle>
            <CardDescription>Scan all businesses and fix category inconsistencies</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRunFix} disabled={isRunning} className="w-full">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running fix...
                </>
              ) : (
                "Run Fix"
              )}
            </Button>

            {result && (
              <div className="mt-4">
                <div className="flex items-center mb-4">
                  <Badge variant={result.success ? "default" : "destructive"} className="mr-2">
                    {result.success ? "Success" : "Error"}
                  </Badge>
                  <p>
                    Scanned {result.scannedBusinesses} businesses, fixed {result.fixedBusinesses} inconsistencies
                  </p>
                </div>

                {result.details && result.details.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-2 text-left">Business</th>
                          <th className="p-2 text-left">Old Category</th>
                          <th className="p-2 text-left">New Category</th>
                          <th className="p-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.details.map((item: any, index: number) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">
                              <div className="font-medium">{item.businessName}</div>
                              <div className="text-xs text-muted-foreground">{item.businessId}</div>
                            </td>
                            <td className="p-2">{item.oldCategory || "Unknown"}</td>
                            <td className="p-2">{item.newCategory || "Unknown"}</td>
                            <td className="p-2">
                              <Badge variant={item.corrected ? "default" : "destructive"}>
                                {item.corrected ? "Fixed" : "Error"}
                              </Badge>
                              {item.error && <div className="text-xs text-destructive mt-1">{item.error}</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
