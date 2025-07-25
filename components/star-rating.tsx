"use client"

import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  className,
}: StarRatingProps) {
  // Ensure rating is within bounds
  const clampedRating = Math.max(0, Math.min(maxRating, rating || 0))

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1)
    }
  }

  return (
    <div className={cn("flex items-center", className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1
        const fillPercentage = Math.max(0, Math.min(1, clampedRating - index))

        return (
          <div
            key={index}
            className={cn("relative", interactive && "cursor-pointer")}
            onClick={() => handleStarClick(index)}
          >
            {/* Background star (empty) */}
            <Star
              className={cn(
                sizeClasses[size],
                "text-gray-300",
                interactive && "hover:text-yellow-400 transition-colors",
              )}
            />

            {/* Foreground star (filled) */}
            {fillPercentage > 0 && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage * 100}%` }}>
                <Star className={cn(sizeClasses[size], "text-yellow-400 fill-yellow-400")} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
