"use server"

import { migrateBusinessData } from "@/lib/db-schema"
import { revalidatePath } from "next/cache"
import { kv } from "@/lib/redis"
import type { ZipCodeData } from "@/lib/zip-code-types"

// Migrate data to the new schema
export async function migrateData() {
  try {
    console.log("Starting data migration...")

    const result = await migrateBusinessData()

    // Revalidate paths that might be affected by the migration
    revalidatePath("/admin/businesses")
    revalidatePath("/funeral-services")
    revalidatePath("/statistics")

    console.log("Data migration completed:", result)

    return {
      ...result,
      message: `Successfully migrated ${result.processed} businesses with ${result.errors} errors.`,
    }
  } catch (error) {
    console.error("Error during data migration:", error)
    return {
      success: false,
      processed: 0,
      errors: 1,
      message: error instanceof Error ? error.message : "An unknown error occurred during migration",
    }
  }
}

// Migrate ZIP code data to the new format
export async function migrateZipCodes(): Promise<{
  success: boolean
  processed: number
  errors: number
  message?: string
}> {
  try {
    const result = {
      success: true,
      processed: 0,
      errors: 0,
      message: "",
    }

    // Get all business IDs
    const businessIds = await kv.smembers("businesses")

    if (!businessIds || businessIds.length === 0) {
      return {
        ...result,
        message: "No businesses found in the database",
      }
    }

    for (const id of businessIds) {
      try {
        // Get nationwide flag
        const isNationwide = (await kv.get(`business:${id}:nationwide`)) || false

        // Try to get ZIP codes from JSON storage first
        const zipCodesData = await kv.get(`business:${id}:zipcodes`)
        let parsedZipCodes: ZipCodeData[] = []

        if (zipCodesData) {
          // Parse JSON data if it exists
          if (typeof zipCodesData === "string") {
            try {
              parsedZipCodes = JSON.parse(zipCodesData)
            } catch (parseError) {
              console.error(`Error parsing ZIP codes JSON for business ${id}:`, parseError)
              result.errors++
              continue
            }
          } else if (Array.isArray(zipCodesData)) {
            parsedZipCodes = zipCodesData as ZipCodeData[]
          }
        }

        // Extract just the ZIP code strings
        const zipCodeStrings = parsedZipCodes.map((z) => z.zip)

        // Store as a set for efficient lookups
        if (zipCodeStrings.length > 0) {
          // First delete any existing set to avoid duplicates
          await kv.del(`business:${id}:zipcodes:set`)
          // Then add all zip codes to the set
          await kv.sadd(`business:${id}:zipcodes:set`, ...zipCodeStrings)
        }

        // For each zip code, add this business to the zip code's business set
        if (!isNationwide && zipCodeStrings.length > 0) {
          for (const zip of zipCodeStrings) {
            await kv.sadd(`zipcode:${zip}:businesses`, id)
          }
        }

        // If nationwide, add to the nationwide businesses set
        if (isNationwide) {
          await kv.sadd("businesses:nationwide", id)
        } else {
          // Remove from nationwide set if not nationwide
          await kv.srem("businesses:nationwide", id)
        }

        result.processed++
      } catch (error) {
        console.error(`Error migrating ZIP codes for business ${id}:`, error)
        result.errors++
      }
    }

    return result
  } catch (error) {
    console.error("Error during ZIP code migration:", error)
    return {
      success: false,
      processed: 0,
      errors: 1,
      message: error instanceof Error ? error.message : "Unknown error occurred during migration",
    }
  }
}

// Add other admin actions here...
