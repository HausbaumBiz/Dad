"use server"

import { kv } from "@/lib/redis"

export interface AnalyticsEvent {
  businessId: string
  eventType: "profile_view" | "photo_album_click" | "coupon_click" | "job_click" | "phone_click" | "website_click"
  timestamp: number
  userAgent?: string
  ipAddress?: string
}

export interface AnalyticsData {
  profileViews: number
  photoAlbumClicks: number
  couponClicks: number
  jobClicks: number
  phoneClicks: number
  websiteClicks: number
}

const ANALYTICS_PREFIX = "analytics:"
const COUNTER_PREFIX = "analytics:counter:"

export async function trackAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  try {
    // Store individual event with expiration (30 days)
    const eventKey = `${ANALYTICS_PREFIX}${event.businessId}:${event.eventType}:${event.timestamp}`
    await kv.setex(eventKey, 30 * 24 * 60 * 60, JSON.stringify(event))

    // Increment counter for this business and event type
    const counterKey = `${COUNTER_PREFIX}${event.businessId}:${event.eventType}`
    await kv.incr(counterKey)

    console.log(`Analytics tracked: ${event.eventType} for business ${event.businessId}`)
  } catch (error) {
    console.error("Error tracking analytics event:", error)
    throw error
  }
}

export async function getBusinessAnalytics(businessId: string): Promise<AnalyticsData> {
  try {
    const [profileViews, photoAlbumClicks, couponClicks, jobClicks, phoneClicks, websiteClicks] = await Promise.all([
      kv.get(`${COUNTER_PREFIX}${businessId}:profile_view`),
      kv.get(`${COUNTER_PREFIX}${businessId}:photo_album_click`),
      kv.get(`${COUNTER_PREFIX}${businessId}:coupon_click`),
      kv.get(`${COUNTER_PREFIX}${businessId}:job_click`),
      kv.get(`${COUNTER_PREFIX}${businessId}:phone_click`),
      kv.get(`${COUNTER_PREFIX}${businessId}:website_click`),
    ])

    return {
      profileViews: Number(profileViews) || 0,
      photoAlbumClicks: Number(photoAlbumClicks) || 0,
      couponClicks: Number(couponClicks) || 0,
      jobClicks: Number(jobClicks) || 0,
      phoneClicks: Number(phoneClicks) || 0,
      websiteClicks: Number(websiteClicks) || 0,
    }
  } catch (error) {
    console.error("Error getting business analytics:", error)
    return {
      profileViews: 0,
      photoAlbumClicks: 0,
      couponClicks: 0,
      jobClicks: 0,
      phoneClicks: 0,
      websiteClicks: 0,
    }
  }
}

export async function getAllBusinessAnalytics(): Promise<Record<string, AnalyticsData>> {
  try {
    // Get all counter keys
    const keys = await kv.keys(`${COUNTER_PREFIX}*`)

    if (!keys || keys.length === 0) {
      return {}
    }

    // Group keys by business ID
    const businessIds = new Set<string>()
    keys.forEach((key) => {
      const parts = key.replace(COUNTER_PREFIX, "").split(":")
      if (parts.length >= 2) {
        businessIds.add(parts[0])
      }
    })

    // Get analytics for each business
    const result: Record<string, AnalyticsData> = {}
    for (const businessId of businessIds) {
      result[businessId] = await getBusinessAnalytics(businessId)
    }

    return result
  } catch (error) {
    console.error("Error getting all business analytics:", error)
    return {}
  }
}

export async function resetBusinessAnalytics(businessId: string): Promise<void> {
  try {
    const eventTypes = [
      "profile_view",
      "photo_album_click",
      "coupon_click",
      "job_click",
      "phone_click",
      "website_click",
    ]

    // Delete all counters for this business
    const counterKeys = eventTypes.map((type) => `${COUNTER_PREFIX}${businessId}:${type}`)
    await Promise.all(counterKeys.map((key) => kv.del(key)))

    // Delete all individual events for this business
    const eventKeys = await kv.keys(`${ANALYTICS_PREFIX}${businessId}:*`)
    if (eventKeys && eventKeys.length > 0) {
      await Promise.all(eventKeys.map((key) => kv.del(key)))
    }

    console.log(`Analytics reset for business ${businessId}`)
  } catch (error) {
    console.error("Error resetting business analytics:", error)
    throw error
  }
}

export async function resetAllAnalytics(): Promise<void> {
  try {
    // Delete all counter keys
    const counterKeys = await kv.keys(`${COUNTER_PREFIX}*`)
    if (counterKeys && counterKeys.length > 0) {
      await Promise.all(counterKeys.map((key) => kv.del(key)))
    }

    // Delete all event keys
    const eventKeys = await kv.keys(`${ANALYTICS_PREFIX}*`)
    if (eventKeys && eventKeys.length > 0) {
      await Promise.all(eventKeys.map((key) => kv.del(key)))
    }

    console.log("All analytics data reset")
  } catch (error) {
    console.error("Error resetting all analytics:", error)
    throw error
  }
}
