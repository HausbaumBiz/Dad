"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCouponIds, getCouponMetadata, getCouponTerms, getCouponImageId } from "@/app/actions/coupon-image-actions"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"
import Image from "next/image"
import { Loader2, X, Info, Download, ExternalLink } from "lucide-react"

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
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<any[]>([])
  const [selectedCoupon, setSelectedCoupon] = useState<any | null>(null)
  const [selectedCouponTerms, setSelectedCouponTerms] = useState<string>("")
  const [showTerms, setShowTerms] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && businessId) {
      loadCoupons()
    }
  }, [isOpen, businessId])

  const loadCoupons = async () => {
    setLoading(true)
    setError(null)
    setCoupons([])

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
            const imageUrl = getCloudflareImageUrl(imageIdResult.imageId)
            console.log(`Image URL for coupon ${couponId}:`, imageUrl)

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

      console.log(`Successfully loaded ${couponData.length} coupons:`, couponData)

      // Sort coupons by expiration date (newest first)
      couponData.sort((a, b) => {
        if (!a.expirationDate || !b.expirationDate) return 0
        const dateA = new Date(a.expirationDate).getTime()
        const dateB = new Date(b.expirationDate).getTime()
        return dateB - dateA
      })

      setCoupons(couponData)
    } catch (error) {
      console.error("Error loading coupons:", error)
      setError("Failed to load coupons")
    } finally {
      setLoading(false)
    }
  }

  const handleCouponClick = async (coupon: any) => {
    setSelectedCoupon(coupon)
    setShowFullImage(true)

    try {
      const termsResult = await getCouponTerms(businessId, coupon.id)
      if (termsResult.success && termsResult.terms) {
        setSelectedCouponTerms(termsResult.terms)
      } else {
        setSelectedCouponTerms("Terms and conditions not available.")
      }
    } catch (error) {
      console.error("Error loading coupon terms:", error)
      setSelectedCouponTerms("Error loading terms and conditions.")
    }
  }

  const handleViewTerms = () => {
    if (selectedCoupon) {
      setShowFullImage(false)
      setShowTerms(true)
    }
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
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
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All Coupons</TabsTrigger>
                <TabsTrigger value="small">Small Coupons</TabsTrigger>
                <TabsTrigger value="large">Large Coupons</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="space-y-6">
                  {smallCoupons.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Small Coupons</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {smallCoupons.map((coupon) => (
                          <div
                            key={coupon.id}
                            className="relative border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleCouponClick(coupon)}
                          >
                            <div className="relative aspect-[4/3] w-full bg-gray-100">
                              {coupon.imageUrl ? (
                                <Image
                                  src={coupon.imageUrl || "/placeholder.svg"}
                                  alt={coupon.title || "Coupon"}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 50vw"
                                  priority
                                  onError={(e) => {
                                    console.error(`Error loading image for coupon ${coupon.id}:`, e)
                                    e.currentTarget.src = "/placeholder.svg?text=Coupon+Image+Not+Available"
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                  Image not available
                                </div>
                              )}
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
                            <div className="relative aspect-[16/9] w-full bg-gray-100">
                              {coupon.imageUrl ? (
                                <Image
                                  src={coupon.imageUrl || "/placeholder.svg"}
                                  alt={coupon.title || "Coupon"}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, 100vw"
                                  priority
                                  onError={(e) => {
                                    console.error(`Error loading image for coupon ${coupon.id}:`, e)
                                    e.currentTarget.src = "/placeholder.svg?text=Coupon+Image+Not+Available"
                                  }}
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                  Image not available
                                </div>
                              )}
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="small" className="mt-4">
                {smallCoupons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No small coupons available.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {smallCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="relative border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleCouponClick(coupon)}
                      >
                        <div className="relative aspect-[4/3] w-full bg-gray-100">
                          {coupon.imageUrl ? (
                            <Image
                              src={coupon.imageUrl || "/placeholder.svg"}
                              alt={coupon.title || "Coupon"}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                              priority
                              onError={(e) => {
                                console.error(`Error loading image for coupon ${coupon.id}:`, e)
                                e.currentTarget.src = "/placeholder.svg?text=Coupon+Image+Not+Available"
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                              Image not available
                            </div>
                          )}
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
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="large" className="mt-4">
                {largeCoupons.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No large coupons available.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {largeCoupons.map((coupon) => (
                      <div
                        key={coupon.id}
                        className="relative border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleCouponClick(coupon)}
                      >
                        <div className="relative aspect-[16/9] w-full bg-gray-100">
                          {coupon.imageUrl ? (
                            <Image
                              src={coupon.imageUrl || "/placeholder.svg"}
                              alt={coupon.title || "Coupon"}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 100vw"
                              priority
                              onError={(e) => {
                                console.error(`Error loading image for coupon ${coupon.id}:`, e)
                                e.currentTarget.src = "/placeholder.svg?text=Coupon+Image+Not+Available"
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                              Image not available
                            </div>
                          )}
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
                      </div>
                    ))}
                  </div>
                )}
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
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 h-8 w-8 bg-white/80 hover:bg-white rounded-full"
              onClick={() => setShowFullImage(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selectedCoupon?.imageUrl && (
            <div className="relative w-full">
              <div className="relative w-full" style={{ minHeight: "300px" }}>
                <Image
                  src={selectedCoupon.imageUrl || "/placeholder.svg"}
                  alt={selectedCoupon.title || "Coupon"}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                  onError={(e) => {
                    console.error(`Error loading image for coupon ${selectedCoupon.id}:`, e)
                    e.currentTarget.src = "/placeholder.svg?text=Coupon+Image+Not+Available"
                  }}
                />
              </div>

              <div className="flex justify-center gap-2 mt-4 pb-2">
                <Button variant="outline" size="sm" onClick={handleViewTerms}>
                  <Info className="mr-2 h-4 w-4" />
                  Terms & Conditions
                </Button>

                <Button variant="outline" size="sm" onClick={printCoupon}>
                  <Download className="mr-2 h-4 w-4" />
                  Print Coupon
                </Button>

                {selectedCoupon.imageUrl && (
                  <Button variant="outline" size="sm" onClick={() => window.open(selectedCoupon.imageUrl, "_blank")}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Full Size
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Terms and Conditions Dialog */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Terms & Conditions</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setShowTerms(false)
                  setShowFullImage(true)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div
            className="text-sm whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: formatTermsWithBoldHeadings(selectedCouponTerms),
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
