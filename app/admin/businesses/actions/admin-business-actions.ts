"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { KEY_PREFIXES } from "@/lib/db-schema"

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

// Deactivate a business account
export async function deactivateBusinessAccount(businessId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Deactivating business account: ${businessId}`)

    // Get the current business data
    const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!businessData) {
      return { success: false, message: "Business not found" }
    }

    let business: any = null
    if (typeof businessData === "string") {
      try {
        business = JSON.parse(businessData)
      } catch (parseError) {
        console.error(`Error parsing business data for ${businessId}:`, getErrorMessage(parseError))
        return { success: false, message: "Error processing business data" }
      }
    } else if (typeof businessData === "object" && businessData !== null) {
      business = businessData
    } else {
      return { success: false, message: "Invalid business data format" }
    }

    // Update the business status to inactive
    const updatedBusiness = {
      ...business,
      status: "inactive",
      updatedAt: new Date().toISOString(),
    }

    // Save the updated business data
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}`, JSON.stringify(updatedBusiness))

    console.log(`Business ${businessId} (${business.businessName}) has been deactivated`)

    // Revalidate the admin businesses page
    revalidatePath("/admin/businesses")

    return {
      success: true,
      message: `Business account for ${business.businessName} has been deactivated`,
    }
  } catch (error) {
    console.error(`Error deactivating business ${businessId}:`, getErrorMessage(error))
    return {
      success: false,
      message: "Failed to deactivate business account",
    }
  }
}

// Reactivate a business account
export async function reactivateBusinessAccount(businessId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Reactivating business account: ${businessId}`)

    // Get the current business data
    const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!businessData) {
      return { success: false, message: "Business not found" }
    }

    let business: any = null
    if (typeof businessData === "string") {
      try {
        business = JSON.parse(businessData)
      } catch (parseError) {
        console.error(`Error parsing business data for ${businessId}:`, getErrorMessage(parseError))
        return { success: false, message: "Error processing business data" }
      }
    } else if (typeof businessData === "object" && businessData !== null) {
      business = businessData
    } else {
      return { success: false, message: "Invalid business data format" }
    }

    // Update the business status to active
    const updatedBusiness = {
      ...business,
      status: "active",
      updatedAt: new Date().toISOString(),
    }

    // Save the updated business data
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}`, JSON.stringify(updatedBusiness))

    console.log(`Business ${businessId} (${business.businessName}) has been reactivated`)

    // Revalidate the admin businesses page
    revalidatePath("/admin/businesses")

    return {
      success: true,
      message: `Business account for ${business.businessName} has been reactivated`,
    }
  } catch (error) {
    console.error(`Error reactivating business ${businessId}:`, getErrorMessage(error))
    return {
      success: false,
      message: "Failed to reactivate business account",
    }
  }
}
