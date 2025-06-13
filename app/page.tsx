"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, MapPin, ChevronRight, Facebook, Twitter, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import Image from "next/image"
import { ZipCodeDialog } from "@/components/zip-code-dialog"
import { useToast } from "@/components/ui/use-toast"
import { UserMenu } from "@/components/user-menu"
import { CategorySubcategories } from "@/components/category-subcategories"

export default function HomePage() {
  const { toast } = useToast()
  const [zipCode, setZipCode] = useState("")
  const [savedZipCode, setSavedZipCode] = useState("")
  const [categoriesActive, setCategoriesActive] = useState(false)
  const [isZipDialogOpen, setIsZipDialogOpen] = useState(false)
  const [selectedCategoryHref, setSelectedCategoryHref] = useState("")
  const [userName, setUserName] = useState<string | null>(null)
  const [selectedSubcategories, setSelectedSubcategories] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const savedZip = localStorage.getItem("savedZipCode")
    if (savedZip) {
      setSavedZipCode(savedZip)
      setCategoriesActive(true)
    }

    // Check for registration success cookie
    const cookies = document.cookie.split(";")
    const registrationSuccessCookie = cookies.find((cookie) => cookie.trim().startsWith("registrationSuccess="))

    if (registrationSuccessCookie) {
      // Show success toast
      toast({
        title: "Registration Successful",
        description: "You have successfully registered and are now logged in.",
        duration: 5000,
      })

      // Remove the cookie by setting it to expire
      document.cookie = "registrationSuccess=; max-age=0; path=/;"
    }

    // Fetch user data with error handling and retry logic
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user/session", {
          method: "GET",
          credentials: "include", // Important: include cookies in the request
        })

        if (response.ok) {
          const userData = await response.json()
          if (userData && userData.firstName && userData.lastName) {
            setUserName(`${userData.firstName} ${userData.lastName}`)
          }
        } else {
          console.log("User not authenticated or session API returned an error")
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchUserData()
  }, [toast])

  const handleZipSubmit = () => {
    if (zipCode) {
      localStorage.setItem("savedZipCode", zipCode)
      setSavedZipCode(zipCode)
      setCategoriesActive(true)
    } else {
      alert("Please enter a Zip Code.")
    }
  }

  const handleCategoryClick = (href: string, e: React.MouseEvent) => {
    if (!categoriesActive) {
      e.preventDefault()
      setSelectedCategoryHref(href)
      setIsZipDialogOpen(true)
    }
  }

  const handleZipDialogSubmit = (zipCodeValue: string) => {
    setZipCode(zipCodeValue)
    localStorage.setItem("savedZipCode", zipCodeValue)
    setSavedZipCode(zipCodeValue)
    setCategoriesActive(true)

    // If there was a selected category, navigate to it after setting the zip code
    if (selectedCategoryHref) {
      window.location.href = selectedCategoryHref
    }
  }

  const handleSubcategorySelection = (categoryTitle: string, selected: string[]) => {
    setSelectedSubcategories((prev) => ({
      ...prev,
      [categoryTitle]: selected,
    }))

    // You can add logic here to filter or navigate based on subcategory selection
    console.log(`Selected subcategories for ${categoryTitle}:`, selected)
  }

  const categories = [
    {
      title: "Home Improvement",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/roofer-mDgCeFLINbuMG9UdWRFSiCFxIBFOjc.png",
      href: "/home-improvement",
    },
    {
      title: "Automotive Services",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/auto-mQWtZXyRogQgO5qlNVcR1OYcyDqe59.png",
      href: "/automotive-services",
    },
    {
      title: "Elder and Child Care",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/home%20health-zJyA419byhmD7tyJa0Ebmegg0XzFN3.png",
      href: "/care-services",
    },
    {
      title: "Pet Care",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cat%20and%20dog-UHW1HU5Xs0PMdXJLC66zBYViQu0jx9.png",
      href: "/pet-care",
    },
    {
      title: "Weddings & Events",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/bride-70qH10P5dCi9LToSGdSHJrq7uHD40e.png",
      href: "/weddings-events",
    },
    {
      title: "Fitness & Athletics",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/baseball-aixRgKdF2ejVmCFWkhcEu2wlT9pXor.png",
      href: "/fitness-athletics",
    },
    {
      title: "Education & Tutoring",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/tutor-oUQE3gdqYse3GcFicrOH9B9CAeaRVb.png",
      href: "/education-tutoring",
    },
    {
      title: "Music Lessons",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/music%20lesson-I1NMnc8dVkG1C6rIOTc5mSghexlmxd.png",
      href: "/music-lessons",
    },
    {
      title: "Real Estate",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/realitor003-xqIaDhmbEuAgatSXkskyV0Ulolsmr5.png",
      href: "/real-estate",
    },
    {
      title: "Food & Dining",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/food%20service-DMhVnw8lOLmeSJkRwocWVAaupQmOgz.png",
      href: "/food-dining",
    },
    {
      title: "Retail Stores",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/retail02-PWtKtPOE0qcIIeje2E6crDrL529eTV.png",
      href: "/retail-stores",
    },
    {
      title: "Legal Services",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/lawyer-DoIQHo7vo03r1owabcFTTLMXiPZ91v.png",
      href: "/legal-services",
    },
    {
      title: "Funeral Services",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/funeral-TnpegJLL7ue38d0l8qq9dF7O4Q8ND9.png",
      href: "/funeral-services",
    },
    {
      title: "Personal Assistants",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/assistant-i6Erbhskr6ObActF7XMV9fJslboNmi.png",
      href: "/personal-assistants",
    },
    {
      title: "Travel & Vacation",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/travel-cRSfCiJRrv8nJvyCPyYr5XlEKRKrY4.png",
      href: "/travel-vacation",
    },
    {
      title: "Tailoring & Clothing",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/dress%20maker-MISD8UfnKvitdwKhWRgpsrwR5MVZCY.png",
      href: "/tailoring-clothing",
    },
    {
      title: "Arts & Entertainment",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fineArt-g1djwriCCMnMFKsZHa0GREE7PU4be1.png",
      href: "/arts-entertainment",
    },
    {
      title: "Tech & IT Services",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/computer-lox6P5znlsextHA6c7vUkXZNkr2d3q.png",
      href: "/tech-it-services",
    },
    {
      title: "Beauty & Wellness",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/haircutting-m6QfXr3W3dUfuj4MZFT90WMNtjed8T.png",
      href: "/beauty-wellness",
    },
    {
      title: "Physical Rehabilitation",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/phyical-RZOSg66X6bkbf12ZqgYD8MRTtNgk6H.png",
      href: "/physical-rehabilitation",
    },
    {
      title: "Healthcare Specialists",
      image:
        "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/healthcare-specialist-E3KWl3rzJEhdz571z5VibctDC2RVOL.png",
      href: "/medical-practitioners",
    },
    {
      title: "Mental Health",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/couseling-NTdbl5SQdjHcW9cZCMlFgPSgMin6Ue.png",
      href: "/mental-health",
    },
    {
      title: "Financial Services",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/finance-fqVQ0TmI2kFehcFP7kIOji08oIBhqX.png",
      href: "/financial-services",
    },
  ]

  // Add a featured categories array with the new images
  const featuredCategories = [
    {
      title: "Home Improvement",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/roofer-mDgCeFLINbuMG9UdWRFSiCFxIBFOjc.png",
      href: "/home-improvement",
    },
    {
      title: "Automotive Services",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/auto-mQWtZXyRogQgO5qlNVcR1OYcyDqe59.png",
      href: "/automotive-services",
    },
    {
      title: "Pet Care",
      image:
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cat%20and%20dog-UHW1HU5Xs0PMdXJLC66zBYViQu0jx9.png",
      href: "/pet-care",
    },
    {
      title: "Tech & IT Services",
      image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/computer-lox6P5znlsextHA6c7vUkXZNkr2d3q.png",
      href: "/tech-it-services",
    },
  ]

  // Hero section images
  const heroImages = [
    {
      src: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/woman%20right-BQOsoDawKf0zmfwDs5pzlNV4iWVbOD.png",
      alt: "Woman Right",
    },
    {
      src: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/man%20out-dmEN7MkI1Uf0LDWJJeADTC5ydiXPqQ.png",
      alt: "Man Out",
    },
    {
      src: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/man%20up-989PGMX55S43WeTlrTNWAWvDL8bWVm.png",
      alt: "Man Up",
    },
    {
      src: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/woman%20left-AiqDko3XvnN4VqnSLpMC78tJPnQg9d.png",
      alt: "Woman Left",
    },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Image
              src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/hausbaumbiz03-pppfkt6a4UyL8TdkxntO73GQrsTeeU.png"
              alt="Hausbaum Logo"
              width={720}
              height={360}
              className="h-64 w-auto"
              unoptimized={true}
            />
          </div>

          <div className="flex flex-col items-center text-center md:mx-4">
            <h2 className="text-lg font-medium text-gray-700 max-w-md">
              Connecting you with trusted local experts and service professionals
            </h2>
            <div className="mt-2 text-sm text-gray-600">
              {!userName && (
                <>
                  Looking to Hire?
                  <Link href="/user-register" className="text-primary hover:text-primary/80 mx-1 font-medium">
                    Sign up
                  </Link>
                  or
                  <Link href="/user-login" className="text-primary hover:text-primary/80 mx-1 font-medium">
                    Sign in
                  </Link>
                  or continue as a GUEST
                </>
              )}
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col items-end">
            <UserMenu userName={userName || undefined} />

            <div className="text-sm text-gray-600 mt-2">
              <Button variant="outline" asChild className="text-sm">
                <Link href="/business-portal" className="flex items-center">
                  Business Owner? Register or Login
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Hero Section with Rotating Images */}
        <div className="relative overflow-hidden rounded-xl mb-10 bg-gradient-to-r from-primary to-primary/80">
          {/* Noise texture overlay - positioned behind content */}
          <div
            className="absolute inset-0 opacity-90 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)",
              backgroundSize: "10px 10px",
              mixBlendMode: "overlay",
              zIndex: 1,
            }}
          ></div>

          {/* Mobile layout (original stacked layout) - full width */}
          <div className="md:hidden px-4 py-16 relative z-10">
            <div className="flex flex-col items-center">
              <div className="text-white mb-8 text-center relative z-20">
                <h1 className="text-4xl font-bold mb-4 drop-shadow-sm">Find Local Experts You Can Trust</h1>
                <p className="text-xl mb-6 text-white/90 drop-shadow-sm">
                  Connect with verified professionals in your area for all your service needs
                </p>
              </div>

              {/* Red square around job section - Mobile - Same size as images */}
              <div className="border-4 border-red-600 p-6 w-full max-w-md aspect-square flex flex-col justify-center items-center mb-8 relative z-20">
                <p className="text-2xl mb-6 text-white font-semibold text-center drop-shadow-sm">
                  Or Find A Job On Hausbaum
                </p>
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-300 px-8 py-6 text-xl relative z-30 shadow-md"
                    asChild
                  >
                    <Link href="/job-listings">Find A Job</Link>
                  </Button>
                </div>
              </div>

              <div className="relative w-full max-w-md aspect-square z-20">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2">
                  {heroImages.map((img, i) => (
                    <div key={i} className="relative overflow-hidden rounded-lg shadow-md">
                      <Image
                        src={img.src || "/placeholder.svg"}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop layout (new split layout) - narrower width */}
          <div className="hidden md:block relative z-10">
            <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
              <div className="flex flex-row items-center justify-between">
                <div className="w-[30%] text-white relative z-20">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-sm">
                    Find Local Experts You Can Trust
                  </h1>
                  <p className="text-xl mb-6 text-white/90 drop-shadow-sm">
                    Connect with verified professionals in your area for all your service needs
                  </p>
                </div>

                {/* Red square around job section - Desktop - Same size as images and moved to left */}
                <div className="w-[30%] aspect-square border-4 border-red-600 p-4 flex flex-col justify-center items-center relative z-20">
                  <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white text-center drop-shadow-sm">
                    Or Find A Job On Hausbaum
                  </h2>
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      className="bg-white text-primary hover:bg-white/90 hover:scale-105 transition-all duration-300 px-8 py-6 text-xl relative z-30 shadow-md"
                      asChild
                    >
                      <Link href="/job-listings">Find A Job</Link>
                    </Button>
                  </div>
                </div>

                <div className="w-[30%] flex justify-center">
                  <div className="relative w-full aspect-square z-20">
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2">
                      {heroImages.map((img, i) => (
                        <div key={i} className="relative overflow-hidden rounded-lg shadow-md">
                          <Image
                            src={img.src || "/placeholder.svg"}
                            alt={img.alt}
                            fill
                            className="object-cover"
                            unoptimized={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto mb-10 bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center">
            {savedZipCode && (
              <div className="mb-4 flex items-center text-primary font-medium">
                <MapPin className="mr-2 h-5 w-5" />
                <span>You are searching in area code: {savedZipCode}</span>
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

        {categoriesActive && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-6">Featured Businesses</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {featuredCategories.map((category, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  <a href={category.href} onClick={(e) => handleCategoryClick(category.href, e)}>
                    <div className="aspect-[4/3] relative">
                      <Image
                        src={category.image || "/placeholder.svg"}
                        alt={category.title}
                        fill
                        className="object-cover"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <h3 className="absolute bottom-4 left-4 text-white font-bold text-xl">{category.title}</h3>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-center mb-8">Select a Category</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => (
            <Card key={index} className="overflow-hidden transition-all duration-200 hover:shadow-lg">
              <div className="aspect-square relative overflow-hidden rounded-t-lg">
                <Image
                  src={category.image || "/placeholder.svg"}
                  alt={category.title}
                  fill
                  className="object-cover"
                  unoptimized={true}
                />
              </div>
              <CardContent className="p-4">
                <a href={category.href} onClick={(e) => handleCategoryClick(category.href, e)} className="block">
                  <h3 className="text-lg font-medium text-center mb-2">{category.title}</h3>
                </a>

                {category.subcategories && (
                  <CategorySubcategories
                    categoryTitle={category.title}
                    subcategories={category.subcategories}
                    onSelectionChange={(selected) => handleSubcategorySelection(category.title, selected)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">What Our Customers Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden">
                    <Image
                      src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/whiteman-02-GHmKZGLWeXqHCikTWoVqDZ5kJhCuFy.png"
                      alt="Customer"
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground italic mb-4">
                      "I found an excellent mechanic through Hausbaum. The service was quick and the work was
                      top-notch!"
                    </p>
                    <p className="font-medium">Robert J.</p>
                    <p className="text-xs text-muted-foreground">Car Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden">
                    <Image
                      src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/bride-portrait-W9zV80cjEo3NrySBis6glFJj6EA8Dx.png"
                      alt="Customer"
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground italic mb-4">
                      "Planning my wedding was so much easier with Hausbaum. I found all the vendors I needed in one
                      place!"
                    </p>
                    <p className="font-medium">Sarah M.</p>
                    <p className="text-xs text-muted-foreground">Newlywed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden">
                    <Image
                      src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/hispanic-woman-AbGZTpnRm1lnHhBFROEFRr6oECdfXX.png"
                      alt="Customer"
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>
                  <div>
                    <p className="text-muted-foreground italic mb-4">
                      "As a tech professional, I've gained many new clients through Hausbaum. The platform is easy to
                      use and great for business!"
                    </p>
                    <p className="font-medium">Maria L.</p>
                    <p className="text-xs text-muted-foreground">IT Consultant</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="max-w-md mx-auto text-center mb-12">
          <h3 className="text-xl font-semibold mb-4">This Week's Penny Saver</h3>
          <Link
            href="/penny-saver"
            onClick={(e) => !categoriesActive && handleCategoryClick("/penny-saver", e)}
            className="inline-block transition-all duration-300 hover:scale-105"
          >
            <div className="relative w-64 h-64 mx-auto bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full overflow-hidden shadow-md hover:shadow-xl">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    "url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/texture0079-ofcVFofcVFofcVFofcVFofcVFofcVF.png')",
                  backgroundRepeat: "repeat",
                  mixBlendMode: "multiply",
                }}
              ></div>
              <Image
                src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/simple%20moneysaver-ZitT1iEylHQVkNDQsMM4jf6eqrNHxN.png"
                alt="Penny Saver"
                fill
                className="object-contain p-4 relative z-10"
                unoptimized={true}
              />
              <div className="absolute inset-0 bg-yellow-400/20 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </Link>
        </div>
        <div className="max-w-md mx-auto text-center mb-12">
          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Link href="/contact-us" className="text-lg font-medium">
              Contact Us
            </Link>
          </Button>
        </div>
      </main>
      <footer className="bg-primary text-white py-8 relative">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)",
            backgroundSize: "10px 10px",
            mixBlendMode: "overlay",
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
      <ZipCodeDialog
        isOpen={isZipDialogOpen}
        onClose={() => setIsZipDialogOpen(false)}
        onSubmit={handleZipDialogSubmit}
      />
    </div>
  )
}
