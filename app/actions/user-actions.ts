"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createUser, verifyCredentials, getUserById } from "@/lib/user"

export interface LoginResult {
  success: boolean
  message: string
  redirectTo?: string
  isDeactivated?: boolean
}

export interface LogoutResult {
  success: boolean
  message: string
}

export interface RegisterResult {
  success: boolean
  message: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface UserSession {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
}

export async function registerUser(formData: FormData): Promise<RegisterResult> {
  try {
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    const email = formData.get("email") as string
    const zipCode = formData.get("zipCode") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    console.log("[registerUser] Attempting registration for:", email)

    // Validation
    if (!firstName || !lastName || !email || !zipCode || !password || !confirmPassword) {
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

    if (password.length < 6) {
      return {
        success: false,
        message: "Password must be at least 6 characters long",
      }
    }

    // Create user
    const result = await createUser({
      firstName,
      lastName,
      email,
      zipCode,
      password,
    })

    if (!result.success || !result.user) {
      return {
        success: false,
        message: result.message || "Failed to create account",
      }
    }

    console.log("[registerUser] Registration successful for:", email)

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("userId", result.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 1 day
      path: "/",
    })

    return {
      success: true,
      message: "Account created successfully",
      user: {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
      },
    }
  } catch (error) {
    console.error("[registerUser] Error:", error)
    return {
      success: false,
      message: "An error occurred during registration",
    }
  }
}

export async function loginUser(formData: FormData): Promise<LoginResult> {
  try {
    console.log("[loginUser] Starting login process")

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const rememberMe = formData.get("rememberMe") === "on"

    console.log("[loginUser] Email:", email)
    console.log("[loginUser] Remember me:", rememberMe)

    if (!email || !password) {
      console.log("[loginUser] Missing email or password")
      return { success: false, message: "Email and password are required" }
    }

    // Verify credentials - this will check if account is deactivated
    console.log("[loginUser] Calling verifyCredentials")
    const result = await verifyCredentials(email, password)
    console.log("[loginUser] verifyCredentials result:", result)

    if (!result.success) {
      console.log("[loginUser] Login failed:", result.message)

      // Check if this is a deactivation error
      if (result.isDeactivated || result.message.includes("deactivated")) {
        console.log("[loginUser] Account is deactivated - returning deactivation message")
        return {
          success: false,
          message: "Your account has been deactivated by administrators. Contact us if you have any questions.",
          isDeactivated: true,
        }
      }

      return result
    }

    // Set session cookie
    console.log("[loginUser] Setting session cookie for user:", result.userId)
    const cookieStore = await cookies()
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days or 1 day

    cookieStore.set("userId", result.userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAge,
      path: "/",
    })

    console.log("[loginUser] Login successful, preparing redirect")
    return { success: true, message: "Login successful", redirectTo: "/" }
  } catch (error) {
    console.error("[loginUser] Error in loginUser:", error)
    return { success: false, message: "Login failed" }
  }
}

export async function logoutUser(): Promise<LogoutResult> {
  try {
    console.log("[logoutUser] Logging out user")

    const cookieStore = await cookies()
    cookieStore.delete("userId")

    return {
      success: true,
      message: "Logged out successfully",
    }
  } catch (error) {
    console.error("[logoutUser] Error:", error)
    return {
      success: false,
      message: "An error occurred during logout",
    }
  }
}

export async function getUserSession(): Promise<UserSession> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) {
      console.log("[getUserSession] No userId cookie found")
      return { user: null }
    }

    console.log("[getUserSession] Getting user for ID:", userId)

    const user = await getUserById(userId)
    if (!user) {
      console.log("[getUserSession] User not found for ID:", userId)
      return { user: null }
    }

    // Check if user account is deactivated
    if (user.status === "inactive") {
      console.log("[getUserSession] User account is deactivated, clearing session")
      // Clear the session for deactivated users
      cookieStore.delete("userId")
      return { user: null }
    }

    console.log("[getUserSession] User found:", user.firstName, user.lastName)

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    }
  } catch (error) {
    console.error("[getUserSession] Error:", error)
    return { user: null }
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) {
      return null
    }

    const user = await getUserById(userId)

    // Check if user account is deactivated
    if (user && user.status === "inactive") {
      // Clear the session for deactivated users
      cookieStore.delete("userId")
      return null
    }

    return user
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getUserSession()
  if (!session?.user) {
    redirect("/user-login")
  }
  return session
}
