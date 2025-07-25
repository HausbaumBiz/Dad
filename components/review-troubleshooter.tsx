"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, RefreshCw, Database, Clock, Wifi, Bug, Loader2 } from "lucide-react"

interface ReviewTroubleshooterProps {
  businessId: string
  businessName?: string
  errorData?: any
  onRetry?: () => void
}

export function ReviewTroubleshooter({ businessId, businessName, errorData, onRetry }: ReviewTroubleshooterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/debug/business-reviews/${businessId}`)
      const data = await response.json()
      setDiagnostics(data)
    } catch (error) {
      console.error("Error running diagnostics:", error)
      setDiagnostics({
        success: false,
        error: "Failed to run diagnostics",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case "TIMEOUT":
        return <Clock className="h-4 w-4" />
      case "CONNECTION_ERROR":
        return <Wifi className="h-4 w-4" />
      case "REDIS_ERROR":
      case "DATA_ERROR":
        return <Database className="h-4 w-4" />
      default:
        return <Bug className="h-4 w-4" />
    }
  }

  const getErrorColor = (errorType: string) => {
    switch (errorType) {
      case "TIMEOUT":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "CONNECTION_ERROR":
        return "bg-red-100 text-red-800 border-red-200"
      case "REDIS_ERROR":
      case "DATA_ERROR":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800"
      case "timeout":
        return "bg-yellow-100 text-yellow-800"
      case "rate_limited":
        return "bg-orange-100 text-orange-800"
      case "disconnected":
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch {
      return timestamp
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <AlertTriangle className="h-4 w-4" />
          Troubleshoot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Review System Troubleshooter
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-[60vh]">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">Business: {businessName || businessId}</div>
            <div className="flex gap-2">
              <Button onClick={runDiagnostics} disabled={loading} size="sm" variant="outline">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                Run Diagnostics
              </Button>
              {onRetry && (
                <Button onClick={onRetry} size="sm">
                  Retry Reviews
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1">
            {/* Error Summary */}
            {errorData && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getErrorIcon(errorData.errorType)}
                    Error Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getErrorColor(errorData.errorType)}>{errorData.errorType}</Badge>
                    <Badge className={getStatusColor(errorData.redisStatus)}>Redis: {errorData.redisStatus}</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Error:</strong> {errorData.errorMessage}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Time:</strong> {formatTimestamp(errorData.timestamp)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Retry Attempts:</strong> {errorData.retryAttempts}
                    </div>
                    {errorData.networkLatency > 0 && (
                      <div className="text-sm text-gray-600">
                        <strong>Response Time:</strong> {errorData.networkLatency}ms
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Diagnostics Results */}
            {diagnostics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5" />
                    System Diagnostics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Connection Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Redis Connection</div>
                      <Badge className={getStatusColor(diagnostics.redisStatus)}>
                        {diagnostics.redisConnected ? "Connected" : "Disconnected"}
                      </Badge>
                      {diagnostics.connectionTime && (
                        <div className="text-xs text-gray-500 mt-1">{diagnostics.connectionTime}ms response time</div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Review Count</div>
                      <div className="text-lg font-bold">{diagnostics.reviewCount || 0}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Environment Info */}
                  <div>
                    <div className="text-sm font-medium mb-2">Environment</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Redis URL: {diagnostics.debugInfo?.redisUrl || "unknown"}</div>
                      <div>KV URL: {diagnostics.debugInfo?.kvUrl || "unknown"}</div>
                      <div>Environment: {diagnostics.debugInfo?.environment || "unknown"}</div>
                      <div>Node Version: {diagnostics.debugInfo?.nodeVersion || "unknown"}</div>
                    </div>
                  </div>

                  {/* Error Details */}
                  {diagnostics.errorDetails && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium mb-2">Error Details</div>
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <div className="text-sm">
                            <strong>Operation:</strong> {diagnostics.errorDetails.operation}
                          </div>
                          <div className="text-sm">
                            <strong>Message:</strong> {diagnostics.errorDetails.message}
                          </div>
                          {diagnostics.errorDetails.stack && (
                            <div className="text-xs text-gray-600 mt-2">
                              <strong>Stack:</strong>
                              <pre className="whitespace-pre-wrap">{diagnostics.errorDetails.stack}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Sample Review */}
                  {diagnostics.sampleReview && (
                    <>
                      <Separator />
                      <div>
                        <div className="text-sm font-medium mb-2">Sample Review Data</div>
                        <div className="bg-gray-50 border rounded p-3">
                          <pre className="text-xs whitespace-pre-wrap">
                            {JSON.stringify(diagnostics.sampleReview, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="text-xs text-gray-500">Last updated: {formatTimestamp(diagnostics.timestamp)}</div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {errorData?.errorType === "TIMEOUT" && (
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 mt-0.5 text-yellow-600" />
                      <div>
                        <strong>Timeout Issue:</strong> The database is taking too long to respond. This is usually
                        temporary due to high traffic. Try again in a few moments.
                      </div>
                    </div>
                  )}

                  {errorData?.errorType === "CONNECTION_ERROR" && (
                    <div className="flex items-start gap-2">
                      <Wifi className="h-4 w-4 mt-0.5 text-red-600" />
                      <div>
                        <strong>Connection Issue:</strong> Unable to connect to the database. Check your internet
                        connection and try again.
                      </div>
                    </div>
                  )}

                  {errorData?.errorType === "DATA_ERROR" && (
                    <div className="flex items-start gap-2">
                      <Database className="h-4 w-4 mt-0.5 text-blue-600" />
                      <div>
                        <strong>Data Format Issue:</strong> There's a temporary issue with the data format. This usually
                        resolves automatically.
                      </div>
                    </div>
                  )}

                  {errorData?.errorType === "REDIS_ERROR" && (
                    <div className="flex items-start gap-2">
                      <Database className="h-4 w-4 mt-0.5 text-blue-600" />
                      <div>
                        <strong>Database Issue:</strong> The review database is temporarily unavailable. Please try
                        again in a few minutes.
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <RefreshCw className="h-4 w-4 mt-0.5 text-green-600" />
                    <div>
                      <strong>General:</strong> Most issues are temporary. Try refreshing the page or clicking "Retry
                      Reviews" after a short wait.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
