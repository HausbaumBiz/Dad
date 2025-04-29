"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function TestRedisPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    testValue?: string
    error?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testRedisConnection = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/test-redis")
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError("Failed to test Redis connection: " + (err instanceof Error ? err.message : String(err)))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    testRedisConnection()
  }, [])

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Redis Connection Test</CardTitle>
          <CardDescription>Verify that your Upstash Redis connection is working properly</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-lg">Testing connection...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : result ? (
            <div className="space-y-4">
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4" />}
                <AlertTitle>{result.success ? "Success" : "Failed"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>

              {result.success && result.testValue && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <h3 className="text-sm font-medium text-gray-900">Test Value Retrieved:</h3>
                  <p className="mt-2 text-sm text-gray-700 break-all">{result.testValue}</p>
                </div>
              )}

              {!result.success && result.error && (
                <div className="mt-4 p-4 bg-red-50 rounded-md">
                  <h3 className="text-sm font-medium text-red-800">Error Details:</h3>
                  <p className="mt-2 text-sm text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onClick={testRedisConnection} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Redis Connection Again"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
