"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { MediaManager } from "@/components/media-manager"
import { getCurrentBusiness, saveBusinessAdDesign, getBusinessAdDesign } from "@/app/actions/business-actions"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { LazyVideo } from "@/components/lazy-video"

export default function CustomizeAdDesignPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const designId = searchParams.get("design")
  const colorParam = searchParams.get("color") || "blue"
  const [selectedDesign, setSelectedDesign] = useState<number>(designId ? Number.parseInt(designId) : 1)
  const [selectedColor, setSelectedColor] = useState(colorParam)
  const [isLoading, setIsLoading] = useState(false)
  const [business, setBusiness] = useState<any>(null)
  const [businessLoading, setBusinessLoading] = useState(true)
  const [businessMedia, setBusinessMedia] = useState<any>(null)
  const [formData, setFormData] = useState({
    businessName: "",
    address: "",
    phone: "",
    hours: "",
    website: "",
    freeText: "",
  })
  const [hiddenFields, setHiddenFields] = useState({
    address: false,
    phone: false,
    hours: false,
    website: false,
    video: false,
    thumbnail: false,
    photoAlbum: false,
    freeText: false,
  })
  const [activeTab, setActiveTab] = useState("design")

  // Color mapping
  const colorMap: Record<string, { primary: string; secondary: string }> = {
    blue: { primary: "#007BFF", secondary: "#0056b3" },
    purple: { primary: "#6f42c1", secondary: "#5e37a6" },
    green: { primary: "#28a745", secondary: "#218838" },
    teal: { primary: "#20c997", secondary: "#17a2b8" },
    orange: { primary: "#fd7e14", secondary: "#e65f02" },
    red: { primary: "#dc3545", secondary: "#c82333" },
    black: { primary: "#000000", secondary: "#333333" },
    slategrey: { primary: "#708090", secondary: "#4E5964" },
    brown: { primary: "#8B4513", secondary: "#6B3610" },
  }

  // Get the selected color values
  const colorValues = colorMap[selectedColor] || colorMap.blue

  // Fetch business data
  useEffect(() => {
    async function fetchBusinessData() {
      try {
        setBusinessLoading(true)
        const businessData = await getCurrentBusiness()

        if (!businessData) {
          router.push("/business-login")
          return
        }

        setBusiness(businessData)

        // Set initial form data from business
        setFormData((prev) => ({
          ...prev,
          businessName: businessData.businessName || "",
        }))

        // Fetch saved design data
        const designData = await getBusinessAdDesign(businessData.id)
        if (designData) {
          // Set design and color from saved data if available
          if (designData.designId && !designId) {
            setSelectedDesign(Number(designData.designId))
          }
          if (designData.colorScheme && !colorParam) {
            setSelectedColor(designData.colorScheme)
          }

          // Set form data from saved design
          if (designData.formData) {
            setFormData(designData.formData)
          }

          // Set hidden fields from saved design
          if (designData.hiddenFields) {
            setHiddenFields(designData.hiddenFields)
          }
        }
      } catch (err) {
        console.error("Failed to get business data:", err)
        toast({
          title: "Error",
          description: "Failed to load business data. Please try logging in again.",
          variant: "destructive",
        })
      } finally {
        setBusinessLoading(false)
      }
    }

    fetchBusinessData()
  }, [router, designId, colorParam])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle toggle changes for hidden fields
  const handleToggleChange = (field: keyof typeof hiddenFields) => {
    setHiddenFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  // Save design data
  const handleSave = async () => {
    if (!business) {
      toast({
        title: "Error",
        description: "You must be logged in to save your design.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const designData = {
        designId: selectedDesign.toString(),
        colorScheme: selectedColor,
        formData,
        hiddenFields,
        updatedAt: new Date().toISOString(),
      }

      await saveBusinessAdDesign(business.id, designData)

      // Save to localStorage for client-side persistence
      localStorage.setItem("hausbaum_selected_design", selectedDesign.toString())
      localStorage.setItem("hausbaum_selected_color", selectedColor)

      toast({
        title: "Success",
        description: "Your design has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving design:", error)
      toast({
        title: "Error",
        description: "Failed to save your design. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle media update
  const handleMediaUpdate = (media: any) => {
    setBusinessMedia(media)
  }

  // Render design preview based on selected design
  const renderDesignPreview = () => {
    // Common elements for all designs
    const renderBusinessInfo = () => (
      <div className="space-y-4">
        {!hiddenFields.address && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
            <div className="bg-gray-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">Address</p>
              <p className="text-sm text-gray-600">{formData.address || "123 Business St, City, ST 12345"}</p>
            </div>
          </div>
        )}

        {!hiddenFields.phone && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
            <div className="bg-gray-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">Phone</p>
              <p className="text-sm text-gray-600">{formData.phone || "(555) 123-4567"}</p>
            </div>
          </div>
        )}

        {!hiddenFields.hours && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
            <div className="bg-gray-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">Hours</p>
              <p className="text-sm text-gray-600">{formData.hours || "Mon-Fri: 9AM-5PM"}</p>
            </div>
          </div>
        )}

        {!hiddenFields.website && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
            <div className="bg-gray-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">Website</p>
              <p className="text-sm text-gray-600 underline">{formData.website || "www.businessname.com"}</p>
            </div>
          </div>
        )}

        {!hiddenFields.photoAlbum && (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
            <div className="bg-gray-100 p-2 rounded-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">Photo Album</p>
              <p className="text-sm text-gray-600 underline">Browse Photos</p>
            </div>
          </div>
        )}
      </div>
    )

    // Free text section
    const renderFreeText = () =>
      !hiddenFields.freeText && (
        <div className="w-full bg-white p-3 text-center border-t border-gray-100">
          <p className="text-sm font-medium text-gray-600">
            {formData.freeText || "We offer professional services with 10+ years of experience in the industry."}
          </p>
        </div>
      )

    // Video preview for portrait (9:16) designs
    const renderPortraitVideo = (position: "right" | "left" = "right") =>
      !hiddenFields.video && (
        <div
          className={`hidden lg:block absolute top-1/2 ${position === "right" ? "right-4" : "left-4"} transform -translate-y-1/2 w-[220px] h-[392px] bg-white rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden`}
        >
          <div className="relative w-full h-full">
            {businessMedia?.videoUrl ? (
              <LazyVideo
                src={businessMedia.videoUrl}
                thumbnailSrc={businessMedia.thumbnailUrl}
                className="w-full h-full object-cover"
                showControls={true}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-full p-3 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-sm font-medium text-gray-700">Video Preview</p>
              <p className="text-xs text-gray-600">9:16 ratio</p>
            </div>
          </div>
        </div>
      )

    // Video preview for landscape (16:9) designs
    const renderLandscapeVideo = () =>
      !hiddenFields.video && (
        <div className="w-full bg-gradient-to-b from-gray-100 to-gray-50 p-4">
          <div className="relative mx-auto w-full max-w-[392px] h-auto aspect-video bg-white rounded-lg border-2 border-gray-300 shadow-lg overflow-hidden">
            {businessMedia?.videoUrl ? (
              <LazyVideo
                src={businessMedia.videoUrl}
                thumbnailSrc={businessMedia.thumbnailUrl}
                className="w-full h-full object-cover"
                showControls={true}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-full p-3 shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>
            )}
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">16:9 ratio</div>
          </div>
        </div>
      )

    // Render the appropriate design based on selection
    switch (selectedDesign) {
      case 1: // Design 1 - Portrait video on right
        return (
          <Card className="relative overflow-hidden">
            <div
              className="p-5 text-white"
              style={{
                background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
              }}
            >
              <h3 className="text-xl font-bold text-center">{formData.businessName || "Business Name"}</h3>
            </div>
            <div className="p-6 bg-gradient-to-b from-white to-gray-50">
              <div className="space-y-4 lg:mr-[240px]">{renderBusinessInfo()}</div>
            </div>
            {renderFreeText()}
            {renderPortraitVideo("right")}
          </Card>
        )

      case 2: // Design 2 - Landscape video on top
        return (
          <Card className="relative overflow-hidden">
            <div
              className="p-5 text-white"
              style={{
                background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
              }}
            >
              <h3 className="text-xl font-bold text-center">{formData.businessName || "Business Name"}</h3>
            </div>
            {renderLandscapeVideo()}
            <div className="p-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{renderBusinessInfo()}</div>
            </div>
            {renderFreeText()}
          </Card>
        )

      case 3: // Design 3 - Landscape video on bottom
        return (
          <Card className="relative overflow-hidden">
            <div
              className="p-5 text-white"
              style={{
                background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
              }}
            >
              <h3 className="text-xl font-bold text-center">{formData.businessName || "Business Name"}</h3>
            </div>
            <div className="p-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{renderBusinessInfo()}</div>
            </div>
            {renderFreeText()}
            {renderLandscapeVideo()}
          </Card>
        )

      case 4: // Design 4 - Portrait video on left
        return (
          <Card className="relative overflow-hidden">
            <div
              className="p-5 text-white"
              style={{
                background: `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`,
              }}
            >
              <h3 className="text-xl font-bold text-center">{formData.businessName || "Business Name"}</h3>
            </div>
            <div className="p-6 bg-gradient-to-b from-white to-gray-50">
              <div className="space-y-4 lg:ml-[240px]">{renderBusinessInfo()}</div>
            </div>
            {renderFreeText()}
            {renderPortraitVideo("left")}
          </Card>
        )

      default:
        return (
          <Card className="p-6 text-center">
            <p>Select a design template to preview</p>
          </Card>
        )
    }
  }

  if (businessLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainHeader />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
            <p className="mt-2 text-gray-600">Loading your design...</p>
          </div>
        </main>
        <MainFooter />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Customize Your AdBox</h1>
            <p className="text-gray-600">Select a design template and customize your business information.</p>
            <div className="mt-4">
              <Link
                href="/ad-design"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                style={{ backgroundColor: colorValues.primary }}
              >
                Back to Design Selection
              </Link>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="info">Business Info</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
            </TabsList>

            <TabsContent value="design" className="space-y-6">
              {/* Design Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Design Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((design) => (
                      <div
                        key={design}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedDesign === design
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => setSelectedDesign(design)}
                        style={
                          selectedDesign === design
                            ? { borderColor: colorValues.primary, backgroundColor: `${colorValues.primary}10` }
                            : {}
                        }
                      >
                        <p className="text-center font-medium">Design {design}</p>
                        <p className="text-xs text-center mt-2 text-gray-500">
                          {design === 1 || design === 4 ? "Portrait Video (9:16)" : "Landscape Video (16:9)"}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Color Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Color Theme</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(colorMap).map(([color, values]) => (
                      <div
                        key={color}
                        className={`w-10 h-10 rounded-full cursor-pointer transition-all ${
                          selectedColor === color ? "ring-2 ring-offset-2" : ""
                        }`}
                        style={{
                          background: `linear-gradient(to right, ${values.primary}, ${values.secondary})`,
                          ringColor: values.primary,
                        }}
                        onClick={() => setSelectedColor(color)}
                        title={color.charAt(0).toUpperCase() + color.slice(1)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Design Preview */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Design Preview</h2>
                <div className="overflow-hidden rounded-lg shadow-md">{renderDesignPreview()}</div>
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-6">
              {/* Business Information Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          name="businessName"
                          value={formData.businessName}
                          onChange={handleInputChange}
                          placeholder="Enter your business name"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="address">Address</Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="hide-address"
                              checked={hiddenFields.address}
                              onCheckedChange={() => handleToggleChange("address")}
                            />
                            <Label htmlFor="hide-address" className="text-sm text-gray-500">
                              Hide
                            </Label>
                          </div>
                        </div>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter your business address"
                          disabled={hiddenFields.address}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="phone">Phone Number</Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="hide-phone"
                              checked={hiddenFields.phone}
                              onCheckedChange={() => handleToggleChange("phone")}
                            />
                            <Label htmlFor="hide-phone" className="text-sm text-gray-500">
                              Hide
                            </Label>
                          </div>
                        </div>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                          disabled={hiddenFields.phone}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="hours">Business Hours</Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="hide-hours"
                              checked={hiddenFields.hours}
                              onCheckedChange={() => handleToggleChange("hours")}
                            />
                            <Label htmlFor="hide-hours" className="text-sm text-gray-500">
                              Hide
                            </Label>
                          </div>
                        </div>
                        <Input
                          id="hours"
                          name="hours"
                          value={formData.hours}
                          onChange={handleInputChange}
                          placeholder="e.g., Mon-Fri: 9AM-5PM"
                          disabled={hiddenFields.hours}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="website">Website</Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="hide-website"
                              checked={hiddenFields.website}
                              onCheckedChange={() => handleToggleChange("website")}
                            />
                            <Label htmlFor="hide-website" className="text-sm text-gray-500">
                              Hide
                            </Label>
                          </div>
                        </div>
                        <Input
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          placeholder="e.g., www.yourbusiness.com"
                          disabled={hiddenFields.website}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="freeText">Custom Message</Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="hide-freeText"
                              checked={hiddenFields.freeText}
                              onCheckedChange={() => handleToggleChange("freeText")}
                            />
                            <Label htmlFor="hide-freeText" className="text-sm text-gray-500">
                              Hide
                            </Label>
                          </div>
                        </div>
                        <Textarea
                          id="freeText"
                          name="freeText"
                          value={formData.freeText}
                          onChange={handleInputChange}
                          placeholder="Enter a custom message about your business"
                          disabled={hiddenFields.freeText}
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Design Preview */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Design Preview</h2>
                <div className="overflow-hidden rounded-lg shadow-md">{renderDesignPreview()}</div>
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-6">
              {/* Media Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Media Manager</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <Label>Video</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="hide-video"
                            checked={hiddenFields.video}
                            onCheckedChange={() => handleToggleChange("video")}
                          />
                          <Label htmlFor="hide-video" className="text-sm text-gray-500">
                            Hide
                          </Label>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Thumbnail</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="hide-thumbnail"
                            checked={hiddenFields.thumbnail}
                            onCheckedChange={() => handleToggleChange("thumbnail")}
                          />
                          <Label htmlFor="hide-thumbnail" className="text-sm text-gray-500">
                            Hide
                          </Label>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Photo Album</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="hide-photoAlbum"
                            checked={hiddenFields.photoAlbum}
                            onCheckedChange={() => handleToggleChange("photoAlbum")}
                          />
                          <Label htmlFor="hide-photoAlbum" className="text-sm text-gray-500">
                            Hide
                          </Label>
                        </div>
                      </div>
                    </div>

                    {business && (
                      <MediaManager
                        businessId={business.id}
                        designId={selectedDesign.toString()}
                        onMediaUpdate={handleMediaUpdate}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Design Preview */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Design Preview</h2>
                <div className="overflow-hidden rounded-lg shadow-md">{renderDesignPreview()}</div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center pt-4 space-x-4">
            <Button
              type="button"
              className="px-8 py-2 bg-gray-500 text-white font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => router.push("/workbench")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="px-8 py-2 text-white font-medium rounded-md shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: colorValues.primary }}
              disabled={isLoading}
              onClick={handleSave}
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-t-white border-r-transparent border-b-white border-l-transparent mr-2"></span>
                  Saving...
                </>
              ) : (
                "Save Design"
              )}
            </Button>
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  )
}
