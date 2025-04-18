"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { ErrorBoundary } from "@/components/error-boundary"
import { ErrorFallback } from "@/components/error-fallback"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect to login page with return URL
      router.push(`/user-login?returnTo=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, isLoading, router, pathname])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return fallback || null
  }

  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback
          title="Protected Content Error"
          description="We encountered an error while loading this protected content."
          showHomeButton={true}
        />
      }
    >
      {children}
    </ErrorBoundary>
  )
}
