import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const CSV_BLOB_URL =
  "https://tr3hxn479jqfpc0b.public.blob.vercel-storage.com/uszips11-0iYnSKUBgC7Dm6DtxL3bXwFzHgh6Qe.csv"

// Parse CSV to a map of ZIP codes
function parseCSVToZipCodeMap(csv: string): Record<string, any> {
  const zipCodes: Record<string, any> = {}
  const parseStats = {
    totalLines: 0,
    headerLine: "",
    validRows: 0,
    invalidRows: 0,
    sampleRows: [] as any[],
    errors: [] as string[],
  }

  try {
    // Trim the input to remove any leading/trailing whitespace
    const trimmedCsv = csv.trim()

    if (!trimmedCsv) {
      parseStats.errors.push("CSV is empty after trimming")
      return { parseStats }
    }

    // Split by newlines, handling different line endings
    const lines = trimmedCsv.split(/\r?\n/)
    parseStats.totalLines = lines.length

    if (lines.length < 2) {
      parseStats.errors.push(`Not enough lines in CSV: ${lines.length}`)
      return { parseStats }
    }

    // Parse header row, trimming each header
    const headers = lines[0].split(",").map((h) => h.trim())
    parseStats.headerLine = headers.join(" | ")

    // Find the indices of required columns
    const zipIndex = headers.findIndex(
      (h) =>
        h.toLowerCase() === "zip" ||
        h.toLowerCase() === "zipcode" ||
        h.toLowerCase() === "postal_code" ||
        h.toLowerCase() === "zip_code",
    )

    const latIndex = headers.findIndex((h) => h.toLowerCase() === "lat" || h.toLowerCase() === "latitude")

    const lngIndex = headers.findIndex(
      (h) => h.toLowerCase() === "lng" || h.toLowerCase() === "long" || h.toLowerCase() === "longitude",
    )

    const cityIndex = headers.findIndex((h) => h.toLowerCase() === "city")
    const stateIndex = headers.findIndex(
      (h) => h.toLowerCase() === "state" || h.toLowerCase() === "state_id" || h.toLowerCase() === "state_name",
    )

    parseStats.errors.push(
      `Column indices: zip=${zipIndex}, lat=${latIndex}, lng=${lngIndex}, city=${cityIndex}, state=${stateIndex}`,
    )

    // Skip if we can't find the required columns
    if (zipIndex === -1 || latIndex === -1 || lngIndex === -1 || cityIndex === -1 || stateIndex === -1) {
      parseStats.errors.push("CSV is missing required columns")
      return { parseStats }
    }

    // Process first 10 data rows for debugging
    for (let i = 1; i < Math.min(11, lines.length); i++) {
      const line = lines[i].trim()
      if (!line) continue // Skip empty lines

      // Split the line by comma
      const values = line.split(",").map((v) => v.trim())

      const zip = values[zipIndex]
      const latitude = Number.parseFloat(values[latIndex])
      const longitude = Number.parseFloat(values[lngIndex])
      const city = values[cityIndex]
      const state = values[stateIndex]

      const sampleRow = {
        lineNumber: i + 1,
        zip,
        latitude,
        longitude,
        city,
        state,
        isValid: !(!zip || isNaN(latitude) || isNaN(longitude) || !city || !state),
      }

      parseStats.sampleRows.push(sampleRow)

      if (sampleRow.isValid) {
        parseStats.validRows++
        zipCodes[zip] = {
          zip,
          latitude,
          longitude,
          city,
          state,
          country: "US",
        }
      } else {
        parseStats.invalidRows++
      }
    }

    return { zipCodes, parseStats }
  } catch (error) {
    parseStats.errors.push(`Parse error: ${error instanceof Error ? error.message : String(error)}`)
    return { parseStats }
  }
}

export async function GET() {
  try {
    console.log("Testing CSV file access...")

    // Fetch the CSV file
    const response = await fetch(CSV_BLOB_URL)

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Failed to fetch CSV file: ${response.status} ${response.statusText}`,
        url: CSV_BLOB_URL,
      })
    }

    const csvText = await response.text()
    console.log(`CSV file fetched successfully. Size: ${csvText.length} characters`)

    // Parse the CSV
    const result = parseCSVToZipCodeMap(csvText)

    return NextResponse.json({
      success: true,
      url: CSV_BLOB_URL,
      csvSize: csvText.length,
      csvPreview: csvText.substring(0, 500) + "...",
      parseResult: result,
      message: "CSV file accessed and parsed successfully",
    })
  } catch (error) {
    console.error("Error testing CSV file:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      url: CSV_BLOB_URL,
    })
  }
}
