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

    // Add user ID to the users set for easier retrieval
    await kv.sadd("users", userId)

    return { success: true, userId, message: "User registered successfully" }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, message: "Failed to create user" }
  }
}

// Get user by ID
export async function getUserById(userId: string) {
  try {
    if (!userId) {
      console.error("getUserById called with empty userId")
      return null
    }

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
    if (!email) {
      console.error("getUserByEmail called with empty email")
      return null
    }

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
    console.log("[verifyCredentials] Starting credential verification for:", email)

    if (!email || !password) {
      console.log("[verifyCredentials] Missing email or password")
      return { success: false, message: "Email and password are required" }
    }

    // Get user by email
    console.log("[verifyCredentials] Looking up user by email")
    const userId = await kv.get<string>(`user:email:${email}`)
    console.log("[verifyCredentials] User ID from email lookup:", userId)

    if (!userId) {
      console.log("[verifyCredentials] No user found for email")
      return { success: false, message: "Invalid email or password" }
    }

    // Ensure userId is a string
    const userIdString = typeof userId === "string" ? userId : String(userId)
    console.log("[verifyCredentials] Getting user data for ID:", userIdString)

    // Get user data
    const user = await getUserById(userIdString)
    console.log("[verifyCredentials] User data retrieved:", user ? "found" : "not found")

    if (!user) {
      console.log("[verifyCredentials] User data not found")
      return { success: false, message: "User not found" }
    }

    // Verify password
    console.log("[verifyCredentials] Verifying password")
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    console.log("[verifyCredentials] Password match:", isMatch)

    if (!isMatch) {
      console.log("[verifyCredentials] Password does not match")
      return { success: false, message: "Invalid email or password" }
    }

    console.log("[verifyCredentials] Credentials verified successfully")
    return { success: true, userId: userIdString, message: "Login successful" }
  } catch (error) {
    console.error("[verifyCredentials] Error verifying credentials:", error)

    // Handle specific error types
    if (error instanceof Error) {
      console.error("[verifyCredentials] Error message:", error.message)
      console.error("[verifyCredentials] Error stack:", error.stack)
    }

    return { success: false, message: "Authentication failed" }
  }
}

// Get all users
export async function getAllUsers() {
  try {
    // First, try to get a list of user IDs from a set (if it exists)
    let userIds: string[] = []

    try {
      // Try to get user IDs from a set first
      const userIdSet = await kv.smembers("users")
      if (userIdSet && Array.isArray(userIdSet) && userIdSet.length > 0) {
        userIds = userIdSet.map((id) => String(id))
      }
    } catch (setError) {
      console.log("No users set found, falling back to keys scan")
    }

    // If no set exists, fall back to scanning keys
    if (userIds.length === 0) {
      try {
        const allKeys = await kv.keys("user:*")
        if (Array.isArray(allKeys)) {
          // Filter out email index keys and extract user IDs
          userIds = allKeys
            .filter((key) => !key.startsWith("user:email:") && key.startsWith("user:"))
            .map((key) => key.replace("user:", ""))
        }
      } catch (keysError) {
        console.error("Error scanning keys:", keysError)
        return []
      }
    }

    // Get all users safely
    const users = []
    for (const userId of userIds) {
      try {
        const user = await kv.get<User>(`user:${userId}`)
        if (user && typeof user === "object" && user.id) {
          // Remove sensitive information
          const { passwordHash, ...safeUser } = user
          users.push(safeUser)
        }
      } catch (userError) {
        console.error(`Error getting user ${userId}:`, userError)
        // Continue with other users
      }
    }

    // Sort by creation date
    return users.sort((a, b) => b.createdAt - a.createdAt)
  } catch (error) {
    console.error("Error getting all users:", error)
    return []
  }
}
