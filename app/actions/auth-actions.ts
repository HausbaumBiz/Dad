"use server"

import { randomBytes } from "crypto"
import { redirect } from "next/navigation"

// For this version, we'll use an in-memory store
type User = {
  id: number
  firstName: string
  lastName: string
  email: string
  password: string
  isEmailVerified: boolean
}

type VerificationToken = {
  token: string
  userId: number
  expiresAt: Date
}

type Business = {
  id: number
  name: string
  email: string
  zipCode: string
  userId: number
}

// In-memory stores
const users: User[] = []
const verificationTokens: VerificationToken[] = []
const businesses: Business[] = []

// Helper to generate a unique ID
let nextId = 1

// Function to simulate sending an email
async function sendVerificationEmail(email: string, token: string) {
  // In a real app, you would send an actual email
  console.log(`Sending verification email to ${email} with token ${token}`)
  // Remove the verification link that points to the deleted page

  return {
    success: true,
    message: "Email sent successfully",
  }
}

export async function registerBusiness(formData: FormData) {
  // Extract form data
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const zipCode = formData.get("zipCode") as string
  const businessName = formData.get("businessName") as string

  // Validate form data
  if (!firstName || !lastName || !email || !password || !confirmPassword || !zipCode || !businessName) {
    return {
      success: false,
      message: "All fields are required",
    }
  }

  if (password !== confirmPassword) {
    return {
      success: false,
      message: "Passwords do not match",
    }
  }

  // Check if user already exists
  const existingUser = users.find((user) => user.email === email)
  if (existingUser) {
    return {
      success: false,
      message: "Email already registered",
    }
  }

  // Create user
  const userId = nextId++
  const newUser: User = {
    id: userId,
    firstName,
    lastName,
    email,
    password, // In a real app, this would be hashed
    isEmailVerified: false,
  }
  users.push(newUser)

  // Create business
  const businessId = nextId++
  const newBusiness: Business = {
    id: businessId,
    name: businessName,
    email,
    zipCode,
    userId,
  }
  businesses.push(newBusiness)

  // Generate verification token
  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // Token expires in 24 hours

  // Save verification token
  verificationTokens.push({
    token,
    userId,
    expiresAt,
  })

  // Simulate sending verification email
  await sendVerificationEmail(email, token)

  // Redirect to confirmation page
  redirect("/registration-confirmation?email=" + encodeURIComponent(email))
}

export async function verifyEmail(token: string) {
  // Find the verification token
  const verificationToken = verificationTokens.find((vt) => vt.token === token)

  if (!verificationToken) {
    return {
      success: false,
      message: "Invalid verification token",
    }
  }

  // Check if token is expired
  if (verificationToken.expiresAt < new Date()) {
    return {
      success: false,
      message: "Verification token has expired",
    }
  }

  // Find the user
  const user = users.find((u) => u.id === verificationToken.userId)

  if (!user) {
    return {
      success: false,
      message: "User not found",
    }
  }

  // Update user verification status
  user.isEmailVerified = true

  // Remove the verification token
  const tokenIndex = verificationTokens.findIndex((vt) => vt.token === token)
  if (tokenIndex !== -1) {
    verificationTokens.splice(tokenIndex, 1)
  }

  // Return success instead of redirecting
  return {
    success: true,
    message: "Email verified successfully",
  }
}
