"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { fixBusinessCategory, checkBusinessCategory, listAllCategories } from "../actions/fix-business-category"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FixCategoriesPage() {
  const [businessId, setBusinessId] = useState("1744c078-461b-45bc-903e-e0999ac2aa87")
  const [category, setCategory] = useState("Mortuary Services")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any>(null)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFixCategory = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fixBusinessCategory(businessId, category)
      setResult(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckCategory = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await checkBusinessCategory(businessId, category)
      setResult(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred")
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleListCategories = async () => {
    setCategoriesLoading(true)
    setError(null)
    try {
      const result = await listAllCategories()
      setCategories(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred")
      setCategories(null)
    } finally {
      setCategoriesLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Fix Business Categories</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fix Category for Stark Family Health Center</CardTitle>
            <CardDescription>
              Ensure the business is properly indexed under the Mortuary Services category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessId">Business ID</Label>
                <Input
                  id="businessId"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  placeholder="Enter business ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Enter category"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button onClick={handleCheckCategory} disabled={loading}>
              {loading ? "Checking..." : "Check Category"}
            </Button>
            <Button onClick={handleFixCategory} disabled={loading}>
              {loading ? "Fixing..." : "Fix Category"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>List All Categories</CardTitle>
            <CardDescription>View all categories in the database</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleListCategories} disabled={categoriesLoading} className="w-full">
              {categoriesLoading ? "Loading Categories..." : "List All Categories"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {result && (
        <div className="mt-6">
          <Alert variant={result.success ? "default" : "destructive"}>
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>
              {result.message}

              {result.business && (
                <div className="mt-2">
                  <h4 className="font-semibold">Business Details:</h4>
                  <pre className="mt-2 bg-slate-100 p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(result.business, null, 2)}
                  </pre>
                </div>
              )}

              {result.hasCorrectCategory !== undefined && (
                <div className="mt-2">
                  <p>Has correct category: {result.hasCorrectCategory ? "Yes" : "No"}</p>
                </div>
              )}

              {result.isInCategoryIndex !== undefined && (
                <div className="mt-2">
                  <p>Is in category index: {result.isInCategoryIndex ? "Yes" : "No"}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {categories && categories.success && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Categories in Database</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="categories">
                <TabsList className="mb-4">
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="businesses">Businesses by Category</TabsTrigger>
                  <TabsTrigger value="indexes">Category Indexes</TabsTrigger>
                </TabsList>

                <TabsContent value="categories">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">
                        Categories from Businesses ({categories.categoriesFromBusinesses.length}):
                      </h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {categories.categoriesFromBusinesses.map((cat: string, index: number) => (
                          <li key={index}>{cat}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Category Keys in Redis ({categories.categoryKeys.length}):</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {categories.categoryKeys.map((cat: string, index: number) => (
                          <li key={index}>{cat}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="businesses">
                  <div>
                    <h4 className="font-semibold mb-2">Businesses by Category:</h4>
                    {Object.entries(categories.businessCategories || {}).map(
                      ([category, businesses]: [string, any], index) => (
                        <div key={index} className="mb-4">
                          <h5 className="font-medium">
                            {category} ({businesses.length}):
                          </h5>
                          <ul className="list-disc pl-5 space-y-1">
                            {businesses.map((business: string, idx: number) => (
                              <li key={idx}>{business}</li>
                            ))}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="indexes">
                  <div>
                    <h4 className="font-semibold mb-2">Category Indexes:</h4>
                    {Object.entries(categories.categoryIndexes || {}).map(
                      ([category, businessIds]: [string, any], index) => (
                        <div key={index} className="mb-4">
                          <h5 className="font-medium">
                            {category} ({businessIds.length} businesses):
                          </h5>
                          <ul className="list-disc pl-5 space-y-1">
                            {businessIds.map((id: string, idx: number) => (
                              <li key={idx}>{id}</li>
                            ))}
                          </ul>
                        </div>
                      ),
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
