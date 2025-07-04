"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { getCurrentBusiness } from "./business-actions"
import type { ZipCodeData } from "@/lib/zip-code-types"

// Get zip code details by zip code
export async function getZipCodeDetails(zipCode: string): Promise<ZipCodeData | null> {
  try {
    if (!zipCode) return null

    // Try to get from Redis first
    const zipData = await kv.get(`zipcode:${zipCode}:details`)

    if (zipData) {
      return zipData as ZipCodeData
    }

    // If not in Redis, try to fetch from API
    try {
      const response = await fetch(`/api/zip-codes/search?zipCode=${zipCode}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch zip code details: ${response.status}`)
      }

      const data = await response.json()
      if (data && data.zipCode) {
        // Cache in Redis for future use
        await kv.set(`zipcode:${zipCode}:details`, data.zipCode)
        return data.zipCode
      }
    } catch (apiError) {
      console.error(`Error fetching zip code details from API: ${apiError}`)
    }

    // Fallback to basic data
    return {
      zip: zipCode,
      city: "Unknown City",
      state: "Unknown State",
      latitude: 0,
      longitude: 0,
    }
  } catch (error) {
    console.error(`Error getting zip code details for ${zipCode}:`, error)
    return null
  }
}

// Save business zip codes with better error handling and rate limiting
export async function saveBusinessZipCodes(
  zipCodesInput: any,
  isNationwide: boolean,
): Promise<{
  success: boolean
  message?: string
}> {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    console.log(`[ZIP CODES] Saving for business ${business.id}:`, {
      inputType: typeof zipCodesInput,
      isArray: Array.isArray(zipCodesInput),
      inputLength: Array.isArray(zipCodesInput) ? zipCodesInput.length : "N/A",
      isNationwide,
    })

    // Handle different input formats with comprehensive type checking
    let zipCodes: ZipCodeData[] = []

    // Ensure we have a valid array to work with
    if (zipCodesInput === null || zipCodesInput === undefined) {
      console.log("[ZIP CODES] Input is null or undefined, using empty array")
      zipCodes = []
    } else if (Array.isArray(zipCodesInput)) {
      console.log(`[ZIP CODES] Processing array with ${zipCodesInput.length} items`)

      // Filter and process valid entries
      zipCodes = zipCodesInput
        .filter((item, index) => {
          const isValid = item && typeof item === "object" && (item.zip || item.zipCode)
          if (!isValid) {
            console.log(`[ZIP CODES] Filtering out invalid item at index ${index}:`, item)
          }
          return isValid
        })
        .map((item) => ({
          zip: String(item.zip || item.zipCode || ""),
          city: String(item.city || "Unknown City"),
          state: String(item.state || "Unknown State"),
          latitude: Number(item.latitude || 0),
          longitude: Number(item.longitude || 0),
          distance: item.distance !== undefined ? Number(item.distance) : undefined,
        }))

      console.log(`[ZIP CODES] Processed ${zipCodes.length} valid ZIP codes`)
    } else if (typeof zipCodesInput === "object" && zipCodesInput !== null) {
      console.log("[ZIP CODES] Processing single object:", zipCodesInput)
      const item = zipCodesInput
      if (item.zip || item.zipCode) {
        zipCodes = [
          {
            zip: String(item.zip || item.zipCode),
            city: String(item.city || "Unknown City"),
            state: String(item.state || "Unknown State"),
            latitude: Number(item.latitude || 0),
            longitude: Number(item.longitude || 0),
            distance: item.distance !== undefined ? Number(item.distance) : undefined,
          },
        ]
      }
    } else {
      console.error("[ZIP CODES] Invalid input type:", typeof zipCodesInput)
      return {
        success: false,
        message: `Invalid ZIP codes data format. Expected array or object, got ${typeof zipCodesInput}`,
      }
    }

    // Final validation
    if (!Array.isArray(zipCodes)) {
      console.error("[ZIP CODES] Final zipCodes is not an array:", typeof zipCodes)
      zipCodes = []
    }

    // Filter out any remaining invalid entries
    zipCodes = zipCodes.filter((item) => {
      const isValid = item && typeof item === "object" && item.zip && typeof item.zip === "string"
      return isValid
    })

    console.log(`[ZIP CODES] Final count for storage: ${zipCodes.length}`)

    // Store the data in Redis with retry logic for rate limiting
    const businessKey = `business:${business.id}`
    let retryCount = 0
    const maxRetries = 3
    const retryDelay = 1000 // 1 second

    while (retryCount < maxRetries) {
      try {
        // Use a pipeline to reduce the number of Redis operations
        const pipeline = kv.pipeline()

        // 1. Store full ZIP code data as JSON
        pipeline.set(`${businessKey}:zipcodes`, JSON.stringify(zipCodes))
        console.log(`[ZIP CODES] Queued JSON data for key: ${businessKey}:zipcodes`)

        // 2. Store nationwide flag
        pipeline.set(`${businessKey}:nationwide`, isNationwide)
        console.log(`[ZIP CODES] Queued nationwide flag: ${isNationwide}`)

        // 3. Clear and set ZIP code strings as a set for efficient lookups
        pipeline.del(`${businessKey}:zipcodes:set`)
        if (zipCodes.length > 0) {
          const zipCodeStrings = zipCodes.map((z) => z.zip)
          pipeline.sadd(`${businessKey}:zipcodes:set`, ...zipCodeStrings)
          console.log(`[ZIP CODES] Queued ${zipCodeStrings.length} ZIP codes for set`)
        }

        // 4. Update business record with primary location
        if (zipCodes.length > 0) {
          const primaryZip = zipCodes[0]
          const businessData = await kv.get(businessKey)

          if (businessData && typeof businessData === "object") {
            const updatedBusiness = {
              ...businessData,
              zipCode: primaryZip.zip,
              city: primaryZip.city,
              state: primaryZip.state,
            }
            pipeline.set(businessKey, updatedBusiness)
            console.log(`[ZIP CODES] Queued business update with primary ZIP: ${primaryZip.zip}`)
          }
        }

        // Execute the pipeline
        await pipeline.exec()
        console.log(`[ZIP CODES] Pipeline executed successfully`)

        // Handle business-to-zipcode mappings separately to avoid pipeline issues
        if (zipCodes.length > 0 && !isNationwide) {
          const zipCodeStrings = zipCodes.map((z) => z.zip)
          for (const zip of zipCodeStrings) {
            try {
              await kv.sadd(`zipcode:${zip}:businesses`, business.id)
            } catch (mappingError) {
              console.warn(`[ZIP CODES] Failed to add business to ZIP ${zip}:`, mappingError)
              // Continue with other ZIP codes even if one fails
            }
          }
        }

        // Handle nationwide businesses
        if (isNationwide) {
          try {
            await kv.sadd("businesses:nationwide", business.id)
          } catch (nationwideError) {
            console.warn("[ZIP CODES] Failed to add to nationwide set:", nationwideError)
          }
        } else {
          try {
            await kv.srem("businesses:nationwide", business.id)
          } catch (nationwideError) {
            console.warn("[ZIP CODES] Failed to remove from nationwide set:", nationwideError)
          }
        }

        break // Success, exit retry loop
      } catch (error) {
        retryCount++
        console.error(`[ZIP CODES] Attempt ${retryCount} failed:`, error)

        if (error instanceof Error && error.message.includes("429")) {
          if (retryCount < maxRetries) {
            console.log(`[ZIP CODES] Rate limited, retrying in ${retryDelay}ms...`)
            await new Promise((resolve) => setTimeout(resolve, retryDelay * retryCount))
            continue
          }
        }

        if (retryCount >= maxRetries) {
          throw error
        }
      }
    }

    // Revalidate relevant paths
    revalidatePath("/business-focus")
    revalidatePath("/workbench")

    console.log(`[ZIP CODES] Successfully saved ${zipCodes.length} ZIP codes for business ${business.id}`)
    return {
      success: true,
      message: `Successfully saved ${zipCodes.length} ZIP codes${isNationwide ? " (nationwide service)" : ""}`,
    }
  } catch (error) {
    console.error("[ZIP CODES] Error saving business ZIP codes:", error)

    // Provide more specific error messages
    let errorMessage = "Unknown error"
    if (error instanceof Error) {
      if (error.message.includes("429")) {
        errorMessage = "Too many requests. Please try again in a moment."
      } else if (error.message.includes("map")) {
        errorMessage = "Invalid data format. Please refresh the page and try again."
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      message: `Failed to save ZIP codes: ${errorMessage}`,
    }
  }
}

