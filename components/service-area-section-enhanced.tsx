"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2, X, Search } from "lucide-react"
import { findZipCodesInRadius, getZipCodeData, type ZipCodeData } from "@/lib/zip-code-utils"

export function ServiceAreaSectionEnhanced() {
  const [zipCode, setZipCode] = useState("")
  const [radius, setRadius] = useState(25)
  const [isNationwide, setIsNationwide] = useState(false)
  const [zipResults, setZipResults] = useState<ZipCodeData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zipDatabase, setZipDatabase] = useState<ZipCodeData[]>([])
  const [isDbLoading, setIsDbLoading] = useState(true)

  // Load ZIP code database on component mount
  useEffect(() => {
    const loadZipData = async () => {
      try {
        const data = await getZipCodeData()
        setZipDatabase(data)
        setIsDbLoading(false)
      } catch (err) {
        setError("Failed to load ZIP code database")
        setIsDbLoading(false)
      }
    }

    loadZipData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!zipCode) {
      setError("Please enter a ZIP code")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Find ZIP codes within the radius
      const results = await findZipCodesInRadius(zipCode, radius, zipDatabase)

      // Add the results to the existing results (avoiding duplicates)
      setZipResults((prevResults) => {
        const existingZips = new Set(prevResults.map((z) => z.zip))
        const newResults = results.filter((z) => !existingZips.has(z.zip))
        return [...prevResults, ...newResults]
      })

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
                  disabled={isNationwide || isDbLoading}
                  className="pl-10"
                  placeholder="Enter ZIP code"
                  required
                />
              </div>
              <Button type="submit" disabled={isNationwide || isLoading || isDbLoading}>
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
            {isDbLoading && (
              <p className="text-sm text-amber-600 mt-2">
                <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                Loading ZIP code database...
              </p>
            )}
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        </form>

        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <h2 className="text-lg font-medium">ZIP Codes within</h2>
            <Input
              type="number"
              id="radius"
              value={radius}
              onChange={(e) => setRadius(Number.parseInt(e.target.value))}
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

        <p className="mt-4 text-center text-gray-600">
          You can view all your service area ZIP codes and add or remove ZIP codes on your User Account page.
        </p>

        <div className="mt-6 flex justify-end">
          <Button>Submit</Button>
        </div>
      </CardContent>
    </Card>
  )
}
