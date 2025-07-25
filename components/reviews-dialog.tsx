"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { StarRating } from "@/components/star-rating"
import { Loader2, User, Calendar, CheckCircle } from "lucide-react"
import { getBusinessReviews, submitReview, type Review } from "@/app/actions/review-actions"
import { getUserSession } from "@/app/actions/user-actions"
import { useToast } from "@/components/ui/use-toast"

interface ReviewsDialogProps {
  isOpen: boolean
  onClose: () => void
  providerName: string
  businessId: string
  reviews: Review[]
}

interface ReviewFormData {
  serviceQuality: number
  costTransparency: number
  communication: number
  expertise: number
  dependability: number
  professionalism: number
  comment: string
}

const ratingCategories = [
  {
    key: "serviceQuality",
    label: "Service Quality",
    description: "How satisfied were you with the quality of service?",
  },
  { key: "costTransparency", label: "Cost Transparency", description: "Were costs clearly communicated upfront?" },
  { key: "communication", label: "Communication", description: "How responsive and clear was their communication?" },
  { key: "expertise", label: "Expertise", description: "How knowledgeable and skilled were they?" },
  { key: "dependability", label: "Dependability", description: "Were they reliable and punctual?" },
  { key: "professionalism", label: "Professionalism", description: "How professional was their conduct?" },
]

