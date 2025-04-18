"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import * as Sentry from "@sentry/nextjs"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error, {
      contexts: {
        nextjs: {
          route: window.location.pathname,
          component: "error.tsx",
        },
      },
      tags: {
        error_boundary: "app/error.tsx",
        error_digest: error.digest,
      },
    })

    // Log the error to the console in development
    if (process.env.NODE_ENV !== "production") {
      console.error("Error caught by error.tsx:", error)
    }
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
      <AlertTriangle className="h-16 w-16 text-amber-500 mb-6" />
      <h2 className="text-2xl font-semibold mb-3">Something went wrong</h2>
      <p className="text-gray-600 mb-6 text-center max-w-md">
        We've encountered an unexpected error. Our team has been notified and is working to fix the issue.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset}>Try Again</Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Go to Homepage
        </Button>
      </div>
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md w-full max-w-2xl overflow-auto text-sm">
          <p className="font-mono text-red-600">{error.message}</p>
          {error.stack && <pre className="mt-2 text-gray-700 whitespace-pre-wrap">{error.stack}</pre>}
        </div>
      )}
    </div>
  )
}
