"use server"

import { cookies } from "next/headers"
import { kv } from "@/lib/redis"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import crypto from "crypto"

// Business type definition
export type Business = {
  id: string
  firstName: string
  lastName: string
  businessName: string
  zipCode: string
  email: string
  passwordHash: string
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
  phone?: string
}

// Register a new business
export async function registerBusiness(formData: FormData) {
  try {
    // Extract form data
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const businessName = formData.get("businessName") as string
    const zipCode = formData.get("zipCode") as string
    const email = (formData.get("email") as string).toLowerCase()
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate form data
    if (!firstName || !lastName || !businessName || !zipCode || !email || !password || !confirmPassword) {
      return { success: false, message: "All fields are required" }
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match" }
    }

    // Check if business with this email already exists
    const existingBusiness = await kv.get(`business:email:${email}`)
    if (existingBusiness) {
      return { success: false, message: `Email ${email} already registered` }
    }

    // Generate a unique ID for the business
    const id = crypto.randomUUID()

    // Hash the password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create business object
    const business: Business = {
      id,
      firstName,
      lastName,
      businessName,
      zipCode,
      email,
      passwordHash,
      isEmailVerified: true, // For simplicity, we're setting this to true by default
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Store business in KV store
    await kv.set(`business:${id}`, business)
    await kv.set(`business:email:${email}`, id)

    // Add business ID to the set of all businesses
    await kv.sadd("businesses", id)

    // Set a cookie with the business ID
    cookies().set("businessId", id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    console.log(`Business registered: ${businessName} (${id})`)

    // Return success with redirect URL instead of directly redirecting
    return {
      success: true,
      message: "Registration successful",
      redirectUrl: "/legal-notice",
    }
  } catch (error) {
    console.error("Business registration failed:", error)
    return { success: false, message: "Registration failed. Please try again." }
  }
}

// Login a business
export async function loginBusiness(formData: FormData) {
  try {
    const email = (formData.get("email") as string).toLowerCase()
    const password = formData.get("password") as string
    const rememberMe = formData.get("rememberMe") === "on"

    // Validate form data
    if (!email || !password) {
      return { success: false, message: "Email and password are required" }
    }

    // Get business ID by email
    const businessId = await kv.get(`business:email:${email}`)
    if (!businessId) {
      return { success: false, message: "Invalid email or password" }
    }

    // Get business by ID
    const business = (await kv.get(`business:${businessId}`)) as Business
    if (!business) {
      return { success: false, message: "Invalid email or password" }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, business.passwordHash)
    if (!isPasswordValid) {
      return { success: false, message: "Invalid email or password" }
    }

    // Check if email is verified
    if (!business.isEmailVerified) {
      return { success: false, message: "Please verify your email before logging in" }
    }

    // Set cookie with business ID
    cookies().set("businessId", business.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days if remember me, otherwise 7 days
      path: "/",
    })

    console.log(`Business logged in: ${business.businessName} (${business.id})`)

    // Return success with redirect URL instead of directly redirecting
    return {
      success: true,
      message: "Login successful",
      redirectUrl: "/workbench",
    }
  } catch (error) {
    console.error("Business login failed:", error)
    return { success: false, message: "Login failed. Please try again." }
  }
}

// Get the current business from the cookie
export async function getCurrentBusiness() {
  try {
    // Check if KV environment variables are available
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      console.warn("KV environment variables are missing. Using mock data for development.")
      // Return mock data for development/preview
      return {
        id: "mock-id",
        firstName: "Demo",
        lastName: "User",
        businessName: "Demo Business",
        zipCode: "12345",
        email: "demo@example.com",
        isEmailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }

    const businessId = cookies().get("businessId")?.value
    if (!businessId) {
      console.log("No businessId cookie found")
      return null
    }

    console.log(`Fetching business with ID: ${businessId}`)
    const business = await kv.get(`business:${businessId}`)

    if (!business) {
      console.log(`No business found with ID: ${businessId}`)
      // Don't delete the cookie here, let the client handle redirection
      return null
    }

    return business as Business
  } catch (error) {
    console.error("Error getting current business:", error)
    // In case of error, return null instead of mock data to trigger proper error handling
    return null
  }
}

// Logout the current business
export async function logoutBusiness() {
  try {
    cookies().delete("businessId")
    return { success: true }
  } catch (error) {
    console.error("Error during logout:", error)
    return { success: false, error: "Failed to logout" }
  }
}

// Check if a business email exists
export async function checkBusinessEmailExists(email: string) {
  try {
    const normalizedEmail = email.toLowerCase()
    const businessId = await kv.get(`business:email:${normalizedEmail}`)
    return !!businessId
  } catch (error) {
    console.error("Error checking business email:", error)
    return false
  }
}

// Get all businesses
export async function getBusinesses() {
  try {
    // Get all business IDs from the set
    const businessIds = (await kv.smembers("businesses")) as string[]

    if (!businessIds || businessIds.length === 0) {
      return []
    }

    // Fetch each business's data
    const businessesPromises = businessIds.map(async (id) => {
      const business = (await kv.get(`business:${id}`)) as Business
      return business ? { ...business, id } : null
    })

    const businesses = (await Promise.all(businessesPromises)).filter(Boolean) as Business[]

    // Sort by creation date (newest first)
    return businesses.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })
  } catch (error) {
    console.error("Error fetching businesses:", error)
    return []
  }
}

