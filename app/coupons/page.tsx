"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Trash2, CheckCircle, Save, FileText, AlertTriangle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { saveBusinessCoupons, getBusinessCoupons, type Coupon } from "@/app/actions/coupon-actions"
import { getCurrentBusiness } from "@/app/actions/business-actions"
import { saveCouponTerms } from "@/app/actions/coupon-image-actions"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import html2canvas from "html2canvas"

// Add this import at the top with the other imports
import { useEffect as useEffectOriginal } from "react"

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

export default function CouponsPage() {
  const router = useRouter()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  // Find the line where coupons state is defined and add this new state below it
  const [couponDimensions, setCouponDimensions] = useState<{ [key: string]: { width: number; height: number } }>({})
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [termsText, setTermsText] = useState("")
  const [savingTerms, setSavingTerms] = useState(false)
  const [loading, setLoading] = useState(true)
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [couponCount, setCouponCount] = useState(0)
  const [savingImages, setSavingImages] = useState(false)
  const [savedImageCount, setSavedImageCount] = useState(0)
  const [deletingCoupon, setDeletingCoupon] = useState<string | null>(null)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null)
  // Track which coupons have been updated vs newly created
  const [updatedCoupons, setUpdatedCoupons] = useState<Set<string>>(new Set())

  // Refs for coupon elements
  const smallCouponRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const largeCouponRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const [formData, setFormData] = useState<Omit<Coupon, "id">>({
    title: "",
    description: "",
    code: "",
    discount: "",
    startDate: new Date().toISOString().split("T")[0],
    expirationDate: "",
    size: "small",
    businessName: "",
    terms: `By redeeming this coupon, you agree to comply with and be bound by the following terms and conditions. Please read these terms carefully before using the coupon.

Eligibility
This coupon is valid only for customers who meet the eligibility criteria specified on the coupon or associated promotional materials.
Must be of legal age in your jurisdiction to redeem the coupon.

Validity Period
The coupon is valid only during the time frame specified upon the coupon itself or within the ad, flyer, or penny saver that it originally appeared.
Coupons presented outside the validity period will not be honored.

Redemption
To redeem the coupon, present it at the time of purchase at participating locations or enter the promo code during online checkout.
The coupon must be surrendered at the time of in-store redemption.

Limitations
One coupon per customer per transaction.
Cannot be combined with other coupons, discounts, or promotional offers.
Applies only to specified products or services as mentioned on the coupon.

Exclusions
The coupon does not apply to the following:
• Gift cards or prepaid cards.
• Taxes, shipping, and handling fees.
• Previous purchases.

Non-Transferability
Coupons are non-transferable and may not be sold, auctioned, or traded.
Any attempt to transfer or sell the coupon voids it.

No Cash Value
Coupons have no cash value and cannot be exchanged for cash.
No change or credit will be given on any remaining coupon value.

Modification and Termination
Our company reserves the right to modify or terminate this coupon offer at any time without prior notice.
In the event of any dispute, our company's decision is final.

Fraudulent Use
Any fraudulent or unauthorized use of the coupon is prohibited and may result in cancellation of the coupon without compensation.

Acceptance of Terms
By using this coupon, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.`,
  })

  useEffect(() => {
    async function loadBusinessData() {
      try {
        const business = await getCurrentBusiness()
        if (business) {
          setBusinessId(business.id)
          setBusinessName(business.businessName || "")
          setFormData((prev) => ({ ...prev, businessName: business.businessName || "" }))
        } else {
          toast({
            title: "Not logged in",
            description: "Please log in as a business to manage coupons",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error loading business data:", error)
      } finally {
        loadCoupons()
      }
    }

    loadBusinessData()
  }, [])

  useEffect(() => {
    // When a coupon is selected, update the terms text
    if (selectedCoupon) {
      setTermsText(selectedCoupon.terms)
    } else {
      setTermsText("")
    }
  }, [selectedCoupon])

  // Add this useEffect after the other useEffect hooks
  useEffectOriginal(() => {
    // Function to measure and log dimensions
    const measureCoupons = () => {
      const newDimensions: { [key: string]: { width: number; height: number } } = {}

      // Measure small coupons
      Object.entries(smallCouponRefs.current).forEach(([id, element]) => {
        if (element) {
          const width = element.offsetWidth
          const height = element.offsetHeight
          console.log(`Small coupon ${id} dimensions:`, { width, height })
          newDimensions[id] = { width, height }
        }
      })

      // Measure large coupons
      Object.entries(largeCouponRefs.current).forEach(([id, element]) => {
        if (element) {
          const width = element.offsetWidth
          const height = element.offsetHeight
          console.log(`Large coupon ${id} dimensions:`, { width, height })
          newDimensions[id] = { width, height }
        }
      })

      setCouponDimensions(newDimensions)
    }

    // Wait a bit for the DOM to fully render
    const timer = setTimeout(measureCoupons, 500)

    // Also measure on window resize
    window.addEventListener("resize", measureCoupons)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("resize", measureCoupons)
    }
  }, [coupons])

  async function loadCoupons() {
    setLoading(true)
    try {
      const result = await getBusinessCoupons()
      if (result.success && result.coupons) {
        setCoupons(result.coupons)
        // Mark all loaded coupons as "updated" since they already exist in the database
        const existingIds = new Set(result.coupons.map((coupon) => coupon.id))
        setUpdatedCoupons(existingIds)
      } else if (result.error) {
        console.error("Error loading coupons:", result.error)
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading coupons:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTermsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTermsText(e.target.value)
  }

  const handleSizeChange = (value: "small" | "large") => {
    setFormData((prev) => ({ ...prev, size: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newCouponId = Date.now().toString()
    setCoupons((prev) => [...prev, { ...formData, id: newCouponId }])
    // Reset form fields except for business name and terms
    setFormData((prev) => ({
      ...prev,
      title: "",
      description: "",
      code: "",
      discount: "",
      startDate: new Date().toISOString().split("T")[0],
      expirationDate: "",
    }))
  }

  const confirmDeleteCoupon = (id: string) => {
    setCouponToDelete(id)
    setShowDeleteConfirmDialog(true)
  }

  const deleteCoupon = async (id: string) => {
    if (!businessId) {
      toast({
        title: "Error",
        description: "No business ID found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    setDeletingCoupon(id)
    setShowDeleteConfirmDialog(false)

    try {
      // First, try to delete the image from Cloudflare
      const imageResponse = await fetch("/api/cloudflare-images/delete-coupon-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          couponId: id,
        }),
      })

      if (!imageResponse.ok) {
        console.warn(`Warning: Failed to delete coupon image: ${imageResponse.statusText}`)
        // Continue with coupon deletion even if image deletion fails
      }

      // Now delete the coupon from Redis
      const response = await fetch("/api/coupons/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          couponId: id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete coupon from database")
      }

      // Update the local state
      if (selectedCoupon?.id === id) {
        setSelectedCoupon(null)
      }
      setCoupons((prev) => prev.filter((coupon) => coupon.id !== id))

      // Remove from updatedCoupons set if it exists
      if (updatedCoupons.has(id)) {
        const newUpdatedCoupons = new Set(updatedCoupons)
        newUpdatedCoupons.delete(id)
        setUpdatedCoupons(newUpdatedCoupons)
      }

      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting coupon:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete coupon. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeletingCoupon(null)
      setCouponToDelete(null)
    }
  }

  // Function to format date from YYYY-MM-DD to MM/DD/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split("-")
    return `${month}/${day}/${year}`
  }

  // Simplified generateAndSaveCouponImage function to fix the iframe error
  const generateAndSaveCouponImage = async (coupon: Coupon) => {
    try {
      // Get the coupon element reference
      const couponRef =
        coupon.size === "small" ? smallCouponRefs.current[coupon.id] : largeCouponRefs.current[coupon.id]

      if (!couponRef || !businessId) {
        console.error("Missing coupon reference or business ID")
        return false
      }

      // Create a wrapper div to ensure borders are captured
      const wrapper = document.createElement("div")
      wrapper.style.display = "inline-block"
      wrapper.style.position = "absolute"
      wrapper.style.left = "-9999px"
      wrapper.style.top = "-9999px"

      // Clone the coupon element
      const clone = couponRef.cloneNode(true) as HTMLElement

      // Ensure the clone has the same styling
      clone.style.margin = "8px" // Add a small margin to ensure border is visible
      clone.style.boxSizing = "border-box"
      clone.style.display = "block"
      clone.style.width = `${couponRef.offsetWidth}px`
      clone.style.height = `${couponRef.offsetHeight}px`

      // Add the clone to the wrapper
      wrapper.appendChild(clone)
      document.body.appendChild(wrapper)

      // Use html2canvas with simplified settings
      const canvas = await html2canvas(clone, {
        scale: 2, // Higher scale for better quality
        backgroundColor: "#FFFFFF",
        logging: false,
        useCORS: true,
        allowTaint: true,
      })

      // Remove the temporary elements
      document.body.removeChild(wrapper)

      // Convert canvas to base64 image
      const imageBase64 = canvas.toDataURL("image/png")

      // Send to API to save
      const response = await fetch("/api/coupons/save-as-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coupon,
          businessId,
          imageBase64,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API error (${response.status}): ${errorText}`)
        return false
      }

      const result = await response.json()

      // If this was an update rather than a new creation, add to updatedCoupons set
      if (result.success && result.updated) {
        setUpdatedCoupons((prev) => new Set(prev).add(coupon.id))
      }

      return result.success
    } catch (error) {
      console.error("Error generating coupon image:", error)
      return false
    }
  }

  // Update the saveAllCouponImages function to handle errors better
  const saveAllCouponImages = async () => {
    if (!businessId || coupons.length === 0) return

    setSavingImages(true)
    setSavedImageCount(0)

    let successCount = 0
    let errorCount = 0
    let updatedCount = 0
    let newCount = 0

    for (const coupon of coupons) {
      try {
        const success = await generateAndSaveCouponImage(coupon)
        if (success) {
          successCount++
          setSavedImageCount(successCount)

          // Track if this was an update or new creation
          if (updatedCoupons.has(coupon.id)) {
            updatedCount++
          } else {
            newCount++
            // Add to updated coupons for future reference
            setUpdatedCoupons((prev) => new Set(prev).add(coupon.id))
          }
        } else {
          errorCount++
          console.error(`Failed to save image for coupon: ${coupon.id}`)
        }
      } catch (error) {
        errorCount++
        console.error(`Error processing coupon ${coupon.id}:`, error)
      }
    }

    setSavingImages(false)

    if (errorCount > 0) {
      toast({
        title: "Warning",
        description: `${successCount} coupons saved, but ${errorCount} failed. Please try again.`,
        variant: "warning",
      })
    } else if (updatedCount > 0) {
      toast({
        title: "Success",
        description: `${newCount} new coupons created and ${updatedCount} existing coupons updated.`,
      })
    }

    return successCount === coupons.length
  }

  // Function to save terms and conditions to Redis
  const saveTermsToRedis = async () => {
    if (!selectedCoupon || !businessId) {
      toast({
        title: "Error",
        description: "No coupon selected or business ID not found",
        variant: "destructive",
      })
      return
    }

    setSavingTerms(true)

    try {
      const result = await saveCouponTerms(businessId, selectedCoupon.id, termsText)

      if (result.success) {
        // Update the coupon in the local state
        setCoupons((prev) => prev.map((c) => (c.id === selectedCoupon.id ? { ...c, terms: termsText } : c)))

        // Mark this coupon as updated
        setUpdatedCoupons((prev) => new Set(prev).add(selectedCoupon.id))

        toast({
          title: "Success",
          description: "Terms and conditions saved successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save terms and conditions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving terms:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setSavingTerms(false)
    }
  }

  const handleSaveAllCoupons = async () => {
    if (!businessId) {
      toast({
        title: "Error",
        description: "No business ID found. Please log in again.",
        variant: "destructive",
      })
      return
    }

    try {
      // First save the coupons to Redis (original functionality)
      const result = await saveBusinessCoupons(businessId, coupons)

      if (result.success) {
        // Now save the coupons as images
        const imagesSuccess = await saveAllCouponImages()

        // Set the coupon count for the success message
        setCouponCount(coupons.length)

        // Show the success dialog
        setShowSuccessDialog(true)

        if (!imagesSuccess) {
          toast({
            title: "Warning",
            description: "Some coupon images could not be saved. The coupons are still available.",
            variant: "warning",
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save coupons",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving coupons:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const navigateToAdDesign = () => {
    router.push("/ad-design/customize")
  }

  // Filter coupons by size
  const smallCoupons = coupons.filter((coupon) => coupon.size === "small")
  const largeCoupons = coupons.filter((coupon) => coupon.size === "large")

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <Image
                src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/money-saver-icon-xJgsaAlHhdg5K2XK0YJNmll4BFxSN2.png"
                alt="Penny Saver"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Penny Saver Workbench</h1>
          </div>
          <Link
            href="/workbench5"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Back to Workbench
          </Link>
        </div>

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700">
                <CheckCircle className="h-6 w-6 text-green-500" />
                Coupons Saved Successfully!
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center mb-2">
                {couponCount} {couponCount === 1 ? "coupon has" : "coupons have"} been saved and added to the Savings
                Button on your Ad-Box.
              </p>
              <p className="text-center text-sm text-gray-500">
                Your customers will be able to view and use these coupons when they visit your business page.
              </p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button
                variant="default"
                onClick={() => setShowSuccessDialog(false)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                Confirm Deletion
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this coupon? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirmDialog(false)
                  setCouponToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (couponToDelete) {
                    deleteCoupon(couponToDelete)
                  }
                }}
              >
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Coupon Creator Section */}
            <div className="lg:col-span-5">
              <Card>
                <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                  <CardTitle className="text-teal-700">Create New Coupon</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        placeholder="Your Business Name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Coupon Title</Label>
                      <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Summer Special"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount">Discount Amount</Label>
                      <Input
                        id="discount"
                        name="discount"
                        value={formData.discount}
                        onChange={handleChange}
                        placeholder="e.g., 20% OFF, $10 OFF, etc."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe what the coupon is for"
                        rows={3}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="code">Coupon Code (Optional)</Label>
                      <Input
                        id="code"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="e.g., SUMMER2023"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          name="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="expirationDate">Expiration Date</Label>
                        <Input
                          id="expirationDate"
                          name="expirationDate"
                          type="date"
                          value={formData.expirationDate}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="terms">Default Terms & Conditions</Label>
                      <div className="text-xs text-gray-500 mb-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <button type="button" className="text-teal-600 hover:underline">
                              Preview formatted terms
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Terms & Conditions Preview</DialogTitle>
                            </DialogHeader>
                            <div
                              className="text-sm whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: formatTermsWithBoldHeadings(formData.terms),
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                      <Textarea
                        id="terms"
                        name="terms"
                        value={formData.terms}
                        onChange={handleChange}
                        placeholder="Terms and conditions for the coupon"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Coupon Size</Label>
                      <RadioGroup
                        value={formData.size}
                        onValueChange={(value) => handleSizeChange(value as "small" | "large")}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="small" id="small" />
                          <Label htmlFor="small" className="cursor-pointer">
                            Small
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="large" id="large" />
                          <Label htmlFor="large" className="cursor-pointer">
                            Large
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="pt-4">
                      <Button type="submit" className="w-full">
                        Create Coupon
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Coupon Display Section */}
            <div className="lg:col-span-7">
              <Card className="mb-6">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                  <CardTitle className="text-teal-700">Your Coupons</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {coupons.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No coupons created yet. Use the form to create your first coupon.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Small Coupons (2 per row) */}
                      {smallCoupons.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Small Coupons</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {smallCoupons.map((coupon) => (
                              <div key={coupon.id} className="relative">
                                <div
                                  className={`bg-white border-2 ${
                                    selectedCoupon?.id === coupon.id
                                      ? "border-teal-500"
                                      : "border-dashed border-gray-300"
                                  } rounded-lg p-4 hover:shadow-md transition-shadow`}
                                  ref={(el) => (smallCouponRefs.current[coupon.id] = el)}
                                  onClick={() => setSelectedCoupon(coupon)}
                                  style={{
                                    margin: 0,
                                    display: "inline-block",
                                    boxSizing: "border-box",
                                  }}
                                >
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

                                  <div className="text-xs text-gray-600 mt-2">
                                    Valid: {formatDate(coupon.startDate)} - {formatDate(coupon.expirationDate)}
                                  </div>
                                </div>

                                {/* Status indicator for new/updated coupons */}
                                {updatedCoupons.has(coupon.id) ? (
                                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                                    Saved
                                  </div>
                                ) : (
                                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                                    New
                                  </div>
                                )}

                                {/* Dimensions display */}
                                {couponDimensions[coupon.id] && (
                                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                    {couponDimensions[coupon.id].width} × {couponDimensions[coupon.id].height}px
                                  </div>
                                )}

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8 text-gray-500 hover:text-red-500 bg-white/80 hover:bg-white rounded-full shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    confirmDeleteCoupon(coupon.id)
                                  }}
                                  disabled={deletingCoupon === coupon.id}
                                >
                                  {deletingCoupon === coupon.id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Large Coupons (1 per row) */}
                      {largeCoupons.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Large Coupons</h3>
                          <div className="space-y-4">
                            {largeCoupons.map((coupon) => (
                              <div key={coupon.id} className="relative">
                                <div
                                  className={`bg-white border-2 ${
                                    selectedCoupon?.id === coupon.id
                                      ? "border-teal-500"
                                      : "border-dashed border-gray-300"
                                  } rounded-lg p-6 hover:shadow-md transition-shadow`}
                                  ref={(el) => (largeCouponRefs.current[coupon.id] = el)}
                                  onClick={() => setSelectedCoupon(coupon)}
                                  style={{
                                    margin: 0,
                                    display: "inline-block",
                                    boxSizing: "border-box",
                                  }}
                                >
                                  <div className="flex flex-col md:flex-row md:items-center">
                                    <div className="md:w-1/3 text-center mb-4 md:mb-0">
                                      <h4 className="font-bold text-xl text-teal-700 mb-2">{coupon.businessName}</h4>
                                      <div className="text-3xl font-extrabold text-red-600">{coupon.discount}</div>
                                      <div className="font-bold text-xl mt-1">{coupon.title}</div>
                                    </div>

                                    <div className="md:w-2/3 md:pl-6 md:border-l border-gray-200">
                                      <div className="text-lg mb-3">{coupon.description}</div>

                                      {coupon.code && (
                                        <div className="mb-3">
                                          <span className="inline-block bg-gray-100 px-3 py-1 rounded font-mono">
                                            Code: {coupon.code}
                                          </span>
                                        </div>
                                      )}

                                      <div className="text-sm text-gray-600 mt-4">
                                        Valid: {formatDate(coupon.startDate)} - {formatDate(coupon.expirationDate)}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Status indicator for new/updated coupons */}
                                {updatedCoupons.has(coupon.id) ? (
                                  <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                                    Saved
                                  </div>
                                ) : (
                                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                                    New
                                  </div>
                                )}

                                {/* Dimensions display */}
                                {couponDimensions[coupon.id] && (
                                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                                    {couponDimensions[coupon.id].width} × {couponDimensions[coupon.id].height}px
                                  </div>
                                )}

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 h-8 w-8 text-gray-500 hover:text-red-500 bg-white/80 hover:bg-white rounded-full shadow-sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    confirmDeleteCoupon(coupon.id)
                                  }}
                                  disabled={deletingCoupon === coupon.id}
                                >
                                  {deletingCoupon === coupon.id ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
                                  ) : (
                                    <Trash2 size={16} />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {coupons.length > 0 && (
                    <div className="mt-6 flex flex-col items-center">
                      <Button variant="outline" onClick={handleSaveAllCoupons} disabled={savingImages} className="mb-2">
                        {savingImages ? (
                          <>
                            <span className="mr-2">
                              Saving Images ({savedImageCount}/{coupons.length})
                            </span>
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save All Coupons as Images
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        Click on a coupon to select it and edit its terms and conditions below
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Terms and Conditions Section */}
              <Card>
                <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                  <CardTitle className="flex items-center text-teal-700">
                    <FileText className="mr-2 h-5 w-5" />
                    Terms and Conditions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {selectedCoupon ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">
                          Editing Terms for: <span className="text-teal-600">{selectedCoupon.title}</span>
                        </h3>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              Preview Formatted
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Terms & Conditions Preview</DialogTitle>
                            </DialogHeader>
                            <div
                              className="text-sm whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{
                                __html: formatTermsWithBoldHeadings(termsText),
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>

                      <Textarea
                        value={termsText}
                        onChange={handleTermsChange}
                        placeholder="Enter terms and conditions for this coupon"
                        rows={8}
                      />

                      <div className="flex justify-end">
                        <Button onClick={saveTermsToRedis} disabled={savingTerms}>
                          {savingTerms ? (
                            <>
                              <span className="mr-2">Saving...</span>
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-4 w-4" />
                              Save Terms to Database
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Select a coupon above to edit its terms and conditions</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <MainFooter />
    </div>
  )
}
