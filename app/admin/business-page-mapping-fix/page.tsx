import { Suspense } from "react"
import BusinessPageMappingFixClient from "./business-page-mapping-fix-client"

export default function BusinessPageMappingFixPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Business Page Mapping Fix</h1>
      <p className="mb-6 text-gray-600">
        This tool allows you to check and fix page mappings for specific businesses. You can remove a business from
        incorrect pages and ensure it's only mapped to the correct pages.
      </p>

      <Suspense fallback={<div>Loading...</div>}>
        <BusinessPageMappingFixClient />
      </Suspense>
    </div>
  )
}
