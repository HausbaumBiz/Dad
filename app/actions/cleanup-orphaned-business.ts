"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return JSON.stringify(error, Object.getOwnPropertyNames(error))
}

export async function removeOrphanedBusiness(businessId: string): Promise<{
  success: boolean
  message: string
  removedFrom: string[]
}> {
  try {
    console.log(`Starting cleanup of orphaned business: ${businessId}`)

    const removedFrom: string[] = []

    // List of category keys to check and clean up
    const categoryKeysToCheck = [
      "category:Insurance, Finance, Debt and Sales:businesses",
      "category:insurance,-finance,-debt-and-sales:businesses",
      "category:finance-insurance:businesses",
      "category:Insurance:businesses",
      "category:Finance:businesses",
      "category:Debt:businesses",
      "category:Sales:businesses",
      "category:Financial Services:businesses",
      "category:Insurance Services:businesses",
    ]

    // Remove business ID from all category indexes
    for (const categoryKey of categoryKeysToCheck) {
      try {
        console.log(`Checking category key: ${categoryKey}`)

        // Check if the business ID exists in this set
        const isMember = await kv.sismember(categoryKey, businessId)

        if (isMember) {
          console.log(`Found business ${businessId} in ${categoryKey}, removing...`)
          await kv.srem(categoryKey, businessId)
          removedFrom.push(categoryKey)
        } else {
          console.log(`Business ${businessId} not found in ${categoryKey}`)
        }
      } catch (error) {
        console.error(`Error checking/removing from ${categoryKey}:`, getErrorMessage(error))
      }
    }

    // Also remove from the main businesses set
    try {
      console.log(`Removing ${businessId} from main businesses set`)
      await kv.srem("businesses", businessId)
      removedFrom.push("businesses")
    } catch (error) {
      console.error(`Error removing from main businesses set:`, getErrorMessage(error))
    }

    // Clean up any other associated data that might exist
    const keysToDelete = [
      `business:${businessId}`,
      `business:${businessId}:adDesign`,
      `business:${businessId}:adDesign:businessInfo`,
      `business:${businessId}:adDesign:colors`,
      `business:${businessId}:adDesign:hiddenFields`,
      `business:${businessId}:categories`,
      `business:${businessId}:selectedCategories`,
      `business:${businessId}:allSubcategories`,
      `business:${businessId}:zipcodes`,
      `business:${businessId}:nationwide`,
      `business:${businessId}:serviceArea`,
    ]

    for (const key of keysToDelete) {
      try {
        console.log(`Deleting key: ${key}`)
        await kv.del(key)
      } catch (error) {
        console.error(`Error deleting key ${key}:`, getErrorMessage(error))
      }
    }

    // Revalidate relevant paths
    revalidatePath("/financial-services")
    revalidatePath("/admin/businesses")

    console.log(`Successfully cleaned up orphaned business ${businessId}`)
    console.log(`Removed from ${removedFrom.length} locations:`, removedFrom)

    return {
      success: true,
      message: `Successfully removed orphaned business ${businessId} from ${removedFrom.length} locations`,
      removedFrom,
    }
  } catch (error) {
    console.error(`Error cleaning up orphaned business ${businessId}:`, getErrorMessage(error))
    return {
      success: false,
      message: `Failed to clean up orphaned business: ${getErrorMessage(error)}`,
      removedFrom: [],
    }
  }
}

// Function to find and clean up all orphaned businesses
export async function findAndCleanupOrphanedBusinesses(): Promise<{
  success: boolean
  message: string
  orphanedBusinesses: string[]
  cleanedUp: string[]
}> {
  try {
    console.log("Starting search for orphaned businesses...")

    const orphanedBusinesses: string[] = []
    const cleanedUp: string[] = []

    // Get all business IDs from the main businesses set
    const allBusinessIds = await kv.smembers("businesses")
    console.log(`Found ${allBusinessIds.length} business IDs in main set`)

    // Check each business to see if the actual data exists
    for (const businessId of allBusinessIds) {
      try {
        const businessData = await kv.get(`business:${businessId}`)

        if (!businessData) {
          console.log(`Found orphaned business ID: ${businessId}`)
          orphanedBusinesses.push(businessId)

          // Clean up this orphaned business
          const cleanupResult = await removeOrphanedBusiness(businessId)
          if (cleanupResult.success) {
            cleanedUp.push(businessId)
          }
        }
      } catch (error) {
        console.error(`Error checking business ${businessId}:`, getErrorMessage(error))
      }
    }

    return {
      success: true,
      message: `Found ${orphanedBusinesses.length} orphaned businesses, cleaned up ${cleanedUp.length}`,
      orphanedBusinesses,
      cleanedUp,
    }
  } catch (error) {
    console.error("Error finding orphaned businesses:", getErrorMessage(error))
    return {
      success: false,
      message: `Failed to find orphaned businesses: ${getErrorMessage(error)}`,
      orphanedBusinesses: [],
      cleanedUp: [],
    }
  }
}
