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
import { Loader2, PlusCircle, X, Edit, AlertCircle, Trash2, MapPin } from "lucide-react"
import type { CategorySelection } from "@/components/category-selector"
import { getBusinessCategories, removeBusinessCategory } from "@/app/actions/category-actions"
import { useToast } from "@/components/ui/use-toast"
import { getBusinessKeywords } from "@/app/actions/keyword-actions"
import { Badge } from "@/components/ui/badge"
import { type JobListing, getBusinessJobs, removeJobListing } from "@/app/actions/job-actions"
import { getBusinessZipCodes } from "@/app/actions/zip-code-actions"
import type { ZipCodeData } from "@/lib/zip-code-types"

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

  useEffect(() => {
    async function loadJobListings() {
      setIsJobsLoading(true)
      try {
        // For now, use a hardcoded business ID - in a real application,
        // this would come from the authenticated user's session
        const businessId = "demo-business"

        const jobs = await getBusinessJobs(businessId)
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

  const handleRemoveJob = async (jobId: string) => {
    setJobToRemove(jobId)
    setShowRemoveJobDialog(true)
  }

  // Add this function to confirm job removal
  const confirmRemoveJob = async () => {
    if (!jobToRemove) return

    setIsRemovingJob(true)
    try {
      // For now, use a hardcoded business ID - in a real application,
      // this would come from the authenticated user's session
      const businessId = "demo-business"

      const result = await removeJobListing(businessId, jobToRemove)

      if (result.success) {
        // Update local state
        const updatedJobs = jobListings.filter((job) => job.id !== jobToRemove)
        setJobListings(updatedJobs)

        toast({
          title: "Success",
          description: "Job listing removed successfully",
        })
      } else {
        throw new Error(result.message || "Failed to remove job listing")
      }
    } catch (error) {
      console.error("Error removing job listing:", error)
      toast({
        title: "Error",
        description: "Failed to remove the job listing",
        variant: "destructive",
      })
    } finally {
      setIsRemovingJob(false)
      setShowRemoveJobDialog(false)
      setJobToRemove(null)
    }
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

  // Sample data for clicks statistics
  const clicksStats = [
    {
      title: "Profile Views",
      yourStats: "0",
      competitorStats: "145",
    },
    {
      title: "Video Views",
      yourStats: "0",
      competitorStats: "124",
    },
    {
      title: "Coupons Clipped",
      yourStats: "0",
      competitorStats: "37",
    },
    {
      title: "Job Opportunity Views",
      yourStats: "0",
      competitorStats: "43",
    },
    {
      title: "Photo Album Views",
      yourStats: "0",
      competitorStats: "89",
    },
    {
      title: "Phone Number Clicks",
      yourStats: "0",
      competitorStats: "56",
    },
    {
      title: "Website Clicks",
      yourStats: "0",
      competitorStats: "72",
    },
  ]

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
                  <div className="space-y-4">
                    {jobListings.map((job) => (
                      <div key={job.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="font-medium text-gray-800">{job.jobTitle}</h3>
                          <p className="text-xs text-gray-500">
                            Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Unknown date"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveJob(job.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
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

      {/* Confirmation Dialog for Job Removal */}
      <AlertDialog open={showRemoveJobDialog} onOpenChange={setShowRemoveJobDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Job Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this job listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovingJob}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveJob}
              disabled={isRemovingJob}
              className="bg-red-500 hover:bg-red-600"
            >
              {isRemovingJob ? (
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
    </div>
  )
}
