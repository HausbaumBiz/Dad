"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface FilterOption {
  id: string
  label: string
  value: string
}

interface CategoryFilterProps {
  options: FilterOption[]
  title?: string
}

export function CategoryFilter({
  options,
  title = "Filter Your Search Further or Browse the Entire Category",
}: CategoryFilterProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedFilters((prev) => [...prev, value])
    } else {
      setSelectedFilters((prev) => prev.filter((item) => item !== value))
    }
  }

  const applyFilters = () => {
    if (selectedFilters.length === 0) {
      toast({
        title: "No filters selected",
        description: "Please select at least one filter option",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Filters applied",
      description: `Selected filters: ${selectedFilters.join(", ")}`,
    })

    // In a real application, this would filter the results or navigate to a filtered view
    console.log("Applied filters:", selectedFilters)
  }

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
          {options.map((option) => (
            <div key={option.id} className="flex items-start space-x-2 py-1">
              <Checkbox
                id={option.id}
                onCheckedChange={(checked) => handleCheckboxChange(option.value, checked === true)}
              />
              <Label
                htmlFor={option.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
        <Button onClick={applyFilters} className="mt-6">
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  )
}
