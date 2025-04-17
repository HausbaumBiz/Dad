import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Facebook, Twitter, Linkedin, ChevronLeft } from "lucide-react"

export default function BusinessPortalPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Image src="/hausbaumbiz03.png" alt="Hausbaum Logo" width={600} height={300} className="h-64 w-auto" />
          </div>

          <div className="flex space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/contact-us">Contact Us</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/business-login">Login</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/business-register">Register</Link>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="flex flex-col space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome to Hausbaum</h1>
              <h2 className="text-xl text-primary mb-6">for Businesses and Services</h2>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-3">Grow Your Business</h3>
                <p className="text-gray-600 mb-2">Hausbaum is a dynamic platform designed to help businesses grow.</p>
                <p className="text-gray-600 mb-2">Design your own searchable business listing.</p>
                <p className="text-gray-600">
                  Include your own color patterns, images, and videos to attract local customers.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-3">Special Offers</h3>
                <p className="text-gray-600 mb-2">Attract more customers by posting special offers and coupons,</p>
                <p className="text-gray-600">
                  making it easy for potential clients to take advantage of exclusive deals.
                </p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-3">Job Listings</h3>
                <p className="text-gray-600 mb-2">For companies looking to expand their team,</p>
                <p className="text-gray-600 mb-2">our job listing feature allows them to post open positions</p>
                <p className="text-gray-600">and connect with qualified candidates.</p>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6">
              <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-white">
                <Link href="/business-register">Register Now</Link>
              </Button>
            </div>
          </div>

          <div
            className="flex items-center justify-center p-8 rounded-lg shadow-lg relative overflow-hidden"
            style={{
              backgroundImage: "url('/wall.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <Image
              src="/fence-4-shoe-fix.png"
              alt="Professional Painter"
              width={500}
              height={700}
              className="max-w-full h-auto"
              style={{ objectFit: "contain" }}
            />
          </div>
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

            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary-foreground/10">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary-foreground/10">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-primary-foreground/10">
                <Linkedin className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
