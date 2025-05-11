"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import type { Business } from "@/lib/definitions"
import { CopyToClipboard } from "@/components/copy-to-clipboard"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { deleteBusiness } from "@/app/actions/business-actions"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface BusinessDetailPageClientProps {
  business: Business
}

interface ZipCodeDetail {
  zip: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
}

export default function BusinessDetailPageClient({ business }: BusinessDetailPageClientProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // State for additional business data
  const [categories, setCategories] = useState<any[]>([])
  const [serviceArea, setServiceArea] = useState<any>(null)
  const [adDesign, setAdDesign] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // State for ZIP code filtering
  const [zipCodeFilter, setZipCodeFilter] = useState("")
  const [zipCodeDetails, setZipCodeDetails] = useState<ZipCodeDetail[]>([])

  // Fetch additional business data
  useEffect(() => {
    async function fetchBusinessData() {
      try {
        setIsLoading(true)
        const newErrors: Record<string, string> = {}

        // Fetch categories
        try {
          const categoriesRes = await fetch(`/api/admin/business/${business.id}/categories`)
          if (categoriesRes.ok) {
            const categoriesData = await categoriesRes.json()
            setCategories(categoriesData || [])
          } else {
            const errorData = await categoriesRes.json()
            newErrors.categories = errorData.error || "Failed to fetch categories"
          }
        } catch (error) {
          console.error("Error fetching categories:", error)
          newErrors.categories = error instanceof Error ? error.message : "Unknown error fetching categories"
        }

        // Fetch service area
        try {
          const serviceAreaRes = await fetch(`/api/admin/business/${business.id}/service-area`)
          if (serviceAreaRes.ok) {
            const serviceAreaData = await serviceAreaRes.json()
            setServiceArea(serviceAreaData)

            // Set ZIP code details if available
            if (serviceAreaData.zipCodeDetails && Array.isArray(serviceAreaData.zipCodeDetails)) {
              setZipCodeDetails(serviceAreaData.zipCodeDetails)
            } else if (serviceAreaData.zipCodes && Array.isArray(serviceAreaData.zipCodes)) {
              // Create simple ZIP code details if only ZIP codes are available
              setZipCodeDetails(serviceAreaData.zipCodes.map((zip: string) => ({ zip })))
            }
          } else {
            const errorData = await serviceAreaRes.json()
            newErrors.serviceArea = errorData.error || "Failed to fetch service area"
          }
        } catch (error) {
          console.error("Error fetching service area:", error)
          newErrors.serviceArea = error instanceof Error ? error.message : "Unknown error fetching service area"
        }

        // Fetch ad design
        try {
          const adDesignRes = await fetch(`/api/admin/business/${business.id}/ad-design`)
          if (adDesignRes.ok) {
            const adDesignData = await adDesignRes.json()
            setAdDesign(adDesignData)
          } else {
            const errorData = await adDesignRes.json()
            newErrors.adDesign = errorData.error || "Failed to fetch ad design"
          }
        } catch (error) {
          console.error("Error fetching ad design:", error)
          newErrors.adDesign = error instanceof Error ? error.message : "Unknown error fetching ad design"
        }

        setErrors(newErrors)
      } catch (error) {
        console.error("Error fetching business data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinessData()
  }, [business.id])

  // Filter ZIP codes based on search input
  const filteredZipCodes = zipCodeDetails.filter(
    (zipDetail) =>
      zipDetail.zip.includes(zipCodeFilter) ||
      (zipDetail.city && zipDetail.city.toLowerCase().includes(zipCodeFilter.toLowerCase())) ||
      (zipDetail.state && zipDetail.state.toLowerCase().includes(zipCodeFilter.toLowerCase())),
  )

  const handleDeleteBusiness = async () => {
    try {
      setIsDeleting(true)
      setDeleteError(null)
      console.log(`Attempting to delete business with ID: ${business.id}`)

      const result = await deleteBusiness(business.id)

      if (result.success) {
        console.log("Business deleted successfully")
        toast({
          title: "Business Deleted",
          description: result.message,
        })
        router.push("/admin/businesses")
        router.refresh()
      } else {
        console.error("Failed to delete business:", result.message)
        setDeleteError(result.message)
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in delete handler:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
      setDeleteError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Business Details</h1>
        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
          Delete Business
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="service-area">Service Area</TabsTrigger>
          <TabsTrigger value="ad-design">Ad Design</TabsTrigger>
          <TabsTrigger value="raw-data">Raw Data</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
                <CardDescription>Core business details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Business Name</p>
                  <p className="font-medium">{business.businessName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Business ID</p>
                  <div className="flex items-center">
                    <p className="font-mono text-sm">{business.id}</p>
                    <CopyToClipboard text={business.id} className="ml-2" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <div className="flex items-center">
                    <p>{business.email}</p>
                    <CopyToClipboard text={business.email} className="ml-2" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p>{business.phone || "Not provided"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Primary Category</p>
                  <p>{business.category || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Verification</p>
                  {business.isEmailVerified ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                      Pending
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Owner Information</CardTitle>
                <CardDescription>Business owner details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">
                    {business.firstName} {business.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p>
                    {business.city ? `${business.city}, ` : ""}
                    {business.state ? `${business.state}, ` : ""}
                    {business.zipCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration Date</p>
                  <p>{business.createdAt ? format(new Date(business.createdAt), "PPP 'at' p") : "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p>{business.updatedAt ? format(new Date(business.updatedAt), "PPP 'at' p") : "Unknown"}</p>
                </div>
                {business.rating && (
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <div className="flex items-center">
                      <span className="font-medium">{business.rating.toFixed(1)}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        ({business.reviews || 0} {business.reviews === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Business Categories</CardTitle>
              <CardDescription>Categories and services this business is listed under</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.categories && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.categories}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Primary Category</h3>
                    <Badge className="mr-2 mb-2">{business.category || "None"}</Badge>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">All Categories</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category, index) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2">
                          {typeof category === "string"
                            ? category
                            : category.name || category.id || category.path || JSON.stringify(category)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {business.services && business.services.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">Services Offered</h3>
                      <div className="flex flex-wrap gap-2">
                        {business.services.map((service, index) => (
                          <Badge key={index} variant="secondary" className="mr-2 mb-2">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No categories found for this business.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Area Tab */}
        <TabsContent value="service-area">
          <Card>
            <CardHeader>
              <CardTitle>Service Area</CardTitle>
              <CardDescription>Geographic areas this business serves</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.serviceArea && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.serviceArea}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : serviceArea ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Service Type</h3>
                    {serviceArea.isNationwide ? (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Nationwide</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Local</Badge>
                    )}
                  </div>

                  {serviceArea.centralZip && (
                    <div>
                      <h3 className="font-medium mb-2">Central ZIP Code</h3>
                      <p>{serviceArea.centralZip}</p>
                    </div>
                  )}

                  {serviceArea.radius && (
                    <div>
                      <h3 className="font-medium mb-2">Service Radius</h3>
                      <p>{serviceArea.radius} miles</p>
                    </div>
                  )}

                  {zipCodeDetails && zipCodeDetails.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-2">ZIP Codes Served</h3>

                      <div className="mb-4">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search ZIP codes, cities, or states..."
                            className="pl-8"
                            value={zipCodeFilter}
                            onChange={(e) => setZipCodeFilter(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mb-2">
                        <p className="text-sm text-gray-500">
                          Total: {zipCodeDetails.length} ZIP codes
                          {zipCodeFilter && ` (Filtered: ${filteredZipCodes.length})`}
                        </p>
                      </div>

                      <div className="max-h-60 overflow-y-auto p-2 border rounded-md">
                        <div className="flex flex-wrap gap-2">
                          {filteredZipCodes.map((zipDetail, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="mr-2 mb-2"
                              title={
                                zipDetail.city && zipDetail.state ? `${zipDetail.city}, ${zipDetail.state}` : undefined
                              }
                            >
                              {zipDetail.zip}
                              {zipDetail.city && zipDetail.state && (
                                <span className="ml-1 text-xs text-gray-500">
                                  ({zipDetail.city}, {zipDetail.state})
                                </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {filteredZipCodes.length === 0 && (
                        <p className="text-sm text-gray-500 mt-2">No ZIP codes match your search.</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">No service area information found.</p>
                  <div>
                    <h3 className="font-medium mb-2">Business ZIP Code</h3>
                    <Badge variant="outline">{business.zipCode}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ad Design Tab */}
        <TabsContent value="ad-design">
          <Card>
            <CardHeader>
              <CardTitle>Ad Design</CardTitle>
              <CardDescription>Business advertisement configuration</CardDescription>
            </CardHeader>
            <CardContent>
              {errors.adDesign && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errors.adDesign}</AlertDescription>
                </Alert>
              )}

              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : adDesign ? (
                <div className="space-y-4">
                  {Object.entries(adDesign).map(([key, value]) => (
                    <div key={key}>
                      <h3 className="font-medium mb-2 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</h3>
                      <p className="break-words">
                        {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No ad design information found for this business.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Raw Data Tab */}
        <TabsContent value="raw-data">
          <Card>
            <CardHeader>
              <CardTitle>Raw Business Data</CardTitle>
              <CardDescription>Complete database record</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="business">
                  <AccordionTrigger>Core Business Data</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                      {JSON.stringify(business, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="categories">
                  <AccordionTrigger>Categories Data</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                      {JSON.stringify(categories, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="serviceArea">
                  <AccordionTrigger>Service Area Data</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                      {JSON.stringify(serviceArea, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="zipCodeDetails">
                  <AccordionTrigger>ZIP Code Details</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                      {JSON.stringify(zipCodeDetails, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="adDesign">
                  <AccordionTrigger>Ad Design Data</AccordionTrigger>
                  <AccordionContent>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-xs">
                      {JSON.stringify(adDesign, null, 2)}
                    </pre>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {deleteError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          <p className="font-semibold">Error deleting business:</p>
          <p>{deleteError}</p>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Business</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the business "{business.businessName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBusiness} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Business"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
