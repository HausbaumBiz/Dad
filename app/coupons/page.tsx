"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import type React from "react"

import { useState } from "react"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// Define the Coupon interface
interface Coupon {
  id: string
  title: string
  description: string
  code: string
  discount: string
  startDate: string
  expirationDate: string
  size: "small" | "large"
  businessName: string
  terms: string
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

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [openDialogId, setOpenDialogId] = useState<string | null>(null)

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSizeChange = (value: "small" | "large") => {
    setFormData((prev) => ({ ...prev, size: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCoupons((prev) => [...prev, { ...formData, id: Date.now().toString() }])
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

  const deleteCoupon = (id: string) => {
    setCoupons((prev) => prev.filter((coupon) => coupon.id !== id))
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
                    <Label htmlFor="terms">Terms & Conditions</Label>
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
            <Card>
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
                            <div
                              key={coupon.id}
                              className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 text-gray-500 hover:text-red-500"
                                onClick={() => deleteCoupon(coupon.id)}
                              >
                                <Trash2 size={16} />
                              </Button>

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

                              <div className="text-xs text-gray-500 mt-1">
                                <button
                                  className="text-teal-600 hover:underline"
                                  onClick={() => setOpenDialogId(coupon.id)}
                                >
                                  Terms & Conditions
                                </button>

                                <Dialog
                                  open={openDialogId === coupon.id}
                                  onOpenChange={(open) => {
                                    if (!open) setOpenDialogId(null)
                                  }}
                                >
                                  <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Terms & Conditions</DialogTitle>
                                    </DialogHeader>
                                    <div
                                      className="text-sm whitespace-pre-wrap"
                                      dangerouslySetInnerHTML={{
                                        __html: formatTermsWithBoldHeadings(coupon.terms),
                                      }}
                                    />
                                  </DialogContent>
                                </Dialog>
                              </div>
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
                            <div
                              key={coupon.id}
                              className="relative bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 hover:shadow-md transition-shadow"
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 text-gray-500 hover:text-red-500"
                                onClick={() => deleteCoupon(coupon.id)}
                              >
                                <Trash2 size={16} />
                              </Button>

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

                                  <div className="text-sm text-gray-500 mt-1">
                                    <button
                                      className="text-teal-600 hover:underline"
                                      onClick={() => setOpenDialogId(coupon.id)}
                                    >
                                      Terms & Conditions
                                    </button>

                                    <Dialog
                                      open={openDialogId === coupon.id}
                                      onOpenChange={(open) => {
                                        if (!open) setOpenDialogId(null)
                                      }}
                                    >
                                      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle>Terms & Conditions</DialogTitle>
                                        </DialogHeader>
                                        <div
                                          className="text-sm whitespace-pre-wrap"
                                          dangerouslySetInnerHTML={{
                                            __html: formatTermsWithBoldHeadings(coupon.terms),
                                          }}
                                        />
                                      </DialogContent>
                                    </Dialog>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {coupons.length > 0 && (
                  <div className="mt-6 flex justify-center">
                    <Button variant="outline">Print All Coupons</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <MainFooter />
    </div>
  )
}
