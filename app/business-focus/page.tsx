"use client"

import { useState } from "react"
import Link from "next/link"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { ServiceAreaSection } from "@/components/service-area-section"
import { KeywordsSection } from "@/components/keywords-section"
import { CategorySelector } from "@/components/category-selector"
import { SuggestCategoryModal } from "@/components/suggest-category-modal"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function BusinessFocusPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const handleCategoryChange = (category: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedCategories((prev) => [...prev, category])
    } else {
      setSelectedCategories((prev) => prev.filter((cat) => cat !== category))
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Business Focus</h1>
            <p className="text-gray-600">
              Define your service area, keywords, and business categories to help customers find you
            </p>
          </div>

          <ServiceAreaSection />

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
                <Button variant="outline" className="ml-2" onClick={() => setSearchTerm("")} disabled={!searchTerm}>
                  Clear
                </Button>
              </div>
            </div>

            <CategorySelector onCategoryChange={handleCategoryChange} searchTerm={searchTerm} />

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
                  {selectedCategories.map((category, index) => (
                    <li key={index} className="px-3 py-2 bg-white rounded border border-gray-200">
                      {category}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic mb-6">No categories selected yet</p>
              )}
              <div className="flex justify-center">
                <Link
                  href="/workbench"
                  className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
                >
                  Submit
                </Link>
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
