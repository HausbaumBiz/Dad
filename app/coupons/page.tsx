"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { saveGlobalCouponTerms, getGlobalCouponTerms } from "@/app/actions/coupon-image-actions"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import html2canvas from "html2canvas"
import { X } from "lucide-react"

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
  const [globalTerms, setGlobalTerms] = useState("")
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
  const [showTermsDialog, setShowTermsDialog] = useState(false)
  // Track which coupons have been updated vs newly created
  const [updatedCoupons, setUpdatedCoupons] = useState<Set<string>>(new Set())

  // Refs for coupon elements
  const smallCouponRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const defaultTerms = `By redeeming this coupon, you agree to comply with and be bound by the following terms and conditions. Please read these terms carefully before using the coupon.

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
By using this coupon, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions.`

  // Find the form data state initialization and update it to always use "small" size
  const [formData, setFormData] = useState<Omit<Coupon, "id" | "terms">>({
    title: "",
    description: "",
    code: "",
    discount: "",
    startDate: new Date().toISOString().split("T")[0],
    expirationDate: "",
    size: "small", // Always set to "small"
    businessName: "",
  })

  useEffect(() => {
    async function loadBusinessData() {
      try {
        const business = await getCurrentBusiness()
        if (business) {
          setBusinessId(business.id)
          setBusinessName(business.businessName || "")
          setFormData((prev) => ({ ...prev, businessName: business.businessName || "" }))

          // Load global terms
          const termsResult = await getGlobalCouponTerms(business.id)
          if (termsResult.success && termsResult.terms) {
            setGlobalTerms(termsResult.terms)
          } else {
            setGlobalTerms(defaultTerms)
          }
        } else {
          toast({
            title: "Not logged in",
            description: "Please log in as a business to manage coupons",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error loading business data:", error)
        setGlobalTerms(defaultTerms)
      } finally {
        loadCoupons()
      }
    }

    loadBusinessData()
  }, [])

  useEffect(() => {
    // When a coupon is selected, update the terms text
    // if (selectedCoupon) {
    //   setTermsText(selectedCoupon.terms)
    // } else {
    //   setTermsText("")
    // }
  }, [])

  // Add this useEffect after the other useEffect hooks
  useEffect(() => {
    // Function to measure and log dimensions
    const measureCoupons = () => {
      const newDimensions: { [key: string]: { width: number; height: number } } = {}

      // Measure small coupons
      Object.entries(smallCouponRefs.current).forEach(([id, element]) => {
        if (element) {
          const width = element.offsetWidth
          const height = element.offsetHeight
          newDimensions[id] = { width, height }
        }
      })

      setCouponDimensions(newDimensions)
    }

    // Wait longer for the DOM to fully render
    const timer = setTimeout(measureCoupons, 1000)

    // Also run it again after a longer delay to catch any late renders
    const secondTimer = setTimeout(measureCoupons, 2000)

    // Also measure on window resize
    window.addEventListener("resize", measureCoupons)

    return () => {
      clearTimeout(timer)
      clearTimeout(secondTimer)
      window.removeEventListener("resize", measureCoupons)
    }
  }, [coupons])

  async function loadCoupons() {
    setLoading(true)
    try {
      const result = await getBusinessCoupons()
      if (result.success && result.coupons) {
        // Remove terms from coupons and convert any large coupons to small
        const processedCoupons = result.coupons.map(({ terms, ...rest }) => ({
          ...rest,
          size: "small", // Force all coupons to be small
        }))
        setCoupons(processedCoupons)

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
    setGlobalTerms(e.target.value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newCouponId = Date.now().toString()
    setCoupons((prev) => [...prev, { ...formData, id: newCouponId }])
    // Reset form fields except for business name
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
      // Ensure we have a business ID
      if (!businessId) {
        console.error("Missing business ID, cannot save coupon image")
        toast({
          title: "Error",
          description: "Business ID not found. Please log in again.",
          variant: "destructive",
        })
        return false
      }

      // Get the coupon element reference
      const couponRef = smallCouponRefs.current[coupon.id]

      // If the coupon reference is missing, we'll create a fallback element
      if (!couponRef) {
        console.warn(`Coupon reference not found for ID: ${coupon.id}, creating fallback element`)

        // Create a fallback coupon element
        const fallbackCoupon = document.createElement("div")
        fallbackCoupon.className = "bg-white border-2 border-dashed border-gray-300 rounded-lg p-4"
        fallbackCoupon.style.width = "300px"
        fallbackCoupon.style.padding = "16px"
        fallbackCoupon.style.boxSizing = "border-box"
        fallbackCoupon.style.position = "relative" // Ensure proper positioning

        // Add business name
        const businessNameEl = document.createElement("h4")
        businessNameEl.className = "font-bold text-lg text-teal-700 text-center mb-2"
        businessNameEl.textContent = coupon.businessName
        fallbackCoupon.appendChild(businessNameEl)

        // Add title
        const titleEl = document.createElement("div")
        titleEl.className = "font-bold text-xl text-center"
        titleEl.textContent = coupon.title
        fallbackCoupon.appendChild(titleEl)

        // Add discount
        const discountEl = document.createElement("div")
        discountEl.className = "text-2xl font-extrabold text-red-600 text-center mb-3"
        discountEl.textContent = coupon.discount
        fallbackCoupon.appendChild(discountEl)

        // Add description
        const descEl = document.createElement("div")
        descEl.className = "text-sm mb-3"
        descEl.textContent = coupon.description
        fallbackCoupon.appendChild(descEl)

        // Add code if present
        if (coupon.code) {
          const codeContainer = document.createElement("div")
          codeContainer.className = "text-center mb-2"

          const codeSpan = document.createElement("span")
          codeSpan.className = "inline-block bg-gray-100 px-2 py-1 rounded font-mono text-sm"
          codeSpan.textContent = `Code: ${coupon.code}`

          codeContainer.appendChild(codeSpan)
          fallbackCoupon.appendChild(codeContainer)
        }

        // Add validity dates - ensure this is visible and properly positioned
        const datesEl = document.createElement("div")
        datesEl.className = "text-xs text-gray-600 mt-2"
        datesEl.textContent = `Valid: ${formatDate(coupon.startDate)} - ${formatDate(coupon.expirationDate)}`
        datesEl.style.position = "relative" // Ensure it's in the flow
        datesEl.style.bottom = "0" // Position at bottom
        datesEl.style.width = "100%" // Full width
        datesEl.style.textAlign = "center" // Center text
        datesEl.style.paddingTop = "8px" // Add some space above
        fallbackCoupon.appendChild(datesEl)

        // Add to document temporarily
        document.body.appendChild(fallbackCoupon)

        // Use the fallback element with improved settings
        const canvas = await html2canvas(fallbackCoupon, {
          scale: 2,
          backgroundColor: "#FFFFFF",
          logging: false,
          useCORS: true,
          allowTaint: true,
          windowHeight: fallbackCoupon.offsetHeight + 50, // Add extra height
          windowWidth: fallbackCoupon.offsetWidth + 50, // Add extra width
          y: 0, // Start from the top
          x: 0, // Start from the left
          scrollY: 0, // No scrolling
          scrollX: 0, // No scrolling
        })

        // Remove the temporary element
        document.body.removeChild(fallbackCoupon)

        // Convert canvas to base64 image
        const imageBase64 = canvas.toDataURL("image/png")

        // Send to API to save
        const response = await fetch("/api/coupons/save-as-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            coupon: { ...coupon, terms: "" },
            businessId,
            imageBase64,
            globalTerms,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API error (${response.status}): ${errorText}`)
          return false
        }

        const result = await response.json()

        if (result.success && result.updated) {
          setUpdatedCoupons((prev) => new Set(prev).add(coupon.id))
        }

        return result.success
      }

      // If we have a valid coupon reference, proceed with the normal flow
      // Create a wrapper div to ensure borders are captured
      const wrapper = document.createElement("div")
      wrapper.style.display = "inline-block"
      wrapper.style.position = "absolute"
      wrapper.style.left = "-9999px"
      wrapper.style.top = "-9999px"
      wrapper.style.padding = "16px" // Add padding to ensure nothing gets cut off

      // Clone the coupon element
      const clone = couponRef.cloneNode(true) as HTMLElement

      // Ensure the clone has the same styling
      clone.style.margin = "8px" // Add a small margin to ensure border is visible
      clone.style.boxSizing = "border-box"
      clone.style.display = "block"
      clone.style.width = `${couponRef.offsetWidth}px`
      clone.style.height = `${couponRef.offsetHeight + 10}px` // Add extra height to ensure date is captured
      clone.style.padding = "8px" // Add padding inside

      // Add the clone to the wrapper
      wrapper.appendChild(clone)
      document.body.appendChild(wrapper)

      // Use html2canvas with improved settings
      const canvas = await html2canvas(clone, {
        scale: 2, // Higher scale for better quality
        backgroundColor: "#FFFFFF",
        logging: false,
        useCORS: true,
        allowTaint: true,
        windowHeight: clone.offsetHeight + 50, // Add extra height
        windowWidth: clone.offsetWidth + 50, // Add extra width
        y: 0, // Start from the top
        x: 0, // Start from the left
        scrollY: 0, // No scrolling
        scrollX: 0, // No scrolling
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
          coupon: { ...coupon, terms: "" }, // Don't send terms with each coupon
          businessId,
          imageBase64,
          globalTerms, // Send global terms instead
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

  // Function to save global terms and conditions to Redis
  const saveTermsToRedis = async () => {
    if (!businessId) {
      toast({
        title: "Error",
        description: "Business ID not found",
        variant: "destructive",
      })
      return
    }

    setSavingTerms(true)

    try {
      const result = await saveGlobalCouponTerms(businessId, globalTerms)

      if (result.success) {
        toast({
          title: "Success",
          description: "Global terms and conditions saved successfully",
        })
        setShowTermsDialog(false)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save global terms and conditions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving global terms:", error)
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
      // First save the global terms
      await saveGlobalCouponTerms(businessId, globalTerms)

      // Then save the coupons to Redis (without terms)
      const couponsWithoutTerms = coupons.map(({ terms, ...rest }) => ({
        ...rest,
        terms: "", // Empty terms since we're using global terms
      }))

      const result = await saveBusinessCoupons(businessId, couponsWithoutTerms)

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

        {/* Terms and Conditions Dialog */}
        <Dialog open={showTermsDialog} onOpenChange={setShowTermsDialog}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Global Terms & Conditions</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTermsDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                These terms and conditions will apply to all coupons. Any updates will replace the previous version.
              </p>
              <Textarea
                value={globalTerms}
                onChange={handleTermsChange}
                placeholder="Enter global terms and conditions for all coupons"
                rows={12}
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
                      Save Global Terms
                    </>
                  )}
                </Button>
              </div>
            </div>
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
                <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b flex justify-between items-center">
                  <CardTitle className="text-teal-700">Your Coupons</CardTitle>
                  <Button variant="outline" onClick={() => setShowTermsDialog(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Edit Global Terms
                  </Button>
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
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {smallCoupons.map((coupon) => (
                              <div key={coupon.id} className="relative">
                                <div
                                  className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                                  ref={(el) => (smallCouponRefs.current[coupon.id] = el)}
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

                                  <div className="text-xs text-gray-600 mt-2 font-semibold">
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
                            Save All Coupons
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 text-center">
                        All coupons will use the same global terms and conditions
                      </p>
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
