/**
 * Utility functions for ZIP code radius searches using the Haversine formula
 */

// Type definitions
export interface ZipCodeData {
  zip: string
  latitude: number
  longitude: number
  city?: string
  state?: string
  county?: string
  country?: string
  distance?: number
}

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of first point in degrees
 * @param lon1 Longitude of first point in degrees
 * @param lat2 Latitude of second point in degrees
 * @param lon2 Longitude of second point in degrees
 * @returns Distance in miles
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // Validate input parameters
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.error("Invalid coordinates provided to haversineDistance:", { lat1, lon1, lat2, lon2 })
    return 0
  }

  // Earth's radius in miles
  const R = 3958.8

  // Convert latitude and longitude from degrees to radians
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180

  // Convert latitudes to radians
  const radLat1 = (lat1 * Math.PI) / 180
  const radLat2 = (lat2 * Math.PI) / 180

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // Validate result
  if (isNaN(distance) || distance < 0) {
    console.error("Invalid distance calculated:", distance, "for coordinates:", { lat1, lon1, lat2, lon2 })
    return 0
  }

  return distance
}

/**
 * Find all ZIP codes within a specified radius of a central ZIP code
 * @param centralZip The central ZIP code to search from
 * @param radius The radius in miles to search within
 * @param zipCodeDatabase Array of ZIP code data with coordinates
 * @returns Array of ZIP codes within the radius
 */
export async function findZipCodesInRadius(
  centralZip: string,
  radius: number,
  zipCodeDatabase: ZipCodeData[],
): Promise<ZipCodeData[]> {
  // Find the central ZIP code data
  const centralZipData = zipCodeDatabase.find((zip) => zip.zip === centralZip)

  if (!centralZipData) {
    throw new Error(`ZIP code ${centralZip} not found in database`)
  }

  // Find all ZIP codes within the radius
  const zipCodesInRadius = zipCodeDatabase
    .map((zipData) => {
      // Skip the calculation if it's the same ZIP code
      if (zipData.zip === centralZip) {
        return { ...zipData, distance: 0 }
      }

      const distance = haversineDistance(
        centralZipData.latitude,
        centralZipData.longitude,
        zipData.latitude,
        zipData.longitude,
      )

      return { ...zipData, distance }
    })
    .filter((zipData) => zipData.distance !== undefined && zipData.distance <= radius)
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))

  return zipCodesInRadius
}

/**
 * Validate ZIP code format
 * @param zip ZIP code to validate
 * @returns true if valid 5-digit ZIP code
 */
export function isValidZipCode(zip: string): boolean {
  return /^\d{5}$/.test(zip)
}

/**
 * Format distance for display
 * @param distance Distance in miles
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 0.1) {
    return "< 0.1 mi"
  }
  return `${distance.toFixed(1)} mi`
}
