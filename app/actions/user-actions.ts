"use server"

import { cookies } from "next/headers"
import { getUserById, getUserByEmail, createUser } from "@/lib/user"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

export interface LoginResult {
  success: boolean
  message: string
  redirectTo?: string
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
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    console.log("[registerUser] Attempting registration for:", email)

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
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

    // Check if user already exists
    const existingUser = await getUserByEmail(email)
    if (existingUser) {
      return {
        success: false,
        message: "An account with this email already exists",
      }
    }

    // Create user
    const result = await createUser({
      firstName,
      lastName,
      email,
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
    const cookieStore = cookies()
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
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const rememberMe = formData.get("rememberMe") === "on"

    console.log("[loginUser] Attempting login for:", email)

    if (!email || !password) {
      return {
        success: false,
        message: "Email and password are required",
      }
    }

    // Get user by email
    const user = await getUserByEmail(email)
    if (!user) {
      console.log("[loginUser] User not found:", email)
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      console.log("[loginUser] Invalid password for:", email)
      return {
        success: false,
        message: "Invalid email or password",
      }
    }

    console.log("[loginUser] Login successful for:", email)

    // Set session cookie
    const cookieStore = cookies()
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30 days or 1 day

    cookieStore.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAge,
      path: "/",
    })

    return {
      success: true,
      message: "Login successful",
      redirectTo: "/",
    }
  } catch (error) {
    console.error("[loginUser] Error:", error)
    return {
      success: false,
      message: "An error occurred during login",
    }
  }
}

export async function logoutUser(): Promise<LogoutResult> {
  try {
    console.log("[logoutUser] Logging out user")

    const cookieStore = cookies()
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
    const cookieStore = cookies()
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

export async function requireAuth(): Promise<UserSession> {
  const session = await getUserSession()
  if (!session?.user) {
    redirect("/user-login")
  }
  return session
}
