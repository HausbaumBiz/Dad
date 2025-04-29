"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getCurrentBusiness, logoutBusiness } from "@/app/actions/business-actions"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LogOut, User } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export default function WorkbenchPage() {
  const [business, setBusiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchBusinessData() {
      try {
        setLoading(true)
        const businessData = await getCurrentBusiness()

        if (!businessData) {
          // If no business data is found, redirect to login
          router.push("/business-login")
          return
        }

        setBusiness(businessData)
      } catch (err) {
        console.error("Failed to get business data:", err)
        setError("Failed to load business data. Please try logging in again.")
      } finally {
        setLoading(false)
      }
    }

    fetchBusinessData()
  }, [router])

  // If there's an error, show an error message with a login link
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Workbench</h2>
          <p className="mb-6 text-gray-700">{error}</p>
          <Button onClick={() => router.push("/business-login")}>Return to Login</Button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-home"
            >
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Home Page
          </Link>

          {loading ? (
            <Skeleton className="h-10 w-40" />
          ) : business ? (
            <div className="flex items-center">
              <BusinessUserMenu businessName={business.businessName} />
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 flex justify-center items-start">
            <div className="relative w-full max-w-md h-64">
              <Image
                src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/hausbaumbiz03-JJedtHiDvlWtJs7irPdMNCF6JoRQfS.png"
                alt="Hausbaum Logo"
                fill
                style={{ objectFit: "contain" }}
                priority
              />
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Workbenches</h2>

              {loading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <WorkbenchButton
                    href="/business-focus"
                    iconSrc="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/business-cards-icon-X09H698yJZQiK1Ve9bMp9fK3NmIZBt.png"
                    label="Your Business Focus"
                  />

                  <WorkbenchButton
                    href="/ad-design"
                    iconSrc="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/ad-workbench-icon-scOKMCrsO5iu98jnDvZGHdJrb0TNeJ.png"
                    label="Ad Workbench"
                  />

                  <WorkbenchButton
                    href="/coupons"
                    iconSrc="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/money-saver-icon-xJgsaAlHhdg5K2XK0YJNmll4BFxSN2.png"
                    label="Penny Saver Workbench"
                  />

                  <WorkbenchButton
                    href="/job-listing"
                    iconSrc="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/jobs-icon-NE5EpebSE0Zp2qBCfvaAKSpMiNJZ9n.png"
                    label="Create A Job Listing"
                  />

                  <WorkbenchButton
                    href="/statistics"
                    iconSrc="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/stats002-gW6ZaTQQkxNHACfsxA0LoZMnih5oax.png"
                    label="Statistics Dashboard"
                  />

                  <WorkbenchButton
                    href="/user-account"
                    iconSrc="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/user-account-icon%20sm-PZ61Ko9nsGv5oeESUWjM2pDekdeewQ.png"
                    label="User Account"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

interface WorkbenchButtonProps {
  href: string
  iconSrc: string
  label: string
}

function WorkbenchButton({ href, iconSrc, label }: WorkbenchButtonProps) {
  // Special handling for Ad Workbench button
  if (href === "/ad-design") {
    return (
      <Link
        href="/ad-design"
        className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all group"
        onClick={(e) => {
          // For Ad Workbench, check if we have a saved design
          if (label === "Ad Workbench") {
            const savedDesign = localStorage.getItem("hausbaum_selected_design")
            const savedColor = localStorage.getItem("hausbaum_selected_color")

            if (savedDesign) {
              e.preventDefault()
              // Redirect to customize page with the saved design and color
              window.location.href = `/ad-design/customize?design=${savedDesign}&color=${savedColor || "blue"}`
            }
          }
        }}
      >
        <div className="flex items-center justify-center w-16 h-16 mr-6 flex-shrink-0">
          <Image
            src={iconSrc || "/placeholder.svg"}
            alt={label}
            width={64}
            height={64}
            className="object-contain max-h-full"
          />
        </div>
        <span className="text-xl font-medium text-gray-800 group-hover:text-primary transition-colors">{label}</span>
      </Link>
    )
  }

  // Default behavior for other buttons
  return (
    <Link
      href={href}
      className="flex items-center p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all group"
    >
      <div className="flex items-center justify-center w-16 h-16 mr-6 flex-shrink-0">
        <Image
          src={iconSrc || "/placeholder.svg"}
          alt={label}
          width={64}
          height={64}
          className="object-contain max-h-full"
        />
      </div>
      <span className="text-xl font-medium text-gray-800 group-hover:text-primary transition-colors">{label}</span>
    </Link>
  )
}

// Business user menu component
function BusinessUserMenu({ businessName }: { businessName: string }) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logoutBusiness()
      router.push("/")
    } catch (error) {
      console.error("Logout failed:", error)
      // Force redirect even if the server action fails
      router.push("/")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{businessName}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <button className="w-full flex items-center text-red-600 cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
