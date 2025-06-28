import { Badge } from "@/components/ui/badge"

export function renderJobCategories(categories?: string[]) {
  if (!categories || categories.length === 0) {
    return (
      <div className="mt-2">
        <Badge variant="outline" className="text-xs">
          No categories
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {categories.slice(0, 3).map((category, index) => (
        <Badge key={index} variant="secondary" className="text-xs">
          {category}
        </Badge>
      ))}
      {categories.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{categories.length - 3} more
        </Badge>
      )}
    </div>
  )
}

export function JobCategoriesDisplay({ categories }: { categories?: string[] }) {
  if (!categories || categories.length === 0) {
    return <div className="text-sm text-gray-500">No categories specified</div>
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Categories:</h4>
      <div className="flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <Badge key={index} variant="secondary" className="text-sm">
            {category}
          </Badge>
        ))}
      </div>
    </div>
  )
}
