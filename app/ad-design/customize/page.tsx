"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getBusinessMedia, type MediaItem } from "@/app/actions/media-actions"
import { saveBusinessAdDesign, getBusinessAdDesign } from "@/app/actions/business-actions"
import { getCurrentBusiness } from "@/app/actions/auth-actions"
import { getCloudflareBusinessMedia, type CloudflareBusinessMedia } from "@/app/actions/cloudflare-media-actions"

import {
  ImageIcon,
  Ticket,
  Briefcase,
  Menu,
  List,
  FileText,
  ShoppingCart,
  Clipboard,
  Calendar,
  MessageSquare,
  Map,
  Settings,
  BookOpen,
  PenTool,
  Truck,
  Heart,
  Coffee,
  Gift,
  Music,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"

interface PhotoItem {
  id: string
  url: string
  name: string
}

export default function CustomizeAdDesignPage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState(5)
  const [selectedColor, setSelectedColor] = useState("blue")
  const [selectedTexture, setSelectedTexture] = useState("gradient")
  const [useCustomColors, setUseCustomColors] = useState(false)
  const [customColors, setCustomColors] = useState({
    primary: "#007BFF",
    secondary: "#0056b3",
  })

  // Form data state
  const [formData, setFormData] = useState({
    businessName: "Business Name",
    streetAddress: "123 Business St",
    city: "City",
    state: "ST",
    zipCode: "12345",
    phoneArea: "555",
    phonePrefix: "123",
    phoneLine: "4567",
    email: "business@example.com",
    hours: "Mon-Fri: 9AM-5PM\nSat: 10AM-3PM",
    website: "www.businessname.com",
    freeText: "We offer professional services with 10+ years of experience in the industry.",
  })

  // Hidden fields state
  const [hiddenFields, setHiddenFields] = useState<{
    address: boolean
    phone: boolean
    email: boolean
    hours: boolean
    website: boolean
    video: boolean
    photoAlbum: boolean
    freeText: boolean
    savingsButton: boolean
    jobsButton: boolean
    customButton: boolean
  }>({
    address: false,
    phone: false,
    email: false,
    hours: false,
    website: false,
    video: false,
    photoAlbum: false,
    freeText: false,
    savingsButton: false,
    jobsButton: false,
    customButton: false,
  })

  // Custom button state
  const [customButtonType, setCustomButtonType] = useState<string>("Menu")
  const [customButtonName, setCustomButtonName] = useState<string>("Menu")
  const [customButtonIcon, setCustomButtonIcon] = useState<string>("Menu")

  // Media state
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [cloudflareVideo, setCloudflareVideo] = useState<CloudflareBusinessMedia | null>(null)

  // Color mapping
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

  // Helper function to detect if a color is light
  const isLightColor = (hexColor: string): boolean => {
    const hex = hexColor.replace("#", "")
    const r = Number.parseInt(hex.substr(0, 2), 16)
    const g = Number.parseInt(hex.substr(2, 2), 16)
    const b = Number.parseInt(hex.substr(4, 2), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128
  }

  // Texture options
  const textureOptions = [
    {
      name: "None",
      value: "none",
      style: {
        backgroundColor: "",
        backgroundImage: "none",
        backgroundSize: "auto",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Gradient",
      value: "gradient",
      style: {
        backgroundColor: "",
        backgroundImage: "none",
        backgroundSize: "auto",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Dots",
      value: "dots",
      style: {
        backgroundColor: "",
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "10px 10px",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Lines",
      value: "lines",
      style: {
        backgroundColor: "",
        backgroundImage:
          "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)",
        backgroundSize: "auto",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Grid",
      value: "grid",
      style: {
        backgroundColor: "",
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "10px 10px",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Diagonal",
      value: "diagonal",
      style: {
        backgroundColor: "",
        backgroundImage:
          "repeating-linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.1) 10px, transparent 10px, transparent 20px)",
        backgroundSize: "auto",
        backgroundRepeat: "repeat",
      },
    },
    {
      name: "Waves",
      value: "waves",
      style: {
        backgroundColor: "",
        backgroundImage: "radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 50%)",
        backgroundSize: "20px 10px",
        backgroundRepeat: "repeat",
      },
    },
  ]

  // Get the selected color values
  const colorValues = useCustomColors
    ? {
        primary: customColors.primary,
        secondary: customColors.secondary,
        textColor: isLightColor(customColors.primary) ? "#000000" : undefined,
      }
    : colorMap[selectedColor] || colorMap.blue

  // Load business data
  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setIsLoading(true)

        // Get the current business from the session
        const business = await getCurrentBusiness()
        let id = "demo-business"

        if (business && business.id) {
          id = business.id
        }

        setBusinessId(id)

        // Load saved media
        await loadSavedMedia(id)

        // Load business data
        await loadBusinessData(id)

        setIsLoading(false)
      } catch (error) {
        console.error("Error loading business data:", error)
        toast({
          title: "Error",
          description: "Failed to load your business data. Please try again.",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }

    fetchBusinessData()
  }, [])

  // Load saved media for the business
  const loadSavedMedia = async (id: string) => {
    try {
      const media = await getBusinessMedia(id)

      // Load Cloudflare video
      const cloudflareMedia = await getCloudflareBusinessMedia(id)
      if (cloudflareMedia && cloudflareMedia.cloudflareVideoId) {
        setCloudflareVideo(cloudflareMedia)
      }

      if (media) {
        // Set photo album if available
        if (media.photoAlbum && Array.isArray(media.photoAlbum) && media.photoAlbum.length > 0) {
          const loadedPhotos = media.photoAlbum.map((photo: MediaItem) => ({
            id: photo.id,
            url: photo.url,
            name: photo.filename || "Unnamed photo",
          }))
          setPhotos(loadedPhotos)
        } else {
          setPhotos([])
        }
      }
    } catch (error) {
      console.error("Error loading saved media:", error)
      setCloudflareVideo(null)
      setPhotos([])
    }
  }

  // Load business data
  const loadBusinessData = async (id: string) => {
    try {
      const savedDesign = await getBusinessAdDesign(id)

      if (savedDesign && savedDesign.businessInfo) {
        const businessInfo = savedDesign.businessInfo

        // Parse phone number
        let phoneArea = "555"
        let phonePrefix = "123"
        let phoneLine = "4567"

        if (businessInfo.phone) {
          const phoneMatch = businessInfo.phone.match(/$$(\d{3})$$\s*(\d{3})-(\d{4})/)
          if (phoneMatch) {
            phoneArea = phoneMatch[1]
            phonePrefix = phoneMatch[2]
            phoneLine = phoneMatch[3]
          } else {
            const digitsOnly = businessInfo.phone.replace(/\D/g, "")
            if (digitsOnly.length === 10) {
              phoneArea = digitsOnly.slice(0, 3)
              phonePrefix = digitsOnly.slice(3, 6)
              phoneLine = digitsOnly.slice(6, 10)
            }
          }
        }

        // Load hidden fields
        if (savedDesign.hiddenFields) {
          setHiddenFields((prevFields) => ({
            ...prevFields,
            ...savedDesign.hiddenFields,
          }))
        }

        // Load custom button settings
        if (savedDesign.customButton) {
          setCustomButtonType(savedDesign.customButton.type || "Menu")
          setCustomButtonName(savedDesign.customButton.name || "Menu")
          setCustomButtonIcon(savedDesign.customButton.icon || "Menu")
        }

        // Update form data
        setFormData({
          businessName: businessInfo.businessName || "Business Name",
          streetAddress: businessInfo.streetAddress || "123 Business St",
          city: businessInfo.city || "City",
          state: businessInfo.state || "ST",
          zipCode: businessInfo.zipCode || "12345",
          phoneArea: phoneArea || "555",
          phonePrefix: phonePrefix || "123",
          phoneLine: phoneLine || "4567",
          email: businessInfo.email || "business@example.com",
          hours: businessInfo.hours || "Mon-Fri: 9AM-5PM\nSat: 10AM-3PM",
          website: businessInfo.website || "www.businessname.com",
          freeText:
            businessInfo.freeText || "We offer professional services with 10+ years of experience in the industry.",
        })

        // Load color settings
        if (savedDesign.customColors) {
          setUseCustomColors(true)
          setCustomColors(savedDesign.customColors)
        } else if (savedDesign.colorScheme === "custom") {
          setUseCustomColors(true)
        } else {
          setUseCustomColors(false)
        }

        if (savedDesign.colorScheme && savedDesign.colorScheme !== "custom") {
          setSelectedColor(savedDesign.colorScheme)
        }

        if (savedDesign.texture) {
          setSelectedTexture(savedDesign.texture)
        }
      }
    } catch (error) {
      console.error("Error loading business data:", error)
    }
  }

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle hidden field toggles
  const handleHiddenFieldToggle = (field: string, checked: boolean) => {
    setHiddenFields((prev) => ({
      ...prev,
      [field]: checked,
    }))
  }

  // Handle custom button changes
  const handleCustomButtonChange = (field: string, value: string) => {
    if (field === "type") {
      setCustomButtonType(value)
      // Auto-set name and icon based on type
      setCustomButtonName(value)
      setCustomButtonIcon(value)
    } else if (field === "name") {
      setCustomButtonName(value)
    } else if (field === "icon") {
      setCustomButtonIcon(value)
    }
  }

  // Save the ad design
  const handleSave = async () => {
    try {
      setIsSaving(true)

      const designData = {
        designId: selectedDesign,
        colorScheme: useCustomColors ? "custom" : selectedColor,
        colorValues: useCustomColors ? customColors : colorMap[selectedColor],
        texture: selectedTexture,
        customColors: useCustomColors ? customColors : null,
        businessInfo: {
          businessName: formData.businessName,
          streetAddress: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          phone: `(${formData.phoneArea}) ${formData.phonePrefix}-${formData.phoneLine}`,
          email: formData.email,
          hours: formData.hours,
          website: formData.website,
          freeText: formData.freeText,
        },
        hiddenFields: hiddenFields,
        customButton: {
          type: customButtonType,
          name: customButtonName,
          icon: customButtonIcon,
        },
      }

      const result = await saveBusinessAdDesign(businessId, designData)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your ad design has been saved successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save ad design. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving ad design:", error)
      toast({
        title: "Error",
        description: "Failed to save ad design. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Helper functions
  const getFormattedPhone = () => {
    return `(${formData.phoneArea}) ${formData.phonePrefix}-${formData.phoneLine}`
  }

  const getFormattedAddress = () => {
    return `${formData.streetAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}`
  }

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ElementType> = {
      Menu: Menu,
      List: List,
      FileText: FileText,
      ShoppingCart: ShoppingCart,
      Clipboard: Clipboard,
      Calendar: Calendar,
      MessageSquare: MessageSquare,
      Map: Map,
      Settings: Settings,
      BookOpen: BookOpen,
      PenTool: PenTool,
      Truck: Truck,
      Heart: Heart,
      Coffee: Coffee,
      Gift: Gift,
      Music: Music,
    }

    return iconMap[iconName] || Menu
  }

  const handleCustomizeDesktop = () => {
    router.push("/ad-design/customize-desktop")
  }

  // Render mobile business profile
  const renderMobileProfile = () => {
    return (
      <div className="w-full max-w-sm mx-auto">
        <Card className="w-full animate-in fade-in duration-1000">
          <div
            className={`p-5 ${colorValues.textColor ? "text-black" : "text-white"}`}
            style={{
              backgroundColor: selectedTexture === "gradient" ? "" : colorValues.primary,
              backgroundImage:
                selectedTexture === "gradient"
                  ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                  : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundImage || "none",
              backgroundSize: textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundSize || "auto",
              backgroundRepeat:
                textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundRepeat || "repeat",
            }}
          >
            <h3 className="text-2xl font-bold">{formData.businessName}</h3>
            {!hiddenFields.freeText && formData.freeText && (
              <p className="text-base mt-1 opacity-90">{formData.freeText}</p>
            )}
          </div>

          <div className="pt-6 px-6 space-y-4">
            {!hiddenFields.phone && (
              <div className="flex items-start gap-3">
                <div
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{
                    color: colorValues.textColor ? "#000000" : colorValues.primary,
                  }}
                >
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm">{getFormattedPhone()}</p>
                </div>
              </div>
            )}

            {!hiddenFields.email && (
              <div className="flex items-start gap-3">
                <div
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{
                    color: colorValues.textColor ? "#000000" : colorValues.primary,
                  }}
                >
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{formData.email}</p>
                </div>
              </div>
            )}

            {!hiddenFields.address && (
              <div className="flex items-start gap-3">
                <div
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{
                    color: colorValues.textColor ? "#000000" : colorValues.primary,
                  }}
                >
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="text-sm">{getFormattedAddress()}</p>
                </div>
              </div>
            )}

            {!hiddenFields.hours && (
              <div className="flex items-start gap-3">
                <div
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{
                    color: colorValues.textColor ? "#000000" : colorValues.primary,
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Hours of Operation</p>
                  <div className="space-y-1">
                    {formData.hours.split("\n").map((line, i) => (
                      <p key={i} className="text-sm">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Video Section */}
          {!hiddenFields.video && cloudflareVideo && cloudflareVideo.cloudflareVideoId && (
            <div className="border-t pt-4 mt-4 px-4 animate-in fade-in duration-2000 delay-500">
              <div className="relative w-full pb-[56.25%]">
                <div className="absolute inset-0 z-20 rounded-md overflow-hidden">
                  <iframe
                    src={`https://customer-5093uhykxo17njhi.cloudflarestream.com/${cloudflareVideo.cloudflareVideoId}/iframe`}
                    className="w-full h-full"
                    allow="accelerometer; gyroscope; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${formData.businessName} video`}
                    style={{ border: "none" }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mobile Footer with buttons */}
          <div className="flex flex-col items-stretch gap-3 border-t pt-4 px-4 pb-4 mt-4">
            <div className="grid grid-cols-3 gap-2">
              {!hiddenFields.photoAlbum && (
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center gap-1 h-auto py-3 bg-transparent"
                >
                  <ImageIcon
                    className="h-5 w-5"
                    style={{
                      color: colorValues.textColor ? "#000000" : colorValues.primary,
                    }}
                  />
                  <span className="text-xs">Photo Album</span>
                </Button>
              )}

              {!hiddenFields.savingsButton && (
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center gap-1 h-auto py-3 bg-transparent"
                >
                  <Ticket
                    className="h-5 w-5"
                    style={{
                      color: colorValues.textColor ? "#000000" : colorValues.primary,
                    }}
                  />
                  <span className="text-xs">Coupons</span>
                </Button>
              )}

              {!hiddenFields.jobsButton && (
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center gap-1 h-auto py-3 bg-transparent"
                >
                  <Briefcase
                    className="h-5 w-5"
                    style={{
                      color: colorValues.textColor ? "#000000" : colorValues.primary,
                    }}
                  />
                  <span className="text-xs">Jobs</span>
                </Button>
              )}
            </div>

            {/* Custom Button or Colored Rectangle - Mobile */}
            {!hiddenFields.customButton ? (
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-1 h-auto py-3 mt-2 bg-transparent"
              >
                {(() => {
                  const IconComponent = getIconComponent(customButtonIcon)
                  return (
                    <IconComponent
                      className="h-5 w-5"
                      style={{
                        color: colorValues.textColor ? "#000000" : colorValues.primary,
                      }}
                    />
                  )
                })()}
                <span className="text-xs">{customButtonName}</span>
              </Button>
            ) : (
              <div
                className="h-12 mt-2 rounded-md"
                style={{
                  backgroundColor: selectedTexture === "gradient" ? "" : colorValues.primary,
                  backgroundImage:
                    selectedTexture === "gradient"
                      ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                      : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundImage || "none",
                  backgroundSize:
                    textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundSize || "auto",
                  backgroundRepeat:
                    textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundRepeat || "repeat",
                }}
              />
            )}

            {!hiddenFields.website && formData.website && (
              <button
                className="flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                style={{
                  backgroundColor:
                    selectedTexture === "gradient" ? "" : colorValues.textColor ? "#000000" : colorValues.primary,
                  backgroundImage:
                    selectedTexture === "gradient"
                      ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                      : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundImage || "none",
                  backgroundSize:
                    textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundSize || "auto",
                  backgroundRepeat:
                    textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundRepeat || "repeat",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                Visit Website
              </button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your ad design...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Mobile Preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Mobile Preview</h2>
                <Button type="button" variant="outline" onClick={handleCustomizeDesktop}>
                  Customize Your Desktop Profile
                </Button>
              </div>
              {renderMobileProfile()}
            </div>
          </div>

          {/* Right Side - Customization Panel */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6">Customize Your Profile</h2>

            <Tabs defaultValue="business-info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="business-info">Business Info</TabsTrigger>
                <TabsTrigger value="colors">Colors</TabsTrigger>
                <TabsTrigger value="visibility">Visibility</TabsTrigger>
                <TabsTrigger value="custom-button">Custom Button</TabsTrigger>
              </TabsList>

              <TabsContent value="business-info" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange("businessName", e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="streetAddress">Street Address</Label>
                      <Input
                        id="streetAddress"
                        value={formData.streetAddress}
                        onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) => handleInputChange("state", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => handleInputChange("zipCode", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Phone Number</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="555"
                        value={formData.phoneArea}
                        onChange={(e) => handleInputChange("phoneArea", e.target.value)}
                        className="w-20"
                        maxLength={3}
                      />
                      <Input
                        placeholder="123"
                        value={formData.phonePrefix}
                        onChange={(e) => handleInputChange("phonePrefix", e.target.value)}
                        className="w-20"
                        maxLength={3}
                      />
                      <Input
                        placeholder="4567"
                        value={formData.phoneLine}
                        onChange={(e) => handleInputChange("phoneLine", e.target.value)}
                        className="w-24"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => handleInputChange("website", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="hours">Hours of Operation</Label>
                    <Textarea
                      id="hours"
                      value={formData.hours}
                      onChange={(e) => handleInputChange("hours", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="freeText">Description</Label>
                    <Textarea
                      id="freeText"
                      value={formData.freeText}
                      onChange={(e) => handleInputChange("freeText", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="colors" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="useCustomColors"
                      checked={useCustomColors}
                      onCheckedChange={(checked) => setUseCustomColors(checked as boolean)}
                    />
                    <Label htmlFor="useCustomColors">Use Custom Colors</Label>
                  </div>

                  {!useCustomColors ? (
                    <div>
                      <Label>Color Scheme</Label>
                      <div className="grid grid-cols-4 gap-2 mt-2">
                        {Object.entries(colorMap).map(([colorName, colorData]) => (
                          <button
                            key={colorName}
                            type="button"
                            onClick={() => setSelectedColor(colorName)}
                            className={`h-12 rounded-md border-2 ${
                              selectedColor === colorName ? "border-gray-800" : "border-gray-300"
                            }`}
                            style={{
                              background: `linear-gradient(to right, ${colorData.primary}, ${colorData.secondary})`,
                            }}
                            title={colorName}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <Input
                          id="primaryColor"
                          type="color"
                          value={customColors.primary}
                          onChange={(e) =>
                            setCustomColors((prev) => ({
                              ...prev,
                              primary: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={customColors.secondary}
                          onChange={(e) =>
                            setCustomColors((prev) => ({
                              ...prev,
                              secondary: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Texture</Label>
                    <Select value={selectedTexture} onValueChange={setSelectedTexture}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {textureOptions.map((texture) => (
                          <SelectItem key={texture.value} value={texture.value}>
                            {texture.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="visibility" className="space-y-4">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Hide elements from your business profile:</p>

                  {Object.entries(hiddenFields).map(([field, isHidden]) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={isHidden}
                        onCheckedChange={(checked) => handleHiddenFieldToggle(field, checked as boolean)}
                      />
                      <Label htmlFor={field} className="capitalize">
                        {field.replace(/([A-Z])/g, " $1").trim()}
                      </Label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="custom-button" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customButtonType">Button Type</Label>
                    <Select value={customButtonType} onValueChange={(value) => handleCustomButtonChange("type", value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Menu">Menu</SelectItem>
                        <SelectItem value="List">List</SelectItem>
                        <SelectItem value="FileText">Documents</SelectItem>
                        <SelectItem value="ShoppingCart">Shop</SelectItem>
                        <SelectItem value="Clipboard">Services</SelectItem>
                        <SelectItem value="Calendar">Schedule</SelectItem>
                        <SelectItem value="MessageSquare">Contact</SelectItem>
                        <SelectItem value="Map">Location</SelectItem>
                        <SelectItem value="Settings">Settings</SelectItem>
                        <SelectItem value="BookOpen">Catalog</SelectItem>
                        <SelectItem value="PenTool">Design</SelectItem>
                        <SelectItem value="Truck">Delivery</SelectItem>
                        <SelectItem value="Heart">Favorites</SelectItem>
                        <SelectItem value="Coffee">Cafe</SelectItem>
                        <SelectItem value="Gift">Gifts</SelectItem>
                        <SelectItem value="Music">Music</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="customButtonName">Button Name</Label>
                    <Input
                      id="customButtonName"
                      value={customButtonName}
                      onChange={(e) => handleCustomButtonChange("name", e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t">
              <Button onClick={handleSave} disabled={isSaving} className="w-full">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
