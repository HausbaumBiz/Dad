"use client"

import { useState } from "react"
import { deleteBusiness } from "@/app/actions/business-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, Loader2, Trash2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DeleteResult {
  id: string
  success: boolean
  message: string
}

export default function RemoveSpecificBusinessesClient() {
  const [businessIds, setBusinessIds] = useState<string>(
    "cf3f3b6a-b280-40b3-beda-7e6478d6cc8f,8470952c-ecbd-49e9-b99b-a12d4a474817,53be1cbc-f3e3-4e03-8b97-43cd14b3c2d1,426b971e-6e67-412c-b3cb-9057ba855ea5,18a3d63c-e948-432f-bf2c-2802e024f46f",
  )
  const [isDeleting, setIsDeleting] = useState<boolean>(false)
  const [results, setResults] = useState<DeleteResult[]>([])
  const [currentlyProcessing, setCurrentlyProcessing] = useState<string | null>(null)
  const [overallStatus, setOverallStatus] = useState<"idle" | "success" | "error" | "processing">("idle")

  const handleDelete = async () => {
    // Reset states
    setIsDeleting(true)
    setResults([])
    setOverallStatus("processing")

    // Parse business IDs, removing any whitespace
    const ids = businessIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0)

    if (ids.length === 0) {
      setOverallStatus("error")
      setIsDeleting(false)
      return
    }

    let successCount = 0
    let errorCount = 0

    // Process each business ID sequentially
    for (const id of ids) {
      try {
        setCurrentlyProcessing(id)
        const result = await deleteBusiness(id)

        setResults((prev) => [
          ...prev,
          {
            id,
            success: result.success,
            message: result.message,
          },
        ])

        if (result.success) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        setResults((prev) => [
          ...prev,
          {
            id,
            success: false,
            message: error instanceof Error ? error.message : "An unknown error occurred",
          },
        ])
        errorCount++
      }
    }

    setCurrentlyProcessing(null)
    setIsDeleting(false)
    setOverallStatus(errorCount === 0 ? "success" : errorCount === ids.length ? "error" : "success")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Remove Specific Businesses</CardTitle>
        <CardDescription>Enter business IDs separated by commas to remove them from the database.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Enter business IDs separated by commas"
          value={businessIds}
          onChange={(e) => setBusinessIds(e.target.value)}
          rows={4}
          disabled={isDeleting}
          className="font-mono text-sm"
        />

        {overallStatus === "success" && (
          <Alert className="bg-green-50 border-green-200 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Successfully processed all business deletions. {results.filter((r) => r.success).length} businesses were
              deleted.
            </AlertDescription>
          </Alert>
        )}

        {overallStatus === "error" && (
          <Alert className="bg-red-50 border-red-200 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There were errors during the deletion process. Please check the results below.
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="mt-4 border rounded-md overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b font-medium">Results</div>
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`px-4 py-3 flex items-start ${result.success ? "bg-green-50" : "bg-red-50"}`}
                >
                  <div className="mr-3 mt-0.5">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-mono text-sm">{result.id}</div>
                    <div className={result.success ? "text-green-700" : "text-red-700"}>{result.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentlyProcessing && (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono text-sm">Processing: {currentlyProcessing}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleDelete}
          disabled={isDeleting || !businessIds.trim()}
          className="bg-red-600 hover:bg-red-700 flex items-center"
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Businesses
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
