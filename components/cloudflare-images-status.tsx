"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, Cloud, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function CloudflareImagesStatus() {
  const [isChecking, setIsChecking] = useState(false)
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const checkConfiguration = async () => {
    try {
      setIsChecking(true)
      setErrorMessage(null)

      const response = await fetch("/api/cloudflare-images/check-config")
      const data = await response.json()

      setIsConfigured(data.configured)

      if (!data.configured) {
        setErrorMessage(data.error || "Unknown error")
        toast({
          title: "Cloudflare Images configuration issue",
          description: data.error || "Unknown error",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Cloudflare Images configured",
          description: "Your Cloudflare Images integration is working properly.",
        })
      }
    } catch (error) {
      setIsConfigured(false)
      setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      toast({
        title: "Failed to check Cloudflare Images configuration",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConfiguration()
  }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            <div>
              <CardTitle>Cloudflare Images</CardTitle>
              <CardDescription>Image storage service status</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={checkConfiguration} disabled={isChecking} className="text-xs">
            {isChecking ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              "Check Status"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isConfigured === null ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking Cloudflare Images configuration...</span>
          </div>
        ) : isConfigured ? (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
            <span className="text-sm">Cloudflare Images is configured and ready to use</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-sm">Cloudflare Images is not configured properly</span>
            </div>
            {errorMessage && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
      {!isConfigured && isConfigured !== null && (
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Please ensure that your Cloudflare API token and account ID are properly configured in your environment
            variables.
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
