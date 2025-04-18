"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

interface ErrorFallbackProps {
  error?: Error
  resetErrorBoundary?: () => void
  title?: string
  description?: string
  showHomeButton?: boolean
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  title = "Something went wrong",
  description = "We've encountered an unexpected error. Our team has been notified.",
  showHomeButton = true,
}: ErrorFallbackProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-col items-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-2" />
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-center mb-4">{description}</p>
        {error && process.env.NODE_ENV === "development" && (
          <div className="bg-gray-100 p-3 rounded-md overflow-auto max-h-32 text-xs font-mono">
            <p className="text-red-600">{error.message}</p>
            <p className="text-gray-700 mt-2">{error.stack}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        {resetErrorBoundary && (
          <Button onClick={resetErrorBoundary} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        {showHomeButton && (
          <Button variant="outline" asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
