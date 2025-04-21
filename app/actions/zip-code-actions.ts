"use server"

import { findZipCodesInRadius, getZipCodeData, type ZipCodeData } from "@/lib/zip-codes"

/**
 * Get data for a specific ZIP code
 */
export async function getZipCodeInfo(zipCode: string): Promise<ZipCodeData | null> {
  try {
    return await getZipCodeData(zipCode)
  } catch (error) {
    console.error("Error getting ZIP code info:", error)
    return null
  }
}

/**
 * Find ZIP codes within a radius of a given ZIP code
 */
export async function getZipCodesInRadius(
  centralZip: string,
  radiusMiles: number,
  limit = 100,
): Promise<{ success: boolean; data: ZipCodeData[]; message?: string }> {
  try {
    // Validate the ZIP code
    const zipData = await getZipCodeData(centralZip)
    if (!zipData) {
      return {
        success: false,
        data: [],
        message: `ZIP code ${centralZip} not found in our database`,
      }
    }

    // Find ZIP codes in radius
    const zipCodes = await findZipCodesInRadius(centralZip, radiusMiles, limit)

    return {
      success: true,
      data: zipCodes,
    }
  } catch (error) {
    console.error("Error fetching ZIP codes:", error)
    return {
      success: false,
      data: [],
      message: "Failed to fetch ZIP codes in radius",
    }
  }
}

/**
 * Save the selected ZIP codes for a business
 */
export async function saveBusinessServiceArea(
  businessId: string,
  zipCodes: string[],
  isNationwide: boolean,
): Promise<{ success: boolean; message: string }> {
  try {
    // This would be replaced with a real database update
    console.log("Saving service area for business:", businessId)
    console.log("ZIP codes:", zipCodes)
    console.log("Is nationwide:", isNationwide)

    // Simulate a successful save
    await new Promise((resolve) => setTimeout(resolve, 500))

    return {
      success: true,
      message: "Service area saved successfully",
    }
  } catch (error) {
    console.error("Error saving service area:", error)
    return {
      success: false,
      message: "Failed to save service area",
    }
  }
}

/**
 * Validate a ZIP code
 */
export async function validateZipCode(zipCode: string): Promise<{
  valid: boolean
  data?: ZipCodeData
  message?: string
}> {
  try {
    // Basic format validation
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return {
        valid: false,
        message: "Invalid ZIP code format. Please enter a 5-digit ZIP code.",
      }
    }

    // Extract the 5-digit ZIP code if it's in ZIP+4 format
    const fiveDigitZip = zipCode.substring(0, 5)

    // Check if the ZIP code exists in our database
    const zipData = await getZipCodeData(fiveDigitZip)
    if (!zipData) {
      return {
        valid: false,
        message: `ZIP code ${fiveDigitZip} not found in our database`,
      }
    }

    return {
      valid: true,
      data: zipData,
    }
  } catch (error) {
    console.error("Error validating ZIP code:", error)
    return {
      valid: false,
      message: "Error validating ZIP code",
    }
  }
}
