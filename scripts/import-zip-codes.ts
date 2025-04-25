/**
 * Script to import ZIP code data from a CSV or JSON file
 *
 * Usage:
 * npx ts-node scripts/import-zip-codes.ts <file-path>
 */

import fs from "fs"
import path from "path"
import type { ZipCodeData } from "../lib/zip-code-types"

// Replace with your actual API endpoint
const API_ENDPOINT = "http://localhost:3000/api/zip-codes/import"
const API_KEY = "admin-token" // Replace with your actual API key

async function importZipCodes(filePath: string) {
  try {
    console.log(`Reading file: ${filePath}`)
    const fileContent = fs.readFileSync(filePath, "utf8")

    let zipCodes: ZipCodeData[] = []
    const fileExt = path.extname(filePath).toLowerCase()

    if (fileExt === ".json") {
      console.log("Parsing JSON file...")
      zipCodes = JSON.parse(fileContent)
    } else if (fileExt === ".csv") {
      console.log("Parsing CSV file...")
      zipCodes = parseCSV(fileContent)
    } else {
      throw new Error("Unsupported file format. Please provide a CSV or JSON file.")
    }

    console.log(`Found ${zipCodes.length} ZIP codes in the file`)

    // Validate the data
    const validZipCodes = zipCodes.filter(validateZipCode)
    console.log(`${validZipCodes.length} ZIP codes are valid`)

    // Import in batches to avoid overwhelming the API
    const BATCH_SIZE = 1000
    let imported = 0

    for (let i = 0; i < validZipCodes.length; i += BATCH_SIZE) {
      const batch = validZipCodes.slice(i, i + BATCH_SIZE)
      console.log(`Importing batch ${i / BATCH_SIZE + 1} (${batch.length} ZIP codes)...`)

      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ zipCodes: batch }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`API error: ${errorData.error || response.statusText}`)
      }

      const result = await response.json()
      console.log(`Batch imported: ${result.stats.imported} successful, ${result.stats.errors} errors`)

      imported += result.stats.imported
    }

    console.log(`Import completed. Total imported: ${imported}`)
  } catch (error) {
    console.error("Error importing ZIP codes:", error)
    process.exit(1)
  }
}

function parseCSV(csv: string): ZipCodeData[] {
  const lines = csv.split("\n")
  const headers = lines[0].split(",").map((h) => h.trim())

  const zipCodes: ZipCodeData[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(",").map((v) => v.trim())
    const zipData: any = {}

    headers.forEach((header, index) => {
      if (index < values.length) {
        // Convert numeric values
        if (["latitude", "longitude", "population"].includes(header)) {
          zipData[header] = Number.parseFloat(values[index])
        } else {
          zipData[header] = values[index]
        }
      }
    })

    zipCodes.push(zipData as ZipCodeData)
  }

  return zipCodes
}

function validateZipCode(zipData: ZipCodeData): boolean {
  // Check required fields
  if (!zipData.zip || !zipData.latitude || !zipData.longitude || !zipData.city || !zipData.state) {
    return false
  }

  // Validate ZIP code format (US ZIP codes are 5 digits)
  if (!/^\d{5}$/.test(zipData.zip)) {
    return false
  }

  // Validate coordinates
  if (
    isNaN(zipData.latitude) ||
    isNaN(zipData.longitude) ||
    zipData.latitude < -90 ||
    zipData.latitude > 90 ||
    zipData.longitude < -180 ||
    zipData.longitude > 180
  ) {
    return false
  }

  return true
}

// Main execution
if (process.argv.length < 3) {
  console.error("Please provide a file path")
  console.error("Usage: npx ts-node scripts/import-zip-codes.ts <file-path>")
  process.exit(1)
}

const filePath = process.argv[2]
importZipCodes(filePath)
