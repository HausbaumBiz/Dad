"use client"

import { JobCategoryLayout } from "@/components/job-category-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin } from "lucide-react"

export default function FactoryWorkJobsPage() {
  return (
    <JobCategoryLayout
      title="Factory Work Jobs"
      description="Manufacturing, assembly line, production, and warehouse positions"
      icon="🏭"
    >
      <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Jobs
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input id="search" type="text" placeholder="Job title, company, or keywords" className="pl-9" disabled />
            </div>
          </div>

          <div className="md:w-1/3">
            <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input id="zipcode" type="text" placeholder="Enter ZIP code" className="pl-9" disabled />
            </div>
          </div>

          <div className="self-end">
            <Button type="button" className="w-full md:w-auto" disabled>
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="text-center py-12 bg-white rounded-lg shadow-sm">
        <div className="text-6xl mb-4">🏭</div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Factory Work Jobs Available</h2>
        <p className="text-gray-600 mb-4">There are currently no factory work job listings in this area.</p>
        <p className="text-sm text-gray-500">Check back later or try searching in a different location.</p>
      </div>
    </JobCategoryLayout>
  )
}
