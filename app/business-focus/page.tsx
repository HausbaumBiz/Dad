"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { KeywordsSection } from "@/components/keywords-section"
import { CategorySelector, type CategorySelection } from "@/components/category-selector"
import { SuggestCategoryModal } from "@/components/suggest-category-modal"
import { CategoryChangeWarning } from "@/components/category-change-warning"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { saveBusinessCategories, getBusinessCategories } from "@/app/actions/category-actions"
import { useToast } from "@/components/ui/use-toast"
import { Suspense } from "react"
import { ServiceAreaSectionEnhanced } from "@/components/service-area-section-enhanced"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function ServiceAreaLoading() {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Service Area</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading service area tools...</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function BusinessFocusPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<CategorySelection[]>([])
  const [initialCategories, setInitialCategories] = useState<CategorySelection[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Detect category changes
  const initialCategoryNames = useMemo(() => initialCategories.map((cat) => cat.category), [initialCategories])

  const selectedCategoryNames = useMemo(() => selectedCategories.map((cat) => cat.category), [selectedCategories])

  const hasChanges = useMemo(() => {
    // Check if initial categories are loaded (to avoid false positives)
    if (initialCategories.length === 0 && isLoading) return false

    // If lengths are different, there are changes
    if (initialCategoryNames.length !== selectedCategoryNames.length) return true

    // Check for removed categories
    const removedCategories = initialCategoryNames.filter((cat) => !selectedCategoryNames.includes(cat))

    return removedCategories.length > 0
  }, [initialCategoryNames, selectedCategoryNames, initialCategories.length, isLoading])

  // Load saved categories on component mount
  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true)
      try {
        const result = await getBusinessCategories()
        if (result.success && result.data) {
          setSelectedCategories(result.data)
          setInitialCategories(result.data)

          // Create a map of checked items for the CategorySelector
          const checkedMap: Record<string, boolean> = {}
          result.data.forEach((cat) => {
            checkedMap[cat.fullPath] = true
          })
          setCheckedItems(checkedMap)
        }
      } catch (error) {
        console.error("Error loading categories:", error)
        toast({
          title: "Error",
          description: "Failed to load your saved categories",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  const handleCategoryChange = (selection: CategorySelection, isChecked: boolean) => {
    setCheckedItems((prev) => ({
      ...prev,
      [selection.fullPath]: isChecked,
    }))

    if (isChecked) {
      setSelectedCategories((prev) => [...prev, selection])
    } else {
      setSelectedCategories((prev) => prev.filter((cat) => cat.fullPath !== selection.fullPath))
    }
  }

  // Function to save selected categories
  const handleSubmit = async () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "Warning",
        description: "Please select at least one category before submitting",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Save to server
      console.log(`Saving ${selectedCategories.length} categories:`, selectedCategories)
      const result = await saveBusinessCategories(selectedCategories)

      if (result.success) {
        // Also save to localStorage as a backup
        localStorage.setItem("selectedCategories", JSON.stringify(selectedCategories))

        toast({
          title: "Success",
          description: `Your ${selectedCategories.length} category selections have been saved`,
        })

        // Update initialCategories to match the new selection
        setInitialCategories(selectedCategories)

        // Redirect to workbench
        router.push("/workbench")
      } else {
        throw new Error(result.message || "Failed to save categories")
      }
    } catch (error) {
      console.error("Error saving categories:", error)
      toast({
        title: "Error",
        description: "Failed to save your category selections",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Business Focus & Service Area</h1>
            <p className="text-gray-600">
              Define your business focus and service area to help customers find you more easily.
            </p>
          </div>

          <Suspense fallback={<ServiceAreaLoading />}>
            <ServiceAreaSectionEnhanced />
          </Suspense>

          <KeywordsSection />

          <div className="mt-12 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
              Please select the categories where you would like your Ad Box to be displayed
            </h2>
            <div className="text-center text-gray-600 mb-8">
              <p className="mb-2">
                Browse through our professionally categorized business listings to select where your ad will appear.
              </p>
              <p className="mb-2">
                Each category features high-quality imagery representing professional services in your area.
              </p>
              <p>When finished making your selections, press the submit button at the bottom of the page.</p>
            </div>

            {/* Show category change warning */}
            <CategoryChangeWarning
              hasChanges={hasChanges}
              oldCategories={initialCategoryNames}
              newCategories={selectedCategoryNames}
            />

            <div className="mb-6 relative">
              <div className="flex">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    type="text"
                    placeholder="Search categories or subcategories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  variant="outline"
                  className="ml-2 bg-transparent"
                  onClick={() => setSearchTerm("")}
                  disabled={!searchTerm}
                >
                  Clear
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading your saved categories...</span>
              </div>
            ) : (
              <CategorySelector
                onCategoryChange={handleCategoryChange}
                searchTerm={searchTerm}
                initialCheckedState={checkedItems}
              />
            )}

            <div className="mt-8 text-center">
              <button onClick={() => setIsModalOpen(true)} className="text-primary hover:underline font-medium">
                If you need another Category or Subcategory, click Here
              </button>
            </div>

            <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h2 className="text-xl font-semibold mb-4">
                Selected Categories{" "}
                <span className="text-sm font-normal text-gray-500">(to remove a category uncheck its box)</span>
              </h2>
              {selectedCategories.length > 0 ? (
                <ul className="space-y-2 mb-6 max-h-60 overflow-y-auto">
                  {selectedCategories.map((selection, index) => (
                    <li key={index} className="px-3 py-2 bg-white rounded border border-gray-200">
                      <span className="font-medium">{selection.category}</span> &gt;{" "}
                      <span className="text-gray-700">{selection.subcategory}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic mb-6">No categories selected yet</p>
              )}
              <div className="flex justify-center">
                <Button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                  disabled={isSaving || selectedCategories.length === 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <MainFooter />

      <SuggestCategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
