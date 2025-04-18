"use client"

import { useCallback } from "react"

interface ErrorReportingOptions {
  applicationName?: string
  silent?: boolean
}

export function useErrorReporting(options: ErrorReportingOptions = {}) {
  const { applicationName = "Hausbaum", silent = false } = options

  const reportError = useCallback(
    async (error: Error, componentStack?: string) => {
      // Create error report payload
      const errorReport = {
        timestamp: new Date().toISOString(),
        application: applicationName,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        componentStack,
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
        url: typeof window !== "undefined" ? window.location.href : "",
      }

      // Log to console in development or if silent is false
      if (process.env.NODE_ENV === "development" || !silent) {
        console.error("Error Report:", errorReport)
      }

      // In a real application, you would send this to your error reporting service
      // Example:
      // try {
      //   await fetch('/api/error-reporting', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(errorReport),
      //   })
      // } catch (reportingError) {
      //   console.error('Failed to report error:', reportingError)
      // }

      return errorReport
    },
    [applicationName, silent],
  )

  return { reportError }
}
