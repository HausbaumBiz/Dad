"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, Ticket, Loader2 } from "lucide-react"

export default function BusinessCouponsPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [isLoading, setIsLoading] = useState(true)
  const [businessName, setBusinessName] = useState<string>("Business")

  useEffect(() => {
    // Simulate loading business data
    const timer = setTimeout(() => {
      setIsLoading(false)
      // In a real implementation, you would fetch the business name here
    }, 1000)

    return () => clearTimeout(timer)
  }, [businessId])

  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold ml-4">Coupons</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading coupons...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold ml-4">{businessName}'s Coupons</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Coupons</CardTitle>
          <CardDescription>Special offers and discounts</CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          <div className="text-center">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No coupons available</p>
            <p className="text-sm text-gray-400 mb-4">This business hasn't created any coupons yet.</p>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
