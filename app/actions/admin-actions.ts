"use server"

import { kv } from "@vercel/kv"
import { revalidatePath } from "next/cache"

// Delete a user from the database
export async function deleteUser(userId: string, email: string) {
  try {
    // Delete the user data
    await kv.del(`user:${userId}`)

    // Delete the email index
    await kv.del(`user:email:${email}`)

    // Revalidate the admin users page to reflect the changes
    revalidatePath("/admin/users")

    return { success: true, message: "User deleted successfully" }
  } catch (error) {
    console.error("Error deleting user:", error)
    return {
      success: false,
      message:
        error instanceof Error
          ? `Failed to delete user: ${error.message}`
          : "Failed to delete user due to an unexpected error",
    }
  }
}
