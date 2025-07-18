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
import { Star } from "lucide-react"

interface ReviewsDialogProps {
  isOpen: boolean
  onClose: () => void
  providerName: string
  businessId: string
  reviews?: any[]
}

const questionLabels = {
  serviceQuality: "Service Quality",
  costTransparency: "Cost Transparency",
  communication: "Communication",
  expertise: "Expertise",
  dependability: "Dependability",
  professionalism: "Professionalism",
}

export function ReviewsDialog({ isOpen, onClose, providerName, businessId, reviews = [] }: ReviewsDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("reviews")
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const [businessReviews, setBusinessReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

    // Fetch reviews from database
    const fetchReviews = async () => {
      if (businessId && isOpen) {
        console.log("Fetching reviews for business:", businessId)
        setIsLoading(true)

        // Retry logic for rate limiting
        const maxRetries = 3
        let retryCount = 0

        while (retryCount < maxRetries) {
          try {
            const fetchedReviews = await getBusinessReviews(businessId)
            console.log("Fetched reviews:", fetchedReviews)
            setBusinessReviews(fetchedReviews)
            break // Success, exit retry loop
          } catch (error) {
            console.error("Error fetching reviews:", error)

            // Check if it's a rate limiting error
            if (error.message?.includes("429") || error.message?.includes("Too Many Requests")) {
              retryCount++
              if (retryCount < maxRetries) {
                console.log(`Rate limited, retrying in ${retryCount * 1000}ms... (attempt ${retryCount}/${maxRetries})`)
                await new Promise((resolve) => setTimeout(resolve, retryCount * 1000)) // Exponential backoff
                continue
              }
            }

            // If not rate limiting or max retries reached, show error
            toast({
              title: "Error fetching reviews",
              description: "There was a problem loading reviews. Please try again later.",
              variant: "destructive",
            })
            setBusinessReviews([]) // Set empty array on error
            break
          }
        }
      } else {
        setIsLoading(false)
        setBusinessReviews([])
      }
    }

    if (isOpen) {
      checkLoginStatus()
      fetchReviews()
    } else {
      // Reset state when dialog closes
      setIsLoading(false)
      setBusinessReviews([])
      setActiveTab("reviews")
    }
  }, [isOpen, businessId, toast])

  const handleWriteReviewClick = () => {
    if (isLoggedIn) {
      setActiveTab("write-review")
    } else {
      setIsLoginDialogOpen(true)
    }
  }

  const handleReviewSuccess = async () => {
    setActiveTab("reviews")
    // Refresh reviews
    try {
      setIsLoading(true)
      const refreshedReviews = await getBusinessReviews(businessId)
      setBusinessReviews(refreshedReviews)
    } catch (error) {
      console.error("Error refreshing reviews:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Use either database reviews or provided mock reviews
  const displayReviews = businessReviews.length > 0 ? businessReviews : reviews

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto"
          aria-describedby="reviews-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">{providerName} Reviews</DialogTitle>
            <DialogDescription id="reviews-dialog-description">
              Customer reviews and experiences with {providerName}
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
              {/* Average Rating and Review Count */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {displayReviews.length > 0
                        ? (
                            displayReviews.reduce(
                              (sum, review) => sum + (review.overallRating || review.rating || 0),
                              0,
                            ) / displayReviews.length
                          ).toFixed(1)
                        : "0.0"}
                    </div>
                    <div className="flex justify-center mt-1">
                      <StarRating
                        rating={
                          displayReviews.length > 0
                            ? displayReviews.reduce(
                                (sum, review) => sum + (review.overallRating || review.rating || 0),
                                0,
                              ) / displayReviews.length
                            : 0
                        }
                      />
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-semibold text-gray-900">
                      {displayReviews.length} {displayReviews.length === 1 ? "Review" : "Reviews"}
                    </div>
                    <div className="text-sm text-gray-600">Based on customer feedback</div>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading reviews...</p>
                </div>
              ) : displayReviews.length > 0 ? (
                <div className="space-y-6">
                  {displayReviews.map((review, index) => (
                    <div key={review.id || index} className="border-b pb-6 last:border-b-0">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="font-semibold">{review.userName || "Anonymous"}</p>
                          <div className="flex items-center mt-1">
                            <StarRating rating={review.overallRating || review.rating || 0} />
                            <span className="text-sm text-gray-500 ml-2">
                              Overall: {(review.overallRating || review.rating || 0).toFixed(1)} stars
                            </span>
                            <span className="text-sm text-gray-500 ml-2">•</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {new Date(review.date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {review.verified && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</span>
                        )}
                      </div>

                      {/* Detailed ratings if available */}
                      {review.ratings && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium mb-2">Detailed Ratings:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            {Object.entries(review.ratings).map(([key, rating]) => (
                              <div key={key} className="flex justify-between items-center">
                                <span className="text-gray-600">
                                  {questionLabels[key as keyof typeof questionLabels]}:
                                </span>
                                <div className="flex items-center">
                                  <div className="flex">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-3 w-3 ${
                                          star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="ml-1 text-xs">({rating})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-gray-700">{review.comment}</p>
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
                <ReviewForm businessId={businessId} businessName={providerName} onSuccess={handleReviewSuccess} />
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
