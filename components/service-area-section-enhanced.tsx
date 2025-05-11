"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, X, Search, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import type { ZipCodeData } from "@/lib/zip-code-types"
import { saveBusinessZipCodes, getBusinessZipCodes } from "@/app/actions/zip-code-actions"

export function ServiceAreaSectionEnhanced() {
  const [zipCode, setZipCode] = useState("")
  const [radius, setRadius] = useState(25)
  const [isNationwide, setIsNationwide] = useState(false)
  const [zipResults, setZipResults] = useState<ZipCodeData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<string | null>(null)
  const { toast } = useToast()

  // Load saved ZIP codes on component mount
  useEffect(() => {
    async function loadZipCodes() {
      try {
        const result = await getBusinessZipCodes()
        if (result.success && result.data) {
          setZipResults(result.data.zipCodes)
          setIsNationwide(result.data.isNationwide)
        }
      } catch (error) {
        console.error("Error loading ZIP codes:", error)
      }
    }

    loadZipCodes()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!zipCode) {
      setError("Please enter a ZIP code")
      return
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zipCode)) {
      setError("Invalid ZIP code format. Must be 5 digits.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use the API endpoint to search for ZIP codes within the radius
      const response = await fetch(`/api/zip-codes/radius?zip=${zipCode}&radius=${radius}&limit=100`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Add the results to the existing results (avoiding duplicates)
      setZipResults((prevResults) => {
        const existingZips = new Set(prevResults.map((z) => z.zip))
        const newResults = data.zipCodes.filter((z: ZipCodeData) => !existingZips.has(z.zip))
        return [...prevResults, ...newResults]
      })

      // Store the data source for informational purposes
      setDataSource(data.source || "unknown")

      // Clear the input
      setZipCode("")
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An error occurred while searching for ZIP codes")
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

  const handleSaveZipCodes = async () => {
    setIsSaving(true)
    try {
      // Ensure zipResults is a valid array of ZipCodeData objects
      const validZipCodes = zipResults.map((zip) => ({
        zip: zip.zip || "",
        city: zip.city || "Unknown City",
        state: zip.state || "Unknown State",
        latitude: zip.latitude || 0,
        longitude: zip.longitude || 0,
        distance: zip.distance,
      }))

      const result = await saveBusinessZipCodes(validZipCodes, isNationwide)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your service area has been saved",
        })
      } else {
        throw new Error(result.message || "Failed to save service area")
      }
    } catch (error) {
      console.error("Error saving ZIP codes:", error)
      toast({
        title: "Error",
        description: "Failed to save your service area",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Let's define your service area</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <Label htmlFor="zipCode" className="block mb-1">
              Enter your ZIP code of your business:
            </Label>
            <p className="text-sm text-gray-500 mb-2">
              (if you have multiple locations enter a zip code for each separately)
            </p>
            <div className="flex justify-center gap-2">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Input
                  type="text"
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  disabled={isNationwide}
                  className="pl-10"
                  placeholder="Enter ZIP code"
                  required
                />
              </div>
              <Button type="submit" disabled={isNationwide || isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
            {dataSource && (
              <p className="text-xs text-gray-500 mt-1">
                Using ZIP code data from: {dataSource === "blob" ? "online database" : dataSource}
              </p>
            )}
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
                const value = e.target.value === "" ? 25 : Number(e.target.value)
                setRadius(isNaN(value) ? 25 : value)
              }}
              disabled={isNationwide}
              className="w-20 text-center"
              min={5}
              max={300}
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
                        </span>
                      )}
                      {zip.distance !== undefined && (
                        <span className="text-xs text-blue-500">{zip.distance.toFixed(1)} miles</span>
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
            Check Here if your service is nationwide or web based.
          </Label>
        </div>

        <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
          <div className="flex items-start">
            <Info className="text-blue-500 mt-0.5 mr-2 h-5 w-5 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Your first ZIP code will be used as your primary location and will be displayed on your business listing.
              We'll automatically fetch and store the city and state information for each ZIP code.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveZipCodes} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
