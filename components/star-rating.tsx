"use client"

import { useState } from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  interactive?: boolean
  size?: "sm" | "md" | "lg"
}

export function StarRating({ rating, onChange, interactive = false, size = "md" }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const starSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  const starSize = starSizes[size]

  const handleMouseEnter = (index: number) => {
    if (interactive) {
      setHoverRating(index)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index)
    }
  }

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((index) => {
        const isActive = index <= (hoverRating || rating)

        return (
          <span
            key={index}
            className={`${interactive ? "cursor-pointer" : ""}`}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleClick(index)}
          >
            <Star
              className={`${starSize} ${
                isActive ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              } transition-colors`}
            />
          </span>
        )
      })}
    </div>
  )
}
