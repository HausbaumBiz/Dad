"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function BusinessPageMappingFixClient() {
  const [businessId, setBusinessId] = useState("1744c078-461b-45bc-903e-e0999ac2aa87")
  const [loading, setLoading] = useState(false)
  const [businessData, setBusinessData] = useState<any>(null)
  const [pageMappings, setPageMappings] = useState<string[]>([])
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const checkBusiness = async () => {
    if (!businessId) return

    setLoading(true)
    setBusinessData(null)
    setPageMappings([])
    setSelectedPages([])
    setResult(null)

    try {
      // Fetch business data
      const response = await fetch(`/api/admin/business/${businessId}/page-mappings`)

      if (!response.ok) {
        throw new Error(`Failed to fetch business data: ${response.status}`)
      }

      const data = await response.json()
      setBusinessData(data.business)

      if (data.pageMappings) {
        setPageMappings(data.pageMappings)
        setSelectedPages(data.pageMappings)
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  const fixPageMappings = async () => {
    if (!businessId) return

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/admin/business/${businessId}/fix-page-mappings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagesToKeep: selectedPages,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fix page mappings: ${response.status}`)
      }

      const data = await response.json()

      setResult({
        success: true,
        message: data.message || "Page mappings updated successfully",
      })

      // Refresh the business data
      await checkBusiness()
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  const togglePage = (page: string) => {
    setSelectedPages((prev) => (prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]))
  }

  const allPages = [
    "home-improvement",
    "retail-stores",
    "travel-vacation",
    "tailoring-clothing",
    "arts-entertainment",
    "physical-rehabilitation",
    "financial-services",
    "weddings-events",
    "pet-care",
    "education-tutoring",
    "real-estate",
    "fitness-athletics",
    "music-lessons",
    "care-services",
    "automotive-services",
    "beauty-wellness",
    "medical-practitioners",
    "mental-health",
    "tech-it-services",
    "food-dining",
    "personal-assistants",
    "funeral-services",
    "legal-services",
    "elder-care",
    "child-care",
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Check Business Page Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Enter business ID"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                className="flex-1"
              />
              <Button onClick={checkBusiness} disabled={loading || !businessId}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Check"}
              </Button>
            </div>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            )}

            {businessData && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Business Information</h3>
                  <p>
                    <strong>ID:</strong> {businessData.id}
                  </p>
                  <p>
                    <strong>Name:</strong> {businessData.businessName || businessData.name || "Unknown"}
                  </p>
                  <p>
                    <strong>Category:</strong> {businessData.category || "None"}
                  </p>
                  <p>
                    <strong>Subcategory:</strong> {businessData.subcategory || "None"}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Current Page Mappings</h3>
                  {pageMappings.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {pageMappings.map((page) => (
                        <div key={page} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                          {page}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No page mappings found</p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Edit Page Mappings</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Select the pages this business should be mapped to. Uncheck any incorrect mappings.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {allPages.map((page) => (
                      <div key={page} className="flex items-center space-x-2">
                        <Checkbox
                          id={`page-${page}`}
                          checked={selectedPages.includes(page)}
                          onCheckedChange={() => togglePage(page)}
                        />
                        <Label htmlFor={`page-${page}`} className="cursor-pointer">
                          {page}
                          {pageMappings.includes(page) && !selectedPages.includes(page) && (
                            <span className="ml-2 text-red-500 text-xs">(will be removed)</span>
                          )}
                          {!pageMappings.includes(page) && selectedPages.includes(page) && (
                            <span className="ml-2 text-green-500 text-xs">(will be added)</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>

                  <Button onClick={fixPageMappings} disabled={loading} className="mt-4">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Page Mappings"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
