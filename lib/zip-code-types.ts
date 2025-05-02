/**
 * Type definitions for ZIP code data
 */

export interface ZipCodeData {
  zip: string
  latitude: number
  longitude: number
  city: string
  state: string
  county?: string
  timezone?: string
  population?: number
  distance?: number // Added for radius search results
}

export interface ZipCodeSearchParams {
  state?: string
  city?: string
  radius?: {
    zip: string
    miles: number
  }
  limit?: number
}

export interface ZipCodeImportStats {
  total: number
  imported: number
  skipped: number
  errors: number
}
