import { categories } from "@/lib/category-data"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Check, AlertCircle } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Category Mappings",
  description: "View and manage mappings between business categories and frontend pages",
}

// This function extracts the route path from a category ID
function getCategoryRoute(categoryId: string): string {
  // Convert camelCase to kebab-case
  return categoryId.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

// This function checks if a route exists in the main page categories
function routeExistsInMainPage(route: string, mainPageRoutes: string[]): boolean {
  return mainPageRoutes.includes(route)
}

export default function CategoryMappingsPage() {
  // Extract routes from the main page categories
  const mainPageRoutes = [
    "/home-improvement",
    "/automotive-services",
    "/care-services", // Combined elder and child care
    "/pet-care",
    "/weddings-events",
    "/fitness-athletics",
    "/education-tutoring",
    "/music-lessons",
    "/real-estate",
    "/food-dining",
    "/retail-stores",
    "/legal-services",
    "/funeral-services",
    "/personal-assistants",
    "/travel-vacation",
    "/tailoring-clothing",
    "/arts-entertainment",
    "/tech-it-services",
    "/beauty-wellness",
    "/physical-rehabilitation",
    "/medical-practitioners",
    "/mental-health",
    "/financial-services",
  ]

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Category Mappings</h1>
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">About Category Mappings</h2>
        <p className="text-gray-600 mb-4">
          This page shows the mapping between business categories from the business-focus page and the linked category
          pages from the main page. This helps ensure that businesses are properly categorized and displayed on the
          correct pages.
        </p>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center">
            <Badge className="bg-green-500 mr-2">
              <Check size={14} />
            </Badge>
            <span className="text-sm">Mapped correctly</span>
          </div>
          <div className="flex items-center">
            <Badge className="bg-yellow-500 mr-2">
              <AlertCircle size={14} />
            </Badge>
            <span className="text-sm">Route mismatch</span>
          </div>
        </div>
      </Card>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 font-semibold">
          <div className="col-span-3">Category ID</div>
          <div className="col-span-3">Category Title</div>
          <div className="col-span-3">Expected Route</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Actions</div>
        </div>

        <div className="divide-y">
          {categories.map((category) => {
            const expectedRoute = `/${getCategoryRoute(category.id)}`
            const routeExists = routeExistsInMainPage(expectedRoute, mainPageRoutes)
            const alternativeRoute = mainPageRoutes.find(
              (route) =>
                route.includes(getCategoryRoute(category.id)) ||
                getCategoryRoute(category.id).includes(route.substring(1)),
            )

            return (
              <div key={category.id} className="grid grid-cols-12 gap-4 p-4 items-center">
                <div className="col-span-3 font-mono text-sm">{category.id}</div>
                <div className="col-span-3">{category.title}</div>
                <div className="col-span-3 font-mono text-sm">{expectedRoute}</div>
                <div className="col-span-2">
                  {routeExists ? (
                    <Badge className="bg-green-500">
                      <Check size={14} className="mr-1" /> Mapped
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-500">
                      <AlertCircle size={14} className="mr-1" /> Mismatch
                    </Badge>
                  )}
                </div>
                <div className="col-span-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Copy route">
                    <Copy size={16} />
                  </Button>
                </div>
                {!routeExists && alternativeRoute && (
                  <div className="col-span-12 pl-4 text-sm text-yellow-600">
                    Possible alternative: {alternativeRoute}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Main Page Routes</h2>
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mainPageRoutes.map((route) => (
              <div key={route} className="flex items-center">
                <span className="font-mono text-sm">{route}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
