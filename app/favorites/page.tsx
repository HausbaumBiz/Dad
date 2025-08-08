"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { Heart, Phone, MapPin, Mail, Calendar, Trash2, Loader2, AlertCircle, Scissors, Briefcase, Home, DollarSign, Clock, Download, Printer } from 'lucide-react'
import {
  getFavoriteBusinesses,
  removeFavoriteBusiness,
  getFavoriteJobs,
  removeFavoriteJob,
  getFavoriteCoupons,
  removeFavoriteCoupon,
  type FavoriteBusiness,
  type FavoriteJob,
  type FavoriteCoupon,
} from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import Link from "next/link"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { BusinessProfileDialog } from "@/components/business-profile-dialog"
import { useMobile } from "@/hooks/use-mobile"

export default function FavoritesPage() {
  const { toast } = useToast()
  const isMobile = useMobile()
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<FavoriteBusiness[]>([])
  const [favoriteJobs, setFavoriteJobs] = useState<FavoriteJob[]>([])
  const [favoriteCoupons, setFavoriteCoupons] = useState<FavoriteCoupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [selectedBusinessName, setSelectedBusinessName] = useState<string>("")
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)

  // Check user session and load favorites
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)

        // Check user session
        const session = await getUserSession()
        if (!session?.user) {
          setError("Please log in to view your favorites")
          return
        }

        setCurrentUser(session.user)

        // Load favorite businesses, jobs, and coupons
        const [businesses, jobs, coupons] = await Promise.all([
          getFavoriteBusinesses(),
          getFavoriteJobs(),
          getFavoriteCoupons(),
        ])

        console.log("Loaded favorites:", { businesses, jobs, coupons })
        setFavoriteBusinesses(businesses)
        setFavoriteJobs(jobs)
        setFavoriteCoupons(coupons)
      } catch (err) {
        console.error("Error loading favorites:", err)
        setError("Failed to load favorites")
        toast({
          title: "Error",
          description: "Failed to load your favorites",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [toast])

  // Handle removing a business from favorites
  const handleRemoveFavorite = async (businessId: string, businessName: string) => {
    try {
      const result = await removeFavoriteBusiness(businessId)

      if (result.success) {
        setFavoriteBusinesses((prev) => prev.filter((fav) => fav.id !== businessId))
        toast({
          title: "Removed from Favorites",
          description: `${businessName} has been removed from your favorites`,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing favorite:", error)
      toast({
        title: "Error",
        description: "Failed to remove business from favorites",
        variant: "destructive",
      })
    }
  }

  // Handle removing a job from favorites
  const handleRemoveFavoriteJob = async (jobId: string, jobTitle: string) => {
    try {
      const result = await removeFavoriteJob(jobId)

      if (result.success) {
        setFavoriteJobs((prev) => prev.filter((fav) => fav.id !== jobId))
        toast({
          title: "Removed from Bookmarks",
          description: `${jobTitle} has been removed from your bookmarked jobs`,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing favorite job:", error)
      toast({
        title: "Error",
        description: "Failed to remove job from bookmarks",
        variant: "destructive",
      })
    }
  }

  // Handle removing a coupon from favorites
  const handleRemoveFavoriteCoupon = async (couponId: string, couponTitle: string) => {
    try {
      const result = await removeFavoriteCoupon(couponId)

      if (result.success) {
        setFavoriteCoupons((prev) => prev.filter((fav) => fav.id !== couponId))
        toast({
          title: "Removed from Saved Coupons",
          description: `${couponTitle} has been removed from your saved coupons`,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error removing favorite coupon:", error)
      toast({
        title: "Error",
        description: "Failed to remove coupon from favorites",
        variant: "destructive",
      })
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Unknown date"
    }
  }

  // Format pay range for job display
  const formatJobPayRange = (job: FavoriteJob) => {
    if (job.payType === "hourly" && (job.hourlyMin || job.hourlyMax)) {
      if (job.hourlyMin && job.hourlyMax) {
        return `$${job.hourlyMin} - $${job.hourlyMax}/hr`
      } else if (job.hourlyMin) {
        return `$${job.hourlyMin}/hr`
      } else if (job.hourlyMax) {
        return `Up to $${job.hourlyMax}/hr`
      }
    } else if (job.payType === "salary" && (job.salaryMin || job.salaryMax)) {
      if (job.salaryMin && job.salaryMax) {
        return `$${job.salaryMin} - $${job.salaryMax}/yr`
      } else if (job.salaryMin) {
        return `$${job.salaryMin}/yr`
      } else if (job.salaryMax) {
        return `Up to $${job.salaryMax}/yr`
      }
    } else if (job.payType === "other" && job.otherPay) {
      return job.otherPay
    }
    return "Not specified"
  }

  // Handle opening business profile dialog
  const handleViewProfile = (businessId: string, businessName: string) => {
    setSelectedBusinessId(businessId)
    setSelectedBusinessName(businessName)
    setIsProfileDialogOpen(true)
  }

  // Handle coupon download/print
  const handleCouponAction = async (coupon: FavoriteCoupon) => {
    if (!coupon.imageUrl) {
      toast({
        title: "Error",
        description: "Coupon image not available",
        variant: "destructive",
      })
      return
    }

    try {
      if (isMobile) {
        // Download on mobile
        const response = await fetch(coupon.imageUrl)
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = downloadUrl
        link.download = `coupon-${coupon.id}.jpg`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)

        toast({
          title: "Coupon Downloaded",
          description: "The coupon has been saved to your device",
        })
      } else {
        // Print on desktop
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Print Coupon</title>
                <style>
                  body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                  img { max-width: 100%; max-height: 100vh; }
                  @media print {
                    body { height: auto; }
                    img { max-height: none; }
                  }
                </style>
              </head>
              <body>
                <img src="${coupon.imageUrl}" alt="Coupon" onload="window.print();window.close()">
              </body>
            </html>
          `)
          printWindow.document.close()
        }
      }
    } catch (error) {
      console.error("Error handling coupon action:", error)
      toast({
        title: "Error",
        description: "Failed to process coupon",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        {/* Header with blue gradient and dot texture */}
        <header className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg relative">
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-90 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)",
              backgroundSize: "10px 10px",
              mixBlendMode: "overlay",
              zIndex: 1,
            }}
          ></div>
          <div className="container mx-auto px-4 py-4 relative z-10">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center text-white hover:text-gray-100">
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-xl font-semibold drop-shadow-sm">My Favorites</h1>
              <div></div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p className="text-gray-700">Loading your favorites...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        {/* Header with blue gradient and dot texture */}
        <header className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg relative">
          {/* Noise texture overlay */}
          <div
            className="absolute inset-0 opacity-90 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)",
              backgroundSize: "10px 10px",
              mixBlendMode: "overlay",
              zIndex: 1,
            }}
          ></div>
          <div className="container mx-auto px-4 py-4 relative z-10">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center text-white hover:text-gray-100">
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-xl font-semibold drop-shadow-sm">My Favorites</h1>
              <div></div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Favorites</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button variant="secondary" onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header with blue gradient and dot texture */}
      <header className="bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg relative">
        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-90 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)",
            backgroundSize: "10px 10px",
            mixBlendMode: "overlay",
            zIndex: 1,
          }}
        ></div>
        <div className="container mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-white hover:text-gray-100">
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-semibold drop-shadow-sm">My Favorites</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2 drop-shadow-sm">
              My Favorites
            </h1>
            <p className="text-gray-600">Manage your saved businesses, coupons, and job listings</p>
          </div>

          <Tabs defaultValue="businesses" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-purple-200 shadow-lg rounded-xl p-1">
              <TabsTrigger
                value="businesses"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:relative rounded-lg transition-all duration-200"
                style={{
                  backgroundImage: "data-[state=active]:radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)",
                  backgroundSize: "data-[state=active]:10px 10px",
                }}
              >
                <div className="data-[state=active]:absolute data-[state=active]:inset-0 data-[state=active]:opacity-90 data-[state=active]:pointer-events-none data-[state=active]:rounded-lg"
                     style={{
                       backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)",
                       backgroundSize: "10px 10px",
                       mixBlendMode: "overlay",
                     }}
                ></div>
                <Heart className="h-4 w-4 text-purple-500 data-[state=active]:text-white relative z-10" />
                <span className="relative z-10">Favorite Businesses</span>
                {favoriteBusinesses.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-gradient-to-r from-primary to-primary/80 text-white relative z-10">
                    {favoriteBusinesses.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="coupons"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:relative rounded-lg transition-all duration-200"
              >
                <div className="data-[state=active]:absolute data-[state=active]:inset-0 data-[state=active]:opacity-90 data-[state=active]:pointer-events-none data-[state=active]:rounded-lg"
                     style={{
                       backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)",
                       backgroundSize: "10px 10px",
                       mixBlendMode: "overlay",
                     }}
                ></div>
                <Scissors className="h-4 w-4 text-pink-500 data-[state=active]:text-white relative z-10" />
                <span className="relative z-10">Saved Coupons</span>
                {favoriteCoupons.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-gradient-to-r from-primary to-primary/80 text-white relative z-10">
                    {favoriteCoupons.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="jobs"
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/80 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:relative rounded-lg transition-all duration-200"
              >
                <div className="data-[state=active]:absolute data-[state=active]:inset-0 data-[state=active]:opacity-90 data-[state=active]:pointer-events-none data-[state=active]:rounded-lg"
                     style={{
                       backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 2px, transparent 2px)",
                       backgroundSize: "10px 10px",
                       mixBlendMode: "overlay",
                     }}
                ></div>
                <Briefcase className="h-4 w-4 text-orange-500 data-[state=active]:text-white relative z-10" />
                <span className="relative z-10">Bookmarked Jobs</span>
                {favoriteJobs.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-gradient-to-r from-primary to-primary/80 text-white relative z-10">
                    {favoriteJobs.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Favorite Businesses Tab */}
            <TabsContent value="businesses" className="mt-6">
              {favoriteBusinesses.length === 0 ? (
                <Card className="bg-gradient-to-br from-purple-100 to-pink-100 border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Heart className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Favorite Businesses Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start exploring businesses and save your favorites for quick access
                    </p>
                    <Button variant="secondary" asChild>
                      <Link href="/">Browse Businesses</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {favoriteBusinesses.map((business) => (
                    <Card
                      key={business.id}
                      className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 shadow-lg"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg leading-tight">
                              {business.displayName || business.businessName}
                            </CardTitle>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">Added {formatDate(business.dateAdded)}</span>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove from Favorites</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "{business.displayName || business.businessName}" from
                                  your favorites? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleRemoveFavorite(business.id, business.displayName || business.businessName)
                                  }
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Phone */}
                          {business.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                              <a href={`tel:${business.phone}`} className="text-blue-600 hover:underline">
                                {business.phone}
                              </a>
                            </div>
                          )}

                          {/* Location */}
                          {business.address && (
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700 leading-tight">{business.address}</span>
                            </div>
                          )}

                          {/* Email */}
                          {business.email && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                              <a href={`mailto:${business.email}`} className="text-blue-600 hover:underline truncate">
                                {business.email}
                              </a>
                            </div>
                          )}

                          {/* ZIP Code */}
                          {business.zipCode && (
                            <div className="flex items-center gap-2 text-sm">
                              <div className="h-4 w-4 flex items-center justify-center">
                                <span className="text-xs font-mono text-primary">#</span>
                              </div>
                              <span className="text-gray-700">ZIP: {business.zipCode}</span>
                            </div>
                          )}
                        </div>

                        <Separator className="my-4" />

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent hover:bg-primary/10 hover:text-primary"
                            onClick={() =>
                              handleViewProfile(business.id, business.displayName || business.businessName)
                            }
                          >
                            View Profile
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Coupons Tab */}
            <TabsContent value="coupons" className="mt-6">
              {favoriteCoupons.length === 0 ? (
                <Card className="bg-gradient-to-br from-pink-100 to-orange-100 border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Scissors className="h-12 w-12 text-pink-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Coupons Yet</h3>
                    <p className="text-gray-600 mb-4">Browse business profiles to find and save exclusive coupons</p>
                    <Button variant="secondary" asChild>
                      <Link href="/coupons">Browse Coupons</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {favoriteCoupons.map((coupon) => (
                    <Card
                      key={coupon.id}
                      className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 shadow-lg"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg leading-tight">{coupon.title}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">{coupon.businessName}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">Saved {formatDate(coupon.dateAdded)}</span>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove from Saved Coupons</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "{coupon.title}" from your saved coupons? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveFavoriteCoupon(coupon.id, coupon.title)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Coupon Image */}
                          {coupon.imageUrl && (
                            <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={coupon.imageUrl || "/placeholder.svg"}
                                alt={coupon.title}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>
                          )}

                          {/* Description */}
                          {coupon.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{coupon.description}</p>
                          )}

                          {/* Expiration Date */}
                          {coupon.expirationDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="text-gray-700">Expires: {formatDate(coupon.expirationDate)}</span>
                            </div>
                          )}
                        </div>

                        <Separator className="my-4" />

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleCouponAction(coupon)}
                          >
                            {isMobile ? (
                              <>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </>
                            ) : (
                              <>
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleViewProfile(coupon.businessId, coupon.businessName)}
                          >
                            View Business
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Bookmarked Jobs Tab */}
            <TabsContent value="jobs" className="mt-6">
              {favoriteJobs.length === 0 ? (
                <Card className="bg-gradient-to-br from-orange-100 to-yellow-100 border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-orange-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookmarked Jobs Yet</h3>
                    <p className="text-gray-600 mb-4">Save interesting job listings to apply to them later</p>
                    <Button variant="secondary" asChild>
                      <Link href="/job-listings">Browse Jobs</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {favoriteJobs.map((job) => (
                    <Card
                      key={job.id}
                      className="hover:shadow-xl hover:scale-105 transition-all duration-300 bg-white/90 backdrop-blur-sm border-0 shadow-lg"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg leading-tight">{job.jobTitle}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">{job.businessName}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">Saved {formatDate(job.dateAdded)}</span>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove from Bookmarks</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to remove "{job.jobTitle}" from your bookmarked jobs? This
                                  action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRemoveFavoriteJob(job.id, job.jobTitle)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {/* Pay */}
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-gray-700">{formatJobPayRange(job)}</span>
                          </div>

                          {/* Work Hours */}
                          {job.workHours && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                              <span className="text-gray-700">{job.workHours}</span>
                            </div>
                          )}

                          {/* Categories */}
                          {job.categories && job.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {job.categories.slice(0, 2).map((category, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                >
                                  {category}
                                </span>
                              ))}
                              {job.categories.length > 2 && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  +{job.categories.length - 2} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Contact */}
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                            <a href={`mailto:${job.contactEmail}`} className="text-blue-600 hover:underline truncate">
                              {job.contactEmail}
                            </a>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent hover:bg-primary/10 hover:text-primary"
                            onClick={() => handleViewProfile(job.businessId, job.businessName)}
                          >
                            View Business
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Business Profile Dialog */}
      {selectedBusinessId && (
        <BusinessProfileDialog
          isOpen={isProfileDialogOpen}
          onClose={() => {
            setIsProfileDialogOpen(false)
            setSelectedBusinessId(null)
            setSelectedBusinessName("")
          }}
          businessId={selectedBusinessId}
          businessName={selectedBusinessName}
        />
      )}

      <Toaster />
    </div>
  )
}
