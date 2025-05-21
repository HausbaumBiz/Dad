"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { submitReview } from "@/app/actions/review-actions"
import { useToast } from "@/components/ui/use-toast"
import { Star } from "lucide-react"

interface ReviewFormProps {
  businessId: string
  businessName: string
  onSuccess?: () => void
}

export function ReviewForm({ businessId, businessName, onSuccess }: ReviewFormProps) {
  const { toast } = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ rating?: string; comment?: string }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const newErrors: { rating?: string; comment?: string } = {}

    if (rating === 0) {
      newErrors.rating = "Please select a rating"
    }

    if (!comment.trim()) {
      newErrors.comment = "Please enter a review comment"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitReview({
        businessId,
        rating,
        comment,
      })

      if (result.success) {
        toast({
          title: "Review submitted",
          description: "Thank you for your feedback!",
        })

        // Reset form
        setRating(0)
        setComment("")
        setErrors({})

        // Call success callback if provided
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "There was a problem submitting your review.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: "There was a problem submitting your review.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Your rating for {businessName}</label>
        <div className="flex items-center mb-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-8 w-8 cursor-pointer transition-colors ${
                star <= (hoveredRating || rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
            />
          ))}
          <span className="ml-2 text-sm text-gray-500">
            {rating > 0 ? `${rating} star${rating !== 1 ? "s" : ""}` : "Select a rating"}
          </span>
        </div>
        {errors.rating && <p className="text-red-500 text-sm mt-1">{errors.rating}</p>}
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium mb-2">
          Your review
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this business..."
          rows={5}
          className={errors.comment ? "border-red-500" : ""}
        />
        {errors.comment && <p className="text-red-500 text-sm mt-1">{errors.comment}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
}
