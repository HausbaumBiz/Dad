"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const DebugCategoryPage = () => {
  const [categoryName, setCategoryName] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [loading, setLoading] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState(null)

  const runDiagnosis = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/debug/diagnose-category?categoryId=${categoryId}`)
      const result = await response.json()
      setDiagnosisResult(result)
    } catch (error) {
      console.error("Failed to run diagnosis:", error)
    } finally {
      setLoading(false)
    }
  }

  const populateTestData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug/populate-lawn-garden-test-data", {
        method: "POST",
      })
      const result = await response.json()
      console.log("Test data result:", result)
      // Run diagnosis again after populating data
      await runDiagnosis()
    } catch (error) {
      console.error("Failed to populate test data:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Debug Category</CardTitle>
          <CardDescription>Tools for debugging category-related issues.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category-id">Category ID</Label>
              <Input id="category-id" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="category-name">Category Name</Label>
              <Input id="category-name" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
            </div>
          </div>
          <Button onClick={runDiagnosis} disabled={loading}>
            Run Diagnosis
          </Button>
          <Button onClick={populateTestData} disabled={loading} variant="outline">
            Populate Test Data
          </Button>

          {diagnosisResult && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Diagnosis Result:</h3>
              <pre>{JSON.stringify(diagnosisResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DebugCategoryPage
