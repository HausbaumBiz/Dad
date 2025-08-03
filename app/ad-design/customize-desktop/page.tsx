"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  getCurrentBusiness,
  getBusinessAdDesign,
  saveBusinessAdDesign,
  saveBusinessHeaderImage,
  getBusinessHeaderImage,
} from "@/app/actions/business-actions"
import { uploadImageToCloudflare } from "@/app/actions/cloudflare-image-actions"
import { getCloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"
import type { CloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"
import {
  Loader2,
  Save,
  Eye,
  Upload,
  Monitor,
  Smartphone,
  Tablet,
  ImageIcon,
  Video,
  Settings,
  Layout,
  Check,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Business {
  id: string
  firstName: string
  lastName: string
  businessName: string
  zipCode: string
  email: string
}

interface AdDesign {
  designId: number
  colorScheme: string
  colorValues?: {
    primary: string
    secondary: string
    textColor?: string
  }
  texture: string
  customButton: {
    type: string
    name: string
    icon: string
  }
  businessInfo: {
    businessName: string
    streetAddress: string
    city: string
    state: string
    zipCode: string
    phone: string
    hours: string
    website: string
    freeText: string
  }
  hiddenFields: {
    phone?: boolean
    email?: boolean
    address?: boolean
    hours?: boolean
    website?: boolean
    freeText?: boolean
    photoAlbum?: boolean
    savingsButton?: boolean
    jobsButton?: boolean
    video?: boolean
    customButton?: boolean
  }
  desktopLayout: {
    layoutType: "standard" | "video-focus" | "info-focus"
    videoAspectRatio: "landscape" | "portrait" | "square"
  }
}

interface HeaderImageData {
  imageId: string
  viewWindowPosition: { x: number; y: number }
  originalImageDimensions: { width: number; height: number }
  updatedAt: string
}

export default function CustomizeDesktopPage() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [adDesign, setAdDesign] = useState<AdDesign | null>(null)
  const [businessVideo, setBusinessVideo] = useState<CloudflareBusinessMedia | null>(null)
  const [headerImage, setHeaderImage] = useState<HeaderImageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isSavingImage, setIsSavingImage] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [originalImageDimensions, setOriginalImageDimensions] = useState<{ width: number; height: number } | null>(null)
  const [viewWindowPosition, setViewWindowPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [savedHeaderImage, setSavedHeaderImage] = useState<HeaderImageData | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const viewWindowRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load business data
      const businessData = await getCurrentBusiness()
      if (businessData) {
        setBusiness(businessData)

        // Load ad design
        const designData = await getBusinessAdDesign(businessData.id)
        if (designData) {
          setAdDesign(designData)
        } else {
          // Set default design
          setAdDesign({
            designId: 5,
            colorScheme: "blue",
            texture: "gradient",
            customButton: { type: "Menu", name: "Menu", icon: "Menu" },
            businessInfo: {
              businessName: businessData.businessName,
              streetAddress: "",
              city: "",
              state: "",
              zipCode: businessData.zipCode,
              phone: "",
              hours: "",
              website: "",
              freeText: "",
            },
            hiddenFields: {},
            desktopLayout: {
              layoutType: "standard",
              videoAspectRatio: "landscape",
            },
          })
        }

        // Load business video
        try {
          const videoData = await getCloudflareBusinessMedia(businessData.id)
          if (videoData && videoData.cloudflareVideoId) {
            setBusinessVideo(videoData)
          }
        } catch (error) {
          console.error("Error loading business video:", error)
        }

        // Load saved header image
        await loadSavedHeaderImage(businessData.id)
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load business data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSavedHeaderImage = async (businessId: string) => {
    try {
      const headerImageData = await getBusinessHeaderImage(businessId)
      if (headerImageData) {
        console.log("Loaded saved header image:", headerImageData)
        setSavedHeaderImage(headerImageData)
        setHeaderImage(headerImageData)
      }
    } catch (error) {
      console.error("Error loading saved header image:", error)
    }
  }

  const handleSave = async () => {
    if (!business || !adDesign) return

    try {
      setSaving(true)
      const result = await saveBusinessAdDesign(business.id, adDesign)

      if (result.success) {
        toast({
          title: "Success",
          description: "Desktop layout settings saved successfully!",
        })
      } else {
        throw new Error(result.error || "Failed to save")
      }
    } catch (error) {
      console.error("Error saving ad design:", error)
      toast({
        title: "Error",
        description: "Failed to save desktop layout settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setUploadedImage(imageUrl)

        // Get image dimensions
        const img = new Image()
        img.onload = () => {
          setOriginalImageDimensions({ width: img.width, height: img.height })
          setViewWindowPosition({ x: 0, y: 0 })
        }
        img.src = imageUrl

        setIsImageEditorOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!viewWindowRef.current) return

    setIsDragging(true)
    const rect = viewWindowRef.current.getBoundingClientRect()
    setDragStart({
      x: e.clientX - rect.left - viewWindowPosition.x,
      y: e.clientY - rect.top - viewWindowPosition.y,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !viewWindowRef.current || !originalImageDimensions) return

    const rect = viewWindowRef.current.getBoundingClientRect()
    const newX = e.clientX - rect.left - dragStart.x
    const newY = e.clientY - rect.top - dragStart.y

    // Constrain movement within bounds
    const maxX = originalImageDimensions.width - rect.width
    const maxY = originalImageDimensions.height - rect.height

    setViewWindowPosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const uploadHeaderImageToCloudflare = async () => {
    if (!uploadedImage || !business) return null

    try {
      // Convert data URL to blob
      const response = await fetch(uploadedImage)
      const blob = await response.blob()

      // Create form data
      const formData = new FormData()
      formData.append("file", blob, "header-image.jpg")
      formData.append(
        "metadata",
        JSON.stringify({
          businessId: business.id,
          type: "header-image",
          viewWindowPosition,
          originalImageDimensions,
        }),
      )

      const result = await uploadImageToCloudflare(formData)

      if (result.success && result.imageId) {
        return result.imageId
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading to Cloudflare:", error)
      throw error
    }
  }

  const handleSaveHeaderImage = async () => {
    if (!business || !uploadedImage || !originalImageDimensions) return

    try {
      setIsSavingImage(true)

      // Upload to Cloudflare
      const imageId = await uploadHeaderImageToCloudflare()

      if (imageId) {
        // Save to database
        const result = await saveBusinessHeaderImage(business.id, imageId, viewWindowPosition, originalImageDimensions)

        if (result.success) {
          // Update local state
          const newHeaderImageData = {
            imageId,
            viewWindowPosition,
            originalImageDimensions,
            updatedAt: new Date().toISOString(),
          }
          setSavedHeaderImage(newHeaderImageData)
          setHeaderImage(newHeaderImageData)

          toast({
            title: "Success",
            description: "Header image saved successfully! It will persist between logins.",
            className: "bg-green-50 border-green-200",
          })

          setIsImageEditorOpen(false)
          setUploadedImage(null)
        } else {
          throw new Error(result.error || "Failed to save header image data")
        }
      }
    } catch (error) {
      console.error("Error saving header image:", error)
      toast({
        title: "Error",
        description: "Failed to save header image",
        variant: "destructive",
      })
    } finally {
      setIsSavingImage(false)
    }
  }

  const getColorValues = () => {
    if (adDesign?.colorValues && adDesign.colorValues.primary) {
      return adDesign.colorValues
    }

    const colorMap: Record<string, { primary: string; secondary: string; textColor?: string }> = {
      blue: { primary: "#007BFF", secondary: "#0056b3" },
      purple: { primary: "#6f42c1", secondary: "#5e37a6" },
      green: { primary: "#28a745", secondary: "#218838" },
      teal: { primary: "#20c997", secondary: "#17a2b8" },
      orange: { primary: "#fd7e14", secondary: "#e65f02" },
      red: { primary: "#dc3545", secondary: "#c82333" },
      black: { primary: "#000000", secondary: "#333333" },
      white: { primary: "#ffffff", secondary: "#f8f9fa", textColor: "#000000" },
      yellow: { primary: "#ffc107", secondary: "#ffdb58", textColor: "#000000" },
      slategrey: { primary: "#708090", secondary: "#4E5964" },
      brown: { primary: "#8B4513", secondary: "#6B3610" },
      darkpink: { primary: "#FF1493", secondary: "#C71585" },
      lightpink: { primary: "#FFC0CB", secondary: "#FFB6C1", textColor: "#000000" },
    }

    return colorMap[adDesign?.colorScheme || "blue"] || colorMap.blue
  }

  const getTextureStyles = () => {
    const textureOptions = [
      {
        name: "Gradient",
        value: "gradient",
        style: {},
      },
      {
        name: "Dots",
        value: "dots",
        style: {
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        },
      },
      {
        name: "Lines",
        value: "lines",
        style: {
          backgroundImage:
            "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
        },
      },
      {
        name: "Grid",
        value: "grid",
        style: {
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "10px 10px",
        },
      },
    ]

    return textureOptions.find((t) => t.value === adDesign?.texture)?.style || {}
  }

  const getHeaderImageUrl = () => {
    // Use uploaded image if available, otherwise use saved image
    if (uploadedImage) return uploadedImage
    if (savedHeaderImage?.imageId) {
      return `https://imagedelivery.net/Fx83XHJ2QHIeAJio-AnNbA/${savedHeaderImage.imageId}/public`
    }
    return null
  }

  const getHeaderImageStyles = () => {
    const imageData = uploadedImage ? { viewWindowPosition, originalImageDimensions } : savedHeaderImage
    if (!imageData || !imageData.viewWindowPosition || !imageData.originalImageDimensions) return {}

    return {
      backgroundImage: `url(${getHeaderImageUrl()})`,
      backgroundPosition: `${-imageData.viewWindowPosition.x}px ${-imageData.viewWindowPosition.y}px`,
      backgroundSize: `${imageData.originalImageDimensions.width}px ${imageData.originalImageDimensions.height}px`,
      backgroundRepeat: "no-repeat",
    }
  }

  const colorValues = getColorValues()
  const textureStyles = getTextureStyles()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading desktop customization...</p>
        </div>
      </div>
    )
  }

  if (!business || !adDesign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Failed to load business data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Desktop Layout Customization</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize how your business profile appears on desktop devices
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Layout Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="layoutType">Layout Type</Label>
                  <Select
                    value={adDesign.desktopLayout.layoutType}
                    onValueChange={(value: "standard" | "video-focus" | "info-focus") =>
                      setAdDesign({
                        ...adDesign,
                        desktopLayout: { ...adDesign.desktopLayout, layoutType: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (50/50 Split)</SelectItem>
                      <SelectItem value="video-focus">Video Focus (2/3 Video)</SelectItem>
                      <SelectItem value="info-focus">Info Focus (2/3 Info)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="videoAspectRatio">Video Aspect Ratio</Label>
                  <Select
                    value={adDesign.desktopLayout.videoAspectRatio}
                    onValueChange={(value: "landscape" | "portrait" | "square") =>
                      setAdDesign({
                        ...adDesign,
                        desktopLayout: { ...adDesign.desktopLayout, videoAspectRatio: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="landscape">Landscape (16:9)</SelectItem>
                      <SelectItem value="portrait">Portrait (9:16)</SelectItem>
                      <SelectItem value="square">Square (1:1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Header Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Header Image</Label>
                  <div className="mt-2">
                    {getHeaderImageUrl() ? (
                      <div className="relative">
                        <img
                          src={getHeaderImageUrl()! || "/placeholder.svg"}
                          alt="Header preview"
                          className="w-full h-24 object-cover rounded-md border"
                          style={getHeaderImageStyles()}
                        />
                        {savedHeaderImage && (
                          <Badge className="absolute top-2 right-2 bg-green-100 text-green-800">Saved</Badge>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-gray-100 dark:bg-gray-800 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400">No header image</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>

                  <Dialog open={isImageEditorOpen} onOpenChange={setIsImageEditorOpen}>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Edit Header Image</DialogTitle>
                      </DialogHeader>

                      {uploadedImage && originalImageDimensions && (
                        <div className="space-y-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Position the image by dragging it within the preview window below:
                          </div>

                          <div className="relative border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            <div
                              ref={viewWindowRef}
                              className="relative w-full h-48 overflow-hidden cursor-move"
                              onMouseDown={handleMouseDown}
                              onMouseMove={handleMouseMove}
                              onMouseUp={handleMouseUp}
                              onMouseLeave={handleMouseUp}
                            >
                              <img
                                ref={imageRef}
                                src={uploadedImage || "/placeholder.svg"}
                                alt="Header image"
                                className="absolute select-none"
                                style={{
                                  left: -viewWindowPosition.x,
                                  top: -viewWindowPosition.y,
                                  width: originalImageDimensions.width,
                                  height: originalImageDimensions.height,
                                }}
                                draggable={false}
                              />

                              {/* Crop overlay */}
                              <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none">
                                <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                                  Header Preview Area
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Image: {originalImageDimensions.width} × {originalImageDimensions.height}px
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsImageEditorOpen(false)
                                  setUploadedImage(null)
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSaveHeaderImage}
                                disabled={isSavingImage}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {isSavingImage ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Save Header Image
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Preview Device
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant={previewDevice === "desktop" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewDevice("desktop")}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Desktop
                  </Button>
                  <Button
                    variant={previewDevice === "tablet" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewDevice("tablet")}
                  >
                    <Tablet className="h-4 w-4 mr-2" />
                    Tablet
                  </Button>
                  <Button
                    variant={previewDevice === "mobile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewDevice("mobile")}
                  >
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Layout
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Desktop Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300",
                    previewDevice === "desktop" && "max-w-4xl",
                    previewDevice === "tablet" && "max-w-2xl",
                    previewDevice === "mobile" && "max-w-sm",
                  )}
                >
                  {/* Header */}
                  <div
                    className={`p-6 text-white relative overflow-hidden ${colorValues.textColor ? "text-black" : "text-white"}`}
                    style={{
                      backgroundColor: adDesign.texture === "gradient" ? "" : colorValues.primary,
                      backgroundImage:
                        adDesign.texture === "gradient"
                          ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                          : undefined,
                      ...textureStyles,
                      ...getHeaderImageStyles(),
                    }}
                  >
                    {/* Header image overlay if exists */}
                    {getHeaderImageUrl() && (
                      <div className="absolute inset-0 bg-cover bg-no-repeat" style={getHeaderImageStyles()} />
                    )}

                    {/* Content overlay */}
                    <div className="relative z-10">
                      <h1 className="text-2xl font-bold mb-2">
                        {adDesign.businessInfo.businessName || business.businessName}
                      </h1>
                      {adDesign.businessInfo.freeText && <p className="opacity-90">{adDesign.businessInfo.freeText}</p>}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-6">
                    {adDesign.desktopLayout.layoutType === "standard" && (
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Business Info */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Contact Information</h3>
                          <div className="space-y-2 text-sm">
                            <p>📞 {adDesign.businessInfo.phone || "Phone not provided"}</p>
                            <p>📧 {business.email}</p>
                            <p>📍 {adDesign.businessInfo.streetAddress || "Address not provided"}</p>
                          </div>

                          {adDesign.businessInfo.hours && (
                            <div>
                              <h4 className="font-medium">Hours</h4>
                              <p className="text-sm">{adDesign.businessInfo.hours}</p>
                            </div>
                          )}
                        </div>

                        {/* Video/Media */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Featured Content</h3>
                          <div
                            className={cn(
                              "bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center",
                              adDesign.desktopLayout.videoAspectRatio === "landscape" && "aspect-video",
                              adDesign.desktopLayout.videoAspectRatio === "portrait" && "aspect-[9/16]",
                              adDesign.desktopLayout.videoAspectRatio === "square" && "aspect-square",
                            )}
                          >
                            {businessVideo ? (
                              <div className="text-center">
                                <Video className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                                <p className="text-sm text-gray-500">Business Video</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                                <p className="text-sm text-gray-500">No video uploaded</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {adDesign.desktopLayout.layoutType === "video-focus" && (
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Video takes 2 columns */}
                        <div className="md:col-span-2 space-y-4">
                          <h3 className="font-semibold text-lg">Featured Content</h3>
                          <div
                            className={cn(
                              "bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center",
                              adDesign.desktopLayout.videoAspectRatio === "landscape" && "aspect-video",
                              adDesign.desktopLayout.videoAspectRatio === "portrait" && "aspect-[9/16]",
                              adDesign.desktopLayout.videoAspectRatio === "square" && "aspect-square",
                            )}
                          >
                            {businessVideo ? (
                              <div className="text-center">
                                <Video className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                                <p className="text-sm text-gray-500">Business Video</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                                <p className="text-sm text-gray-500">No video uploaded</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Info takes 1 column */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Contact</h3>
                          <div className="space-y-2 text-sm">
                            <p>📞 {adDesign.businessInfo.phone || "Phone not provided"}</p>
                            <p>📧 {business.email}</p>
                            <p>📍 {adDesign.businessInfo.streetAddress || "Address not provided"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {adDesign.desktopLayout.layoutType === "info-focus" && (
                      <div className="grid md:grid-cols-3 gap-6">
                        {/* Info takes 2 columns */}
                        <div className="md:col-span-2 space-y-4">
                          <h3 className="font-semibold text-lg">Contact Information</h3>
                          <div className="space-y-2 text-sm">
                            <p>📞 {adDesign.businessInfo.phone || "Phone not provided"}</p>
                            <p>📧 {business.email}</p>
                            <p>📍 {adDesign.businessInfo.streetAddress || "Address not provided"}</p>
                          </div>

                          {adDesign.businessInfo.hours && (
                            <div>
                              <h4 className="font-medium">Hours</h4>
                              <p className="text-sm">{adDesign.businessInfo.hours}</p>
                            </div>
                          )}
                        </div>

                        {/* Video takes 1 column */}
                        <div className="space-y-4">
                          <h3 className="font-semibold text-lg">Featured Content</h3>
                          <div
                            className={cn(
                              "bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center",
                              adDesign.desktopLayout.videoAspectRatio === "landscape" && "aspect-video",
                              adDesign.desktopLayout.videoAspectRatio === "portrait" && "aspect-[9/16]",
                              adDesign.desktopLayout.videoAspectRatio === "square" && "aspect-square",
                            )}
                          >
                            {businessVideo ? (
                              <div className="text-center">
                                <Video className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                                <p className="text-sm text-gray-500">Business Video</p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                                <p className="text-sm text-gray-500">No video uploaded</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
