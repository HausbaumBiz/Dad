"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, X, Search } from "lucide-react"
import type { ZipCodeData } from "@/lib/zip-code-types"

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
  const [error, setError] = useState<string | null>(null)
  const [zipDetails, setZipDetails] = useState<ZipCodeData | null>(null)

  // Notify parent component when ZIP codes change
  useEffect(() => {
    if (onZipCodesSelected) {
      onZipCodesSelected(zipResults)
    }
  }, [zipResults, onZipCodesSelected])

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
        throw new Error("Invalid ZIP code. Please enter a valid 5-digit ZIP code.")
      }

      const detailsData = await detailsResponse.json()
      setZipDetails(detailsData.zipCode)

      // Then find ZIP codes within the radius
      const response = await fetch(`/api/zip-codes/search?zip=${zipCode}&radius=${radius}&limit=${maxResults}`)

      if (!response.ok) {
        throw new Error("Failed to find ZIP codes in this radius. Please try again.")
      }

      const data = await response.json()

      // Add the results to the existing results (avoiding duplicates)
      setZipResults((prevResults) => {
        const existingZips = new Set(prevResults.map((z) => z.zip))
        const newResults = data.zipCodes.filter((z: ZipCodeData) => !existingZips.has(z.zip))
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
        <CardTitle className="text-2xl text-center">Define Your Service Area</CardTitle>
      </CardHeader>
      <CardContent>
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
                  disabled={isNationwide || isLoading}
                  className="pl-10"
                  placeholder="Enter ZIP code"
                  maxLength={5}
                  pattern="\d{5}"
                  title="Please enter a valid 5-digit ZIP code"
                />
              </div>
              <Button type="submit" disabled={isNationwide || isLoading || !zipCode}>
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
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
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
