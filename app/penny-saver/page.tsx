"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, Search, MapPin, Download, Share2, Calendar, Tag, Sparkles, Loader2, Check } from "lucide-react"
import { ZipCodeDialog } from "@/components/zip-code-dialog"
import { MainFooter } from "@/components/main-footer"
import { getCouponsByZipCode, type Coupon } from "@/app/actions/coupon-actions"
import { getAllBusinessCategories } from "@/app/actions/business-category-actions"
import { toast } from "@/components/ui/use-toast"
import html2canvas from "html2canvas"

// Extended coupon type with businessId
interface ExtendedCoupon extends Coupon {
  businessId: string
  category?: string
}

export default function PennySaverPage() {
  const [zipCode, setZipCode] = useState("")
  const [savedZipCode, setSavedZipCode] = useState("")
  const [isZipDialogOpen, setIsZipDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [coupons, setCoupons] = useState<ExtendedCoupon[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingCouponId, setSavingCouponId] = useState<string | null>(null)
  const [sharingCouponId, setSharingCouponId] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const couponRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // Default categories to use if fetching fails
  const defaultCategories = [
    "Home Improvement",
    "Automotive Services",
    "Elder and Child Care",
    "Pet Care",
    "Weddings & Events",
    "Fitness & Athletics",
    "Education & Tutoring",
    "Music Lessons",
    "Real Estate",
    "Food & Dining",
    "Retail Stores",
    "Legal Services",
    "Funeral Services",
    "Personal Assistants",
    "Travel & Vacation",
    "Tailoring & Clothing",
    "Arts & Entertainment",
    "Tech & IT Services",
    "Beauty & Wellness",
    "Physical Rehabilitation",
    "Healthcare Specialists",
    "Mental Health",
    "Financial Services",
  ]

  // Fetch categories from Redis
  const fetchCategories = async () => {
    setLoadingCategories(true)
    try {
      const fetchedCategories = await getAllBusinessCategories()
      if (fetchedCategories && fetchedCategories.length > 0) {
        setCategories(fetchedCategories)
      } else {
        // Fall back to default categories if none found
        setCategories(defaultCategories)
      }
    } catch (err) {
      console.error("Error fetching categories:", err)
      // Fall back to default categories on error
      setCategories(defaultCategories)
    } finally {
      setLoadingCategories(false)
    }
  }

  useEffect(() => {
    // Fetch categories when component mounts
    fetchCategories()

    // Check for saved zip code
    const savedZip = localStorage.getItem("pennySaverZipCode")
    if (savedZip) {
      setSavedZipCode(savedZip)
      fetchCouponsForZipCode(savedZip)
    }
  }, [])

  const fetchCouponsForZipCode = async (zipCodeValue: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getCouponsByZipCode(zipCodeValue)

      if (result.success) {
        setCoupons(result.coupons)

        // Extract unique categories from coupons to ensure dropdown has all relevant options
        const couponCategories = new Set<string>()
        result.coupons.forEach((coupon) => {
          if (coupon.category) couponCategories.add(coupon.category)
        })

        // If we found categories in coupons that aren't in our list, update the categories
        const newCategories = Array.from(couponCategories)
        if (newCategories.length > 0 && newCategories.some((cat) => !categories.includes(cat))) {
          setCategories((prevCategories) => {
            const updatedCategories = [...new Set([...prevCategories, ...newCategories])]
            return updatedCategories.sort()
          })
        }
      } else {
        setError(result.error || "Failed to fetch coupons")
        setCoupons([])
      }
    } catch (err) {
      console.error("Error fetching coupons:", err)
      setError("An unexpected error occurred while fetching coupons")
      setCoupons([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleZipSubmit = () => {
    if (zipCode) {
      localStorage.setItem("pennySaverZipCode", zipCode)
      setSavedZipCode(zipCode)
      fetchCouponsForZipCode(zipCode)
    } else {
      alert("Please enter a Zip Code.")
    }
  }

  const handleZipDialogSubmit = (zipCodeValue: string) => {
    setZipCode(zipCodeValue)
    localStorage.setItem("pennySaverZipCode", zipCodeValue)
    setSavedZipCode(zipCodeValue)
    fetchCouponsForZipCode(zipCodeValue)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
  }

  // Filter coupons based on selected category
  const filteredCoupons =
    selectedCategory === "all"
      ? coupons
      : coupons.filter((coupon) => {
          // Match by coupon category if available
          return coupon.category === selectedCategory
        })

  // Format date from YYYY-MM-DD to MM/DD/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split("-").map(Number)
    return `${month}/${day}/${year}`
  }

  // Function to handle saving a coupon
  const handleSaveCoupon = async (coupon: ExtendedCoupon) => {
    try {
      setSavingCouponId(coupon.id)

      // Get the coupon element reference
      const couponElement = couponRefs.current[coupon.id]

      if (!couponElement) {
        throw new Error("Could not find coupon element")
      }

      // Use html2canvas to create an image of the coupon
      const canvas = await html2canvas(couponElement, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher quality
        logging: false,
        allowTaint: true,
        useCORS: true,
      })

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              throw new Error("Failed to create image")
            }
          },
          "image/png",
          0.95,
        )
      })

      // Create a download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${coupon.businessName}-${coupon.title.replace(/\s+/g, "-")}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100)

      toast({
        title: "Coupon Saved",
        description: "The coupon has been saved to your device.",
      })
    } catch (error) {
      console.error("Error saving coupon:", error)
      toast({
        title: "Error Saving Coupon",
        description: "There was a problem saving the coupon. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSavingCouponId(null)
    }
  }

  // Function to handle sharing a coupon
  const handleShareCoupon = async (coupon: ExtendedCoupon) => {
    try {
      setSharingCouponId(coupon.id)

      // Prepare share data
      const shareData = {
        title: `${coupon.businessName} - ${coupon.title}`,
        text: `${coupon.discount} off at ${coupon.businessName}! ${coupon.description} ${coupon.code ? `Use code: ${coupon.code}` : ""} Valid until: ${formatDate(coupon.expirationDate)}`,
        url: window.location.href,
      }

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
        toast({
          title: "Coupon Shared",
          description: "The coupon has been shared successfully.",
        })
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(
          `${coupon.businessName} - ${coupon.title}\n${coupon.discount}\n${coupon.description}\n${coupon.code ? `Code: ${coupon.code}` : ""}\nValid until: ${formatDate(coupon.expirationDate)}`,
        )
        toast({
          title: "Coupon Details Copied",
          description: "Coupon details have been copied to your clipboard.",
        })
      }
    } catch (error) {
      console.error("Error sharing coupon:", error)

      // Try clipboard as fallback if sharing fails
      try {
        await navigator.clipboard.writeText(
          `${coupon.businessName} - ${coupon.title}\n${coupon.discount}\n${coupon.description}\n${coupon.code ? `Code: ${coupon.code}` : ""}\nValid until: ${formatDate(coupon.expirationDate)}`,
        )
        toast({
          title: "Coupon Details Copied",
          description: "Coupon details have been copied to your clipboard.",
        })
      } catch (clipboardError) {
        toast({
          title: "Error Sharing Coupon",
          description: "There was a problem sharing the coupon. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setSharingCouponId(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/" className="flex items-center text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Hero Section with Festive Design */}
        <div className="relative overflow-hidden rounded-xl mb-10 bg-gradient-to-r from-amber-100 to-yellow-100">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: "url('/texture0079.png')",
              backgroundRepeat: "repeat",
              mixBlendMode: "multiply",
            }}
          ></div>
          <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="relative w-48 h-48 md:w-64 md:h-64">
                  <Image
                    src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/simple%20moneysaver-ZitT1iEylHQVkNDQsMM4jf6eqrNHxN.png"
                    alt="Penny Saver"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-amber-800">This Week's Penny Saver</h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto text-amber-700">
                Exclusive deals and discounts from local businesses in your area
              </p>
            </div>
          </div>
        </div>

        {/* Zip Code Search Section */}
        <div className="max-w-xl mx-auto mb-10 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">Find Local Deals by Zip Code</h2>
            {savedZipCode && (
              <div className="mb-4 flex items-center text-primary font-medium">
                <MapPin className="mr-2 h-5 w-5" />
                <span>You are viewing deals in area code: {savedZipCode}</span>
              </div>
            )}

            <div className="w-full flex space-x-2 items-center">
              <div className="flex-grow">
                <Input
                  type="text"
                  placeholder="Enter your zip code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button onClick={handleZipSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>

            {/* Category Dropdown - Only shows after zip code is entered */}
            {savedZipCode && (
              <div className="w-full mt-4">
                <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Category
                </label>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full" disabled={loadingCategories}>
                    <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select a category"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Festive Coupon Display Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-amber-800 inline-flex items-center">
              <Sparkles className="h-6 w-6 mr-2 text-amber-500" />
              Featured Deals
              <Sparkles className="h-6 w-6 ml-2 text-amber-500" />
            </h2>
            {selectedCategory !== "all" && <p className="text-amber-700 mt-2">Showing deals for: {selectedCategory}</p>}
          </div>

          {/* Decorative Festive Border Container */}
          <div className="relative p-1 md:p-3 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 rounded-lg shadow-lg">
            {/* Decorative Corner Elements */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg"></div>

            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1/2">
              <div className="bg-white rounded-full p-2 shadow-md">
                <Tag className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
              <div className="bg-white rounded-full p-2 shadow-md">
                <Tag className="h-6 w-6 text-amber-500" />
              </div>
            </div>

            {/* Inner Content Area with Pattern Background */}
            <div className="bg-white rounded-lg p-6 relative">
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: "url('/texture0079.png')",
                  backgroundRepeat: "repeat",
                }}
              ></div>

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-12 relative z-10">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-500" />
                  <p className="text-gray-500 text-lg">Loading coupons for your area...</p>
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="text-center py-12 relative z-10">
                  <p className="text-red-500 text-lg mb-2">Error: {error}</p>
                  <p className="text-gray-500">Please try again or try a different zip code.</p>
                </div>
              )}

              {/* No Coupons State */}
              {!isLoading && !error && filteredCoupons.length === 0 && coupons.length === 0 && (
                <div className="text-center py-12 relative z-10">
                  <p className="text-gray-500 text-lg mb-4">No coupons are currently available in your area.</p>
                  <p className="text-gray-400">Please check back soon for new deals from local businesses!</p>
                </div>
              )}

              {/* No Coupons in Selected Category */}
              {!isLoading && !error && filteredCoupons.length === 0 && coupons.length > 0 && (
                <div className="text-center py-12 relative z-10">
                  <p className="text-gray-500 text-lg mb-4">No coupons found in the "{selectedCategory}" category.</p>
                  <p className="text-gray-400">Try selecting a different category or view all coupons.</p>
                  <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setSelectedCategory("all")}>
                    View All Coupons
                  </Button>
                </div>
              )}

              {/* Coupon Grid */}
              {!isLoading && !error && filteredCoupons.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  {filteredCoupons.map((coupon) => (
                    <div key={coupon.id} className="relative">
                      <div
                        ref={(el) => (couponRefs.current[coupon.id] = el)}
                        className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full border border-amber-300 shadow-sm">
                            {coupon.category || "General"}
                          </div>
                        </div>

                        <div className="text-center mb-2">
                          <h4 className="font-bold text-lg text-teal-700">{coupon.businessName}</h4>
                        </div>

                        <div className="text-center mb-3">
                          <div className="font-bold text-xl">{coupon.title}</div>
                          <div className="text-2xl font-extrabold text-red-600">{coupon.discount}</div>
                        </div>

                        <div className="text-sm mb-3">{coupon.description}</div>

                        {coupon.code && (
                          <div className="text-center mb-2">
                            <span className="inline-block bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                              Code: {coupon.code}
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-gray-600 mt-2 font-semibold flex items-center justify-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Expires: {formatDate(coupon.expirationDate)}
                        </div>

                        <div className="flex justify-between mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center bg-transparent"
                            onClick={() => handleSaveCoupon(coupon)}
                            disabled={savingCouponId === coupon.id}
                          >
                            {savingCouponId === coupon.id ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="mr-1 h-4 w-4" />
                            )}
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center bg-transparent"
                            onClick={() => handleShareCoupon(coupon)}
                            disabled={sharingCouponId === coupon.id}
                          >
                            {sharingCouponId === coupon.id ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : sharingCouponId === `${coupon.id}-done` ? (
                              <Check className="mr-1 h-4 w-4" />
                            ) : (
                              <Share2 className="mr-1 h-4 w-4" />
                            )}
                            Share
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-amber-50 rounded-lg p-6 mb-12 border border-amber-200">
          <h2 className="text-2xl font-bold mb-4 text-amber-800">About The Penny Saver</h2>
          <p className="text-gray-700 mb-4">
            The Penny Saver is your weekly guide to the best deals and discounts from local businesses in your area.
            Save money on services, restaurants, retail shops, and more with exclusive offers only available through
            Hausbaum.
          </p>
          <p className="text-gray-700">
            New deals are added every week, so check back regularly to find the latest savings opportunities near you!
          </p>
        </div>
      </main>

      <MainFooter />

      {/* Zip Code Dialog */}
      <ZipCodeDialog
        isOpen={isZipDialogOpen}
        onClose={() => setIsZipDialogOpen(false)}
        onSubmit={handleZipDialogSubmit}
      />
    </div>
  )
}
