"use client"

import { useCallback, useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { useUser } from "@/contexts/user-context"

interface UseSentryOptions {
  componentName?: string
  includeBreadcrumbs?: boolean
}

export function useSentry(options: UseSentryOptions = {}) {
  const { componentName = "Unknown", includeBreadcrumbs = true } = options
  const { user } = useUser()

  // Set user context when user changes
  useEffect(() => {
    if (user) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: `${user.firstName} ${user.lastName}`,
      })
    } else {
      Sentry.setUser(null)
    }
  }, [user])

  // Add component mount breadcrumb
  useEffect(() => {
    if (includeBreadcrumbs) {
      Sentry.addBreadcrumb({
        category: "component",
        message: `Component mounted: ${componentName}`,
        level: "info",
      })
    }

    return () => {
      if (includeBreadcrumbs) {
        Sentry.addBreadcrumb({
          category: "component",
          message: `Component unmounted: ${componentName}`,
          level: "info",
        })
      }
    }
  }, [componentName, includeBreadcrumbs])

  // Function to capture exceptions with component context
  const captureError = useCallback(
    (error: Error, additionalContext?: Record<string, any>) => {
      return Sentry.captureException(error, {
        contexts: {
          component: {
            name: componentName,
            ...additionalContext,
          },
        },
      })
    },
    [componentName],
  )

  // Function to add breadcrumbs
  const addBreadcrumb = useCallback((message: string, category?: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      message,
      category: category || "custom",
      level: "info",
      data,
    })
  }, [])

  // Function to start performance monitoring
  const startTransaction = useCallback(
    (name: string, op = "component") => {
      return Sentry.startTransaction({
        name: `${componentName}.${name}`,
        op,
      })
    },
    [componentName],
  )

  return {
    captureError,
    addBreadcrumb,
    startTransaction,
    setTag: Sentry.setTag,
    setExtra: Sentry.setExtra,
  }
}
