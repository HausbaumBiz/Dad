import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"

export class ApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = "ApiError"
    this.statusCode = statusCode
  }
}

export async function handleApiRequest<T>(
  handler: () => Promise<T>,
  options: {
    routeName?: string
    defaultErrorMessage?: string
  } = {},
) {
  const { routeName = "api.unknown", defaultErrorMessage = "An unexpected error occurred" } = options

  try {
    // Start a transaction for performance monitoring
    const transaction = Sentry.startTransaction({
      name: `api.${routeName}`,
      op: "http.server",
    })

    // Set the transaction as the current span
    Sentry.configureScope((scope) => {
      scope.setSpan(transaction)
    })

    // Execute the handler
    const result = await handler()

    // Finish the transaction
    transaction.finish()

    // Return the result
    return NextResponse.json(result)
  } catch (error) {
    // Determine if this is a known API error or an unexpected error
    const isApiError = error instanceof ApiError
    const statusCode = isApiError ? error.statusCode : 500
    const message = isApiError ? error.message : defaultErrorMessage

    // Log the error
    console.error(`API Error (${statusCode}):`, error)

    // Capture the error with Sentry (only for unexpected errors)
    if (!isApiError || statusCode >= 500) {
      Sentry.captureException(error, {
        contexts: {
          api: {
            route: routeName,
            statusCode,
          },
        },
        tags: {
          api_route: routeName,
          error_type: isApiError ? "api_error" : "unexpected_error",
        },
      })
    }

    // Return an error response
    return NextResponse.json(
      {
        error: message,
        success: false,
      },
      { status: statusCode },
    )
  }
}
