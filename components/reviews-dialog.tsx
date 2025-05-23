"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { type Review, getBusinessReviews } from "@/app/actions/review-actions"
import { ReviewForm } from "@/components/review-form"
import { ReviewLoginDialog } from "@/components/review-login-dialog"
import { useToast } from "@/components/ui/use-toast"
import { StarRating } from "./star-rating"
import { Loader2 } from "lucide-react"

interface ReviewsDialogProps {
  isOpen: boolean
  onClose: () => void
  providerName: string
  businessId: string
  reviews?: any[]
  // Add page context to track where reviews are being viewed from
  pageContext?: string
}

export function ReviewsDialog({
  isOpen,
  onClose,
  providerName,
  businessId,
  reviews = [],
  pageContext,
}: ReviewsDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("reviews")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [businessReviews, setBusinessReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const checkLoginStatus = async () => {
      try {
        const response = await fetch("/api/user/session")
        const data = await response.json()
        setIsLoggedIn(data.authenticated)
      } catch (error) {
        console.error("Error checking login status:", error)
        setIsLoggedIn(false)
      }
    }

    // Fetch reviews from database - only for this specific business
    const fetchReviews = async () => {
      if (businessId && isOpen) {
        setIsLoading(true)
        setError(null)
        try {
          console.log(`Fetching reviews for business ID: ${businessId} from page: ${pageContext}`)
          const fetchedReviews = await getBusinessReviews(businessId)
          console.log(`Fetched ${fetchedReviews.length} reviews for business ${businessId}`)
          setBusinessReviews(fetchedReviews)
        } catch (error) {
          console.error("Error fetching reviews:", error)
          setError("Failed to load reviews. Please try again.")
          toast({
            title: "Error fetching reviews",
            description: "There was a problem loading reviews.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
    }

    if (isOpen) {
      checkLoginStatus()
      fetchReviews()
    }
  }, [isOpen, businessId, pageContext, toast])

  const handleWriteReviewClick = () => {
    if (isLoggedIn) {
      setActiveTab("write-review")
    } else {
      setIsLoginDialogOpen(true)
    }
  }

  const handleReviewSuccess = () => {
    setActiveTab("reviews")
    // Refresh reviews for this specific business
    getBusinessReviews(businessId).then((reviews) => {
      setBusinessReviews(reviews)
    })
  }

  // Use database reviews for this specific business, fallback to provided mock reviews
  const displayReviews = businessReviews.length > 0 ? businessReviews : reviews

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{providerName} Reviews</DialogTitle>
            <DialogDescription>
              Customer reviews and experiences with {providerName}
              {pageContext && <span className="text-xs text-gray-500 block mt-1">Viewing from: {pageContext}</span>}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="reviews" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="write-review">Write a Review</TabsTrigger>
              </TabsList>
              {activeTab === "reviews" && (
                <Button variant="outline" size="sm" onClick={handleWriteReviewClick}>
                  Leave a Review
                </Button>
              )}
            </div>

            <TabsContent value="reviews" className="mt-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="mt-2 text-gray-500">Loading reviews...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsLoading(true)
                      getBusinessReviews(businessId)
                        .then((reviews) => {
                          setBusinessReviews(reviews)
                          setError(null)
                        })
                        .catch((err) => {
                          console.error("Error retrying reviews fetch:", err)
                          setError("Failed to load reviews. Please try again.")
                        })
                        .finally(() => setIsLoading(false))
                    }}
                  >
                    Retry
                  </Button>
                </div>
              ) : displayReviews.length > 0 ? (
                <div className="space-y-6">
                  {displayReviews.map((review, index) => (
                    <div key={review.id || index} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{review.userName || "Anonymous"}</p>
                          <div className="flex items-center mt-1">
                            <StarRating rating={review.rating} />
                            <span className="text-sm text-gray-500 ml-2">
                              {new Date(review.date || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {review.verified && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</span>
                        )}
                      </div>
                      <p className="mt-3 text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="write-review" className="mt-4">
              {isLoggedIn ? (
                <ReviewForm
                  businessId={businessId}
                  businessName={providerName}
                  onSuccess={handleReviewSuccess}
                  pageContext={pageContext}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-700 mb-4">Please log in to write a review</p>
                  <Button onClick={() => setIsLoginDialogOpen(true)}>Log In or Register</Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ReviewLoginDialog
        isOpen={isLoginDialogOpen}
        onClose={() => setIsLoginDialogOpen(false)}
        onSuccess={() => {
          setIsLoggedIn(true)
          setIsLoginDialogOpen(false)
          setActiveTab("write-review")
        }}
      />
    </>
  )
}
