"use client"

import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

// Create a toast function
const toast = ({ title, description, variant = "default" }: ToastProps) => {
  sonnerToast[variant === "destructive" ? "error" : "success"](title, {
    description,
  })
}

// Export a useToast hook that returns the toast function
export function useToast() {
  return {
    toast,
  }
}

// Also export the toast function directly for convenience
export { toast }
