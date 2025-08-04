"use server"

import { deactivateUser, reactivateUser, deleteUser } from "@/lib/user"
import { revalidatePath } from "next/cache"

export async function deactivateUserAction(userId: string) {
  try {
    const result = await deactivateUser(userId)

    if (result.success) {
      revalidatePath("/admin/users")
    }

    return result
  } catch (error) {
    console.error("Error in deactivateUserAction:", error)
    return { success: false, message: "Failed to deactivate user" }
  }
}

export async function reactivateUserAction(userId: string) {
  try {
    const result = await reactivateUser(userId)

    if (result.success) {
      revalidatePath("/admin/users")
    }

    return result
  } catch (error) {
    console.error("Error in reactivateUserAction:", error)
    return { success: false, message: "Failed to reactivate user" }
  }
}

export async function deleteUserAction(userId: string) {
  try {
    const result = await deleteUser(userId)

    if (result.success) {
      revalidatePath("/admin/users")
    }

    return result
  } catch (error) {
    console.error("Error in deleteUserAction:", error)
    return { success: false, message: "Failed to delete user" }
  }
}
