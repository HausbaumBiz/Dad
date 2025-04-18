"use client"

import { useState, useCallback } from "react"
import * as Sentry from "@sentry/nextjs"

interface UseSafeFetchOptions {
  componentName?: string
}

export function useSafeFetch<T = any>(options: UseSafeFetchOptions = {}) {
  const { componentName = "Unknown" } = options
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  const safeFetch = useCallback(
    async <R = T>(
      fetchFn: () => Promise<R>,
      errorMessage = "An error occurred while fetching data",
    ): Promise<R | null> => {
      setIsLoading(true)
      setError(null)

      try {
        // Start a transaction for performance monitoring
        const transaction = Sentry.startTransaction({
          name: `fetch.${componentName}`,
          op: "http.client",
        })

        // Add a breadcrumb for the fetch operation
        Sentry.addBreadcrumb({
          category: "fetch",
          message: `Starting fetch operation in ${componentName}`,
          level: "info",
        })

        // Set the transaction as the current span
        Sentry.configureScope((scope) => {
          scope.setSpan(transaction)
        })

        const result = await fetchFn()
        setData(result as unknown as T)

        // Add a breadcrumb for the successful fetch
        Sentry.addBreadcrumb({
          category: "fetch",
          message: `Fetch operation successful in ${componentName}`,
          level: "info",
        })

        // Finish the transaction
        transaction.finish()

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(errorMessage)

        // Set the error state
        setError(error)

        // Capture the error with Sentry
        Sentry.captureException(error, {
          contexts: {
            component: {
              name: componentName,
            },
            fetch: {
              operation: "fetch",
              error: error.message,
            },
          },
        })

        // Add a breadcrumb for the failed fetch
        Sentry.addBreadcrumb({
          category: "fetch",
          message: `Fetch operation failed in ${componentName}: ${error.message}`,
          level: "error",
        })

        return null
      } finally {
        setIsLoading(false)
      }
    },
    [componentName],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return { safeFetch, isLoading, error, data, reset }
}
