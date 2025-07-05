"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { submitReview } from "@/app/actions/review-actions"
import { useToast } from "@/components/ui/use-toast"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"

interface ReviewFormProps {
  businessId: string
  businessName: string
  onSuccess?: () => void
}

const questions = [
  {
    id: "serviceQuality",
    text: "How would you rate the quality of the service you received?",
  },
  {
    id: "costTransparency",
    text: "Was the final cost reflective of the quoted cost or were added charges reasonable and explained?",
  },
  {
    id: "communication",
    text: "How would you rate the communication throughout the process?",
  },
  {
    id: "expertise",
    text: "Was your hire an expert in their field?",
  },
  {
    id: "dependability",
    text: "Was your hire dependable and true to their word?",
  },
  {
    id: "professionalism",
    text: "Was your hire professional and courteous?",
  },
]

export function ReviewForm({ businessId, businessName, onSuccess }: ReviewFormProps) {
  const { toast } = useToast()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [ratings, setRatings] = useState<Record<string, number>>({
    serviceQuality: 0,
    costTransparency: 0,
    communication: 0,
    expertise: 0,
    dependability: 0,
    professionalism: 0,
  })
  const [hoveredRatings, setHoveredRatings] = useState<Record<string, number>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ ratings?: string }>({})

  const currentQuestion = questions[currentQuestionIndex]
  const currentRating = ratings[currentQuestion.id] || 0
  const currentHoveredRating = hoveredRatings[currentQuestion.id] || 0

  const handleRatingClick = (rating: number) => {
    setRatings((prev) => ({
      ...prev,
      [currentQuestion.id]: rating,
    }))
  }

  const handleRatingHover = (rating: number) => {
    setHoveredRatings((prev) => ({
      ...prev,
      [currentQuestion.id]: rating,
    }))
  }

  const handleRatingLeave = () => {
    setHoveredRatings((prev) => ({
      ...prev,
      [currentQuestion.id]: 0,
    }))
  }

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const newErrors: { ratings?: string } = {}

    // Check if all ratings are provided
    const unratedQuestions = questions.filter((q) => !ratings[q.id] || ratings[q.id] === 0)
    if (unratedQuestions.length > 0) {
      newErrors.ratings = `Please rate all questions. Missing: ${unratedQuestions.map((q) => `Question ${questions.indexOf(q) + 1}`).join(", ")}`
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitReview({
        businessId,
        ratings: {
          serviceQuality: ratings.serviceQuality,
          costTransparency: ratings.costTransparency,
          communication: ratings.communication,
          expertise: ratings.expertise,
          dependability: ratings.dependability,
          professionalism: ratings.professionalism,
        },
        comment: "", // Empty comment since we removed the text box
      })

      if (result.success) {
        toast({
          title: "Review submitted",
          description: "Thank you for your detailed feedback!",
        })

        // Reset form
        setCurrentQuestionIndex(0)
        setRatings({
          serviceQuality: 0,
          costTransparency: 0,
          communication: 0,
          expertise: 0,
          dependability: 0,
          professionalism: 0,
        })
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Question Carousel */}
      <div className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToNextQuestion}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium mb-3">{currentQuestion.text}</h3>
          <div className="flex items-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-8 w-8 cursor-pointer transition-colors ${
                  star <= (currentHoveredRating || currentRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                }`}
                onMouseEnter={() => handleRatingHover(star)}
                onMouseLeave={handleRatingLeave}
                onClick={() => handleRatingClick(star)}
              />
            ))}
            <span className="ml-2 text-sm text-gray-500">
              {currentRating > 0 ? `${currentRating} star${currentRating !== 1 ? "s" : ""}` : "Select a rating"}
            </span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded ${
                index === currentQuestionIndex
                  ? "bg-blue-500"
                  : ratings[questions[index].id] > 0
                    ? "bg-green-500"
                    : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Summary of all ratings */}
      <div className="border rounded-lg p-4">
        <h4 className="font-medium mb-3">Rating Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {questions.map((question, index) => (
            <div key={question.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-gray-600 font-medium">Q{index + 1}:</span>
                {ratings[question.id] > 0 ? (
                  <>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${
                            star <= ratings[question.id] ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">({ratings[question.id]})</span>
                  </>
                ) : (
                  <span className="text-gray-400 text-xs">Not rated</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {errors.ratings && <p className="text-red-500 text-sm mt-2">{errors.ratings}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
}