// Get a business by ID
export async function getBusinessById(id: string) {
  try {
    const business = (await kv.get(`business:${id}`)) as Business
    return business ? { ...business, id } : null
  } catch (error) {
    console.error(`Error fetching business with ID ${id}:`, error)
    return null
  }
}

// Add the saveBusinessAdDesign and getBusinessAdDesign functions to fix the Redis WRONGTYPE error:

/**
 * Save business ad design data
 */
export async function saveBusinessAdDesign(businessId: string, designData: any) {
  try {
    if (!businessId) {
      throw new Error("Business ID is required")
    }

    const key = `business:${businessId}:adDesign`

    // Check if key exists and delete it to avoid type conflicts
    const exists = await kv.exists(key)
    if (exists) {
      await kv.del(key)
    }

    // Ensure hiddenFields exists
    if (!designData.hiddenFields) {
      designData.hiddenFields = {
        address: false,
        phone: false,
        hours: false,
        website: false,
        video: false,
        thumbnail: false,
        photoAlbum: false,
        freeText: false,
      }
    }

    // Store the entire design data as a JSON string
    await kv.set(key, JSON.stringify(designData))

    revalidatePath(`/ad-design/customize`)

    return { success: true }
  } catch (error) {
    console.error("Error saving business ad design:", error)
    throw error
  }
}

/**
 * Get business ad design data
 */
export async function getBusinessAdDesign(businessId: string) {
  try {
    if (!businessId) {
      return null
    }

    const key = `business:${businessId}:adDesign`
    const designDataStr = await kv.get(key)

    if (!designDataStr) {
      return null
    }

    // Parse the JSON string back to an object
    const designData = typeof designDataStr === "string" ? JSON.parse(designDataStr) : designDataStr

    // Ensure hiddenFields exists
    if (!designData.hiddenFields) {
      designData.hiddenFields = {
        address: false,
        phone: false,
        hours: false,
        website: false,
        video: false,
        thumbnail: false,
        photoAlbum: false,
        freeText: false,
      }
    }

    return designData
  } catch (error) {
    console.error("Error getting business ad design:", error)
    return null
  }
}

// Delete a business by ID
export async function deleteBusiness(id: string) {
  try {
    // Get the business first to retrieve the email
    const business = await getBusinessById(id)

    if (!business) {
      return { success: false, message: "Business not found" }
    }

    // Delete business data
    await kv.del(`business:${id}`)

    // Delete email index
    await kv.del(`business:email:${business.email}`)

    // Remove from the set of all businesses
    await kv.srem("businesses", id)

    // Delete any associated data
    await kv.del(`business:${id}:adDesign`)

    // Revalidate the businesses page
    revalidatePath("/admin/businesses")

    return {
      success: true,
      message: `Business "${business.businessName}" has been deleted successfully`,
    }
  } catch (error) {
    console.error(`Error deleting business with ID ${id}:`, error)
    return {
      success: false,
      message: "Failed to delete business. Please try again.",
    }
  }
}

// Update business password
export async function updateBusinessPassword(businessId: string, currentPassword: string, newPassword: string) {
  try {
    // Validate inputs
    if (!businessId || !currentPassword || !newPassword) {
      return { success: false, message: "Missing required information" }
    }

    // Get the business
    const business = await getBusinessById(businessId)
    if (!business) {
      return { success: false, message: "Business not found" }
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, business.passwordHash)
    if (!isPasswordValid) {
      return { success: false, message: "Current password is incorrect" }
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10)
    const newPasswordHash = await bcrypt.hash(newPassword, salt)

    // Update the business with the new password hash
    const updatedBusiness = {
      ...business,
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString(),
    }

    // Save the updated business
    await kv.set(`business:${businessId}`, updatedBusiness)

    return {
      success: true,
      message: "Password updated successfully",
    }
  } catch (error) {
    console.error("Error updating business password:", error)
    return {
      success: false,
      message: "Failed to update password. Please try again.",
    }
  }
}