export function ReviewsDialog({
  isOpen,
  onClose,
  providerName,
  businessId,
  reviews: initialReviews,
}: ReviewsDialogProps) {
  const { toast } = useToast()
  const [reviews, setReviews] = useState<Review[]>(initialReviews || [])
  const [loading, setLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [averageRating, setAverageRating] = useState(0)
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    serviceQuality: 0,
    costTransparency: 0,
    communication: 0,
    expertise: 0,
    dependability: 0,
    professionalism: 0,
    comment: "",
  })

  // Load reviews when dialog opens
  useEffect(() => {
    if (isOpen && businessId) {
      loadReviews()
      checkUserSession()
    }
  }, [isOpen, businessId])

  // Calculate average rating when reviews change
  useEffect(() => {
    if (reviews.length > 0) {
      const validRatings = reviews.map((review) => review.overallRating || 0).filter((rating) => rating > 0)

      if (validRatings.length > 0) {
        const average = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
        setAverageRating(Math.round(average * 10) / 10)
      } else {
        setAverageRating(0)
      }
    } else {
      setAverageRating(0)
    }
  }, [reviews])

  const loadReviews = async () => {
    try {
      setLoading(true)
      console.log(`[ReviewsDialog] Loading reviews for business ${businessId}`)
      const fetchedReviews = await getBusinessReviews(businessId)
      console.log(`[ReviewsDialog] Loaded ${fetchedReviews.length} reviews:`, fetchedReviews)
      setReviews(fetchedReviews)
    } catch (error) {
      console.error("Error loading reviews:", error)
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const checkUserSession = async () => {
    try {
      const user = await getUserSession()
      setCurrentUser(user)
    } catch (error) {
      console.error("Error checking user session:", error)
    }
  }

  const handleRatingChange = (category: keyof ReviewFormData, rating: number) => {
    setReviewForm((prev) => ({
      ...prev,
      [category]: rating,
    }))
  }

  const handleSubmitReview = async () => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You must be logged in to submit a review.",
        variant: "destructive",
      })
      return
    }

    // Validate that all ratings are provided
    const ratingValues = ratingCategories.map((cat) => reviewForm[cat.key as keyof ReviewFormData] as number)
    if (ratingValues.some((rating) => rating === 0)) {
      toast({
        title: "Incomplete Review",
        description: "Please provide ratings for all categories.",
        variant: "destructive",
      })
      return
    }

    if (!reviewForm.comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a comment with your review.",
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)

      const reviewData = {
        businessId,
        ratings: {
          serviceQuality: reviewForm.serviceQuality,
          costTransparency: reviewForm.costTransparency,
          communication: reviewForm.communication,
          expertise: reviewForm.expertise,
          dependability: reviewForm.dependability,
          professionalism: reviewForm.professionalism,
        },
        comment: reviewForm.comment.trim(),
      }

      const result = await submitReview(reviewData)

      if (result.success) {
        toast({
          title: "Review Submitted!",
          description: "Thank you for your feedback.",
        })

        // Reset form
        setReviewForm({
          serviceQuality: 0,
          costTransparency: 0,
          communication: 0,
          expertise: 0,
          dependability: 0,
          professionalism: 0,
          comment: "",
        })
        setShowReviewForm(false)

        // Reload reviews
        await loadReviews()
      } else {
        throw new Error(result.message || "Failed to submit review")
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Date not available"
    }
  }

  const getCategoryAverage = (category: keyof Review["ratings"]) => {
    if (reviews.length === 0) return 0

    const validRatings = reviews.map((review) => review.ratings?.[category] || 0).filter((rating) => rating > 0)

    if (validRatings.length === 0) return 0

    const average = validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
    return Math.round(average * 10) / 10
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Reviews for {providerName}</DialogTitle>
          <DialogDescription>Read reviews from other customers and share your own experience</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading reviews...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Rating Summary */}
            <Card>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">{averageRating.toFixed(1)}</div>
                    <StarRating rating={averageRating} size="lg" className="justify-center mb-2" />
                    <p className="text-gray-600">
                      Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Rating Breakdown</h3>
                    {ratingCategories.map((category) => (
                      <div key={category.key} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.label}</span>
                        <div className="flex items-center gap-2">
                          <StarRating rating={getCategoryAverage(category.key as keyof Review["ratings"])} size="sm" />
                          <span className="text-sm text-gray-600 w-8">
                            {getCategoryAverage(category.key as keyof Review["ratings"]).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {currentUser ? (
                <Button onClick={() => setShowReviewForm(!showReviewForm)} className="flex-1 md:flex-none">
                  {showReviewForm ? "Cancel Review" : "Write a Review"}
                </Button>
              ) : (
                <Button asChild className="flex-1 md:flex-none">
                  <a href="/user-login">Login to Write Review</a>
                </Button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>

                  <div className="space-y-6">
                    {/* Rating Categories */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {ratingCategories.map((category) => (
                        <div key={category.key} className="space-y-2">
                          <Label className="text-sm font-medium">{category.label}</Label>
                          <p className="text-xs text-gray-600">{category.description}</p>
                          <StarRating
                            rating={reviewForm[category.key as keyof ReviewFormData] as number}
                            interactive={true}
                            onRatingChange={(rating) =>
                              handleRatingChange(category.key as keyof ReviewFormData, rating)
                            }
                            size="md"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                      <Label htmlFor="comment">Your Review</Label>
                      <Textarea
                        id="comment"
                        placeholder="Share your experience with this provider..."
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                        rows={4}
                      />
                    </div>

                    {/* Submit Button */}
                    <Button onClick={handleSubmitReview} disabled={submitting} className="w-full md:w-auto">
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Review"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Customer Reviews ({reviews.length})</h3>

              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-gray-500">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h4 className="text-lg font-medium mb-2">No Reviews Yet</h4>
                      <p>Be the first to review {providerName}!</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Review Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">{review.userName}</h4>
                                  {review.verified && (
                                    <CheckCircle className="h-4 w-4 text-green-500" title="Verified Review" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="h-4 w-4" />
                                  {formatDate(review.date)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-2">
                                <StarRating rating={review.overallRating || 0} size="sm" />
                                <span className="text-sm font-medium">{(review.overallRating || 0).toFixed(1)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Review Comment */}
                          <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                          {/* Detailed Ratings */}
                          {review.ratings && (
                            <div className="border-t pt-4">
                              <h5 className="text-sm font-medium mb-3">Detailed Ratings</h5>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {ratingCategories.map((category) => {
                                  const rating = review.ratings[category.key as keyof Review["ratings"]] || 0
                                  return (
                                    <div key={category.key} className="flex items-center justify-between">
                                      <span className="text-xs text-gray-600">{category.label}</span>
                                      <div className="flex items-center gap-1">
                                        <StarRating rating={rating} size="sm" />
                                        <span className="text-xs text-gray-500 w-6">{rating.toFixed(1)}</span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
