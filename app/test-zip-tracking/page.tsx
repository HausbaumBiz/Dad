"use client"

import { useState, useEffect } from "react"
import { MainHeader } from "@/components/main-header"
import { MainFooter } from "@/components/main-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, RefreshCw, TestTube, Trash2, Eye, Phone, Globe } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  getCurrentZipCode,
  setCurrentZipCode,
  clearStoredZipCodes,
  simulateAnalyticsEvent,
} from "@/lib/analytics-utils"
import { getDebugAnalytics } from "@/app/actions/analytics-actions"

export default function TestZipTrackingPage() {
  const { toast } = useToast()
  const [currentZip, setCurrentZip] = useState<string | undefined>()
  const [manualZip, setManualZip] = useState("")
  const [testBusinessId, setTestBusinessId] = useState("demo-business")
  const [debugData, setDebugData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load current ZIP code on mount
  useEffect(() => {
    const zip = getCurrentZipCode()
    setCurrentZip(zip)
  }, [])

  const handleSetZipCode = (zipCode: string) => {
    setCurrentZipCode(zipCode)
    setCurrentZip(zipCode)
    toast({
      title: "ZIP Code Set",
      description: `Current ZIP code set to ${zipCode}`,
    })
  }

  const handleClearZipCodes = () => {
    clearStoredZipCodes()
    setCurrentZip(undefined)
    toast({
      title: "ZIP Codes Cleared",
      description: "All stored ZIP codes have been cleared",
    })
  }

  const handleManualSet = () => {
    if (manualZip && /^\d{5}$/.test(manualZip)) {
      handleSetZipCode(manualZip)
      setManualZip("")
    } else {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code",
        variant: "destructive",
      })
    }
  }

  const handleSimulateEvent = async (eventType: string) => {
    try {
      const result = await simulateAnalyticsEvent(testBusinessId, eventType, currentZip, {
        testMode: true,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
      })

      toast({
        title: "Event Simulated",
        description: `${eventType} event tracked for business ${testBusinessId} with ZIP ${currentZip || "none"}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to simulate event",
        variant: "destructive",
      })
    }
  }

  const handleLoadDebugData = async () => {
    setIsLoading(true)
    try {
      const data = await getDebugAnalytics(testBusinessId)
      setDebugData(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load debug data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const quickZipCodes = [
    { zip: "44718", label: "Akron, OH" },
    { zip: "10001", label: "New York, NY" },
    { zip: "90210", label: "Beverly Hills, CA" },
    { zip: "60601", label: "Chicago, IL" },
    { zip: "33101", label: "Miami, FL" },
    { zip: "98101", label: "Seattle, WA" },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <MainHeader />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <TestTube className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">ZIP Code Tracking Test</h1>
          </div>

          <Tabs defaultValue="current" className="w-full">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto mb-8">
              <TabsTrigger value="current">Current ZIP</TabsTrigger>
              <TabsTrigger value="set">Set ZIP</TabsTrigger>
              <TabsTrigger value="test">Test Events</TabsTrigger>
              <TabsTrigger value="debug">Debug Data</TabsTrigger>
            </TabsList>

            {/* Current ZIP Tab */}
            <TabsContent value="current" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Current ZIP Code Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    {currentZip ? (
                      <div className="space-y-2">
                        <Badge className="text-lg px-4 py-2 bg-green-100 text-green-800">
                          Current ZIP: {currentZip}
                        </Badge>
                        <p className="text-sm text-gray-600">This ZIP code will be used for analytics tracking</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant="secondary" className="text-lg px-4 py-2">
                          No ZIP Code Set
                        </Badge>
                        <p className="text-sm text-gray-600">Analytics will be tracked without location data</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button onClick={() => setCurrentZip(getCurrentZipCode())} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Button onClick={handleClearZipCodes} variant="outline">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Set ZIP Tab */}
            <TabsContent value="set" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Set ZIP Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {quickZipCodes.map((item) => (
                      <Button
                        key={item.zip}
                        variant="outline"
                        onClick={() => handleSetZipCode(item.zip)}
                        className="flex flex-col items-center p-4 h-auto"
                      >
                        <span className="font-bold text-lg">{item.zip}</span>
                        <span className="text-xs text-gray-600">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual ZIP Code Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="manualZip">Enter ZIP Code</Label>
                      <Input
                        id="manualZip"
                        type="text"
                        placeholder="12345"
                        value={manualZip}
                        onChange={(e) => setManualZip(e.target.value)}
                        maxLength={5}
                        pattern="\d{5}"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleManualSet} disabled={!manualZip}>
                        Set ZIP
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Test Events Tab */}
            <TabsContent value="test" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Business Analytics Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessId">Business ID</Label>
                    <Input
                      id="businessId"
                      value={testBusinessId}
                      onChange={(e) => setTestBusinessId(e.target.value)}
                      placeholder="demo-business"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Button
                      onClick={() => handleSimulateEvent("profile_view")}
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Eye className="h-5 w-5 mb-2" />
                      Profile View
                    </Button>
                    <Button
                      onClick={() => handleSimulateEvent("phone_click")}
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Phone className="h-5 w-5 mb-2" />
                      Phone Click
                    </Button>
                    <Button
                      onClick={() => handleSimulateEvent("website_click")}
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Globe className="h-5 w-5 mb-2" />
                      Website Click
                    </Button>
                  </div>

                  <div className="text-center text-sm text-gray-600">
                    Current ZIP: <strong>{currentZip || "None"}</strong>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Debug Data Tab */}
            <TabsContent value="debug" className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Debug Analytics Data</CardTitle>
                  <Button onClick={handleLoadDebugData} disabled={isLoading} size="sm">
                    {isLoading ? "Loading..." : "Refresh Data"}
                  </Button>
                </CardHeader>
                <CardContent>
                  {debugData ? (
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold mb-2">Analytics Summary</h3>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p>Total Events: {debugData.analytics?.totalEvents || 0}</p>
                          <p>Profile Views: {debugData.analytics?.profileViews || 0}</p>
                          <p>Phone Clicks: {debugData.analytics?.phoneClicks || 0}</p>
                          <p>Website Clicks: {debugData.analytics?.websiteClicks || 0}</p>
                          <p>ZIP Codes Tracked: {debugData.analytics?.zipCodeAnalytics?.length || 0}</p>
                        </div>
                      </div>

                      {debugData.analytics?.zipCodeAnalytics?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">ZIP Code Analytics</h3>
                          <div className="space-y-2">
                            {debugData.analytics.zipCodeAnalytics.map((zip: any) => (
                              <div key={zip.zipCode} className="bg-gray-50 p-2 rounded text-sm">
                                <span className="font-medium">{zip.zipCode}</span>
                                {zip.city && zip.state && (
                                  <span className="text-gray-600 ml-2">
                                    {zip.city}, {zip.state}
                                  </span>
                                )}
                                <span className="float-right">{zip.count} views</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {debugData.recentEvents?.length > 0 && (
                        <div>
                          <h3 className="font-semibold mb-2">Recent Events</h3>
                          <div className="max-h-60 overflow-y-auto space-y-1">
                            {debugData.recentEvents.slice(0, 10).map((event: any, index: number) => (
                              <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                                <div className="flex justify-between">
                                  <span className="font-medium">{event.eventType}</span>
                                  <span className="text-gray-600">{event.zipCode || "No ZIP"}</span>
                                </div>
                                <div className="text-gray-500">{event.formattedTime}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>Click "Refresh Data" to load debug information</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <MainFooter />
    </div>
  )
}
