"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

interface CategoryFilterOption {
  id: string
  label: string
  value: string
}

interface CategoryFilterProps {
  options: CategoryFilterOption[]
  onChange?: (value: string[]) => void
  activeFilters?: string[]
}

export function CategoryFilter({ options, onChange, activeFilters = [] }: CategoryFilterProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>(activeFilters)

  // Update local state when activeFilters prop changes
  useEffect(() => {
    setSelectedFilters(activeFilters)
  }, [activeFilters])

  const handleFilterClick = (filterId: string) => {
    let newFilters: string[]

    if (selectedFilters.includes(filterId)) {
      // Remove filter if already selected
      newFilters = selectedFilters.filter((id) => id !== filterId)
    } else {
      // Add filter if not already selected
      newFilters = [...selectedFilters, filterId]
    }

    setSelectedFilters(newFilters)

    if (onChange) {
      onChange(newFilters)
    }
  }

  const clearFilters = () => {
    setSelectedFilters([])
    if (onChange) {
      onChange([])
    }
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Filter by Service</h2>
        {selectedFilters.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-sm text-gray-500">
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
      <ScrollArea className="whitespace-nowrap pb-2 -mx-1 px-1">
        <div className="flex space-x-2">
          {options.map((option) => (
            <Button
              key={option.id}
              variant={selectedFilters.includes(option.id) ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterClick(option.id)}
              className="rounded-full"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
