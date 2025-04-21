"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, Search, MapPin, Download, Share2 } from "lucide-react"
import { ZipCodeDialog } from "@/components/zip-code-dialog"

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

  // Mock deals for the Penny Saver
  const deals = [
    {
      title: "50% Off Oil Change",
      business: "Quick Fix Auto Repair",
      description: "Complete oil change service including filter replacement and fluid check.",
      expires: "May 15, 2025",
    },
    {
      title: "Free Consultation",
      business: "Johnson & Associates Law Firm",
      description: "Initial 30-minute legal consultation at no charge for new clients.",
      expires: "June 1, 2025",
    },
    {
      title: "Buy One Get One Free",
      business: "Bella Italia Restaurant",
      description: "Purchase any entrée and receive a second entrée of equal or lesser value for free.",
      expires: "May 20, 2025",
    },
    {
      title: "20% Off First Cleaning",
      business: "Spotless Home Cleaners",
      description: "New customers receive 20% off their first home cleaning service.",
      expires: "May 31, 2025",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Link href="/">
              <Image src="/hausbaumbiz03.png" alt="Hausbaum Logo" width={600} height={300} className="h-64 w-auto" />
            </Link>
          </div>

          <div className="flex space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/contact-us">Contact Us</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="pl-0">
            <Link href="/" className="flex items-center text-primary">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

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

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">Featured Deals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {deals.map((deal, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="bg-amber-50 px-3 py-1 rounded-full text-amber-800 text-sm font-medium self-start mb-2">
                      Expires: {deal.expires}
                    </div>
                    <h3 className="text-xl font-semibold mb-1">{deal.title}</h3>
                    <p className="text-primary font-medium mb-3">{deal.business}</p>
                    <p className="text-gray-600 mb-4 flex-grow">{deal.description}</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 rounded-lg p-6 mb-12">
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

      <footer className="bg-primary text-white py-8 relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: "url('/texture0079.png')",
            backgroundRepeat: "repeat",
            mixBlendMode: "multiply",
          }}
        ></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Hausbaum</h2>
              <p className="text-sm mt-2">© {new Date().getFullYear()} Hausbaum. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Zip Code Dialog */}
      <ZipCodeDialog
        isOpen={isZipDialogOpen}
        onClose={() => setIsZipDialogOpen(false)}
        onSubmit={handleZipDialogSubmit}
      />
    </div>
  )
}
