// app/utils/category-utils.ts
import { CATEGORY_ROUTE_MAPPING } from "@/lib/category-route-mapping"

export function getCategoryNameForPagePath(pagePath: string): string | null {
  // Remove leading slash if present
  const cleanPath = pagePath.startsWith("/") ? pagePath.slice(1) : pagePath

  // Look up the category name from the route mapping
  const categoryName = CATEGORY_ROUTE_MAPPING[cleanPath]

  if (categoryName) {
    console.log(`Found category mapping: ${cleanPath} -> ${categoryName}`)
    return categoryName
  }

  console.log(`No category mapping found for path: ${cleanPath}`)
  return null
}
