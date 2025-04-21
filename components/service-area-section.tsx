"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export function ServiceAreaSection() {
  const [zipCode, setZipCode] = useState("")
  const [radius, setRadius] = useState("25")
  const [isNationwide, setIsNationwide] = useState(false)

  const handleSubmit = () => {
    // In a real implementation, this would save the service area
    alert(`Service area submitted!\nZip Code: ${zipCode}\nRadius: ${radius}\nNationwide: ${isNationwide}`)
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Define Your Service Area</CardTitle>
        <p className="text-center text-gray-600">Enter your zip code and service radius, or select nationwide</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="nationwide" checked={isNationwide} onCheckedChange={setIsNationwide} />
            <Label
              htmlFor="nationwide"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Nationwide
            </Label>
          </div>

          {!isNationwide && (
            <>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code</Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="Enter zip code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Service Radius (miles)</Label>
                <Input
                  id="radius"
                  type="number"
                  placeholder="Enter radius"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </CardContent>
    </Card>
  )
}
