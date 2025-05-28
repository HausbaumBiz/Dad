"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { getBusinessCategories } from "@/app/actions/category-actions"
import { getBusinessZipCodes } from "@/app/actions/zip-code-actions"
import type { CategorySelection } from "@/components/category-selector"
import type { ZipCodeData } from "@/lib/zip-code-types"

interface FinalizeBusinessDialogProps {
  isOpen: boolean
  onClose: () => void
  businessId: string
  onFinalize: () => void
  colorValues: {
    primary: string
    secondary: string
    textColor?: string
  }
}

export function FinalizeBusinessDialog({
  isOpen,
  onClose,
  businessId,
  onFinalize,
  colorValues,
}: FinalizeBusinessDialogProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<CategorySelection[]>([])
  const [zipCodes, setZipCodes] = useState<ZipCodeData[]>([])
  const [isNationwide, setIsNationwide] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Status flags
  const hasCategoriesSelected = categories.length > 0
  const hasZipCodesSelected = zipCodes.length > 0 || isNationwide

  useEffect(() => {
    if (isOpen) {
      loadBusinessData()
    }
  }, [isOpen, businessId])

  const loadBusinessData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load categories
      const categoriesResult = await getBusinessCategories()
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data)
      }

      // Load ZIP codes
      const zipCodesResult = await getBusinessZipCodes()
      if (zipCodesResult.success && zipCodesResult.data) {
        setZipCodes(zipCodesResult.data.zipCodes || [])
        setIsNationwide(zipCodesResult.data.isNationwide || false)
      }
    } catch (err) {
      console.error("Error loading business data:", err)
      setError("Failed to load business data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinalize = () => {
    onFinalize()
    onClose()
  }

  const getPrimaryZipCode = () => {
    return zipCodes.length > 0 ? zipCodes[0] : null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Business Profile Summary</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            <span className="ml-3 text-gray-500">Loading business data...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-800">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Categories Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${hasCategoriesSelected ? "bg-green-500" : "bg-yellow-500"}`} />
                <h3 className="text-lg font-medium">Business Categories</h3>
              </div>

              {hasCategoriesSelected ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <ul className="space-y-2">
                    {categories.map((category, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{category.category}</p>
                          <p className="text-sm text-gray-600">{category.subcategory}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    <p className="text-yellow-800">
                      No business categories selected. Please select at least one category for your business.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ZIP Codes Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${hasZipCodesSelected ? "bg-green-500" : "bg-yellow-500"}`} />
                <h3 className="text-lg font-medium">Service Area</h3>
              </div>

              {isNationwide ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <p>Nationwide service area selected</p>
                  </div>
                </div>
              ) : hasZipCodesSelected ? (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Primary Location:</p>
                        <p>
                          {getPrimaryZipCode()?.zip} - {getPrimaryZipCode()?.city}, {getPrimaryZipCode()?.state}
                        </p>
                      </div>
                    </div>
                    <p>
                      <span className="font-medium">{zipCodes.length - 1}</span> additional ZIP codes in service area
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                    <p className="text-yellow-800">
                      No service area defined. Please select ZIP codes or choose nationwide service.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-blue-800">
                <strong>Note:</strong> Your business profile should include both categories and a service area to be
                properly listed in search results and category pages.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>
            Continue Editing
          </Button>
          <Button
            onClick={handleFinalize}
            disabled={isLoading || (!hasCategoriesSelected && !hasZipCodesSelected)}
            style={{
              backgroundColor: colorValues.primary,
              color: colorValues.textColor ? "#000000" : "#ffffff",
            }}
          >
            Finalize and Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
