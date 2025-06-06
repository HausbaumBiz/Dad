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
import { Input } from "@/components/ui/input"
import { MapPin, X } from "lucide-react"

interface ZipCodeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (zipCode: string) => void
}

export function ZipCodeDialog({ isOpen, onClose, onSubmit }: ZipCodeDialogProps) {
  const [zipCode, setZipCode] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = () => {
    if (!zipCode.trim()) {
      setError("Please enter a valid zip code")
      return
    }

    // Basic US zip code validation (5 digits)
    if (!/^\d{5}$/.test(zipCode)) {
      setError("Please enter a valid 5-digit zip code")
      return
    }

    setError("")
    onSubmit(zipCode)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" closeButton={false}>
        {/* Custom close button */}
        <div className="absolute right-4 top-4 z-10">
          <DialogClose className="rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Enter Your Zip Code</DialogTitle>
          <DialogDescription className="text-gray-600">
            To help you find local services in your area, we need your zip code.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-sm text-gray-600">Your location helps us find the best services near you</span>
          </div>

          <div className="flex flex-col space-y-2">
            <Input
              placeholder="Enter zip code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
