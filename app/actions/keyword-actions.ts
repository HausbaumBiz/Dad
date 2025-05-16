"use server"

import { kv } from "@vercel/kv"
import { getCurrentBusiness } from "./business-actions"

// Save keywords for a business
export async function saveBusinessKeywords(keywords: string[]) {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Store keywords for this business
    await kv.set(`business:${business.id}:keywords`, JSON.stringify(keywords))

    return { success: true, message: "Keywords saved successfully" }
  } catch (error) {
    console.error("Error saving business keywords:", error)
    return { success: false, message: "Failed to save keywords" }
  }
}

// Get keywords for a business
export async function getBusinessKeywords(): Promise<{
  success: boolean
  data?: string[]
  message?: string
}> {
  try {
    const business = await getCurrentBusiness()
    if (!business) {
      return { success: false, message: "Not authenticated" }
    }

    // Get keywords for this business
    const keywordsData = await kv.get(`business:${business.id}:keywords`)

    // If no data found, return empty array
    if (!keywordsData) {
      return { success: true, data: [] }
    }

    // Handle the case where Redis might return an object or a string
    let parsedKeywords: string[] = []

    if (typeof keywordsData === "string") {
      try {
        // Parse the JSON string into an array
        const parsed = JSON.parse(keywordsData)
        // Ensure the parsed result is an array
        if (Array.isArray(parsed)) {
          parsedKeywords = parsed
        } else {
          console.warn("Parsed keywords is not an array:", parsed)
          // Return empty array if parsed result is not an array
          parsedKeywords = []
        }
      } catch (parseError) {
        console.error("Error parsing keywords JSON:", parseError)
        return { success: false, message: "Invalid keyword data format" }
      }
    } else if (Array.isArray(keywordsData)) {
      // Data is already an array
      parsedKeywords = keywordsData
    } else {
      console.error("Unexpected data format:", typeof keywordsData, keywordsData)
      // Return empty array for unexpected data format
      parsedKeywords = []
    }

    return { success: true, data: parsedKeywords }
  } catch (error) {
    console.error("Error getting business keywords:", error)
    return { success: false, message: "Failed to retrieve keywords" }
  }
}
