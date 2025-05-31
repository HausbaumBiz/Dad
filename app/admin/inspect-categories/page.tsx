"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { inspectCategoryStorage, searchCategoryKeys } from "./actions"

export default function InspectCategoriesPage() {
  const [inspectionData, setInspectionData] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [searchPattern, setSearchPattern] = useState("*tailor*")
  const [loading, setLoading] = useState(false)

  const handleInspect = async () => {
    setLoading(true)
    try {
      const result = await inspectCategoryStorage()
      setInspectionData(result)
    } catch (error) {
      console.error("Error inspecting categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    setLoading(true)
    try {
      const result = await searchCategoryKeys(searchPattern)
      setSearchResults(result)
    } catch (error) {
      console.error("Error searching categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "null"
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2)
    }
    return String(value)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Category Storage Inspector</h1>

      <div className="grid gap-6">
        {/* Inspection Section */}
        <Card>
          <CardHeader>
            <CardTitle>Inspect Category Storage</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInspect} disabled={loading}>
              {loading ? "Inspecting..." : "Inspect Category Storage"}
            </Button>

            {inspectionData && (
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Summary</h3>
                  <p>Total Businesses: {inspectionData.data?.businessCount || 0}</p>
                  <p>
                    Unique Category Names Found: {inspectionData.data?.categoryFormats?.allUniqueNames?.length || 0}
                  </p>
                </div>

                {/* All Category Names */}
                <div>
                  <h3 className="text-lg font-semibold">All Unique Category Names</h3>
                  <div className="bg-gray-100 p-4 rounded max-h-60 overflow-y-auto">
                    <pre className="text-sm">
                      {inspectionData.data?.categoryFormats?.allUniqueNames?.join("\n") || "None found"}
                    </pre>
                  </div>
                </div>

                {/* Sample Businesses */}
                <div>
                  <h3 className="text-lg font-semibold">Sample Business Category Storage</h3>
                  {inspectionData.data?.sampleBusinesses?.map((business: any, index: number) => (
                    <Card key={index} className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-base">
                          {business.businessName || business.id}
                          {business.mainCategory && ` (${business.mainCategory})`}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(business.categoryStorageFormats || {}).map(([key, data]: [string, any]) => (
                            <div key={key} className="border-l-2 border-blue-200 pl-4">
                              <h4 className="font-medium">{key}</h4>
                              <p className="text-sm text-gray-600">Type: {data.type}</p>
                              <div className="bg-gray-50 p-2 rounded text-xs max-h-40 overflow-y-auto">
                                <pre>{formatValue(data.parsed || data.value)}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Category Indexes */}
                <div>
                  <h3 className="text-lg font-semibold">Category Indexes</h3>
                  {inspectionData.data?.categoryIndexes?.map((index: any, i: number) => (
                    <div key={i} className="bg-gray-50 p-3 rounded mt-2">
                      <h4 className="font-medium">{index.key}</h4>
                      <p className="text-sm">Members: {index.memberCount}</p>
                      <p className="text-xs text-gray-600">Sample: {index.sampleMembers?.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search Category Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Search pattern (e.g., *tailor*, *fabric*, *clothing*)"
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={loading}>
                Search
              </Button>
            </div>

            {searchResults && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Search Results</h3>
                {searchResults.data?.map((result: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-3 rounded">
                    <h4 className="font-medium">{result.key}</h4>
                    <p className="text-sm">Members: {result.memberCount}</p>
                    {result.members && result.members.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">Business IDs: {result.members.join(", ")}</div>
                    )}
                  </div>
                ))}
                {(!searchResults.data || searchResults.data.length === 0) && (
                  <p className="text-gray-500">No category keys found matching pattern: {searchPattern}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
