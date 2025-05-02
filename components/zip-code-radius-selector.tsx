"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, X, Search, AlertCircle, Database } from "lucide-react"
import type { ZipCodeData } from "@/lib/zip-code-types"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ZipCodeRadiusSelectorProps {
  onZipCodesSelected?: (zipCodes: ZipCodeData[]) => void
  defaultRadius?: number
  maxRadius?: number
  maxResults?: number
  allowNationwide?: boolean
}

export function ZipCodeRadiusSelector({
  onZipCodesSelected,
  defaultRadius = 25,
  maxRadius = 100,
  maxResults = 100,
  allowNationwide = true,
}: ZipCodeRadiusSelectorProps) {
  const [zipCode, setZipCode] = useState("")
  const [radius, setRadius] = useState(defaultRadius)
  const [isNationwide, setIsNationwide] = useState(false)
  const [zipResults, setZipResults] = useState<ZipCodeData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zipDetails, setZipDetails] = useState<ZipCodeData | null>(null)
  const [dbEmpty, setDbEmpty] = useState(false)
  const { toast } = useToast()

  // Check if the ZIP code database is empty
  useEffect(() => {
    async function checkDatabase() {
      try {
        const response = await fetch("/api/zip-codes/stats")
        if (response.ok) {
          const data = await response.json()
          setDbEmpty(data.count === 0)
        }
      } catch (error) {
        console.error("Error checking ZIP code database:", error)
      }
    }

    checkDatabase()
  }, [])

  // Notify parent component when ZIP codes change
  useEffect(() => {
    if (onZipCodesSelected) {
      onZipCodesSelected(zipResults)
    }
  }, [zipResults, onZipCodesSelected])

  const handleImportSample = async () => {
    setIsImporting(true)
    try {
      const response = await fetch("/api/zip-codes/import-sample")
      if (!response.ok) {
        throw new Error("Failed to import sample ZIP codes")
      }

      const data = await response.json()
      toast({
        title: "Sample ZIP Codes Imported",
        description: `Imported ${data.stats.imported} sample ZIP codes`,
      })

      setDbEmpty(false)
    } catch (error) {
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to import sample ZIP codes",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!zipCode) {
      setError("Please enter a ZIP code")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // First validate the ZIP code
      const detailsResponse = await fetch(`/api/zip-codes/search?zip=${zipCode}`)

      if (!detailsResponse.ok) {
        const errorData = await detailsResponse.json()
        throw new Error(errorData.error || "Invalid ZIP code. Please enter a valid 5-digit ZIP code.")
      }

      const detailsData = await detailsResponse.json()

      if (!detailsData.zipCode) {
        throw new Error("ZIP code not found in our database")
      }

      setZipDetails(detailsData.zipCode)

      // Then find ZIP codes within the radius using our custom implementation
      const response = await fetch(`/api/zip-codes/radius?zip=${zipCode}&radius=${radius}&limit=${maxResults}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to find ZIP codes in this radius. Please try again.")
      }

      const data = await response.json()

      if (!data.zipCodes || !Array.isArray(data.zipCodes)) {
        throw new Error("Invalid response from ZIP code search")
      }

      // Add the results to the existing results (avoiding duplicates)
      setZipResults((prevResults) => {
        const existingZips = new Set(prevResults.map((z) => z.zip))
        const newResults = data.zipCodes.filter((z: ZipCodeData) => !existingZips.has(z.zip))
        return [...prevResults, ...newResults]
      })

      // Clear the input
      setZipCode("")

      toast({
        title: "ZIP Codes Found",
        description: `Found ${data.zipCodes.length} ZIP codes within ${radius} miles of ${zipCode}`,
      })
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
        })
      } else {
        setError("An error occurred while searching for ZIP codes")
        toast({
          title: "Error",
          description: "An error occurred while searching for ZIP codes",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveZip = (zipToRemove: string) => {
    setZipResults((prevResults) => prevResults.filter((z) => z.zip !== zipToRemove))
  }

  const handleRemoveAll = () => {
    setZipResults([])
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Define Your Service Area</CardTitle>
      </CardHeader>
      <CardContent>
        {dbEmpty && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ZIP Code Database Empty</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>Your ZIP code database appears to be empty. Import sample data to use this feature.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportSample}
                disabled={isImporting}
                className="self-start"
              >
                {isImporting ? (
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
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <Label htmlFor="zipCode" className="block mb-1">
              Enter the ZIP code of your business:
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              (if you have multiple locations, enter each ZIP code separately)
            </p>
            <div className="flex justify-center gap-2">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={isNationwide || isLoading || dbEmpty}
                  className="pl-10"
                  placeholder="Enter ZIP code"
                  maxLength={5}
                  pattern="\d{5}"
                  title="Please enter a valid 5-digit ZIP code"
                />
              </div>
              <Button type="submit" disabled={isNationwide || isLoading || !zipCode || dbEmpty}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </div>
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}

            {zipDetails && (
              <div className="mt-2 text-sm">
                <span className="font-medium">
                  {zipDetails.city}, {zipDetails.state}
                </span>
              </div>
            )}
          </div>
        </form>

        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-lg font-medium">ZIP Codes within</h2>
            <Input
              type="number"
              id="radius"
              value={radius.toString()}
              onChange={(e) => {
                const val = e.target.value === "" ? defaultRadius : Number(e.target.value)
                setRadius(isNaN(val) ? defaultRadius : val)
              }}
              disabled={isNationwide}
              className="w-20 text-center"
              min={5}
              max={maxRadius}
            />
            <span>miles:</span>
          </div>

          <div className="max-h-60 overflow-y-auto p-2">
            {zipResults.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {zipResults.map((zip) => (
                  <li
                    key={zip.zip}
                    className="px-3 py-2 bg-white rounded border border-gray-200 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium">{zip.zip}</span>
                      {zip.city && zip.state && (
                        <span className="text-xs text-gray-500 block">
                          {zip.city}, {zip.state}
                          {zip.distance !== undefined && <span className="ml-1">({zip.distance.toFixed(1)} mi)</span>}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      onClick={() => handleRemoveZip(zip.zip)}
                    >
                      <X size={14} />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 italic">No ZIP codes added yet</p>
            )}
          </div>

          <div className="flex justify-between mt-4">
            <p className="text-sm text-gray-500">
              {zipResults.length} ZIP code{zipResults.length !== 1 ? "s" : ""} in your service area
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary-dark"
              onClick={handleRemoveAll}
              disabled={zipResults.length === 0}
            >
              Remove All
            </Button>
          </div>
        </div>

        {allowNationwide && (
          <div className="mt-6 flex items-center gap-2">
            <Checkbox
              id="nationwide"
              checked={isNationwide}
              onCheckedChange={(checked) => {
                setIsNationwide(checked === true)
                if (checked === true) {
                  // Save the current ZIP results before clearing
                  setZipResults([])
                }
              }}
            />
            <Label htmlFor="nationwide" className="text-base">
              Check here if your service is nationwide or web-based
            </Label>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
