"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, User, Heart } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { getUserSession, logoutUser } from "@/app/actions/user-actions"

interface UserSession {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

export function MainHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [userSession, setUserSession] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const session = await getUserSession()
        setUserSession(session)
      } catch (error) {
        console.error("Error fetching user session:", error)
        setUserSession({ user: null })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserSession()
  }, [])

  const handleLogout = async () => {
    try {
      await logoutUser()
      setUserSession({ user: null })
      window.location.href = "/"
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  const categories = [
    { name: "Home Improvement", href: "/home-improvement" },
    { name: "Automotive Services", href: "/automotive-services" },
    { name: "Care Services", href: "/care-services" },
    { name: "Beauty & Wellness", href: "/beauty-wellness" },
    { name: "Food & Dining", href: "/food-dining" },
    { name: "Professional Services", href: "/professional-services" },
  ]

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">HB</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HausBaum</span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search businesses, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Button type="submit" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link href="/job-listings" className="text-gray-700 hover:text-blue-600 font-medium">
              Jobs
            </Link>
            <Link href="/coupons" className="text-gray-700 hover:text-blue-600 font-medium">
              Coupons
            </Link>
            <Link href="/business-register" className="text-gray-700 hover:text-blue-600 font-medium">
              List Business
            </Link>
          </nav>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : userSession?.user ? (
              <div className="flex items-center space-x-3">
                <Link href="/favorites" className="text-gray-700 hover:text-blue-600">
                  <Heart className="w-5 h-5" />
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{userSession.user.firstName}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-sm bg-transparent">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/user-login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/user-register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col h-full">
                {/* Mobile Search */}
                <div className="mb-6">
                  <form onSubmit={handleSearch}>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search businesses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2"
                      />
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>
                  </form>
                </div>

                {/* Mobile User Section */}
                <div className="mb-6 pb-6 border-b">
                  {isLoading ? (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>
                  ) : userSession?.user ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {userSession.user.firstName} {userSession.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{userSession.user.email}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild className="flex-1 bg-transparent">
                          <Link href="/favorites">
                            <Heart className="w-4 h-4 mr-2" />
                            Favorites
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                          Logout
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Button asChild className="w-full">
                        <Link href="/user-login">Login</Link>
                      </Button>
                      <Button variant="outline" asChild className="w-full bg-transparent">
                        <Link href="/user-register">Sign Up</Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
                    <div className="space-y-2">
                      <Link
                        href="/job-listings"
                        className="block py-2 text-gray-700 hover:text-blue-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Job Listings
                      </Link>
                      <Link
                        href="/coupons"
                        className="block py-2 text-gray-700 hover:text-blue-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Coupons & Deals
                      </Link>
                      <Link
                        href="/business-register"
                        className="block py-2 text-gray-700 hover:text-blue-600"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        List Your Business
                      </Link>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <Link
                          key={category.name}
                          href={category.href}
                          className="block py-2 text-gray-700 hover:text-blue-600"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </nav>

                {/* Mobile Footer */}
                <div className="pt-6 border-t">
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                    <Link href="/contact-us" onClick={() => setIsMenuOpen(false)}>
                      Contact
                    </Link>
                    <Link href="/legal-notice" onClick={() => setIsMenuOpen(false)}>
                      Legal
                    </Link>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Category Bar - Desktop */}
      <div className="hidden lg:block bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8 py-3">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="text-sm text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}
