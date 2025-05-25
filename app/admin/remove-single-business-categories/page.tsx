"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, AlertTriangle, CheckCircle, Search } from "lucide-react"
import { removeCategoriesFromBusiness, getBusinessInfo } from "./actions"

export default function RemoveSingleBusinessCategoriesPage() {
  const [businessId, setBusinessId] = useState("1744c078-461b-45bc-903e-e0999ac2aa87")
  const [isRemoving, setIsRemoving] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [businessInfo, setBusinessInfo] = useState<any>(null)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string[]
  } | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleSearchBusiness = async () => {
    if (!businessId.trim()) return

    setIsSearching(true)
    try {
      const info = await getBusinessInfo(businessId.trim())
      setBusinessInfo(info)
    } catch (error) {
      setBusinessInfo({
        found: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleRemoveCategories = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsRemoving(true)
    setResult(null)
    setShowConfirmation(false)

    try {
      const response = await removeCategoriesFromBusiness(businessId.trim())
      setResult(response)
      // Refresh business info after removal
      if (response.success) {
        const updatedInfo = await getBusinessInfo(businessId.trim())
        setBusinessInfo(updatedInfo)
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to remove categories",
        details: [error instanceof Error ? error.message : "Unknown error"],
      })
    } finally {
      setIsRemoving(false)
    }
  }

  const resetConfirmation = () => {
    setShowConfirmation(false)
    setResult(null)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Remove Categories from Single Business</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Business Lookup
            </CardTitle>
            <CardDescription>Enter a business ID to view and remove its category data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessId">Business ID</Label>
              <div className="flex gap-2">
                <Input
                  id="businessId"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder="Enter business ID..."
                  className="flex-1"
                />
                <Button onClick={handleSearchBusiness} disabled={isSearching || !businessId.trim()}>
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>

            {businessInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {businessInfo.found ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Business Name:</strong> {businessInfo.businessName || "N/A"}
                        </div>
                        <div>
                          <strong>Email:</strong> {businessInfo.email || "N/A"}
                        </div>
                        <div>
                          <strong>City:</strong> {businessInfo.city || "N/A"}
                        </div>
                        <div>
                          <strong>State:</strong> {businessInfo.state || "N/A"}
                        </div>
                        <div>
                          <strong>Primary Category:</strong> {businessInfo.category || "None"}
                        </div>
                        <div>
                          <strong>Subcategory:</strong> {businessInfo.subcategory || "None"}
                        </div>
                      </div>

                      {businessInfo.allCategories && businessInfo.allCategories.length > 0 && (
                        <div>
                          <strong>All Categories:</strong>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {businessInfo.allCategories.map((cat: string, index: number) => (
                              <span
                                key={index}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {businessInfo.allSubcategories && businessInfo.allSubcategories.length > 0 && (
                        <div>
                          <strong>All Subcategories:</strong>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {businessInfo.allSubcategories.map((subcat: string, index: number) => (
                              <span
                                key={index}
                                className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                              >
                                {subcat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <strong>Categories Count:</strong> {businessInfo.categoriesCount || 0}
                      </div>

                      {businessInfo.hasCategories ? (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>This business has category data that can be removed.</AlertDescription>
                        </Alert>
                      ) : (
                        <Alert>
                          <CheckCircle className="h-4 w-4" />
                          <AlertDescription>This business has no category data to remove.</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Business not found. {businessInfo.error && `Error: ${businessInfo.error}`}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {businessInfo && businessInfo.found && businessInfo.hasCategories && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Remove Categories
              </CardTitle>
              <CardDescription>Remove all category data from business: {businessInfo.businessName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> This action will permanently remove all category data from this business,
                  including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Primary category and subcategory fields</li>
                    <li>All categories and subcategories arrays</li>
                    <li>Category-specific Redis keys</li>
                    <li>Business-to-category index mappings</li>
                  </ul>
                  This action cannot be undone.
                </AlertDescription>
              </Alert>

              {!showConfirmation && !result && (
                <Button onClick={handleRemoveCategories} variant="destructive" disabled={isRemoving}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Categories
                </Button>
              )}

              {showConfirmation && (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Final Confirmation:</strong> Are you sure you want to remove all category data from
                      business "{businessInfo.businessName}" (ID: {businessId})? This action is irreversible.
                    </AlertDescription>
                  </Alert>
                  <div className="flex gap-2">
                    <Button onClick={handleRemoveCategories} variant="destructive" disabled={isRemoving}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isRemoving ? "Removing..." : "Yes, Remove Categories"}
                    </Button>
                    <Button onClick={resetConfirmation} variant="outline">
                      Cancel
                    </Button>
                  </div>
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
                      {result.details && result.details.length > 0 && (
                        <div>
                          <strong>Details:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {result.details.map((detail, index) => (
                              <li key={index} className="text-sm">
                                {detail}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
