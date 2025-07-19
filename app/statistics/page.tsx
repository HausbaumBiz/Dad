"use client"

import { useState, useEffect } from "react"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, RefreshCw, Star } from "lucide-react"
import { getBusinessAnalytics, resetBusinessAnalytics, type ZipCodeAnalytics } from "@/app/actions/analytics-actions"
import { getBusinessReviews, type Review } from "@/app/actions/review-actions"
import { useToast } from "@/components/ui/use-toast"
import { getCloudflareImageUrl } from "@/lib/cloudflare-images-utils"
import { uploadPhoto } from "@/app/actions/media-actions"

// Mock business data - in real app this would come from auth/session
const CURRENT_BUSINESS = {
  id: "test-business-1",
  name: "Elite Home Services",
  category: "Home Improvement",
}

interface BusinessAnalytics {
  businessId: string
  totalEvents: number
  profileViews: number
  contactClicks: number
  websiteClicks: number
  phoneClicks: number
  photoClicks: number
  couponClicks: number
  jobClicks: number
  videoViews: number
  zipCodeAnalytics: ZipCodeAnalytics[]
  lastUpdated: number
}

import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, PlusCircle, X, Edit, AlertCircle, Trash2, RotateCcwIcon } from "lucide-react"
import type { CategorySelection } from "@/components/category-selector"
import { getBusinessCategories, removeBusinessCategory } from "@/app/actions/category-actions"
import { getBusinessKeywords } from "@/app/actions/keyword-actions"
import {
  type JobListing,
  getBusinessJobs,
  removeJobListing,
  renewJobListing,
  saveJobListing,
} from "@/app/actions/job-actions"
import { getBusinessZipCodes } from "@/app/actions/zip-code-actions"
import type { ZipCodeData } from "@/lib/zip-code-types"
import { getCurrentBusiness } from "@/app/actions/auth-actions"
import { getBusinessCoupons, reinstateCoupon, type Coupon } from "@/app/actions/coupon-actions"
import { Calendar, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { renderJobCategories } from "@/components/job-categories"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

// Client-side expiration functions (using user's local timezone) - same as coupons page
const isCouponExpiredClient = (expirationDate: string): boolean => {
  if (!expirationDate) return false

  // Get current date and time in user's local timezone
  const now = new Date()

  // Parse the expiration date (format: YYYY-MM-DD) and set to end of day in LOCAL time
  const [year, month, day] = expirationDate.split("-").map(Number)
  const expDate = new Date(year, month - 1, day, 23, 59, 59, 999) // month is 0-indexed

  // Only expired if current time is after the end of expiration day
  return now > expDate
}

const getDaysUntilExpirationClient = (expirationDate: string): number => {
  if (!expirationDate) return 0

  // Get today's date at start of day in local time
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Parse expiration date and set to start of day in local time
  const [year, month, day] = expirationDate.split("-").map(Number)
  const expDate = new Date(year, month - 1, day, 0, 0, 0, 0) // month is 0-indexed

  // Calculate difference in days
  const diffTime = expDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Star rating component
const StarRating = ({
  rating,
  maxStars = 5,
  fiveStarCount,
}: { rating: number; maxStars?: number; fiveStarCount?: number }) => {
  return (
    <div className="flex items-center gap-1">
      {[...Array(maxStars)].map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : index < rating
                ? "fill-yellow-200 text-yellow-400"
                : "fill-gray-200 text-gray-300"
          }`}
        />
      ))}
      <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}/5</span>
      {fiveStarCount !== undefined && (
        <span className="ml-2 text-xs text-gray-500 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200">
          {fiveStarCount} × 5⭐
        </span>
      )}
    </div>
  )
}

export default function StatisticsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedCategories, setSelectedCategories] = useState<CategorySelection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState(false)
  const [categoryToRemove, setCategoryToRemove] = useState<string | null>(null)
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const { toast } = useToast()
  const [keywords, setKeywords] = useState<string[]>([])
  const [isKeywordsLoading, setIsKeywordsLoading] = useState(true)
  const [jobListings, setJobListings] = useState<JobListing[]>([])
  const [isJobsLoading, setIsJobsLoading] = useState(true)
  const [jobToRemove, setJobToRemove] = useState<string | null>(null)
  const [showRemoveJobDialog, setShowRemoveJobDialog] = useState(false)
  const [isRemovingJob, setIsRemovingJob] = useState(false)
  const [zipCodes, setZipCodes] = useState<ZipCodeData[]>([])
  const [isNationwide, setIsNationwide] = useState(false)
  const [isZipCodesLoading, setIsZipCodesLoading] = useState(true)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [businessId, setBusinessId] = useState<string | null>("demo-business")
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isCouponsLoading, setIsCouponsLoading] = useState(true)
  const [reinstatingCoupon, setReinstatingCoupon] = useState<string | null>(null)
  const [showReinstateDialog, setShowReinstateDialog] = useState(false)
  const [couponToReinstate, setCouponToReinstate] = useState<Coupon | null>(null)
  const [newExpirationDate, setNewExpirationDate] = useState("")
  const [renewingJob, setRenewingJob] = useState<string | null>(null)

  // Analytics state
  const [clickAnalytics, setClickAnalytics] = useState<BusinessAnalytics | null>(null)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true)
  const [isResettingAnalytics, setIsResettingAnalytics] = useState(false)

  // Zip code analytics state
  const [zipCodeAnalytics, setZipCodeAnalytics] = useState<ZipCodeAnalytics[]>([])
  const [isZipCodeAnalyticsLoading, setIsZipCodeAnalyticsLoading] = useState(true)

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([])
  const [isReviewsLoading, setIsReviewsLoading] = useState(true)

  // Add these new state variables after the existing state declarations
  const [removingJobs, setRemovingJobs] = useState<Set<string>>(new Set())
  const [removedJobs, setRemovedJobs] = useState<Map<string, JobListing>>(new Map())
  const [showJobRemovalDetails, setShowJobRemovalDetails] = useState(false)
  const [jobRemovalDetails, setJobRemovalDetails] = useState<{
    job: JobListing
    zipCodes: number
    categories: number
    willRemoveFrom: string[]
  } | null>(null)
  const [addingAwardToPhotos, setAddingAwardToPhotos] = useState<string | null>(null)

  // Load analytics data
  useEffect(() => {
    async function loadAnalytics() {
      setIsAnalyticsLoading(true)
      setIsZipCodeAnalyticsLoading(true)
      try {
        // Use the current business ID or a default
        let currentBusinessId = businessId
        try {
          const loggedInBusiness = await getCurrentBusiness()
          if (loggedInBusiness && loggedInBusiness.id) {
            currentBusinessId = loggedInBusiness.id
            setBusinessId(currentBusinessId)
          }
        } catch (error) {
          console.error("Error getting logged-in business:", error)
        }

        if (!currentBusinessId) {
          currentBusinessId = "demo-business"
        }

        const [analyticsResult] = await Promise.all([getBusinessAnalytics(currentBusinessId)])

        setClickAnalytics(analyticsResult)
        // Set ZIP code analytics from the analytics result
        setZipCodeAnalytics(analyticsResult.zipCodeAnalytics || [])
      } catch (error) {
        console.error("Error loading analytics:", error)
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        })
      } finally {
        setIsAnalyticsLoading(false)
        setIsZipCodeAnalyticsLoading(false)
      }
    }

    loadAnalytics()
  }, [businessId, toast])

  // Load reviews data
  useEffect(() => {
    async function loadReviews() {
      setIsReviewsLoading(true)
      try {
        // Use the current business ID or a default
        let currentBusinessId = businessId
        try {
          const loggedInBusiness = await getCurrentBusiness()
          if (loggedInBusiness && loggedInBusiness.id) {
            currentBusinessId = loggedInBusiness.id
            setBusinessId(currentBusinessId)
          }
        } catch (error) {
          console.error("Error getting logged-in business:", error)
        }

        if (!currentBusinessId) {
          currentBusinessId = "demo-business"
        }

        const businessReviews = await getBusinessReviews(currentBusinessId)
        setReviews(businessReviews)
      } catch (error) {
        console.error("Error loading reviews:", error)
        toast({
          title: "Error",
          description: "Failed to load reviews data",
          variant: "destructive",
        })
      } finally {
        setIsReviewsLoading(false)
      }
    }

    loadReviews()
  }, [businessId, toast])

  // Handle analytics reset
  const handleResetAnalytics = async () => {
    if (!businessId) return

    setIsResettingAnalytics(true)
    try {
      await resetBusinessAnalytics(businessId)
      // Reset local state
      setClickAnalytics({
        businessId: businessId,
        totalEvents: 0,
        profileViews: 0,
        contactClicks: 0,
        websiteClicks: 0,
        phoneClicks: 0,
        photoAlbumClicks: 0,
        couponClicks: 0,
        jobClicks: 0,
        videoViews: 0,
        zipCodeAnalytics: [],
        lastUpdated: 0,
      })
      setZipCodeAnalytics([])
      toast({
        title: "Success",
        description: "Analytics data has been reset",
      })
    } catch (error) {
      console.error("Error resetting analytics:", error)
      toast({
        title: "Error",
        description: "Failed to reset analytics",
        variant: "destructive",
      })
    } finally {
      setIsResettingAnalytics(false)
    }
  }

  // Load selected categories from server on component mount
  useEffect(() => {
    async function loadCategories() {
      setIsLoading(true)
      try {
        console.log("Fetching business categories...")
        const result = await getBusinessCategories()
        if (result.success && result.data) {
          console.log(`Loaded ${result.data.length} categories from database`)
          setSelectedCategories(result.data)

          // Create a map of checked items for the CategorySelector
          const checkedMap: Record<string, boolean> = {}
          result.data.forEach((cat) => {
            checkedMap[cat.fullPath] = true
          })
          setCheckedItems(checkedMap)
        } else {
          console.warn("No categories found or error loading categories:", result.message)
          // Try to load from localStorage as fallback
          const savedCategories = localStorage.getItem("selectedCategories")
          if (savedCategories) {
            try {
              const parsedCategories = JSON.parse(savedCategories)
              console.log(`Loaded ${parsedCategories.length} categories from localStorage`)
              setSelectedCategories(parsedCategories)
            } catch (parseError) {
              console.error("Error parsing saved categories from localStorage:", parseError)
            }
          }
        }
      } catch (error) {
        console.error("Error loading categories:", error)
        toast({
          title: "Error",
          description: "Failed to load your saved categories",
          variant: "destructive",
        })

        // Try to load from localStorage as fallback
        const savedCategories = localStorage.getItem("selectedCategories")
        if (savedCategories) {
          try {
            const parsedCategories = JSON.parse(savedCategories)
            console.log(`Loaded ${parsedCategories.length} categories from localStorage`)
            setSelectedCategories(parsedCategories)
          } catch (parseError) {
            console.error("Error parsing saved categories from localStorage:", parseError)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [toast])

  // Load keywords from server on component mount
  useEffect(() => {
    async function loadKeywords() {
      setIsKeywordsLoading(true)
      try {
        const result = await getBusinessKeywords()
        if (result.success && result.data) {
          setKeywords(result.data)
        }
      } catch (error) {
        console.error("Error loading keywords:", error)
        toast({
          title: "Error",
          description: "Failed to load your keywords",
          variant: "destructive",
        })
      } finally {
        setIsKeywordsLoading(false)
      }
    }

    loadKeywords()
  }, [toast])

  // Load ZIP codes from server on component mount
  useEffect(() => {
    async function loadZipCodes() {
      setIsZipCodesLoading(true)
      try {
        const result = await getBusinessZipCodes()
        if (result.success && result.data) {
          setZipCodes(result.data.zipCodes)
          setIsNationwide(result.data.isNationwide)
        }
      } catch (error) {
        console.error("Error loading ZIP codes:", error)
        toast({
          title: "Error",
          description: "Failed to load your service area",
          variant: "destructive",
        })
      } finally {
        setIsZipCodesLoading(false)
      }
    }

    loadZipCodes()
  }, [toast])

  // Load job listings from server on component mount
  useEffect(() => {
    async function loadJobListings() {
      setIsJobsLoading(true)
      try {
        // First try to get the logged-in business ID
        let currentBusinessId = businessId
        try {
          const loggedInBusiness = await getCurrentBusiness()
          if (loggedInBusiness && loggedInBusiness.id) {
            currentBusinessId = loggedInBusiness.id
            setBusinessId(currentBusinessId) // Update state with actual business ID
            console.log(`Using logged-in business ID for job listings: ${currentBusinessId}`)
          }
        } catch (error) {
          console.error("Error getting logged-in business:", error)
          // Continue with the current businessId from state
        }

        // If still no business ID, use a default
        if (!currentBusinessId) {
          currentBusinessId = "demo-business"
        }

        const jobs = await getBusinessJobs(currentBusinessId)
        setJobListings(jobs)
      } catch (error) {
        console.error("Error loading job listings:", error)
        toast({
          title: "Error",
          description: "Failed to load your job listings",
          variant: "destructive",
        })
      } finally {
        setIsJobsLoading(false)
      }
    }

    loadJobListings()
  }, [businessId, toast])

  // Load coupons from server on component mount
  useEffect(() => {
    async function loadCoupons() {
      setIsCouponsLoading(true)
      try {
        const result = await getBusinessCoupons()
        if (result.success && result.coupons) {
          setCoupons(result.coupons)
        }
      } catch (error) {
        console.error("Error loading coupons:", error)
        toast({
          title: "Error",
          description: "Failed to load your coupons",
          variant: "destructive",
        })
      } finally {
        setIsCouponsLoading(false)
      }
    }

    loadCoupons()
  }, [toast])

  // Group categories by main category
  const groupedCategories = selectedCategories.reduce(
    (acc, selection) => {
      if (!acc[selection.category]) {
        acc[selection.category] = []
      }
      acc[selection.category].push(selection)
      return acc
    },
    {} as Record<string, CategorySelection[]>,
  )

  // Handle removing a category
  const handleRemoveCategory = async (fullPath: string) => {
    setCategoryToRemove(fullPath)
    setShowRemoveDialog(true)
  }

  // Confirm removal of a category
  const confirmRemoveCategory = async () => {
    if (!categoryToRemove) return

    setIsRemoving(true)
    try {
      const result = await removeBusinessCategory(categoryToRemove)

      if (result.success) {
        // Update local state
        const updatedCategories = selectedCategories.filter((cat) => cat.fullPath !== categoryToRemove)
        setSelectedCategories(updatedCategories)

        // Update localStorage
        localStorage.setItem("selectedCategories", JSON.stringify(updatedCategories))

        toast({
          title: "Success",
          description: "Category removed successfully",
        })
      } else {
        throw new Error(result.message || "Failed to remove category")
      }
    } catch (error) {
      console.error("Error removing category:", error)
      toast({
        title: "Error",
        description: "Failed to remove the category",
        variant: "destructive",
      })
    } finally {
      setIsRemoving(false)
      setShowRemoveDialog(false)
      setCategoryToRemove(null)
    }
  }

  // Replace the handleRemoveJob function
  const handleRemoveJob = async (jobId: string) => {
    const job = jobListings.find((j) => j.id === jobId)
    if (!job) return

    // Calculate what will be removed
    const zipCodes = job.serviceArea?.zipCodes?.length || 0
    const categories = job.categories?.length || 0
    const willRemoveFrom = [
      "Your business profile",
      "Job listings page",
      "AdBox popup",
      ...(job.serviceArea?.isNationwide ? ["Nationwide job index"] : []),
      ...(zipCodes > 0 ? [`${zipCodes} ZIP code indexes`] : []),
      ...(categories > 0 ? [`${categories} category indexes`] : []),
    ]

    setJobRemovalDetails({
      job,
      zipCodes,
      categories,
      willRemoveFrom,
    })
    setShowJobRemovalDetails(true)
  }

  // Replace the confirmRemoveJob function
  const confirmRemoveJob = async () => {
    if (!jobRemovalDetails) return

    const jobId = jobRemovalDetails.job.id
    setRemovingJobs((prev) => new Set([...prev, jobId]))
    setShowJobRemovalDetails(false)

    try {
      // Optimistic update - remove from UI immediately
      const jobToRemove = jobListings.find((job) => job.id === jobId)
      if (jobToRemove) {
        setRemovedJobs((prev) => new Map([...prev, [jobId, jobToRemove]]))
        setJobListings((prev) => prev.filter((job) => job.id !== jobId))
      }

      // Attempt actual removal
      const result = await removeJobListing(jobRemovalDetails.job.businessId, jobId)

      if (result.success) {
        toast({
          title: "✅ Job Removed Successfully",
          description: (
            <div className="space-y-2">
              <p>{result.message}</p>
              <button onClick={() => handleUndoJobRemoval(jobId)} className="text-sm underline hover:no-underline">
                Undo removal
              </button>
            </div>
          ),
          duration: 10000, // Longer duration for undo option
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("Error removing job listing:", error)

      // Rollback optimistic update
      const removedJob = removedJobs.get(jobId)
      if (removedJob) {
        setJobListings((prev) =>
          [...prev, removedJob].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return dateB - dateA
          }),
        )
        setRemovedJobs((prev) => {
          const newMap = new Map(prev)
          newMap.delete(jobId)
          return newMap
        })
      }

      toast({
        title: "❌ Removal Failed",
        description: (
          <div className="space-y-2">
            <p>Failed to remove job listing: {error instanceof Error ? error.message : "Unknown error"}</p>
            <button onClick={() => handleRetryJobRemoval(jobId)} className="text-sm underline hover:no-underline">
              Try again
            </button>
          </div>
        ),
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      setRemovingJobs((prev) => {
        const newSet = new Set(prev)
        newSet.delete(jobId)
        return newSet
      })
      setJobRemovalDetails(null)
    }
  }

  // Add these new helper functions
  const handleUndoJobRemoval = async (jobId: string) => {
    const removedJob = removedJobs.get(jobId)
    if (!removedJob) return

    try {
      // Re-add the job by calling saveJobListing with the existing data
      const formData = new FormData()
      formData.append(
        "jobData",
        JSON.stringify({
          jobTitle: removedJob.jobTitle,
          jobDescription: removedJob.jobDescription,
          qualifications: removedJob.qualifications,
          businessName: removedJob.businessName,
          businessDescription: removedJob.businessDescription,
          businessAddress: removedJob.businessAddress,
          workHours: removedJob.workHours,
          contactEmail: removedJob.contactEmail,
          contactName: removedJob.contactName,
          payType: removedJob.payType,
          hourlyMin: removedJob.hourlyMin,
          hourlyMax: removedJob.hourlyMax,
          salaryMin: removedJob.salaryMin,
          salaryMax: removedJob.salaryMax,
          otherPay: removedJob.otherPay,
          categories: removedJob.categories,
          benefits: removedJob.benefits,
          serviceArea: removedJob.serviceArea,
        }),
      )

      const result = await saveJobListing(formData, removedJob.businessId)

      if (result.success) {
        // Reload job listings to get the restored job
        const updatedJobs = await getBusinessJobs(removedJob.businessId)
        setJobListings(updatedJobs)

        setRemovedJobs((prev) => {
          const newMap = new Map(prev)
          newMap.delete(jobId)
          return newMap
        })

        toast({
          title: "✅ Job Restored",
          description: "Job listing has been restored successfully",
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "❌ Restore Failed",
        description: "Failed to restore job listing. You may need to recreate it manually.",
        variant: "destructive",
      })
    }
  }

  const handleRetryJobRemoval = (jobId: string) => {
    const job = jobListings.find((j) => j.id === jobId)
    if (job) {
      handleRemoveJob(jobId)
    }
  }

  // Update the job listing render section to show better loading states
  const renderJobListingCard = (job: JobListing) => {
    const isRemoving = removingJobs.has(job.id)

    return (
      <div
        key={job.id}
        className={`flex justify-between items-start p-4 bg-gray-50 rounded-lg transition-all ${isRemoving ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="flex-1">
          <h3 className="font-medium text-gray-800">{job.jobTitle}</h3>
          <p className="text-xs text-gray-500">
            Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Unknown date"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">
              {job.serviceArea?.isNationwide
                ? "Nationwide"
                : job.serviceArea?.zipCodes?.length
                  ? `${job.serviceArea.zipCodes.length} ZIP code${job.serviceArea.zipCodes.length !== 1 ? "s" : ""}`
                  : "No service area set"}
            </span>
          </div>
          {renderJobCategories(job.categories)}
        </div>
        <div className="flex items-center gap-2 ml-4">
          {renderJobStatus(job)}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRenewJob(job.id)}
            disabled={renewingJob === job.id || isRemoving}
            className="text-xs px-2 py-1 h-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            {renewingJob === job.id ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Renewing...
              </>
            ) : (
              <>
                <RotateCcwIcon className="h-3 w-3 mr-1" />
                Renew Listing
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveJob(job.id)}
            disabled={isRemoving}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  const handleReinstateCoupon = async (coupon: Coupon) => {
    setCouponToReinstate(coupon)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    setNewExpirationDate(futureDate.toISOString().split("T")[0])
    setShowReinstateDialog(true)
  }

  const confirmReinstateCoupon = async () => {
    if (!couponToReinstate || !newExpirationDate) return

    setReinstatingCoupon(couponToReinstate.id)
    try {
      const result = await reinstateCoupon(couponToReinstate.id, newExpirationDate)

      if (result.success) {
        setCoupons((prev) =>
          prev.map((coupon) =>
            coupon.id === couponToReinstate.id ? { ...coupon, expirationDate: newExpirationDate } : coupon,
          ),
        )

        toast({
          title: "Success",
          description: "Coupon reinstated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reinstate coupon",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error reinstating coupon:", error)
      toast({
        title: "Error",
        description: "Failed to reinstate coupon",
        variant: "destructive",
      })
    } finally {
      setReinstatingCoupon(null)
      setShowReinstateDialog(false)
      setCouponToReinstate(null)
      setNewExpirationDate("")
    }
  }

  const renderCouponStatus = (coupon: Coupon) => {
    const daysUntilExpiration = getDaysUntilExpirationClient(coupon.expirationDate)
    const isExpired = isCouponExpiredClient(coupon.expirationDate)

    if (isExpired) {
      return (
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <Clock className="h-3 w-3 mr-1" />
            Expired
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleReinstateCoupon(coupon)}
            className="text-xs px-2 py-1 h-auto"
          >
            <RotateCcwIcon className="h-3 w-3 mr-1" />
            Reinstate
          </Button>
        </div>
      )
    }

    if (daysUntilExpiration <= 7) {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            daysUntilExpiration <= 3 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
          }`}
        >
          <Clock className="h-3 w-3 mr-1" />
          {daysUntilExpiration === 0
            ? "Expires today"
            : daysUntilExpiration === 1
              ? "Expires tomorrow"
              : `${daysUntilExpiration} days left`}
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Calendar className="h-3 w-3 mr-1" />
        {daysUntilExpiration} days left
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const [year, month, day] = dateString.split("-")
    return `${month}/${day}/${year}`
  }

  // Calculate 5-star counts for each rating category
  const calculateFiveStarCounts = () => {
    const counts = {
      serviceQuality: 0,
      costTransparency: 0,
      communication: 0,
      expertise: 0,
      dependability: 0,
      professionalism: 0,
    }

    reviews.forEach((review) => {
      if (review.ratings) {
        if (review.ratings.serviceQuality === 5) counts.serviceQuality++
        if (review.ratings.costTransparency === 5) counts.costTransparency++
        if (review.ratings.communication === 5) counts.communication++
        if (review.ratings.expertise === 5) counts.expertise++
        if (review.ratings.dependability === 5) counts.dependability++
        if (review.ratings.professionalism === 5) counts.professionalism++
      }
    })

    return counts
  }

  const fiveStarCounts = calculateFiveStarCounts()

  // Sample data for awards with silver versions when 5 five-star reviews are reached
  const awards = [
    {
      id: 5,
      name: "Quality",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/quality-QjhKw0vxK2AcjsXlQ5zH9bUet8u1Fu.png",
      silverImage: getCloudflareImageUrl("754573e6-6f05-415f-6cdb-51e905503700"),
      hiResImage: getCloudflareImageUrl("754573e6-6f05-415f-6cdb-51e905503700", "public"), // Full resolution
      unlocked: false,
    },
    {
      id: 6,
      name: "On Budget",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/onbudget-lT4a3ega5RtBQbrWCP6lhmC7pPe33A.png",
      silverImage: getCloudflareImageUrl("9420a0c8-fbd3-4e9d-262e-72f75ab20800"),
      hiResImage: getCloudflareImageUrl("9420a0c8-fbd3-4e9d-262e-72f75ab20800", "public"),
      unlocked: false,
    },
    {
      id: 8,
      name: "Keeping Informed",
      image:
        "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/keepinginformed02-r27QrB4vwJ2IHUtyACOfiLtxnzjnHw.png",
      silverImage: getCloudflareImageUrl("2f5566e7-8eaa-41b6-d165-0a5065cc9100"),
      hiResImage: getCloudflareImageUrl("2f5566e7-8eaa-41b6-d165-0a5065cc9100", "public"),
      unlocked: false,
    },
    {
      id: 9,
      name: "Expert",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/Expert-QVOr3upidxlzQ8tODpAEbNyCaHmZkg.png",
      silverImage: getCloudflareImageUrl("64116b46-cb9e-416d-26bf-08a825b15400"),
      hiResImage: getCloudflareImageUrl("64116b46-cb9e-416d-26bf-08a825b15400", "public"),
      unlocked: false,
    },
    {
      id: 10,
      name: "Dependability",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/dependability-3uL8ZAla0UzLWdvoQ8nyLH2JI4lPzi.png",
      silverImage: getCloudflareImageUrl("47db0bd7-4db1-4529-aee9-2d831445c200"),
      hiResImage: getCloudflareImageUrl("47db0bd7-4db1-4529-aee9-2d831445c200", "public"),
      unlocked: false,
    },
    {
      id: 11,
      name: "Customer Service",
      image:
        "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/CustomerServic-2-eVctv27m01myFPW9mAhgfHGtoECddh.png",
      silverImage: getCloudflareImageUrl("4386e640-8479-491a-310f-1b8d7c626300"),
      hiResImage: getCloudflareImageUrl("4386e640-8479-491a-310f-1b8d7c626300", "public"),
      unlocked: false,
    },
  ]

  // Calculate average ratings from reviews
  const calculateAverageRatings = () => {
    if (reviews.length === 0) {
      return {
        serviceQuality: 0,
        costTransparency: 0,
        communication: 0,
        expertise: 0,
        dependability: 0,
        professionalism: 0,
      }
    }

    const totals = {
      serviceQuality: 0,
      costTransparency: 0,
      communication: 0,
      expertise: 0,
      dependability: 0,
      professionalism: 0,
    }

    reviews.forEach((review) => {
      if (review.ratings) {
        totals.serviceQuality += review.ratings.serviceQuality || 0
        totals.costTransparency += review.ratings.costTransparency || 0
        totals.communication += review.ratings.communication || 0
        totals.expertise += review.ratings.expertise || 0
        totals.dependability += review.ratings.dependability || 0
        totals.professionalism += review.ratings.professionalism || 0
      }
    })

    return {
      serviceQuality: totals.serviceQuality / reviews.length,
      costTransparency: totals.costTransparency / reviews.length,
      communication: totals.communication / reviews.length,
      expertise: totals.expertise / reviews.length,
      dependability: totals.dependability / reviews.length,
      professionalism: totals.professionalism / reviews.length,
    }
  }

  const averageRatings = calculateAverageRatings()

  // Customer ratings with actual data from reviews
  const ratings = [
    {
      question: "How would you rate the quality of the service you received?",
      rating: averageRatings.serviceQuality,
      key: "serviceQuality",
      fiveStarCount: fiveStarCounts.serviceQuality,
    },
    {
      question: "Was the final cost reflective of the quoted cost or were added charges reasonable and explained?",
      rating: averageRatings.costTransparency,
      key: "costTransparency",
      fiveStarCount: fiveStarCounts.costTransparency,
    },
    {
      question: "How would you rate the communication throughout the process?",
      rating: averageRatings.communication,
      key: "communication",
      fiveStarCount: fiveStarCounts.communication,
    },
    {
      question: "Was your hire an expert in their field?",
      rating: averageRatings.expertise,
      key: "expertise",
      fiveStarCount: fiveStarCounts.expertise,
    },
    {
      question: "Was your hire dependable and true to their word?",
      rating: averageRatings.dependability,
      key: "dependability",
      fiveStarCount: fiveStarCounts.dependability,
    },
    {
      question: "Was your hire professional and courteous?",
      rating: averageRatings.professionalism,
      key: "professionalism",
      fiveStarCount: fiveStarCounts.professionalism,
    },
  ]

  // Updated clicks statistics with real data and category labels
  const clicksStats = [
    {
      title: "Profile Views",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.profileViews?.toString() || "0",
    },
    {
      title: "Video Views",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.videoViews?.toString() || "0",
    },
    {
      title: "Photo Album Views",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.photoAlbumClicks?.toString() || "0",
    },
    {
      title: "Coupons Clipped",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.couponClicks?.toString() || "0",
    },
    {
      title: "Job Opportunity Views",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.jobClicks?.toString() || "0",
    },
    {
      title: "Phone Number Clicks",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.phoneClicks?.toString() || "0",
    },
    {
      title: "Website Clicks",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.websiteClicks?.toString() || "0",
    },
  ]

  const handleRenewJob = async (jobId: string) => {
    setRenewingJob(jobId)
    try {
      // Find the job to get its business ID
      const jobToRenew = jobListings.find((job) => job.id === jobId)
      if (!jobToRenew) {
        throw new Error("Job listing not found")
      }

      const result = await renewJobListing(jobToRenew.businessId, jobId)

      if (result.success) {
        // Reload job listings to get updated data
        const updatedJobs = await getBusinessJobs(jobToRenew.businessId)
        setJobListings(updatedJobs)

        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error renewing job listing:", error)
      toast({
        title: "Error",
        description: "Failed to renew job listing",
        variant: "destructive",
      })
    } finally {
      setRenewingJob(null)
    }
  }

  const renderJobStatus = (job: JobListing) => {
    // Use the same timezone-aware logic as the server functions
    let expirationDate: Date

    if (job.expiresAt) {
      expirationDate = new Date(job.expiresAt)
    } else {
      // Calculate expiration from creation date if expiresAt is missing
      const createdDate = job.createdAt ? new Date(job.createdAt) : new Date()
      expirationDate = new Date(createdDate)
      expirationDate.setDate(expirationDate.getDate() + 5)
    }

    // Set expiration to END of day in local timezone
    expirationDate.setHours(23, 59, 59, 999)

    // Get current time in local timezone
    const now = new Date()

    // Check if expired
    const expired = now > expirationDate

    // Calculate days until expiration
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expDate = new Date(expirationDate)
    expDate.setHours(0, 0, 0, 0)
    const diffTime = expDate.getTime() - today.getTime()
    const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (expired) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <Clock className="h-3 w-3 mr-1" />
          Expired
        </span>
      )
    }

    if (daysUntilExpiration <= 1) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          {daysUntilExpiration === 0 ? "Expires today" : "Expires tomorrow"}
        </span>
      )
    }

    if (daysUntilExpiration <= 2) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          {daysUntilExpiration} days left
        </span>
      )
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <Calendar className="h-3 w-3 mr-1" />
        {daysUntilExpiration} days left
      </span>
    )
  }

  const handleAddAwardToPhotos = async (award: any, isUnlocked: boolean) => {
    if (!businessId) {
      toast({
        title: "Error",
        description: "No business ID found",
        variant: "destructive",
      })
      return
    }

    setAddingAwardToPhotos(award.id)

    try {
      // Use the hi-res image URL for the photo album
      const imageUrl = isUnlocked ? award.hiResImage : award.image

      // Fetch the image
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }

      const blob = await response.blob()

      // Create a file from the blob
      const fileName = `${award.name.toLowerCase().replace(/\s+/g, "-")}-award-${isUnlocked ? "silver" : "bronze"}.png`
      const file = new File([blob], fileName, { type: blob.type })

      // Create form data
      const formData = new FormData()
      formData.append("businessId", businessId)
      formData.append("photo", file)
      formData.append("tags", JSON.stringify(["award", award.name.toLowerCase(), isUnlocked ? "silver" : "bronze"]))

      // Upload the photo
      const result = await uploadPhoto(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: `${award.name} award added to your photo album!`,
        })
      } else {
        throw new Error(result.error || "Failed to add award to photos")
      }
    } catch (error) {
      console.error("Error adding award to photos:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add award to photos",
        variant: "destructive",
      })
    } finally {
      setAddingAwardToPhotos(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <Image
                src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/stats002-gW6ZaTQQkxNHACfsxA0LoZMnih5oax.png"
                alt="Statistics"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Statistics Dashboard</h1>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="clicks">Clicks</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="outreach">Outreach</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-teal-700">Your Selected Categories & Subcategories</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/business-focus")}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage Categories</span>
                  <span className="sm:hidden">Manage</span>
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2">Loading your categories...</span>
                  </div>
                ) : Object.keys(groupedCategories).length > 0 ? (
                  <div className="space-y-6">
                    {Object.entries(groupedCategories).map(([category, selections], index) => (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <div className="flex justify-between items-center p-4 bg-gray-50">
                          <h3 className="text-lg font-medium">{category}</h3>
                          <span className="text-teal-600 font-bold">{selections.length} selections</span>
                        </div>
                        <div className="p-4">
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Subcategories:</h4>
                          <div className="grid grid-cols-1 gap-3">
                            {selections.map((selection, subIndex) => (
                              <div key={subIndex} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm">{selection.subcategory}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-gray-600">0 views</span>
                                  <button
                                    onClick={() => handleRemoveCategory(selection.fullPath)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                    aria-label="Remove category"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <AlertCircle className="h-12 w-12 text-amber-500" />
                    </div>
                    <p className="text-gray-500 mb-4">No categories selected yet.</p>
                    <Button onClick={() => router.push("/business-focus")} className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Select Categories
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-teal-700">Your Keywords</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/business-focus")}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage Keywords</span>
                  <span className="sm:hidden">Manage</span>
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isKeywordsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading your keywords...</span>
                  </div>
                ) : keywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <AlertCircle className="h-12 w-12 text-amber-500" />
                    </div>
                    <p className="text-gray-500 mb-4">No keywords added yet.</p>
                    <Button onClick={() => router.push("/business-focus")} className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Add Keywords
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-teal-700">Your Service Area</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/business-focus")}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Manage Service Area</span>
                  <span className="sm:hidden">Manage</span>
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isZipCodesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading your service area...</span>
                  </div>
                ) : isNationwide ? (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <MapPin className="h-12 w-12 text-green-500" />
                    </div>
                    <p className="text-lg font-medium text-green-700">Nationwide Service</p>
                    <p className="text-gray-500">You serve customers across the entire United States</p>
                  </div>
                ) : zipCodes.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        You serve <span className="font-medium">{zipCodes.length}</span> ZIP code
                        {zipCodes.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      {zipCodes.map((zipCode, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                          <div className="flex flex-col">
                            <span className="font-mono font-medium">{zipCode.zip}</span>
                            {zipCode.city && zipCode.state && (
                              <span className="text-xs text-gray-500">
                                {zipCode.city}, {zipCode.state}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <AlertCircle className="h-12 w-12 text-amber-500" />
                    </div>
                    <p className="text-gray-500 mb-4">No service area defined yet.</p>
                    <Button onClick={() => router.push("/business-focus")} className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Set Service Area
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-teal-700">Your Job Listings</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/job-listing")}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Job Listing</span>
                  <span className="sm:hidden">Add Job</span>
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isJobsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading your job listings...</span>
                  </div>
                ) : jobListings.length > 0 ? (
                  <div className="space-y-3">{jobListings.map((job) => renderJobListingCard(job))}</div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <AlertCircle className="h-12 w-12 text-amber-500" />
                    </div>
                    <p className="text-gray-500 mb-4">No job listings created yet.</p>
                    <Button onClick={() => router.push("/job-listing")} className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Create Job Listing
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-teal-700">Your Coupons</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/coupons")}
                  className="flex items-center gap-1"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Coupon</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isCouponsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading your coupons...</span>
                  </div>
                ) : coupons.length > 0 ? (
                  <div className="space-y-3">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{coupon.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{coupon.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Expires: {formatDate(coupon.expirationDate)}</p>
                        </div>
                        <div className="ml-4">{renderCouponStatus(coupon)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <AlertCircle className="h-12 w-12 text-amber-500" />
                    </div>
                    <p className="text-gray-500 mb-4">No coupons created yet.</p>
                    <Button onClick={() => router.push("/coupons")} className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      Create Coupon
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clicks Tab */}
          <TabsContent value="clicks" className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Click Analytics</h2>
              <Button
                variant="outline"
                onClick={handleResetAnalytics}
                disabled={isResettingAnalytics}
                className="flex items-center gap-2 bg-transparent"
              >
                {isResettingAnalytics ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Reset Analytics
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clicksStats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{stat.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600 mb-2">{stat.yourStats}x</div>
                      <div className="text-sm text-gray-500">Total Clicks</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ZIP Code Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>ZIP Code Analytics - Profile Views</CardTitle>
                <CardDescription>ZIP codes where users have viewed your business profile</CardDescription>
              </CardHeader>
              <CardContent>
                {isZipCodeAnalyticsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading ZIP code analytics...</span>
                  </div>
                ) : zipCodeAnalytics.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {zipCodeAnalytics
                        .filter((zipData) => zipData.count > 0) // Only show ZIP codes with profile views
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 12)
                        .map((zipData) => (
                          <div key={zipData.zipCode} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-mono font-medium">{zipData.zipCode}</span>
                              <span className="text-sm font-bold text-blue-600">{zipData.count}</span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>Profile Views: {zipData.count}</div>
                              {zipData.city && zipData.state && (
                                <div className="text-xs text-gray-400">
                                  {zipData.city}, {zipData.state}
                                </div>
                              )}
                              {zipData.lastViewed && (
                                <div className="text-xs text-gray-400">
                                  Last viewed: {new Date(zipData.lastViewed).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                    {zipCodeAnalytics.filter((zipData) => zipData.count > 0).length > 12 && (
                      <p className="text-sm text-gray-500 text-center">
                        Showing top 12 ZIP codes. Total:{" "}
                        {zipCodeAnalytics.filter((zipData) => zipData.count > 0).length} ZIP codes with profile views.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No profile views from any ZIP codes yet.</p>
                    <p className="text-sm text-gray-400 mt-2">
                      ZIP codes will appear here when users view your business profile.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overall Rating Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Rating Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {isReviewsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading rating summary...</span>
                    </div>
                  ) : reviews.length > 0 ? (
                    <div className="text-center">
                      <div className="text-6xl font-bold text-blue-600 mb-2">
                        {(
                          reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0) / reviews.length
                        ).toFixed(1)}
                      </div>
                      <div className="flex justify-center items-center gap-2 mb-2">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className={`h-6 w-6 ${
                              index <
                              Math.floor(
                                reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0) / reviews.length,
                              )
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-lg text-gray-600">
                        Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No reviews yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Reviews will appear here when customers leave feedback.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Ratings */}
              <Card>
                <CardHeader>
                  <CardTitle>Customer Ratings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isReviewsLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading ratings...</span>
                    </div>
                  ) : (
                    ratings.map((rating, index) => (
                      <div key={index} className="space-y-2">
                        <p className="text-sm text-gray-600">{rating.question}</p>
                        <StarRating rating={rating.rating} fiveStarCount={rating.fiveStarCount} />
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Awards */}
              <Card>
                <CardHeader>
                  <CardTitle>Awards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {awards.map((award, index) => {
                      const fiveStarCount = Object.values(fiveStarCounts)[index] || 0
                      const isUnlocked = fiveStarCount >= 5

                      return (
                        <div key={award.id} className="text-center">
                          <div
                            className={`relative mx-auto mb-2 ${!isUnlocked ? "opacity-30 grayscale" : ""} ${
                              award.name === "Expert" ? "w-[72px] h-[72px]" : "w-20 h-20"
                            }`}
                          >
                            <Image
                              src={isUnlocked ? award.silverImage : award.image}
                              alt={award.name}
                              fill
                              className="object-contain"
                            />
                            {!isUnlocked && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                  Locked
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium">{award.name}</p>
                          {isUnlocked ? (
                            <p className="text-xs text-green-600 font-medium">Silver Unlocked!</p>
                          ) : (
                            <p className="text-xs text-gray-500">{fiveStarCount}/5 ⭐</p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddAwardToPhotos(award, isUnlocked)}
                            disabled={addingAwardToPhotos === award.id}
                            className="mt-2 text-xs px-2 py-1 h-auto"
                          >
                            {addingAwardToPhotos === award.id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Adding...
                              </>
                            ) : (
                              "Add to Photos"
                            )}
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Award Tiers:</strong> 5 five-star reviews = Silver • 10 five-star reviews = Bronze • 25
                      five-star reviews = Gold
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Outreach Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Email Marketing</h3>
                    <p className="text-gray-600 mb-4">Send newsletters and promotions to your customers.</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Coming Soon
                    </Button>
                  </div>
                  <div className="p-6 border rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Social Media</h3>
                    <p className="text-gray-600 mb-4">Share your business updates on social platforms.</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Coming Soon
                    </Button>
                  </div>
                  <div className="p-6 border rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Customer Surveys</h3>
                    <p className="text-gray-600 mb-4">Collect feedback from your customers.</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Coming Soon
                    </Button>
                  </div>
                  <div className="p-6 border rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Referral Program</h3>
                    <p className="text-gray-600 mb-4">Encourage customers to refer new business.</p>
                    <Button variant="outline" className="w-full bg-transparent">
                      Coming Soon
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MainFooter />

      {/* Remove Category Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this category? This action cannot be undone and will remove your business
              from this category's listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveCategory} disabled={isRemoving} className="bg-red-600">
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Job Removal Details Dialog */}
      <AlertDialog open={showJobRemovalDetails} onOpenChange={setShowJobRemovalDetails}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Remove Job Listing
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You're about to remove <strong>"{jobRemovalDetails?.job.jobTitle}"</strong>
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-amber-800 mb-2">This will remove the job from:</p>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {jobRemovalDetails?.willRemoveFrom.map((location, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-amber-600 rounded-full"></span>
                        {location}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveJob} className="bg-red-600 hover:bg-red-700">
              Remove Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reinstate Coupon Dialog */}
      <Dialog open={showReinstateDialog} onOpenChange={setShowReinstateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reinstate Coupon</DialogTitle>
            <DialogDescription>
              Set a new expiration date for "{couponToReinstate?.title}" to make it active again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newExpirationDate">New Expiration Date</Label>
              <Input
                id="newExpirationDate"
                type="date"
                value={newExpirationDate}
                onChange={(e) => setNewExpirationDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReinstateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmReinstateCoupon}
              disabled={!newExpirationDate || reinstatingCoupon === couponToReinstate?.id}
            >
              {reinstatingCoupon === couponToReinstate?.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Reinstating...
                </>
              ) : (
                "Reinstate Coupon"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
