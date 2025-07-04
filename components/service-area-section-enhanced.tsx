"use client"

import { useState, useEffect, useCallback, startTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ZipCodeRadiusSelector } from "@/components/zip-code-radius-selector"
import { saveBusinessZipCodes, getBusinessZipCodes } from "@/app/actions/zip-code-actions"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2, MapPin, Globe, Save } from "lucide-react"
import type { ZipCodeData } from "@/lib/zip-code-types"

export function ServiceAreaSectionEnhanced() {
  const [selectedZipCodes, setSelectedZipCodes] = useState<ZipCodeData[]>([])
  const [isNationwide, setIsNationwide] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasLoadedData, setHasLoadedData] = useState(false)
  const [initialZipCodes, setInitialZipCodes] = useState<ZipCodeData[]>([])
  const [initialNationwide, setInitialNationwide] = useState(false)
  const { toast } = useToast()

  // Check if there are actual changes compared to initial state
  const checkForChanges = useCallback(
    (newZipCodes: ZipCodeData[], newNationwide: boolean) => {
      // Compare nationwide setting
      if (newNationwide !== initialNationwide) {
        return true
      }

      // Compare ZIP codes
      if (newZipCodes.length !== initialZipCodes.length) {
        return true
      }

      // Check if ZIP codes are different (compare by zip property)
      const initialZipSet = new Set(initialZipCodes.map((z) => z.zip))
      const newZipSet = new Set(newZipCodes.map((z) => z.zip))

      for (const zip of newZipSet) {
        if (!initialZipSet.has(zip)) {
          return true
        }
      }

      for (const zip of initialZipSet) {
        if (!newZipSet.has(zip)) {
          return true
        }
      }

      return false
    },
    [initialZipCodes, initialNationwide],
  )

  const hasUnsavedChanges = checkForChanges(selectedZipCodes, isNationwide)

  // Load existing ZIP codes on component mount
  useEffect(() => {
    let mounted = true

    async function loadExistingZipCodes() {
      if (hasLoadedData) return // Prevent multiple loads

      console.log("[SERVICE AREA] Loading existing ZIP codes...")
      setIsLoading(true)

      try {
        const result = await getBusinessZipCodes()
        console.log("[SERVICE AREA] Load result:", result)

        if (result.success && result.data && mounted) {
          const zipCodes = Array.isArray(result.data.zipCodes) ? result.data.zipCodes : []
          const nationwide = Boolean(result.data.isNationwide)

          console.log(`[SERVICE AREA] Loaded ${zipCodes.length} ZIP codes, nationwide: ${nationwide}`)

          startTransition(() => {
            setSelectedZipCodes(zipCodes)
            setIsNationwide(nationwide)
            setInitialZipCodes(zipCodes) // Store initial state
            setInitialNationwide(nationwide) // Store initial state
            setHasLoadedData(true)
          })
        } else if (mounted) {
          console.log("[SERVICE AREA] No existing data found or load failed")
          startTransition(() => {
            setInitialZipCodes([]) // Store initial state as empty
            setInitialNationwide(false) // Store initial state as false
            setHasLoadedData(true)
          })
        }
      } catch (error) {
        console.error("[SERVICE AREA] Error loading existing ZIP codes:", error)
        if (mounted) {
          toast({
            title: "Warning",
            description: "Could not load your saved service area",
            variant: "destructive",
          })
          startTransition(() => {
            setInitialZipCodes([]) // Store initial state as empty
            setInitialNationwide(false) // Store initial state as false
            setHasLoadedData(true)
          })
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    loadExistingZipCodes()

    return () => {
      mounted = false
    }
  }, [hasLoadedData, toast])

  const handleZipCodesSelected = useCallback((zipCodes: ZipCodeData[]) => {
    if (!Array.isArray(zipCodes)) {
      console.error("[SERVICE AREA] handleZipCodesSelected received non-array:", typeof zipCodes)
      return
    }

    console.log(`[SERVICE AREA] ZIP codes selected: ${zipCodes.length}`)

    startTransition(() => {
      setSelectedZipCodes(zipCodes)
    })
  }, [])

  const handleNationwideToggle = useCallback((nationwide: boolean) => {
    console.log(`[SERVICE AREA] Nationwide toggled: ${nationwide}`)

    startTransition(() => {
      setIsNationwide(nationwide)
    })
  }, [])

  const handleManualSave = useCallback(async () => {
    if (isSaving) return

    const zipCodesToSave = Array.isArray(selectedZipCodes) ? selectedZipCodes : []
    console.log(`[SERVICE AREA] Manual save triggered: ${zipCodesToSave.length} ZIP codes, nationwide: ${isNationwide}`)

    setIsSaving(true)
    try {
      const result = await saveBusinessZipCodes(zipCodesToSave, isNationwide)
      if (result.success) {
        // Update initial state to match current state
        setInitialZipCodes(zipCodesToSave)
        setInitialNationwide(isNationwide)
        toast({
          title: "Service Area Saved",
          description: isNationwide
            ? "Your service area is set to nationwide"
            : `Service area saved with ${zipCodesToSave.length} ZIP codes`,
        })
      } else {
        throw new Error(result.message || "Failed to save service area")
      }
    } catch (error) {
      console.error("[SERVICE AREA] Manual save error:", error)
      toast({
        title: "Error",
        description: "Failed to save your service area",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [selectedZipCodes, isNationwide, isSaving, toast])

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Service Area</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading your service area...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
          <MapPin className="h-6 w-6" />
          Service Area
          {hasUnsavedChanges && <span className="text-sm text-orange-600 font-normal">(Unsaved Changes)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Service Area Display */}
        {(selectedZipCodes.length > 0 || isNationwide) && (
          <div
            className={`border rounded-lg p-4 ${hasUnsavedChanges ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-200"}`}
          >
            <h3
              className={`font-semibold mb-2 flex items-center gap-2 ${hasUnsavedChanges ? "text-orange-900" : "text-blue-900"}`}
            >
              {isNationwide ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
              {hasUnsavedChanges ? "Pending Service Area" : "Current Service Area"}
            </h3>
            {isNationwide ? (
              <p className={hasUnsavedChanges ? "text-orange-800" : "text-blue-800"}>Nationwide service</p>
            ) : (
              <p className={hasUnsavedChanges ? "text-orange-800" : "text-blue-800"}>
                {selectedZipCodes.length} ZIP code{selectedZipCodes.length !== 1 ? "s" : ""} selected
                {selectedZipCodes.length > 0 && selectedZipCodes[0].city && (
                  <span className={`text-sm block ${hasUnsavedChanges ? "text-orange-600" : "text-blue-600"}`}>
                    Primary location: {selectedZipCodes[0].city}, {selectedZipCodes[0].state} {selectedZipCodes[0].zip}
                  </span>
                )}
              </p>
            )}
            {hasUnsavedChanges && (
              <p className="text-sm text-orange-600 mt-2">Click "Save Service Area" to save these changes</p>
            )}
          </div>
        )}

        {/* Only render the selector after data has loaded */}
        {hasLoadedData && (
          <ZipCodeRadiusSelector
            onZipCodesSelected={handleZipCodesSelected}
            onNationwideToggle={handleNationwideToggle}
            defaultRadius={25}
            maxRadius={100}
            maxResults={450}
            allowNationwide={true}
            initialZipCodes={selectedZipCodes}
            initialNationwide={isNationwide}
          />
        )}

        <div className="flex justify-center gap-4">
          <Button
            onClick={handleManualSave}
            disabled={
              isSaving ||
              !hasUnsavedChanges ||
              !Array.isArray(selectedZipCodes) ||
              (selectedZipCodes.length === 0 && !isNationwide)
            }
            className="px-6"
            variant={hasUnsavedChanges ? "default" : "secondary"}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Service Area
              </>
            )}
          </Button>
        </div>

        {/* Status indicator */}
        {isSaving && (
          <div className="text-center text-sm text-gray-600">
            <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
            Saving your service area...
          </div>
        )}

        {hasUnsavedChanges && !isSaving && (
          <div className="text-center text-sm text-orange-600">You have unsaved changes to your service area</div>
        )}
      </CardContent>
    </Card>
  )
}
