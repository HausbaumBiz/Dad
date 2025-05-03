import { type NextRequest, NextResponse } from "next/server"
import type { ZipCodeData } from "@/lib/zip-code-types"
import { list } from "@vercel/blob"
import { haversineDistance } from "@/lib/zip-code-utils"
import { findZipCodesInRadius } from "@/lib/zip-code-file" // Fallback to file-based storage

export const dynamic = "force-dynamic"

// Cache for ZIP code data to avoid fetching from Blob storage on every request
let zipCodeCache: Record<string, ZipCodeData> | null = null
let cacheLastUpdated = 0
const CACHE_TTL = 3600000 // 1 hour in milliseconds

async function getZipCodeData(): Promise<Record<string, ZipCodeData> | null> {
  // Return cached data if it's still valid
  if (zipCodeCache && Date.now() - cacheLastUpdated < CACHE_TTL) {
    return zipCodeCache
  }

  try {
    // List blobs to find the latest ZIP code data file
    const { blobs } = await list({ prefix: "data/zip-codes/" })
    const zipDataBlob = blobs.find((blob) => blob.pathname === "data/zip-codes/zip-data.json")

    if (!zipDataBlob) {
      console.log("ZIP code data file not found in Blob storage")
      return null
    }

    // Fetch the ZIP code data from the blob URL
    const response = await fetch(zipDataBlob.url)

    if (!response.ok) {
      console.error(`Failed to fetch ZIP code data: ${response.statusText}`)
      return null
    }

    const zipCodes = await response.json()

    // Update the cache
    zipCodeCache = zipCodes
    cacheLastUpdated = Date.now()

    return zipCodes
  } catch (error) {
    console.error("Error fetching ZIP code data from Blob storage:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zip = searchParams.get("zip")
    const radiusStr = searchParams.get("radius")
    const limitStr = searchParams.get("limit")

    if (!zip) {
      return NextResponse.json({ error: "ZIP code is required" }, { status: 400 })
    }

    if (!radiusStr) {
      return NextResponse.json({ error: "Radius is required" }, { status: 400 })
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "Invalid ZIP code format. Must be 5 digits." }, { status: 400 })
    }

    const radius = Number.parseFloat(radiusStr)
    const limit = limitStr ? Number.parseInt(limitStr, 10) : 100

    if (isNaN(radius) || radius <= 0) {
      return NextResponse.json({ error: "Radius must be a positive number" }, { status: 400 })
    }

    if (isNaN(limit) || limit <= 0) {
      return NextResponse.json({ error: "Limit must be a positive number" }, { status: 400 })
    }

    // Try to get ZIP code data from Blob storage first
    const zipCodes = await getZipCodeData()

    if (zipCodes) {
      // If we have data from Blob storage, use it
      const centralZipData = zipCodes[zip]

      if (!centralZipData) {
        return NextResponse.json({ error: `ZIP code ${zip} not found in Blob storage` }, { status: 404 })
      }

      // Calculate distances and filter
      const zipCodesWithDistance = Object.values(zipCodes).map((zipData) => {
        const distance = haversineDistance(
          centralZipData.latitude,
          centralZipData.longitude,
          zipData.latitude,
          zipData.longitude,
        )
        return { zipData, distance }
      })

      // Sort by distance and take the closest ones within the radius
      const results = zipCodesWithDistance
        .filter(({ distance }) => distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit)
        .map(({ zipData, distance }) => {
          // Add the distance to the ZIP code data
          return { ...zipData, distance }
        })

      return NextResponse.json({ zipCodes: results, source: "blob" })
    }

    // Fallback to file-based storage if Blob storage doesn't have the data
    const results = await findZipCodesInRadius(zip, radius, limit)

    if (!results || results.length === 0) {
      return NextResponse.json({ error: `No ZIP codes found within ${radius} miles of ${zip}` }, { status: 404 })
    }

    return NextResponse.json({ zipCodes: results, source: "file" })
  } catch (error) {
    console.error("Error searching ZIP codes in radius:", error)
    return NextResponse.json(
      {
        error: "Failed to search ZIP codes in radius",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
