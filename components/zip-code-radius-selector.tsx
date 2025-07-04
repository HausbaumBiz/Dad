"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Search, MapPin, Globe, Trash2 } from "lucide-react"
import type { ZipCodeData } from "@/lib/zip-code-types"

interface ZipCodeRadiusSelectorProps {
  onZipCodesSelected: (zipCodes: ZipCodeData[]) => void
  onNationwideToggle: (isNationwide: boolean) => void
  defaultRadius?: number
  maxRadius?: number
  maxResults?: number
  allowNationwide?: boolean
  initialZipCodes?: ZipCodeData[]
  initialNationwide?: boolean
}

export function ZipCodeRadiusSelector({
  onZipCodesSelected,
  onNationwideToggle,
  defaultRadius = 25,
  maxRadius = 100,
  maxResults = 500,
  allowNationwide = true,
  initialZipCodes = [],
  initialNationwide = false,
}: ZipCodeRadiusSelectorProps) {
  const [centerZipCode, setCenterZipCode] = useState("")
  const [radius, setRadius] = useState([defaultRadius])
  const [selectedZipCodes, setSelectedZipCodes] = useState<ZipCodeData[]>([])
  const [isNationwide, setIsNationwide] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Initialize with provided data - only run once when props change
  useEffect(() => {
    console.log("[ZIP SELECTOR] Props changed:", {
      initialZipCodesLength: Array.isArray(initialZipCodes) ? initialZipCodes.length : "not array",
      initialZipCodesType: typeof initialZipCodes,
      initialNationwide,
      hasInitialized,
    })

    // Ensure initialZipCodes is always an array
    const validInitialZipCodes = Array.isArray(initialZipCodes) ? initialZipCodes : []

    console.log("[ZIP SELECTOR] Setting initial state:", {
      zipCodesCount: validInitialZipCodes.length,
      nationwide: initialNationwide,
    })

    setSelectedZipCodes(validInitialZipCodes)
    setIsNationwide(initialNationwide)

    // Set center ZIP code if we have initial data
    if (validInitialZipCodes.length > 0 && validInitialZipCodes[0].zip) {
      setCenterZipCode(validInitialZipCodes[0].zip)
    }

    setHasInitialized(true)
  }, [initialZipCodes, initialNationwide]) // Re-run when props change

  // Only call parent callbacks after initialization and when state actually changes
  useEffect(() => {
    if (hasInitialized) {
      console.log("[ZIP SELECTOR] Calling onZipCodesSelected with:", selectedZipCodes.length, "ZIP codes")
      onZipCodesSelected(selectedZipCodes)
    }
  }, [selectedZipCodes, hasInitialized, onZipCodesSelected])

  useEffect(() => {
    if (hasInitialized) {
      console.log("[ZIP SELECTOR] Calling onNationwideToggle with:", isNationwide)
      onNationwideToggle(isNationwide)
    }
  }, [isNationwide, hasInitialized, onNationwideToggle])

  const searchZipCodes = useCallback(async () => {
    if (!centerZipCode.trim()) {
      setError("Please enter a ZIP code")
      return
    }

    // Validate ZIP code format (5 digits)
    if (!/^\d{5}$/.test(centerZipCode.trim())) {
      setError("Please enter a valid 5-digit ZIP code")
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      console.log("[ZIP SELECTOR] Searching for ZIP codes:", {
        centerZipCode: centerZipCode.trim(),
        radius: radius[0],
        maxResults,
      })

      const response = await fetch(
        `/api/zip-codes/radius?zip=${encodeURIComponent(centerZipCode.trim())}&radius=${radius[0]}&limit=${maxResults}`,
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[ZIP SELECTOR] API Error:", response.status, errorData)
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log("[ZIP SELECTOR] API Response:", data)

      if (!data.success) {
        throw new Error(data.error || data.message || "Failed to search ZIP codes")
      }

      const newZipCodes = Array.isArray(data.zipCodes) ? data.zipCodes : []
      console.log("[ZIP SELECTOR] Found ZIP codes:", newZipCodes.length)

      if (newZipCodes.length === 0) {
        setError("No ZIP codes found in the specified radius")
        return
      }

      // Merge with existing ZIP codes, avoiding duplicates
      const existingZips = new Set(selectedZipCodes.map((z) => z.zip))
      const uniqueNewZipCodes = newZipCodes.filter((z: ZipCodeData) => !existingZips.has(z.zip))

      const updatedZipCodes = [...selectedZipCodes, ...uniqueNewZipCodes]
      console.log("[ZIP SELECTOR] Updated ZIP codes count:", updatedZipCodes.length)

      setSelectedZipCodes(updatedZipCodes)
      setCenterZipCode("") // Clear search input
      setIsNationwide(false) // Clear nationwide when adding specific ZIP codes
    } catch (error) {
      console.error("[ZIP SELECTOR] Error searching ZIP codes:", error)
      setError(error instanceof Error ? error.message : "Failed to search ZIP codes")
    } finally {
      setIsSearching(false)
    }
  }, [centerZipCode, radius, maxResults, selectedZipCodes])

  const handleNationwideToggle = useCallback((checked: boolean) => {
    console.log("[ZIP SELECTOR] Nationwide toggle:", checked)
    setIsNationwide(checked)
    if (checked) {
      setSelectedZipCodes([]) // Clear ZIP codes when going nationwide
    }
    setError(null)
  }, [])

  const removeZipCode = useCallback(
    (zipToRemove: string) => {
      console.log("[ZIP SELECTOR] Removing ZIP code:", zipToRemove)
      const updatedZipCodes = selectedZipCodes.filter((z) => z.zip !== zipToRemove)
      setSelectedZipCodes(updatedZipCodes)
    },
    [selectedZipCodes],
  )

  const clearAllZipCodes = useCallback(() => {
    console.log("[ZIP SELECTOR] Clearing all ZIP codes")
    setSelectedZipCodes([])
    setIsNationwide(false)
  }, [])

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        searchZipCodes()
      }
    },
    [searchZipCodes],
  )

  const handleZipCodeInput = useCallback((value: string) => {
    // Only allow digits and limit to 5 characters
    const cleaned = value.replace(/\D/g, "").slice(0, 5)
    setCenterZipCode(cleaned)
    setError(null)
  }, [])

  // Group ZIP codes by state for better display
  const zipCodesByState = selectedZipCodes.reduce(
    (acc, zipCode) => {
      const state = zipCode.state || "Unknown"
      if (!acc[state]) {
        acc[state] = []
      }
      acc[state].push(zipCode)
      return acc
    },
    {} as Record<string, ZipCodeData[]>,
  )

  if (!hasInitialized) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2">Loading service area...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Nationwide Toggle */}
      {allowNationwide && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Nationwide Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch id="nationwide" checked={isNationwide} onCheckedChange={handleNationwideToggle} />
              <Label htmlFor="nationwide">I provide services nationwide</Label>
            </div>
            {isNationwide && (
              <p className="text-sm text-muted-foreground mt-2">
                Your business will be visible to customers across all ZIP codes
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ZIP Code Search */}
      {!isNationwide && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Search by ZIP Code & Radius
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipcode">Center ZIP Code</Label>
                <Input
                  id="zipcode"
                  type="text"
                  placeholder="Enter ZIP code (e.g., 12345)"
                  value={centerZipCode}
                  onChange={(e) => handleZipCodeInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={5}
                />
              </div>
              <div className="space-y-2">
                <Label>Radius: {radius[0]} miles</Label>
                <Slider value={radius} onValueChange={setRadius} max={maxRadius} min={1} step={1} className="w-full" />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button onClick={searchZipCodes} disabled={isSearching || !centerZipCode.trim()} className="w-full">
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search ZIP Codes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected ZIP Codes Display */}
      {!isNationwide && selectedZipCodes.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Selected ZIP Codes ({selectedZipCodes.length})</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllZipCodes}
              className="text-red-600 hover:text-red-700 bg-transparent"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {Object.entries(zipCodesByState).map(([state, zipCodes]) => (
                  <div key={state}>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">
                      {state} ({zipCodes.length})
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {zipCodes.map((zipCode) => (
                        <Badge key={zipCode.zip} variant="secondary" className="flex items-center gap-1">
                          {zipCode.zip}
                          {zipCode.city && <span className="text-xs text-muted-foreground">({zipCode.city})</span>}
                          <button
                            onClick={() => removeZipCode(zipCode.zip)}
                            className="ml-1 hover:text-red-600"
                            aria-label={`Remove ${zipCode.zip}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            {isNationwide ? (
              <p className="text-lg font-medium text-green-600">✓ Nationwide service selected</p>
            ) : selectedZipCodes.length > 0 ? (
              <p className="text-lg font-medium text-blue-600">
                ✓ {selectedZipCodes.length} ZIP code{selectedZipCodes.length !== 1 ? "s" : ""} selected
              </p>
            ) : (
              <p className="text-muted-foreground">
                No service area selected. Use the search above or enable nationwide service.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
