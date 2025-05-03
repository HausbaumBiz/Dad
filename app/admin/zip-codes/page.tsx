"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, Search, Database, AlertCircle } from "lucide-react"
import type { ZipCodeData, ZipCodeImportStats } from "@/lib/zip-code-types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

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
      setError(null)
      setDebugInfo(null)
    }
  }

  // Handle file upload
  const handleUpload = async () => {
    if (!file) return

    setIsUploading(true)
    setError(null)
    setDebugInfo(null)
    setUploadStats(null)

    try {
      // Read the file
      const fileContent = await readFileAsText(file)

      // Debug info for file content
      const previewContent = fileContent.slice(0, 200) + "..."
      setDebugInfo(`File preview: ${previewContent}`)

      // Parse the CSV or JSON
      let zipCodes: ZipCodeData[] = []

      if (file.name.endsWith(".json")) {
        try {
          zipCodes = JSON.parse(fileContent)
        } catch (e) {
          throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : "Unknown error"}`)
        }
      } else if (file.name.endsWith(".csv")) {
        try {
          zipCodes = parseCSV(fileContent)

          // Debug info for parsed data
          if (zipCodes.length > 0) {
            setDebugInfo(
              (prev) => `${prev}\n\nParsed ${zipCodes.length} records. First record: ${JSON.stringify(zipCodes[0])}`,
            )
          } else {
            setDebugInfo((prev) => `${prev}\n\nNo records parsed from CSV.`)
          }
        } catch (e) {
          throw new Error(`Failed to parse CSV: ${e instanceof Error ? e.message : "Unknown error"}`)
        }
      } else {
        throw new Error("Unsupported file format. Please upload a CSV or JSON file.")
      }

      // Validate the data
      if (!Array.isArray(zipCodes)) {
        throw new Error("Invalid data format. Expected an array of ZIP codes.")
      }

      if (zipCodes.length === 0) {
        throw new Error("No valid ZIP code records found in the file. Please check the file format.")
      }

      // Map column names if needed
      zipCodes = zipCodes.map((zipCode) => {
        const mappedZipCode: any = {}

        // Handle different column naming conventions
        mappedZipCode.zip = zipCode.zip || zipCode.zipCode || zipCode.zipcode || zipCode.postal_code || ""

        // Handle lat/lng specifically for the user's format
        mappedZipCode.latitude = Number.parseFloat(String(zipCode.latitude || zipCode.lat || 0))
        mappedZipCode.longitude = Number.parseFloat(String(zipCode.longitude || zipCode.lng || zipCode.long || 0))

        // Handle city and state with the user's format
        mappedZipCode.city = zipCode.city || ""
        mappedZipCode.state = zipCode.state || zipCode.state_name || ""

        // Optional fields
        if (zipCode.county) mappedZipCode.county = zipCode.county
        if (zipCode.timezone) mappedZipCode.timezone = zipCode.timezone
        if (zipCode.population) mappedZipCode.population = Number(zipCode.population)

        return mappedZipCode as ZipCodeData
      })

      // Validate required fields
      const validZipCodes = zipCodes.filter(
        (zipCode) =>
          zipCode.zip &&
          !isNaN(Number(zipCode.latitude)) &&
          !isNaN(Number(zipCode.longitude)) &&
          zipCode.city &&
          zipCode.state,
      )

      if (validZipCodes.length === 0) {
        throw new Error(
          "No valid ZIP code records found after validation. Please ensure your file has the required fields: zipCode, latitude, longitude, city, and state.",
        )
      }

      setDebugInfo((prev) => `${prev}\n\nValid records: ${validZipCodes.length} out of ${zipCodes.length}`)

      // Send the data to the server
      const response = await fetch("/api/zip-codes/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer ULMAAIjcDFkMmZlZTE2NjU1MTM0ODA2YjVkOTAzZDQyYjQ2NWMyY3AxMA", // Replace with actual auth in production
        },
        body: JSON.stringify({ zipCodes: validZipCodes }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to import ZIP codes")
      }

      const result = await response.json()
      setUploadStats(result.stats)

      // Update database stats
      const statsResponse = await fetch("/api/zip-codes/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setDbStats(statsData)
      }

      setDebugInfo(
        (prev) => `${prev}\n\nImport successful. Imported ${result.stats.imported} ZIP codes to the database.`,
      )
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
      // First get the ZIP code details
      const detailsResponse = await fetch(`/api/zip-codes/search?zip=${searchZip}`)

      if (!detailsResponse.ok) {
        const errorData = await detailsResponse.json()
        throw new Error(errorData.error || "ZIP code not found")
      }

      const detailsData = await detailsResponse.json()

      if (detailsData.zipCode) {
        setZipDetails(detailsData.zipCode)
      }

      // Then search for ZIP codes in radius
      if (searchRadius !== "0") {
        const response = await fetch(`/api/zip-codes/radius?zip=${searchZip}&radius=${searchRadius}&limit=50`)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to find ZIP codes in this radius")
        }

        const data = await response.json()

        if (data.zipCodes && Array.isArray(data.zipCodes)) {
          setSearchResults(data.zipCodes)
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An error occurred while searching for ZIP codes")
      }
    } finally {
      setIsSearching(false)
    }
  }

  // Handle importing sample data
  const handleImportSample = async () => {
    setIsUploading(true)
    setError(null)
    setDebugInfo(null)

    try {
      const response = await fetch("/api/zip-codes/import-sample")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to import sample ZIP codes")
      }

      const data = await response.json()
      setUploadStats(data.stats)

      // Update database stats
      const statsResponse = await fetch("/api/zip-codes/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setDbStats(statsData)
      }

      setDebugInfo(`Successfully imported ${data.stats.imported} sample ZIP codes`)
    } catch (error) {
      console.error("Error importing sample ZIP codes:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsUploading(false)
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

                {dbStats.count === 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleImportSample}
                    disabled={isUploading}
                    className="mt-4"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Import Sample ZIP Codes
                      </>
                    )}
                  </Button>
                )}
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
                <p className="text-xs text-gray-500 mt-1">
                  Accepts CSV or JSON files with ZIP code data. Required fields: zipCode, latitude, longitude, city,
                  state
                </p>
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

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {debugInfo && (
                <div className="bg-gray-100 p-3 rounded-md text-xs font-mono overflow-x-auto">
                  <p className="font-semibold mb-1">Debug Information:</p>
                  <pre className="whitespace-pre-wrap">{debugInfo}</pre>
                </div>
              )}

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
                      <th className="pb-2">Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((zip) => (
                      <tr key={zip.zip} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="py-2">{zip.zip}</td>
                        <td className="py-2">{zip.city}</td>
                        <td className="py-2">{zip.state}</td>
                        <td className="py-2 hidden md:table-cell">{zip.county || "-"}</td>
                        <td className="py-2">{zip.distance !== undefined ? `${zip.distance.toFixed(1)} mi` : "-"}</td>
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
  // Trim the input to remove any leading/trailing whitespace
  const trimmedCsv = csv.trim()

  if (!trimmedCsv) {
    throw new Error("CSV file is empty")
  }

  // Split by newlines, handling different line endings
  const lines = trimmedCsv.split(/\r?\n/)

  if (lines.length < 2) {
    throw new Error("CSV file must have a header row and at least one data row")
  }

  // Parse header row, trimming each header
  const headers = lines[0].split(",").map((h) => h.trim())

  // Check for the specific format: zipCode,latitude,longitude,city,state
  const expectedHeaders = ["zipCode", "latitude", "longitude", "city", "state"]
  const hasAllExpectedHeaders = expectedHeaders.every((header) => headers.includes(header))

  if (!hasAllExpectedHeaders) {
    throw new Error(`CSV must have the columns: ${expectedHeaders.join(", ")}. Found: ${headers.join(", ")}`)
  }

  const zipCodes: ZipCodeData[] = []

  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    // Split the line by comma
    const values = line.split(",").map((v) => v.trim())

    // Skip if we don't have enough values
    if (values.length < headers.length) {
      console.warn(`Line ${i} has fewer values than headers, skipping: ${line}`)
      continue
    }

    // Create a map of header -> value
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = values[index]
    })

    // Create the ZIP code object with the expected format
    const zipCode: ZipCodeData = {
      zip: record.zipCode,
      latitude: Number.parseFloat(record.latitude),
      longitude: Number.parseFloat(record.longitude),
      city: record.city,
      state: record.state,
      country: "US", // Default to US
    }

    // Add optional fields if they exist
    if (record.county) zipCode.county = record.county
    if (record.timezone) zipCode.timezone = record.timezone
    if (record.population) zipCode.population = Number.parseInt(record.population, 10)

    zipCodes.push(zipCode)
  }

  return zipCodes
}
