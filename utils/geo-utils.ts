// Constants for Earth's radius
const EARTH_RADIUS_MILES = 3958.8
const EARTH_RADIUS_KM = 6371.0

/**
 * Calculate distance between two points using the Haversine formula
 * @param lat1 Latitude of point 1 (in degrees)
 * @param lon1 Longitude of point 1 (in degrees)
 * @param lat2 Latitude of point 2 (in degrees)
 * @param lon2 Longitude of point 2 (in degrees)
 * @param inKm Whether to return distance in kilometers (true) or miles (false)
 * @returns Distance in miles or kilometers
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number, inKm = false): number {
  // Convert latitude and longitude from degrees to radians
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  // Convert to radians
  const radLat1 = toRadians(lat1)
  const radLat2 = toRadians(lat2)

  // Apply the Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Calculate the distance
  const radius = inKm ? EARTH_RADIUS_KM : EARTH_RADIUS_MILES
  return radius * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Find all zip codes within a given radius of a central zip code
 * @param centralZip The central zip code
 * @param zipCodesData Array of zip code data with lat/long
 * @param radiusMiles Radius in miles
 * @returns Array of zip codes within the radius
 */
export function findZipCodesInRadius(
  centralZip: string,
  zipCodesData: ZipCodeData[],
  radiusMiles: number,
): ZipCodeData[] {
  // Find the central zip code data
  const centralZipData = zipCodesData.find((zip) => zip.zipCode === centralZip)

  if (!centralZipData) {
    throw new Error(`Central zip code ${centralZip} not found in data`)
  }

  // Filter zip codes within the radius
  return zipCodesData.filter((zipData) => {
    if (zipData.zipCode === centralZip) return true // Always include the central zip

    const distance = haversineDistance(
      centralZipData.latitude,
      centralZipData.longitude,
      zipData.latitude,
      zipData.longitude,
    )

    return distance <= radiusMiles
  })
}

// Type definition for zip code data
export interface ZipCodeData {
  zipCode: string
  city: string
  state: string
  latitude: number
  longitude: number
}
