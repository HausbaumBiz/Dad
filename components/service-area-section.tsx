"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function ServiceAreaSection() {
  const [zipCode, setZipCode] = useState("")
  const [radius, setRadius] = useState(100)
  const [isNationwide, setIsNationwide] = useState(false)
  const [zipResults, setZipResults] = useState<string[]>([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real implementation, this would call an API to get zip codes
    // For now, we'll just add the entered zip code to the results
    if (zipCode && !zipResults.includes(zipCode)) {
      setZipResults([...zipResults, zipCode])
    }
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
              <Input
                type="text"
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                disabled={isNationwide}
                className="max-w-xs"
                required
              />
              <Button type="submit" disabled={isNationwide}>
                Search
              </Button>
            </div>
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

          <div className="max-h-40 overflow-y-auto p-2">
            {zipResults.length > 0 ? (
              <ul className="space-y-1">
                {zipResults.map((zip, index) => (
                  <li key={index} className="px-3 py-1 bg-white rounded border border-gray-200">
                    {zip}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 italic">No ZIP codes added yet</p>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary-dark"
              onClick={handleRemoveAll}
            >
              Remove All
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Checkbox
            id="nationwide"
            checked={isNationwide}
            onCheckedChange={(checked) => setIsNationwide(checked === true)}
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
