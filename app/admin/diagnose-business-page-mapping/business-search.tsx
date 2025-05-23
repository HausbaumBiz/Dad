"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search } from "lucide-react"
import { searchBusinesses } from "../actions/diagnose-page-mapping-actions"
import { Badge } from "@/components/ui/badge"

interface Business {
  id: string
  businessName?: string
  name?: string
  category?: string
  subcategory?: string
}

export default function BusinessSearch({ onSelectBusiness }: { onSelectBusiness: (id: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchCategory, setSearchCategory] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Business[]>([])
  const [selectedBusinesses, setSelectedBusinesses] = useState<Set<string>>(new Set())

  const handleSearch = async () => {
    if (!searchTerm && !searchCategory) return

    setIsSearching(true)
    try {
      const results = await searchBusinesses(searchTerm, searchCategory)
      setSearchResults(results)
    } catch (error) {
      console.error("Error searching businesses:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const toggleBusinessSelection = (id: string) => {
    const newSelection = new Set(selectedBusinesses)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedBusinesses(newSelection)
  }

  const selectAllBusinesses = () => {
    const allIds = searchResults.map((business) => business.id)
    setSelectedBusinesses(new Set(allIds))
  }

  const clearSelection = () => {
    setSelectedBusinesses(new Set())
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Search Businesses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <Input
                id="search-term"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter business name"
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="search-category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Input
                id="search-category"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                placeholder="Enter category"
                className="w-full"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Search Results <Badge variant="outline">{searchResults.length}</Badge>
                </h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAllBusinesses}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </div>
              </div>

              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Select
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Business Name
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {searchResults.map((business) => (
                      <tr key={business.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedBusinesses.has(business.id)}
                            onChange={() => toggleBusinessSelection(business.id)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {business.businessName || business.name || "Unnamed Business"}
                          </div>
                          <div className="text-xs text-gray-500">{business.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{business.category || "No Category"}</div>
                          <div className="text-xs text-gray-500">{business.subcategory || "No Subcategory"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="ghost" size="sm" onClick={() => onSelectBusiness(business.id)}>
                            Diagnose
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedBusinesses.size > 0 && (
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => {
                      const firstId = Array.from(selectedBusinesses)[0]
                      onSelectBusiness(firstId)
                    }}
                  >
                    Diagnose Selected ({selectedBusinesses.size})
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
