import { type NextRequest, NextResponse } from "next/server"
import type { ZipCodeData } from "@/lib/zip-code-types"
import { list } from "@vercel/blob"
import { getZipCode } from "@/lib/zip-code-file" // Fallback to file-based storage

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

    if (!zip) {
      return NextResponse.json({ error: "ZIP code is required" }, { status: 400 })
    }

    // Validate ZIP code format
    if (!/^\d{5}$/.test(zip)) {
      return NextResponse.json({ error: "Invalid ZIP code format. Must be 5 digits." }, { status: 400 })
    }

    // Try to get ZIP code data from Blob storage first
    const zipCodes = await getZipCodeData()

    if (zipCodes) {
      // If we have data from Blob storage, use it
      const zipCode = zipCodes[zip]

      if (zipCode) {
        return NextResponse.json({ zipCode, source: "blob" })
      }
    }

    // Fallback to file-based storage if Blob storage doesn't have the data
    const zipCode = await getZipCode(zip)

    if (!zipCode) {
      return NextResponse.json({ error: `ZIP code ${zip} not found in any data source` }, { status: 404 })
    }

    return NextResponse.json({ zipCode, source: "file" })
  } catch (error) {
    console.error("Error searching ZIP code:", error)
    return NextResponse.json(
      {
        error: "Failed to search ZIP code",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
