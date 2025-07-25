export class ReviewSystemError extends Error {
  public troubleshootingData: TroubleshootingData

  constructor(message: string, troubleshootingData: TroubleshootingData) {
    super(message)
    this.name = "ReviewSystemError"
    this.troubleshootingData = troubleshootingData
  }
}

export interface TroubleshootingData {
  timestamp: string
  businessId: string
  errorType: string
  errorMessage: string
  httpStatus?: number
  retryAttempts: number
  lastAttemptTime: string
  redisStatus: string
  networkLatency: number
  cacheHit: boolean
  userAgent: string
  sessionId: string
  errorFrequency: number
  systemInfo: {
    timestamp: string
    operation: string
    memoryUsage?: any
  }
}

interface RetryOptions {
  maxAttempts?: number
  baseDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  skipRetryOnTypes?: string[]
}

interface OperationContext {
  businessId: string
  operation: string
  timestamp: string
  userAgent: string
  sessionId: string
}

export class ReviewErrorHandler {
  private static errorCounts = new Map<string, number>()
  private static lastErrorTimes = new Map<string, number>()
  private static redisHealthy = true
  private static lastRedisCheck = 0
  private static readonly REDIS_CHECK_INTERVAL = 30000 // 30 seconds

  static async withRetry<T>(
    operation: () => Promise<T>,
    context: OperationContext,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 2, // Reduced for faster failure
      baseDelay = 500, // Shorter initial delay
      maxDelay = 5000, // Shorter max delay
      backoffMultiplier = 1.5, // Gentler backoff
      skipRetryOnTypes = ["DATA_ERROR", "TYPE_ERROR", "PARSE_ERROR"],
    } = options

    const operationKey = `${context.businessId}:${context.operation}`
    let lastError: any = null
    const startTime = Date.now()

    // Quick Redis health check
    if (!this.isRedisHealthy()) {
      console.warn(`[ReviewErrorHandler] Redis marked as unhealthy, returning empty result for ${context.operation}`)
      throw new ReviewSystemError(
        "Redis temporarily unavailable",
        this.createTroubleshootingData(new Error("Redis health check failed"), context, 0, startTime),
      )
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation()

        // Reset error count on success
        this.errorCounts.delete(operationKey)
        this.lastErrorTimes.delete(operationKey)
        this.redisHealthy = true

        return result
      } catch (error: any) {
        lastError = error
        const errorInfo = this.extractErrorInfo(error)

        console.error(`[ReviewErrorHandler] Attempt ${attempt}/${maxAttempts} failed:`, {
          errorMessage: errorInfo.message,
          errorType: errorInfo.type,
          context,
          errorCount: attempt,
        })

        // Update error tracking
        const currentCount = this.errorCounts.get(operationKey) || 0
        this.errorCounts.set(operationKey, currentCount + 1)
        this.lastErrorTimes.set(operationKey, Date.now())

        // Mark Redis as unhealthy for certain error types
        if (["REDIS_ERROR", "CONNECTION_ERROR", "TIMEOUT"].includes(errorInfo.type)) {
          this.redisHealthy = false
          this.lastRedisCheck = Date.now()
        }

        // Don't retry on certain error types
        if (skipRetryOnTypes.includes(errorInfo.type)) {
          console.log(`[ReviewErrorHandler] Skipping retry for error type: ${errorInfo.type}`)
          break
        }

        // Don't retry on the last attempt
        if (attempt === maxAttempts) {
          break
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt - 1), maxDelay)

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 200

