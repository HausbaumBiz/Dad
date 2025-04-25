"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Search, Database } from "lucide-react"
import type { ZipCodeData, ZipCodeImportStats } from "@/lib/zip-code-types"

export default function ZipCodeAdminPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStats, setUploadStats] = useState<ZipCodeImportStats | null>(null)
  const [searchZip, setSearchZip] = useState("")
  const [searchRadius, setSearchRadius] = useState("25")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<ZipCodeData[]>([])
  const [zipDetails, setZipDetails] = useState<ZipCodeData | null>(null)
  const [dbStats, setDbStats] = useState<{ count: number; lastUpdated: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch database stats on load
  useEffect(() => {
    async function fetchDbStats() {
      try {
        const response = await fetch("/api/zip-codes/stats")
        if (response.ok) {
          const data = await response.json()
          setDbStats(data)
        }
      } catch (error) {
        console.error("Error fetching ZIP code database stats:", error)
      }
    }

    fetchDbStats()
  }, [])

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setUploadStats(null)

    try {
      // Read the file
      const fileContent = await readFileAsText(file)

      // Parse the CSV or JSON
      let zipCodes: ZipCodeData[] = []

      if (file.name.endsWith(".json")) {
        zipCodes = JSON.parse(fileContent)
      } else if (file.name.endsWith(".csv")) {
        zipCodes = parseCSV(fileContent)
      } else {
        throw new Error("Unsupported file format. Please upload a CSV or JSON file.")
      }

      // Validate the data
      if (!Array.isArray(zipCodes) || zipCodes.length === 0) {
        throw new Error("Invalid data format or empty file.")
      }

      // Upload the data
      const response = await fetch("/api/zip-codes/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer admin-token", // Replace with proper auth
        },
        body: JSON.stringify({ zipCodes }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to import ZIP codes")
      }

      const result = await response.json()
      setUploadStats(result.stats)

      // Refresh database stats
      const statsResponse = await fetch("/api/zip-codes/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setDbStats(statsData)
      }
    } catch (error) {
      console.error("Error uploading ZIP codes:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsUploading(false)
    }
  }

  // Handle ZIP code search
  const handleSearch = async () => {
    if (!searchZip) return

    setIsSearching(true)
    setError(null)
    setSearchResults([])
    setZipDetails(null)

    try {
      // If searching for a specific ZIP code
      if (searchRadius === "0") {
        const response = await fetch(`/api/zip-codes/search?zip=${searchZip}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "ZIP code not found")
        }

        const data = await response.json()
        setZipDetails(data.zipCode)
      }
      // If searching by radius
      else {
        const response = await fetch(`/api/zip-codes/search?zip=${searchZip}&radius=${searchRadius}`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to search ZIP codes")
        }

        const data = await response.json()
        setSearchResults(data.zipCodes)
      }
    } catch (error) {
      console.error("Error searching ZIP codes:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">ZIP Code Database Administration</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Database Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2" />
              Database Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dbStats ? (
              <div>
                <p className="text-lg font-medium">Total ZIP Codes: {dbStats.count.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Last Updated: {new Date(dbStats.lastUpdated).toLocaleString()}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Loading database statistics...</p>
            )}
          </CardContent>
        </Card>

        {/* Import ZIP Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2" />
              Import ZIP Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="zipFile">Upload ZIP Code Data File</Label>
                <Input
                  id="zipFile"
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-1">Accepts CSV or JSON files with ZIP code data</p>
              </div>

              <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload and Import"
                )}
              </Button>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              {uploadStats && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium mb-2">Import Results:</h3>
                  <ul className="text-sm space-y-1">
                    <li>Total Records: {uploadStats.total}</li>
                    <li>Successfully Imported: {uploadStats.imported}</li>
                    <li>Skipped: {uploadStats.skipped}</li>
                    <li>Errors: {uploadStats.errors}</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search ZIP Codes */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="mr-2" />
            Search ZIP Codes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="searchZip">ZIP Code</Label>
              <Input
                id="searchZip"
                value={searchZip}
                onChange={(e) => setSearchZip(e.target.value)}
                placeholder="Enter ZIP code"
              />
            </div>

            <div className="w-32">
              <Label htmlFor="searchRadius">Radius (miles)</Label>
              <Input
                id="searchRadius"
                type="number"
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
                min="0"
                max="500"
              />
              <p className="text-xs text-gray-500 mt-1">Use 0 for exact match</p>
            </div>

            <div className="self-end">
              <Button onClick={handleSearch} disabled={!searchZip || isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {/* Single ZIP code details */}
          {zipDetails && (
            <div className="bg-gray-50 p-4 rounded-md mb-4">
              <h3 className="font-medium mb-2">ZIP Code Details:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>ZIP Code:</div>
                <div className="font-medium">{zipDetails.zip}</div>

                <div>City:</div>
                <div className="font-medium">{zipDetails.city}</div>

                <div>State:</div>
                <div className="font-medium">{zipDetails.state}</div>

                <div>Coordinates:</div>
                <div className="font-medium">
                  {zipDetails.latitude}, {zipDetails.longitude}
                </div>

                {zipDetails.county && (
                  <>
                    <div>County:</div>
                    <div className="font-medium">{zipDetails.county}</div>
                  </>
                )}

                {zipDetails.timezone && (
                  <>
                    <div>Timezone:</div>
                    <div className="font-medium">{zipDetails.timezone}</div>
                  </>
                )}

                {zipDetails.population && (
                  <>
                    <div>Population:</div>
                    <div className="font-medium">{zipDetails.population.toLocaleString()}</div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Search results */}
          {searchResults.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">
                Found {searchResults.length} ZIP codes within {searchRadius} miles of {searchZip}:
              </h3>

              <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr className="border-b">
                      <th className="pb-2">ZIP</th>
                      <th className="pb-2">City</th>
                      <th className="pb-2">State</th>
                      <th className="pb-2 hidden md:table-cell">County</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((zip) => (
                      <tr key={zip.zip} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="py-2">{zip.zip}</td>
                        <td className="py-2">{zip.city}</td>
                        <td className="py-2">{zip.state}</td>
                        <td className="py-2 hidden md:table-cell">{zip.county || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to read file as text
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string)
      } else {
        reject(new Error("Failed to read file"))
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

// Helper function to parse CSV
function parseCSV(csv: string): ZipCodeData[] {
  const lines = csv.split("\n")
  const headers = lines[0].split(",").map((h) => h.trim())

  const zipCodes: ZipCodeData[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(",").map((v) => v.trim())
    const zipData: any = {}

    headers.forEach((header, index) => {
      if (index < values.length) {
        // Convert numeric values
        if (["latitude", "longitude", "population"].includes(header)) {
          zipData[header] = Number.parseFloat(values[index])
        } else {
          zipData[header] = values[index]
        }
      }
    })

    // Ensure required fields are present
    if (zipData.zip && zipData.latitude && zipData.longitude) {
      zipCodes.push(zipData as ZipCodeData)
    }
  }

  return zipCodes
}
