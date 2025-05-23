"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  checkBusinessPageMapping,
  getBusinessPageMappings,
  getBusinessesForPage,
  addBusinessToPage,
  removeBusinessFromPage,
} from "@/app/actions/page-mapping-diagnostics"

export default function PageMappingDiagnosticsClient() {
  const [businessId, setBusinessId] = useState("")
  const [page, setPage] = useState("")
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("check-business")

  const checkBusinessMapping = async () => {
    if (!businessId || !page) return

    setLoading(true)
    setResults(null)

    try {
      const isMapped = await checkBusinessPageMapping(businessId, page)
      const allMappings = await getBusinessPageMappings(businessId)

      setResults({
        type: "business-check",
        isMapped,
        allMappings,
        businessId,
        page,
      })
    } catch (error) {
      setResults({
        type: "error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        context: "checking business mapping",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPageBusinesses = async () => {
    if (!page) return

    setLoading(true)
    setResults(null)

    try {
      const businesses = await getBusinessesForPage(page)

      setResults({
        type: "page-businesses",
        businesses,
        count: businesses.length,
        page,
      })
    } catch (error) {
      setResults({
        type: "error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        context: "getting page businesses",
      })
    } finally {
      setLoading(false)
    }
  }

  const addBusiness = async () => {
    if (!businessId || !page) return

    setLoading(true)
    setResults(null)

    try {
      const success = await addBusinessToPage(businessId, page)
      const isMapped = await checkBusinessPageMapping(businessId, page)

      setResults({
        type: "add-business",
        success,
        isMapped,
        businessId,
        page,
      })
    } catch (error) {
      setResults({
        type: "error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        context: "adding business to page",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeBusiness = async () => {
    if (!businessId || !page) return

    setLoading(true)
    setResults(null)

    try {
      const success = await removeBusinessFromPage(businessId, page)
      const isMapped = await checkBusinessPageMapping(businessId, page)

      setResults({
        type: "remove-business",
        success,
        isMapped,
        businessId,
        page,
      })
    } catch (error) {
      setResults({
        type: "error",
        message: error instanceof Error ? error.message : "An unknown error occurred",
        context: "removing business from page",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="check-business">Check Business Mapping</TabsTrigger>
          <TabsTrigger value="check-page">Check Page Businesses</TabsTrigger>
          <TabsTrigger value="manual-actions">Manual Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="check-business">
          <Card>
            <CardHeader>
              <CardTitle>Check Business Page Mapping</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business ID</label>
                  <Input
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    placeholder="Enter business ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Page</label>
                  <Input
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                    placeholder="e.g., automotive-services"
                  />
                </div>

                <Button onClick={checkBusinessMapping} disabled={loading || !businessId || !page}>
                  {loading ? "Checking..." : "Check Mapping"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="check-page">
          <Card>
            <CardHeader>
              <CardTitle>Check Page Businesses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Page</label>
                  <Input
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                    placeholder="e.g., automotive-services"
                  />
                </div>

                <Button onClick={getPageBusinesses} disabled={loading || !page}>
                  {loading ? "Fetching..." : "Get Businesses"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual-actions">
          <Card>
            <CardHeader>
              <CardTitle>Manual Page Mapping Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business ID</label>
                  <Input
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    placeholder="Enter business ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Page</label>
                  <Input
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                    placeholder="e.g., automotive-services"
                  />
                </div>

                <div className="flex gap-4">
                  <Button onClick={addBusiness} disabled={loading || !businessId || !page} className="flex-1">
                    {loading ? "Adding..." : "Add to Page"}
                  </Button>

                  <Button
                    onClick={removeBusiness}
                    disabled={loading || !businessId || !page}
                    variant="destructive"
                    className="flex-1"
                  >
                    {loading ? "Removing..." : "Remove from Page"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.type === "business-check" && (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-gray-50">
                  <p className="font-medium">
                    Business {results.businessId} is {results.isMapped ? "" : "not "}mapped to page {results.page}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">All page mappings for this business:</h3>
                  {results.allMappings.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {results.allMappings.map((page: string) => (
                        <li key={page}>{page}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 italic">No page mappings found</p>
                  )}
                </div>
              </div>
            )}

            {results.type === "page-businesses" && (
              <div className="space-y-4">
                <div className="p-4 rounded-md bg-gray-50">
                  <p className="font-medium">
                    Found {results.count} businesses mapped to page {results.page}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Business IDs:</h3>
                  {results.businesses.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      <ul className="list-disc list-inside space-y-1">
                        {results.businesses.map((id: string) => (
                          <li key={id}>{id}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No businesses found</p>
                  )}
                </div>
              </div>
            )}

            {results.type === "add-business" && (
              <div className="p-4 rounded-md bg-gray-50">
                <p className="font-medium">
                  {results.success
                    ? `Successfully added business ${results.businessId} to page ${results.page}`
                    : `Failed to add business ${results.businessId} to page ${results.page}`}
                </p>
                <p className="mt-2">Verification: Business is {results.isMapped ? "" : "not "}mapped to the page</p>
              </div>
            )}

            {results.type === "remove-business" && (
              <div className="p-4 rounded-md bg-gray-50">
                <p className="font-medium">
                  {results.success
                    ? `Successfully removed business ${results.businessId} from page ${results.page}`
                    : `Failed to remove business ${results.businessId} from page ${results.page}`}
                </p>
                <p className="mt-2">
                  Verification: Business is {results.isMapped ? "still " : "no longer "}mapped to the page
                </p>
              </div>
            )}

            {results.type === "error" && (
              <div className="p-4 rounded-md bg-red-50 text-red-800">
                <p className="font-medium">Error {results.context}:</p>
                <p className="mt-1">{results.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
