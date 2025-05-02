import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const apiKey = process.env.ZIPCODE_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "ZIPCODE_API_KEY is not set" }, { status: 500 })
    }

    // Test with a simple request
    const zipCode = "90210"
    const radius = "5"
    const units = "mile"

    const url = `https://www.zipcodeapi.com/rest/${apiKey}/radius.json/${zipCode}/${radius}/${units}`

    console.log("Testing ZipCodeAPI with URL:", url.replace(apiKey, "API_KEY_HIDDEN"))

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    })

    const status = response.status
    const statusText = response.statusText
    const headers = Object.fromEntries(response.headers.entries())

    let data
    let responseText

    try {
      responseText = await response.text()
      data = JSON.parse(responseText)
    } catch (e) {
      return NextResponse.json({
        success: false,
        status,
        statusText,
        headers,
        error: "Failed to parse response as JSON",
        responseText: responseText?.substring(0, 500),
      })
    }

    return NextResponse.json({
      success: response.ok,
      status,
      statusText,
      headers,
      data: data,
      apiKeyProvided: !!apiKey,
      apiKeyLength: apiKey.length,
    })
  } catch (error) {
    console.error("Error testing ZipCodeAPI:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
