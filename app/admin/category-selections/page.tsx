"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, Building, Calendar, Tag } from "lucide-react"
import { getAllBusinessCategorySelections } from "./actions"

interface CategorySelection {
  categoryId: string
  subcategoryId: string
  fullPath: string
  timestamp: string
}

interface BusinessCategoryData {
  businessId: string
  businessName: string
  email: string
  categorySelections: CategorySelection[]
  selectedCategoryIds: string[]
  selectedSubcategoryIds: string[]
  lastUpdated: string
}

export default function CategorySelectionsPage() {
  const [businesses, setBusinesses] = useState<BusinessCategoryData[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<BusinessCategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadCategorySelections()
  }, [])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredBusinesses(businesses)
    } else {
      const filtered = businesses.filter(
        (business) =>
          business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.businessId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.selectedCategoryIds.some((cat) => cat.toLowerCase().includes(searchTerm.toLowerCase())) ||
          business.selectedSubcategoryIds.some((sub) => sub.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredBusinesses(filtered)
    }
  }, [searchTerm, businesses])

  const loadCategorySelections = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getAllBusinessCategorySelections()
      setBusinesses(data)
      setFilteredBusinesses(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load category selections")
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return timestamp
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading category selections...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Business Category Selections</h1>
        <p className="text-gray-600">View all business category selections from the business-focus page</p>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search by business name, ID, email, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={loadCategorySelections} variant="outline">
              Refresh
            </Button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredBusinesses.length} of {businesses.length} businesses
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {filteredBusinesses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm
                  ? "No businesses found matching your search."
                  : "No businesses with category selections found."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredBusinesses.map((business) => (
            <Card key={business.businessId} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {business.businessName}
                    </CardTitle>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>ID: {business.businessId}</p>
                      <p>Email: {business.email}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatTimestamp(business.lastUpdated)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Selected Category IDs */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      Selected Categories ({business.selectedCategoryIds.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {business.selectedCategoryIds.map((categoryId, index) => (
                        <Badge key={index} variant="default" className="bg-blue-100 text-blue-800">
                          {categoryId}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Selected Subcategory IDs */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      Selected Subcategories ({business.selectedSubcategoryIds.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {business.selectedSubcategoryIds.map((subcategoryId, index) => (
                        <Badge key={index} variant="outline" className="border-green-200 text-green-700">
                          {subcategoryId}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Full Category Selections */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-2">Full Category Selections</h4>
                    <div className="space-y-2">
                      {business.categorySelections.map((selection, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg border">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-sm">
                                {selection.categoryId} → {selection.subcategoryId}
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Path: {selection.fullPath}</p>
                            </div>
                            <div className="text-xs text-gray-500">{formatTimestamp(selection.timestamp)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
