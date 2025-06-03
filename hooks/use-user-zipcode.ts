"use client"

import { useState, useEffect } from "react"

export function useUserZipCode() {
  const [zipCode, setZipCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get zip code from localStorage on mount
    const savedZipCode = localStorage.getItem("savedZipCode")
    setZipCode(savedZipCode)
    setIsLoading(false)
  }, [])

  const updateZipCode = (newZipCode: string) => {
    localStorage.setItem("savedZipCode", newZipCode)
    setZipCode(newZipCode)
  }

  const clearZipCode = () => {
    localStorage.removeItem("savedZipCode")
    setZipCode(null)
  }

  return {
    zipCode,
    isLoading,
    updateZipCode,
    clearZipCode,
    hasZipCode: !!zipCode,
  }
}
