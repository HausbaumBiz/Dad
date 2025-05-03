"use server"

import { kv } from "@vercel/kv"
import { getCurrentBusiness } from "./business-actions"
import type { ZipCodeData } from "@/lib/zip-code-types"

// Save ZIP codes for a business
export async function saveBusinessZipCodes(zipCodes: ZipCodeData[], isNationwide: boolean) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Store ZIP codes for this business
    await kv.set(`business:${business.id}:zipcodes`, JSON.stringify(zipCodes))

    // Store nationwide flag
    await kv.set(`business:${business.id}:nationwide`, isNationwide)

    return { success: true, message: "ZIP codes saved successfully" }
  } catch (error) {
    console.error("Error saving business ZIP codes:", error)
    return { success: false, message: "Failed to save ZIP codes" }
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

    // Get ZIP codes for this business
    const zipCodesData = await kv.get(`business:${business.id}:zipcodes`)
    const isNationwide = (await kv.get(`business:${business.id}:nationwide`)) || false

    // If no data found, return empty array
    if (!zipCodesData) {
      return { success: true, data: { zipCodes: [], isNationwide: Boolean(isNationwide) } }
    }

    // Handle the case where Redis might return an object or a string
    let parsedZipCodes: ZipCodeData[]

    if (typeof zipCodesData === "string") {
      try {
        parsedZipCodes = JSON.parse(zipCodesData)
      } catch (parseError) {
        console.error("Error parsing ZIP codes JSON:", parseError)
        return { success: false, message: "Invalid ZIP code data format" }
      }
    } else if (Array.isArray(zipCodesData)) {
      // Data is already an array
      parsedZipCodes = zipCodesData as ZipCodeData[]
    } else {
      console.error("Unexpected data format:", typeof zipCodesData)
      return { success: false, message: "Unexpected data format" }
    }

    return {
      success: true,
      data: {
        zipCodes: parsedZipCodes,
        isNationwide: Boolean(isNationwide),
      },
    }
  } catch (error) {
    console.error("Error getting business ZIP codes:", error)
    return { success: false, message: "Failed to retrieve ZIP codes" }
  }
}
