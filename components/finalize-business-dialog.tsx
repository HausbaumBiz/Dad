"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, AlertCircle, ExternalLink } from "lucide-react"
import { getCurrentBusiness } from "@/app/actions/auth-actions"
import { getBusinessCategories } from "@/app/actions/category-actions"
import { getBusinessZipCodes } from "@/app/actions/zip-code-actions"
import { getRouteForCategoryName } from "@/lib/category-route-mapping"
import type { CategorySelection } from "@/components/category-selector"
import type { ZipCodeData } from "@/lib/zip-code-types"

interface UniquePageInfo {
  pageUrl: string
  categories: Array<{
    category: string
    subcategory: string
  }>
}

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
  const [isLoading, setIsLoading] = useState(false)
  const [businessName, setBusinessName] = useState<string>("")
  const [categories, setCategories] = useState<CategorySelection[]>([])
  const [uniquePages, setUniquePages] = useState<UniquePageInfo[]>([])
  const [zipCodes, setZipCodes] = useState<ZipCodeData[]>([])
  const [isNationwide, setIsNationwide] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadBusinessData()
    }
  }, [isOpen, businessId])

  const handleFinalize = async () => {
    setIsLoading(true)
    try {
      await onFinalize()
    } catch (error) {
      console.error("Error finalizing business:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const findPageUrlForCategory = (category: CategorySelection): string => {
    // Try with category name first
    let pageUrl = getRouteForCategoryName(category.category)

    // If that fails, try with subcategory
    if (!pageUrl && category.subcategory) {
      pageUrl = getRouteForCategoryName(category.subcategory)
    }

    // If that fails and we have a fullPath, try extracting from there
    if (!pageUrl && category.fullPath) {
      const pathParts = category.fullPath.split(" > ")
      if (pathParts.length > 0) {
        // Try with the main category from path
        pageUrl = getRouteForCategoryName(pathParts[0])

        // If that fails and we have a subcategory in the path, try with that
        if (!pageUrl && pathParts.length > 1) {
          pageUrl = getRouteForCategoryName(pathParts[pathParts.length - 1])
        }
      }
    }

    return pageUrl || ""
  }

  const loadBusinessData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Get business info
      const business = await getCurrentBusiness()
      if (business) {
        setBusinessName(business.businessName || "Your Business")
      }

      // Load categories
      const categoriesResult = await getBusinessCategories()
      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data)

        // Process all categories and group by unique page URLs
        const pageMap = new Map<string, Array<{ category: string; subcategory: string }>>()

        categoriesResult.data.forEach((category) => {
          const pageUrl = findPageUrlForCategory(category)
          if (pageUrl) {
            if (!pageMap.has(pageUrl)) {
              pageMap.set(pageUrl, [])
            }
            pageMap.get(pageUrl)!.push({
              category: category.category,
              subcategory: category.subcategory,
            })
          }
        })

        // Convert map to array of unique pages
        const uniquePagesArray: UniquePageInfo[] = Array.from(pageMap.entries()).map(([pageUrl, categories]) => ({
          pageUrl,
          categories,
        }))

        setUniquePages(uniquePagesArray)
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

  const handleViewCategoryPage = (pageUrl: string) => {
    if (pageUrl) {
      window.open(pageUrl, "_blank")
    }
  }

  const categoriesWithoutPages = categories.filter((category) => {
    const pageUrl = findPageUrlForCategory(category)
    return !pageUrl
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Finalize Your Business Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-green-100 rounded-full p-1 mt-0.5">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-800">Ready to Submit</h3>
                <p className="text-sm text-green-700 mt-1">
                  Your business profile is complete and ready to be published.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Business Information</h3>
              <div className="bg-gray-50 rounded-md p-3 text-sm space-y-2">
                <p>
                  <span className="font-medium">Business Name:</span> {businessName}
                </p>
                <p>
                  <span className="font-medium">Selected Categories:</span> {categories.length}
                </p>
              </div>
            </div>

            {uniquePages.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-800 mb-3">
                  Your ad will appear on {uniquePages.length} category page{uniquePages.length > 1 ? "s" : ""}:
                </h3>
                <div className="space-y-3">
                  {uniquePages.map((pageInfo, index) => (
                    <div key={index} className="bg-white rounded-md p-3 border">
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewCategoryPage(pageInfo.pageUrl)}
                          className="h-7 px-3 text-sm font-medium"
                        >
                          {pageInfo.pageUrl}
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Categories mapping to this page:</span>
                        <div className="mt-1 space-y-1">
                          {pageInfo.categories.map((cat, catIndex) => (
                            <div key={catIndex} className="ml-2">
                              • {cat.category} → {cat.subcategory}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {categoriesWithoutPages.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <h4 className="font-medium text-yellow-800 text-sm mb-2">
                  Categories without corresponding pages ({categoriesWithoutPages.length}):
                </h4>
                <div className="space-y-1">
                  {categoriesWithoutPages.map((category, index) => (
                    <div key={index} className="text-sm text-yellow-700">
                      • {category.category} → {category.subcategory}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-1 mt-0.5">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-800">What happens next?</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    After finalizing, your business profile will be published and visible to customers on the category
                    pages listed above. You can still make changes to your profile later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Go Back
            </Button>
            <Button
              onClick={handleFinalize}
              disabled={isLoading}
              className="flex-1"
              style={{
                backgroundColor: colorValues.primary,
                color: colorValues.textColor ? "#000000" : "#ffffff",
              }}
            >
              {isLoading ? "Finalizing..." : "Finalize & Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
