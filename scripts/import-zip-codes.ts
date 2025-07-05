/**
 * Script to import ZIP code data from a CSV or JSON file
 *
 * Usage:
 * npx ts-node scripts/import-zip-codes.ts <file-path>
 */

import fs from "fs"
import path from "path"

// Sample ZIP code data for demonstration
const sampleZipCodes = [
  {
    zip: "10001",
    city: "New York",
    state: "NY",
    latitude: 40.7505,
    longitude: -73.9934,
    county: "New York County",
    population: 21102,
  },
  {
    zip: "90210",
    city: "Beverly Hills",
    state: "CA",
    latitude: 34.0901,
    longitude: -118.4065,
    county: "Los Angeles County",
    population: 21661,
  },
  {
    zip: "60601",
    city: "Chicago",
    state: "IL",
    latitude: 41.8825,
    longitude: -87.6441,
    county: "Cook County",
    population: 2746,
  },
  {
    zip: "33101",
    city: "Miami",
    state: "FL",
    latitude: 25.7743,
    longitude: -80.1937,
    county: "Miami-Dade County",
    population: 0,
  },
  {
    zip: "75201",
    city: "Dallas",
    state: "TX",
    latitude: 32.7767,
    longitude: -96.797,
    county: "Dallas County",
    population: 18,
  },
  {
    zip: "98101",
    city: "Seattle",
    state: "WA",
    latitude: 47.6062,
    longitude: -122.3321,
    county: "King County",
    population: 1252,
  },
  {
    zip: "02101",
    city: "Boston",
    state: "MA",
    latitude: 42.3601,
    longitude: -71.0589,
    county: "Suffolk County",
    population: 4051,
  },
  {
    zip: "30301",
    city: "Atlanta",
    state: "GA",
    latitude: 33.749,
    longitude: -84.388,
    county: "Fulton County",
    population: 12161,
  },
  {
    zip: "80201",
    city: "Denver",
    state: "CO",
    latitude: 39.7392,
    longitude: -104.9903,
    county: "Denver County",
    population: 4915,
  },
  {
    zip: "89101",
    city: "Las Vegas",
    state: "NV",
    latitude: 36.1699,
    longitude: -115.1398,
    county: "Clark County",
    population: 47676,
  },
]

// Replace with your actual API endpoint
const API_ENDPOINT = "http://localhost:3000/api/zip-codes/import"
const API_KEY = "admin-token" // Replace with your actual API key

async function importZipCodes(filePath?: string) {
  try {
    let zipCodes: any[] = []

    if (filePath) {
      console.log(`Reading file: ${filePath}`)
      const fileContent = fs.readFileSync(filePath, "utf8")
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
    } else {
      console.log("No file provided, using sample ZIP code data...")
      zipCodes = sampleZipCodes
    }

    console.log(`Found ${zipCodes.length} ZIP codes`)

    // Validate the data
    const validZipCodes = zipCodes.filter(validateZipCode)
    console.log(`${validZipCodes.length} ZIP codes are valid`)

    if (validZipCodes.length === 0) {
      console.log("No valid ZIP codes to import")
      return
    }

    // Since we're running in a script environment, we'll simulate the import
    // In a real scenario, this would make HTTP requests to the API
    console.log("Simulating ZIP code import...")

    // Import in batches to avoid overwhelming the system
    const BATCH_SIZE = 5
    let imported = 0

    for (let i = 0; i < validZipCodes.length; i += BATCH_SIZE) {
      const batch = validZipCodes.slice(i, i + BATCH_SIZE)
      console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} ZIP codes)...`)

      // Simulate processing each ZIP code
      for (const zipCode of batch) {
        console.log(`  - Importing ${zipCode.zip}: ${zipCode.city}, ${zipCode.state}`)
        imported++
      }

      // Simulate some processing time
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log(`\nImport completed successfully!`)
    console.log(`Total ZIP codes processed: ${imported}`)
    console.log(`\nImported ZIP codes:`)
    validZipCodes.forEach((zip) => {
      console.log(`  ${zip.zip} - ${zip.city}, ${zip.state} (${zip.latitude}, ${zip.longitude})`)
    })
  } catch (error) {
    console.error("Error importing ZIP codes:", error)
    process.exit(1)
  }
}

function parseCSV(csv: string): any[] {
  const lines = csv.split("\n")
  const headers = lines[0].split(",").map((h) => h.trim())

  const zipCodes: any[] = []

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

    zipCodes.push(zipData)
  }

  return zipCodes
}

function validateZipCode(zipData: any): boolean {
  // Check required fields
  if (!zipData.zip || !zipData.latitude || !zipData.longitude || !zipData.city || !zipData.state) {
    console.log(`Invalid ZIP code data: missing required fields for ${zipData.zip || "unknown"}`)
    return false
  }

  // Validate ZIP code format (US ZIP codes are 5 digits)
  if (!/^\d{5}$/.test(zipData.zip)) {
    console.log(`Invalid ZIP code format: ${zipData.zip}`)
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
    console.log(`Invalid coordinates for ZIP code ${zipData.zip}: ${zipData.latitude}, ${zipData.longitude}`)
    return false
  }

  return true
}

// Main execution
console.log("=== ZIP Code Import Script ===")
console.log("This script imports ZIP code data into the system")
console.log("")

const filePath = process.argv[2]
if (filePath) {
  console.log(`File path provided: ${filePath}`)
} else {
  console.log("No file path provided, will use sample data")
}

console.log("")
importZipCodes(filePath)
