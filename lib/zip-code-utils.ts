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
  const zipCodesInRadius = zipCodeDatabase.filter((zipData) => {
    // Skip the calculation if it's the same ZIP code
    if (zipData.zip === centralZip) return true

    const distance = haversineDistance(
      centralZipData.latitude,
      centralZipData.longitude,
      zipData.latitude,
      zipData.longitude,
    )

    return distance <= radius
  })

  return zipCodesInRadius
}

/**
 * Get ZIP code data from the database or API
 * This is a placeholder function - in a real implementation,
 * this would fetch from a database or API
 */
export async function getZipCodeData(): Promise<ZipCodeData[]> {
  // In a real implementation, this would fetch from a database or API
  // For now, return a small sample dataset
  return [
    { zip: "10001", latitude: 40.7501, longitude: -73.9964, city: "New York", state: "NY" },
    { zip: "10002", latitude: 40.7168, longitude: -73.9861, city: "New York", state: "NY" },
    { zip: "10003", latitude: 40.7335, longitude: -73.9905, city: "New York", state: "NY" },
    { zip: "10004", latitude: 40.7037, longitude: -74.012, city: "New York", state: "NY" },
    { zip: "10005", latitude: 40.7047, longitude: -74.008, city: "New York", state: "NY" },
    { zip: "10006", latitude: 40.7092, longitude: -74.0113, city: "New York", state: "NY" },
    { zip: "10007", latitude: 40.7145, longitude: -74.0071, city: "New York", state: "NY" },
    { zip: "90001", latitude: 33.9731, longitude: -118.2479, city: "Los Angeles", state: "CA" },
    { zip: "90002", latitude: 33.9497, longitude: -118.2462, city: "Los Angeles", state: "CA" },
    { zip: "90003", latitude: 33.9653, longitude: -118.2729, city: "Los Angeles", state: "CA" },
    // In a real implementation, this would include thousands of ZIP codes
  ]
}
