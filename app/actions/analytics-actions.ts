"use server"

import { kv } from "@/lib/redis"

export interface AnalyticsEvent {
  businessId: string
  eventType: "profile_view" | "contact_click" | "website_click" | "phone_click"
  zipCode?: string
  timestamp: number
  metadata?: Record<string, any>
}

export interface ZipCodeAnalytics {
  zipCode: string
  count: number
  city?: string
  state?: string
  lastViewed?: number
}

export async function trackAnalyticsEvent(event: AnalyticsEvent) {
  try {
    console.log("📊 Tracking analytics event:", event)

    const { businessId, eventType, zipCode, timestamp, metadata } = event

    // Create unique keys for this business
    const eventsKey = `analytics:${businessId}:events`
    const zipCodesKey = `analytics:${businessId}:zipcodes`

    // Check and fix key types if needed
    await ensureHashKey(eventsKey)
    await ensureHashKey(zipCodesKey)

    // Track general event
    await kv.hincrby(eventsKey, eventType, 1)
    await kv.hincrby(eventsKey, "total_events", 1)

    // Track ZIP code specific data if provided
    if (zipCode && zipCode.length === 5) {
      console.log(`📍 Tracking ZIP code: ${zipCode}`)

      // Increment view count for this ZIP code
      await kv.hincrby(zipCodesKey, zipCode, 1)

      // Store additional ZIP code metadata
      const zipMetaKey = `analytics:${businessId}:zipmeta:${zipCode}`
      const zipMeta = {
        zipCode,
        lastViewed: timestamp,
        city: metadata?.city || "",
        state: metadata?.state || "",
        source: metadata?.source || "unknown",
        testMode: metadata?.testMode || false,
      }

      await kv.set(zipMetaKey, JSON.stringify(zipMeta), { ex: 86400 * 30 }) // 30 days
      console.log(`💾 Stored ZIP metadata for ${zipCode}:`, zipMeta)
    } else if (zipCode) {
      console.warn(`⚠️ Invalid ZIP code format: ${zipCode} (length: ${zipCode.length})`)
    }

    // Store recent event for debugging
    const recentEventsKey = `analytics:${businessId}:recent`
    const recentEvent = {
      eventType,
      zipCode,
      timestamp,
      metadata,
      formattedTime: new Date(timestamp).toISOString(),
    }

    await kv.lpush(recentEventsKey, JSON.stringify(recentEvent))
    await kv.ltrim(recentEventsKey, 0, 99) // Keep last 100 events
    await kv.expire(recentEventsKey, 86400 * 7) // 7 days

    console.log("✅ Analytics event tracked successfully")

    return { success: true, message: "Event tracked successfully" }
  } catch (error) {
    console.error("❌ Error tracking analytics event:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getBusinessZipCodeAnalytics(businessId: string): Promise<ZipCodeAnalytics[]> {
  try {
    console.log(`📈 Getting ZIP code analytics for business: ${businessId}`)

    const zipCodesKey = `analytics:${businessId}:zipcodes`

    // Check if key exists and is the right type
    const keyType = await kv.type(zipCodesKey)
    if (!keyType || keyType === "none") {
      console.log("No zip code data found - key doesn't exist")
      return []
    }

    if (keyType !== "hash") {
      console.warn(`Zip code key ${zipCodesKey} is of type ${keyType}, expected hash`)
      return []
    }

    // Get ZIP codes data
    const zipCodesData = await kv.hgetall(zipCodesKey)
    console.log("ZIP codes data:", zipCodesData)

    if (!zipCodesData || Object.keys(zipCodesData).length === 0) {
      console.log("No zip code data found - empty hash")
      return []
    }

    // Process ZIP codes with metadata
    const zipCodeAnalytics: ZipCodeAnalytics[] = []

    for (const [zipCode, count] of Object.entries(zipCodesData)) {
      if (zipCode && count) {
        const zipMetaKey = `analytics:${businessId}:zipmeta:${zipCode}`
        const zipMetaStr = await kv.get(zipMetaKey)

        let zipMeta = { city: "", state: "", lastViewed: Date.now() }
        if (zipMetaStr) {
          try {
            zipMeta = JSON.parse(zipMetaStr as string)
          } catch (e) {
            console.warn(`Failed to parse ZIP meta for ${zipCode}:`, e)
          }
        }

        zipCodeAnalytics.push({
          zipCode,
          count: Number.parseInt(count.toString()) || 0,
          city: zipMeta.city,
          state: zipMeta.state,
          lastViewed: zipMeta.lastViewed,
        })
      }
    }

    // Sort by count descending
    zipCodeAnalytics.sort((a, b) => b.count - a.count)

    console.log("📊 ZIP code analytics retrieved:", zipCodeAnalytics)
    return zipCodeAnalytics
  } catch (error) {
    console.error("❌ Error getting ZIP code analytics:", error)
    return []
  }
}

export async function getBusinessAnalytics(businessId: string) {
  try {
    console.log(`📈 Getting analytics for business: ${businessId}`)

    const eventsKey = `analytics:${businessId}:events`

    // Get general events data
    const eventsData = await kv.hgetall(eventsKey)
    console.log("Events data:", eventsData)

    // Get ZIP code analytics
    const zipCodeAnalytics = await getBusinessZipCodeAnalytics(businessId)

    const analytics = {
      businessId,
      totalEvents: Number.parseInt(eventsData?.total_events?.toString() || "0"),
      profileViews: Number.parseInt(eventsData?.profile_view?.toString() || "0"),
      contactClicks: Number.parseInt(eventsData?.contact_click?.toString() || "0"),
      websiteClicks: Number.parseInt(eventsData?.website_click?.toString() || "0"),
      phoneClicks: Number.parseInt(eventsData?.phone_click?.toString() || "0"),
      zipCodeAnalytics,
      lastUpdated: Date.now(),
    }

    console.log("📊 Analytics retrieved:", analytics)
    return analytics
  } catch (error) {
    console.error("❌ Error getting business analytics:", error)
    return {
      businessId,
      totalEvents: 0,
      profileViews: 0,
      contactClicks: 0,
      websiteClicks: 0,
      phoneClicks: 0,
      zipCodeAnalytics: [],
      lastUpdated: Date.now(),
    }
  }
}

export async function resetBusinessAnalytics(businessId: string) {
  try {
    console.log(`🗑️ Resetting analytics for business: ${businessId}`)

    const eventsKey = `analytics:${businessId}:events`
    const zipCodesKey = `analytics:${businessId}:zipcodes`
    const recentEventsKey = `analytics:${businessId}:recent`

    // Delete main analytics keys
    await kv.del(eventsKey)
    await kv.del(zipCodesKey)
    await kv.del(recentEventsKey)

    // Find and delete ZIP metadata keys
    const zipMetaPattern = `analytics:${businessId}:zipmeta:*`
    const zipMetaKeys = await kv.keys(zipMetaPattern)

    if (zipMetaKeys.length > 0) {
      await kv.del(...zipMetaKeys)
    }

    console.log("✅ Analytics reset successfully")
    return { success: true, message: "Analytics reset successfully" }
  } catch (error) {
    console.error("❌ Error resetting analytics:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to reset analytics",
    }
  }
}

export async function cleanupAnalyticsKeys(businessId: string) {
  try {
    console.log(`🧹 Cleaning up analytics keys for business: ${businessId}`)

    const eventsKey = `analytics:${businessId}:events`
    const zipCodesKey = `analytics:${businessId}:zipcodes`

    // Check key types and delete if wrong type
    const eventsType = await kv.type(eventsKey)
    const zipCodesType = await kv.type(zipCodesKey)

    console.log(`Key types - events: ${eventsType}, zipcodes: ${zipCodesType}`)

    if (eventsType !== "hash" && eventsType !== "none") {
      console.log(`Deleting wrong type key: ${eventsKey} (${eventsType})`)
      await kv.del(eventsKey)
    }

    if (zipCodesType !== "hash" && zipCodesType !== "none") {
      console.log(`Deleting wrong type key: ${zipCodesKey} (${zipCodesType})`)
      await kv.del(zipCodesKey)
    }

    console.log("✅ Analytics keys cleaned up successfully")
    return { success: true, message: "Analytics keys cleaned up successfully" }
  } catch (error) {
    console.error("❌ Error cleaning up analytics keys:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to cleanup keys",
    }
  }
}

// Helper function to ensure a key is a hash type
async function ensureHashKey(key: string) {
  try {
    const keyType = await kv.type(key)

    if (keyType !== "hash" && keyType !== "none") {
      console.log(`Converting key ${key} from ${keyType} to hash`)
      await kv.del(key)
    }

    // Initialize as hash if it doesn't exist
    if (keyType === "none") {
      await kv.hset(key, "initialized", "1")
      await kv.hdel(key, "initialized")
    }
  } catch (error) {
    console.error(`Error ensuring hash key ${key}:`, error)
    // If we can't check/fix the key, delete it to start fresh
    try {
      await kv.del(key)
    } catch (deleteError) {
      console.error(`Failed to delete problematic key ${key}:`, deleteError)
    }
  }
}

export async function getRecentEvents(businessId: string, limit = 10) {
  try {
    const recentEventsKey = `analytics:${businessId}:recent`
    const events = await kv.lrange(recentEventsKey, 0, limit - 1)

    return events.map((eventStr) => {
      try {
        return JSON.parse(eventStr as string)
      } catch (e) {
        return { error: "Failed to parse event", raw: eventStr }
      }
    })
  } catch (error) {
    console.error("Error getting recent events:", error)
    return []
  }
}

// Debug function to get all analytics data for a business
export async function getDebugAnalytics(businessId: string) {
  try {
    const [analytics, recentEvents] = await Promise.all([
      getBusinessAnalytics(businessId),
      getRecentEvents(businessId, 20),
    ])

    return {
      analytics,
      recentEvents,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error getting debug analytics:", error)
    return {
      analytics: null,
      recentEvents: [],
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    }
  }
}
