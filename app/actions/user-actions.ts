"use server"

import { createUser, getUserById, verifyCredentials } from "@/lib/user"
import { cookies } from "next/headers"

// Register a new user
export async function registerUser(formData: FormData) {
  try {
    console.log("[registerUser] Starting user registration")

    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const zipCode = formData.get("zipCode") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    console.log("[registerUser] Form data extracted for email:", email)

    // Validate form data
    if (!firstName || !lastName || !zipCode || !email || !password || !confirmPassword) {
      console.log("[registerUser] Missing required fields")
      return { success: false, message: "All fields are required" }
    }

    if (password !== confirmPassword) {
      console.log("[registerUser] Passwords do not match")
      return { success: false, message: "Passwords do not match" }
    }

    // Create user in database
    console.log("[registerUser] Creating user in database")
    const result = await createUser({
      firstName,
      lastName,
      email,
      zipCode,
      password,
    })

    console.log("[registerUser] User creation result:", result.success ? "success" : "failed")

    if (result.success && result.userId) {
      // Set a session cookie
      const cookieStore = await cookies()
      cookieStore.set("userId", result.userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
        sameSite: "lax",
      })

      // Set a registration success cookie for the toast
      cookieStore.set("registrationSuccess", "true", {
        maxAge: 60, // 1 minute
        path: "/",
      })

      console.log("[registerUser] Registration successful, cookies set")
      return { success: true, redirectTo: "/" }
    }

    return result
  } catch (error) {
    console.error("[registerUser] Error in registerUser:", error)
    return {
      success: false,
      message: "An unexpected error occurred during registration. Please try again.",
    }
  }
}

// Update the loginUser function to handle the "Remember me" preference
export async function loginUser(formData: FormData) {
  try {
    console.log("[loginUser] Starting user login")

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const rememberMe = formData.get("rememberMe") === "true"

    console.log("[loginUser] Login attempt for email:", email, "Remember me:", rememberMe)

    // Validate form data
    if (!email || !password) {
      console.log("[loginUser] Missing email or password")
      return { success: false, message: "Email and password are required" }
    }

    // Verify credentials
    console.log("[loginUser] Verifying credentials")
    const result = await verifyCredentials(email, password)
    console.log("[loginUser] Credential verification result:", result.success ? "success" : "failed")

    if (result.success && result.userId) {
      // Set cookie expiration based on "Remember me" preference
      const maxAge = rememberMe
        ? 60 * 60 * 24 * 30 // 30 days if "Remember me" is checked
        : 60 * 60 * 24 * 7 // 1 week if not checked

      // Set a session cookie
      const cookieStore = await cookies()
      cookieStore.set("userId", result.userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: maxAge,
        path: "/",
        sameSite: "lax",
      })

      console.log("[loginUser] Login successful, cookie set")
      return { success: true, redirectTo: "/" }
    }

    console.log("[loginUser] Login failed:", result.message)
    return { success: false, message: "Username or password is incorrect. Please try again." }
  } catch (error) {
    console.error("[loginUser] Error in loginUser:", error)
    return {
      success: false,
      message: "An unexpected error occurred during login. Please try again.",
    }
  }
}

// Check if user is logged in
export async function getUserSession() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) {
      return null
    }

    // Get user from database
    const user = await getUserById(userId)
    return { user }
  } catch (error) {
    console.error("Error in getUserSession:", error)
    return null
  }
}

// Logout user
export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("userId")
    return { success: true }
  } catch (error) {
    console.error("Error in logoutUser:", error)
    return { success: false, message: "Failed to logout" }
  }
}
