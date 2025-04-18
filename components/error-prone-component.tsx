"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { withErrorBoundary } from "@/components/with-error-boundary"

function ErrorProneComponent() {
  const [shouldError, setShouldError] = useState(false)

  if (shouldError) {
    // This will trigger the error boundary
    throw new Error("This is a simulated error!")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Testing Component</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">Click the button below to simulate an error:</p>
        <Button onClick={() => setShouldError(true)}>Trigger Error</Button>
      </CardContent>
    </Card>
  )
}

// Wrap the component with an error boundary
export default withErrorBoundary(ErrorProneComponent, {
  onError: (error, errorInfo) => {
    console.log("Caught an error:", error, errorInfo)
    // You could report this to your error tracking service
  },
})
