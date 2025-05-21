"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"

interface CategorySubcategoriesProps {
  categoryTitle: string
  subcategories: string[]
  onSelectionChange?: (selected: string[]) => void
}

export function CategorySubcategories({ categoryTitle, subcategories, onSelectionChange }: CategorySubcategoriesProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedSubcategories, setSelectedSubcategories] = useState<Record<string, boolean>>({})

  const handleCheckboxChange = (subcategory: string, checked: boolean) => {
    const newSelected = { ...selectedSubcategories, [subcategory]: checked }
    setSelectedSubcategories(newSelected)

    if (onSelectionChange) {
      const selectedItems = Object.entries(newSelected)
        .filter(([_, isSelected]) => isSelected)
        .map(([name]) => name)
      onSelectionChange(selectedItems)
    }
  }

  return (
    <div className="mt-2">
      <Button
        variant="ghost"
        className="p-0 h-auto w-full flex justify-between items-center text-sm text-gray-600 hover:text-gray-900"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>View subcategories</span>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isExpanded && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2 pt-2 border-t border-gray-100">
          {subcategories.map((subcategory, index) => (
            <div key={index} className="flex items-start space-x-2">
              <Checkbox
                id={`${categoryTitle}-${index}`}
                checked={selectedSubcategories[subcategory] || false}
                onCheckedChange={(checked) => handleCheckboxChange(subcategory, checked === true)}
              />
              <Label htmlFor={`${categoryTitle}-${index}`} className="text-sm font-normal cursor-pointer">
                {subcategory}
              </Label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
