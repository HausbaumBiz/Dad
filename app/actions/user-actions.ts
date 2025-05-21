"use server"

import { createUser, getUserById, verifyCredentials } from "@/lib/user"
import { cookies } from "next/headers"

// Register a new user
export async function registerUser(formData: FormData) {
  try {
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const zipCode = formData.get("zipCode") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate form data
    if (!firstName || !lastName || !zipCode || !email || !password || !confirmPassword) {
      return { success: false, message: "All fields are required" }
    }

    if (password !== confirmPassword) {
      return { success: false, message: "Passwords do not match" }
    }

    // Create user in database
    const result = await createUser({
      firstName,
      lastName,
      email,
      zipCode,
      password,
    })

    if (result.success && result.userId) {
      // Set a session cookie
      cookies().set("userId", result.userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
        sameSite: "lax", // Add this for better security
      })

      // Set a registration success cookie for the toast
      cookies().set("registrationSuccess", "true", {
        maxAge: 60, // 1 minute
        path: "/",
      })

      // Return success and let the client handle the redirect
      return { success: true, redirectTo: "/" }
    }

    return result
  } catch (error) {
    console.error("Error in registerUser:", error)
    return {
      success: false,
      message: "An unexpected error occurred during registration. Please try again.",
    }
  }
}

// Update the loginUser function to handle the "Remember me" preference
export async function loginUser(formData: FormData) {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const rememberMe = formData.get("rememberMe") === "true"

    // Validate form data
    if (!email || !password) {
      return { success: false, message: "Email and password are required" }
    }

    // Verify credentials
    const result = await verifyCredentials(email, password)

    if (result.success && result.userId) {
      // Set cookie expiration based on "Remember me" preference
      const maxAge = rememberMe
        ? 60 * 60 * 24 * 30 // 30 days if "Remember me" is checked
        : 60 * 60 * 24 * 7 // 1 week if not checked

      // Set a session cookie
      cookies().set("userId", result.userId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: maxAge,
        path: "/",
        sameSite: "lax", // Add this for better security
      })

      // Return success and let the client handle the redirect
      return { success: true, redirectTo: "/" }
    }

    return { success: false, message: "Username or password is incorrect. Please try again." }
  } catch (error) {
    console.error("Error in loginUser:", error)
    return {
      success: false,
      message: "An unexpected error occurred during login. Please try again.",
    }
  }
}

// Check if user is logged in
export async function getUserSession() {
  try {
    const userId = cookies().get("userId")?.value

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
    cookies().delete("userId")
    return { success: true }
  } catch (error) {
    console.error("Error in logoutUser:", error)
    return { success: false, message: "Failed to logout" }
  }
}
