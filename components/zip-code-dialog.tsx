"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2 } from "lucide-react"

interface ZipCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (zipCode: string) => void
}

export function ZipCodeDialog({ isOpen, onClose, onSubmit }: ZipCodeDialogProps) {
  const [zipCode, setZipCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!zipCode) {
      setError("Please enter a zip code")
      return
    }

    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      setError("Please enter a valid 5-digit zip code")
      return
    }

    setIsValidating(true)
    setError("")

    try {
      // Here you could validate the zip code against an API if needed
      // For now, we'll just accept any 5-digit code

      // Submit the valid zip code
      onSubmit(zipCode)

      // Close the dialog
      onClose()
    } catch (error) {
      console.error("Error validating zip code:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Your Zip Code</DialogTitle>
          <DialogDescription>We need your zip code to show you relevant job listings in your area.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Enter 5-digit zip code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="flex-1"
              maxLength={5}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isValidating}>
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
