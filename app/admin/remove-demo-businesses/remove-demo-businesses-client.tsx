"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Trash2, AlertTriangle, CheckCircle, RefreshCw, Loader2 } from "lucide-react"
import { identifyDemoBusinesses, removeDemoBusiness, removeAllDemoBusinesses } from "../actions/remove-demo-businesses"

interface Business {
  id: string
  businessName?: string
  business_name?: string
  email?: string
  isDemo?: boolean
  is_demo?: boolean
  [key: string]: any
}

interface RemovalResult {
  success: boolean
  removed: number
  errors: string[]
  removedBusinesses: Business[]
}

export default function RemoveDemoBusinessesClient() {
  const [demoBusinesses, setDemoBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmSingleDialogOpen, setConfirmSingleDialogOpen] = useState(false)
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [result, setResult] = useState<RemovalResult | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function loadDemoBusinesses() {
      try {
        setLoading(true)
        setError(null)
        const businesses = await identifyDemoBusinesses()
        setDemoBusinesses(businesses)
      } catch (err) {
        setError("Failed to load demo businesses: " + (err instanceof Error ? err.message : String(err)))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadDemoBusinesses()
  }, [refreshKey])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
    setResult(null)
  }

  const handleRemoveAll = async () => {
    try {
      setRemoving(true)
      setError(null)
      const result = await removeAllDemoBusinesses()
      setResult(result)
      setConfirmDialogOpen(false)
      handleRefresh()
    } catch (err) {
      setError("Failed to remove demo businesses: " + (err instanceof Error ? err.message : String(err)))
      console.error(err)
    } finally {
      setRemoving(false)
    }
  }

  const handleRemoveSingle = async (businessId: string) => {
    try {
      setRemoving(true)
      setError(null)
      const result = await removeDemoBusiness(businessId)
      setResult(result)
      setConfirmSingleDialogOpen(false)
      handleRefresh()
    } catch (err) {
      setError("Failed to remove demo business: " + (err instanceof Error ? err.message : String(err)))
      console.error(err)
    } finally {
      setRemoving(false)
    }
  }

  const confirmRemoveSingle = (businessId: string) => {
    setSelectedBusinessId(businessId)
    setConfirmSingleDialogOpen(true)
  }

  // Helper function to get business name
  const getBusinessName = (business: Business) => {
    return business.businessName || business.business_name || "Unknown Business"
  }

  // Helper function to determine demo indicators
  const getDemoIndicators = (business: Business) => {
    const indicators = []
    const businessName = getBusinessName(business)
    const email = business.email || ""

    if (business.isDemo === true || business.is_demo === true) indicators.push("Demo Flag")
    if (typeof businessName === "string") {
      if (businessName.toLowerCase().includes("demo")) indicators.push("Demo in Name")
      if (businessName.toLowerCase().includes("sample")) indicators.push("Sample in Name")
    }
    if (typeof email === "string") {
      if (email.toLowerCase().includes("demo")) indicators.push("Demo in Email")
      if (email.toLowerCase().includes("sample")) indicators.push("Sample in Email")
      if (email.toLowerCase().includes("example")) indicators.push("Example in Email")
    }

    return indicators
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Demo Businesses</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading || removing}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
          <Button
            variant="destructive"
            onClick={() => setConfirmDialogOpen(true)}
            disabled={loading || removing || demoBusinesses.length === 0}
          >
            {removing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Remove All Demo Businesses
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <AlertTitle>
            {result.success
              ? `Successfully removed ${result.removed} demo business(es)`
              : "Failed to remove some demo businesses"}
          </AlertTitle>
          <AlertDescription>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p>Errors:</p>
                <ul className="list-disc pl-5">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Demo Businesses ({demoBusinesses.length})</CardTitle>
          <CardDescription>
            These businesses have been identified as demo or sample businesses based on their name, email, or demo flag.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p>Loading demo businesses...</p>
            </div>
          ) : demoBusinesses.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p>No demo businesses found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Demo Indicators</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoBusinesses.map((business) => {
                  const businessName = getBusinessName(business)
                  const demoIndicators = getDemoIndicators(business)

                  return (
                    <TableRow key={business.id}>
                      <TableCell className="font-mono text-xs">{business.id}</TableCell>
                      <TableCell>{businessName}</TableCell>
                      <TableCell>{business.email || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {demoIndicators.map((indicator, i) => (
                            <Badge key={i} variant="outline">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmRemoveSingle(business.id)}
                          disabled={loading || removing}
                        >
                          {removing && selectedBusinessId === business.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-1" />
                          )}
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirm Remove All Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove All Demo Businesses</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove all {demoBusinesses.length} demo businesses? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={removing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveAll} disabled={removing}>
              {removing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Remove All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Single Dialog */}
      <Dialog open={confirmSingleDialogOpen} onOpenChange={setConfirmSingleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Demo Business</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this demo business? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmSingleDialogOpen(false)} disabled={removing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedBusinessId && handleRemoveSingle(selectedBusinessId)}
              disabled={removing}
            >
              {removing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
