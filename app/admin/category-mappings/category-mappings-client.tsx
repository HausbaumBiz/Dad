"use client"

import { useState } from "react"
import { categories } from "@/lib/category-data"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Copy, Check, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useToast } from "@/hooks/use-toast"

// This function maps category IDs to their actual routes in the application
function getCategoryRoute(categoryId: string): string {
  // Custom mapping for known categories
  const categoryRouteMap: Record<string, string> = {
    // Main categories
    homeLawnLabor: "/home-improvement",
    retailStores: "/retail-stores",
    travelVacation: "/travel-vacation",
    tailors: "/tailoring-clothing",
    artDesignEntertainment: "/arts-entertainment",
    physicalRehabilitation: "/physical-rehabilitation",
    financeInsurance: "/financial-services",
    weddingsEvents: "/weddings-events",
    petCare: "/pet-care",
    languageTutoring: "/education-tutoring",
    realestate: "/real-estate",
    athletics: "/fitness-athletics",
    music: "/music-lessons",
    homecare: "/care-services",
    automotive: "/automotive-services",
    beauty: "/beauty-wellness",
    medical: "/medical-practitioners",
    counseling: "/mental-health",
    computers: "/tech-it-services",
    restaurant: "/food-dining",
    personalAssistant: "/personal-assistants",
    mortuaryServices: "/funeral-services",
    lawyers: "/legal-services",

    // Home improvement subcategories
    lawn: "/home-improvement/lawn-garden",
    outside: "/home-improvement/outside-maintenance",
    outdoorStructures: "/home-improvement/outdoor-structures",
    poolServices: "/home-improvement/pool-services",
    asphaltConcrete: "/home-improvement/asphalt-concrete",
    construction: "/home-improvement/construction-design",
    insideHome: "/home-improvement/inside-maintenance",
    windowsDoors: "/home-improvement/windows-doors",
    floorCarpet: "/home-improvement/flooring",
    audioVisualSecurity: "/home-improvement/audio-visual-security",
    homeHazard: "/home-improvement/hazard-mitigation",
    pestControl: "/home-improvement/pest-control",
    trashCleanup: "/home-improvement/trash-cleanup",
    homeCleaning: "/home-improvement/cleaning",
    fireplacesChimneys: "/home-improvement/fireplaces-chimneys",
    movers: "/home-improvement/movers",
    handymen: "/home-improvement/handymen",
  }

  // Return the custom mapping if it exists
  if (categoryId in categoryRouteMap) {
    return categoryRouteMap[categoryId]
  }

  // Fallback to the default conversion (camelCase to kebab-case)
  return "/" + categoryId.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()
}

// This function checks if a route exists in the main page categories
function routeExistsInMainPage(route: string, mainPageRoutes: string[]): boolean {
  return mainPageRoutes.includes(route)
}

export default function CategoryMappingsClient() {
  const [activeTab, setActiveTab] = useState("main")
  const { toast } = useToast()

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${text} has been copied to your clipboard.`,
      duration: 2000,
    })
  }

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

  // Extract home improvement subcategory routes
  const homeImprovementRoutes = [
    "/home-improvement/lawn-garden",
    "/home-improvement/outside-maintenance",
    "/home-improvement/outdoor-structures",
    "/home-improvement/pool-services",
    "/home-improvement/asphalt-concrete",
    "/home-improvement/construction-design",
    "/home-improvement/inside-maintenance",
    "/home-improvement/windows-doors",
    "/home-improvement/flooring",
    "/home-improvement/audio-visual-security",
    "/home-improvement/hazard-mitigation",
    "/home-improvement/pest-control",
    "/home-improvement/trash-cleanup",
    "/home-improvement/cleaning",
    "/home-improvement/fireplaces-chimneys",
    "/home-improvement/movers",
    "/home-improvement/handymen",
  ]

  // Find the Home, Lawn, and Manual Labor category
  const homeLawnLaborCategory = categories.find((category) => category.id === "homeLawnLabor")
  const homeLawnLaborSubcategories = homeLawnLaborCategory?.subcategories || []

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

      <Tabs defaultValue="main" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="main">Main Categories</TabsTrigger>
          <TabsTrigger value="homeImprovement">Home Improvement Subcategories</TabsTrigger>
        </TabsList>

        <TabsContent value="main">
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
                const expectedRoute = getCategoryRoute(category.id)
                const routeExists = routeExistsInMainPage(expectedRoute, mainPageRoutes)

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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Copy route"
                        onClick={() => copyToClipboard(expectedRoute)}
                      >
                        <Copy size={16} />
                      </Button>
                    </div>
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
        </TabsContent>

        <TabsContent value="homeImprovement">
          <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-100 font-semibold">
              <div className="col-span-3">Subcategory ID</div>
              <div className="col-span-3">Subcategory Title</div>
              <div className="col-span-3">Expected Route</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Actions</div>
            </div>

            <div className="divide-y">
              {homeLawnLaborSubcategories.map((subcategory: any) => {
                const expectedRoute = getCategoryRoute(subcategory.id)
                const routeExists = homeImprovementRoutes.includes(expectedRoute)

                return (
                  <div key={subcategory.id}>
                    <div className="grid grid-cols-12 gap-4 p-4 items-center">
                      <div className="col-span-3 font-mono text-sm">{subcategory.id}</div>
                      <div className="col-span-3">{subcategory.title}</div>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          title="Copy route"
                          onClick={() => copyToClipboard(expectedRoute)}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    </div>

                    <Accordion type="single" collapsible className="px-4 pb-2">
                      <AccordionItem value={subcategory.id} className="border-0">
                        <AccordionTrigger className="py-2 text-sm text-gray-600">View Subcategories</AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-4 text-sm">
                            <h4 className="font-semibold mb-2">Subcategories:</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {subcategory.subcategories.map((subcat: string, index: number) => (
                                <li key={index}>{subcat}</li>
                              ))}
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Home Improvement Page Routes</h2>
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {homeImprovementRoutes.map((route) => (
                  <div key={route} className="flex items-center">
                    <span className="font-mono text-sm">{route}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
