import { Suspense } from "react"
import { CategoryManagement } from "./category-management"

export default function CategoryManagementPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Category Management</h1>
        <p className="text-gray-600 mt-2">Manage categories and remove them from the Redis database</p>
      </div>

      <Suspense fallback={<div className="text-center py-8">Loading categories...</div>}>
        <CategoryManagement />
      </Suspense>
    </div>
  )
}
