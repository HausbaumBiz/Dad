// Client-side analytics tracking utilities

const trackingQueue: Array<{ businessId: string; eventType: string; zipCode?: string }> = []
let isProcessing = false

async function processTrackingQueue() {
  if (isProcessing || trackingQueue.length === 0) return

  isProcessing = true

  while (trackingQueue.length > 0) {
    const event = trackingQueue.shift()
    if (!event) continue

    try {
      console.log("📡 Sending analytics event:", event)

      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Failed to track analytics event:", errorText)
      } else {
        const result = await response.json()
        console.log("✅ Analytics tracked successfully:", result)
        console.log(
          `📊 Analytics tracked: ${event.eventType} for business ${event.businessId}${event.zipCode ? ` from zip ${event.zipCode}` : ""}`,
        )
      }
    } catch (error) {
      console.error("❌ Error tracking analytics:", error)
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  isProcessing = false
}

function queueTrackingEvent(businessId: string, eventType: string, zipCode?: string) {
  console.log("📋 Queueing tracking event:", { businessId, eventType, zipCode })
  trackingQueue.push({ businessId, eventType, zipCode })
  processTrackingQueue()
}

// Debounced tracking functions to prevent spam
const trackingDebounce: Record<string, number> = {}

function createDebouncedTracker(eventType: string) {
  return (businessId: string, zipCode?: string) => {
    const key = `${businessId}:${eventType}`
    const now = Date.now()

    // Debounce: only track if last event was more than 1 second ago
    if (trackingDebounce[key] && now - trackingDebounce[key] < 1000) {
      console.log("⏱️ Debounced tracking event:", { businessId, eventType, zipCode })
      return
    }

    trackingDebounce[key] = now
    queueTrackingEvent(businessId, eventType, zipCode)
  }
}

export const trackProfileView = createDebouncedTracker("profile_view")
export const trackPhotoAlbumClick = createDebouncedTracker("photo_album_click")
export const trackCouponClick = createDebouncedTracker("coupon_click")
export const trackJobClick = createDebouncedTracker("job_click")
export const trackPhoneClick = createDebouncedTracker("phone_click")
export const trackWebsiteClick = createDebouncedTracker("website_click")

// Helper function to get current zip code from various sources
export function getCurrentZipCode(): string | undefined {
  // Try to get zip code from URL parameters
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search)
    const zipFromUrl = urlParams.get("zip") || urlParams.get("zipcode") || urlParams.get("location")
    if (zipFromUrl) {
      console.log("🔗 Found zip code from URL:", zipFromUrl)
      return zipFromUrl
    }

    // Try to get from localStorage (if user has searched before)
    const savedZip =
      localStorage.getItem("userZipCode") ||
      localStorage.getItem("searchZipCode") ||
      localStorage.getItem("currentSearchZip")
    if (savedZip) {
      console.log("💾 Found zip code from localStorage:", savedZip)
      return savedZip
    }

    // Try to get from session storage
    const sessionZip = sessionStorage.getItem("currentZipCode")
    if (sessionZip) {
      console.log("🗂️ Found zip code from sessionStorage:", sessionZip)
      return sessionZip
    }
  }

  console.log("❓ No zip code found")
  return undefined
}
