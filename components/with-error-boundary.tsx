"use client"

import type React from "react"
import type { ComponentType } from "react"
import { ErrorBoundary } from "./error-boundary"
import { ErrorFallback } from "./error-fallback"

interface WithErrorBoundaryOptions {
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
}

export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  options: WithErrorBoundaryOptions = {},
) {
  const { fallback, onError, onReset } = options

  const displayName = Component.displayName || Component.name || "Component"

  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary
        fallback={fallback || <ErrorFallback resetErrorBoundary={onReset} />}
        onError={onError}
        onReset={onReset}
      >
        <Component {...props} />
      </ErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`

  return WrappedComponent
}
