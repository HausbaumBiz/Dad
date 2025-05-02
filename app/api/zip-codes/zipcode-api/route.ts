import { type NextRequest, NextResponse } from "next/server"
import type { ZipCodeData } from "@/lib/zip-code-types"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zipCode = searchParams.get("zip")
    const radius = searchParams.get("radius") || "25"
    const units = searchParams.get("units") || "mile"

    if (!zipCode) {
      return NextResponse.json({ error: "ZIP code is required" }, { status: 400 })
    }

    // Get API key from environment variable
    const apiKey = process.env.ZIPCODE_API_KEY

    if (!apiKey) {
      console.error("ZIPCODE_API_KEY environment variable is not set")
      return NextResponse.json({ error: "ZIP Code API key is not configured" }, { status: 500 })
    }

    // Make request to ZipCodeAPI.com
    const url = `https://www.zipcodeapi.com/rest/${apiKey}/radius.json/${zipCode}/${radius}/${units}`
    console.log("Fetching from ZipCodeAPI:", url.replace(apiKey, "API_KEY_HIDDEN"))

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    console.log("ZipCodeAPI response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ZipCodeAPI error:", errorText)
      return NextResponse.json(
        {
          error: `Error from ZipCodeAPI: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      )
    }

    const data = await response.json()
    console.log("ZipCodeAPI response data:", JSON.stringify(data).substring(0, 200) + "...")

    // Check if the response has the expected structure
    if (!data.zip_codes || !Array.isArray(data.zip_codes)) {
      console.error("Unexpected response format from ZipCodeAPI:", data)
      return NextResponse.json({ error: "Unexpected response format from ZipCodeAPI" }, { status: 500 })
    }

    // Transform the API response to match our ZipCodeData format
    const zipCodes: ZipCodeData[] = data.zip_codes.map((item: any) => ({
      zip: item.zip_code,
      city: item.city,
      state: item.state,
      latitude: Number.parseFloat(item.lat),
      longitude: Number.parseFloat(item.lng),
      distance: Number.parseFloat(item.distance),
    }))

    console.log(`Transformed ${zipCodes.length} ZIP codes`)

    return NextResponse.json({ zipCodes })
  } catch (error) {
    console.error("Error in ZIP code API route:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
