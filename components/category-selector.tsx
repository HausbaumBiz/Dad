"use client"
import Image from "next/image"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useState, useEffect, useCallback } from "react"
import { categories, flattenSubcategories } from "@/lib/category-data"

interface CategorySelectorProps {
  onCategoryChange: (selection: CategorySelection, isChecked: boolean) => void
  searchTerm?: string
  initialCheckedState?: Record<string, boolean>
}

export interface CategorySelection {
  category: string
  subcategory: string
  fullPath: string
}

export function CategorySelector({
  onCategoryChange,
  searchTerm = "",
  initialCheckedState = {},
}: CategorySelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>(initialCheckedState)

  // Update checked state when initialCheckedState changes
  useEffect(() => {
    setCheckedState(initialCheckedState)
  }, [initialCheckedState])

  // Filter categories based on search term
  const filteredCategories = searchTerm
    ? categories.filter((category) => {
        // Check if category title matches
        if (category.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          return true
        }

        // Get all subcategories (including nested ones) and check if any match
        const allSubcategories = flattenSubcategories(category)
        return allSubcategories.some((subcategory) => subcategory.toLowerCase().includes(searchTerm.toLowerCase()))
      })
    : categories

  // Auto-expand categories that match the search term or have checked items
  useEffect(() => {
    const categoriesToExpand = new Set<string>()

    // Add categories that match search term
    if (searchTerm) {
      categories
        .filter((category) => {
          if (category.title.toLowerCase().includes(searchTerm.toLowerCase())) {
            return true
          }
          const allSubcategories = flattenSubcategories(category)
          return allSubcategories.some((subcategory) => subcategory.toLowerCase().includes(searchTerm.toLowerCase()))
        })
        .forEach((cat) => categoriesToExpand.add(cat.id))
    }

    // Add categories that have checked items from initialCheckedState, not the current checkedState
    // This prevents the infinite loop
    Object.keys(initialCheckedState).forEach((path) => {
      if (initialCheckedState[path]) {
        // Find which category this belongs to
        for (const category of categories) {
          if (path.startsWith(category.title)) {
            categoriesToExpand.add(category.id)
            break
          }
        }
      }
    })

    setExpandedCategories(Array.from(categoriesToExpand))
  }, [searchTerm, initialCheckedState])

  // Handle checkbox change - use useCallback to prevent recreation on every render
  const handleCheckboxChange = useCallback(
    (selection: CategorySelection, checked: boolean) => {
      setCheckedState((prev) => ({
        ...prev,
        [selection.fullPath]: checked,
      }))
      onCategoryChange(selection, checked)
    },
    [onCategoryChange],
  )

  // Render a subcategory (which might be a string or an object with nested subcategories)
  const renderSubcategory = (parentId: string, parentTitle: string, subcategory: any, index: number) => {
    if (typeof subcategory === "string") {
      // Regular subcategory (string)
      const selection: CategorySelection = {
        category: parentTitle,
        subcategory: subcategory,
        fullPath: `${parentTitle} > ${subcategory}`,
      }

      return (
        <div key={index} className="flex items-start gap-2">
          <Checkbox
            id={`${parentId}-${index}`}
            checked={checkedState[selection.fullPath] || false}
            onCheckedChange={(checked) => handleCheckboxChange(selection, checked === true)}
          />
          <Label
            htmlFor={`${parentId}-${index}`}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            {subcategory}
          </Label>
        </div>
      )
    } else if (typeof subcategory === "object" && subcategory.title) {
      // Nested category
      return (
        <div key={index} className="mb-4">
          <h4 className="font-medium text-gray-900 mb-2">{subcategory.title}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pl-4">
            {subcategory.subcategories.map((nestedSub: string, nestedIndex: number) => {
              const selection: CategorySelection = {
                category: parentTitle,
                subcategory: `${subcategory.title} > ${nestedSub}`,
                fullPath: `${parentTitle} > ${subcategory.title} > ${nestedSub}`,
              }

              return (
                <div key={nestedIndex} className="flex items-start gap-2">
                  <Checkbox
                    id={`${parentId}-${subcategory.id}-${nestedIndex}`}
                    checked={checkedState[selection.fullPath] || false}
                    onCheckedChange={(checked) => handleCheckboxChange(selection, checked === true)}
                  />
                  <Label
                    htmlFor={`${parentId}-${subcategory.id}-${nestedIndex}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {nestedSub}
                  </Label>
                </div>
              )
            })}
          </div>
        </div>
      )
    }
    return null
  }

  // Function to get a valid image source
  const getValidImageSrc = (imagePath: string | undefined | null): string => {
    // If imagePath is undefined, null, or an empty string, return a placeholder
    if (!imagePath || imagePath === "") {
      return "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/placeholder-ob7miW3mUreePYfXdVwkpFWHthzoR5.svg?height=96&width=96"
    }
    return imagePath
  }

  return (
    <div className="space-y-6">
      {filteredCategories.map((category, index) => (
        <Accordion
          key={category.id}
          type="single"
          collapsible
          value={expandedCategories.includes(category.id) ? category.id : undefined}
          onValueChange={(value) => {
            if (value) {
              setExpandedCategories((prev) => (prev.includes(category.id) ? prev : [...prev, category.id]))
            } else {
              setExpandedCategories((prev) => prev.filter((id) => id !== category.id))
            }
          }}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md"
        >
          <AccordionItem value={category.id}>
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-md shadow-md border border-gray-200">
                  <Image
                    src={getValidImageSrc(category.image) || "/placeholder.svg"}
                    alt={category.title}
                    fill
                    style={{ objectFit: "cover" }}
                    className="hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 768px) 96px, 96px"
                    priority={index < 3}
                    unoptimized={true}
                  />
                </div>
                <h3 className="text-xl font-semibold text-left">{category.title}</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 py-4 bg-gray-50">
              <div className="space-y-4">
                {Array.isArray(category.subcategories) &&
                  category.subcategories.map((subcategory, index) =>
                    renderSubcategory(category.id, category.title, subcategory, index),
                  )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ))}
      {filteredCategories.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No categories match your search. Try a different term or suggest a new category.
          </p>
        </div>
      )}
    </div>
  )
}
