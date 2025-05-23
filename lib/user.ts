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

    // Add to user index set
    await kv.sadd("user_ids", userId)

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
    if (!email || !password) {
      return { success: false, message: "Email and password are required" }
    }

    // Get user by email
    const userId = await kv.get<string>(`user:email:${email}`)
    if (!userId) {
      return { success: false, message: "Invalid email or password" }
    }

    // Get user data
    const user = await getUserById(userId)
    if (!user) {
      return { success: false, message: "User not found" }
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return { success: false, message: "Invalid email or password" }
    }

    return { success: true, userId, message: "Login successful" }
  } catch (error) {
    console.error("Error verifying credentials:", error)
    return { success: false, message: "Authentication failed" }
  }
}

// Get all users - FIXED VERSION
export async function getAllUsers() {
  try {
    // Try to get user IDs from the set first (for new users)
    let userIds = (await kv.smembers("user_ids")) as string[]

    // If no user IDs in the set, try the fallback method
    if (!userIds || userIds.length === 0) {
      // Fallback: Scan for keys instead of using KEYS command
      let cursor = 0
      const userIdKeys: string[] = []

      do {
        try {
          // Use SCAN instead of KEYS for better performance
          const [nextCursor, keys] = (await kv.scan(cursor, {
            match: "user:*",
            count: 100,
          })) as [number, string[]]

          cursor = nextCursor

          // Filter out email index keys
          const filteredKeys = keys.filter(
            (key) => key.startsWith("user:") && !key.startsWith("user:email:") && !key.includes("user_ids"),
          )

          userIdKeys.push(...filteredKeys)
        } catch (scanError) {
          console.error("Error scanning keys:", scanError)
          break
        }
      } while (cursor !== 0)

      // Extract user IDs from keys
      userIds = userIdKeys.map((key) => key.replace("user:", ""))
    }

    // Get all users by their IDs
    const users = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const user = await kv.get<User>(`user:${userId}`)
          if (user) {
            // Remove sensitive information
            const { passwordHash, ...safeUser } = user
            return safeUser
          }
        } catch (getUserError) {
          console.error(`Error getting user ${userId}:`, getUserError)
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

// Migration function to add existing users to the set
export async function migrateUsersToSet() {
  try {
    let cursor = 0
    const userIdKeys: string[] = []

    do {
      // Use SCAN instead of KEYS
      const [nextCursor, keys] = (await kv.scan(cursor, {
        match: "user:*",
        count: 100,
      })) as [number, string[]]

      cursor = nextCursor

      // Filter out email index keys
      const filteredKeys = keys.filter(
        (key) => key.startsWith("user:") && !key.startsWith("user:email:") && !key.includes("user_ids"),
      )

      userIdKeys.push(...filteredKeys)
    } while (cursor !== 0)

    // Extract user IDs from keys
    const userIds = userIdKeys.map((key) => key.replace("user:", ""))

    // Add all user IDs to the set
    if (userIds.length > 0) {
      await kv.sadd("user_ids", ...userIds)
      return { success: true, count: userIds.length }
    }

    return { success: true, count: 0 }
  } catch (error) {
    console.error("Error migrating users to set:", error)
    return { success: false, error: String(error) }
  }
}
