"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, Search, Database, Building, AlertTriangle, Check, X } from "lucide-react"
import { getAllCategories, removeCategoryFromRedis } from "./actions"

interface CategoryInfo {
  categoryKey: string
  displayName: string
  businessCount: number
  type: "main" | "subcategory" | "path"
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryInfo | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [results, setResults] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const categoryData = await getAllCategories()
      setCategories(categoryData)
    } catch (error) {
      console.error("Failed to load categories:", error)
      setResults({
        success: false,
        message: `Failed to load categories: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCategory = async (category: CategoryInfo) => {
    setSelectedCategory(category)
    setShowConfirmDialog(true)
  }

  const confirmRemoval = async () => {
    if (!selectedCategory) return

    setRemoving(selectedCategory.categoryKey)
    setShowConfirmDialog(false)
    setResults(null)

    try {
      const result = await removeCategoryFromRedis(selectedCategory.categoryKey)
      setResults(result)

      if (result.success) {
        // Reload categories to reflect changes
        await loadCategories()
      }
    } catch (error) {
      setResults({
        success: false,
        message: `Failed to remove category: ${error instanceof Error ? error.message : "Unknown error"}`,
      })
    } finally {
      setRemoving(null)
      setSelectedCategory(null)
    }
  }

  const filteredCategories = categories.filter(
    (category) =>
      category.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.categoryKey.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getCategoryTypeColor = (type: string) => {
    switch (type) {
      case "main":
        return "bg-blue-100 text-blue-800"
      case "subcategory":
        return "bg-green-100 text-green-800"
      case "path":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryTypeIcon = (type: string) => {
    switch (type) {
      case "main":
        return <Database className="h-4 w-4" />
      case "subcategory":
        return <Building className="h-4 w-4" />
      case "path":
        return <Search className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading categories...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Category Search & Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button onClick={loadCategories} variant="outline">
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Total Categories</h3>
              <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800">Main Categories</h3>
              <p className="text-2xl font-bold text-green-600">{categories.filter((c) => c.type === "main").length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800">Subcategories</h3>
              <p className="text-2xl font-bold text-purple-600">
                {categories.filter((c) => c.type === "subcategory").length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card className={results.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {results.success ? <Check className="h-5 w-5 text-green-600" /> : <X className="h-5 w-5 text-red-600" />}
              <p className={results.success ? "text-green-800" : "text-red-800"}>{results.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Categories ({filteredCategories.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No categories match your search." : "No categories found."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((category) => (
                <div
                  key={category.categoryKey}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getCategoryTypeIcon(category.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{category.displayName}</h3>
                        <Badge className={getCategoryTypeColor(category.type)}>{category.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 font-mono">{category.categoryKey}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="mb-1">
                        {category.businessCount} businesses
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveCategory(category)}
                    disabled={removing === category.categoryKey}
                    className="ml-4"
                  >
                    {removing === category.categoryKey ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Remove Category
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to remove this category from the Redis database?</p>
              {selectedCategory && (
                <div className="bg-gray-100 p-3 rounded-lg">
                  <p>
                    <strong>Category:</strong> {selectedCategory.displayName}
                  </p>
                  <p>
                    <strong>Key:</strong> {selectedCategory.categoryKey}
                  </p>
                  <p>
                    <strong>Type:</strong> {selectedCategory.type}
                  </p>
                  <p>
                    <strong>Businesses affected:</strong> {selectedCategory.businessCount}
                  </p>
                </div>
              )}
              <p className="text-red-600 font-medium">This action will:</p>
              <ul className="text-red-600 text-sm list-disc list-inside space-y-1">
                <li>Delete the category index from Redis</li>
                <li>Remove this category from all associated businesses</li>
                <li>This action cannot be undone</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoval} className="bg-red-600 hover:bg-red-700">
              Remove Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
