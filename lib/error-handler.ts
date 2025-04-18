import * as Sentry from "@sentry/nextjs"

export function setupGlobalErrorHandlers() {
  if (typeof window !== "undefined") {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled Promise Rejection:", event.reason)

      // Report to Sentry
      Sentry.captureException(event.reason, {
        contexts: {
          unhandledRejection: {
            type: "unhandledrejection",
            promise: String(event.promise),
          },
        },
      })

      // Prevent the default browser behavior (console error)
      // event.preventDefault()
    })

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      console.error("Uncaught Error:", event.error)

      // Report to Sentry
      Sentry.captureException(event.error, {
        contexts: {
          uncaughtError: {
            type: "error",
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
      })

      // Prevent the default browser behavior (console error)
      // event.preventDefault()
    })
  }
}
