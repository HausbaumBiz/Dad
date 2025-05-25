"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Search, Trash2, CheckCircle, XCircle } from "lucide-react"
import { findPersistentBusinesses, removeBusinessFromAllLocations, type BusinessLocationAnalysis } from "./actions"

export default function FindPersistentBusinessesPage() {
  const [isSearching, setIsSearching] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<BusinessLocationAnalysis | null>(null)
  const [removalResults, setRemovalResults] = useState<Record<string, any>>({})

  const handleSearch = async () => {
    setIsSearching(true)
    try {
      const result = await findPersistentBusinesses()
      setAnalysis(result)
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleRemove = async (businessId: string) => {
    setIsRemoving(businessId)
    try {
      const result = await removeBusinessFromAllLocations(businessId)
      setRemovalResults((prev) => ({ ...prev, [businessId]: result }))

      // Refresh the search after removal
      if (result.success) {
        setTimeout(() => {
          handleSearch()
        }, 1000)
      }
    } catch (error) {
      console.error("Removal failed:", error)
      setRemovalResults((prev) => ({
        ...prev,
        [businessId]: {
          success: false,
          message: "Removal failed",
          details: [String(error)],
        },
      }))
    } finally {
      setIsRemoving(null)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Find Persistent Businesses</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive search for businesses that persist despite removal attempts
          </p>
        </div>
        <Button onClick={handleSearch} disabled={isSearching} className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          {isSearching ? "Searching..." : "Find Persistent Businesses"}
        </Button>
      </div>

      {analysis?.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Search Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{analysis.error}</p>
          </CardContent>
        </Card>
      )}

      {analysis && !analysis.error && (
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Search Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{analysis.businessesFound.length}</div>
                  <div className="text-sm text-muted-foreground">Persistent Businesses Found</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{analysis.totalLocations}</div>
                  <div className="text-sm text-muted-foreground">Locations Searched</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.businessesFound.reduce((sum, b) => sum + b.locations.length, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Occurrences</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Found Businesses */}
          {analysis.businessesFound.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Persistent Businesses Found</CardTitle>
                <CardDescription>
                  These businesses were found in multiple locations and need to be removed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analysis.businessesFound.map((business) => {
                  const removalResult = removalResults[business.id]

                  return (
                    <div key={business.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{business.name}</h3>
                          <p className="text-sm text-muted-foreground">ID: {business.id}</p>
                        </div>
                        <Button
                          onClick={() => handleRemove(business.id)}
                          disabled={isRemoving === business.id}
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {isRemoving === business.id ? "Removing..." : "Remove from All Locations"}
                        </Button>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Found in {business.locations.length} locations:</p>
                        <div className="flex flex-wrap gap-2">
                          {business.locations.map((location, index) => (
                            <Badge key={index} variant="secondary">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {removalResult && (
                        <div
                          className={`p-3 rounded-md ${removalResult.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {removalResult.success ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            <span
                              className={`font-medium ${removalResult.success ? "text-green-800" : "text-red-800"}`}
                            >
                              {removalResult.message}
                            </span>
                          </div>
                          {removalResult.details && removalResult.details.length > 0 && (
                            <div className="text-sm space-y-1">
                              {removalResult.details.map((detail: string, index: number) => (
                                <div key={index} className="text-muted-foreground">
                                  • {detail}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View Business Data
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(business.businessData, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* No Businesses Found */}
          {analysis.businessesFound.length === 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  No Persistent Businesses Found
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700">
                  Great! No instances of "Stark Family Health Center" or "Rat" businesses were found in any of the
                  searched locations.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Locations Searched */}
          <Card>
            <CardHeader>
              <CardTitle>Locations Searched</CardTitle>
              <CardDescription>
                All {analysis.totalLocations} locations that were checked for persistent businesses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {analysis.allLocationsChecked.map((location, index) => (
                  <Badge key={index} variant="outline" className="justify-start">
                    {location}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!analysis && !isSearching && (
        <Card>
          <CardHeader>
            <CardTitle>Ready to Search</CardTitle>
            <CardDescription>
              Click "Find Persistent Businesses" to start a comprehensive search for businesses that persist despite
              removal attempts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This tool will search through all possible Redis keys, category indexes, cached data, and function results
              to find where "Stark Family Health Center" and "Rat" businesses might be hiding.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
