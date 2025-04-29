"use server"

import { kv } from "@vercel/kv"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  zipCode: string
  passwordHash: string
  createdAt: number
}

export interface UserCreateInput {
  firstName: string
  lastName: string
  email: string
  zipCode: string
  password: string
}

// Create a new user
export async function createUser(userData: UserCreateInput) {
  try {
    // Check if user already exists
    const existingUser = await kv.get(`user:email:${userData.email}`)
    if (existingUser) {
      return { success: false, message: "User with this email already exists" }
    }

    // Generate a unique ID
    const userId = uuidv4()

    // Hash the password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(userData.password, salt)

    // Create user object
    const user: User = {
      id: userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      zipCode: userData.zipCode,
      passwordHash,
      createdAt: Date.now(),
    }

    // Store user data
    await kv.set(`user:${userId}`, user)

    // Create email index for lookup
    await kv.set(`user:email:${userData.email}`, userId)

    return { success: true, userId, message: "User registered successfully" }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, message: "Failed to create user" }
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  try {
    const user = await kv.get<User>(`user:${userId}`)
    return user
  } catch (error) {
    console.error("Error getting user by ID:", error)
    return null
  }
}

// Get user by email
export async function getUserByEmail(email: string) {
  try {
    const userId = await kv.get<string>(`user:email:${email}`)
    if (!userId) return null

    return getUserById(userId)
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

// Verify user credentials
export async function verifyCredentials(email: string, password: string) {
  try {
    console.log(`Verifying credentials for email: ${email}`)

    // Get user by email
    const userId = await kv.get<string>(`user:email:${email}`)
    console.log(`User ID lookup result: ${userId || "not found"}`)

    if (!userId) {
      return { success: false, message: "Invalid email or password" }
    }

    // Get user data
    const user = await getUserById(userId)
    console.log(`User data lookup result: ${user ? "found" : "not found"}`)

    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Verify password
    try {
      const isMatch = await bcrypt.compare(password, user.passwordHash)
      console.log(`Password verification result: ${isMatch ? "match" : "no match"}`)

      if (!isMatch) {
        return { success: false, message: "Invalid email or password" }
      }

      return { success: true, userId, message: "Login successful" }
    } catch (bcryptError) {
      console.error("Error comparing passwords:", bcryptError)
      return { success: false, message: "Error verifying password" }
    }
  } catch (error) {
    console.error("Error in verifyCredentials:", error)
    return {
      success: false,
      message:
        error instanceof Error
          ? `Authentication error: ${error.message}`
          : "Authentication failed due to an unexpected error",
    }
  }
}

// Get current user from session
export async function getUser(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie")
    if (!cookieHeader) return null

    // Parse cookies
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((cookie) => {
        const [name, value] = cookie.split("=")
        return [name, decodeURIComponent(value)]
      }),
    )

    // Get user ID from session cookie
    const userId = cookies["userId"]
    if (!userId) return null

    // Get user data
    const user = await getUserById(userId)
    if (!user) return null

    // Return user without sensitive data
    const { passwordHash, ...safeUser } = user
    return safeUser
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}

// Get all users
export async function getAllUsers() {
  try {
    // Get all keys that match the user pattern
    const userKeys = await kv.keys("user:*")

    // Filter out email index keys
    const userIdKeys = userKeys.filter((key) => !key.startsWith("user:email:"))

    // Get all users
    const users = await Promise.all(
      userIdKeys.map(async (key) => {
        const user = await kv.get<User>(key)
        if (user) {
          // Remove sensitive information
          const { passwordHash, ...safeUser } = user
          return safeUser
        }
        return null
      }),
    )

    // Filter out null values and sort by creation date
    return users.filter(Boolean).sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}
