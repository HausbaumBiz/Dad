import { getBusinessCategoryMappings } from "../actions/category-troubleshooting-actions"
import CategoryTroubleshootingClient from "./category-troubleshooting-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CategoryTroubleshootingPage() {
  const mappings = await getBusinessCategoryMappings()

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Category Troubleshooting</h1>
      <p className="text-muted-foreground mb-6">
        This tool helps you diagnose issues with business category mappings. You can see which pages each business is
        assigned to based on their categories. Demo and sample businesses are excluded from this view.
      </p>

      <CategoryTroubleshootingClient initialMappings={mappings} />
    </div>
  )
}
