"use client"

import { CategoryLayout } from "@/components/category-layout"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { useState, useEffect } from "react"
import { AdBox } from "@/components/ad-box"
import { Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function HomeImprovementPage() {
  const categories = [
    {
      title: "Lawn, Garden and Snow Removal",
      href: "/home-improvement/lawn-garden",
      subcategories: [
        "Lawn & Landscaping",
        "Lawn Treatment",
        "Landscape Lighting",
        "Tree Service",
        "Snow Removal",
        "And more...",
      ],
    },
    {
      title: "Outside Home Maintenance and Repair",
      href: "/home-improvement/outside-maintenance",
      subcategories: [
        "Roofing",
        "Siding",
        "House Painting",
        "Pressure Washing",
        "Gutter Cleaning/Repair",
        "And more...",
      ],
    },
    {
      title: "Outdoor Structure Assembly/Construction and Fencing",
      href: "/home-improvement/outdoor-structures",
      subcategories: [
        "Deck/Patio/Porch Construction",
        "Fences",
        "Solar Panel Installation",
        "Playground Equipment Installation",
        "And more...",
      ],
    },
    {
      title: "Pool Services",
      href: "/home-improvement/pool-services",
      subcategories: ["Swimming Pool Installers/Builders", "Swimming Pool Maintenance/Cleaning", "Other Pool Services"],
    },
    {
      title: "Asphalt, Concrete, Stone and Gravel",
      href: "/home-improvement/asphalt-concrete",
      subcategories: [
        "Concrete Driveways",
        "Asphalt Driveways",
        "Stone & Gravel",
        "Stamped Concrete",
        "Concrete Repair",
        "And more...",
      ],
    },
    {
      title: "Home Construction and Design",
      href: "/home-improvement/construction-design",
      subcategories: [
        "General Contractors",
        "Architect",
        "Home Remodeling",
        "Demolition",
        "Land Surveyors",
        "And more...",
      ],
    },
    {
      title: "Inside Home Maintenance and Repair",
      href: "/home-improvement/inside-maintenance",
      subcategories: [
        "Electricians",
        "Plumbers",
        "HVAC Services",
        "Appliance Repair",
        "Indoor Painting",
        "And more...",
      ],
    },
    {
      title: "Windows and Doors",
      href: "/home-improvement/windows-doors",
      subcategories: ["Window Replacement", "Door Installation", "Window Tinting", "Locksmith", "And more..."],
    },
    {
      title: "Floor/Carpet Care and Installation",
      href: "/home-improvement/flooring",
      subcategories: [
        "Carpet Installation",
        "Hardwood Floor Installation",
        "Tile Flooring",
        "Carpet Cleaning",
        "And more...",
      ],
    },
    {
      title: "Audio/Visual and Home Security",
      href: "/home-improvement/audio-visual-security",
      subcategories: [
        "Smart Home Setup",
        "Home Security Solutions",
        "Cinema Room Setup",
        "Computer Repair",
        "And more...",
      ],
    },
    {
      title: "Home Hazard Mitigation",
      href: "/home-improvement/hazard-mitigation",
      subcategories: [
        "Lead-Based Paint Abatement",
        "Radon Mitigation",
        "Mold Removal",
        "Asbestos Removal",
        "And more...",
      ],
    },
    {
      title: "Pest Control/Wildlife Removal",
      href: "/home-improvement/pest-control",
      subcategories: ["Rodent/Small Animal Infestations", "Wildlife Removal", "Insect and Bug Control", "And more..."],
    },
    {
      title: "Trash Cleanup and Removal",
      href: "/home-improvement/trash-cleanup",
      subcategories: [
        "Biohazard Cleanup",
        "Dumpster Rental",
        "Trash/Junk Removal",
        "Document Shredding",
        "And more...",
      ],
    },
    {
      title: "Home and Office Cleaning",
      href: "/home-improvement/cleaning",
      subcategories: [
        "House Cleaning",
        "Office Cleaning",
        "Window Cleaning",
        "Deep Carpet and Floor Cleaning",
        "And more...",
      ],
    },
    {
      title: "Fireplaces and Chimneys",
      href: "/home-improvement/fireplaces-chimneys",
      subcategories: [
        "Chimney Sweep",
        "Chimney and Chimney Cap Repair",
        "Gas Fireplace Repair",
        "Firewood Suppliers",
        "And more...",
      ],
    },
    {
      title: "Movers/Moving Trucks",
      href: "/home-improvement/movers",
      subcategories: ["Moving Truck Rental", "Piano Movers", "Movers", "And more..."],
    },
    {
      title: "Handymen",
      href: "/home-improvement/handymen",
      subcategories: ["Odd Jobs and Repairs", "Product Assembly", "Other Handymen"],
    },
  ]

  const [businesses, setBusinesses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchBusinesses = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/businesses/by-page?page=home-improvement")
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      if (data.businesses && data.businesses.length > 0) {
        console.log(`Found ${data.businesses.length} businesses for home-improvement page`)
        // Filter out demo businesses
        const realBusinesses = data.businesses.filter((business: any) => {
          // Check if it's a demo business
          if (business.is_demo) return false

          // Check business name for demo indicators
          const name = business.businessName || business.business_name || ""
          if (
            name.toLowerCase().includes("demo") ||
            name.toLowerCase().includes("sample") ||
            name.toLowerCase().includes("test")
          ) {
            return false
          }

          // Check email for demo indicators
          const email = business.email || ""
          if (
            email.toLowerCase().includes("demo") ||
            email.toLowerCase().includes("sample") ||
            email.toLowerCase().includes("test") ||
            email.toLowerCase().includes("example.com")
          ) {
            return false
          }

          return true
        })

        setBusinesses(realBusinesses)
      } else {
        setBusinesses([])
      }
    } catch (error) {
      console.error("Error fetching businesses:", error)
      setError(error instanceof Error ? error.message : "Failed to load businesses")
      toast({
        title: "Error loading businesses",
        description: "There was a problem loading businesses. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBusinesses()
  }, [toast])

  return (
    <CategoryLayout title="Looking to Hire? Select the Job Type" backText="Categories">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex justify-center">
          <Image
            src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/clipboard003-sPN3Q4f5npu2cKYqePlqXdokWtqVny.png"
            alt="Home Improvement"
            width={500}
            height={500}
            className="rounded-lg shadow-lg max-w-full h-auto"
          />
        </div>

        <div className="space-y-6">
          <p className="text-lg text-gray-700">
            Find qualified professionals for all your home improvement needs. Browse categories below or use filters to
            narrow your search.
          </p>

          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-medium text-primary mb-2">Why Choose Hausbaum?</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Verified local professionals</li>
              <li>Read customer reviews before hiring</li>
              <li>Compare quotes from multiple providers</li>
              <li>Secure payment options</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <Link href={category.href}>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-primary mb-3">{category.title}</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {category.subcategories.map((sub, idx) => (
                    <li key={idx} className="list-disc list-inside">
                      {sub}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {error && (
        <Alert variant="destructive" className="mt-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={fetchBusinesses}>
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading featured businesses...</p>
        </div>
      ) : businesses.length > 0 ? (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Featured Home Improvement Businesses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.slice(0, 6).map((business) => (
              <AdBox
                key={business.id}
                title={business.adTitle || "Home Improvement Services"}
                description={
                  business.adDescription ||
                  `${business.businessName || business.business_name} offers professional home improvement services in your area.`
                }
                imageUrl={business.adImageUrl || business.logoUrl}
                businessName={business.businessName || business.business_name}
                businessId={business.id}
                phoneNumber={business.phoneNumber || business.phone}
                address={
                  business.address
                    ? `${business.address}, ${business.city}, ${business.state} ${business.zipCode}`
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ) : !isLoading && !error ? (
        <div className="mt-12 text-center p-8 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">No Featured Businesses Yet</h2>
          <p className="text-gray-600">
            We're currently adding businesses to this category. Check back soon or browse our other categories.
          </p>
        </div>
      ) : null}
      <Toaster />
    </CategoryLayout>
  )
}
