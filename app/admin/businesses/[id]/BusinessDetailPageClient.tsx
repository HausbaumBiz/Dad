"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CopyToClipboard } from "@/components/copy-to-clipboard"
import { getBusinessZipCodesById } from "@/app/actions/zip-code-actions"
import { useToast } from "@/components/ui/use-toast"
import type { Business } from "@/lib/definitions"
import type { ZipCodeData } from "@/lib/zip-code-types"

interface BusinessDetailPageClientProps {
  business: Business
}

export default function BusinessDetailPageClient({ business }: BusinessDetailPageClientProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [serviceArea, setServiceArea] = useState<{ zipCodes: ZipCodeData[]; isNationwide: boolean } | null>(null)
  const [isLoadingServiceArea, setIsLoadingServiceArea] = useState(false)
  const { toast } = useToast()

  const handleTabChange = async (value: string) => {
    setActiveTab(value)

    // Load service area data when switching to the service area tab
    if (value === "service-area" && !serviceArea && !isLoadingServiceArea) {
      setIsLoadingServiceArea(true)
      try {
        const result = await getBusinessZipCodesById(business.id)
        if (result.success && result.data) {
          setServiceArea(result.data)
        } else {
          toast({
            title: "Error",
            description: result.message || "Failed to load service area",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error loading service area:", error)
        toast({
          title: "Error",
          description: "Failed to load service area",
          variant: "destructive",
        })
      } finally {
        setIsLoadingServiceArea(false)
      }
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{business.businessName || "Unnamed Business"}</h1>
        <Button variant="outline" onClick={() => window.history.back()}>
          Back
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">Business Details</TabsTrigger>
          <TabsTrigger value="service-area">Service Area</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Basic details about the business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Business ID</h3>
                  <div className="mt-1 flex items-center">
                    <p className="text-sm text-gray-900 mr-2">{business.id}</p>
                    <CopyToClipboard text={business.id} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <p className="mt-1 text-sm text-gray-900">{business.email || "Not provided"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p className="mt-1 text-sm text-gray-900">{business.phone || "Not provided"}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Website</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {business.website ? (
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {business.website}
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Primary Location</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {business.city && business.state
                      ? `${business.city}, ${business.state} ${business.zipCode || ""}`
                      : business.zipCode || "Not provided"}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Primary Category</h3>
                  <p className="mt-1 text-sm text-gray-900">{business.category || "Not categorized"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1 text-sm text-gray-900">{business.description || "No description provided"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service-area">
          <Card>
            <CardHeader>
              <CardTitle>Service Area</CardTitle>
              <CardDescription>ZIP codes where this business provides services</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingServiceArea ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : serviceArea ? (
                <div>
                  {serviceArea.isNationwide ? (
                    <div className="bg-blue-50 p-4 rounded-md">
                      <p className="text-blue-700 font-medium">This business provides nationwide service</p>
                    </div>
                  ) : serviceArea.zipCodes.length > 0 ? (
                    <div>
                      <p className="mb-2">
                        This business serves {serviceArea.zipCodes.length} ZIP code
                        {serviceArea.zipCodes.length !== 1 ? "s" : ""}:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-4">
                        {serviceArea.zipCodes.map((zipData, index) => (
                          <div
                            key={zipData.zip}
                            className={`p-3 rounded border ${
                              index === 0 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-medium">{zipData.zip}</span>
                                {index === 0 && (
                                  <Badge variant="outline" className="ml-2 bg-green-100">
                                    Primary
                                  </Badge>
                                )}
                                {zipData.city && zipData.state && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {zipData.city}, {zipData.state}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No ZIP codes defined for this business</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">Failed to load service area information</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Business categories and subcategories</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 italic">Category information not available</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>Media</CardTitle>
              <CardDescription>Images, videos, and other media</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 italic">Media information not available</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
