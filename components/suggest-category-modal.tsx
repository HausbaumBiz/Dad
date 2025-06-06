"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import Image from "next/image"

interface SuggestCategoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SuggestCategoryModal({ isOpen, onClose }: SuggestCategoryModalProps) {
  const handleSubmit = () => {
    alert("Suggestion submitted! We will review your request.")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" closeButton={false}>
        {/* Custom close button */}
        <div className="absolute right-4 top-4 z-10">
          <DialogClose className="rounded-full p-1.5 bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>

        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative w-40 h-20">
              <Image
                src="https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/hausbaumbiz03-pppfkt6a4UyL8TdkxntO73GQrsTeeU.png"
                alt="Hausbaum Logo"
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          </div>
          <DialogTitle>Suggest a New Category</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newCategory">Suggested New Category:</Label>
            <Input id="newCategory" />
          </div>

          <div className="text-center text-gray-500">and/or</div>

          <div className="space-y-2">
            <Label htmlFor="newSubcategory">Suggested New Subcategory:</Label>
            <Input id="newSubcategory" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Please describe what your business does:</Label>
            <Textarea id="description" rows={4} />
          </div>

          <p className="text-sm text-gray-600">
            We will review your suggestion, and if appropriate, we will email you when the new category becomes
            available. In the meantime, please select the category that best fits the service you provide.
          </p>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
