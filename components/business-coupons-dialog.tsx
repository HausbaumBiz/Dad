"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, X, Printer, Search, Info, ChevronRight, ChevronLeft } from "lucide-react"
import { getCouponsByBusinessId } from "@/app/actions/coupon-actions"
import { CloudflareImage } from "@/components/cloudflare-image"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface BusinessCouponsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  businessId: string
  businessName: string
}

export function BusinessCouponsDialog({ isOpen, onOpenChange, businessId, businessName }: BusinessCouponsDialogProps) {
  const [loading, setLoading] = useState(true)
  const [coupons, setCoupons] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"coupons" | "terms">("coupons")
  const [searchTerm, setSearchTerm] = useState("")
  const [termsVersion, setTermsVersion] = useState("1.0")
  const [termsLastUpdated, setTermsLastUpdated] = useState("January 1, 2023")

  // Toggle between coupons and terms
  const toggleView = () => {
    setActiveTab(activeTab === "coupons" ? "terms" : "coupons")
  }

  useEffect(() => {
    if (isOpen && businessId) {
      loadCoupons()
    }
  }, [isOpen, businessId])

  const loadCoupons = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await getCouponsByBusinessId(businessId)

      if (result && Array.isArray(result)) {
        setCoupons(result)
      } else {
        setCoupons([])
      }
    } catch (err) {
      console.error("Error loading coupons:", err)
      setError("Failed to load coupons")
    } finally {
      setLoading(false)
    }
  }

  const handlePrintTerms = () => {
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Terms & Conditions - ${businessName}</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 20px; }
              h2 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
              p { margin-bottom: 16px; }
              .version-info { color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <h1>Terms & Conditions - ${businessName}</h1>
            <p>Version ${termsVersion} - Last updated: ${termsLastUpdated}</p>
            
            <h2>1. Coupon Usage</h2>
            <p>Coupons are valid only at participating locations. Coupons cannot be combined with any other offers or promotions. Limit one coupon per customer per visit unless otherwise specified.</p>
            
            <h2>2. Expiration</h2>
            <p>All coupons have an expiration date clearly marked. Expired coupons will not be accepted.</p>
            
            <h2>3. Restrictions</h2>
            <p>Some coupons may have additional restrictions as noted on the coupon itself. Management reserves the right to modify or cancel promotions at any time.</p>
            
            <h2>4. Redemption</h2>
            <p>To redeem a coupon, present it to the cashier at the time of purchase. Digital coupons must be shown on a mobile device or printed.</p>
            
            <h2>5. Cash Value</h2>
            <p>Coupons have no cash value and cannot be exchanged for cash.</p>
            
            <div class="version-info">
              <p>Terms & Conditions Version: ${termsVersion}<br>Last Updated: ${termsLastUpdated}</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const filteredTerms = (searchTerm: string) => {
    if (!searchTerm.trim()) return null

    const terms = ["Coupon Usage", "Expiration", "Restrictions", "Redemption", "Cash Value"]

    const matchedTerms = terms.filter((term) => term.toLowerCase().includes(searchTerm.toLowerCase()))

    if (matchedTerms.length === 0) return "No matching terms found"

    return (
      <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-2">
        <p className="font-medium text-sm">Search results:</p>
        <ul className="list-disc pl-5 mt-1">
          {matchedTerms.map((term, i) => (
            <li key={i} className="text-sm">
              {term}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b coupon-dialog-header">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="dialog-title">
              {businessName} - {activeTab === "coupons" ? "Coupons" : "Terms & Conditions"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0 rounded-full dialog-close-button"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4">
          {/* Toggle button */}
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleView}
              className="flex items-center gap-1 transition-all duration-300 ease-in-out"
            >
              {activeTab === "coupons" ? (
                <>
                  <Info className="h-4 w-4" />
                  <span>View Terms & Conditions</span>
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  <span>Back to Coupons</span>
                </>
              )}
            </Button>
          </div>

          {activeTab === "coupons" ? (
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading coupons...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>{error}</p>
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No coupons available for this business.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="border rounded-lg overflow-hidden shadow-sm">
                      {coupon.cloudflareImageId && (
                        <div className="relative aspect-[2/1] w-full">
                          <CloudflareImage
                            imageId={coupon.cloudflareImageId}
                            alt={coupon.title || "Coupon image"}
                            className="object-cover"
                            fill
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="text-lg font-semibold">{coupon.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>

                        {coupon.expirationDate && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              Expires: {new Date(coupon.expirationDate).toLocaleDateString()}
                            </Badge>
                          </div>
                        )}

                        {coupon.phoneNumber && (
                          <div className="mt-3">
                            <button
                              onClick={() => window.open(`tel:${coupon.phoneNumber.replace(/\D/g, "")}`)}
                              className="text-sm text-blue-600 flex items-center hover:underline active:text-blue-800 cursor-pointer z-20 relative p-2 -m-2"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              {coupon.phoneNumber}
                            </button>
                          </div>
                        )}

                        {coupon.address && (
                          <div className="mt-2">
                            <button
                              onClick={() =>
                                window.open(
                                  `https://maps.google.com/?q=${encodeURIComponent(coupon.address)}`,
                                  "_blank",
                                )
                              }
                              className="text-sm text-blue-600 flex items-center hover:underline active:text-blue-800 cursor-pointer z-20 relative p-2 -m-2"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="line-clamp-2">{coupon.address}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Terms & Conditions content */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Input
                    type="text"
                    placeholder="Search terms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-48 h-8 text-sm"
                  />
                  <Search className="h-4 w-4 text-gray-400 -ml-8" />
                </div>
                <Button variant="outline" size="sm" onClick={handlePrintTerms} className="flex items-center gap-1">
                  <Printer className="h-4 w-4" />
                  <span>Print</span>
                </Button>
              </div>

              {filteredTerms(searchTerm)}

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="font-semibold mb-2">1. Coupon Usage</h3>
                <p className="text-sm mb-3">
                  Coupons are valid only at participating locations. Coupons cannot be combined with any other offers or
                  promotions. Limit one coupon per customer per visit unless otherwise specified.
                </p>

                <h3 className="font-semibold mb-2">2. Expiration</h3>
                <p className="text-sm mb-3">
                  All coupons have an expiration date clearly marked. Expired coupons will not be accepted.
                </p>

                <h3 className="font-semibold mb-2">3. Restrictions</h3>
                <p className="text-sm mb-3">
                  Some coupons may have additional restrictions as noted on the coupon itself. Management reserves the
                  right to modify or cancel promotions at any time.
                </p>

                <h3 className="font-semibold mb-2">4. Redemption</h3>
                <p className="text-sm mb-3">
                  To redeem a coupon, present it to the cashier at the time of purchase. Digital coupons must be shown
                  on a mobile device or printed.
                </p>

                <h3 className="font-semibold mb-2">5. Cash Value</h3>
                <p className="text-sm mb-3">Coupons have no cash value and cannot be exchanged for cash.</p>

                <div className="text-xs text-gray-500 mt-4 pt-2 border-t border-gray-200">
                  <p>Terms & Conditions Version: {termsVersion}</p>
                  <p>Last Updated: {termsLastUpdated}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BusinessCouponsDialog
