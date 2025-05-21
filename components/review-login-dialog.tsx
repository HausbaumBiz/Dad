"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface ReviewLoginDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ReviewLoginDialog({ isOpen, onClose, onSuccess }: ReviewLoginDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login Required</DialogTitle>
          <DialogDescription>
            You need to be logged in to write a review. Please log in or create an account to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 mt-4">
          <Button asChild>
            <Link href="/user-login">Log In</Link>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/user-register">Create Account</Link>
          </Button>

          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