// Get ZIP codes for a business
export async function getBusinessZipCodes(): Promise<{
  success: boolean
  data?: { zipCodes: ZipCodeData[]; isNationwide: boolean }
  message?: string
}> {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    const businessKey = `business:${business.id}`
    console.log(`[ZIP CODES] Loading ZIP codes for business ${business.id}`)

    // Get nationwide flag
    let isNationwide = false
    try {
      const nationwideFlag = await kv.get(`${businessKey}:nationwide`)
      isNationwide = Boolean(nationwideFlag)
      console.log(`[ZIP CODES] Nationwide flag: ${isNationwide}`)
    } catch (error) {
      console.log("[ZIP CODES] Error getting nationwide flag:", error)
    }

    let parsedZipCodes: ZipCodeData[] = []

    // Try to get ZIP codes from JSON storage first
    try {
      const zipCodesData = await kv.get(`${businessKey}:zipcodes`)
      console.log(`[ZIP CODES] Raw data from Redis:`, typeof zipCodesData, zipCodesData ? "exists" : "null")

      if (zipCodesData) {
        if (typeof zipCodesData === "string") {
          try {
            parsedZipCodes = JSON.parse(zipCodesData)
            console.log(`[ZIP CODES] Parsed ${parsedZipCodes.length} ZIP codes from JSON string`)
          } catch (parseError) {
            console.error("[ZIP CODES] Error parsing JSON:", parseError)
          }
        } else if (Array.isArray(zipCodesData)) {
          parsedZipCodes = zipCodesData as ZipCodeData[]
          console.log(`[ZIP CODES] Got ${parsedZipCodes.length} ZIP codes from array`)
        } else if (typeof zipCodesData === "object") {
          // Handle case where Redis returns an object
          parsedZipCodes = Array.isArray(zipCodesData) ? zipCodesData : []
          console.log(`[ZIP CODES] Converted object to array: ${parsedZipCodes.length} items`)
        }
      }
    } catch (jsonError) {
      console.error("[ZIP CODES] Error getting ZIP codes from JSON storage:", jsonError)
    }

    // Fallback to set-based storage if JSON didn't work
    if (parsedZipCodes.length === 0) {
      try {
        const keyType = await kv.type(`${businessKey}:zipcodes:set`)
        console.log(`[ZIP CODES] Set key type: ${keyType}`)

        if (keyType === "set") {
          const zipCodeStrings = await kv.smembers(`${businessKey}:zipcodes:set`)
          console.log(`[ZIP CODES] Got ${zipCodeStrings?.length || 0} ZIP codes from set`)

          if (zipCodeStrings && Array.isArray(zipCodeStrings) && zipCodeStrings.length > 0) {
            parsedZipCodes = zipCodeStrings.map((zip) => ({
              zip: String(zip),
              city: "",
              state: "",
              latitude: 0,
              longitude: 0,
            }))
            console.log(`[ZIP CODES] Converted ${parsedZipCodes.length} ZIP codes from set`)
          }
        }
      } catch (setError) {
        console.error("[ZIP CODES] Error getting ZIP codes from set:", setError)
      }
    }

    // Ensure we always return an array
    if (!Array.isArray(parsedZipCodes)) {
      console.log("[ZIP CODES] parsedZipCodes is not an array, defaulting to empty array")
      parsedZipCodes = []
    }

    console.log(`[ZIP CODES] Returning ${parsedZipCodes.length} ZIP codes, nationwide: ${isNationwide}`)

    return {
      success: true,
      data: {
        zipCodes: parsedZipCodes,
        isNationwide: isNationwide,
      },
    }
  } catch (error) {
    console.error("[ZIP CODES] Error getting business ZIP codes:", error)
    return {
      success: false,
      message: `Failed to retrieve ZIP codes: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}

// Get ZIP codes for a specific business (admin function)
export async function getBusinessZipCodesById(businessId: string): Promise<{
  success: boolean
  data?: { zipCodes: ZipCodeData[]; isNationwide: boolean }
  message?: string
}> {
  try {
    if (!businessId) {
      return { success: false, message: "Business ID is required" }
    }

    const businessKey = `business:${businessId}`
    console.log(`[ZIP CODES] Loading ZIP codes for business ${businessId} (admin)`)

    // Get nationwide flag
    let isNationwide = false
    try {
      const nationwideFlag = await kv.get(`${businessKey}:nationwide`)
      isNationwide = Boolean(nationwideFlag)
    } catch (error) {
      console.log("[ZIP CODES] Error getting nationwide flag:", error)
    }

    let parsedZipCodes: ZipCodeData[] = []

    // Try to get ZIP codes from JSON storage first
    try {
      const zipCodesData = await kv.get(`${businessKey}:zipcodes`)

      if (zipCodesData) {
        if (typeof zipCodesData === "string") {
          try {
            parsedZipCodes = JSON.parse(zipCodesData)
          } catch (parseError) {
            console.error("[ZIP CODES] Error parsing JSON:", parseError)
          }
        } else if (Array.isArray(zipCodesData)) {
          parsedZipCodes = zipCodesData as ZipCodeData[]
        }
      }
    } catch (jsonError) {
      console.log("[ZIP CODES] Error getting ZIP codes from JSON storage:", jsonError)
    }

    // Fallback to set-based storage
    if (parsedZipCodes.length === 0) {
      try {
        const keyType = await kv.type(`${businessKey}:zipcodes:set`)

        if (keyType === "set") {
          const zipCodeStrings = await kv.smembers(`${businessKey}:zipcodes:set`)

          if (zipCodeStrings && Array.isArray(zipCodeStrings) && zipCodeStrings.length > 0) {
            parsedZipCodes = zipCodeStrings.map((zip) => ({
              zip: String(zip),
              city: "",
              state: "",
              latitude: 0,
              longitude: 0,
            }))
          }
        }
      } catch (setError) {
        console.error("[ZIP CODES] Error getting ZIP codes from set:", setError)
      }
    }

    // Ensure we always return an array
    if (!Array.isArray(parsedZipCodes)) {
      parsedZipCodes = []
    }

    return {
      success: true,
      data: {
        zipCodes: parsedZipCodes,
        isNationwide: isNationwide,
      },
    }
  } catch (error) {
    console.error(`[ZIP CODES] Error getting ZIP codes for business ${businessId}:`, error)
    return {
      success: false,
      message: `Failed to retrieve ZIP codes: ${error instanceof Error ? error.message : "Unknown error"}`,
    }
  }
}
