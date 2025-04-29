"use server"

import { kv } from "@vercel/kv"
import { getUser } from "@/lib/user"
import { revalidatePath } from "next/cache"

export async function saveAdDesignData(formData: FormData) {
  try {
    const user = await getUser()

    if (!user || !user.id) {
      return { success: false, message: "You must be logged in to save ad design data" }
    }

    const businessName = formData.get("businessName") as string
    const businessPhone = formData.get("businessPhone") as string
    const businessEmail = formData.get("businessEmail") as string
    const businessWebsite = formData.get("businessWebsite") as string
    const businessAddress = formData.get("businessAddress") as string
    const customMessage = formData.get("customMessage") as string

    // Create a key for the user's ad design data
    const key = `user:${user.id}:ad_design`

    // Save the data to Redis
    await kv.hset(key, {
      businessName,
      businessPhone,
      businessEmail,
      businessWebsite,
      businessAddress,
      customMessage,
      updatedAt: new Date().toISOString(),
    })

    revalidatePath("/ad-design/customize")

    return { success: true, message: "Ad design data saved successfully" }
  } catch (error) {
    console.error("Error saving ad design data:", error)
    return { success: false, message: "Failed to save ad design data" }
  }
}

export async function getAdDesignData() {
  try {
    const user = await getUser()

    if (!user || !user.id) {
      return null
    }

    const key = `user:${user.id}:ad_design`
    const data = await kv.hgetall(key)

    return data
  } catch (error) {
    console.error("Error getting ad design data:", error)
    return null
  }
}

// Add this new function to load saved business ad design data
export async function loadBusinessAdDesign(businessId: string) {
  try {
    // const kv = getKv(); // Assuming getKv() is defined elsewhere or not needed
    const key = `business:${businessId}:ad-design`
    const savedDesign = await kv.get(key)
    return savedDesign
  } catch (error) {
    console.error("Error loading business ad design:", error)
    return null
  }
}
