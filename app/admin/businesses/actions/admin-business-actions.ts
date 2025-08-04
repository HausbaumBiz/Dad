"use server"

import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import { KEY_PREFIXES } from "@/lib/db-schema"
import type { Business } from "@/lib/definitions"

// Helper function to safely extract error messages
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "Unknown error occurred"
}

// Helper function to safely parse JSON data
function safeJsonParse(data: any, fallback: any = null) {
  try {
    if (typeof data === "string") {
      return JSON.parse(data)
    }
    if (typeof data === "object" && data !== null) {
      return data
    }
    return fallback
  } catch (error) {
    console.error("Error parsing JSON:", error)
    return fallback
  }
}

// Deactivate a business account
export async function deactivateBusiness(businessId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Deactivating business account: ${businessId}`)

    // Get the current business data
    const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!businessData) {
      return { success: false, message: "Business not found" }
    }

    // Parse the business data
    let business: Business
    if (typeof businessData === "string") {
      business = JSON.parse(businessData)
    } else {
      business = businessData as Business
    }

    // Update the business status to inactive
    const updatedBusiness = {
      ...business,
      status: "inactive" as const,
      updatedAt: new Date().toISOString(),
    }

    // Save the updated business data
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}`, updatedBusiness)

    console.log(`Business account deactivated successfully: ${businessId}`)

    // Revalidate the admin businesses page
    revalidatePath("/admin/businesses")

    return {
      success: true,
      message: `Business account has been deactivated`,
    }
  } catch (error) {
    console.error(`Error deactivating business ${businessId}:`, getErrorMessage(error))
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
}

// Reactivate a business account
export async function reactivateBusiness(businessId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Reactivating business account: ${businessId}`)

    // Get the current business data
    const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!businessData) {
      return { success: false, message: "Business not found" }
    }

    // Parse the business data
    let business: Business
    if (typeof businessData === "string") {
      business = JSON.parse(businessData)
    } else {
      business = businessData as Business
    }

    // Update the business status to active
    const updatedBusiness = {
      ...business,
      status: "active" as const,
      updatedAt: new Date().toISOString(),
    }

    // Save the updated business data
    await kv.set(`${KEY_PREFIXES.BUSINESS}${businessId}`, updatedBusiness)

    console.log(`Business account reactivated successfully: ${businessId}`)

    // Revalidate the admin businesses page
    revalidatePath("/admin/businesses")

    return {
      success: true,
      message: `Business account has been reactivated`,
    }
  } catch (error) {
    console.error(`Error reactivating business ${businessId}:`, getErrorMessage(error))
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
}

// Delete a business account (existing function enhanced)
export async function deleteBusinessAccount(businessId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Deleting business account: ${businessId}`)

    // Get the business first to get the email
    const businessData = await kv.get(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    if (!businessData) {
      return { success: false, message: "Business not found" }
    }

    // Parse the business data
    let business: Business
    if (typeof businessData === "string") {
      business = JSON.parse(businessData)
    } else {
      business = businessData as Business
    }

    console.log(`Found business: ${business.businessName} (${businessId})`)

    // Remove business from email index
    if (business.email) {
      console.log(`Removing business from email index: ${business.email}`)
      await kv.del(`${KEY_PREFIXES.BUSINESS_EMAIL}${business.email.toLowerCase()}`)
    }

    // Remove business from category index if it has one
    if (business.category) {
      console.log(`Removing business from category index: ${business.category}`)
      await kv.srem(`${KEY_PREFIXES.CATEGORY}${business.category}`, businessId)
    }

    // Remove business from the set of all businesses
    console.log(`Removing business from the set of all businesses`)
    await kv.srem(KEY_PREFIXES.BUSINESSES_SET, businessId)

    // Delete any associated data
    console.log(`Deleting associated data for business ${businessId}`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${businessId}:adDesign`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${businessId}:categories`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${businessId}:zipcodes`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${businessId}:nationwide`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${businessId}:serviceArea`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${businessId}:headerImage`)

    // Delete the business data
    console.log(`Deleting business data for ${businessId}`)
    await kv.del(`${KEY_PREFIXES.BUSINESS}${businessId}`)

    // Revalidate paths
    console.log(`Revalidating paths`)
    revalidatePath("/admin/businesses")

    console.log(`Business deleted successfully: ${business.businessName} (${businessId})`)

    return {
      success: true,
      message: `Business ${business.businessName} successfully deleted`,
    }
  } catch (error) {
    console.error(`Error deleting business ${businessId}:`, getErrorMessage(error))
    return {
      success: false,
      message: getErrorMessage(error),
    }
  }
}
