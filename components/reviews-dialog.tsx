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

interface ReviewsDialogProps {
  isOpen: boolean
  onClose: () => void
  providerName: string
  businessId: string
  reviews?: any[]
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
        try {
          const fetchedReviews = await getBusinessReviews(businessId)
          console.log("Fetched reviews:", fetchedReviews)
          setBusinessReviews(fetchedReviews)
        } catch (error) {
          console.error("Error fetching reviews:", error)
          toast({
            title: "Error fetching reviews",
            description: "There was a problem loading reviews.",
            variant: "destructive",
          })
          setBusinessReviews([]) // Set empty array on error
        } finally {
          setIsLoading(false)
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
          className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto"
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
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading reviews...</p>
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
                              {new Date(review.date).toLocaleDateString()}
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
