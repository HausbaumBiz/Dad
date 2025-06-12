"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { searchJobsByZipCodeAndCategory, listBusinessesWithJobs } from "@/app/actions/job-actions"

export function DebugJobSearch() {
  const [zipCode, setZipCode] = useState("")
  const [category, setCategory] = useState("")
  const [results, setResults] = useState<any>(null)
  const [businesses, setBusinesses] = useState<string[]>([])

  const handleSearch = async () => {
    console.log("Debug search triggered")
    const jobs = await searchJobsByZipCodeAndCategory(zipCode, category || undefined)
    setResults(jobs)
  }

  const handleListBusinesses = async () => {
    const businessList = await listBusinessesWithJobs()
    setBusinesses(businessList)
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Debug Job Search</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Zip Code:</label>
          <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Enter zip code" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category (optional):</label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Enter category" />
        </div>

        <div className="flex space-x-2">
          <Button onClick={handleSearch}>Search Jobs</Button>
          <Button onClick={handleListBusinesses} variant="outline">
            List Businesses
          </Button>
        </div>

        {results && (
          <div className="mt-4">
            <h4 className="font-medium">Search Results:</h4>
            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        {businesses.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium">Businesses with Jobs:</h4>
            <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
              {JSON.stringify(businesses, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
