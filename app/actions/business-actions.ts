"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { kv } from "@vercel/kv"
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
      redirectUrl: "/legal-notice",
    }
  } catch (error) {
    console.error("Business login failed:", error)
    return { success: false, message: "Login failed. Please try again." }
  }
}

// Get the current business from the cookie
export async function getCurrentBusiness() {
  try {
    const businessId = cookies().get("businessId")?.value
    if (!businessId) return null

    const business = (await kv.get(`business:${businessId}`)) as Business
    if (!business) {
      cookies().delete("businessId")
      return null
    }

    return business
  } catch (error) {
    console.error("Error getting current business:", error)
    return null
  }
}

// Logout the current business
export async function logoutBusiness() {
  cookies().delete("businessId")
  redirect("/")
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
