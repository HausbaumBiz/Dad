"use server"

import { kv } from "@/lib/redis"
import { getUserSession } from "./user-actions"

interface FavoriteBusiness {
  id: string
  businessName: string
  displayName?: string
  phone?: string
  email?: string
  address?: string
  zipCode: string
  dateAdded: string
}

// Helper function to safely stringify data
function safeStringify(data: any): string {
  try {
    // Ensure all values are strings or null
    const sanitizedData = {
      id: String(data.id || ""),
      businessName: String(data.businessName || ""),
      displayName: String(data.displayName || ""),
      phone: String(data.phone || ""),
      email: String(data.email || ""),
      address: String(data.address || ""),
      zipCode: String(data.zipCode || ""),
      dateAdded: String(data.dateAdded || new Date().toISOString()),
    }
    return JSON.stringify(sanitizedData)
  } catch (error) {
    console.error("Error stringifying data:", error)
    throw new Error("Failed to serialize business data")
  }
}

// Helper function to safely parse JSON data
function safeParse(data: any): FavoriteBusiness | null {
  try {
    if (typeof data === "string") {
      const parsed = JSON.parse(data)
      return parsed
    } else if (typeof data === "object" && data !== null) {
      return data as FavoriteBusiness
    }
    return null
  } catch (error) {
    console.error("Error parsing favorite data:", error)
    return null
  }
}

export async function addFavoriteBusiness(businessData: {
  id: string
  businessName: string
  displayName?: string
  phone?: string
  email?: string
  address?: string
  zipCode: string
}) {
  try {
    const session = await getUserSession()
    if (!session?.user?.id) {
      return { success: false, message: "You must be logged in to save business cards" }
    }

    const userId = session.user.id

    // Check if business is already in favorites
    const existingFavorite = await kv.get(`user:${userId}:favorite:${businessData.id}`)
    if (existingFavorite) {
      return { success: false, message: "Business card is already saved to your favorites" }
    }

    // Create favorite business object
    const favoriteBusiness: FavoriteBusiness = {
      id: businessData.id,
      businessName: businessData.businessName,
      displayName: businessData.displayName || businessData.businessName,
      phone: businessData.phone || "",
      email: businessData.email || "",
      address: businessData.address || "",
      zipCode: businessData.zipCode,
      dateAdded: new Date().toISOString(),
    }

    // Save individual favorite
    await kv.set(`user:${userId}:favorite:${businessData.id}`, safeStringify(favoriteBusiness))

    // Add to user's favorites set
    await kv.sadd(`user:${userId}:favorites`, businessData.id)

    return {
      success: true,
      message: `${businessData.displayName || businessData.businessName} has been saved to your favorites!`,
    }
  } catch (error) {
    console.error("Error adding favorite business:", error)
    return { success: false, message: "Failed to save business card. Please try again." }
  }
}

export async function removeFavoriteBusiness(businessId: string) {
  try {
    const session = await getUserSession()
    if (!session?.user?.id) {
      return { success: false, message: "You must be logged in to remove business cards" }
    }

    const userId = session.user.id

    // Remove individual favorite
    await kv.del(`user:${userId}:favorite:${businessId}`)

    // Remove from user's favorites set
    await kv.srem(`user:${userId}:favorites`, businessId)

    return { success: true, message: "Business card removed from favorites" }
  } catch (error) {
    console.error("Error removing favorite business:", error)
    return { success: false, message: "Failed to remove business card. Please try again." }
  }
}

export async function getFavoriteBusinesses(): Promise<FavoriteBusiness[]> {
  try {
    const session = await getUserSession()
    if (!session?.user?.id) {
      return []
    }

    const userId = session.user.id

    // Get all favorite business IDs
    const favoriteIds = await kv.smembers(`user:${userId}:favorites`)
    if (!favoriteIds || favoriteIds.length === 0) {
      return []
    }

    // Get all favorite business data
    const favorites: FavoriteBusiness[] = []

    for (const businessId of favoriteIds) {
      try {
        const businessData = await kv.get(`user:${userId}:favorite:${businessId}`)
        if (businessData) {
          const parsed = safeParse(businessData)
          if (parsed) {
            favorites.push(parsed)
          } else {
            console.warn(`Failed to parse favorite data for business ${businessId}`)
            // Clean up corrupted data
            await kv.srem(`user:${userId}:favorites`, businessId)
            await kv.del(`user:${userId}:favorite:${businessId}`)
          }
        } else {
          // Clean up orphaned reference
          await kv.srem(`user:${userId}:favorites`, businessId)
        }
      } catch (error) {
        console.error(`Error parsing favorite data for business ${businessId}:`, error)
        // Clean up corrupted data
        await kv.srem(`user:${userId}:favorites`, businessId)
        await kv.del(`user:${userId}:favorite:${businessId}`)
      }
    }

    // Sort by date added (newest first)
    return favorites.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
  } catch (error) {
    console.error("Error getting favorite businesses:", error)
    return []
  }
}

export async function checkIfBusinessIsFavorite(businessId: string): Promise<boolean> {
  try {
    const session = await getUserSession()
    if (!session?.user?.id) {
      return false
    }

    const userId = session.user.id
    const isFavorite = await kv.sismember(`user:${userId}:favorites`, businessId)
    return Boolean(isFavorite)
  } catch (error) {
    console.error("Error checking if business is favorite:", error)
    return false
  }
}

// Cleanup function to remove corrupted favorites
export async function cleanupCorruptedFavorites() {
  try {
    const session = await getUserSession()
    if (!session?.user?.id) {
      return { success: false, message: "Not authenticated" }
    }

    const userId = session.user.id
    const favoriteIds = await kv.smembers(`user:${userId}:favorites`)

    let cleanedCount = 0

    for (const businessId of favoriteIds) {
      try {
        const businessData = await kv.get(`user:${userId}:favorite:${businessId}`)
        if (!businessData || !safeParse(businessData)) {
          await kv.srem(`user:${userId}:favorites`, businessId)
          await kv.del(`user:${userId}:favorite:${businessId}`)
          cleanedCount++
        }
      } catch (error) {
        await kv.srem(`user:${userId}:favorites`, businessId)
        await kv.del(`user:${userId}:favorite:${businessId}`)
        cleanedCount++
      }
    }

    return { success: true, message: `Cleaned up ${cleanedCount} corrupted favorites` }
  } catch (error) {
    console.error("Error cleaning up corrupted favorites:", error)
    return { success: false, message: "Failed to cleanup favorites" }
  }
}
