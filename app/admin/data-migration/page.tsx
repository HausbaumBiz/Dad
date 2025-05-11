"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { migrateZipCodes } from "../actions/admin-actions"

export default function DataMigrationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    processed: number
    errors: number
    message?: string
  } | null>(null)

  const handleMigrateZipCodes = async () => {
    setIsLoading(true)
    try {
      const migrationResult = await migrateZipCodes()
      setResult(migrationResult)
    } catch (error) {
      console.error("Error during migration:", error)
      setResult({
        success: false,
        processed: 0,
        errors: 1,
        message: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Data Migration Tools</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>ZIP Code Data Migration</CardTitle>
            <CardDescription>
              This tool will migrate ZIP code data to the new format, ensuring both JSON and Set storage for efficient
              querying.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">This migration will:</p>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>Scan all businesses in the database</li>
              <li>Convert ZIP code data to both JSON and Set formats</li>
              <li>Update ZIP code indexes for efficient querying</li>
              <li>Handle nationwide business flags</li>
            </ul>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{result.success ? "Migration Successful" : "Migration Failed"}</AlertTitle>
                <AlertDescription>
                  {result.success
                    ? `Successfully processed ${result.processed} businesses with ${result.errors} errors.`
                    : result.message || "An error occurred during migration."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleMigrateZipCodes} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Migrating...
                </>
              ) : (
                "Run ZIP Code Migration"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
