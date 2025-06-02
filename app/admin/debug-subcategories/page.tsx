"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getAllSubcategoryPaths,
  getAllCategorySelections,
  getAllSelectedCategories,
  searchBusinessesBySubcategory,
} from "./actions"

export default function DebugSubcategoriesPage() {
  const [subcategoryData, setSubcategoryData] = useState<any>(null)
  const [categorySelections, setCategorySelections] = useState<any>(null)
  const [selectedCategories, setSelectedCategories] = useState<any>(null)
  const [searchResults, setSearchResults] = useState<any>(null)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("Home, Lawn, and Manual Labor > Lawn, Garden and Snow Removal")

  const fetchSubcategoryPaths = async () => {
    setLoading((prev) => ({ ...prev, subcategories: true }))
    try {
      const result = await getAllSubcategoryPaths()
      setSubcategoryData(result)
    } catch (error) {
      console.error("Error fetching subcategory paths:", error)
    } finally {
      setLoading((prev) => ({ ...prev, subcategories: false }))
    }
  }

  const fetchCategorySelections = async () => {
    setLoading((prev) => ({ ...prev, selections: true }))
    try {
      const result = await getAllCategorySelections()
      setCategorySelections(result)
    } catch (error) {
      console.error("Error fetching category selections:", error)
    } finally {
      setLoading((prev) => ({ ...prev, selections: false }))
    }
  }

  const fetchSelectedCategories = async () => {
    setLoading((prev) => ({ ...prev, categories: true }))
    try {
      const result = await getAllSelectedCategories()
      setSelectedCategories(result)
    } catch (error) {
      console.error("Error fetching selected categories:", error)
    } finally {
      setLoading((prev) => ({ ...prev, categories: false }))
    }
  }

  const handleSearch = async () => {
    if (!searchTerm) return

    setLoading((prev) => ({ ...prev, search: true }))
    try {
      const result = await searchBusinessesBySubcategory(searchTerm)
      setSearchResults(result)
    } catch (error) {
      console.error("Error searching businesses:", error)
    } finally {
      setLoading((prev) => ({ ...prev, search: false }))
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Debug Subcategory Paths</h1>

      <Tabs defaultValue="search">
        <TabsList className="mb-6">
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="subcategories">All Subcategories</TabsTrigger>
          <TabsTrigger value="selections">Category Selections</TabsTrigger>
          <TabsTrigger value="categories">Selected Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search for Businesses by Subcategory Path</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter subcategory path to search"
                  className="flex-1"
                />
                <Button onClick={handleSearch} disabled={loading.search || !searchTerm}>
                  {loading.search ? "Searching..." : "Search"}
                </Button>
              </div>

              {searchResults && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Search Results for: "{searchResults.searchTerm}"</h3>
                  <p className="mb-4">Found {searchResults.count} businesses</p>

                  {searchResults.success && searchResults.count > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      {Object.entries(searchResults.data).map(([business, subcategories]: [string, any]) => (
                        <div key={business} className="p-4 border-b last:border-b-0">
                          <h4 className="font-medium mb-2">{business}</h4>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(subcategories, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-amber-600">No businesses found with this subcategory path.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subcategories">
          <Card>
            <CardHeader>
              <CardTitle>All Subcategory Paths</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchSubcategoryPaths} disabled={loading.subcategories} className="mb-6">
                {loading.subcategories ? "Loading..." : "Fetch All Subcategory Paths"}
              </Button>

              {subcategoryData && (
                <div>
                  <p className="mb-4">Found {subcategoryData.count} businesses with subcategories</p>

                  {subcategoryData.success && subcategoryData.count > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      {Object.entries(subcategoryData.data).map(([business, subcategories]: [string, any]) => (
                        <div key={business} className="p-4 border-b last:border-b-0">
                          <h4 className="font-medium mb-2">{business}</h4>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(subcategories, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-amber-600">No subcategory paths found.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selections">
          <Card>
            <CardHeader>
              <CardTitle>Category Selections (Full Paths)</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchCategorySelections} disabled={loading.selections} className="mb-6">
                {loading.selections ? "Loading..." : "Fetch Category Selections"}
              </Button>

              {categorySelections && (
                <div>
                  <p className="mb-4">Found {categorySelections.count} businesses with category selections</p>

                  {categorySelections.success && categorySelections.count > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      {Object.entries(categorySelections.data).map(([business, selections]: [string, any]) => (
                        <div key={business} className="p-4 border-b last:border-b-0">
                          <h4 className="font-medium mb-2">{business}</h4>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(selections, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-amber-600">No category selections found.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Selected Categories (Main Categories)</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchSelectedCategories} disabled={loading.categories} className="mb-6">
                {loading.categories ? "Loading..." : "Fetch Selected Categories"}
              </Button>

              {selectedCategories && (
                <div>
                  <p className="mb-4">Found {selectedCategories.count} businesses with selected categories</p>

                  {selectedCategories.success && selectedCategories.count > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      {Object.entries(selectedCategories.data).map(([business, categories]: [string, any]) => (
                        <div key={business} className="p-4 border-b last:border-b-0">
                          <h4 className="font-medium mb-2">{business}</h4>
                          <div className="bg-gray-50 p-3 rounded-md">
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(categories, null, 2)}
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-amber-600">No selected categories found.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