        console.log(`[ReviewErrorHandler] Retrying in ${jitteredDelay}ms...`)
        await new Promise((resolve) => setTimeout(resolve, jitteredDelay))
      }
    }

    // Create troubleshooting data
    const troubleshootingData = this.createTroubleshootingData(lastError, context, maxAttempts, startTime)
    throw new ReviewSystemError(this.extractErrorInfo(lastError).message, troubleshootingData)
  }

  private static createTroubleshootingData(
    error: any,
    context: OperationContext,
    maxAttempts: number,
    startTime: number,
  ): TroubleshootingData {
    const errorInfo = this.extractErrorInfo(error)
    const operationKey = `${context.businessId}:${context.operation}`

    return {
      timestamp: new Date().toISOString(),
      businessId: context.businessId,
      errorType: errorInfo.type,
      errorMessage: errorInfo.message,
      httpStatus: errorInfo.httpStatus,
      retryAttempts: maxAttempts,
      lastAttemptTime: new Date().toISOString(),
      redisStatus: this.determineRedisStatus(errorInfo),
      networkLatency: Date.now() - startTime,
      cacheHit: false,
      userAgent: context.userAgent,
      sessionId: context.sessionId,
      errorFrequency: this.errorCounts.get(operationKey) || 0,
      systemInfo: {
        timestamp: context.timestamp,
        operation: context.operation,
        memoryUsage: typeof process !== "undefined" ? process.memoryUsage?.() : undefined,
      },
    }
  }

  private static isRedisHealthy(): boolean {
    const now = Date.now()
    // Reset health status after interval
    if (now - this.lastRedisCheck > this.REDIS_CHECK_INTERVAL) {
      this.redisHealthy = true
    }
    return this.redisHealthy
  }

  private static extractErrorInfo(error: any): {
    message: string
    type: string
    httpStatus?: number
  } {
    // Handle null/undefined
    if (!error) {
      return {
        message: "Unknown error occurred",
        type: "UNKNOWN_ERROR",
      }
    }

    // Handle string errors
    if (typeof error === "string") {
      return {
        message: error,
        type: this.categorizeErrorType(error),
      }
    }

    // Handle Error objects
    if (error instanceof Error) {
      return {
        message: error.message || "Unknown error",
        type: this.categorizeErrorType(error.message),
        httpStatus: (error as any).status || (error as any).statusCode,
      }
    }

    // Handle response-like objects
    if (error && typeof error === "object") {
      // Check for common error object patterns
      let message = "Unknown error"

      if (error.message) {
        message = String(error.message)
      } else if (error.error) {
        message = String(error.error)
      } else if (error.statusText) {
        message = String(error.statusText)
      } else if (error.data?.message) {
        message = String(error.data.message)
      } else {
        try {
          message = JSON.stringify(error)
        } catch {
          message = "Complex error object"
        }
      }

      const status = error.status || error.statusCode || error.code || error.data?.status

      return {
        message,
        type: this.categorizeErrorType(message),
        httpStatus: typeof status === "number" ? status : undefined,
      }
    }

    // Fallback for any other type
    return {
      message: String(error),
      type: "UNKNOWN_ERROR",
    }
  }

  private static categorizeErrorType(message: string): string {
    const lowerMessage = message.toLowerCase()

    if (lowerMessage.includes("429") || lowerMessage.includes("rate limit") || lowerMessage.includes("too many")) {
      return "RATE_LIMIT"
    }

    if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out")) {
      return "TIMEOUT"
    }

    if (
      lowerMessage.includes("connection") ||
      lowerMessage.includes("network") ||
      lowerMessage.includes("econnrefused") ||
      lowerMessage.includes("enotfound")
    ) {
      return "CONNECTION_ERROR"
    }

    if (lowerMessage.includes("redis") || lowerMessage.includes("upstash")) {
      return "REDIS_ERROR"
    }

    if (lowerMessage.includes("parse") || lowerMessage.includes("json") || lowerMessage.includes("syntax")) {
      return "PARSE_ERROR"
    }

    if (
      lowerMessage.includes("map is not a function") ||
      lowerMessage.includes("cannot read property") ||
      lowerMessage.includes("undefined")
    ) {
      return "TYPE_ERROR"
    }

    if (lowerMessage.includes("data") || lowerMessage.includes("format")) {
      return "DATA_ERROR"
    }

    return "UNKNOWN_ERROR"
  }

  private static determineRedisStatus(errorInfo: { message: string; type: string }): string {
    switch (errorInfo.type) {
      case "RATE_LIMIT":
        return "rate_limited"
      case "TIMEOUT":
        return "timeout"
      case "CONNECTION_ERROR":
        return "disconnected"
      case "REDIS_ERROR":
        return "error"
      case "TYPE_ERROR":
      case "DATA_ERROR":
        return "data_error"
      case "PARSE_ERROR":
        return "parse_error"
      default:
        return "unknown"
    }
  }

  static getErrorFrequency(businessId: string, operation: string): number {
    const operationKey = `${businessId}:${operation}`
    return this.errorCounts.get(operationKey) || 0
  }

  static getLastErrorTime(businessId: string, operation: string): number | null {
    const operationKey = `${businessId}:${operation}`
    return this.lastErrorTimes.get(operationKey) || null
  }

  static clearErrorHistory(businessId: string, operation: string): void {
    const operationKey = `${businessId}:${operation}`
    this.errorCounts.delete(operationKey)
    this.lastErrorTimes.delete(operationKey)
  }

  static resetRedisHealth(): void {
    this.redisHealthy = true
    this.lastRedisCheck = 0
  }
}
