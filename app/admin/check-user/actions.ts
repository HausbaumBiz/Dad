"use server"
import { getUserByEmail, getAllUsers } from "@/lib/user"

export async function checkUserExists(email: string) {
  try {
    console.log(`[checkUserExists] Checking if user exists: ${email}`)

    const user = await getUserByEmail(email)

    if (user) {
      console.log(`[checkUserExists] User found: ${user.email}`)
      return {
        exists: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          zipCode: user.zipCode,
          createdAt: user.createdAt,
          hasPassword: !!user.passwordHash,
        },
      }
    } else {
      console.log(`[checkUserExists] User not found: ${email}`)
      return {
        exists: false,
        user: null,
      }
    }
  } catch (error) {
    console.error(`[checkUserExists] Error checking user: ${email}`, error)
    return {
      exists: false,
      user: null,
      error: "Failed to check user",
    }
  }
}

export async function getAllUserEmails() {
  try {
    console.log("[getAllUserEmails] Getting all user emails")

    const users = await getAllUsers()
    const emails = users.map((user) => user.email).sort()

    console.log(`[getAllUserEmails] Found ${emails.length} users`)

    return {
      success: true,
      emails,
      count: emails.length,
    }
  } catch (error) {
    console.error("[getAllUserEmails] Error getting user emails:", error)
    return {
      success: false,
      emails: [],
      count: 0,
      error: "Failed to get user emails",
    }
  }
}
