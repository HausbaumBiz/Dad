"use client"

import type React from "react"

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
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, X } from "lucide-react"
import Link from "next/link"

interface ReviewLoginDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ReviewLoginDialog({ isOpen, onClose }: ReviewLoginDialogProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would handle login logic
    console.log("Login attempt with:", username, password)
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
          <DialogTitle className="text-xl font-semibold">Login Required</DialogTitle>
          <DialogDescription>Only registered users can leave reviews. Please login to continue.</DialogDescription>
        </DialogHeader>

        <Alert className="bg-amber-50 border-amber-200 text-amber-800 my-4">
          <AlertCircle className="h-4 w-4 text-amber-800" />
          <AlertDescription>You must be a registered user to leave a review.</AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username or Email</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username or email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <Button type="submit">Login</Button>
            <Link href="/user-register" className="text-sm text-primary hover:underline">
              Need an account? Register
            </Link>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
