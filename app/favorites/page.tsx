"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import {
  Heart,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Trash2,
  Loader2,
  AlertCircle,
  Scissors,
  Briefcase,
  Home,
  DollarSign,
  Clock,
} from "lucide-react"
import {
  getFavoriteBusinesses,
  removeFavoriteBusiness,
  getFavoriteJobs,
  removeFavoriteJob,
  type FavoriteBusiness,
  type FavoriteJob,
} from "@/app/actions/favorite-actions"
import { getUserSession } from "@/app/actions/user-actions"
import Link from "next/link"
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

export default function FavoritesPage() {
  const { toast } = useToast()
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<FavoriteBusiness[]>([])
  const [favoriteJobs, setFavoriteJobs] = useState<FavoriteJob[]>([])
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

        // Load favorite businesses and jobs
        const [businesses, jobs] = await Promise.all([getFavoriteBusinesses(), getFavoriteJobs()])

        console.log("Loaded favorites:", { businesses, jobs })
        setFavoriteBusinesses(businesses)
        setFavoriteJobs(jobs)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Simple header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center text-primary hover:text-primary/80">
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-xl font-semibold">My Favorites</h1>
              <div></div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Loading your favorites...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Simple header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center text-primary hover:text-primary/80">
                <Home className="h-5 w-5 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-xl font-semibold">My Favorites</h1>
              <div></div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Favorites</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center text-primary hover:text-primary/80">
              <Home className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <h1 className="text-xl font-semibold">My Favorites</h1>
            <div></div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
            <p className="text-gray-600">Manage your saved businesses, coupons, and job listings</p>
          </div>

          <Tabs defaultValue="businesses" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="businesses" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Favorite Businesses
                {favoriteBusinesses.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {favoriteBusinesses.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="coupons" className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Saved Coupons
                <Badge variant="secondary" className="ml-1">
                  0
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Bookmarked Jobs
                {favoriteJobs.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {favoriteJobs.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Favorite Businesses Tab */}
            <TabsContent value="businesses" className="mt-6">
              {favoriteBusinesses.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Favorite Businesses Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start exploring businesses and save your favorites for quick access
                    </p>
                    <Button asChild>
                      <Link href="/">Browse Businesses</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {favoriteBusinesses.map((business) => (
                    <Card key={business.id} className="hover:shadow-md transition-shadow">
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
                            className="flex-1 bg-transparent"
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
              <Card>
                <CardContent className="text-center py-12">
                  <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Coupons Yet</h3>
                  <p className="text-gray-600 mb-4">Browse business profiles to find and save exclusive coupons</p>
                  <Button asChild>
                    <Link href="/coupons">Browse Coupons</Link>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookmarked Jobs Tab */}
            <TabsContent value="jobs" className="mt-6">
              {favoriteJobs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookmarked Jobs Yet</h3>
                    <p className="text-gray-600 mb-4">Save interesting job listings to apply to them later</p>
                    <Button asChild>
                      <Link href="/job-listings">Browse Jobs</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {favoriteJobs.map((job) => (
                    <Card key={job.id} className="hover:shadow-md transition-shadow">
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
                            className="flex-1 bg-transparent"
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
