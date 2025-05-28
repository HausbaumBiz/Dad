"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Search, MapPin, Download, Share2, Calendar, Tag, Sparkles } from "lucide-react"
import { ZipCodeDialog } from "@/components/zip-code-dialog"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"

export default function PennySaverPage() {
  const [zipCode, setZipCode] = useState("")
  const [savedZipCode, setSavedZipCode] = useState("")
  const [isZipDialogOpen, setIsZipDialogOpen] = useState(false)

  useEffect(() => {
    const savedZip = localStorage.getItem("pennySaverZipCode")
    if (savedZip) {
      setSavedZipCode(savedZip)
    }
  }, [])

  const handleZipSubmit = () => {
    if (zipCode) {
      localStorage.setItem("pennySaverZipCode", zipCode)
      setSavedZipCode(zipCode)
    } else {
      alert("Please enter a Zip Code.")
    }
  }

  const handleZipDialogSubmit = (zipCodeValue: string) => {
    setZipCode(zipCodeValue)
    localStorage.setItem("pennySaverZipCode", zipCodeValue)
    setSavedZipCode(zipCodeValue)
  }

  // Sample deals for demonstration
  const sampleDeals = [
    {
      id: "1",
      businessName: "Joe's Pizza",
      title: "Weekend Special",
      discount: "20% OFF",
      description: "Get 20% off on all large pizzas every weekend. Valid for dine-in and takeout orders.",
      code: "WEEKEND20",
      expires: "2025-06-30",
      category: "Food & Dining",
    },
    {
      id: "2",
      businessName: "Green Thumb Garden Center",
      title: "Spring Planting Sale",
      discount: "Buy 2 Get 1 FREE",
      description: "Buy any two plants and get the third one free of equal or lesser value.",
      code: "PLANT3",
      expires: "2025-05-15",
      category: "Home & Garden",
    },
    {
      id: "3",
      businessName: "Sparkle Auto Detailing",
      title: "First-Time Customer",
      discount: "$25 OFF",
      description: "First-time customers receive $25 off our premium detailing package.",
      code: "NEWCUSTOMER",
      expires: "2025-07-31",
      category: "Automotive",
    },
    {
      id: "4",
      businessName: "Fitness First Gym",
      title: "Summer Membership",
      discount: "50% OFF First Month",
      description: "Join now and get 50% off your first month of membership. No contracts required.",
      code: "SUMMER50",
      expires: "2025-08-15",
      category: "Health & Fitness",
    },
    {
      id: "5",
      businessName: "Tech Solutions",
      title: "Computer Repair",
      discount: "$15 OFF",
      description: "Get $15 off any computer repair service. Diagnostics included.",
      code: "FIXMYPC",
      expires: "2025-09-30",
      category: "Technology",
    },
    {
      id: "6",
      businessName: "Cozy Corner Bookstore",
      title: "Book Lover's Deal",
      discount: "Buy 3 Pay for 2",
      description: "Purchase any three books and only pay for two. Cheapest book is free.",
      code: "BOOKWORM",
      expires: "2025-06-15",
      category: "Retail",
    },
  ]

  // Format date from YYYY-MM-DD to MM/DD/YYYY
  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split("-")
    return `${month}/${day}/${year}`
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-grow container mx-auto px-4 py-8">
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
              <Button onClick={handleZipSubmit}>
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
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

              {/* Coupon Grid */}
              {sampleDeals.length === 0 ? (
                <div className="text-center py-12 relative z-10">
                  <p className="text-gray-500 text-lg mb-4">No deals available at this time.</p>
                  <p className="text-gray-400">Check back soon for new savings opportunities!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                  {sampleDeals.map((deal) => (
                    <div key={deal.id} className="relative">
                      <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full border border-amber-300 shadow-sm">
                            {deal.category}
                          </div>
                        </div>

                        <div className="text-center mb-2">
                          <h4 className="font-bold text-lg text-teal-700">{deal.businessName}</h4>
                        </div>

                        <div className="text-center mb-3">
                          <div className="font-bold text-xl">{deal.title}</div>
                          <div className="text-2xl font-extrabold text-red-600">{deal.discount}</div>
                        </div>

                        <div className="text-sm mb-3">{deal.description}</div>

                        {deal.code && (
                          <div className="text-center mb-2">
                            <span className="inline-block bg-gray-100 px-2 py-1 rounded font-mono text-sm">
                              Code: {deal.code}
                            </span>
                          </div>
                        )}

                        <div className="text-xs text-gray-600 mt-2 font-semibold flex items-center justify-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Expires: {formatDate(deal.expires)}
                        </div>

                        <div className="flex justify-between mt-4">
                          <Button variant="outline" size="sm" className="flex items-center">
                            <Download className="mr-1 h-4 w-4" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm" className="flex items-center">
                            <Share2 className="mr-1 h-4 w-4" />
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
