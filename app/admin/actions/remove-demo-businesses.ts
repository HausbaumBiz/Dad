"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

// Define types
interface Business {
  id: string
  businessName?: string
  business_name?: string
  email?: string
  isDemo?: boolean
  is_demo?: boolean
  [key: string]: any
}

interface RemovalResult {
  success: boolean
  removed: number
  errors: string[]
  removedBusinesses: Business[]
}

// Function to identify demo businesses
export async function identifyDemoBusinesses(): Promise<Business[]> {
  try {
    console.log("Identifying demo businesses...")

    // Get all business keys from Redis
    const businessKeys = await kv.keys("business:*")
    console.log(`Found ${businessKeys.length} total business keys`)

    // Filter to only include direct business keys (business:{uuid})
    // This excludes keys like business:{uuid}:categories, business:{uuid}:cloudflare-media, etc.
    const validBusinessKeys = businessKeys.filter((key) => {
      // Count the number of colons in the key
      const colonCount = (key.match(/:/g) || []).length

      // Only include keys with exactly one colon (business:{uuid})
      return colonCount === 1 && key.startsWith("business:")
    })

    console.log(`Found ${validBusinessKeys.length} valid business keys after strict filtering`)

    const demoBusinesses: Business[] = []

    // Fetch each business and check if it's a demo
    for (const key of validBusinessKeys) {
      try {
        const businessData = (await kv.get(key)) as Business | null

        if (!businessData) continue

        // Extract business ID from the key
        const businessId = key.replace("business:", "")

        // Add ID to the business object
        const business: Business = {
          ...businessData,
          id: businessId,
        }

        // Get the business name (handle different possible field names)
        const businessName = business.businessName || business.business_name || "Unknown Business"
        const email = business.email || ""

        // Check if this is a demo business
        const isDemoFlag = business.isDemo === true || business.is_demo === true
        const hasDemoName = typeof businessName === "string" && businessName.toLowerCase().includes("demo")
        const hasSampleName = typeof businessName === "string" && businessName.toLowerCase().includes("sample")
        const hasDemoEmail = typeof email === "string" && email.toLowerCase().includes("demo")
        const hasSampleEmail = typeof email === "string" && email.toLowerCase().includes("sample")
        const hasExampleEmail = typeof email === "string" && email.toLowerCase().includes("example")

        // If any demo indicators are true, add to the list
        if (isDemoFlag || hasDemoName || hasSampleName || hasDemoEmail || hasSampleEmail || hasExampleEmail) {
          demoBusinesses.push(business)
        }
      } catch (error) {
        console.error(`Error processing business ${key}:`, error)
      }
    }

    console.log(`Identified ${demoBusinesses.length} demo businesses`)
    return demoBusinesses
  } catch (error) {
    console.error("Error identifying demo businesses:", error)
    throw error
  }
}

// Function to remove a single demo business
export async function removeDemoBusiness(businessId: string): Promise<RemovalResult> {
  try {
    console.log(`Removing demo business: ${businessId}`)

    // Get the business to confirm it's a demo
    const business = (await kv.get(`business:${businessId}`)) as Business | null

    if (!business) {
      return {
        success: false,
        removed: 0,
        errors: [`Business with ID ${businessId} not found`],
        removedBusinesses: [],
      }
    }

    // Add ID to the business object
    business.id = businessId

    // Get the business name (handle different possible field names)
    const businessName = business.businessName || business.business_name || "Unknown Business"
    const email = business.email || ""

    // Verify it's a demo business
    const isDemoFlag = business.isDemo === true || business.is_demo === true
    const hasDemoName = typeof businessName === "string" && businessName.toLowerCase().includes("demo")
    const hasSampleName = typeof businessName === "string" && businessName.toLowerCase().includes("sample")
    const hasDemoEmail = typeof email === "string" && email.toLowerCase().includes("demo")
    const hasSampleEmail = typeof email === "string" && email.toLowerCase().includes("sample")
    const hasExampleEmail = typeof email === "string" && email.toLowerCase().includes("example")

    const isDemoBusiness =
      isDemoFlag || hasDemoName || hasSampleName || hasDemoEmail || hasSampleEmail || hasExampleEmail

    if (!isDemoBusiness) {
      return {
        success: false,
        removed: 0,
        errors: [`Business with ID ${businessId} is not identified as a demo business`],
        removedBusinesses: [],
      }
    }

    // Remove the business
    await kv.del(`business:${businessId}`)
    console.log(`Deleted business:${businessId}`)

    // Find and remove all related keys
    const relatedKeys = await kv.keys(`business:${businessId}:*`)
    console.log(`Found ${relatedKeys.length} related keys to delete`)

    for (const key of relatedKeys) {
      try {
        await kv.del(key)
        console.log(`Deleted related key: ${key}`)
      } catch (error) {
        console.error(`Error deleting related key ${key}:`, error)
      }
    }

    // Also remove from business email index
    if (email) {
      try {
        const emailKey = `business:email:${email}`
        const emailExists = await kv.exists(emailKey)
        if (emailExists) {
          await kv.del(emailKey)
          console.log(`Deleted ${emailKey}`)
        }
      } catch (error) {
        console.error(`Error removing email index for ${businessId}:`, error)
      }
    }

    // Revalidate paths
    revalidatePath("/admin/businesses")
    revalidatePath("/admin/remove-demo-businesses")

    return {
      success: true,
      removed: 1,
      errors: [],
      removedBusinesses: [business],
    }
  } catch (error) {
    console.error("Error removing demo business:", error)
    return {
      success: false,
      removed: 0,
      errors: [(error as Error).message || "Unknown error occurred"],
      removedBusinesses: [],
    }
  }
}

// Function to remove all demo businesses
export async function removeAllDemoBusinesses(): Promise<RemovalResult> {
  try {
    console.log("Removing all demo businesses...")

    const demoBusinesses = await identifyDemoBusinesses()

    if (demoBusinesses.length === 0) {
      return {
        success: true,
        removed: 0,
        errors: [],
        removedBusinesses: [],
      }
    }

    console.log(`Found ${demoBusinesses.length} demo businesses to remove`)

    const errors: string[] = []
    const removedBusinesses: Business[] = []

    // Remove each demo business
    for (const business of demoBusinesses) {
      try {
        const result = await removeDemoBusiness(business.id)
        if (result.success) {
          removedBusinesses.push(business)
        } else {
          errors.push(...result.errors)
        }
      } catch (error) {
        errors.push(`Failed to remove business ${business.id}: ${(error as Error).message || "Unknown error"}`)
      }
    }

    console.log(`Successfully removed ${removedBusinesses.length} demo businesses with ${errors.length} errors`)

    // Revalidate paths
    revalidatePath("/admin/businesses")
    revalidatePath("/admin/remove-demo-businesses")

    return {
      success: errors.length === 0,
      removed: removedBusinesses.length,
      errors,
      removedBusinesses,
    }
  } catch (error) {
    console.error("Error removing all demo businesses:", error)
    return {
      success: false,
      removed: 0,
      errors: [(error as Error).message || "Unknown error occurred"],
      removedBusinesses: [],
    }
  }
}
