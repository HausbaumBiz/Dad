"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { MapPin, Activity, Users, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import {
  trackAnalyticsEvent,
  getBusinessAnalytics,
  cleanupAnalyticsKeys,
  type ZipCodeAnalytics,
} from "@/app/actions/analytics-actions"

interface TestBusiness {
  id: string
  name: string
  category: string
}

interface TestResult {
  success: boolean
  message: string
  zipCode: string
  timestamp: number
}

const TEST_BUSINESSES: TestBusiness[] = [
  { id: "test-business-1", name: "Elite Home Services", category: "Home Improvement" },
  { id: "test-business-2", name: "Premier Auto Repair", category: "Automotive" },
  { id: "test-business-3", name: "Downtown Dental Care", category: "Medical" },
]

const SAMPLE_ZIP_CODES = [
  { zip: "10001", city: "New York", state: "NY" },
  { zip: "90210", city: "Beverly Hills", state: "CA" },
  { zip: "60601", city: "Chicago", state: "IL" },
  { zip: "33101", city: "Miami", state: "FL" },
  { zip: "78701", city: "Austin", state: "TX" },
  { zip: "02101", city: "Boston", state: "MA" },
]

export default function ZipCodeTrackingTest() {
  const [selectedBusiness, setSelectedBusiness] = useState<string>("")
  const [selectedZipCode, setSelectedZipCode] = useState<string>("")
  const [customZipCode, setCustomZipCode] = useState<string>("")
  const [analytics, setAnalytics] = useState<any>(null)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRunningAutomated, setIsRunningAutomated] = useState(false)

  // Load analytics when business changes
  useEffect(() => {
    if (selectedBusiness) {
      loadAnalytics()
    }
  }, [selectedBusiness])

  const loadAnalytics = async () => {
    if (!selectedBusiness) return

    try {
      const data = await getBusinessAnalytics(selectedBusiness)
      setAnalytics(data)
    } catch (error) {
      console.error("Error loading analytics:", error)
    }
  }

  const simulateProfileView = async () => {
    if (!selectedBusiness) {
      alert("Please select a business first")
      return
    }

    const zipCode = customZipCode || selectedZipCode
    if (!zipCode || zipCode.length !== 5) {
      alert("Please select or enter a valid 5-digit ZIP code")
      return
    }

    setIsLoading(true)

    try {
      // Find ZIP code metadata
      const zipData = SAMPLE_ZIP_CODES.find((z) => z.zip === zipCode)

      const result = await trackAnalyticsEvent({
        businessId: selectedBusiness,
        eventType: "profile_view",
        zipCode: zipCode,
        timestamp: Date.now(),
        metadata: {
          city: zipData?.city || "",
          state: zipData?.state || "",
          testMode: true,
        },
      })

      const testResult: TestResult = {
        success: result.success,
        message: result.message,
        zipCode: zipCode,
        timestamp: Date.now(),
      }

      setTestResults((prev) => [testResult, ...prev.slice(0, 9)]) // Keep last 10 results

      if (result.success) {
        // Reload analytics after a short delay
        setTimeout(loadAnalytics, 500)
      }
    } catch (error) {
      console.error("Error simulating profile view:", error)
      setTestResults((prev) => [
        {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error",
          zipCode: zipCode,
          timestamp: Date.now(),
        },
        ...prev.slice(0, 9),
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const runAutomatedTest = async () => {
    if (!selectedBusiness) {
      alert("Please select a business first")
      return
    }

    setIsRunningAutomated(true)
    setTestResults([])

    try {
      // Run 5 tests with different ZIP codes
      for (let i = 0; i < 5; i++) {
        const zipData = SAMPLE_ZIP_CODES[i]

        console.log(`Running test ${i + 1}/5 for ZIP ${zipData.zip}`)

        const result = await trackAnalyticsEvent({
          businessId: selectedBusiness,
          eventType: "profile_view",
          zipCode: zipData.zip,
          timestamp: Date.now(),
          metadata: {
            city: zipData.city,
            state: zipData.state,
            testMode: true,
            automatedTest: true,
          },
        })

        const testResult: TestResult = {
          success: result.success,
          message: result.message,
          zipCode: zipData.zip,
          timestamp: Date.now(),
        }

        setTestResults((prev) => [testResult, ...prev])

        // Wait 1 second between tests
        if (i < 4) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }

      // Reload analytics after all tests
      setTimeout(loadAnalytics, 1000)
    } catch (error) {
      console.error("Error running automated test:", error)
    } finally {
      setIsRunningAutomated(false)
    }
  }

  const handleCleanupKeys = async () => {
    if (!selectedBusiness) {
      alert("Please select a business first")
      return
    }

    try {
      const result = await cleanupAnalyticsKeys(selectedBusiness)
      if (result.success) {
        alert("Analytics keys cleaned up successfully")
        setAnalytics(null)
        setTestResults([])
      } else {
        alert(`Cleanup failed: ${result.message}`)
      }
    } catch (error) {
      console.error("Error cleaning up keys:", error)
      alert("Error cleaning up keys")
    }
  }

  const getMaxViewCount = () => {
    if (!analytics?.zipCodeAnalytics?.length) return 1
    return Math.max(...analytics.zipCodeAnalytics.map((z: ZipCodeAnalytics) => z.viewCount))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">ZIP Code Tracking Test</h1>
        <p className="text-muted-foreground">
          Test the analytics tracking functionality by simulating business profile views from different locations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Test Controls
            </CardTitle>
            <CardDescription>Configure and run ZIP code tracking tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Business Selection */}
            <div className="space-y-2">
              <Label htmlFor="business">Select Test Business</Label>
              <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a business to test" />
                </SelectTrigger>
                <SelectContent>
                  {TEST_BUSINESSES.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name} ({business.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* ZIP Code Selection */}
            <div className="space-y-3">
              <Label>Select ZIP Code</Label>

              {/* Quick Select */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Quick Select:</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_ZIP_CODES.map((zipData) => (
                    <Button
                      key={zipData.zip}
                      variant={selectedZipCode === zipData.zip ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedZipCode(zipData.zip)
                        setCustomZipCode("")
                      }}
                      className="text-xs"
                    >
                      {zipData.zip}
                      <br />
                      <span className="text-xs opacity-70">
                        {zipData.city}, {zipData.state}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom ZIP Code */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Or enter custom ZIP:</Label>
                <Input
                  placeholder="Enter 5-digit ZIP code"
                  value={customZipCode}
                  onChange={(e) => {
                    setCustomZipCode(e.target.value)
                    if (e.target.value) setSelectedZipCode("")
                  }}
                  maxLength={5}
                />
              </div>
            </div>

            <Separator />

            {/* Test Actions */}
            <div className="space-y-3">
              <Button onClick={simulateProfileView} disabled={isLoading || !selectedBusiness} className="w-full">
                {isLoading ? "Simulating..." : "Simulate Profile View"}
              </Button>

              <Button
                onClick={runAutomatedTest}
                disabled={isRunningAutomated || !selectedBusiness}
                variant="secondary"
                className="w-full"
              >
                {isRunningAutomated ? "Running Automated Test..." : "Run Automated Test (5 ZIP codes)"}
              </Button>

              <Button
                onClick={handleCleanupKeys}
                disabled={!selectedBusiness}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                Cleanup Analytics Keys
              </Button>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="space-y-2">
                <Label>Recent Test Results:</Label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm p-2 rounded border">
                      {result.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-mono">{result.zipCode}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className={result.success ? "text-green-600" : "text-red-600"}>{result.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Live Analytics
            </CardTitle>
            <CardDescription>Real-time analytics data for the selected business</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedBusiness ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Select a business to view analytics data</AlertDescription>
              </Alert>
            ) : !analytics ? (
              <div className="text-center text-muted-foreground">Loading analytics...</div>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{analytics.totalEvents}</div>
                    <div className="text-sm text-muted-foreground">Total Events</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{analytics.profileViews}</div>
                    <div className="text-sm text-muted-foreground">Profile Views</div>
                  </div>
                </div>

                {/* ZIP Code Analytics */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <Label>ZIP Code Analytics</Label>
                  </div>

                  {analytics.zipCodeAnalytics?.length > 0 ? (
                    <div className="space-y-2">
                      {analytics.zipCodeAnalytics.map((zipData: ZipCodeAnalytics, index: number) => (
                        <div key={zipData.zipCode} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{zipData.zipCode}</Badge>
                              {zipData.city && zipData.state && (
                                <span className="text-sm text-muted-foreground">
                                  {zipData.city}, {zipData.state}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{zipData.viewCount}</span>
                              <span className="text-sm text-muted-foreground">views</span>
                            </div>
                          </div>
                          <Progress value={(zipData.viewCount / getMaxViewCount()) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No ZIP code data yet. Run some tests to see analytics!
                    </div>
                  )}
                </div>

                {/* Last Updated */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last updated: {new Date(analytics.lastUpdated).toLocaleTimeString()}
                </div>

                <Button onClick={loadAnalytics} variant="outline" size="sm" className="w-full bg-transparent">
                  Refresh Analytics
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Individual Testing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Select a test business</li>
                <li>Choose a ZIP code (quick select or custom)</li>
                <li>Click "Simulate Profile View"</li>
                <li>Watch the analytics update in real-time</li>
              </ol>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Automated Testing:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Select a test business</li>
                <li>Click "Run Automated Test"</li>
                <li>Watch 5 profile views from different ZIP codes</li>
                <li>Verify analytics accumulate correctly</li>
              </ol>
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Troubleshooting:</strong> If you see "WRONGTYPE" errors, click "Cleanup Analytics Keys" to reset
              the Redis data structure and try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
