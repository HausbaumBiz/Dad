"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { fixArtsCategories } from "@/app/actions/fix-arts-categories"
import { Loader2 } from "lucide-react"

export default function FixArtsCategoriesPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFix = async () => {
    setIsLoading(true)
    try {
      const result = await fixArtsCategories()
      setResult(result)
    } catch (error) {
      setResult({ success: false, message: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Fix Arts & Entertainment Categories</CardTitle>
          <CardDescription>
            This utility will scan all businesses and ensure that those with arts-related categories are properly
            indexed in the Arts & Entertainment category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Use this tool if businesses with Arts & Entertainment subcategories are not showing up on the
            arts-entertainment page.
          </p>
          <Button onClick={handleFix} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fixing...
              </>
            ) : (
              "Fix Arts Categories"
            )}
          </Button>
        </CardContent>
        {result && (
          <CardFooter className="border-t pt-4">
            <div className={`p-4 rounded-md ${result.success ? "bg-green-50" : "bg-red-50"} w-full`}>
              <p className={result.success ? "text-green-700" : "text-red-700"}>{result.message}</p>
              {result.details && (
                <pre className="mt-2 text-xs overflow-auto max-h-40">{JSON.stringify(result.details, null, 2)}</pre>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
