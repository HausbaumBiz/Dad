"use server"

import { deactivateUser, reactivateUser, deleteUser } from "@/lib/user"
import { revalidatePath } from "next/cache"

export async function deactivateUserAction(userId: string) {
  try {
    console.log(`[deactivateUserAction] Deactivating user: ${userId}`)
    const result = await deactivateUser(userId)

    if (result.success) {
      console.log(`[deactivateUserAction] User ${userId} deactivated successfully`)
      revalidatePath("/admin/users")
    } else {
      console.log(`[deactivateUserAction] Failed to deactivate user ${userId}:`, result.message)
    }

    return result
  } catch (error) {
    console.error("Error in deactivateUserAction:", error)
    return { success: false, message: "Failed to deactivate user" }
  }
}

export async function reactivateUserAction(userId: string) {
  try {
    console.log(`[reactivateUserAction] Reactivating user: ${userId}`)
    const result = await reactivateUser(userId)

    if (result.success) {
      console.log(`[reactivateUserAction] User ${userId} reactivated successfully`)
      revalidatePath("/admin/users")
    } else {
      console.log(`[reactivateUserAction] Failed to reactivate user ${userId}:`, result.message)
    }

    return result
  } catch (error) {
    console.error("Error in reactivateUserAction:", error)
    return { success: false, message: "Failed to reactivate user" }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    console.log(`[deleteUserAction] Deleting user: ${userId}`)
    const result = await deleteUser(userId)

    if (result.success) {
      console.log(`[deleteUserAction] User ${userId} deleted successfully`)
      revalidatePath("/admin/users")
    } else {
      console.log(`[deleteUserAction] Failed to delete user ${userId}:`, result.message)
    }

    return result
  } catch (error) {
    console.error("Error in deleteUserAction:", error)
    return { success: false, message: "Failed to delete user" }
  }
}
