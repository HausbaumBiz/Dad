import { type NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("=== Debug ZIP Search Test ===")

    // Test the ZIP code radius search API
    const testZip = "90210"
    const testRadius = 25
    const testLimit = 10

    console.log(`Testing ZIP code radius search for ${testZip} within ${testRadius} miles`)

    // Use relative URL for internal API call
    const apiUrl = `/api/zip-codes/radius?zip=${testZip}&radius=${testRadius}&limit=${testLimit}`
    console.log("API URL:", apiUrl)

    // Get the base URL from the request
    const baseUrl = new URL(request.url).origin
    const fullUrl = `${baseUrl}${apiUrl}`
    console.log("Full URL:", fullUrl)

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    console.log("Response status:", response.status)
    console.log("Response headers:", Object.fromEntries(response.headers.entries()))

    // Get the raw response text first
    const responseText = await response.text()
    console.log("Raw response (first 500 chars):", responseText.substring(0, 500))

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (parseError) {
      console.error("Failed to parse response as JSON:", parseError)
      return NextResponse.json({
        success: false,
        error: `API returned non-JSON response (${response.status}): ${responseText.substring(0, 200)}`,
        debug: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          rawResponse: responseText.substring(0, 500),
        },
      })
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `API request failed with status ${response.status}`,
        response: {
          status: response.status,
          data: responseData,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "ZIP search test completed successfully",
      response: {
        status: response.status,
        data: responseData,
      },
    })
  } catch (error) {
    console.error("Error in ZIP search test:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        debug: {
          stack: error instanceof Error ? error.stack : undefined,
        },
      },
      { status: 500 },
    )
  }
}
