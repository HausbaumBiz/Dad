"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  getCouponIds,
  getCouponMetadata,
  getCouponImageId,
  getGlobalCouponTerms,
} from "@/app/actions/coupon-image-actions"
import { CLOUDFLARE_ACCOUNT_HASH } from "@/lib/cloudflare-images"
import Image from "next/image"
import { Loader2, X, Info, Download, ExternalLink, ImageOff, RefreshCw, Bug, Copy, Check } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"

// Define a valid placeholder image URL
const PLACEHOLDER_IMAGE = "/placeholder.svg?text=No+Image+Available"

// Define alternative URL formats for troubleshooting
const URL_FORMATS = {
  DEFAULT: "default",
  DIRECT: "direct",
  PUBLIC: "public",
  VARIANT: "variant",
  CUSTOM: "custom",
}

// Default URL format to use (since public URL works)
const DEFAULT_URL_FORMAT = URL_FORMATS.PUBLIC

interface BusinessCouponsDialogProps {
  businessId: string
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  businessName?: string
}

export function BusinessCouponsDialog({
  businessId,
  isOpen,
  onOpenChange,
  businessName = "",
}: BusinessCouponsDialogProps) {
  const isMobile = useMobile()
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<any[]>([])
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null)
  const [globalTerms, setGlobalTerms] = useState<string>("")
  const [showTerms, setShowTerms] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [showFullSizeImage, setShowFullSizeImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [urlFormat, setUrlFormat] = useState<string>(DEFAULT_URL_FORMAT)
  const [isCopied, setIsCopied] = useState(false)
  const [debugImageId, setDebugImageId] = useState<string>("")
  const imageRef = useRef<HTMLImageElement>(null)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (isOpen && businessId) {
      loadCoupons()
    }
  }, [isOpen, businessId])

  // Reset copy state after 2 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const loadCoupons = async () => {
    setLoading(true)
    setError(null)
    setCoupons([])
    setImageErrors({})

    try {
      console.log(`Loading coupons for business ID: ${businessId}`)

      // Get all coupon IDs for this business
      const idsResult = await getCouponIds(businessId)

      console.log("Coupon IDs result:", idsResult)

      // Ensure we have a valid array of coupon IDs
      if (!idsResult.success) {
        setError("Failed to load coupons")
        setCoupons([])
        setLoading(false)
        return
      }

      // If couponIds is undefined or not an array, use an empty array
      const couponIds = Array.isArray(idsResult.couponIds) ? idsResult.couponIds : []

      if (couponIds.length === 0) {
        console.log("No coupon IDs found for this business")
        setCoupons([])
        setLoading(false)
        return
      }

      console.log(`Found ${couponIds.length} coupon IDs:`, couponIds)

      const couponData = []

      // Get metadata and image ID for each coupon
      for (const couponId of couponIds) {
        try {
          console.log(`Fetching data for coupon ID: ${couponId}`)

          const [metadataResult, imageIdResult] = await Promise.all([
            getCouponMetadata(businessId, couponId),
            getCouponImageId(businessId, couponId),
          ])

          console.log("Metadata result:", metadataResult)
          console.log("Image ID result:", imageIdResult)

          if (metadataResult.success && metadataResult.metadata && imageIdResult.success && imageIdResult.imageId) {
            // Generate the image URL using the direct format that works
            const imageUrl = getImageUrlByFormat(imageIdResult.imageId, DEFAULT_URL_FORMAT)
            console.log(`Generated image URL for coupon ${couponId}:`, imageUrl)

            // Check if this is the specific image ID we're looking for
            if (imageIdResult.imageId === "3c7f7206-113c-4de6-3ecd-e7c19f4f8300") {
              console.log("Found the specific image ID we're looking for!")
              setDebugImageId(imageIdResult.imageId)
            }

            couponData.push({
              id: couponId,
              ...metadataResult.metadata,
              imageId: imageIdResult.imageId,
              imageUrl,
            })
          } else {
            console.warn(`Missing data for coupon ${couponId}:`, {
              metadataSuccess: metadataResult.success,
              imageIdSuccess: imageIdResult.success,
            })
          }
        } catch (err) {
          console.error(`Error loading data for coupon ${couponId}:`, err)
          // Continue with other coupons even if one fails
        }
      }

      console.log(`Successfully loaded ${couponData.length} coupons`)

      // Sort coupons by expiration date (newest first)
      couponData.sort((a, b) => {
        if (!a.expirationDate || !b.expirationDate) return 0
        const dateA = new Date(a.expirationDate).getTime()
        const dateB = new Date(b.expirationDate).getTime()
        return dateB - dateA
      })

      setCoupons(couponData)

      // Load global terms and conditions
      try {
        const termsResult = await getGlobalCouponTerms(businessId)
        if (termsResult.success && termsResult.terms) {
          setGlobalTerms(termsResult.terms)
        } else {
          setGlobalTerms("Global terms and conditions not available.")
        }
      } catch (termsError) {
        console.error("Error loading global terms:", termsError)
        setGlobalTerms("Error loading global terms and conditions.")
      }
    } catch (error) {
      console.error("Error loading coupons:", error)
      setError("Failed to load coupons")
    } finally {
      setLoading(false)
    }
  }

  const handleCouponClick = (coupon: any) => {
    setSelectedCoupon(coupon)
    setShowFullImage(true)
    setShowFullSizeImage(false)

    // If this is the specific image we're troubleshooting, show debug info
    if (coupon.imageId === "3c7f7206-113c-4de6-3ecd-e7c19f4f8300") {
      setDebugImageId(coupon.imageId)
    }
  }

  const handleViewTerms = () => {
    setShowFullImage(false)
    setShowFullSizeImage(false)
    setActiveTab("terms") // Set the active tab to terms
  }

  // Function to handle image errors
  const handleImageError = (couponId: string) => {
    console.log(`Image failed to load for coupon ${couponId}`)
    setImageErrors((prev) => ({ ...prev, [couponId]: true }))
  }

  // Function to retry loading a specific image
  const retryLoadImage = async (couponId: string) => {
    setImageErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[couponId]
      return newErrors
    })
  }

  // Function to format terms with bold headings
  const formatTermsWithBoldHeadings = (terms: string) => {
    if (!terms) return ""

    // List of headings to make bold
    const headings = [
      "Eligibility",
      "Validity Period",
      "Redemption",
      "Limitations",
      "Exclusions",
      "Non-Transferability",
      "No Cash Value",
      "Modification and Termination",
      "Fraudulent Use",
      "Acceptance of Terms",
    ]

    let formattedTerms = terms

    // Replace each heading with a bold version
    headings.forEach((heading) => {
      formattedTerms = formattedTerms.replace(new RegExp(`${heading}`, "g"), `<strong>${heading}</strong>`)
    })

    return formattedTerms
  }

  // Function to format date from YYYY-MM-DD to MM/DD/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split("-")
    return `${month}/${day}/${year}`
  }

  // Filter coupons by size
  const smallCoupons = coupons.filter((coupon) => coupon.size === "small")
  const largeCoupons = coupons.filter((coupon) => coupon.size === "large")

  // Function to print the coupon
  const printCoupon = () => {
    if (!selectedCoupon?.imageUrl) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Coupon</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
            img { max-width: 100%; max-height: 100vh; }
            @media print {
              body { height: auto; }
              img { max-height: none; }
            }
          </style>
        </head>
        <body>
          <img src="${selectedCoupon.imageUrl}" alt="Coupon" onload="window.print();window.close()">
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // Function to download the coupon image
  const downloadCoupon = async () => {
    if (!selectedCoupon?.imageUrl) return

    try {
      setIsDownloading(true)

      // First try to use the Web Share API if available (better for mobile)
      if (navigator.share && navigator.canShare) {
        try {
          // Fetch the image
          const response = await fetch(selectedCoupon.imageUrl)
          const blob = await response.blob()

          // Create a file from the blob
          const file = new File([blob], `coupon-${selectedCoupon.id}.jpg`, { type: "image/jpeg" })

          // Check if we can share this file
          const shareData = {
            files: [file],
            title: selectedCoupon.title || "Coupon",
            text: `${selectedCoupon.title || "Coupon"} - Valid: ${formatDate(selectedCoupon.startDate)} - ${formatDate(selectedCoupon.expirationDate)}`,
          }

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData)
            toast({
              title: "Coupon shared",
              description: "You can save the image from the share menu.",
            })
            setIsDownloading(false)
            return
          }
        } catch (shareError) {
          console.log("Share API failed, falling back to download:", shareError)
          // Continue to fallback method
        }
      }

      // Fallback to traditional download method
      const response = await fetch(selectedCoupon.imageUrl)
      const blob = await response.blob()

      // Create a download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `coupon-${selectedCoupon.id}.jpg`

      // Append to the document, click it, and remove it
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up the URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
      }, 100)

      toast({
        title: "Coupon downloaded",
        description: "The coupon has been saved to your device.",
      })
    } catch (error) {
      console.error("Error downloading coupon:", error)
      toast({
        title: "Download failed",
        description: "Could not download the coupon. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  // Function to get a valid image source or placeholder
  const getValidImageSrc = (url: string | undefined | null): string => {
    // Check if url is a string and not empty
    if (typeof url !== "string" || url === "") {
      return PLACEHOLDER_IMAGE
    }

    // Check if the string contains only whitespace
    if (url.trim() === "") {
      return PLACEHOLDER_IMAGE
    }

    return url
  }

  // Function to generate different URL formats for troubleshooting
  const getImageUrlByFormat = (imageId: string, format: string): string => {
    if (!imageId) return PLACEHOLDER_IMAGE
    if (!CLOUDFLARE_ACCOUNT_HASH) return PLACEHOLDER_IMAGE

    switch (format) {
      case URL_FORMATS.DIRECT:
        return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/public`
      case URL_FORMATS.PUBLIC:
        return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/public`
      case URL_FORMATS.VARIANT:
        return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/thumbnail`
      case URL_FORMATS.CUSTOM:
        return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/custom`
      case URL_FORMATS.DEFAULT:
      default:
        return `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/public`
    }
  }

  // Function to copy URL to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setIsCopied(true)
        toast({
          title: "URL copied to clipboard",
          description: "The image URL has been copied to your clipboard.",
        })
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
        toast({
          title: "Failed to copy",
          description: "Could not copy the URL to clipboard.",
          variant: "destructive",
        })
      })
  }

  // Function to check image dimensions
  const checkImageDimensions = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current
      toast({
        title: "Image Dimensions",
        description: `Width: ${naturalWidth}px, Height: ${naturalHeight}px`,
      })
    }
  }

  // Function to render coupon image or fallback
  const renderCouponImage = (coupon: any, aspectRatio: string) => {
    // Check if we've already had an error for this coupon
    if (imageErrors[coupon.id]) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <ImageOff className="h-8 w-8 mb-2" />
          <span className="text-sm text-center px-2 mb-2">Image not available</span>
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              retryLoadImage(coupon.id)
            }}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      )
    }

    // Check if we have a valid URL for this image
    if (!coupon.imageUrl) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <ImageOff className="h-8 w-8 mb-2" />
          <span className="text-sm text-center px-2">Image URL not found</span>
        </div>
      )
    }

    // Log the image URL for debugging
    console.log(`Rendering image for coupon ${coupon.id} with URL: ${coupon.imageUrl}`)

    // Render the image with error handling
    return (
      <>
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
        </div>
        <Image
          src={getValidImageSrc(coupon.imageUrl) || "/placeholder.svg"}
          alt={coupon.title || "Coupon"}
          fill
          className="object-cover"
          sizes={aspectRatio === "4/3" ? "(max-width: 768px) 100vw, 50vw" : aspectRatio === "5/2.5" ? "100vw" : "100vw"}
          priority
          unoptimized
          onError={() => handleImageError(coupon.id)}
        />
      </>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto coupon-dialog dialog-content">
          {/* Custom close button that matches photo album style */}
          <div className="absolute right-4 top-4 z-10">
            <DialogClose className="rounded-full p-1.5 bg-white hover:bg-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          <DialogHeader className="pr-10 coupon-dialog-header">
            <DialogTitle className="text-xl font-bold truncate dialog-title">
              {businessName ? `${businessName} - Coupons` : "Available Coupons"}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2">Loading coupons...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <Button variant="outline" className="mt-4" onClick={loadCoupons}>
                Try Again
              </Button>
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No coupons available for this business.</p>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all" className="tabs-trigger">
                  All Coupons
                </TabsTrigger>
                <TabsTrigger value="terms" className="tabs-trigger">
                  Terms & Conditions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="space-y-6 coupon-content">
                  {smallCoupons.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Small Coupons</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 coupon-grid">
                        {smallCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="relative border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleCouponClick(coupon)}
                          >
                            <div className="relative aspect-[4/3] w-full">{renderCouponImage(coupon, "4/3")}</div>
                            <div className="absolute bottom-2 right-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCouponClick(coupon)
                                }}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </div>
                            {coupon.imageId === "3c7f7206-113c-4de6-3ecd-e7c19f4f8300" && (
                              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                Fixed Image
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {largeCoupons.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-3">Large Coupons</h3>
                      <div className="space-y-4">
                        {largeCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="relative border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleCouponClick(coupon)}
                          >
                            {/* Changed aspect ratio for large coupons to make them fit better */}
                            <div className="relative aspect-[5/2.5] w-full max-h-[200px]">
                              {renderCouponImage(coupon, "5/2.5")}
                            </div>
                            <div className="absolute bottom-2 right-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCouponClick(coupon)
                                }}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </div>
                            {coupon.imageId === "3c7f7206-113c-4de6-3ecd-e7c19f4f8300" && (
                              <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                Fixed Image
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="terms" className="mt-4">
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-medium mb-4">Global Terms & Conditions</h3>
                  <div
                    className="text-sm whitespace-pre-wrap text-sm-content"
                    dangerouslySetInnerHTML={{
                      __html: formatTermsWithBoldHeadings(globalTerms),
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Image Dialog */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-1 sm:p-2">
          <div className="relative w-full">
            {/* Custom close button that matches photo album style */}
            <div className="absolute top-2 right-2 z-10">
              <DialogClose className="rounded-full p-1.5 bg-white hover:bg-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>

            {/* Debug button */}
            {selectedCoupon?.imageId === "3c7f7206-113c-4de6-3ecd-e7c19f4f8300" && (
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 left-2 z-10 bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
              >
                <Bug className="mr-2 h-4 w-4" />
                {showDebugInfo ? "Hide Debug" : "Debug"}
              </Button>
            )}
          </div>

          {selectedCoupon?.imageUrl && (
            <div className="relative w-full coupon-image-container">
              {/* Debug panel */}
              {showDebugInfo && selectedCoupon?.imageId === "3c7f7206-113c-4de6-3ecd-e7c19f4f8300" && (
                <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
                  <h3 className="text-lg font-medium text-green-800 mb-2">Image Information</h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-green-800">Image ID:</p>
                      <div className="flex items-center mt-1">
                        <code className="bg-white px-2 py-1 rounded text-sm flex-1 overflow-x-auto">
                          {selectedCoupon.imageId}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 h-8 w-8 text-green-600"
                          onClick={() => copyToClipboard(selectedCoupon.imageId)}
                        >
                          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-green-800">Current URL Format:</p>
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          className="bg-white border border-green-200 rounded px-2 py-1 text-sm"
                          value={urlFormat}
                          onChange={(e) => setUrlFormat(e.target.value)}
                        >
                          <option value={URL_FORMATS.PUBLIC}>Public (Working)</option>
                          <option value={URL_FORMATS.DIRECT}>Direct (Working)</option>
                          <option value={URL_FORMATS.DEFAULT}>Default</option>
                          <option value={URL_FORMATS.VARIANT}>Thumbnail</option>
                          <option value={URL_FORMATS.CUSTOM}>Custom</option>
                        </select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            // Force reload with new URL format
                            setImageErrors((prev) => {
                              const newErrors = { ...prev }
                              delete newErrors[selectedCoupon.id]
                              return newErrors
                            })
                          }}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Try Format
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-green-800">Generated URL:</p>
                      <div className="flex items-center mt-1">
                        <code className="bg-white px-2 py-1 rounded text-sm flex-1 overflow-x-auto">
                          {getImageUrlByFormat(selectedCoupon.imageId, urlFormat)}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-2 h-8 w-8 text-green-600"
                          onClick={() => copyToClipboard(getImageUrlByFormat(selectedCoupon.imageId, urlFormat))}
                        >
                          {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getImageUrlByFormat(selectedCoupon.imageId, urlFormat), "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Direct URL
                      </Button>

                      <Button variant="outline" size="sm" onClick={checkImageDimensions}>
                        Check Dimensions
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Force reload image
                          setImageErrors({})
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reload All Images
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative w-full" style={{ minHeight: "200px" }}>
                {imageErrors[selectedCoupon.id] ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                    <ImageOff className="h-12 w-12 mb-2" />
                    <span className="text-center px-4 mb-3">The coupon image could not be loaded.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryLoadImage(selectedCoupon.id)}
                      className="flex items-center gap-1"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry Loading Image
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                    </div>

                    {/* Container with max-height to ensure large coupons fit */}
                    <div
                      className={`relative ${selectedCoupon.size === "large" ? "max-h-[280px] md:max-h-[380px]" : ""} w-full flex items-center justify-center`}
                    >
                      <Image
                        ref={imageRef}
                        src={getImageUrlByFormat(selectedCoupon.imageId, urlFormat) || "/placeholder.svg"}
                        alt={selectedCoupon.title || "Coupon"}
                        width={800}
                        height={selectedCoupon.size === "large" ? 360 : 600}
                        className={`object-contain max-w-full ${selectedCoupon.size === "large" ? "max-h-[280px] md:max-h-[380px]" : ""} coupon-image`}
                        priority
                        unoptimized
                        onError={() => handleImageError(selectedCoupon.id)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-center gap-2 mt-4 pb-2">
                <Button variant="outline" size="sm" onClick={handleViewTerms} className="coupon-action-button">
                  <Info className="mr-2 h-4 w-4" />
                  Terms & Conditions
                </Button>

                {!imageErrors[selectedCoupon.id] && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isMobile ? downloadCoupon : printCoupon}
                    disabled={isDownloading}
                    className="coupon-action-button"
                  >
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : isMobile ? (
                      <Download className="mr-2 h-4 w-4" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    {isMobile ? "Download Coupon" : "Print Coupon"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Size Image Dialog (for large coupons) */}
      <Dialog open={showFullSizeImage} onOpenChange={setShowFullSizeImage}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-1 overflow-auto">
          <div className="relative w-full">
            {/* Custom close button that matches photo album style */}
            <div className="absolute top-2 right-2 z-10">
              <DialogClose
                className="rounded-full p-1.5 bg-white hover:bg-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                onClick={() => {
                  setShowFullSizeImage(false)
                  setShowFullImage(true)
                }}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          </div>

          {selectedCoupon?.imageUrl && (
            <div className="relative w-full flex items-center justify-center p-2">
              <Image
                src={getImageUrlByFormat(selectedCoupon.imageId, urlFormat) || "/placeholder.svg"}
                alt={selectedCoupon.title || "Coupon"}
                width={1200}
                height={800}
                className="object-contain max-w-full max-h-[85vh]"
                priority
                unoptimized
                onError={() => handleImageError(selectedCoupon.id)}
              />
            </div>
          )}

          <div className="flex justify-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={isMobile ? downloadCoupon : printCoupon}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isMobile ? "Download Coupon" : "Print Coupon"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowFullSizeImage(false)
                setShowFullImage(true)
              }}
            >
              <X className="mr-2 h-4 w-4" />
            </Button>
          </div>
          <div
            className="text-sm whitespace-pre-wrap text-sm-content"
            dangerouslySetInnerHTML={{
              __html: formatTermsWithBoldHeadings(globalTerms),
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
