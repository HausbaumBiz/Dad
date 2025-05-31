import { getZipCode } from "./zip-code-db"
import type { ZipCodeData } from "./zip-code-types"

/**
 * Get city and state information for a ZIP code
 * @param zipCode The ZIP code to look up
 * @returns An object containing city and state, or null if not found
 */
export async function getCityStateFromZip(zipCode: string): Promise<{ city: string; state: string } | null> {
  try {
    if (!zipCode) return null

    // Clean the ZIP code (remove spaces, ensure it's a string)
    const cleanZip = String(zipCode).trim()
    if (!cleanZip) return null

    // Look up the ZIP code in the database
    const zipData: ZipCodeData | null = await getZipCode(cleanZip)

    if (!zipData) {
      console.log(`No data found for ZIP code: ${cleanZip}`)
      return null
    }

    return {
      city: zipData.city || "",
      state: zipData.state || "",
    }
  } catch (error) {
    console.error(`Error looking up ZIP code ${zipCode}:`, error)
    return null
  }
}
