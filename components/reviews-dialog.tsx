"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Star, X } from "lucide-react"
import { ReviewLoginDialog } from "./review-login-dialog"
import { useMobile } from "@/hooks/use-mobile"

interface Review {
  id: number
  userName: string
  rating: number
  comment: string
  date: string
}

interface ReviewsDialogProps {
  isOpen: boolean
  onClose: () => void
  providerName: string
  reviews: Review[]
}

export function ReviewsDialog({ isOpen, onClose, providerName, reviews }: ReviewsDialogProps) {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)
  const isMobile = useMobile()

  const handleAddReview = () => {
    setIsLoginDialogOpen(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Enhanced mobile close button */}
          {isMobile && (
            <div className="absolute right-4 top-4 z-10">
              <DialogClose className="rounded-full p-3 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </DialogClose>
            </div>
          )}

          <DialogHeader>
            <DialogTitle className="text-xl font-semibold pr-8">{providerName} Reviews</DialogTitle>
            <DialogDescription>See what others are saying about this service provider.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto py-4 space-y-6">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{review.userName}</p>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-500 ml-2">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-700">{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-4">No reviews yet. Be the first to leave a review!</p>
            )}
          </div>

          <div className="flex justify-center mt-4">
            <Button onClick={handleAddReview}>Add a Review</Button>
          </div>

          {/* Mobile-friendly bottom close button */}
          {isMobile && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" size="lg" className="w-full py-3 text-base font-medium" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ReviewLoginDialog isOpen={isLoginDialogOpen} onClose={() => setIsLoginDialogOpen(false)} />
    </>
  )
}
