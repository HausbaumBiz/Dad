"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { addSampleFuneralBusinesses } from "../actions/add-sample-businesses"

export default function AddSampleDataPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleAddFuneralBusinesses = async () => {
    setLoading(true)
    try {
      const result = await addSampleFuneralBusinesses()
      setResults(result)
    } catch (error) {
      console.error("Error adding sample data:", error)
      setResults({
        success: false,
        message: error instanceof Error ? error.message : "An error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Add Sample Data</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Funeral Services Businesses</CardTitle>
          <CardDescription>
            Add sample funeral service businesses to the database for testing and demonstration purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            This will add 3 sample funeral service businesses with the category &quot;mortuaryServices&quot;. Each
            business will have sample data including name, contact information, services, and service areas.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddFuneralBusinesses} disabled={loading}>
            {loading ? "Adding..." : "Add Sample Funeral Businesses"}
          </Button>
        </CardFooter>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>{results.success ? "Success" : "Error"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{results.message}</p>

            {results.results && results.results.length > 0 && (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.results.map((result: any, index: number) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.businessName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              result.status === "added"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {result.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
