import * as Sentry from "@sentry/nextjs"

export function initSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
    tracesSampleRate: 1.0,
    // Adjust this value in production to control the volume of transactions sent
    // to Sentry (lower value = fewer transactions)
    // tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

    // Enable automatic instrumentation for Next.js
    integrations: [new Sentry.Integrations.Http({ tracing: true }), new Sentry.Integrations.BrowserTracing()],

    // Capture unhandled promise rejections
    autoSessionTracking: true,

    // Don't send PII data by default
    sendDefaultPii: false,

    // Adjust this value to control the volume of errors sent
    // to Sentry (lower value = fewer errors)
    sampleRate: 1.0,

    // Only send errors in production by default
    enabled: process.env.NODE_ENV === "production",

    // Set the release version to track which code version errors are coming from
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || "development",

    // Silence the Sentry initialization message in the console
    debug: false,

    // Ignore errors from specific URLs or patterns
    ignoreErrors: [
      // Add patterns for errors you want to ignore
      "top.GLOBALS",
      "ResizeObserver loop limit exceeded",
      /^Script error\.?$/,
      /^ResizeObserver loop completed with undelivered notifications/,
    ],

    // Ignore specific URLs
    denyUrls: [
      // Add URLs you want to ignore
      /extensions\//i,
      /^chrome:\/\//i,
    ],
  })
}

// Helper function to capture exceptions with additional context
export function captureException(error: Error, context?: Record<string, any>) {
  return Sentry.captureException(error, {
    contexts: context ? { additional: context } : undefined,
  })
}

// Helper function to set user information
export function setUserContext(user: { id: string; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  })
}

// Helper function to clear user information (e.g., on logout)
export function clearUserContext() {
  Sentry.setUser(null)
}

// Helper function to add breadcrumbs
export function addBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel,
  data?: Record<string, any>,
) {
  Sentry.addBreadcrumb({
    message,
    category: category || "custom",
    level: level || "info",
    data,
  })
}

// Helper function to start a transaction for performance monitoring
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({
    name,
    op,
  })
}

// Helper function to set tags
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value)
}

// Helper function to set extra context
export function setExtra(key: string, value: any) {
  Sentry.setExtra(key, value)
}
