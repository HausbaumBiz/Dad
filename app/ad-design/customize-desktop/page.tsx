"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { getBusinessMedia, type MediaItem } from "@/app/actions/media-actions"
import { getBusinessAdDesign } from "@/app/actions/business-actions"
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

export default function CustomizeDesktopProfilePage() {
  const router = useRouter()
  const [businessId, setBusinessId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
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

  const handleReturnToMobile = () => {
    router.push("/ad-design/customize")
  }

  // Render desktop business profile exactly as it appears in BusinessProfileDialog
  const renderDesktopProfile = () => {
    return (
      <div className="max-w-6xl mx-auto">
        {/* Header with Business Name */}
        <div
          className={`text-white rounded-t-lg p-8 ${colorValues.textColor ? "text-black" : "text-white"} animate-in fade-in duration-500`}
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
          <h1 className="text-3xl md:text-4xl font-bold">{formData.businessName}</h1>
          {!hiddenFields.freeText && formData.freeText && <p className="opacity-90 mt-2">{formData.freeText}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-6 bg-white dark:bg-slate-900 p-6 rounded-b-lg shadow-lg">
          {/* Left Column - Business Info */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="overflow-hidden border-none shadow-md animate-in slide-in-from-left duration-700 delay-200">
              <CardContent className="p-0">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
                  <h2 className="font-semibold text-lg">Contact Information</h2>
                </div>
                <div className="p-4 space-y-4">
                  {!hiddenFields.phone && (
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-full"
                        style={{
                          backgroundColor: `${colorValues.primary}20`,
                        }}
                      >
                        <Phone
                          className="h-5 w-5"
                          style={{
                            color: colorValues.primary,
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Phone</p>
                        <p className="font-medium">{getFormattedPhone()}</p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.email && (
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-full"
                        style={{
                          backgroundColor: `${colorValues.primary}20`,
                        }}
                      >
                        <Mail
                          className="h-5 w-5"
                          style={{
                            color: colorValues.primary,
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
                        <p className="font-medium">{formData.email}</p>
                      </div>
                    </div>
                  )}

                  {!hiddenFields.address && (
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-full mt-1"
                        style={{
                          backgroundColor: `${colorValues.primary}20`,
                        }}
                      >
                        <MapPin
                          className="h-5 w-5"
                          style={{
                            color: colorValues.primary,
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                        <p className="font-medium">{getFormattedAddress()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hours of Operation */}
            {!hiddenFields.hours && (
              <Card className="overflow-hidden border-none shadow-md animate-in slide-in-from-left duration-700 delay-400">
                <CardContent className="p-0">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
                    <h2 className="font-semibold text-lg">Hours of Operation</h2>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="p-2 rounded-full"
                        style={{
                          backgroundColor: `${colorValues.primary}20`,
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
                          style={{
                            color: colorValues.primary,
                          }}
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Open Hours</p>
                      </div>
                    </div>

                    <div className="space-y-2 pl-12">
                      {formData.hours.split("\n").map((line, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center border-b border-dashed border-slate-200 dark:border-slate-700 pb-2 last:border-0 last:pb-0"
                        >
                          <p className="text-sm font-medium">{line}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card className="overflow-hidden border-none shadow-md animate-in slide-in-from-left duration-700 delay-600">
              <CardContent className="p-0">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
                  <h2 className="font-semibold text-lg">Quick Links</h2>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {!hiddenFields.photoAlbum && (
                    <button className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <ImageIcon
                        className="h-5 w-5"
                        style={{
                          color: colorValues.primary,
                        }}
                      />
                      <span className="text-sm font-medium">Photo Album</span>
                    </button>
                  )}

                  {!hiddenFields.savingsButton && (
                    <button className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Ticket
                        className="h-5 w-5"
                        style={{
                          color: colorValues.primary,
                        }}
                      />
                      <span className="text-sm font-medium">Coupons</span>
                    </button>
                  )}

                  {!hiddenFields.jobsButton && (
                    <button className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <Briefcase
                        className="h-5 w-5"
                        style={{
                          color: colorValues.primary,
                        }}
                      />
                      <span className="text-sm font-medium">Jobs</span>
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Video */}
          <div className="space-y-6">
            {!hiddenFields.video && (
              <Card className="overflow-hidden border-none shadow-md h-full animate-in slide-in-from-right duration-700 delay-300">
                <CardContent className="p-0 h-full flex flex-col">
                  <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b">
                    <h2 className="font-semibold text-lg">Featured Video</h2>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="relative w-full pb-[56.25%] flex-1">
                      {(() => {
                        if (cloudflareVideo && cloudflareVideo.cloudflareVideoId) {
                          const embedUrl = `https://customer-5093uhykxo17njhi.cloudflarestream.com/${cloudflareVideo.cloudflareVideoId}/iframe`
                          return (
                            <iframe
                              src={embedUrl}
                              className="absolute top-0 left-0 w-full h-full rounded-md"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title={`${formData.businessName} video`}
                              style={{ border: "none" }}
                            />
                          )
                        } else {
                          return (
                            <img
                              src="https://imagedelivery.net/Fx83XHJ2QHIeAJio-AnNbA/78c875cc-ec1b-4ebb-a52e-a1387c030200/public"
                              alt="Business image"
                              className="absolute top-0 left-0 w-full h-full object-cover rounded-md"
                            />
                          )
                        }
                      })()}
                    </div>

                    {/* Conditionally render either the website button or the custom button or colored rectangle */}
                    {hiddenFields.customButton && !hiddenFields.website && formData.website ? (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                          onClick={() => window.open(`https://${formData.website}`, "_blank")}
                          className="flex items-center justify-center gap-2 w-full text-white p-3 rounded-md transition-colors hover:opacity-90"
                          style={{
                            backgroundColor:
                              selectedTexture === "gradient"
                                ? ""
                                : colorValues.textColor
                                  ? "#000000"
                                  : colorValues.primary,
                            backgroundImage:
                              selectedTexture === "gradient"
                                ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                                : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundImage ||
                                  "none",
                            backgroundSize:
                              textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundSize || "auto",
                            backgroundRepeat:
                              textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundRepeat ||
                              "repeat",
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
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15,3 21,3 21,9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                          <span>Visit Our Full Website</span>
                        </button>
                      </div>
                    ) : !hiddenFields.customButton ? (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                          className="flex items-center justify-center gap-2 w-full text-white p-3 rounded-md transition-colors hover:opacity-90"
                          style={{
                            backgroundColor:
                              selectedTexture === "gradient"
                                ? ""
                                : colorValues.textColor
                                  ? "#000000"
                                  : colorValues.primary,
                            backgroundImage:
                              selectedTexture === "gradient"
                                ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                                : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundImage ||
                                  "none",
                            backgroundSize:
                              textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundSize || "auto",
                            backgroundRepeat:
                              textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundRepeat ||
                              "repeat",
                          }}
                        >
                          {(() => {
                            const IconComponent = getIconComponent(customButtonIcon)
                            return <IconComponent className="h-5 w-5 text-white" />
                          })()}
                          <span>{customButtonName}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div
                          className="w-full h-12 rounded-md"
                          style={{
                            backgroundColor:
                              selectedTexture === "gradient"
                                ? ""
                                : colorValues.textColor
                                  ? "#000000"
                                  : colorValues.primary,
                            backgroundImage:
                              selectedTexture === "gradient"
                                ? `linear-gradient(to right, ${colorValues.primary}, ${colorValues.secondary})`
                                : textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundImage ||
                                  "none",
                            backgroundSize:
                              textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundSize || "auto",
                            backgroundRepeat:
                              textureOptions.find((t) => t.value === selectedTexture)?.style.backgroundRepeat ||
                              "repeat",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your desktop profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customize Your Desktop Profile</h1>
          <Button type="button" variant="outline" onClick={handleReturnToMobile}>
            Return to Mobile Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Desktop Profile Preview */}
          <div className="flex justify-center">{renderDesktopProfile()}</div>

          {/* Right Side - Customization Area (Blank for now) */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Desktop Customization</h2>
              <p className="text-gray-600 mb-8">Desktop-specific customization options will be available here soon.</p>
              <div className="bg-gray-100 rounded-lg p-12 border-2 border-dashed border-gray-300">
                <p className="text-gray-500 text-lg">Customization menu coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
