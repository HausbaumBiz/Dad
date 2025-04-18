"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import * as Sentry from "@sentry/nextjs"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showReset?: boolean
  showReport?: boolean
  componentName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  eventId: string | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Capture component stack information
    this.setState({ errorInfo })

    // Report the error to Sentry
    const eventId = Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
        component: {
          name: this.props.componentName || "Unknown Component",
        },
      },
    })

    this.setState({ eventId })

    // Log the error to console in development
    if (process.env.NODE_ENV !== "production") {
      console.error("Error caught by ErrorBoundary:", error, errorInfo)
    }

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetErrorBoundary = (): void => {
    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    })

    // Call the onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  reportFeedback = (): void => {
    if (this.state.eventId) {
      Sentry.showReportDialog({ eventId: this.state.eventId })
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Otherwise, use the default fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4 text-center max-w-md">
            We've encountered an unexpected error. Our team has been notified.
          </p>
          <div className="flex gap-3">
            {this.props.showReset !== false && <Button onClick={this.resetErrorBoundary}>Try Again</Button>}
            {this.props.showReport !== false && (
              <Button variant="outline" onClick={this.reportFeedback}>
                Report Feedback
              </Button>
            )}
          </div>
          {process.env.NODE_ENV !== "production" && this.state.error && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md w-full overflow-auto text-sm">
              <p className="font-mono text-red-600">{this.state.error.toString()}</p>
              {this.state.errorInfo && (
                <pre className="mt-2 text-gray-700 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
              )}
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
