import fs from "fs"
import path from "path"
import { parse } from "csv-parse/sync"
import { saveZipCode, type ZipCodeData, getZipCodeCount } from "../lib/zip-codes"

// This script would be run separately, not as part of the web application
async function importZipCodes() {
  try {
    console.log("Starting ZIP code import...")

    // Check if we already have ZIP codes in the database
    const existingCount = await getZipCodeCount()
    if (existingCount > 0) {
      console.log(`Database already contains ${existingCount} ZIP codes. Skipping import.`)
      console.log("To reimport, clear the database first.")
      return
    }

    // Path to the CSV file
    const csvFilePath = path.join(process.cwd(), "data", "us_zip_codes.csv")

    // Read the CSV file
    const fileContent = fs.readFileSync(csvFilePath, "utf-8")

    // Parse the CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    })

    console.log(`Found ${records.length} ZIP codes to import`)

    // Import the ZIP codes in batches
    const batchSize = 100
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      const promises = batch.map(async (record: any) => {
        try {
          const zipData: ZipCodeData = {
            zipCode: record.zip_code,
            city: record.city,
            state: record.state_name,
            stateCode: record.state_id,
            county: record.county,
            latitude: Number.parseFloat(record.latitude),
            longitude: Number.parseFloat(record.longitude),
            timezone: record.timezone,
          }

          const success = await saveZipCode(zipData)
          if (success) {
            successCount++
          } else {
            errorCount++
          }
        } catch (error) {
          console.error(`Error importing ZIP code ${record.zip_code}:`, error)
          errorCount++
        }
      })

      await Promise.all(promises)
      console.log(`Imported ${i + batch.length} of ${records.length} ZIP codes...`)
    }

    console.log("ZIP code import completed")
    console.log(`Successfully imported: ${successCount}`)
    console.log(`Errors: ${errorCount}`)
  } catch (error) {
    console.error("Error importing ZIP codes:", error)
  }
}

// Run the import
importZipCodes()
