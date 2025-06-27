"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import Link from "next/link"
import { Loader2, PlusCircle, X, Edit, AlertCircle, Trash2, MapPin, Tag, RefreshCw } from "lucide-react"
import type { CategorySelection } from "@/components/category-selector"
import { getBusinessCategories, removeBusinessCategory } from "@/app/actions/category-actions"
import { useToast } from "@/components/ui/use-toast"
import { getBusinessKeywords } from "@/app/actions/keyword-actions"
import { Badge } from "@/components/ui/badge"
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
import { getBusinessAnalytics, resetAllAnalytics, type AnalyticsData } from "@/app/actions/analytics-actions"
import { Calendar, Clock, RotateCcw } from "lucide-react"
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
  const [clickAnalytics, setClickAnalytics] = useState<AnalyticsData | null>(null)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true)
  const [isResettingAnalytics, setIsResettingAnalytics] = useState(false)

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

  // Load analytics data
  useEffect(() => {
    async function loadAnalytics() {
      setIsAnalyticsLoading(true)
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

        const result = await getBusinessAnalytics(currentBusinessId)
        setClickAnalytics(result)
      } catch (error) {
        console.error("Error loading analytics:", error)
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        })
      } finally {
        setIsAnalyticsLoading(false)
      }
    }

    loadAnalytics()
  }, [businessId])

  // Handle analytics reset
  const handleResetAnalytics = async () => {
    if (!businessId) return

    setIsResettingAnalytics(true)
    try {
      await resetAllAnalytics()
      // Reset local state
      setClickAnalytics({
        profileViews: 0,
        photoAlbumClicks: 0,
        couponClicks: 0,
        jobClicks: 0,
        phoneClicks: 0,
        websiteClicks: 0,
      })
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
  }, [])

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
  }, [])

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
  }, [])

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
  }, [])

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
  }, [])

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
                <RotateCcw className="h-3 w-3 mr-1" />
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
            <RotateCcw className="h-3 w-3 mr-1" />
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

  // Sample data for awards
  const awards = [
    {
      id: 1,
      name: "5 Reviews",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/5-XXbasTPRdhijVULbzWLdhhO5VXLBIl.png",
      unlocked: false,
    },
    {
      id: 2,
      name: "10 Reviews",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/10-mCfMVYva2OJFWDVunu4j7xQxDPLI30.png",
      unlocked: false,
    },
    {
      id: 3,
      name: "25 Reviews",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/25-4-tOMvN86hcimeoIQC4tpVGuo2nqtoJP.png",
      unlocked: false,
    },
    {
      id: 4,
      name: "50 Reviews",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/50-2-tgvmD4HzJ11m4h3EmJczCHMAyXQKIt.png",
      unlocked: false,
    },
    {
      id: 5,
      name: "Quality",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/quality-QjhKw0vxK2AcjsXlQ5zH9bUet8u1Fu.png",
      unlocked: false,
    },
    {
      id: 6,
      name: "On Budget",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/onbudget-lT4a3ega5RtBQbrWCP6lhmC7pPe33A.png",
      unlocked: false,
    },
    {
      id: 7,
      name: "Kindness",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/Kindness-HJQxl9RBay08M467uuvppCrPPYUww5.png",
      unlocked: false,
    },
    {
      id: 8,
      name: "Keeping Informed",
      image:
        "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/keepinginformed02-r27QrB4vwJ2IHUtyACOfiLtxnzjnHw.png",
      unlocked: false,
    },
    {
      id: 9,
      name: "Expert",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/Expert-QVOr3upidxlzQ8tODpAEbNyCaHmZkg.png",
      unlocked: false,
    },
    {
      id: 10,
      name: "Dependability",
      image: "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/dependability-3uL8ZAla0UzLWdvoQ8nyLH2JI4lPzi.png",
      unlocked: false,
    },
    {
      id: 11,
      name: "Customer Service",
      image:
        "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/CustomerServic-2-eVctv27m01myFPW9mAhgfHGtoECddh.png",
      unlocked: false,
    },
  ]

  // Sample data for customer ratings
  const ratings = [
    {
      question: "How would you rate the quality of the service you received?",
      rating: "Not available/5",
    },
    {
      question: "Was the final cost reflective of the quoted cost or were added charges reasonable and explained?",
      rating: "Not available/5",
    },
    {
      question: "How would you rate the communication throughout the process?",
      rating: "Not available/5",
    },
    {
      question: "Was your hire an expert in their field?",
      rating: "Not available/5",
    },
    {
      question: "Was your hire dependable and true to their word?",
      rating: "Not available/5",
    },
    {
      question: "Was your hire professional and courteous?",
      rating: "Not available/5",
    },
  ]

  // Updated clicks statistics with real data
  const clicksStats = [
    {
      title: "Profile Views",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.profileViews?.toString() || "0",
      competitorStats: "145",
    },
    {
      title: "Video Views",
      yourStats: "0",
      competitorStats: "124",
    },
    {
      title: "Coupons Clipped",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.couponClicks?.toString() || "0",
      competitorStats: "37",
    },
    {
      title: "Job Opportunity Views",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.jobClicks?.toString() || "0",
      competitorStats: "43",
    },
    {
      title: "Photo Album Views",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.photoAlbumClicks?.toString() || "0",
      competitorStats: "89",
    },
    {
      title: "Phone Number Clicks",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.phoneClicks?.toString() || "0",
      competitorStats: "56",
    },
    {
      title: "Website Clicks",
      yourStats: isAnalyticsLoading ? "Loading..." : clickAnalytics?.websiteClicks?.toString() || "0",
      competitorStats: "72",
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

  // Function to render job categories as badges
  const renderJobCategories = (categories: string[]) => {
    if (!categories || categories.length === 0) {
      return <span className="text-xs text-gray-500 italic">No categories</span>
    }

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {categories.map((category, index) => (
          <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
            <Tag className="h-3 w-3 mr-1" />
            {category}
          </Badge>
        ))}
      </div>
    )
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
                  <div className="text-center py-4">
                    <Badge className="px-3 py-1.5 text-sm bg-green-100 text-green-800 hover:bg-green-100">
                      Nationwide Service
                    </Badge>
                    <p className="mt-2 text-gray-600">Your business serves customers nationwide</p>
                  </div>
                ) : zipCodes.length > 0 ? (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-teal-600" />
                      <h3 className="font-medium">Your service covers {zipCodes.length} ZIP codes</h3>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 border rounded-lg">
                      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {zipCodes.map((zip) => (
                          <li key={zip.zip} className="px-3 py-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium">{zip.zip}</span>
                            {zip.city && zip.state && (
                              <span className="text-xs text-gray-500 block truncate">
                                {zip.city}, {zip.state}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
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
                      Define Service Area
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
                  <span className="sm:hidden">Add</span>
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isJobsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading your job listings...</span>
                  </div>
                ) : jobListings.length > 0 ? (
                  <div className="space-y-4">{jobListings.map(renderJobListingCard)}</div>
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
                  <span className="hidden sm:inline">Manage Coupons</span>
                  <span className="sm:hidden">Manage</span>
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isCouponsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2">Loading your coupons...</span>
                  </div>
                ) : coupons.length > 0 ? (
                  <div className="space-y-4">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">{coupon.title}</h3>
                          <p className="text-sm text-gray-600">{coupon.discount}</p>
                          <p className="text-xs text-gray-500">
                            Valid: {formatDate(coupon.startDate)} - {formatDate(coupon.expirationDate)}
                          </p>
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

            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-teal-700">Awards</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <h3 className="text-lg font-medium mb-4 text-center">Unlocked Awards Appear in Gold</h3>
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                  {awards.map((award) => (
                    <div key={award.id} className="flex flex-col items-center">
                      <div
                        className={`relative w-24 h-24 md:w-32 md:h-32 ${award.unlocked ? "" : "filter grayscale opacity-60"} transition-all hover:scale-105`}
                      >
                        <Image
                          src={award.image || "/placeholder.svg"}
                          alt={award.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <span className="text-xs mt-2 text-center text-gray-600 max-w-[100px]">{award.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-6">
                  <Link href="/awards-explained">
                    <Button className="bg-amber-400 hover:bg-amber-500 text-black font-medium">Awards Explained</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-teal-700">Your Customer Ratings</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  {ratings.map((item, index) => (
                    <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                      <h3 className="text-lg font-medium mb-2">{item.question}</h3>
                      <p>
                        Your average rating is: <span className="text-red-500 font-medium">{item.rating}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Clicks Tab */}
          <TabsContent value="clicks" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              {/* Analytics Reset Button */}
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetAnalytics}
                  disabled={isResettingAnalytics}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {isResettingAnalytics ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Reset Analytics
                    </>
                  )}
                </Button>
              </div>

              {clicksStats.map((stat, index) => (
                <Card key={index} className="mb-4">
                  <CardHeader
                    className={`${index % 2 === 0 ? "bg-gradient-to-r from-teal-50 to-teal-100" : "bg-white"} border-b`}
                  >
                    <CardTitle className="text-teal-700">{stat.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700 font-medium">Your Stats:</p>
                        <p className="text-2xl font-bold text-teal-600">{stat.yourStats}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700 font-medium">Your Leading Competitor's Stats:</p>
                        <p className="text-2xl font-bold text-gray-600">{stat.competitorStats}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details">
            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-teal-700">Detailed Analytics</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <p>
                  Add real-time updated pie chart of top 5 zip codes searches that lead to their page. Make suggestions
                  of surrounding zip codes to add for more traffic.
                </p>
                <p>Add a line graph of interactions with the ad over time.</p>
                <p>Bar graph of "Your Services" mostly searched.</p>
                <p>Outside links that lead to the ad. Suggestions on where competitors are getting links.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach">
            <Card>
              <CardHeader className="bg-gradient-to-r from-teal-50 to-teal-100 border-b">
                <CardTitle className="text-teal-700">Outreach Tools</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="mb-4">
                  This section will provide tools to reach out to potential customers who have interacted with your
                  content.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Masked email of registered users that have interacted with your site</li>
                  <li>Email output that sends messages to those email addresses</li>
                  <li>Change/add/delete zip codes and services</li>
                  <li>Directions on how to add links from other sites</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <MainFooter />

      {/* Confirmation Dialog for Category Removal */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveCategory}
              disabled={isRemoving}
              className="bg-red-500 hover:bg-red-600"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Job Removal Dialog */}
      <Dialog open={showJobRemovalDetails} onOpenChange={setShowJobRemovalDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-6 w-6" />
              Remove Job Listing
            </DialogTitle>
            <DialogDescription>This will permanently remove the job listing from all locations.</DialogDescription>
          </DialogHeader>

          {jobRemovalDetails && (
            <div className="py-4 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{jobRemovalDetails.job.jobTitle}</h4>
                <p className="text-sm text-gray-600">{jobRemovalDetails.job.businessName}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>{jobRemovalDetails.zipCodes} ZIP codes</span>
                  <span>{jobRemovalDetails.categories} categories</span>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-medium text-sm">This will remove the job from:</h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  {jobRemovalDetails.willRemoveFrom.map((location, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                      {location}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> You can undo this action for a short time after removal.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setShowJobRemovalDetails(false)}>
              Cancel
            </Button>
            <Button onClick={confirmRemoveJob} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Job Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reinstate Coupon Dialog */}
      <Dialog open={showReinstateDialog} onOpenChange={setShowReinstateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-700">
              <RotateCcw className="h-6 w-6" />
              Reinstate Coupon
            </DialogTitle>
            <DialogDescription>Set a new expiration date for this coupon to make it active again.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {couponToReinstate && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{couponToReinstate.title}</h4>
                <p className="text-sm text-gray-600">{couponToReinstate.discount}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="newExpirationDate">New Expiration Date</Label>
              <Input
                id="newExpirationDate"
                type="date"
                value={newExpirationDate}
                onChange={(e) => setNewExpirationDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowReinstateDialog(false)
                setCouponToReinstate(null)
                setNewExpirationDate("")
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReinstateCoupon}
              disabled={reinstatingCoupon === couponToReinstate?.id || !newExpirationDate}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {reinstatingCoupon === couponToReinstate?.id ? (
                <>
                  <span className="mr-2">Reinstating...</span>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reinstate Coupon
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
